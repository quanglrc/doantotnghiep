import { Link } from "react-router-dom";
import { formatPrice, getDiscountPercent } from "../data/products";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import "../styles/ProductCard.css";

const ProductCard = ({ product }) => {
    const discount = getDiscountPercent(product.price, product.oldPrice);
    const { addItem } = useCart();
    const toast = useToast();

    const onAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, 1);
        toast.show(`Đã thêm "${product.name}" vào giỏ`, "success");
    };

    return (
        <Link to={`/san-pham/${product.id}`} className="product-card">
            {product.badge && (
                <span className={`badge badge-${product.badge.startsWith("-") ? "discount" : "hot"}`}>
                    {product.badge}
                </span>
            )}

            <div className="product-thumb">
                <img src={product.image} alt={product.name} loading="lazy" />
            </div>

            <div className="product-body">
                <h3 className="product-name">{product.name}</h3>

                <div className="product-price">
                    <span className="price-now">{formatPrice(product.price)}</span>
                    {discount > 0 && (
                        <span className="price-old">{formatPrice(product.oldPrice)}</span>
                    )}
                </div>

                {discount > 0 && (
                    <div className="product-discount">Tiết kiệm {discount}%</div>
                )}

                <div className="product-meta">
                    <span className="rating">
                        <i className="fa-solid fa-star"></i> {product.rating}
                    </span>
                    <span className="sold">Đã bán {product.sold}</span>
                </div>

                <button type="button" className="btn-buy" onClick={onAdd}>
                    <i className="fa-solid fa-cart-plus"></i> Thêm vào giỏ
                </button>
            </div>
        </Link>
    );
};

export default ProductCard;
