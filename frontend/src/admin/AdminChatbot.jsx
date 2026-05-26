import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";

const AdminChatbot = () => {
    const toast = useToast();
    const [cfg, setCfg] = useState({ welcomeMessage: "", quickReplies: [], rules: [] });
    const [newKw, setNewKw] = useState("");
    const [newAns, setNewAns] = useState("");
    const [newQuick, setNewQuick] = useState("");
    const [savingMsg, setSavingMsg] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const data = await api.get("/chatbot");
            setCfg({
                welcomeMessage: data.welcomeMessage || "",
                quickReplies: data.quickReplies || [],
                rules: data.rules || [],
            });
        } catch (err) {
            toast.show(err.message, "error");
        }
    }, [toast]);

    useEffect(() => { refresh(); }, [refresh]);

    const saveWelcome = async () => {
        setSavingMsg(true);
        try {
            await api.put("/chatbot/config", { welcomeMessage: cfg.welcomeMessage });
            toast.show("Đã lưu lời chào.", "success");
        } catch (err) {
            toast.show(err.message, "error");
        } finally {
            setSavingMsg(false);
        }
    };

    const saveQuickReplies = async (items) => {
        try {
            await api.put("/chatbot/quick-replies", { items });
            setCfg((c) => ({ ...c, quickReplies: items }));
            toast.show("Đã lưu gợi ý nhanh.", "success");
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    const addRule = async () => {
        if (!newKw.trim() || !newAns.trim()) {
            toast.show("Nhập đủ từ khóa và câu trả lời.", "error");
            return;
        }
        try {
            await api.post("/chatbot/rules", { keyword: newKw.trim(), answer: newAns.trim() });
            setNewKw("");
            setNewAns("");
            toast.show("Đã thêm quy tắc.", "success");
            refresh();
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    const removeRule = async (id) => {
        try {
            await api.del(`/chatbot/rules/${id}`);
            refresh();
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    const addQuick = () => {
        if (!newQuick.trim()) return;
        saveQuickReplies([...cfg.quickReplies, newQuick.trim()]);
        setNewQuick("");
    };

    const removeQuick = (i) =>
        saveQuickReplies(cfg.quickReplies.filter((_, idx) => idx !== i));

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Cấu hình Chatbot AI</h1>
                    <p>Quản lý lời chào, gợi ý nhanh và bộ câu trả lời tự động</p>
                </div>
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
                            <button type="button" className="btn-primary btn-sm" onClick={saveWelcome} disabled={savingMsg} style={{ marginTop: 8, alignSelf: "flex-start" }}>
                                <i className="fa-solid fa-floppy-disk"></i> {savingMsg ? "Đang lưu..." : "Lưu lời chào"}
                            </button>
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
                                {cfg.rules.length === 0 ? (
                                    <tr className="empty-row"><td colSpan={3}>Chưa có quy tắc</td></tr>
                                ) : cfg.rules.map((r) => (
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
