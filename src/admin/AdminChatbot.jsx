import { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";

const KEY = "viqitech_chatbot_v1";

const defaultConfig = {
    welcomeMessage: "Xin chào! Tôi là trợ lý ảo của ViQiTech. Bạn cần hỗ trợ gì hôm nay?",
    quickReplies: [
        "Tư vấn điện thoại",
        "Tư vấn laptop",
        "Chính sách bảo hành",
        "Phương thức thanh toán",
    ],
    rules: [
        { id: 1, keyword: "iphone", answer: "Bạn có thể xem các mẫu iPhone mới nhất tại danh mục Điện thoại." },
        { id: 2, keyword: "macbook", answer: "MacBook Pro M3 và Air M3 đang được ưu đãi tới 6 triệu, trả góp 0%." },
        { id: 3, keyword: "bảo hành", answer: "ViQiTech bảo hành chính hãng từ 12-24 tháng tùy sản phẩm." },
        { id: 4, keyword: "thanh toán", answer: "Hỗ trợ: tiền mặt, chuyển khoản, thẻ tín dụng, trả góp 0%." },
    ],
};

const load = () => {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : defaultConfig;
    } catch {
        return defaultConfig;
    }
};

const AdminChatbot = () => {
    const [cfg, setCfg] = useState(load);
    const [newKw, setNewKw] = useState("");
    const [newAns, setNewAns] = useState("");
    const [newQuick, setNewQuick] = useState("");
    const toast = useToast();

    useEffect(() => {
        localStorage.setItem(KEY, JSON.stringify(cfg));
    }, [cfg]);

    const addRule = () => {
        if (!newKw.trim() || !newAns.trim()) {
            toast.show("Nhập đủ từ khóa và câu trả lời.", "error");
            return;
        }
        setCfg((c) => ({
            ...c,
            rules: [...c.rules, { id: Date.now(), keyword: newKw.trim(), answer: newAns.trim() }],
        }));
        setNewKw("");
        setNewAns("");
        toast.show("Đã thêm quy tắc.", "success");
    };

    const removeRule = (id) =>
        setCfg((c) => ({ ...c, rules: c.rules.filter((r) => r.id !== id) }));

    const addQuick = () => {
        if (!newQuick.trim()) return;
        setCfg((c) => ({ ...c, quickReplies: [...c.quickReplies, newQuick.trim()] }));
        setNewQuick("");
    };

    const removeQuick = (i) =>
        setCfg((c) => ({ ...c, quickReplies: c.quickReplies.filter((_, idx) => idx !== i) }));

    const resetDefault = () => {
        if (window.confirm("Khôi phục cấu hình mặc định?")) {
            setCfg(defaultConfig);
            toast.show("Đã khôi phục mặc định.", "info");
        }
    };

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Cấu hình Chatbot AI</h1>
                    <p>Quản lý lời chào, gợi ý nhanh và bộ câu trả lời tự động</p>
                </div>
                <button type="button" className="btn-outline" onClick={resetDefault}>
                    <i className="fa-solid fa-arrow-rotate-left"></i> Mặc định
                </button>
            </div>

            <div className="admin-grid-2">
                <div className="admin-card">
                    <div className="admin-toolbar"><h3 style={{ margin: 0, fontSize: 16 }}>Lời chào & gợi ý nhanh</h3></div>
                    <div style={{ padding: 16 }}>
                        <div className="form-row" style={{ marginBottom: 14 }}>
                            <label>Tin nhắn chào</label>
                            <textarea
                                rows={3}
                                value={cfg.welcomeMessage}
                                onChange={(e) => setCfg({ ...cfg, welcomeMessage: e.target.value })}
                            />
                        </div>
                        <div className="form-row">
                            <label>Gợi ý nhanh</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                                {cfg.quickReplies.map((q, i) => (
                                    <span key={i} className="quick-chip" style={{ cursor: "default" }}>
                                        {q}
                                        <button
                                            type="button"
                                            onClick={() => removeQuick(i)}
                                            style={{ marginLeft: 6, color: "var(--danger)", background: "none" }}
                                        >×</button>
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <input
                                    type="text"
                                    placeholder="Thêm gợi ý mới..."
                                    value={newQuick}
                                    onChange={(e) => setNewQuick(e.target.value)}
                                    className="admin-search"
                                />
                                <button type="button" className="btn-primary btn-sm" onClick={addQuick}>
                                    <i className="fa-solid fa-plus"></i> Thêm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-toolbar"><h3 style={{ margin: 0, fontSize: 16 }}>Bộ quy tắc trả lời</h3></div>
                    <div style={{ padding: 16 }}>
                        <p className="muted" style={{ marginTop: 0 }}>
                            Khi tin nhắn khách hàng chứa từ khóa, chatbot sẽ trả lời tương ứng.
                        </p>
                        <table className="admin-table">
                            <thead>
                                <tr><th>Từ khóa</th><th>Câu trả lời</th><th></th></tr>
                            </thead>
                            <tbody>
                                {cfg.rules.map((r) => (
                                    <tr key={r.id}>
                                        <td><code>{r.keyword}</code></td>
                                        <td>{r.answer}</td>
                                        <td>
                                            <button type="button" className="icon-btn danger" onClick={() => removeRule(r.id)}>
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                            <input
                                type="text"
                                placeholder="Từ khóa (vd: iphone, bảo hành)"
                                value={newKw}
                                onChange={(e) => setNewKw(e.target.value)}
                                className="admin-search"
                            />
                            <textarea
                                placeholder="Câu trả lời..."
                                rows={2}
                                value={newAns}
                                onChange={(e) => setNewAns(e.target.value)}
                                style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "inherit", fontSize: 14 }}
                            />
                            <button type="button" className="btn-primary" onClick={addRule}>
                                <i className="fa-solid fa-plus"></i> Thêm quy tắc
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminChatbot;
