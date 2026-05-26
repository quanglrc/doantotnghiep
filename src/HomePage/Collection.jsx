import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useShop } from "../context/ShopContext";
import "../styles/collection.css";

const sortOptions = [
    { id: "default", label: "Mặc định" },
    { id: "price-asc", label: "Giá tăng dần" },
    { id: "price-desc", label: "Giá giảm dần" },
    { id: "sold-desc", label: "Bán chạy" },
    { id: "rating-desc", label: "Đánh giá cao" },
];

const priceRanges = [
    { id: "0-5", label: "Dưới 5 triệu", min: 0, max: 5000000 },
    { id: "5-15", label: "5 - 15 triệu", min: 5000000, max: 15000000 },
    { id: "15-30", label: "15 - 30 triệu", min: 15000000, max: 30000000 },
    { id: "30-up", label: "Trên 30 triệu", min: 30000000, max: Infinity },
];

const Collection = () => {
    const { products, categories, brands } = useShop();
    const [params, setParams] = useSearchParams();
    const cat = params.get("cat") || "";
    const q = (params.get("q") || "").toLowerCase();
    const [brand, setBrand] = useState("");
    const [priceId, setPriceId] = useState("");
    const [sort, setSort] = useState("default");

    const filtered = useMemo(() => {
        let list = products.slice();
        if (cat) list = list.filter((p) => p.category === cat);
        if (brand) list = list.filter((p) => p.brand === brand);
        if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
        if (priceId) {
            const r = priceRanges.find((x) => x.id === priceId);
            if (r) list = list.filter((p) => p.price >= r.min && p.price < r.max);
        }

        switch (sort) {
            case "price-asc": list.sort((a, b) => a.price - b.price); break;
            case "price-desc": list.sort((a, b) => b.price - a.price); break;
            case "sold-desc": list.sort((a, b) => b.sold - a.sold); break;
            case "rating-desc": list.sort((a, b) => b.rating - a.rating); break;
            default: break;
        }
        return list;
    }, [products, cat, brand, q, sort, priceId]);

    const activeCat = categories.find((c) => c.id === cat);
    const title = activeCat ? activeCat.name : q ? `Kết quả cho "${q}"` : "Tất cả sản phẩm";

    const setCat = (newCat) => {
        if (newCat) params.set("cat", newCat);
        else params.delete("cat");
        setParams(params);
    };

    const resetAll = () => {
        params.delete("cat");
        params.delete("q");
        setParams(params);
        setBrand("");
        setPriceId("");
        setSort("default");
    };

    const hasFilters = cat || brand || q || priceId || sort !== "default";

    return (
        <div className="container collection-page">
            <nav className="breadcrumbs">
                <Link to="/">Trang chủ</Link>
                <i className="fa-solid fa-chevron-right"></i>
                <span>{title}</span>
            </nav>

            <div className="collection-layout">
                <aside className="filter-sidebar">
                    <div className="filter-group">
                        <h4>Danh mục</h4>
                        <ul>
                            <li>
                                <button type="button" className={!cat ? "active" : ""} onClick={() => setCat("")}>
                                    Tất cả
                                </button>
                            </li>
                            {categories.map((c) => (
                                <li key={c.id}>
                                    <button
                                        type="button"
                                        className={cat === c.id ? "active" : ""}
                                        onClick={() => setCat(c.id)}
                                    >
                                        <i className={`fa-solid ${c.icon || "fa-tag"}`}></i>
                                        {c.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="filter-group">
                        <h4>Thương hiệu</h4>
                        <div className="brand-list">
                            <button type="button" className={!brand ? "active" : ""} onClick={() => setBrand("")}>
                                Tất cả
                            </button>
                            {brands.map((b) => (
                                <button
                                    type="button"
                                    key={b.id}
                                    className={brand === b.id ? "active" : ""}
                                    onClick={() => setBrand(brand === b.id ? "" : b.id)}
                                >{b.name}</button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <h4>Khoảng giá</h4>
                        <ul className="price-list">
                            <li>
                                <button type="button" className={!priceId ? "active" : ""} onClick={() => setPriceId("")}>
                                    Tất cả
                                </button>
                            </li>
                            {priceRanges.map((r) => (
                                <li key={r.id}>
                                    <button
                                        type="button"
                                        className={priceId === r.id ? "active" : ""}
                                        onClick={() => setPriceId(priceId === r.id ? "" : r.id)}
                                    >{r.label}</button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {hasFilters && (
                        <button type="button" className="btn-outline reset-filter" onClick={resetAll}>
                            <i className="fa-solid fa-arrow-rotate-left"></i> Xóa bộ lọc
                        </button>
                    )}
                </aside>

                <main className="collection-main">
                    <div className="collection-toolbar">
                        <div>
                            <h1 className="page-title">{title}</h1>
                            <p className="result-count">{filtered.length} sản phẩm</p>
                        </div>
                        <div className="sort-wrap">
                            <label>Sắp xếp:</label>
                            <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                {sortOptions.map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="empty">
                            <i className="fa-regular fa-face-frown"></i>
                            <p>Không tìm thấy sản phẩm phù hợp</p>
                            {hasFilters && (
                                <button type="button" className="btn-primary" onClick={resetAll} style={{ marginTop: 16 }}>
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="collection-grid">
                            {filtered.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Collection;
