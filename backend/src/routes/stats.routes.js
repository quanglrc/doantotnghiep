import { Router } from "express";
import { query, one } from "../config/db.js";
import { adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

router.get(
    "/dashboard",
    adminOnly,
    asyncH(async (_req, res) => {
        const [
            productCount,
            orderCount,
            customerCount,
            revenueRow,
            pendingRow,
        ] = await Promise.all([
            one("SELECT COUNT(*) AS n FROM products WHERE is_active = 1"),
            one("SELECT COUNT(*) AS n FROM orders"),
            one("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'"),
            one("SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE status = 'completed'"),
            one("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'"),
        ]);

        const recent = await query(
            "SELECT id, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5"
        );

        const catCount = await query(
            `SELECT c.id, c.name, c.icon, COUNT(p.id) AS n
             FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
             GROUP BY c.id ORDER BY c.sort_order`
        );

        res.json({
            products: productCount?.n || 0,
            orders: orderCount?.n || 0,
            pending: pendingRow?.n || 0,
            customers: customerCount?.n || 0,
            revenue: Number(revenueRow?.revenue || 0),
            recentOrders: recent.map((o) => ({
                ...o,
                total: Number(o.total),
                customer: { name: o.customer_name },
            })),
            categoryDistribution: catCount.map((c) => ({ ...c, n: Number(c.n) })),
        });
    })
);

router.get(
    "/revenue",
    adminOnly,
    asyncH(async (req, res) => {
        const year = Number(req.query.year) || new Date().getFullYear();
        const rows = await query(
            `SELECT MONTH(created_at) AS month, COALESCE(SUM(total),0) AS total
             FROM orders WHERE status = 'completed' AND YEAR(created_at) = :year
             GROUP BY MONTH(created_at)`,
            { year }
        );
        const data = Array.from({ length: 12 }, (_, i) => {
            const r = rows.find((x) => Number(x.month) === i + 1);
            return { month: i + 1, total: Number(r?.total || 0) };
        });
        res.json({ year, months: data });
    })
);

router.get(
    "/top-products",
    adminOnly,
    asyncH(async (_req, res) => {
        const rows = await query(
            `SELECT oi.product_id, oi.product_name, SUM(oi.qty) AS qty, SUM(oi.subtotal) AS revenue
             FROM order_items oi JOIN orders o ON o.id = oi.order_id
             WHERE o.status = 'completed'
             GROUP BY oi.product_id, oi.product_name
             ORDER BY qty DESC LIMIT 10`
        );
        res.json(rows.map((r) => ({ ...r, qty: Number(r.qty), revenue: Number(r.revenue) })));
    })
);

export default router;
