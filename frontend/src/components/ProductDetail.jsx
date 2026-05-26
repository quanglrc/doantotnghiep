import { useMemo, useState } from "react";
import { Link, useParams, Navigate, useNavigate, useLocation } from "react-router-dom";
import { formatPrice, getDiscountPercent } from "../data/products";
import { useShop } from "../context/ShopContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { useToast } from "../context/ToastContext";
import { getGallery, getVariants, getColors, getVouchers } from "../utils/productDetails";
import ProductCard from "./ProductCard";
import "../styles/ProductDetail.css";

const ProductDetail = () => {
    const { id } = useParams();
    const { products, getProductsByCategory } = useShop();
    const product = products.find((p) => String(p.id) === String(id));
    const { addItem } = useCart();
    const { isLoggedIn, user } = useAuth();
    const { reviewsOf, addReview, orders } = useOrders();
    const toast = useToast();
    const nav = useNavigate();
    const location = useLocation();

    const requireLogin = (msg) => {
        toast.show(msg || "Vui lòng đăng nhập để tiếp tục.", "info");
        nav("/dang-nhap", { state: { from: location.pathname + location.search } });
    };

    const gallery = useMemo(() => getGallery(product), [product]);
    const variants = useMemo(() => getVariants(product), [product]);
    const colors = useMemo(() => getColors(product), [product]);
    const vouchers = useMemo(() => getVouchers(product), [product]);

    const [qty, setQty] = useState(1);
    const [imgIdx, setImgIdx] = useState(0);
    const [variantId, setVariantId] = useState(variants[0]?.id || null);
    const [colorId, setColorId] = useState(colors[0]?.id || null);
    const [claimed, setClaimed] = useState(new Set());
    const [revRating, setRevRating] = useState(5);
    const [revText, setRevText] = useState("");

    if (!product) return <Navigate to="/san-pham" replace />;

    const variant = variants.find((v) => v.id === variantId) || null;
    const color = colors.find((c) => c.id === colorId) || null;

    const currentPrice =
        product.price + (variant?.priceDelta || 0) + (color?.priceDelta || 0);
    const currentOldPrice = product.oldPrice
        ? product.oldPrice + (variant?.priceDelta || 0) + (color?.priceDelta || 0)
        : 0;
    const discount = getDiscountPercent(currentPrice, currentOldPrice);

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

    const related = getProductsByCategory(product.category)
        .filter((p) => p.id !== product.id)
        .slice(0, 5);

    const buildCartItem = () => ({
        ...product,
        id: variant || color ? `${product.id}-${variantId || ""}-${colorId || ""}` : product.id,
        name:
            product.name +
            (variant ? ` · ${variant.label}` : "") +
            (color ? ` · ${color.name}` : ""),
        price: currentPrice,
        oldPrice: currentOldPrice,
        image: color?.image || gallery[imgIdx] || product.image,
    });

    const onAdd = () => {
        if (!isLoggedIn) return requireLogin("Vui lòng đăng nhập để thêm vào giỏ.");
        addItem(buildCartItem(), qty);
        toast.show(`Đã thêm ${qty} × "${product.name}" vào giỏ`, "success");
    };
    const onBuyNow = () => {
        if (!isLoggedIn) return requireLogin("Vui lòng đăng nhập để mua hàng.");
        addItem(buildCartItem(), qty);
        nav("/gio-hang");
    };
    const onClaim = (code) => {
        if (!isLoggedIn) return requireLogin("Vui lòng đăng nhập để thu thập voucher.");
        setClaimed((s) => new Set(s).add(code));
        toast.show(`Đã thu thập voucher ${code}`, "success");
    };
    const submitReview = async (e) => {
        e.preventDefault();
        if (!revText.trim()) {
            toast.show("Vui lòng nhập nội dung đánh giá.", "error");
            return;
        }
        const r = await addReview({
            productId: product.id,
            rating: revRating,
            comment: revText.trim(),
        });
        if (!r.ok) {
            toast.show(r.error || "Gửi đánh giá thất bại.", "error");
            return;
        }
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
                    <div className="pd-main-img">
                        <img src={gallery[imgIdx] || product.image} alt={product.name} />
                    </div>
                    <div className="pd-thumbs">
                        {gallery.map((src, i) => (
                            <button
                                type="button"
                                key={i}
                                className={`pd-thumb ${i === imgIdx ? "active" : ""}`}
                                onClick={() => setImgIdx(i)}
                            >
                                <img src={src} alt={`Ảnh ${i + 1}`} />
                            </button>
                        ))}
                    </div>
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
                        <span className="pd-price-now">{formatPrice(currentPrice)}</span>
                        {discount > 0 && (
                            <>
                                <span className="pd-price-old">{formatPrice(currentOldPrice)}</span>
                                <span className="pd-discount">-{discount}%</span>
                            </>
                        )}
                    </div>

                    {variants.length > 0 && (
                        <div className="pd-option">
                            <div className="pd-option-label">Phiên bản</div>
                            <div className="pd-option-grid">
                                {variants.map((v) => (
                                    <button
                                        type="button"
                                        key={v.id}
                                        className={`option-card ${variantId === v.id ? "active" : ""}`}
                                        onClick={() => setVariantId(v.id)}
                                    >
                                        <span className="opt-title">{v.label}</span>
                                        {v.priceDelta > 0 && (
                                            <span className="opt-sub">+{formatPrice(v.priceDelta)}</span>
                                        )}
                                        {variantId === v.id && (
                                            <span className="opt-check"><i className="fa-solid fa-check"></i></span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {colors.length > 0 && (
                        <div className="pd-option">
                            <div className="pd-option-label">Màu sắc</div>
                            <div className="pd-option-grid pd-colors">
                                {colors.map((c) => {
                                    const colorPrice = product.price + (variant?.priceDelta || 0) + (c.priceDelta || 0);
                                    return (
                                        <button
                                            type="button"
                                            key={c.id}
                                            className={`option-card color-card ${colorId === c.id ? "active" : ""}`}
                                            onClick={() => setColorId(c.id)}
                                        >
                                            <span className="color-swatch" style={{ background: c.bg }} />
                                            <span className="color-info">
                                                <span className="opt-title">{c.name}</span>
                                                <span className="opt-sub">{formatPrice(colorPrice)}</span>
                                            </span>
                                            {colorId === c.id && (
                                                <span className="opt-check"><i className="fa-solid fa-check"></i></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {vouchers.length > 0 && (
                        <div className="pd-vouchers">
                            <div className="pdv-head">
                                <strong>
                                    <i className="fa-solid fa-gift"></i> Khuyến mãi đi kèm
                                </strong>
                                <Link to="/khuyen-mai" className="pdv-all">
                                    Xem tất cả voucher <i className="fa-solid fa-chevron-right"></i>
                                </Link>
                            </div>
                            <ul className="pdv-list">
                                {vouchers.map((v) => (
                                    <li key={v.code} className="pdv-item">
                                        <div className="pdv-tag">
                                            <small>{v.discount > 0 ? "Giảm" : "Ưu đãi"}</small>
                                            <strong>
                                                {v.discount >= 1000
                                                    ? `${Math.round(v.discount / 1000)}k`
                                                    : v.label}
                                            </strong>
                                        </div>
                                        <div className="pdv-content">
                                            <strong>{v.label}</strong>
                                            <p>{v.desc}</p>
                                            <a href="#">Xem thể lệ</a>
                                        </div>
                                        <button
                                            type="button"
                                            className={`pdv-claim ${claimed.has(v.code) ? "claimed" : ""}`}
                                            onClick={() => onClaim(v.code)}
                                            disabled={claimed.has(v.code)}
                                        >
                                            {claimed.has(v.code) ? (
                                                <><i className="fa-solid fa-check"></i> Đã thu</>
                                            ) : (
                                                "Thu thập"
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <ul className="pd-promo">
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
