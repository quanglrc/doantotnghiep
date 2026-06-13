import { Router } from "express";
import { pool, query, one } from "../config/db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

const genOrderId = async () => {
    const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const row = await one(
        "SELECT COUNT(*) AS n FROM orders WHERE id LIKE :pref",
        { pref: `VQ-${today}-%` }
    );
    return `VQ-${today}-${String((row?.n || 0) + 1).padStart(4, "0")}`;
};

const loadItems = async (orderId) =>
    query(
        "SELECT id, product_id, product_name, product_image, variant_label, color_name, price, qty, subtotal FROM order_items WHERE order_id = :id",
        { id: orderId }
    );

const fmt = async (o) => {
    const items = await loadItems(o.id);
    return {
        ...o,
        subtotal: Number(o.subtotal),
        shipping: Number(o.shipping),
        discount: Number(o.discount),
        total: Number(o.total),
        items: items.map((it) => ({
            ...it,
            price: Number(it.price),
            subtotal: Number(it.subtotal),
            name: it.product_name,
            image: it.product_image,
            id: it.product_id,
        })),
        customer: {
            name: o.customer_name,
            email: o.customer_email,
            phone: o.customer_phone,
            address: o.customer_address,
        },
        date: (o.created_at || "").slice(0, 10),
        userId: o.user_id,
        cancelReason: o.cancel_reason,
    };
};

router.post(
    "/",
    authRequired,
    asyncH(async (req, res) => {
        const { items, subtotal, shipping = 0, discount = 0, total, customer, paymentMethod, note, voucherCode } = req.body || {};
        if (!Array.isArray(items) || items.length === 0)
            return res.status(400).json({ error: "Giỏ hàng trống." });

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const orderId = await genOrderId();
            await conn.execute(
                `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, customer_address,
                                     subtotal, shipping, discount, total, payment_method, note, voucher_code)
                 VALUES (:id, :user_id, :name, :email, :phone, :address, :subtotal, :shipping, :discount, :total, :pm, :note, :voucher)`,
                {
                    id: orderId,
                    user_id: req.user.id,
                    name: customer?.name || req.user.name,
                    email: customer?.email || null,
                    phone: customer?.phone || null,
                    address: customer?.address || null,
                    subtotal: Number(subtotal) || 0,
                    shipping: Number(shipping) || 0,
                    discount: Number(discount) || 0,
                    total: Number(total) || 0,
                    pm: paymentMethod || "cod",
                    note: note || null,
                    voucher: voucherCode || null,
                }
            );
            for (const it of items) {
                const qty = Number(it.qty) || 1;
                const productId = Number.isInteger(it.id) ? it.id : null;
                await conn.execute(
                    `INSERT INTO order_items (order_id, product_id, product_name, product_image, variant_label, color_name, price, qty, subtotal)
                     VALUES (:order_id, :product_id, :product_name, :product_image, :variant_label, :color_name, :price, :qty, :subtotal)`,
                    {
                        order_id: orderId,
                        product_id: productId,
                        product_name: it.name,
                        product_image: it.image || null,
                        variant_label: it.variant_label || null,
                        color_name: it.color_name || null,
                        price: Number(it.price) || 0,
                        qty: qty,
                        subtotal: (Number(it.price) || 0) * qty,
                    }
                );
                
                // No stock deduction here - will deduct when status becomes completed
            }
            await conn.commit();
            const o = await one("SELECT * FROM orders WHERE id = :id", { id: orderId });
            res.status(201).json(await fmt(o));
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    })
);

router.get(
    "/me",
    authRequired,
    asyncH(async (req, res) => {
        const rows = await query(
            "SELECT * FROM orders WHERE user_id = :id ORDER BY created_at DESC",
            { id: req.user.id }
        );
        res.json(await Promise.all(rows.map(fmt)));
    })
);

router.get(
    "/",
    adminOnly,
    asyncH(async (req, res) => {
        const { status, q } = req.query;
        const where = ["1=1"];
        const params = {};
        if (status) { where.push("status = :status"); params.status = status; }
        if (q) {
            where.push("(id LIKE :q OR customer_name LIKE :q OR customer_email LIKE :q)");
            params.q = `%${q}%`;
        }
        const rows = await query(
            `SELECT * FROM orders WHERE ${where.join(" AND ")} ORDER BY created_at DESC`,
            params
        );
        res.json(await Promise.all(rows.map(fmt)));
    })
);

router.get(
    "/:id",
    authRequired,
    asyncH(async (req, res) => {
        const o = await one("SELECT * FROM orders WHERE id = :id", { id: req.params.id });
        if (!o) return res.status(404).json({ error: "Không tìm thấy đơn." });
        if (req.user.role !== "admin" && o.user_id !== req.user.id) {
            return res.status(403).json({ error: "Không có quyền." });
        }
        res.json(await fmt(o));
    })
);

router.patch(
    "/:id/status",
    adminOnly,
    asyncH(async (req, res) => {
        const { status } = req.body || {};
        const allowed = ["pending", "confirmed", "shipping", "completed", "cancelled"];
        if (!allowed.includes(status)) return res.status(400).json({ error: "Trạng thái không hợp lệ." });
        const o = await one("SELECT * FROM orders WHERE id = :id", { id: req.params.id });
        const oldStatus = o.status;
        await query("UPDATE orders SET status = :status WHERE id = :id", { status, id: req.params.id });
        
        if (status === "completed" && oldStatus !== "completed") {
            const items = await query("SELECT product_id, qty FROM order_items WHERE order_id = :id AND product_id IS NOT NULL", { id: req.params.id });
            for (const it of items) {
                await query("UPDATE products SET stock = GREATEST(0, stock - :qty) WHERE id = :pid", { qty: it.qty, pid: it.product_id });
                await query(`INSERT INTO inventory_log (product_id, type, quantity_change, reason, created_by) VALUES (:pid, 'order', :qc, :reason, :uid)`, {
                    pid: it.product_id, qc: -it.qty, reason: `Xuất kho do đơn hàng ${req.params.id} hoàn thành`, uid: req.user.id
                });
            }
        } else if (oldStatus === "completed" && status !== "completed") {
            const items = await query("SELECT product_id, qty FROM order_items WHERE order_id = :id AND product_id IS NOT NULL", { id: req.params.id });
            for (const it of items) {
                await query("UPDATE products SET stock = stock + :qty WHERE id = :pid", { qty: it.qty, pid: it.product_id });
                await query(`INSERT INTO inventory_log (product_id, type, quantity_change, reason, created_by) VALUES (:pid, 'cancel', :qc, :reason, :uid)`, {
                    pid: it.product_id, qc: it.qty, reason: `Hoàn kho do đơn hàng ${req.params.id} chuyển từ hoàn thành sang ${status}`, uid: req.user.id
                });
            }
        }
        
        const updated = await one("SELECT * FROM orders WHERE id = :id", { id: req.params.id });
        res.json(await fmt(updated));
    })
);

router.patch(
    "/:id/cancel",
    authRequired,
    asyncH(async (req, res) => {
        const o = await one("SELECT * FROM orders WHERE id = :id", { id: req.params.id });
        if (!o) return res.status(404).json({ error: "Không tìm thấy đơn." });
        if (req.user.role !== "admin" && o.user_id !== req.user.id) {
            return res.status(403).json({ error: "Không có quyền." });
        }
        // Chỉ cho hủy khi đơn còn ở trạng thái "Chờ xác nhận".
        // Sau khi admin đã xác nhận thì khách không được hủy nữa.
        if (o.status !== "pending") {
            const reasons = {
                confirmed: "Đơn đã được xác nhận, không thể hủy. Liên hệ hotline 1900 1234 để được hỗ trợ.",
                shipping: "Đơn đang được giao, không thể hủy.",
                completed: "Đơn đã hoàn thành.",
                cancelled: "Đơn đã bị hủy trước đó.",
            };
            return res.status(400).json({
                error: reasons[o.status] || "Đơn không thể hủy ở trạng thái hiện tại.",
            });
        }
        const reason = req.body?.reason || "Khách hủy đơn";
        await query(
            "UPDATE orders SET status = 'cancelled', cancel_reason = :reason WHERE id = :id",
            { reason, id: req.params.id }
        );
        
        // No stock restoration here, because stock is only deducted when completed.
        // A pending order hasn't deducted stock yet.
        
        const updated = await one("SELECT * FROM orders WHERE id = :id", { id: req.params.id });
        res.json(await fmt(updated));
    })
);

router.patch(
    "/:id/payment-method",
    authRequired,
    asyncH(async (req, res) => {
        const o = await one("SELECT * FROM orders WHERE id = :id", { id: req.params.id });
        if (!o) return res.status(404).json({ error: "Không tìm thấy đơn." });
        if (req.user.role !== "admin" && o.user_id !== req.user.id) {
            return res.status(403).json({ error: "Không có quyền." });
        }
        if (o.status !== "pending") {
            return res.status(400).json({ error: "Chỉ đơn hàng chờ xác nhận mới có thể đổi phương thức thanh toán." });
        }
        
        const { paymentMethod } = req.body || {};
        if (!["cod", "bank", "card", "momo", "zalopay", "vnpay"].includes(paymentMethod)) {
            return res.status(400).json({ error: "Phương thức thanh toán không hợp lệ." });
        }

        await query("UPDATE orders SET payment_method = :pm WHERE id = :id", { pm: paymentMethod, id: req.params.id });
        const updated = await one("SELECT * FROM orders WHERE id = :id", { id: req.params.id });
        res.json(await fmt(updated));
    })
);

export default router;
