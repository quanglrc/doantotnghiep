import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import "../styles/ProductSection.css";

const ProductSection = ({ title, icon, products, viewAllHref = "/san-pham", accent }) => {
    if (!products || products.length === 0) return null;

    return (
        <section className="product-section container">
            <div className="ps-head" style={accent ? { borderTopColor: accent } : undefined}>
                <h2>
                    {icon && <i className={`fa-solid ${icon}`}></i>}
                    {title}
                </h2>
                <Link to={viewAllHref} className="see-all">
                    Xem tất cả <i className="fa-solid fa-chevron-right"></i>
                </Link>
            </div>

            <div className="product-grid">
                {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
    );
};

export default ProductSection;
