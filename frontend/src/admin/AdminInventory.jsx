import { useState, useEffect, useMemo } from "react";
import { useToast } from "../context/ToastContext";
import { useShop } from "../context/ShopContext";
import { api } from "../api/client";

const AdminInventory = () => {
    const { products, refresh } = useShop();
    const toast = useToast();
    
    const [tab, setTab] = useState("kho"); // kho | history | lowStock
    const [logs, setLogs] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [q, setQ] = useState("");
    
    // Modal state
    const [adjusting, setAdjusting] = useState(null); // null or product object
    const [form, setForm] = useState({ type: "import", quantity: "", reason: "" });

    const loadInventoryData = async () => {
        try {
            if (tab === "history") {
                const data = await api.get("/inventory/logs");
                setLogs(data);
            } else if (tab === "lowStock") {
                const data = await api.get("/inventory/low-stock");
                setLowStock(data);
            }
        } catch (err) {
            toast.show("Lỗi tải dữ liệu kho: " + err.message, "error");
        }
    };

    useEffect(() => {
        loadInventoryData();
    }, [tab]);

    // Lọc sản phẩm cho tab Kho Hàng
    const filteredProducts = useMemo(() => {
        let arr = products.slice();
        if (q.trim()) {
            const s = q.toLowerCase();
            arr = arr.filter(p => p.name.toLowerCase().includes(s));
        }
        return arr;
    }, [products, q]);

    const openAdjust = (product) => {
        setAdjusting(product);
        setForm({ type: "import", quantity: "", reason: "" });
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const qty = Number(form.quantity);
        if (!qty || qty <= 0) {
            toast.show("Vui lòng nhập số lượng hợp lệ.", "error");
            return;
        }
        try {
            await api.post("/inventory/adjust", {
                product_id: adjusting.id,
                type: form.type,
                quantity: qty,
                reason: form.reason
            });
            toast.show(`Đã ${form.type === 'import' ? 'nhập' : 'xuất'} kho thành công!`, "success");
            setAdjusting(null);
            // Refresh products globally
            await refresh();
            // Refresh logs/low stock if needed
            if (tab !== "kho") loadInventoryData();
        } catch (err) {
            toast.show("Lỗi: " + err.message, "error");
        }
    };

    const getTypeLabel = (type) => {
        const map = {
            import: { label: "Nhập thủ công", cls: "badge-success" },
            export: { label: "Xuất thủ công", cls: "badge-warning" },
            order: { label: "Đơn hàng", cls: "badge-info" },
            cancel: { label: "Hoàn (Hủy đơn)", cls: "badge-primary" },
            update: { label: "Cập nhật SP", cls: "badge-warning" }
        };
        const m = map[type] || { label: type, cls: "" };
        return <span className={`badge ${m.cls}`}>{m.label}</span>;
    };

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Quản lý Kho hàng</h1>
                    <p>Kiểm soát tồn kho, lịch sử nhập xuất</p>
                </div>
            </div>

            <div className="status-tabs" style={{ marginBottom: "20px" }}>
                <button className={`tab ${tab === "kho" ? "active" : ""}`} onClick={() => setTab("kho")}>
                    <i className="fa-solid fa-boxes-stacked"></i> Kho hàng
                </button>
                <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
                    <i className="fa-solid fa-clock-rotate-left"></i> Lịch sử biến động
                </button>
                <button className={`tab ${tab === "lowStock" ? "active" : ""}`} onClick={() => setTab("lowStock")}>
                    <i className="fa-solid fa-triangle-exclamation"></i> Cảnh báo sắp hết
                </button>
            </div>

            <div className="admin-card">
                {tab === "kho" && (
                    <>
                        <div className="admin-toolbar">
                            <input
                                type="text"
                                className="admin-search"
                                placeholder="Tìm sản phẩm..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <p>Tổng: {filteredProducts.length} sản phẩm</p>
                        </div>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Trạng thái</th>
                                    <th>Tồn kho hiện tại</th>
                                    <th style={{ textAlign: "right" }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                {p.image ? <img src={p.image} alt={p.name} className="admin-thumb" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} /> : <div style={{width:40,height:40,background:"#eee",borderRadius:4}}></div>}
                                                <strong>{p.name}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            {p.is_active ? <span className="badge badge-success">Đang bán</span> : <span className="badge badge-danger">Ngừng bán</span>}
                                        </td>
                                        <td>
                                            <strong style={{ color: p.stock < 10 ? "var(--danger)" : "inherit" }}>
                                                {p.stock}
                                            </strong>
                                        </td>
                                        <td>
                                            <div className="tbl-actions">
                                                <button type="button" className="btn-outline btn-sm" onClick={() => openAdjust(p)}>
                                                    Điều chỉnh
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr className="empty-row"><td colSpan={4}>Không có sản phẩm nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </>
                )}

                {tab === "history" && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Sản phẩm</th>
                                <th>Loại</th>
                                <th>Thay đổi</th>
                                <th>Lý do</th>
                                <th>Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l.id}>
                                    <td>{new Date(l.created_at).toLocaleString("vi-VN")}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            {l.product_image && <img src={l.product_image} alt="" style={{width:30, height:30, objectFit:"cover", borderRadius:4}}/>}
                                            <span>{l.product_name}</span>
                                        </div>
                                    </td>
                                    <td>{getTypeLabel(l.type)}</td>
                                    <td>
                                        <strong style={{ color: l.quantity_change > 0 ? "var(--success, #16a34a)" : "var(--danger, #dc2626)" }}>
                                            {l.quantity_change > 0 ? `+${l.quantity_change}` : l.quantity_change}
                                        </strong>
                                    </td>
                                    <td>{l.reason}</td>
                                    <td>{l.admin_name || "Hệ thống"}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr className="empty-row"><td colSpan={6}>Chưa có lịch sử biến động.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {tab === "lowStock" && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Tồn kho</th>
                                <th style={{ textAlign: "right" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStock.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            {p.image && <img src={p.image} alt={p.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />}
                                            <strong>{p.name}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <strong style={{ color: "var(--danger)" }}>{p.stock}</strong>
                                    </td>
                                    <td>
                                        <div className="tbl-actions">
                                            <button type="button" className="btn-primary btn-sm" onClick={() => openAdjust(p)}>
                                                Nhập thêm
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {lowStock.length === 0 && (
                                <tr className="empty-row"><td colSpan={3}>Không có sản phẩm nào sắp hết hàng.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {adjusting && (
                <div className="modal-backdrop" onClick={() => setAdjusting(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-head">
                            <h3>Điều chỉnh tồn kho</h3>
                            <button type="button" className="modal-close" onClick={() => setAdjusting(null)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form onSubmit={handleAdjustSubmit} className="modal-body">
                            <div style={{ marginBottom: 16, padding: "10px", background: "var(--bg)", borderRadius: "var(--radius)", display: "flex", gap: 10, alignItems: "center" }}>
                                {adjusting.image && <img src={adjusting.image} alt="" style={{width: 50, height: 50, objectFit: "cover", borderRadius: 4}}/>}
                                <div>
                                    <strong>{adjusting.name}</strong>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Tồn kho hiện tại: {adjusting.stock}</div>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <label>Loại điều chỉnh</label>
                                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                    <option value="import">Nhập thêm kho (+)</option>
                                    <option value="export">Xuất giảm kho (-)</option>
                                </select>
                            </div>
                            
                            <div className="form-row">
                                <label>Số lượng *</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={form.quantity} 
                                    onChange={e => setForm({...form, quantity: e.target.value})} 
                                    required 
                                />
                            </div>
                            
                            <div className="form-row">
                                <label>Lý do / Ghi chú</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: Nhập hàng đợt mới, xuất hàng lỗi..." 
                                    value={form.reason} 
                                    onChange={e => setForm({...form, reason: e.target.value})} 
                                />
                            </div>

                            <div className="modal-foot">
                                <button type="button" className="btn-outline" onClick={() => setAdjusting(null)}>Hủy</button>
                                <button type="submit" className="btn-primary">
                                    <i className="fa-solid fa-floppy-disk"></i> Xác nhận
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminInventory;
