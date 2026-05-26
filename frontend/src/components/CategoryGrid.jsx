import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import "../styles/CategoryGrid.css";

const CategoryGrid = () => {
    const { categories } = useShop();
    return (
        <section className="category-grid-section container">
            <div className="section-head">
                <h2>Danh mục nổi bật</h2>
                <Link to="/san-pham" className="see-all">
                    Xem tất cả <i className="fa-solid fa-chevron-right"></i>
                </Link>
            </div>

            <div className="category-grid">
                {categories.map((c) => (
                    <Link key={c.id} to={`/san-pham?cat=${c.id}`} className="cat-card">
                        <div className="cat-icon">
                            <i className={`fa-solid ${c.icon || "fa-tag"}`}></i>
                        </div>
                        <span>{c.name}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default CategoryGrid;
