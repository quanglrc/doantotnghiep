import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { formatPrice } from "../data/products";
import "../styles/Checkout.css";

const PAYMENT_LABEL = {
    cod: "Thanh toán khi nhận hàng (COD)",
    qr: "Chuyển khoản mã QR",
    vnpay: "Thanh toán qua cổng VNPay",
};

const STATUS_LABEL = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
};

const OrderSuccess = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        document.title = "Đặt hàng thành công — ViQiTech";
        api.get(`/orders/${id}`)
            .then((o) => setOrder(o))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
        return () => { document.title = "ViQiTech"; };
    }, [id]);

    if (loading) {
        return (
            <div className="container os-page">
                <div className="os-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang tải đơn hàng...
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container os-page">
                <div className="os-error">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <h2>Không tìm thấy đơn hàng</h2>
                    <p>{error || "Đơn hàng có thể đã bị xoá hoặc không tồn tại."}</p>
                    <Link to="/" className="btn-primary">Về trang chủ</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container os-page">
            <div className="os-success-banner">
                <div className="os-check">
                    <i className="fa-solid fa-check"></i>
                </div>
                <h1>Đặt hàng thành công!</h1>
                <p>Cảm ơn bạn đã mua sắm tại ViQiTech. Đơn hàng của bạn đã được tiếp nhận.</p>
                <div className="os-id">
                    Mã đơn: <strong>{order.id}</strong>
                </div>
            </div>

            <div className="os-grid">
                <div className="ck-card">
                    <h3 className="ck-card-title"><i className="fa-solid fa-receipt"></i> Chi tiết đơn hàng</h3>
                    <ul className="os-items">
                        {order.items.map((it, i) => (
                            <li key={i}>
                                <img src={it.image} alt={it.name} />
                                <div>
                                    <div className="os-item-name">{it.name}</div>
                                    <small>{formatPrice(it.price)} × {it.qty}</small>
                                </div>
                                <strong>{formatPrice(it.price * it.qty)}</strong>
                            </li>
                        ))}
                    </ul>

                    <div className="cs-rows" style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                        <div><span>Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
                        <div>
                            <span>Phí vận chuyển</span>
                            <span>{order.shipping === 0 ? <em className="free">Miễn phí</em> : formatPrice(order.shipping)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div>
                                <span>Giảm giá</span>
                                <span className="discount-amount">-{formatPrice(order.discount)}</span>
                            </div>
                        )}
                        <div className="cs-total">
                            <span>Tổng cộng</span>
                            <strong>{formatPrice(order.total)}</strong>
                        </div>
                    </div>
                </div>

                <div className="ck-card">
                    <h3 className="ck-card-title"><i className="fa-solid fa-truck-fast"></i> Thông tin giao hàng</h3>
                    <dl className="os-info">
                        <dt>Người nhận</dt>
                        <dd>{order.customer?.name}</dd>
                        <dt>Số điện thoại</dt>
                        <dd>{order.customer?.phone}</dd>
                        {order.customer?.email && (
                            <>
                                <dt>Email</dt>
                                <dd>{order.customer.email}</dd>
                            </>
                        )}
                        <dt>Địa chỉ</dt>
                        <dd>{order.customer?.address}</dd>
                        <dt>Phương thức thanh toán</dt>
                        <dd>{PAYMENT_LABEL[order.payment_method] || order.payment_method}</dd>
                        <dt>Trạng thái</dt>
                        <dd>
                            <span className={`status ${order.status}`}>
                                {STATUS_LABEL[order.status] || order.status}
                            </span>
                        </dd>
                        {order.note && (
                            <>
                                <dt>Ghi chú</dt>
                                <dd>{order.note}</dd>
                            </>
                        )}
                    </dl>

                    <div className="os-actions">
                        <Link to="/don-hang" className="btn-outline">
                            <i className="fa-solid fa-list"></i> Xem đơn hàng của tôi
                        </Link>
                        <Link to="/san-pham" className="btn-primary">
                            <i className="fa-solid fa-bag-shopping"></i> Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>
            </div>

            <div className="os-next-steps">
                <h3>Các bước tiếp theo</h3>
                <ol>
                    <li>
                        <i className="fa-solid fa-phone"></i>
                        <div>
                            <strong>ViQiTech sẽ gọi xác nhận</strong>
                            <small>Trong vòng 30 phút (giờ hành chính)</small>
                        </div>
                    </li>
                    <li>
                        <i className="fa-solid fa-box"></i>
                        <div>
                            <strong>Đóng gói & xuất kho</strong>
                            <small>Hàng được kiểm tra kỹ trước khi giao</small>
                        </div>
                    </li>
                    <li>
                        <i className="fa-solid fa-truck-fast"></i>
                        <div>
                            <strong>Giao hàng</strong>
                            <small>2-24h nội thành, 2-5 ngày tỉnh khác</small>
                        </div>
                    </li>
                </ol>
            </div>
        </div>
    );
};

export default OrderSuccess;
