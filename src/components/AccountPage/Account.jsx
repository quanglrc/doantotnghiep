import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../styles/Account.css";

const Account = () => {
    const { user, isLoggedIn, updateProfile, logout } = useAuth();
    const toast = useToast();
    const nav = useNavigate();

    const [form, setForm] = useState(() => ({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: user?.address || "",
    }));

    if (!isLoggedIn) {
        return (
            <div className="container account-page">
                <div className="auth-required">
                    <i className="fa-solid fa-lock"></i>
                    <h2>Bạn chưa đăng nhập</h2>
                    <p>Vui lòng đăng nhập để xem thông tin tài khoản.</p>
                    <Link to="/dang-nhap" className="btn-primary">
                        <i className="fa-solid fa-right-to-bracket"></i> Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    const submit = (e) => {
        e.preventDefault();
        updateProfile(form);
        toast.show("Đã cập nhật thông tin.", "success");
    };

    const onLogout = () => {
        logout();
        toast.show("Đã đăng xuất.", "info");
        nav("/", { replace: true });
    };

    return (
        <div className="container account-page">
            <nav className="breadcrumbs">
                <Link to="/">Trang chủ</Link>
                <i className="fa-solid fa-chevron-right"></i>
                <span>Tài khoản</span>
            </nav>

            <div className="account-layout">
                <aside className="account-sidebar">
                    <div className="account-card">
                        <div className="avatar">{(user.name || "U")[0].toUpperCase()}</div>
                        <div>
                            <strong>{user.name || "Khách hàng"}</strong>
                            <small>{user.email}</small>
                        </div>
                    </div>
                    <ul className="account-nav">
                        <li><NavLink to="/tai-khoan" end><i className="fa-solid fa-id-card"></i> Thông tin cá nhân</NavLink></li>
                        <li><NavLink to="/don-hang"><i className="fa-solid fa-box"></i> Đơn hàng của tôi</NavLink></li>
                        <li>
                            <button type="button" className="logout" onClick={onLogout}>
                                <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                            </button>
                        </li>
                    </ul>
                </aside>

                <main className="account-main">
                    <section className="profile-section">
                        <h2>Thông tin cá nhân</h2>
                        <form className="profile-form" onSubmit={submit}>
                            <div className="form-row">
                                <label>Họ và tên</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>Địa chỉ</label>
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-primary">
                                    <i className="fa-solid fa-floppy-disk"></i> Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Account;
