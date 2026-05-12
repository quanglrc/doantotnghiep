import { useMemo, useState } from "react";
import { useOrders, STATUS } from "../context/OrdersContext";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../data/products";

const AdminOrders = () => {
    const { orders, adminUpdateStatus } = useOrders();
    const toast = useToast();
    const [tab, setTab] = useState("all");
    const [q, setQ] = useState("");
    const [viewing, setViewing] = useState(null);

    const list = useMemo(() => {
        let arr = orders.slice();
        if (tab !== "all") arr = arr.filter((o) => o.status === tab);
        if (q.trim()) {
            const s = q.toLowerCase();
            arr = arr.filter(
                (o) =>
                    o.id.toLowerCase().includes(s) ||
                    (o.customer?.name || "").toLowerCase().includes(s) ||
                    (o.customer?.email || "").toLowerCase().includes(s)
            );
        }
        return arr;
    }, [orders, tab, q]);

    const onStatus = (id, status) => {
        adminUpdateStatus(id, status);
        toast.show(`Đã đổi trạng thái: ${STATUS[status].label}`, "success");
    };

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Quản lý đơn hàng</h1>
                    <p>Tổng cộng {orders.length} đơn hàng</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-toolbar">
                    <input
                        type="text"
                        className="admin-search"
                        placeholder="Tìm theo mã đơn / tên khách / email..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select
                        className="admin-search"
                        style={{ flex: "0 0 180px", cursor: "pointer" }}
                        value={tab}
                        onChange={(e) => setTab(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        {Object.entries(STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Ngày đặt</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th style={{ textAlign: "right" }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr className="empty-row"><td colSpan={6}>Không có đơn hàng phù hợp</td></tr>
                        ) : (
                            list.map((o) => (
                                <tr key={o.id}>
                                    <td><strong>{o.id}</strong></td>
                                    <td>
                                        <div>{o.customer?.name}</div>
                                        <small className="muted">{o.customer?.email}</small>
                                    </td>
                                    <td>{o.date}</td>
                                    <td><strong>{formatPrice(o.total)}</strong></td>
                                    <td>
                                        <select
                                            className="status-select"
                                            value={o.status}
                                            onChange={(e) => onStatus(o.id, e.target.value)}
                                        >
                                            {Object.entries(STATUS).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <div className="tbl-actions">
                                            <button type="button" className="icon-btn" onClick={() => setViewing(o)}>
                                                <i className="fa-regular fa-eye"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {viewing && (
                <div className="modal-backdrop" onClick={() => setViewing(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-head">
                            <h3>Chi tiết đơn {viewing.id}</h3>
                            <button type="button" className="modal-close" onClick={() => setViewing(null)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div>
                                <strong>{viewing.customer?.name}</strong>
                                <div className="muted" style={{ fontSize: 13 }}>
                                    {viewing.customer?.email} · {viewing.customer?.phone}
                                </div>
                                <div className="muted" style={{ fontSize: 13 }}>{viewing.customer?.address}</div>
                            </div>
                            <table className="admin-table" style={{ marginTop: 8 }}>
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>SL</th>
                                        <th>Đơn giá</th>
                                        <th>Tạm tính</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewing.items.map((it, i) => (
                                        <tr key={i}>
                                            <td>{it.name}</td>
                                            <td>{it.qty}</td>
                                            <td>{formatPrice(it.price)}</td>
                                            <td>{formatPrice(it.price * it.qty)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ display: "grid", gap: 4, paddingTop: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Tạm tính</span><span>{formatPrice(viewing.subtotal)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Phí vận chuyển</span><span>{viewing.shipping === 0 ? "Miễn phí" : formatPrice(viewing.shipping)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, paddingTop: 6, borderTop: "1px solid var(--border)" }}>
                                    <span>Tổng cộng</span><strong style={{ color: "var(--danger)" }}>{formatPrice(viewing.total)}</strong>
                                </div>
                            </div>
                            {viewing.cancelReason && (
                                <div className="cancel-reason">
                                    <i className="fa-solid fa-circle-exclamation"></i> Lý do hủy: {viewing.cancelReason}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminOrders;
