import nodemailer from "nodemailer";

let transporter = null;
let transporterReady = false;

const getConfig = () => ({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true cho port 465, false cho 587 (STARTTLS)
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.SMTP_FROM_NAME || "ViQiTech",
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
});

export const isMailerConfigured = () => {
    const c = getConfig();
    return !!(c.host && c.user && c.pass);
};

const initTransporter = () => {
    if (transporter) return transporter;
    const c = getConfig();
    if (!isMailerConfigured()) return null;

    transporter = nodemailer.createTransport({
        host: c.host,
        port: c.port,
        secure: c.secure,
        auth: { user: c.user, pass: c.pass },
    });

    // Verify (không block, chạy ngầm)
    transporter
        .verify()
        .then(() => {
            transporterReady = true;
            console.log(`[mailer] ✓ SMTP sẵn sàng: ${c.host}:${c.port}`);
        })
        .catch((err) => {
            console.error(`[mailer] ✗ SMTP lỗi: ${err.message}`);
        });

    return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
    const t = initTransporter();
    if (!t) {
        throw new Error("SMTP chưa được cấu hình. Đặt SMTP_HOST, SMTP_USER, SMTP_PASS trong .env.");
    }
    const c = getConfig();
    const info = await t.sendMail({
        from: `"${c.fromName}" <${c.fromEmail}>`,
        to,
        subject,
        html,
        text: text || stripHtml(html),
    });
    console.log(`[mailer] Đã gửi → ${to} | id=${info.messageId}`);
    return info;
};

const stripHtml = (html) =>
    String(html || "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();

// ============================================================
// Template: Email đặt lại mật khẩu
// ============================================================
export const passwordResetEmail = ({ name, resetLink, expiresIn = "1 giờ" }) => {
    const subject = "[ViQiTech] Yêu cầu đặt lại mật khẩu";
    const html = `<!doctype html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
<table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <tr>
        <td style="background:linear-gradient(135deg,#1e6fff 0%,#1457d4 100%);padding:30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Vi<span style="color:#ffb300;">Qi</span>TECH
            </h1>
            <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">
                Điện thoại · Laptop · Máy tính bảng chính hãng
            </div>
        </td>
    </tr>
    <tr>
        <td style="padding:40px 36px 30px;">
            <h2 style="color:#1a1a1a;margin:0 0 14px;font-size:22px;font-weight:700;">
                🔐 Yêu cầu đặt lại mật khẩu
            </h2>
            <p style="color:#374151;line-height:1.6;font-size:15px;margin:0 0 16px;">
                Xin chào <strong>${escapeHtml(name || "bạn")}</strong>,
            </p>
            <p style="color:#374151;line-height:1.6;font-size:15px;margin:0 0 28px;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ViQiTech của bạn.
                Bấm vào nút bên dưới để tạo mật khẩu mới. Link có hiệu lực trong <strong>${expiresIn}</strong>.
            </p>
            <div style="text-align:center;margin:30px 0;">
                <a href="${escapeAttr(resetLink)}"
                   style="background:#1e6fff;color:#fff !important;padding:14px 42px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(30,111,255,0.3);">
                    Đặt lại mật khẩu
                </a>
            </div>
            <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:24px 0 0;">
                Hoặc copy link sau vào trình duyệt:<br>
                <a href="${escapeAttr(resetLink)}" style="color:#1e6fff;word-break:break-all;font-size:12px;font-family:monospace;">
                    ${escapeHtml(resetLink)}
                </a>
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">
            <div style="background:#fff8e1;border-left:4px solid #ffb300;padding:14px 18px;border-radius:6px;">
                <strong style="color:#6b5b00;font-size:13px;">⚠️ Lưu ý bảo mật:</strong>
                <p style="color:#6b5b00;font-size:13px;line-height:1.5;margin:6px 0 0;">
                    Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — mật khẩu của bạn sẽ không bị thay đổi.
                    Không chia sẻ link này cho bất kỳ ai.
                </p>
            </div>
        </td>
    </tr>
    <tr>
        <td style="background:#f9fafb;padding:24px 30px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#6b7280;font-size:12px;line-height:1.5;margin:0 0 8px;">
                © ${new Date().getFullYear()} ViQiTech. All rights reserved.
            </p>
            <p style="color:#9ca3af;font-size:11px;margin:0;">
                Hotline: <a href="tel:19001234" style="color:#1e6fff;text-decoration:none;">1900 1234</a>
                · Email: <a href="mailto:support@viqitech.vn" style="color:#1e6fff;text-decoration:none;">support@viqitech.vn</a>
            </p>
            <p style="color:#9ca3af;font-size:11px;margin:6px 0 0;">
                123 Nguyễn Văn Cừ, Quận 5, TP.HCM
            </p>
        </td>
    </tr>
</table>
</body></html>`;
    const text = `ViQiTech - Đặt lại mật khẩu

Xin chào ${name || "bạn"},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
Bấm link sau để đặt mật khẩu mới (có hiệu lực ${expiresIn}):

${resetLink}

Nếu bạn không yêu cầu, hãy bỏ qua email này.

—
ViQiTech | Hotline 1900 1234`;
    return { subject, html, text };
};

const escapeHtml = (s) =>
    String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const escapeAttr = (s) => escapeHtml(s).replace(/`/g, "&#096;");
