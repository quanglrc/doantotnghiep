import { useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../data/products";
import { useAuth } from "../../context/AuthContext";
import { useOrders, STATUS } from "../../context/OrdersContext";
import { useToast } from "../../context/ToastContext";
import ReviewModal from "../ReviewModal";
import "../../styles/Order.css";

const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ xác nhận" },
    { id: "shipping", label: "Đang giao" },
    { id: "completed", label: "Hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
];

const Order = () => {
    const { isLoggedIn, user } = useAuth();
    const { orders, cancelOrder } = useOrders();
    const toast = useToast();
    const [tab, setTab] = useState("all");
    const [reviewing, setReviewing] = useState(null);

    if (!isLoggedIn) {
        return (
            <div className="container order-page">
                <div className="auth-required">
                    <i className="fa-solid fa-lock"></i>
                    <h2>Bạn chưa đăng nhập</h2>
                    <p>Vui lòng đăng nhập để xem đơn hàng.</p>
                    <Link to="/dang-nhap" className="btn-primary">
                        <i className="fa-solid fa-right-to-bracket"></i> Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    const my = orders.filter((o) => o.userId === user.id);
    const filterTab = (o) => {
        if (tab === "all") return true;
        if (tab === "shipping") return o.status === "shipping" || o.status === "confirmed";
        return o.status === tab;
    };
    const list = my.filter(filterTab);

    const onCancel = async (id) => {
        if (!window.confirm("Bạn chắc chắn hủy đơn hàng này?")) return;
        const r = await cancelOrder(id, "Khách hủy đơn");
        if (!r.ok) {
            toast.show(r.error || "Hủy đơn thất bại.", "error");
            return;
        }
        toast.show("Đã hủy đơn hàng.", "info");
    };

    return (
        <div className="container order-page">
            <nav className="breadcrumbs">
                <Link to="/">Trang chủ</Link>
                <i className="fa-solid fa-chevron-right"></i>
                <span>Đơn hàng của tôi</span>
            </nav>

            <h1 className="page-title">Đơn hàng của tôi</h1>

            <div className="order-tabs">
                {tabs.map((t) => (
                    <button
                        type="button"
                        key={t.id}
                        className={tab === t.id ? "active" : ""}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {list.length === 0 ? (
                <div className="empty">
                    <i className="fa-solid fa-box-open"></i>
                    <p>Chưa có đơn hàng nào</p>
                    <Link to="/san-pham" className="btn-primary" style={{ marginTop: 16 }}>
                        <i className="fa-solid fa-bag-shopping"></i> Mua sắm ngay
                    </Link>
                </div>
            ) : (
                <div className="order-list">
                    {list.map((o) => {
                        const st = STATUS[o.status];
                        const canCancel = o.status === "pending" || o.status === "confirmed";
                        const canReview = o.status === "completed";
                        return (
                            <div key={o.id} className="order-card">
                                <div className="order-card-head">
                                    <div>
                                        <strong>Mã đơn: {o.id}</strong>
                                        <small>Ngày đặt: {o.date}</small>
                                    </div>
                                    <span className={`status ${st.cls}`}>{st.label}</span>
                                </div>
                                <div className="order-card-body">
                                    {o.items.map((it, idx) => (
                                        <div key={idx} className="order-item">
                                            <span>
                                                <i className="fa-solid fa-cube"></i> {it.name} <em>× {it.qty}</em>
                                            </span>
                                            <span>{formatPrice(it.price * it.qty)}</span>
                                        </div>
                                    ))}
                                    {o.cancelReason && (
                                        <div className="cancel-reason">
                                            <i className="fa-solid fa-circle-exclamation"></i> Lý do hủy: {o.cancelReason}
                                        </div>
                                    )}
                                </div>
                                <div className="order-card-foot">
                                    <span>Tổng tiền:</span>
                                    <strong>{formatPrice(o.total)}</strong>
                                    {canCancel && (
                                        <button type="button" className="btn-outline btn-danger" onClick={() => onCancel(o.id)}>
                                            <i className="fa-solid fa-xmark"></i> Hủy đơn
                                        </button>
                                    )}
                                    {canReview && (
                                        <button type="button" className="btn-outline" onClick={() => setReviewing(o)}>
                                            <i className="fa-regular fa-star"></i> Đánh giá
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {reviewing && (
                <ReviewModal order={reviewing} onClose={() => setReviewing(null)} />
            )}
        </div>
    );
};

export default Order;
