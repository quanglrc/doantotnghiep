import { Router } from "express";
import { query, one } from "../config/db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

router.get(
    "/",
    asyncH(async (req, res) => {
        const { product_id } = req.query;
        const where = ["is_approved = 1"];
        const params = {};
        if (product_id) {
            where.push("r.product_id = :pid");
            params.pid = Number(product_id);
        }
        const rows = await query(
            `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at,
                    u.name AS user_name
             FROM reviews r
             JOIN users u ON u.id = r.user_id
             WHERE ${where.join(" AND ")}
             ORDER BY r.created_at DESC`,
            params
        );
        res.json(
            rows.map((r) => ({
                id: r.id,
                productId: r.product_id,
                userId: r.user_id,
                userName: r.user_name,
                rating: r.rating,
                comment: r.comment,
                date: (r.created_at || "").slice(0, 10),
            }))
        );
    })
);

router.post(
    "/",
    authRequired,
    asyncH(async (req, res) => {
        const { productId, rating, comment } = req.body || {};
        if (!productId || !rating) return res.status(400).json({ error: "Thiếu productId hoặc rating." });
        // Phải có đơn completed chứa product này
        const ok = await one(
            `SELECT 1 FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE o.user_id = :uid AND o.status = 'completed' AND oi.product_id = :pid
             LIMIT 1`,
            { uid: req.user.id, pid: Number(productId) }
        );
        if (!ok) return res.status(403).json({ error: "Bạn cần mua sản phẩm trước khi đánh giá." });

        const result = await query(
            "INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (:pid, :uid, :rating, :comment)",
            { pid: Number(productId), uid: req.user.id, rating: Number(rating), comment: comment || null }
        );
        const r = await one(
            `SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = :id`,
            { id: result.insertId }
        );
        res.status(201).json({
            id: r.id, productId: r.product_id, userId: r.user_id, userName: r.user_name,
            rating: r.rating, comment: r.comment, date: (r.created_at || "").slice(0, 10),
        });
    })
);

router.delete(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        await query("DELETE FROM reviews WHERE id = :id", { id: Number(req.params.id) });
        res.json({ ok: true });
    })
);

export default router;
