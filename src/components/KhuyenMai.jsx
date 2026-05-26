import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { useShop } from "../context/ShopContext";
import { getDiscountPercent } from "../data/products";
import "../styles/KhuyenMai.css";

const KhuyenMai = () => {
    const { products } = useShop();
    const list = products
        .filter((p) => getDiscountPercent(p.price, p.oldPrice) > 0)
        .sort((a, b) =>
            getDiscountPercent(b.price, b.oldPrice) - getDiscountPercent(a.price, a.oldPrice)
        );

    return (
        <div className="container km-page">
            <nav className="breadcrumbs">
                <Link to="/">Trang chủ</Link>
                <i className="fa-solid fa-chevron-right"></i>
                <span>Khuyến mãi</span>
            </nav>

            <div className="km-hero">
                <div>
                    <span className="km-tag">SALE OFF</span>
                    <h1>Khuyến mãi <span>HOT</span></h1>
                    <p>Săn deal cực sốc - Giảm đến 30% cho điện thoại, laptop, máy tính bảng và phụ kiện chính hãng.</p>
                </div>
                <i className="fa-solid fa-tags"></i>
            </div>

            <div className="km-grid">
                {list.map((p) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </div>
    );
};

export default KhuyenMai;
