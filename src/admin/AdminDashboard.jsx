import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { useOrders, STATUS } from "../context/OrdersContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../data/products";

const AdminDashboard = () => {
    const { products, categories, brands } = useShop();
    const { orders } = useOrders();
    const { users } = useAuth();

    const revenue = orders
        .filter((o) => o.status === "completed")
        .reduce((s, o) => s + o.total, 0);
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    const customers = users.filter((u) => u.role === "customer").length;

    const recent = orders.slice(0, 5);

    return (
        <>
            <div className="admin-page-head">
                <div>
                    <h1>Tổng quan</h1>
                    <p>Tình hình kinh doanh tổng quan của ViQiTech</p>
                </div>
            </div>

            <div className="stat-cards">
                <div className="stat-card blue">
                    <div className="ic"><i className="fa-solid fa-box"></i></div>
                    <div>
                        <strong>{products.length}</strong>
                        <small>Sản phẩm</small>
                    </div>
                </div>
                <div className="stat-card orange">
                    <div className="ic"><i className="fa-solid fa-receipt"></i></div>
                    <div>
                        <strong>{orders.length}</strong>
                        <small>Đơn hàng ({pendingCount} chờ xử lý)</small>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="ic"><i className="fa-solid fa-users"></i></div>
                    <div>
                        <strong>{customers}</strong>
                        <small>Khách hàng</small>
                    </div>
                </div>
                <div className="stat-card red">
                    <div className="ic"><i className="fa-solid fa-sack-dollar"></i></div>
                    <div>
                        <strong>{formatPrice(revenue)}</strong>
                        <small>Doanh thu</small>
                    </div>
                </div>
            </div>

            <div className="admin-grid-2">
                <div className="admin-card">
                    <div className="admin-toolbar">
                        <h3 style={{ margin: 0, fontSize: 16 }}>Đơn hàng gần đây</h3>
                        <Link to="/admin/don-hang" className="see-all" style={{ marginLeft: "auto" }}>
                            Xem tất cả <i className="fa-solid fa-chevron-right"></i>
                        </Link>
                    </div>
                    {recent.length === 0 ? (
                        <div className="empty-row" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                            Chưa có đơn hàng nào
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách</th>
                                    <th>Tổng</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((o) => (
                                    <tr key={o.id}>
                                        <td><strong>{o.id}</strong></td>
                                        <td>{o.customer?.name || "—"}</td>
                                        <td>{formatPrice(o.total)}</td>
                                        <td><span className={`status ${STATUS[o.status].cls}`}>{STATUS[o.status].label}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="admin-card">
                    <div className="admin-toolbar">
                        <h3 style={{ margin: 0, fontSize: 16 }}>Phân bố sản phẩm theo danh mục</h3>
                    </div>
                    <div style={{ padding: 16 }}>
                        <div className="bar-chart">
                            {categories.map((c) => {
                                const n = products.filter((p) => p.category === c.id).length;
                                const max = Math.max(1, ...categories.map((cc) => products.filter((p) => p.category === cc.id).length));
                                return (
                                    <div key={c.id} className="bar-row">
                                        <span><i className={`fa-solid ${c.icon || "fa-tag"}`} style={{ marginRight: 8, color: "var(--primary)" }}></i>{c.name}</span>
                                        <div className="bar-track">
                                            <div className="bar-fill" style={{ width: `${(n / max) * 100}%` }}></div>
                                        </div>
                                        <b>{n} SP</b>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="muted" style={{ marginTop: 16 }}>
                            Tổng {brands.length} thương hiệu · {categories.length} danh mục
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
