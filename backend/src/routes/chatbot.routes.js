import { Router } from "express";
import { query, one } from "../config/db.js";
import { adminOnly } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

// ============================================================
// GET /api/chatbot - cấu hình hiển thị
// ============================================================
router.get(
    "/",
    asyncH(async (_req, res) => {
        const cfg = await one("SELECT welcome_message FROM chatbot_config WHERE id = 1");
        const quickReplies = await query(
            "SELECT id, label FROM chatbot_quick_replies WHERE is_active = 1 ORDER BY sort_order"
        );
        const rules = await query(
            "SELECT id, keyword, answer FROM chatbot_rules WHERE is_active = 1 ORDER BY priority DESC"
        );
        res.json({
            welcomeMessage: cfg?.welcome_message || "Xin chào!",
            quickReplies: quickReplies.map((q) => q.label),
            rules,
            geminiEnabled: !!process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        });
    })
);

// ============================================================
// GET /api/chatbot/status - kiểm tra Gemini hoạt động (debug)
// ============================================================
router.get(
    "/status",
    asyncH(async (_req, res) => {
        const hasKey = !!process.env.GEMINI_API_KEY;
        if (!hasKey) {
            return res.json({
                ok: false,
                geminiEnabled: false,
                message: "Chưa cấu hình GEMINI_API_KEY trong backend/.env",
            });
        }
        try {
            const reply = await callGemini({
                message: "Trả lời 'OK' nếu bạn nhận được tin nhắn này.",
                history: [],
            });
            res.json({
                ok: true,
                geminiEnabled: true,
                model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
                testReply: reply,
            });
        } catch (err) {
            res.status(502).json({
                ok: false,
                geminiEnabled: true,
                error: err.message,
                hint: errorHint(err.message),
            });
        }
    })
);

const errorHint = (msg = "") => {
    const m = msg.toLowerCase();
    if (m.includes("api key not valid") || m.includes("api_key_invalid"))
        return "API key sai hoặc đã bị thu hồi. Tạo key mới tại https://aistudio.google.com/apikey";
    if (m.includes("permission") || m.includes("403"))
        return "API key không có quyền truy cập model này. Thử model khác (gemini-2.5-flash).";
    if (m.includes("quota") || m.includes("rate"))
        return "Đã hết quota miễn phí. Đợi reset hoặc dùng key khác.";
    if (m.includes("econnreset") || m.includes("etimedout") || m.includes("enotfound"))
        return "Không kết nối được tới Gemini. Kiểm tra mạng/firewall, có thể cần VPN tại một số khu vực.";
    if (m.includes("404") || m.includes("not found"))
        return "Tên model không hợp lệ. Đổi GEMINI_MODEL sang gemini-2.5-flash hoặc gemini-1.5-flash.";
    return null;
};

// ============================================================
// POST /api/chatbot/chat - gửi tin nhắn tới Gemini
// ============================================================
router.post(
    "/chat",
    asyncH(async (req, res) => {
        const { message, history = [] } = req.body || {};
        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Thiếu nội dung tin nhắn." });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const msgLower = message.toLowerCase();
        const rules = await query(
            "SELECT keyword, answer FROM chatbot_rules WHERE is_active = 1 ORDER BY priority DESC"
        );
        const ruleMatch = rules.find((r) => msgLower.includes(r.keyword.toLowerCase()));

        console.log(`[chatbot] msg="${message.slice(0, 60)}" geminiKey=${apiKey ? "yes" : "NO"}`);

        // Không có API key → trả rule + nhắc cấu hình
        if (!apiKey) {
            return res.json({
                reply:
                    (ruleMatch?.answer || "Cảm ơn bạn! Bạn có thể liên hệ hotline 1900 1234 hoặc xem chi tiết sản phẩm trên website.") +
                    "\n\n⚠️ Trợ lý AI chưa được kích hoạt. Admin cần thêm GEMINI_API_KEY vào backend/.env để chat thông minh hơn.",
                source: "rules-no-key",
            });
        }

        // Có API key → gọi Gemini
        try {
            const reply = await callGemini({ message, history });
            console.log(`[chatbot] gemini reply: ${reply.slice(0, 80)}...`);
            res.json({ reply, source: "gemini" });
        } catch (err) {
            console.error(`[chatbot] gemini error: ${err.message}`);
            const hint = errorHint(err.message);
            res.json({
                reply:
                    (ruleMatch?.answer || "Xin lỗi, trợ lý AI đang gặp sự cố tạm thời.") +
                    (hint ? `\n\n⚠️ Admin: ${hint}` : `\n\n⚠️ Lỗi: ${err.message}`),
                source: "error",
                error: err.message,
            });
        }
    })
);

const buildSystemPrompt = async () => {
    const [cats, brands, products] = await Promise.all([
        query("SELECT id, name FROM categories WHERE is_active = 1"),
        query("SELECT id, name FROM brands WHERE is_active = 1"),
        query(
            `SELECT id, name, price, old_price, image, category_id, brand_id, sold
             FROM products WHERE is_active = 1
             ORDER BY sold DESC LIMIT 30`
        ),
    ]);

    const fmt = (n) => Number(n).toLocaleString("vi-VN") + "đ";

    return `Bạn là trợ lý tư vấn của ViQiTech - cửa hàng bán điện thoại, laptop, máy tính bảng và phụ kiện công nghệ chính hãng tại Việt Nam.

# Vai trò & cách trả lời
- Xưng "ViQiTech" hoặc "chúng tôi", không xưng "tôi là AI".
- Trả lời bằng văn bản thuần túy (plain text), TUYỆT ĐỐI KHÔNG dùng dấu sao (*) hay các ký tự Markdown (#, \`\`, **) để in đậm, in nghiêng hay tạo tiêu đề.
- Trả lời tiếng Việt, thân thiện, súc tích (có thể dài hơn nếu cần phân tích kỹ thuật).
- ĐẶC BIỆT: Khi khách hỏi về thông số kỹ thuật, tính năng, cấu hình, hoặc so sánh các sản phẩm công nghệ (kể cả những sản phẩm không có trong shop), bạn được phép dùng toàn bộ kiến thức sẵn có của mình để tư vấn chi tiết, chính xác như một chuyên gia.
- TUY NHIÊN, về GIÁ BÁN, tuyệt đối CHỈ được phép lấy từ danh sách sản phẩm dưới đây. Không tự bịa giá.
- Nếu khách hỏi mua sản phẩm không có trong shop, hãy cứ tư vấn thông số bình thường nhưng báo rõ là shop hiện chưa có hàng, và gợi ý sản phẩm tương đương có sẵn trong danh sách.
- Khi cần đặt hàng, hướng dẫn khách xem trên website hoặc gọi 1900 1234.
- Nếu khách hỏi ngoài lĩnh vực (chính trị, tin tức đời sống, làm bài tập...), nhẹ nhàng từ chối và đưa về chủ đề công nghệ.

# QUY TẮC GỢI Ý SẢN PHẨM (RẤT QUAN TRỌNG)
Khi bạn gợi ý hoặc đề cập tới một sản phẩm CỤ THỂ có trong danh sách kho hàng bên dưới, hãy chèn thẻ [PRODUCT:<id>] vào ngay sau đoạn mô tả sản phẩm đó. Trong đó <id> là mã số id của sản phẩm trong danh sách.
Ví dụ: "Với ngân sách của bạn, mình gợi ý iPhone 15 Pro Max 256GB, giá 29.990.000đ, chip A17 Pro rất mạnh mẽ. [PRODUCT:1]"
Lưu ý:
- CHỈ chèn [PRODUCT:<id>] cho các sản phẩm CÓ TRONG danh sách kho hàng bên dưới.
- Có thể chèn nhiều thẻ [PRODUCT:<id>] nếu gợi ý nhiều sản phẩm.
- KHÔNG chèn thẻ cho sản phẩm shop không bán.

# Danh mục đang bán
${cats.map((c) => `- ${c.name}`).join("\n")}

# Thương hiệu
${brands.map((b) => b.name).join(", ")}

# Sản phẩm trong kho (top 30 bán chạy) - MỖI SẢN PHẨM CÓ ID
${products.map((p) => {
        const disc = p.old_price && p.old_price > p.price
            ? ` (đang giảm từ ${fmt(p.old_price)})`
            : "";
        return `- [id=${p.id}] ${p.name}: ${fmt(p.price)}${disc}`;
    }).join("\n")}

# Chính sách
- Bảo hành chính hãng 12-24 tháng tùy sản phẩm.
- Miễn phí giao hàng đơn từ 500.000đ, giao trong 24h.
- Đổi trả miễn phí trong 30 ngày nếu lỗi nhà sản xuất.
- Trả góp 0% qua thẻ tín dụng và các công ty tài chính.
- Hotline: 1900 1234 (8:00 - 22:00 T2-CN).
- Địa chỉ: 123 Nguyễn Văn Cừ, Q.5, TP.HCM.`;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callOneGemini = async ({ model, apiKey, systemPrompt, contents }) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    let resp;
    try {
        resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: {
                    temperature: 0.8,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
                ],
            }),
            signal: controller.signal,
        });
    } catch (err) {
        clearTimeout(timer);
        if (err.name === "AbortError") {
            const e = new Error("Gemini timeout (>30s)");
            e.retryable = true;
            throw e;
        }
        const e = new Error(`Network: ${err.message || err.code || "ECONNRESET"}`);
        e.retryable = true;
        throw e;
    }
    clearTimeout(timer);

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        const errMsg = data?.error?.message || `HTTP ${resp.status} ${resp.statusText}`;
        const e = new Error(errMsg);
        // 429 (rate limit), 503 (overload), 500 (server error) → có thể retry
        e.retryable = [429, 500, 502, 503].includes(resp.status) ||
            /high demand|overload|rate|unavailable/i.test(errMsg);
        e.status = resp.status;
        throw e;
    }

    const cand = data.candidates?.[0];
    if (cand?.finishReason === "SAFETY") {
        throw new Error("Nội dung bị chặn bởi bộ lọc an toàn của Gemini.");
    }
    const text = cand?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error("Gemini không trả về nội dung.");
    }
    return text.trim();
};

const callGemini = async ({ message, history }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    // Fallback models nếu primary bị overload
    const fallbackModels = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
    const modelChain = [primaryModel, ...fallbackModels.filter((m) => m !== primaryModel)];

    const systemPrompt = await buildSystemPrompt();
    const contents = [
        ...history.slice(-10).map((m) => ({
            role: m.role === "bot" ? "model" : "user",
            parts: [{ text: String(m.text || "").slice(0, 2000) }],
        })),
        { role: "user", parts: [{ text: message.slice(0, 2000) }] },
    ];

    let lastErr;
    for (const model of modelChain) {
        // Mỗi model thử tối đa 2 lần (có delay giữa các lần)
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                if (attempt > 0) await sleep(800);
                const text = await callOneGemini({ model, apiKey, systemPrompt, contents });
                if (model !== primaryModel) {
                    console.log(`[chatbot] dùng fallback model: ${model}`);
                }
                return text;
            } catch (err) {
                lastErr = err;
                console.log(`[chatbot] ${model} attempt ${attempt + 1} lỗi: ${err.message.slice(0, 100)}`);
                if (!err.retryable) {
                    // Lỗi không retry được (key sai, content blocked, etc.) - thử model khác luôn
                    break;
                }
            }
        }
    }
    throw lastErr || new Error("Tất cả model Gemini đều thất bại");
};

// ============================================================
// Admin endpoints
// ============================================================
router.put(
    "/config",
    adminOnly,
    asyncH(async (req, res) => {
        const { welcomeMessage } = req.body || {};
        await query(
            "INSERT INTO chatbot_config (id, welcome_message) VALUES (1, :msg) ON DUPLICATE KEY UPDATE welcome_message = :msg",
            { msg: welcomeMessage || "" }
        );
        res.json({ ok: true });
    })
);

router.put(
    "/quick-replies",
    adminOnly,
    asyncH(async (req, res) => {
        const { items } = req.body || {};
        if (!Array.isArray(items)) return res.status(400).json({ error: "Cần items[]." });
        await query("DELETE FROM chatbot_quick_replies");
        for (let i = 0; i < items.length; i++) {
            await query(
                "INSERT INTO chatbot_quick_replies (label, sort_order) VALUES (:label, :order)",
                { label: items[i], order: i }
            );
        }
        res.json({ ok: true });
    })
);

router.post(
    "/rules",
    adminOnly,
    asyncH(async (req, res) => {
        const { keyword, answer, priority } = req.body || {};
        if (!keyword || !answer) return res.status(400).json({ error: "Thiếu keyword hoặc answer." });
        const result = await query(
            "INSERT INTO chatbot_rules (keyword, answer, priority) VALUES (:keyword, :answer, :priority)",
            { keyword, answer, priority: Number(priority) || 0 }
        );
        const r = await one(
            "SELECT id, keyword, answer, priority FROM chatbot_rules WHERE id = :id",
            { id: result.insertId }
        );
        res.status(201).json(r);
    })
);

router.delete(
    "/rules/:id",
    adminOnly,
    asyncH(async (req, res) => {
        await query("DELETE FROM chatbot_rules WHERE id = :id", { id: Number(req.params.id) });
        res.json({ ok: true });
    })
);

export default router;
