import { Router } from "express";
import { query, one } from "../config/db.js";
import { adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

router.get(
    "/",
    asyncH(async (_req, res) => {
        const rows = await query("SELECT id, name, logo FROM brands WHERE is_active = 1 ORDER BY name");
        res.json(rows);
    })
);

router.post(
    "/",
    adminOnly,
    asyncH(async (req, res) => {
        const { id, name, logo } = req.body || {};
        if (!id || !name) return res.status(400).json({ error: "Thiếu id hoặc name." });
        await query("INSERT INTO brands (id, name, logo) VALUES (:id, :name, :logo)", {
            id, name, logo: logo || null,
        });
        const b = await one("SELECT id, name, logo FROM brands WHERE id = :id", { id });
        res.status(201).json(b);
    })
);

router.put(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        const { name, logo, is_active } = req.body || {};
        await query(
            `UPDATE brands SET
                name = COALESCE(:name, name),
                logo = COALESCE(:logo, logo),
                is_active = COALESCE(:is_active, is_active)
             WHERE id = :id`,
            {
                id: req.params.id,
                name: name ?? null,
                logo: logo ?? null,
                is_active: is_active != null ? (is_active ? 1 : 0) : null,
            }
        );
        const b = await one("SELECT id, name, logo FROM brands WHERE id = :id", { id: req.params.id });
        res.json(b);
    })
);

router.delete(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        await query("DELETE FROM brands WHERE id = :id", { id: req.params.id });
        res.json({ ok: true });
    })
);

export default router;
