import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { query, one } from "../config/db.js";
import { signToken, authRequired } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import { sendMail, isMailerConfigured, passwordResetEmail } from "../utils/mailer.js";

const router = Router();

router.post(
    "/register",
    asyncH(async (req, res) => {
        const { name, email, phone, password } = req.body || {};
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Thiếu họ tên, email hoặc mật khẩu." });
        }
        const existing = await one("SELECT id FROM users WHERE email = :email", { email });
        if (existing) return res.status(409).json({ error: "Email đã tồn tại." });

        const hash = await bcrypt.hash(password, 10);
        const result = await query(
            "INSERT INTO users (name, email, phone, password_hash, role) VALUES (:name, :email, :phone, :hash, 'customer')",
            { name, email, phone: phone || null, hash }
        );
        const user = await one(
            "SELECT id, name, email, phone, address, role, locked, created_at FROM users WHERE id = :id",
            { id: result.insertId }
        );
        const token = signToken({ id: user.id });
        res.status(201).json({ user, token });
    })
);

router.post(
    "/login",
    asyncH(async (req, res) => {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: "Thiếu email hoặc mật khẩu." });
        }
        const u = await one("SELECT * FROM users WHERE email = :email", { email });
        if (!u) return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
        if (u.locked) return res.status(403).json({ error: "Tài khoản đã bị khóa." });
        const ok = await bcrypt.compare(password, u.password_hash);
        if (!ok) return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });

        const { password_hash, ...user } = u;
        const token = signToken({ id: user.id });
        res.json({ user, token });
    })
);

router.get(
    "/me",
    authRequired,
    asyncH(async (req, res) => {
        const u = await one(
            "SELECT id, name, email, phone, address, role, locked, created_at FROM users WHERE id = :id",
            { id: req.user.id }
        );
        res.json(u);
    })
);

router.put(
    "/me",
    authRequired,
    asyncH(async (req, res) => {
        const { name, phone, address } = req.body || {};
        await query(
            "UPDATE users SET name = COALESCE(:name, name), phone = COALESCE(:phone, phone), address = COALESCE(:address, address) WHERE id = :id",
            { name: name ?? null, phone: phone ?? null, address: address ?? null, id: req.user.id }
        );
        const u = await one(
            "SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = :id",
            { id: req.user.id }
        );
        res.json(u);
    })
);

router.put(
    "/me/password",
    authRequired,
    asyncH(async (req, res) => {
        const { oldPassword, newPassword } = req.body || {};
        if (!newPassword) return res.status(400).json({ error: "Thiếu mật khẩu mới." });
        const u = await one("SELECT password_hash FROM users WHERE id = :id", { id: req.user.id });
        if (!u) return res.status(404).json({ error: "Không tìm thấy user." });
        const ok = await bcrypt.compare(oldPassword || "", u.password_hash);
        if (!ok) return res.status(401).json({ error: "Mật khẩu cũ không đúng." });
        const hash = await bcrypt.hash(newPassword, 10);
        await query("UPDATE users SET password_hash = :hash WHERE id = :id", { hash, id: req.user.id });
        res.json({ ok: true });
    })
);

// ============================================================
// QUÊN MẬT KHẨU
// ============================================================

// Bước 1: Yêu cầu reset - tạo token, lưu DB, trả link
// (Trong production sẽ gửi link qua email; demo trả thẳng cho frontend hiển thị)
router.post(
    "/forgot-password",
    asyncH(async (req, res) => {
        const { email } = req.body || {};
        if (!email) return res.status(400).json({ error: "Thiếu email." });

        const u = await one("SELECT id, name, email, locked FROM users WHERE email = :email", { email });

        // Để bảo mật: luôn trả ok=true dù email không tồn tại (chống enumeration)
        // Nhưng vì demo, ta cũng trả lại token để hiển thị
        if (!u) {
            return res.json({
                ok: true,
                message: "Nếu email tồn tại, link đặt lại đã được gửi.",
                // Demo only: không tìm thấy nên không có link
                demo: { found: false },
            });
        }
        if (u.locked) {
            return res.status(403).json({ error: "Tài khoản đã bị khóa, không thể đặt lại mật khẩu." });
        }

        // Tạo token an toàn (64 ký tự hex)
        const token = crypto.randomBytes(32).toString("hex");

        // Lưu token mới — dùng MySQL NOW() để khớp timezone server (tránh bug UTC/local mismatch).
        // KHÔNG vô hiệu hoá token cũ → cho phép nhiều link cùng tồn tại đến khi hết hạn/dùng.
        await query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at)
             VALUES (:uid, :token, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
            { uid: u.id, token }
        );

        // Link cho frontend (ưu tiên PUBLIC_URL, fallback CORS_ORIGIN, fallback localhost)
        const frontendOrigin =
            process.env.PUBLIC_URL ||
            (process.env.CORS_ORIGIN || "http://localhost:5173").split(",")[0];
        const resetLink = `${frontendOrigin}/dat-lai-mat-khau?token=${token}`;

        console.log(`[auth] Reset password cho ${email}: ${resetLink}`);

        const mailerOn = isMailerConfigured();
        let emailSent = false;
        let emailError = null;

        if (mailerOn) {
            try {
                const tpl = passwordResetEmail({
                    name: u.name,
                    resetLink,
                    expiresIn: "1 giờ",
                });
                await sendMail({ to: u.email, ...tpl });
                emailSent = true;
            } catch (err) {
                emailError = err.message;
                console.error(`[auth] Gửi email thất bại: ${err.message}`);
            }
        }

        const response = {
            ok: true,
            emailSent,
            message: emailSent
                ? `Link đặt lại đã được gửi tới ${u.email}. Hãy kiểm tra hộp thư (kể cả thư rác).`
                : "Link đặt lại mật khẩu đã được tạo.",
        };

        // Nếu chưa cấu hình mailer hoặc gửi email lỗi → trả link demo để dev test
        if (!mailerOn || emailError) {
            response.demo = {
                found: true,
                resetLink,
                expiresIn: "1 giờ",
                mailerStatus: !mailerOn ? "not_configured" : "send_failed",
                emailError,
            };
        }

        res.json(response);
    })
);

// Bước 2: Verify token + đặt mật khẩu mới
router.post(
    "/reset-password",
    asyncH(async (req, res) => {
        const { token, newPassword } = req.body || {};
        if (!token || !newPassword) {
            return res.status(400).json({ error: "Thiếu token hoặc mật khẩu mới." });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Mật khẩu mới cần ít nhất 6 ký tự." });
        }

        // So sánh thời gian trực tiếp trong SQL (NOW() của MySQL) để tránh bug timezone JS
        const t = await one(
            `SELECT prt.*, u.email, u.name,
                    (prt.expires_at < NOW()) AS is_expired
             FROM password_reset_tokens prt
             JOIN users u ON u.id = prt.user_id
             WHERE prt.token = :token`,
            { token }
        );

        if (!t) return res.status(400).json({ error: "Token không hợp lệ." });
        if (t.used) return res.status(400).json({ error: "Token đã được sử dụng." });
        if (t.is_expired) {
            return res.status(400).json({ error: "Token đã hết hạn." });
        }

        // Cập nhật mật khẩu + đánh dấu token đã dùng (transaction)
        const hash = await bcrypt.hash(newPassword, 10);
        await query("UPDATE users SET password_hash = :hash WHERE id = :uid", {
            hash, uid: t.user_id,
        });
        await query("UPDATE password_reset_tokens SET used = TRUE WHERE id = :id", { id: t.id });

        res.json({
            ok: true,
            message: "Đã đặt lại mật khẩu thành công.",
            email: t.email,
        });
    })
);

// Verify token (dùng khi mở trang reset để check token trước)
router.get(
    "/reset-password/verify",
    asyncH(async (req, res) => {
        const { token } = req.query;
        if (!token) return res.status(400).json({ ok: false, error: "Thiếu token." });

        // So sánh thời gian trực tiếp trong SQL (NOW() của MySQL) để tránh bug timezone JS
        const t = await one(
            `SELECT prt.used, u.email,
                    (prt.expires_at < NOW()) AS is_expired
             FROM password_reset_tokens prt
             JOIN users u ON u.id = prt.user_id
             WHERE prt.token = :token`,
            { token }
        );

        if (!t) return res.json({ ok: false, error: "Token không hợp lệ." });
        if (t.used) return res.json({ ok: false, error: "Token đã được sử dụng." });
        if (t.is_expired) {
            return res.json({ ok: false, error: "Token đã hết hạn." });
        }
        res.json({ ok: true, email: t.email });
    })
);

export default router;
