import jwt from "jsonwebtoken";
import { one } from "../config/db.js";

const SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export const signToken = (payload) =>
    jwt.sign(payload, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

export const verifyToken = (token) => jwt.verify(token, SECRET);

export const authOptional = async (req, _res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) return next();
        const token = header.slice(7).trim();
        const payload = verifyToken(token);
        const user = await one("SELECT id, name, email, role, locked FROM users WHERE id = :id", { id: payload.id });
        if (user && !user.locked) req.user = user;
    } catch {
        /* ignore */
    }
    next();
};

export const authRequired = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Bạn cần đăng nhập." });
    next();
};

export const adminOnly = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Bạn cần đăng nhập." });
    if (req.user.role !== "admin") return res.status(403).json({ error: "Chỉ admin được phép." });
    next();
};
