import { useState } from "react";
import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
import { formatPrice, getDiscountPercent } from "../data/products";
import { useShop } from "../context/ShopContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { useToast } from "../context/ToastContext";
import ProductCard from "./ProductCard";
import "../styles/ProductDetail.css";

const ProductDetail = () => {
    const { id } = useParams();
    const { products, getProductsByCategory } = useShop();
    const product = products.find((p) => String(p.id) === String(id));
    const [qty, setQty] = useState(1);
    const { addItem } = useCart();
    const { isLoggedIn, user } = useAuth();
    const { reviewsOf, addReview, orders } = useOrders();
    const toast = useToast();
    const nav = useNavigate();

    const [revRating, setRevRating] = useState(5);
    const [revText, setRevText] = useState("");

    if (!product) return <Navigate to="/san-pham" replace />;

    const discount = getDiscountPercent(product.price, product.oldPrice);
    const related = getProductsByCategory(product.category)
        .filter((p) => p.id !== product.id)
        .slice(0, 5);

    const reviews = reviewsOf(product.id);
    const avgRating =
        reviews.length > 0
            ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
            : product.rating;

    const hasBought = isLoggedIn
        ? orders.some(
              (o) =>
                  o.userId === user.id &&
                  o.status === "completed" &&
                  o.items.some((it) => String(it.id) === String(product.id))
          )
        : false;

    const onAdd = () => {
        addItem(product, qty);
        toast.show(`Đã thêm ${qty} × "${product.name}" vào giỏ`, "success");
    };
    const onBuyNow = () => {
        addItem(product, qty);
        nav("/gio-hang");
    };

    const submitReview = (e) => {
        e.preventDefault();
        if (!revText.trim()) {
            toast.show("Vui lòng nhập nội dung đánh giá.", "error");
            return;
        }
        addReview({
            productId: product.id,
            userId: user.id,
            userName: user.name,
            rating: revRating,
            comment: revText.trim(),
        });
        toast.show("Cảm ơn bạn đã đánh giá!", "success");
        setRevText("");
        setRevRating(5);
    };

    return (
        <div className="container pd-page">
            <nav className="breadcrumbs">
                <Link to="/">Trang chủ</Link>
                <i className="fa-solid fa-chevron-right"></i>
                <Link to={`/san-pham?cat=${product.category}`}>Sản phẩm</Link>
                <i className="fa-solid fa-chevron-right"></i>
                <span>{product.name}</span>
            </nav>

            <div className="pd-main">
                <div className="pd-gallery">
                    <img src={product.image} alt={product.name} />
                </div>

                <div className="pd-info">
                    <h1>{product.name}</h1>

                    <div className="pd-meta">
                        <span><i className="fa-solid fa-star"></i> {avgRating}</span>
                        <span className="dot">•</span>
                        <span>{reviews.length} đánh giá</span>
                        <span className="dot">•</span>
                        <span>Đã bán {product.sold}</span>
                        <span className="dot">•</span>
                        <span className="in-stock"><i className="fa-solid fa-check"></i> Còn hàng</span>
                    </div>

                    <div className="pd-price-box">
                        <span className="pd-price-now">{formatPrice(product.price)}</span>
                        {discount > 0 && (
                            <>
                                <span className="pd-price-old">{formatPrice(product.oldPrice)}</span>
                                <span className="pd-discount">-{discount}%</span>
                            </>
                        )}
                    </div>

                    <ul className="pd-promo">
                        <li><i className="fa-solid fa-gift"></i> Tặng voucher giảm thêm 500.000đ</li>
                        <li><i className="fa-solid fa-credit-card"></i> Trả góp 0% qua thẻ tín dụng</li>
                        <li><i className="fa-solid fa-truck-fast"></i> Giao hàng miễn phí trong 24h</li>
                        <li><i className="fa-solid fa-shield-halved"></i> Bảo hành chính hãng 12 tháng</li>
                    </ul>

                    <div className="pd-actions">
                        <div className="pd-qty">
                            <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))}>−</button>
                            <span>{qty}</span>
                            <button type="button" onClick={() => setQty((v) => v + 1)}>+</button>
                        </div>
                        <button type="button" className="btn-outline btn-lg" onClick={onAdd}>
                            <i className="fa-solid fa-cart-plus"></i> Thêm vào giỏ
                        </button>
                        <button type="button" className="btn-primary btn-lg" onClick={onBuyNow}>
                            <i className="fa-solid fa-bolt"></i> Mua ngay
                        </button>
                    </div>
                </div>
            </div>

            <div className="pd-desc">
                <h2>Mô tả sản phẩm</h2>
                <p>
                    <strong>{product.name}</strong> là sản phẩm công nghệ hàng đầu được phân phối chính hãng tại ViQiTech.
                    Sản phẩm sở hữu thiết kế tinh tế, hiệu năng mạnh mẽ và đầy đủ tính năng hiện đại đáp ứng nhu cầu sử dụng
                    hàng ngày của bạn.
                </p>
                <p>Cam kết hàng chính hãng - Bảo hành toàn quốc - Đổi mới trong 30 ngày nếu phát sinh lỗi do nhà sản xuất.</p>
            </div>

            <div className="pd-reviews">
                <h2>Đánh giá ({reviews.length})</h2>

                {hasBought && (
                    <form onSubmit={submitReview} className="review-form">
                        <div className="rating-input">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    type="button"
                                    key={n}
                                    onClick={() => setRevRating(n)}
                                    className={n <= revRating ? "active" : ""}
                                    aria-label={`${n} sao`}
                                >
                                    <i className="fa-solid fa-star"></i>
                                </button>
                            ))}
                        </div>
                        <textarea
                            placeholder="Chia sẻ trải nghiệm của bạn..."
                            rows={3}
                            value={revText}
                            onChange={(e) => setRevText(e.target.value)}
                        />
                        <button type="submit" className="btn-primary">
                            <i className="fa-solid fa-paper-plane"></i> Gửi đánh giá
                        </button>
                    </form>
                )}

                {!isLoggedIn && (
                    <div className="review-hint">
                        <Link to="/dang-nhap">Đăng nhập</Link> và mua sản phẩm để đánh giá.
                    </div>
                )}
                {isLoggedIn && !hasBought && (
                    <div className="review-hint">
                        Chỉ khách hàng đã mua và nhận sản phẩm này mới có thể đánh giá.
                    </div>
                )}

                {reviews.length === 0 ? (
                    <p className="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                    <ul className="review-list">
                        {reviews.map((r) => (
                            <li key={r.id} className="review-item">
                                <div className="review-head">
                                    <strong>{r.userName}</strong>
                                    <div className="stars">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <i
                                                key={i}
                                                className={`fa-solid fa-star ${i < r.rating ? "filled" : ""}`}
                                            ></i>
                                        ))}
                                    </div>
                                    <small>{r.date}</small>
                                </div>
                                <p>{r.comment}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {related.length > 0 && (
                <section className="product-section">
                    <div className="ps-head">
                        <h2><i className="fa-solid fa-thumbs-up"></i> Sản phẩm liên quan</h2>
                    </div>
                    <div className="product-grid">
                        {related.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProductDetail;
