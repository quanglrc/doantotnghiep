import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "../../styles/Account.css";

const ChangePassword = () => {
    const { user, isLoggedIn, changePassword, logout } = useAuth();
    const toast = useToast();
    const nav = useNavigate();

    const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [show, setShow] = useState({ old: false, new: false, confirm: false });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isLoggedIn) {
        return (
            <div className="container account-page">
                <div className="auth-required">
                    <i className="fa-solid fa-lock"></i>
                    <h2>Bạn chưa đăng nhập</h2>
                    <p>Vui lòng đăng nhập để đổi mật khẩu.</p>
                    <Link to="/dang-nhap" className="btn-primary">
                        <i className="fa-solid fa-right-to-bracket"></i> Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

    const onLogout = () => {
        logout();
        toast.show("Đã đăng xuất.", "info");
        nav("/", { replace: true });
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.oldPassword) {
            setError("Vui lòng nhập mật khẩu hiện tại.");
            return;
        }
        if (form.newPassword.length < 6) {
            setError("Mật khẩu mới cần ít nhất 6 ký tự.");
            return;
        }
        if (form.newPassword === form.oldPassword) {
            setError("Mật khẩu mới phải khác mật khẩu cũ.");
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setSubmitting(true);
        const r = await changePassword({
            oldPassword: form.oldPassword,
            newPassword: form.newPassword,
        });
        setSubmitting(false);

        if (!r.ok) {
            setError(r.error || "Đổi mật khẩu thất bại.");
            return;
        }

        toast.show("Đổi mật khẩu thành công!", "success");
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    };

    // Đánh giá độ mạnh mật khẩu mới
    const strength = (() => {
        const p = form.newPassword;
        if (!p) return null;
        let s = 0;
        if (p.length >= 6) s++;
        if (p.length >= 10) s++;
        if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
        if (/\d/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return Math.min(s, 4);
    })();
    const strengthLabel = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh"];
    const strengthClass = ["very-weak", "weak", "medium", "good", "strong"];

    return (
        <div className="container account-page">
            <nav className="breadcrumbs">
                <Link to="/">Trang chủ</Link>
                <i className="fa-solid fa-chevron-right"></i>
                <Link to="/tai-khoan">Tài khoản</Link>
                <i className="fa-solid fa-chevron-right"></i>
                <span>Đổi mật khẩu</span>
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
                        <li><NavLink to="/doi-mat-khau"><i className="fa-solid fa-key"></i> Đổi mật khẩu</NavLink></li>
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
                        <h2>Đổi mật khẩu</h2>
                        <p className="muted-info">
                            <i className="fa-solid fa-circle-info"></i>
                            {" "}Mật khẩu nên dài tối thiểu 6 ký tự, có cả chữ và số để tăng bảo mật.
                        </p>

                        <form className="profile-form" onSubmit={submit}>
                            <div className="form-row">
                                <label>Mật khẩu hiện tại</label>
                                <div className="input-with-icon">
                                    <input
                                        type={show.old ? "text" : "password"}
                                        value={form.oldPassword}
                                        onChange={(e) => update("oldPassword", e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="toggle-pwd"
                                        onClick={() => toggle("old")}
                                        tabIndex={-1}
                                    >
                                        <i className={`fa-solid ${show.old ? "fa-eye-slash" : "fa-eye"}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="form-row">
                                <label>Mật khẩu mới</label>
                                <div className="input-with-icon">
                                    <input
                                        type={show.new ? "text" : "password"}
                                        value={form.newPassword}
                                        onChange={(e) => update("newPassword", e.target.value)}
                                        placeholder="Tối thiểu 6 ký tự"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-pwd"
                                        onClick={() => toggle("new")}
                                        tabIndex={-1}
                                    >
                                        <i className={`fa-solid ${show.new ? "fa-eye-slash" : "fa-eye"}`}></i>
                                    </button>
                                </div>
                                {strength !== null && (
                                    <div className={`pwd-strength s-${strengthClass[strength]}`}>
                                        <div className="pwd-bars">
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <span key={i} className={i <= strength ? "filled" : ""} />
                                            ))}
                                        </div>
                                        <small>{strengthLabel[strength]}</small>
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <label>Xác nhận mật khẩu mới</label>
                                <div className="input-with-icon">
                                    <input
                                        type={show.confirm ? "text" : "password"}
                                        value={form.confirmPassword}
                                        onChange={(e) => update("confirmPassword", e.target.value)}
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-pwd"
                                        onClick={() => toggle("confirm")}
                                        tabIndex={-1}
                                    >
                                        <i className={`fa-solid ${show.confirm ? "fa-eye-slash" : "fa-eye"}`}></i>
                                    </button>
                                </div>
                                {form.confirmPassword && form.newPassword && (
                                    <small className={form.newPassword === form.confirmPassword ? "match-ok" : "match-fail"}>
                                        <i className={`fa-solid ${form.newPassword === form.confirmPassword ? "fa-check" : "fa-xmark"}`}></i>
                                        {" "}{form.newPassword === form.confirmPassword ? "Mật khẩu khớp" : "Mật khẩu không khớp"}
                                    </small>
                                )}
                            </div>

                            {error && <div className="form-error">{error}</div>}

                            <div className="form-actions" style={{ display: "flex", gap: 10 }}>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? (
                                        <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                                    ) : (
                                        <><i className="fa-solid fa-floppy-disk"></i> Đổi mật khẩu</>
                                    )}
                                </button>
                                <Link to="/tai-khoan" className="btn-outline">
                                    Hủy
                                </Link>
                            </div>
                        </form>

                        <div className="forgot-hint">
                            <i className="fa-solid fa-circle-question"></i>
                            Quên mật khẩu hiện tại? <Link to="/quen-mat-khau">Đặt lại qua email</Link>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default ChangePassword;
