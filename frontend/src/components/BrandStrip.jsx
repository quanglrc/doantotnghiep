import { useShop } from "../context/ShopContext";
import "../styles/BrandStrip.css";

const BrandStrip = () => {
    const { brands } = useShop();
    return (
    <section className="brand-strip container">
        <div className="section-head">
            <h2>Thương hiệu nổi bật</h2>
        </div>
        <div className="brand-row">
            {brands.map((b) => (
                <div key={b.id} className="brand-chip">
                    {b.name}
                </div>
            ))}
        </div>
    </section>
    );
};

export default BrandStrip;
