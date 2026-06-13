import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useShop } from "../context/ShopContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../data/products";
import "../styles/Chatbot.css";

const DEFAULT_QUICK = [
    "Tư vấn điện thoại",
    "Tư vấn laptop",
    "Chính sách bảo hành",
    "Phương thức thanh toán",
];

const DEFAULT_WELCOME =
    "Xin chào! Tôi là trợ lý ảo của ViQiTech. Bạn cần hỗ trợ gì hôm nay?";

let msgIdCounter = 0;

/* ---- Component thẻ sản phẩm nhỏ gọn trong chat ---- */
const ChatProductCard = ({ productId }) => {
    const { getProduct } = useShop();
    const { addItem } = useCart();
    const toast = useToast();
    const navigate = useNavigate();

    const product = getProduct(productId);
    if (!product) return null;

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addItem(product);
        toast.show(`Đã thêm "${product.name}" vào giỏ hàng!`, "success");
    };

    const handleGoToDetail = () => {
        navigate(`/san-pham/${product.id}`);
    };

    return (
        <div className="chat-product-card" onClick={handleGoToDetail}>
            <div className="cpc-image">
                {product.image ? (
                    <img src={product.image} alt={product.name} />
                ) : (
                    <div className="cpc-placeholder">
                        <i className="fa-solid fa-box-open"></i>
                    </div>
                )}
            </div>
            <div className="cpc-info">
                <div className="cpc-name">{product.name}</div>
                <div className="cpc-price">
                    Giá: {formatPrice(product.price)}
                    {product.old_price && product.old_price > product.price && (
                        <span className="cpc-old-price">{formatPrice(product.old_price)}</span>
                    )}
                </div>
            </div>
            <button
                type="button"
                className="cpc-add-btn"
                onClick={handleAddToCart}
                title="Thêm vào giỏ hàng"
            >
                <i className="fa-solid fa-cart-plus"></i> Thêm vào giỏ
            </button>
        </div>
    );
};

/* ---- Phân tích tin nhắn bot: tách text và [PRODUCT:id] ---- */
const parseBotMessage = (text) => {
    const parts = [];
    const regex = /\[PRODUCT:(\d+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Phần text trước thẻ product
        if (match.index > lastIndex) {
            parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
        }
        parts.push({ type: "product", productId: match[1] });
        lastIndex = match.index + match[0].length;
    }
    // Phần text còn lại sau thẻ product cuối cùng
    if (lastIndex < text.length) {
        parts.push({ type: "text", content: text.slice(lastIndex) });
    }
    return parts;
};

/* ---- Render nội dung 1 bubble bot ---- */
const BotBubbleContent = ({ text }) => {
    const parts = parseBotMessage(text);

    return (
        <>
            {parts.map((part, i) => {
                if (part.type === "product") {
                    return <ChatProductCard key={i} productId={part.productId} />;
                }
                // Render text thường, giữ ngắt dòng
                return part.content.split("\n").map((line, j) => (
                    <div key={`${i}-${j}`}>{line || <>&nbsp;</>}</div>
                ));
            })}
        </>
    );
};

const ChatbotWidget = () => {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState([
        { id: ++msgIdCounter, role: "bot", text: DEFAULT_WELCOME },
    ]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK);
    const [geminiEnabled, setGeminiEnabled] = useState(false);
    const [modelName, setModelName] = useState("");
    const endRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        api.get("/chatbot")
            .then((cfg) => {
                if (cfg.welcomeMessage) {
                    setMsgs([{ id: ++msgIdCounter, role: "bot", text: cfg.welcomeMessage }]);
                }
                if (Array.isArray(cfg.quickReplies) && cfg.quickReplies.length > 0) {
                    setQuickReplies(cfg.quickReplies);
                }
                setGeminiEnabled(!!cfg.geminiEnabled);
                setModelName(cfg.model || "");
            })
            .catch(() => { /* dùng default */ });
    }, []);

    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [open, msgs.length, sending]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100);
    }, [open]);

    const send = useCallback(
        async (content) => {
            const t = (content ?? text).trim();
            if (!t || sending) return;

            const userMsgId = ++msgIdCounter;
            setMsgs((arr) => [...arr, { id: userMsgId, role: "user", text: t }]);
            setText("");
            setSending(true);

            const history = msgs.map((m) => ({ role: m.role, text: m.text }));

            try {
                const { reply, source } = await api.post(
                    "/chatbot/chat",
                    { message: t, history },
                    { auth: false }
                );
                setMsgs((arr) => [
                    ...arr,
                    {
                        id: ++msgIdCounter,
                        role: "bot",
                        text: reply,
                        source, // "gemini" | "rules-no-key" | "error"
                    },
                ]);
            } catch (err) {
                setMsgs((arr) => [
                    ...arr,
                    {
                        id: ++msgIdCounter,
                        role: "bot",
                        text: "Xin lỗi, tôi không kết nối được. Bạn thử lại sau hoặc gọi hotline 1900 1234 nhé.",
                        error: true,
                    },
                ]);
                console.error(err);
            } finally {
                setSending(false);
            }
        },
        [text, msgs, sending]
    );

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <>
            <button
                type="button"
                className={`chatbot-fab ${open ? "open" : ""}`}
                onClick={() => setOpen((v) => !v)}
                aria-label="Mở trợ lý ảo"
            >
                <i className={`fa-solid ${open ? "fa-xmark" : "fa-comment-dots"}`}></i>
            </button>

            {open && (
                <div className="chatbot-panel" role="dialog" aria-label="Trợ lý ảo">
                    <div className="chatbot-head">
                        <div className="bot-avatar">
                            <i className="fa-solid fa-robot"></i>
                        </div>
                        <div className="bot-head-info">
                            <strong>Trợ lý ViQiTech</strong>
                            <small className={geminiEnabled ? "live" : "offline"}>
                                {geminiEnabled
                                    ? `AI ${modelName ? `(${modelName})` : ""} - đang hoạt động`
                                    : "Đang dùng kịch bản"}
                            </small>
                        </div>
                        <button
                            type="button"
                            className="chatbot-close"
                            onClick={() => setOpen(false)}
                            aria-label="Đóng"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {!geminiEnabled && (
                        <div className="chatbot-warning">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>
                                Chatbot AI chưa được kích hoạt. Admin cần thêm{" "}
                                <code>GEMINI_API_KEY</code> vào <code>backend/.env</code> rồi restart server.
                            </span>
                        </div>
                    )}

                    <div className="chatbot-body">
                        {msgs.map((m) => (
                            <div
                                key={m.id}
                                className={`bubble bubble-${m.role}${m.error ? " bubble-error" : ""}`}
                            >
                                {m.role === "bot" ? (
                                    <BotBubbleContent text={m.text} />
                                ) : (
                                    m.text.split("\n").map((line, i) => (
                                        <div key={i}>{line || <>&nbsp;</>}</div>
                                    ))
                                )}
                                {m.source === "error" && (
                                    <div className="bubble-source">
                                        <i className="fa-solid fa-triangle-exclamation"></i> Gemini đang lỗi
                                    </div>
                                )}
                            </div>
                        ))}
                        {sending && (
                            <div className="bubble bubble-bot bubble-typing">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    <div className="chatbot-quick">
                        {quickReplies.map((q) => (
                            <button
                                type="button"
                                key={q}
                                onClick={() => send(q)}
                                className="quick-chip"
                                disabled={sending}
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    <form
                        className="chatbot-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            send();
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={sending ? "Đang trả lời..." : "Nhập tin nhắn..."}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={onKeyDown}
                            disabled={sending}
                        />
                        <button type="submit" aria-label="Gửi" disabled={sending || !text.trim()}>
                            <i className={`fa-solid ${sending ? "fa-spinner fa-spin" : "fa-paper-plane"}`}></i>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatbotWidget;
