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

    const handlePrintInvoice = (order) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const itemsHtml = order.items.map((it, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${it.name} ${it.variant_label ? '- ' + it.variant_label : ''} ${it.color_name ? '(' + it.color_name + ')' : ''}</td>
                <td style="text-align: center;">${it.qty}</td>
                <td style="text-align: right;">${formatPrice(it.price)}</td>
                <td style="text-align: right;">${formatPrice(it.subtotal || (it.price * it.qty))}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hóa đơn ${order.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; color: #333; }
                    .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
                    .company h2 { margin: 0; font-size: 20px; color: #2563eb; }
                    .info { margin-bottom: 30px; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
                    th, td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; }
                    th { background: #f8f9fa; }
                    .totals { width: 50%; float: right; }
                    .totals table th, .totals table td { border: none; padding: 5px 10px; }
                    .footer { clear: both; margin-top: 50px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company">
                        <h2>ViQiTECH</h2>
                        <p>123 Đường Công Nghệ, Quận 1, TP.HCM<br>ĐT: 1900 1234<br>Email: hotro@viqitech.vn</p>
                    </div>
                    <div style="text-align: right;">
                        <h1>HÓA ĐƠN BÁN HÀNG</h1>
                        <p>Mã hóa đơn: <strong>${order.id}</strong><br>Ngày lập: ${new Date().toLocaleDateString("vi-VN")}</p>
                    </div>
                </div>
                <div class="info">
                    <h3>Thông tin khách hàng</h3>
                    <p><strong>Họ tên:</strong> ${order.customer?.name}<br>
                    <strong>Điện thoại:</strong> ${order.customer?.phone || 'Không có'}<br>
                    <strong>Địa chỉ:</strong> ${order.customer?.address || 'Không có'}</p>
                </div>
                <table>
                    <thead><tr><th>STT</th><th>Sản phẩm</th><th style="text-align: center;">SL</th><th style="text-align: right;">Đơn giá</th><th style="text-align: right;">Thành tiền</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div class="totals">
                    <table>
                        <tr><td>Tạm tính:</td><td style="text-align: right;">${formatPrice(order.subtotal)}</td></tr>
                        <tr><td>Phí vận chuyển:</td><td style="text-align: right;">${order.shipping === 0 ? 'Miễn phí' : formatPrice(order.shipping)}</td></tr>
                        ${order.discount > 0 ? `<tr><td>Giảm giá:</td><td style="text-align: right;">- ${formatPrice(order.discount)}</td></tr>` : ''}
                        <tr><td><strong>Tổng cộng:</strong></td><td style="text-align: right; font-weight: bold; color: #dc2626;">${formatPrice(order.total)}</td></tr>
                    </table>
                </div>
                <div class="footer"><p>Cảm ơn quý khách đã mua sắm tại ViQiTECH!</p></div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(html);
        iframe.contentWindow.document.close();

        // Xóa iframe sau khi in xong
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 3000);
    };

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

    const onStatus = async (id, status) => {
        const r = await adminUpdateStatus(id, status);
        if (!r.ok) {
            toast.show(r.error || "Đổi trạng thái thất bại.", "error");
            return;
        }
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
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="button" className="btn-outline btn-sm" onClick={() => handlePrintInvoice(viewing)} title="In hóa đơn">
                                    <i className="fa-solid fa-print"></i> In hóa đơn
                                </button>
                                <button type="button" className="modal-close" onClick={() => setViewing(null)}>
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
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
