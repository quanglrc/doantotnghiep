import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/Auth.css";

export const Login = () => {
    const { login } = useAuth();
    const toast = useToast();
    const nav = useNavigate();
    const loc = useLocation();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");

    const submit = (e) => {
        e.preventDefault();
        setError("");
        if (!form.email.trim() || !form.password.trim()) {
            setError("Vui lòng nhập email và mật khẩu.");
            return;
        }
        const r = login(form);
        if (!r.ok) {
            setError(r.error);
            return;
        }
        toast.show(`Chào mừng ${r.user.name}!`, "success");
        if (r.user.role === "admin") {
            nav("/admin", { replace: true });
        } else {
            nav(loc.state?.from || "/", { replace: true });
        }
    };

    return (
        <div className="container auth-page">
            <div className="auth-card">
                <h1>Đăng nhập</h1>
                <p className="auth-sub">Mua sắm dễ dàng hơn với tài khoản ViQiTech</p>

                <form onSubmit={submit}>
                    <div className="form-row">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div className="form-row">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    {error && <div className="form-error">{error}</div>}
                    <button type="submit" className="btn-primary btn-full">
                        Đăng nhập
                    </button>
                </form>

                <div className="auth-hint">
                    <i className="fa-solid fa-circle-info"></i> Tài khoản admin demo:{" "}
                    <code>admin@viqitech.vn</code> / <code>admin123</code>
                </div>

                <div className="auth-foot">
                    Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
};

export const Register = () => {
    const { register } = useAuth();
    const toast = useToast();
    const nav = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [error, setError] = useState("");

    const submit = (e) => {
        e.preventDefault();
        setError("");
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc.");
            return;
        }
        const r = register(form);
        if (!r.ok) {
            setError(r.error);
            return;
        }
        toast.show("Tạo tài khoản thành công!", "success");
        nav("/", { replace: true });
    };

    return (
        <div className="container auth-page">
            <div className="auth-card">
                <h1>Đăng ký</h1>
                <p className="auth-sub">Tạo tài khoản ViQiTech trong 30 giây</p>

                <form onSubmit={submit}>
                    <div className="form-row">
                        <label>Họ và tên *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="form-row">
                        <label>Email *</label>
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
                        <label>Mật khẩu *</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    {error && <div className="form-error">{error}</div>}
                    <button type="submit" className="btn-primary btn-full">
                        Tạo tài khoản
                    </button>
                </form>

                <div className="auth-foot">
                    Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};
