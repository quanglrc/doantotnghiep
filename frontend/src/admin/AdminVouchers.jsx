import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../data/products";

const DISCOUNT_TYPES = [
    { id: "amount", label: "Giảm số tiền cố định", suffix: "đ" },
    { id: "percent", label: "Giảm theo phần trăm", suffix: "%" },
    { id: "freeship", label: "Miễn phí vận chuyển", suffix: "đ" },
];

const emptyForm = {
    id: null,
    code: "",
    label: "",
    description: "",
    discount_type: "amount",
    discount_value: "",
    min_order: "",
    max_discount: "",
    max_uses: "",
    start_at: "",
    end_at: "",
    is_active: true,
};

const toDatetimeLocal = (s) => {
    if (!s) return "";
    // s may be "2026-12-31 23:59:59" or ISO. datetime-local expects "YYYY-MM-DDTHH:mm"
    const d = new Date(s.replace(" ", "T"));
    if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocal = (s) => (s ? s.replace("T", " ") + ":00" : null);

const AdminVouchers = () => {
    const toast = useToast();
    const [list, setList] = useState([]);
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get("/vouchers");
            setList(data);
        } catch (err) {
            toast.show(err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { refresh(); }, [refresh]);

    const filtered = useMemo(() => {
        let arr = list.slice();
        if (filter === "active") arr = arr.filter((v) => v.is_active);
        if (filter === "inactive") arr = arr.filter((v) => !v.is_active);
        if (filter === "expired") {
            const now = Date.now();
            arr = arr.filter((v) => v.end_at && new Date(v.end_at).getTime() < now);
        }
        if (q.trim()) {
            const s = q.toLowerCase();
            arr = arr.filter((v) =>
                v.code.toLowerCase().includes(s) || v.label.toLowerCase().includes(s)
            );
        }
        return arr;
    }, [list, q, filter]);

    const openCreate = () => setEditing({ ...emptyForm });
    const openEdit = (v) => setEditing({
        ...v,
        start_at: toDatetimeLocal(v.start_at),
        end_at: toDatetimeLocal(v.end_at),
        max_discount: v.max_discount ?? "",
        max_uses: v.max_uses ?? "",
        description: v.description ?? "",
    });

    const onSave = async (e) => {
        e.preventDefault();
        if (!editing.code.trim() || !editing.label.trim()) {
            toast.show("Vui lòng nhập code và tên voucher.", "error");
            return;
        }
        if (editing.discount_type === "percent" && Number(editing.discount_value) > 100) {
            toast.show("Phần trăm giảm không quá 100%.", "error");
            return;
        }
        const payload = {
            code: editing.code.trim().toUpperCase(),
            label: editing.label.trim(),
            description: editing.description || null,
            discount_type: editing.discount_type,
            discount_value: Number(editing.discount_value) || 0,
            min_order: Number(editing.min_order) || 0,
            max_discount: editing.max_discount !== "" ? Number(editing.max_discount) : null,
            max_uses: editing.max_uses !== "" ? Number(editing.max_uses) : null,
            start_at: fromDatetimeLocal(editing.start_at),
            end_at: fromDatetimeLocal(editing.end_at),
            is_active: editing.is_active,
        };
        try {
            if (editing.id) {
                await api.put(`/vouchers/${editing.id}`, payload);
                toast.show("Đã cập nhật voucher.", "success");
            } else {
                await api.post("/vouchers", payload);
                toast.show("Đã tạo voucher.", "success");
            }
            setEditing(null);
            refresh();
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    const onToggle = async (v) => {
        try {
            await api.patch(`/vouchers/${v.id}/toggle`);
            refresh();
            toast.show(v.is_active ? "Đã tạm dừng voucher." : "Đã kích hoạt voucher.", "info");
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    const onDelete = async (v) => {
        if (!window.confirm(`Xoá voucher "${v.code}"?`)) return;
        try {
            await api.del(`/vouchers/${v.id}`);
            toast.show("Đã xoá voucher.", "info");
            refresh();
        } catch (err) {
            toast.show(err.message, "error");
        }
    };

    const fmtValue = (v) => {
        if (v.discount_type === "percent") return `${v.discount_value}%`;
        if (v.discount_type === "freeship") return `Free ship ${formatPrice(v.discount_value)}`;
        return formatPrice(v.discount_value);
    };

    const isExpired = (v) => v.end_at && new Date(v.end_at).getTime() < Date.now();

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Quản lý voucher</h1>
                    <p>Tổng cộng {list.length} mã giảm giá</p>
                </div>
                <button type="button" className="btn-primary" onClick={openCreate}>
                    <i className="fa-solid fa-plus"></i> Tạo voucher mới
                </button>
            </div>

            <div className="admin-card">
                <div className="admin-toolbar">
                    <input
                        type="text"
                        className="admin-search"
                        placeholder="Tìm theo mã hoặc tên..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select
                        className="admin-search"
                        style={{ flex: "0 0 180px", cursor: "pointer" }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">Tất cả</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Đã tạm dừng</option>
                        <option value="expired">Đã hết hạn</option>
                    </select>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tên voucher</th>
                            <th>Giảm giá</th>
                            <th>Đơn tối thiểu</th>
                            <th>Sử dụng</th>
                            <th>Hết hạn</th>
                            <th>Trạng thái</th>
                            <th style={{ textAlign: "right" }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className="empty-row"><td colSpan={8}>Đang tải...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr className="empty-row"><td colSpan={8}>Không có voucher phù hợp</td></tr>
                        ) : (
                            filtered.map((v) => (
                                <tr key={v.id}>
                                    <td><code style={{ background: "var(--bg)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>{v.code}</code></td>
                                    <td>
                                        <strong>{v.label}</strong>
                                        {v.description && (
                                            <div className="muted" style={{ fontSize: 12 }}>{v.description}</div>
                                        )}
                                    </td>
                                    <td><strong style={{ color: "var(--danger)" }}>{fmtValue(v)}</strong></td>
                                    <td>{v.min_order > 0 ? formatPrice(v.min_order) : <span className="muted">—</span>}</td>
                                    <td>
                                        {v.used_count}
                                        {v.max_uses != null && ` / ${v.max_uses}`}
                                    </td>
                                    <td>
                                        {v.end_at ? (
                                            <small className={isExpired(v) ? "muted" : ""}>
                                                {new Date(v.end_at).toLocaleDateString("vi-VN")}
                                            </small>
                                        ) : (
                                            <span className="muted">—</span>
                                        )}
                                    </td>
                                    <td>
                                        {isExpired(v) ? (
                                            <span className="lock-badge locked">Hết hạn</span>
                                        ) : v.is_active ? (
                                            <span className="lock-badge active">Hoạt động</span>
                                        ) : (
                                            <span className="lock-badge locked">Tạm dừng</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="tbl-actions">
                                            <button type="button" className="icon-btn" onClick={() => openEdit(v)} title="Sửa">
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="icon-btn"
                                                onClick={() => onToggle(v)}
                                                title={v.is_active ? "Tạm dừng" : "Kích hoạt"}
                                            >
                                                <i className={`fa-solid ${v.is_active ? "fa-pause" : "fa-play"}`}></i>
                                            </button>
                                            <button type="button" className="icon-btn danger" onClick={() => onDelete(v)} title="Xoá">
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editing && (
                <div className="modal-backdrop" onClick={() => setEditing(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
                        <div className="modal-head">
                            <h3>{editing.id ? "Sửa voucher" : "Tạo voucher mới"}</h3>
                            <button type="button" className="modal-close" onClick={() => setEditing(null)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form onSubmit={onSave} className="modal-body">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div className="form-row">
                                    <label>Mã voucher *</label>
                                    <input
                                        type="text"
                                        value={editing.code}
                                        onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                                        placeholder="VQ500K"
                                        style={{ textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}
                                    />
                                </div>
                                <div className="form-row">
                                    <label>Tên hiển thị *</label>
                                    <input
                                        type="text"
                                        value={editing.label}
                                        onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                                        placeholder="Giảm 500K cho đơn từ 10 triệu"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <label>Mô tả</label>
                                <textarea
                                    rows={2}
                                    value={editing.description}
                                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                                    placeholder="Áp dụng cho điện thoại Apple..."
                                    style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "inherit", fontSize: 14 }}
                                />
                            </div>

                            <div className="form-row">
                                <label>Loại giảm giá *</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                                    {DISCOUNT_TYPES.map((t) => (
                                        <label
                                            key={t.id}
                                            style={{
                                                border: `2px solid ${editing.discount_type === t.id ? "var(--primary)" : "var(--border)"}`,
                                                background: editing.discount_type === t.id ? "var(--primary-light)" : "#fff",
                                                borderRadius: 8,
                                                padding: "8px 10px",
                                                fontSize: 12,
                                                cursor: "pointer",
                                                textAlign: "center",
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="dtype"
                                                checked={editing.discount_type === t.id}
                                                onChange={() => setEditing({ ...editing, discount_type: t.id })}
                                                style={{ display: "none" }}
                                            />
                                            {t.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div className="form-row">
                                    <label>
                                        Giá trị giảm * {editing.discount_type === "percent" ? "(%)" : "(đ)"}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={editing.discount_type === "percent" ? "100" : undefined}
                                        value={editing.discount_value}
                                        onChange={(e) => setEditing({ ...editing, discount_value: e.target.value })}
                                        placeholder={editing.discount_type === "percent" ? "10" : "500000"}
                                    />
                                </div>
                                <div className="form-row">
                                    <label>Đơn tối thiểu (đ)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editing.min_order}
                                        onChange={(e) => setEditing({ ...editing, min_order: e.target.value })}
                                        placeholder="0 = không giới hạn"
                                    />
                                </div>
                            </div>

                            {editing.discount_type === "percent" && (
                                <div className="form-row">
                                    <label>Giảm tối đa (đ) - chỉ áp dụng cho loại %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editing.max_discount}
                                        onChange={(e) => setEditing({ ...editing, max_discount: e.target.value })}
                                        placeholder="Để trống = không giới hạn"
                                    />
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                                <div className="form-row">
                                    <label>Tổng lượt dùng</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editing.max_uses}
                                        onChange={(e) => setEditing({ ...editing, max_uses: e.target.value })}
                                        placeholder="Trống = không giới hạn"
                                    />
                                </div>
                                <div className="form-row">
                                    <label>Bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        value={editing.start_at}
                                        onChange={(e) => setEditing({ ...editing, start_at: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <label>Kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        value={editing.end_at}
                                        onChange={(e) => setEditing({ ...editing, end_at: e.target.value })}
                                    />
                                </div>
                            </div>

                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                                <input
                                    type="checkbox"
                                    checked={editing.is_active}
                                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                                />
                                Kích hoạt voucher (khách hàng có thể sử dụng)
                            </label>

                            <div className="modal-foot">
                                <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Hủy</button>
                                <button type="submit" className="btn-primary">
                                    <i className="fa-solid fa-floppy-disk"></i> Lưu voucher
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminVouchers;
