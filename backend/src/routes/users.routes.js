import { Router } from "express";
import bcrypt from "bcryptjs";
import { query, one } from "../config/db.js";
import { adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

router.get(
    "/",
    adminOnly,
    asyncH(async (req, res) => {
        const rows = await query(
            "SELECT id, name, email, phone, address, role, locked, created_at FROM users ORDER BY created_at DESC"
        );
        res.json(rows);
    })
);

router.post(
    "/",
    adminOnly,
    asyncH(async (req, res) => {
        const { name, email, phone, address, password, role } = req.body || {};
        if (!name || !email || !password) return res.status(400).json({ error: "Thiếu trường bắt buộc." });
        const existing = await one("SELECT id FROM users WHERE email = :email", { email });
        if (existing) return res.status(409).json({ error: "Email đã tồn tại." });
        const hash = await bcrypt.hash(password, 10);
        const result = await query(
            "INSERT INTO users (name, email, phone, address, password_hash, role) VALUES (:name, :email, :phone, :address, :hash, :role)",
            {
                name, email,
                phone: phone || null, address: address || null,
                hash, role: role === "admin" ? "admin" : "customer",
            }
        );
        const u = await one(
            "SELECT id, name, email, phone, address, role, locked, created_at FROM users WHERE id = :id",
            { id: result.insertId }
        );
        res.status(201).json(u);
    })
);

router.put(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        const id = Number(req.params.id);
        const { name, email, phone, address, role, password } = req.body || {};
        await query(
            `UPDATE users SET
                name = COALESCE(:name, name),
                email = COALESCE(:email, email),
                phone = COALESCE(:phone, phone),
                address = COALESCE(:address, address),
                role = COALESCE(:role, role)
             WHERE id = :id`,
            {
                id,
                name: name ?? null,
                email: email ?? null,
                phone: phone ?? null,
                address: address ?? null,
                role: role ?? null,
            }
        );
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await query("UPDATE users SET password_hash = :hash WHERE id = :id", { hash, id });
        }
        const u = await one(
            "SELECT id, name, email, phone, address, role, locked, created_at FROM users WHERE id = :id",
            { id }
        );
        res.json(u);
    })
);

router.patch(
    "/:id/lock",
    adminOnly,
    asyncH(async (req, res) => {
        const id = Number(req.params.id);
        if (id === req.user.id) return res.status(400).json({ error: "Không thể khóa chính mình." });
        await query("UPDATE users SET locked = NOT locked WHERE id = :id", { id });
        const u = await one("SELECT id, locked FROM users WHERE id = :id", { id });
        res.json(u);
    })
);

router.delete(
    "/:id",
    adminOnly,
    asyncH(async (req, res) => {
        const id = Number(req.params.id);
        if (id === req.user.id) return res.status(400).json({ error: "Không thể xóa chính mình." });
        await query("DELETE FROM users WHERE id = :id", { id });
        res.json({ ok: true });
    })
);

export default router;
