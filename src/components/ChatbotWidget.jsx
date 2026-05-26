import { useEffect, useRef, useState } from "react";
import "../styles/Chatbot.css";

const initialMsgs = [
    {
        id: 1,
        role: "bot",
        text: "Xin chào! Tôi là trợ lý ảo của ViQiTech. Bạn cần hỗ trợ gì hôm nay?",
    },
];

const quickReplies = [
    "Tư vấn điện thoại",
    "Tư vấn laptop",
    "Chính sách bảo hành",
    "Phương thức thanh toán",
];

const ChatbotWidget = () => {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState(initialMsgs);
    const [text, setText] = useState("");
    const endRef = useRef(null);

    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [open, msgs.length]);

    const send = (content) => {
        const t = (content ?? text).trim();
        if (!t) return;
        const id = Date.now();
        setMsgs((arr) => [
            ...arr,
            { id, role: "user", text: t },
            {
                id: id + 1,
                role: "bot",
                text: "Cảm ơn bạn! Yêu cầu của bạn đã được tiếp nhận. Tính năng trả lời tự động sẽ sớm hoạt động.",
            },
        ]);
        setText("");
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
                        <div>
                            <strong>Trợ lý ViQiTech</strong>
                            <small>Đang hoạt động</small>
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

                    <div className="chatbot-body">
                        {msgs.map((m) => (
                            <div key={m.id} className={`bubble bubble-${m.role}`}>
                                {m.text}
                            </div>
                        ))}
                        <div ref={endRef} />
                    </div>

                    <div className="chatbot-quick">
                        {quickReplies.map((q) => (
                            <button
                                type="button"
                                key={q}
                                onClick={() => send(q)}
                                className="quick-chip"
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
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <button type="submit" aria-label="Gửi">
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatbotWidget;
