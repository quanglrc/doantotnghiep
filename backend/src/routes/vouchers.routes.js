import { Router } from "express";
import { query, one } from "../config/db.js";
import { adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

const fmtVoucher = (v) => v && ({
    ...v,
    discount_value: Number(v.discount_value),
    min_order: Number(v.min_order),
    max_discount: v.max_discount != null ? Number(v.max_discount) : null,
    is_active: !!v.is_active,
    used_count: Number(v.used_count) || 0,
});

// ============================================================
// GET /api/vouchers - list
//   ?active=1: chỉ vouchers còn hiệu lực (public)
//   không có: tất cả (admin)
// ============================================================
router.get(
    "/",
    asyncH(async (req, res) => {
        const onlyActive = req.query.active === "1";
        let sql = "SELECT * FROM vouchers";
        const where = [];
        if (onlyActive) {
            where.push("is_active = 1");
            where.push("(start_at IS NULL OR start_at <= NOW())");
            where.push("(end_at IS NULL OR end_at >= NOW())");
            where.push("(max_uses IS NULL OR used_count < max_uses)");
        }
        if (where.length) sql += " WHERE " + where.join(" AND ");
        sql += " ORDER BY created_at DESC";

        // Admin endpoints khác đã có middleware auth riêng. Ở đây cho phép public với active=1.
        if (!onlyActive) {
            if (!req.user || req.user.role !== "admin") {
                return res.status(403).json({ error: "Chỉ admin được xem toàn bộ voucher." });
            }
        }
        const rows = await query(sql);
        res.json(rows.map(fmtVoucher));
    })
);

// ============================================================
// POST /api/vouchers/validate - kiểm tra mã + tính giảm giá
// Body: { code, subtotal }
// ============================================================
router.post(
    "/validate",
    asyncH(async (req, res) => {
        const { code, subtotal } = req.body || {};
        if (!code || subtotal == null) {
            return res.status(400).json({ ok: false, error: "Thiếu code hoặc subtotal." });
        }
        const v = await one(
            "SELECT * FROM vouchers WHERE UPPER(code) = UPPER(:code)",
            { code: code.trim() }
        );
        if (!v) return res.status(404).json({ ok: false, error: "Mã voucher không tồn tại." });
        if (!v.is_active) return res.status(400).json({ ok: false, error: "Voucher đã bị tạm dừng." });

        const now = new Date();
        if (v.start_at && new Date(v.start_at) > now) {
            return res.status(400).json({ ok: false, error: "Voucher chưa bắt đầu." });
        }
        if (v.end_at && new Date(v.end_at) < now) {
            return res.status(400).json({ ok: false, error: "Voucher đã hết hạn." });
        }
        if (v.max_uses != null && v.used_count >= v.max_uses) {
            return res.status(400).json({ ok: false, error: "Voucher đã hết lượt sử dụng." });
        }
        const sub = Number(subtotal);
        if (sub < Number(v.min_order)) {
            return res.status(400).json({
                ok: false,
                error: `Đơn hàng tối thiểu ${Number(v.min_order).toLocaleString("vi-VN")}đ.`,
            });
        }

        // Tính discount
        let discount = 0;
        const dv = Number(v.discount_value);
        if (v.discount_type === "amount" || v.discount_type === "freeship") {
            discount = dv;
        } else if (v.discount_type === "percent") {
            discount = Math.round((sub * dv) / 100);
            if (v.max_discount != null) discount = Math.min(discount, Number(v.max_discount));
        }
        discount = Math.min(discount, sub);

        res.json({ ok: true, voucher: fmtVoucher(v), discount });
    })
);

// ============================================================
// Admin CRUD
// ============================================================
router.post(
    "/",
    adminOnly,
    asyncH(async (req, res) => {
        const {
            code, label, description, discount_type, discount_value,
            min_order, max_discount, max_uses, start_at, end_at, is_active,
        } = req.body || {};

        if (!code || !label || !discount_type) {
            return res.status(400).json({ error: "Thiếu code, label hoặc discount_type." });
        }
        const upperCode = code.trim().toUpperCase();
        const existing = await one("SELECT id FROM vouchers WHERE code = :code", { code: upperCode });
        if (existing) return res.status(409).json({ error: "Mã đã tồn tại." });

        const result = await query(
            `INSERT INTO vouchers
             (code, label, description, discount_type, discount_value, min_order, max_discount, max_uses, start_at, end_at, is_active)
             VALUES (:code, :label, :description, :discount_type, :discount_value, :min_order, :max_discount, :max_uses, :start_at, :end_at, :is_active)`,
            {
                code: upperCode,
                label,
                description: description || null,
                discount_type,
                discount_value: Number(discount_value) || 0,
                min_order: Number(min_order) || 0,
                max_discount: max_discount != null && max_discount !== "" ? Number(max_discount) : null,
                max_uses: max_uses != null && max_uses !== "" ? Number(max_uses) : null,
                start_at: start_at || null,
                end_at: end_at || null,
                is_active: is_active === false ? 0 : 1,
            }
        );
        const v = await one("SELECT * FROM vouchers WHERE id = :id", { id: result.insertId });
        res.status(201).json(fmtVoucher(v));
    })
);

router.put(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        const id = Number(req.params.id);
        const {
            code, label, description, discount_type, discount_value,
            min_order, max_discount, max_uses, start_at, end_at, is_active,
        } = req.body || {};
        await query(
            `UPDATE vouchers SET
                code = COALESCE(:code, code),
                label = COALESCE(:label, label),
                description = :description,
                discount_type = COALESCE(:discount_type, discount_type),
                discount_value = COALESCE(:discount_value, discount_value),
                min_order = COALESCE(:min_order, min_order),
                max_discount = :max_discount,
                max_uses = :max_uses,
                start_at = :start_at,
                end_at = :end_at,
                is_active = COALESCE(:is_active, is_active)
             WHERE id = :id`,
            {
                id,
                code: code ? code.trim().toUpperCase() : null,
                label: label ?? null,
                description: description ?? null,
                discount_type: discount_type ?? null,
                discount_value: discount_value != null ? Number(discount_value) : null,
                min_order: min_order != null ? Number(min_order) : null,
                max_discount: max_discount != null && max_discount !== "" ? Number(max_discount) : null,
                max_uses: max_uses != null && max_uses !== "" ? Number(max_uses) : null,
                start_at: start_at || null,
                end_at: end_at || null,
                is_active: is_active != null ? (is_active ? 1 : 0) : null,
            }
        );
        const v = await one("SELECT * FROM vouchers WHERE id = :id", { id });
        res.json(fmtVoucher(v));
    })
);

router.delete(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        await query("DELETE FROM vouchers WHERE id = :id", { id: Number(req.params.id) });
        res.json({ ok: true });
    })
);

router.patch(
    "/:id/toggle",
    adminOnly,
    asyncH(async (req, res) => {
        await query("UPDATE vouchers SET is_active = NOT is_active WHERE id = :id", {
            id: Number(req.params.id),
        });
        const v = await one("SELECT * FROM vouchers WHERE id = :id", { id: Number(req.params.id) });
        res.json(fmtVoucher(v));
    })
);

export default router;
