import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import "../styles/FlashSale.css";

const useCountdown = (totalSeconds) => {
    const [s, setS] = useState(totalSeconds);
    useEffect(() => {
        const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, []);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return { h, m, s: sec };
};

const FlashSale = ({ products }) => {
    const { h, m, s } = useCountdown(3 * 3600 + 45 * 60);

    if (!products || products.length === 0) return null;

    return (
        <section className="flash-sale container">
            <div className="fs-head">
                <div className="fs-title">
                    <i className="fa-solid fa-bolt"></i>
                    <h2>FLASH SALE</h2>
                    <span className="fs-sub">Giá sốc giảm tới 50%</span>
                </div>

                <div className="fs-timer">
                    <span>Kết thúc trong</span>
                    <div className="fs-clock">
                        <b>{h}</b>:<b>{m}</b>:<b>{s}</b>
                    </div>
                </div>

                <Link to="/khuyen-mai" className="fs-all">
                    Xem tất cả <i className="fa-solid fa-chevron-right"></i>
                </Link>
            </div>

            <div className="fs-grid">
                {products.slice(0, 5).map((p) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
    );
};

export default FlashSale;
