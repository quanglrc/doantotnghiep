import { useEffect, useState } from "react";
import "../styles/HeroBanner.css";

const slides = [
    {
        title: "iPhone 15 Pro Max",
        subtitle: "Giảm đến 5 triệu - Trả góp 0%",
        cta: "Mua ngay",
        bg: "linear-gradient(135deg, #0b1530 0%, #1e6fff 100%)",
        accent: "#ffb300",
    },
    {
        title: "Laptop Gaming",
        subtitle: "ROG · MSI · Dell · Giảm sốc 20%",
        cta: "Khám phá",
        bg: "linear-gradient(135deg, #2d0a3d 0%, #ee0033 100%)",
        accent: "#ffb300",
    },
    {
        title: "iPad Pro M4 mới",
        subtitle: "Trả góp 0% - Tặng bút Apple Pencil",
        cta: "Xem ngay",
        bg: "linear-gradient(135deg, #04313a 0%, #0bc1c1 100%)",
        accent: "#ffd54f",
    },
];

const sideBanners = [
    {
        title: "Tai nghe AirPods",
        subtitle: "Giảm đến 1.5tr",
        bg: "linear-gradient(135deg, #1d1d1f, #4a4a4a)",
    },
    {
        title: "Đồng hồ thông minh",
        subtitle: "Trả góp 0%",
        bg: "linear-gradient(135deg, #1457d4, #1e6fff)",
    },
];

const HeroBanner = () => {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
        return () => clearInterval(t);
    }, []);

    const slide = slides[idx];

    return (
        <section className="hero">
            <div className="container hero-grid">
                <div className="hero-slider" style={{ background: slide.bg }}>
                    <div className="hero-content">
                        <span className="hero-tag" style={{ background: slide.accent }}>
                            Khuyến mãi đặc biệt
                        </span>
                        <h1>{slide.title}</h1>
                        <p>{slide.subtitle}</p>
                        <button className="hero-cta" style={{ background: slide.accent }}>
                            {slide.cta} <i className="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>

                    <div className="hero-dots">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                className={i === idx ? "active" : ""}
                                onClick={() => setIdx(i)}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="hero-side">
                    {sideBanners.map((b, i) => (
                        <div key={i} className="hero-side-item" style={{ background: b.bg }}>
                            <h3>{b.title}</h3>
                            <p>{b.subtitle}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HeroBanner;
