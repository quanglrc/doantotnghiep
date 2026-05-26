import { useShop } from "../context/ShopContext";
import { useOrders } from "../context/OrdersContext";
import { formatPrice } from "../data/products";

const months = [
    { id: 1, name: "T1" }, { id: 2, name: "T2" }, { id: 3, name: "T3" },
    { id: 4, name: "T4" }, { id: 5, name: "T5" }, { id: 6, name: "T6" },
    { id: 7, name: "T7" }, { id: 8, name: "T8" }, { id: 9, name: "T9" },
    { id: 10, name: "T10" }, { id: 11, name: "T11" }, { id: 12, name: "T12" },
];

const swatch = ["var(--primary)", "var(--accent)", "var(--danger)", "#16a34a", "#a855f7", "#06b6d4", "#f97316", "#ec4899"];

const AdminReports = () => {
    const { products, categories, brands } = useShop();
    const { orders, reviews } = useOrders();

    const completed = orders.filter((o) => o.status === "completed");
    const revenue = completed.reduce((s, o) => s + o.total, 0);
    const cancelled = orders.filter((o) => o.status === "cancelled").length;

    // Doanh thu theo tháng (năm hiện tại)
    const year = new Date().getFullYear();
    const monthRevenue = months.map((m) => ({
        ...m,
        total: completed
            .filter((o) => {
                const d = new Date(o.date);
                return d.getFullYear() === year && d.getMonth() + 1 === m.id;
            })
            .reduce((s, o) => s + o.total, 0),
    }));
    const maxMonth = Math.max(1, ...monthRevenue.map((m) => m.total));

    // Top sản phẩm bán chạy
    const productSales = new Map();
    completed.forEach((o) =>
        o.items.forEach((it) => {
            productSales.set(it.id, (productSales.get(it.id) || 0) + it.qty);
        })
    );
    const topProducts = [...productSales.entries()]
        .map(([pid, qty]) => ({ product: products.find((p) => p.id === pid || String(p.id) === String(pid)), qty }))
        .filter((x) => x.product)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
    const maxTop = Math.max(1, ...topProducts.map((x) => x.qty));

    // Phân bố theo danh mục
    const catCount = categories.map((c) => ({
        ...c,
        n: products.filter((p) => p.category === c.id).length,
    }));
    const totalProd = Math.max(1, products.length);

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Thống kê & báo cáo</h1>
                    <p>Báo cáo doanh thu, sản phẩm bán chạy, phân bố danh mục</p>
                </div>
            </div>

            <div className="stat-cards">
                <div className="stat-card green">
                    <div className="ic"><i className="fa-solid fa-sack-dollar"></i></div>
                    <div>
                        <strong>{formatPrice(revenue)}</strong>
                        <small>Doanh thu tích lũy</small>
                    </div>
                </div>
                <div className="stat-card blue">
                    <div className="ic"><i className="fa-solid fa-receipt"></i></div>
                    <div>
                        <strong>{completed.length}</strong>
                        <small>Đơn hoàn thành</small>
                    </div>
                </div>
                <div className="stat-card red">
                    <div className="ic"><i className="fa-solid fa-circle-xmark"></i></div>
                    <div>
                        <strong>{cancelled}</strong>
                        <small>Đơn đã hủy</small>
                    </div>
                </div>
                <div className="stat-card orange">
                    <div className="ic"><i className="fa-solid fa-star"></i></div>
                    <div>
                        <strong>{reviews.length}</strong>
                        <small>Đánh giá khách hàng</small>
                    </div>
                </div>
            </div>

            <div className="admin-grid-2">
                <div className="admin-card">
                    <div className="admin-toolbar"><h3 style={{ margin: 0, fontSize: 16 }}>Doanh thu theo tháng ({year})</h3></div>
                    <div style={{ padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 200, padding: "12px 4px" }}>
                            {monthRevenue.map((m) => (
                                <div key={m.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                    <div
                                        title={formatPrice(m.total)}
                                        style={{
                                            width: "100%",
                                            height: `${(m.total / maxMonth) * 160}px`,
                                            background: "linear-gradient(180deg, var(--primary), var(--primary-dark))",
                                            borderRadius: "6px 6px 0 0",
                                            minHeight: 4,
                                            transition: "height 0.4s",
                                        }}
                                    />
                                    <small className="muted">{m.name}</small>
                                </div>
                            ))}
                        </div>
                        <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                            Tổng doanh thu năm {year}: <strong style={{ color: "var(--text)" }}>{formatPrice(monthRevenue.reduce((s, m) => s + m.total, 0))}</strong>
                        </p>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-toolbar"><h3 style={{ margin: 0, fontSize: 16 }}>Top sản phẩm bán chạy</h3></div>
                    <div style={{ padding: 16 }}>
                        {topProducts.length === 0 ? (
                            <p className="muted" style={{ textAlign: "center", padding: 24 }}>Chưa có dữ liệu</p>
                        ) : (
                            <div className="bar-chart">
                                {topProducts.map((x, i) => (
                                    <div key={x.product.id} className="bar-row">
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {i + 1}. {x.product.name}
                                        </span>
                                        <div className="bar-track">
                                            <div
                                                className="bar-fill"
                                                style={{
                                                    width: `${(x.qty / maxTop) * 100}%`,
                                                    background: swatch[i % swatch.length],
                                                }}
                                            ></div>
                                        </div>
                                        <b>{x.qty} sp</b>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-toolbar"><h3 style={{ margin: 0, fontSize: 16 }}>Phân bố theo danh mục</h3></div>
                    <div style={{ padding: 16 }}>
                        <div className="bar-chart">
                            {catCount.map((c, i) => (
                                <div key={c.id} className="bar-row">
                                    <span><i className={`fa-solid ${c.icon || "fa-tag"}`} style={{ marginRight: 8, color: swatch[i % swatch.length] }}></i>{c.name}</span>
                                    <div className="bar-track">
                                        <div
                                            className="bar-fill"
                                            style={{ width: `${(c.n / totalProd) * 100}%`, background: swatch[i % swatch.length] }}
                                        ></div>
                                    </div>
                                    <b>{((c.n / totalProd) * 100).toFixed(0)}%</b>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-toolbar"><h3 style={{ margin: 0, fontSize: 16 }}>Thương hiệu</h3></div>
                    <div style={{ padding: 16 }}>
                        <div className="donut-list">
                            {brands.map((b, i) => {
                                const n = products.filter((p) => p.brand === b.id).length;
                                return (
                                    <div key={b.id} className="donut-item">
                                        <span className="swatch" style={{ background: swatch[i % swatch.length] }}></span>
                                        <span>{b.name}</span>
                                        <b>{n} sản phẩm</b>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminReports;
