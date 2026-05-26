import { useEffect } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/Admin.css";

const menu = [
    { to: "/admin", icon: "fa-gauge-high", label: "Tổng quan", end: true },
    { to: "/admin/san-pham", icon: "fa-box", label: "Sản phẩm" },
    { to: "/admin/danh-muc", icon: "fa-list", label: "Danh mục" },
    { to: "/admin/thuong-hieu", icon: "fa-tags", label: "Thương hiệu" },
    { to: "/admin/voucher", icon: "fa-ticket", label: "Voucher" },
    { to: "/admin/don-hang", icon: "fa-receipt", label: "Đơn hàng" },
    { to: "/admin/nguoi-dung", icon: "fa-users", label: "Người dùng" },
    { to: "/admin/chatbot", icon: "fa-robot", label: "Chatbot AI" },
    { to: "/admin/thong-ke", icon: "fa-chart-column", label: "Thống kê" },
];

export const RequireAdmin = ({ children }) => {
    const { isLoggedIn, isAdmin } = useAuth();
    if (!isLoggedIn) return <Navigate to="/dang-nhap" replace />;
    if (!isAdmin) return <Navigate to="/" replace />;
    return children;
};

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const toast = useToast();
    const nav = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [pathname]);

    const onLogout = () => {
        logout();
        toast.show("Đã đăng xuất.", "info");
        nav("/", { replace: true });
    };

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <Link to="/admin" className="admin-logo">
                    Vi<span>Qi</span>TECH <small>Admin</small>
                </Link>

                <nav className="admin-menu">
                    {menu.map((m) => (
                        <NavLink key={m.to} to={m.to} end={m.end}>
                            <i className={`fa-solid ${m.icon}`}></i>
                            <span>{m.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-foot">
                    <Link to="/" className="admin-foot-link">
                        <i className="fa-solid fa-arrow-left"></i> Về trang khách hàng
                    </Link>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-user">
                        <div className="avatar">{(user?.name || "A")[0].toUpperCase()}</div>
                        <div>
                            <strong>{user?.name}</strong>
                            <small>{user?.email}</small>
                        </div>
                    </div>
                    <button type="button" className="btn-outline btn-sm" onClick={onLogout}>
                        <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                    </button>
                </header>

                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
