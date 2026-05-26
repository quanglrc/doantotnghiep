import { Link, useNavigate } from "react-router-dom";
import { formatPrice } from "../data/products";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import "../styles/ShoppingCart.css";

const ShoppingCart = () => {
    const { items, subtotal, updateQty, removeItem, clear } = useCart();
    const { isLoggedIn } = useAuth();
    const toast = useToast();
    const nav = useNavigate();

    const shipping = items.length > 0 && subtotal < 500000 ? 30000 : 0;
    const total = subtotal + shipping;

    if (!isLoggedIn) {
        return (
            <div className="container cart-page">
                <div className="auth-required">
                    <i className="fa-solid fa-lock"></i>
                    <h2>Bạn cần đăng nhập</h2>
                    <p>Vui lòng đăng nhập để xem giỏ hàng của bạn.</p>
                    <Link to="/dang-nhap" state={{ from: "/gio-hang" }} className="btn-primary">
                        <i className="fa-solid fa-right-to-bracket"></i> Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    const onCheckout = () => {
        if (!isLoggedIn) {
            toast.show("Vui lòng đăng nhập để thanh toán.", "info");
            nav("/dang-nhap", { state: { from: "/thanh-toan" } });
            return;
        }
        nav("/thanh-toan");
    };

    if (items.length === 0) {
        return (
            <div className="container cart-page">
                <div className="cart-empty">
                    <i className="fa-solid fa-cart-shopping"></i>
                    <h2>Giỏ hàng của bạn đang trống</h2>
                    <p>Khám phá hàng nghìn sản phẩm công nghệ giá tốt tại ViQiTech.</p>
                    <Link to="/san-pham" className="btn-primary">
                        <i className="fa-solid fa-bag-shopping"></i> Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container cart-page">
            <nav className="breadcrumbs">
                <Link to="/">Trang chủ</Link>
                <i className="fa-solid fa-chevron-right"></i>
                <span>Giỏ hàng</span>
            </nav>

            <h1 className="page-title">Giỏ hàng ({items.length} sản phẩm)</h1>

            <div className="cart-layout">
                <div className="cart-list">
                    <div className="cart-row cart-head">
                        <span>Sản phẩm</span>
                        <span>Đơn giá</span>
                        <span>Số lượng</span>
                        <span>Tạm tính</span>
                        <span></span>
                    </div>

                    {items.map((r) => (
                        <div key={r.id} className="cart-row">
                            <div className="cart-product">
                                <img src={r.image} alt={r.name} />
                                <Link to={`/san-pham/${r.id}`}>{r.name}</Link>
                            </div>
                            <div className="cart-price">{formatPrice(r.price)}</div>
                            <div className="cart-qty">
                                <button type="button" onClick={() => updateQty(r.id, r.qty - 1)}>−</button>
                                <span>{r.qty}</span>
                                <button type="button" onClick={() => updateQty(r.id, r.qty + 1)}>+</button>
                            </div>
                            <div className="cart-subtotal">{formatPrice(r.price * r.qty)}</div>
                            <button type="button" className="cart-remove" onClick={() => removeItem(r.id)} aria-label="Xóa">
                                <i className="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    ))}

                    <div className="cart-foot">
                        <button
                            type="button"
                            className="link-clear"
                            onClick={() => { clear(); toast.show("Đã xóa toàn bộ giỏ hàng.", "info"); }}
                        >
                            <i className="fa-solid fa-trash"></i> Xóa toàn bộ
                        </button>
                    </div>
                </div>

                <aside className="cart-summary">
                    <h3>Tóm tắt đơn hàng</h3>
                    <div className="sum-row"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
                    <div className="sum-row">
                        <span>Phí vận chuyển</span>
                        <span>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</span>
                    </div>
                    <div className="sum-row total">
                        <span>Tổng cộng</span>
                        <strong>{formatPrice(total)}</strong>
                    </div>

                    <button type="button" className="btn-primary btn-full" onClick={onCheckout}>
                        Tiến hành thanh toán <i className="fa-solid fa-arrow-right"></i>
                    </button>
                    <Link to="/san-pham" className="link-back">
                        <i className="fa-solid fa-arrow-left"></i> Tiếp tục mua sắm
                    </Link>
                </aside>
            </div>
        </div>
    );
};

export default ShoppingCart;
