import { Router } from "express";
import { query, one } from "../config/db.js";
import { adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

router.get(
    "/",
    asyncH(async (_req, res) => {
        const rows = await query(
            "SELECT id, name, icon, sort_order FROM categories WHERE is_active = 1 ORDER BY sort_order, name"
        );
        res.json(rows);
    })
);

router.post(
    "/",
    adminOnly,
    asyncH(async (req, res) => {
        const { id, name, icon, sort_order } = req.body || {};
        if (!id || !name) return res.status(400).json({ error: "Thiếu id hoặc name." });
        await query(
            "INSERT INTO categories (id, name, icon, sort_order) VALUES (:id, :name, :icon, :sort_order)",
            { id, name, icon: icon || null, sort_order: Number(sort_order) || 0 }
        );
        const c = await one("SELECT id, name, icon, sort_order FROM categories WHERE id = :id", { id });
        res.status(201).json(c);
    })
);

router.put(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        const { name, icon, sort_order, is_active } = req.body || {};
        await query(
            `UPDATE categories SET
                name = COALESCE(:name, name),
                icon = COALESCE(:icon, icon),
                sort_order = COALESCE(:sort_order, sort_order),
                is_active = COALESCE(:is_active, is_active)
             WHERE id = :id`,
            {
                id: req.params.id,
                name: name ?? null,
                icon: icon ?? null,
                sort_order: sort_order != null ? Number(sort_order) : null,
                is_active: is_active != null ? (is_active ? 1 : 0) : null,
            }
        );
        const c = await one("SELECT id, name, icon, sort_order FROM categories WHERE id = :id", { id: req.params.id });
        res.json(c);
    })
);

router.delete(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        await query("DELETE FROM categories WHERE id = :id", { id: req.params.id });
        res.json({ ok: true });
    })
);

export default router;
