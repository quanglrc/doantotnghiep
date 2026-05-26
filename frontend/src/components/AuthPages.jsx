import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import "../styles/Auth.css";

const benefits = [
    { strong: "Tích điểm thành viên", rest: "đổi voucher mua sắm tới 500.000đ" },
    { strong: "Miễn phí giao hàng", rest: "cho mọi đơn hàng từ 500.000đ" },
    { strong: "Tặng voucher sinh nhật", rest: "đến 500.000đ cho thành viên" },
    { strong: "Trợ giá thu cũ", rest: "lên đời lên đến 1 triệu" },
    { strong: "Trả góp 0%", rest: "qua thẻ tín dụng và công ty tài chính" },
    { strong: "Bảo hành chính hãng", rest: "12-24 tháng tùy sản phẩm" },
];

const AuthShell = ({ children }) => (
    <div className="auth-shell">
        <aside className="auth-aside">
            <Link to="/" className="auth-back" aria-label="Về trang chủ">
                <i className="fa-solid fa-arrow-left"></i> Trang chủ
            </Link>

            <Link to="/" className="auth-logo">
                <span className="auth-logo-mark">Vi<span>Qi</span></span>
                <span className="auth-logo-sub">TECH</span>
            </Link>

            <h2>
                Tham gia hội viên <span className="hl">ViQiTech</span>
            </h2>
            <p className="auth-tagline">
                Để không bỏ lỡ các ưu đãi hấp dẫn dành riêng cho thành viên
            </p>

            <ul className="auth-benefits">
                {benefits.map((b, i) => (
                    <li key={i}>
                        <i className="fa-solid fa-gift"></i>
                        <span>
                            <strong>{b.strong}</strong> {b.rest}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="auth-mascot" aria-hidden="true">
                <div className="mascot-glow" />
                <i className="fa-solid fa-gifts"></i>
                <i className="fa-solid fa-star spark spark-1"></i>
                <i className="fa-solid fa-star spark spark-2"></i>
                <i className="fa-solid fa-star spark spark-3"></i>
            </div>
        </aside>

        <main className="auth-main">
            <div className="auth-form-card">{children}</div>
        </main>
    </div>
);



export const Login = () => {
    const { login, isLoggedIn, isAdmin } = useAuth();
    const toast = useToast();
    const nav = useNavigate();
    const loc = useLocation();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isLoggedIn) nav(isAdmin ? "/admin" : "/", { replace: true });
    }, [isLoggedIn, isAdmin, nav]);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.email.trim() || !form.password.trim()) {
            setError("Vui lòng nhập email và mật khẩu.");
            return;
        }
        setSubmitting(true);
        const r = await login(form);
        setSubmitting(false);
        if (!r.ok) {
            setError(r.error);
            return;
        }
        toast.show(`Chào mừng ${r.user.name}!`, "success");
        nav(r.user.role === "admin" ? "/admin" : loc.state?.from || "/", { replace: true });
    };

    const onSocial = (provider) => {
        toast.show(`Đăng nhập ${provider} đang được phát triển.`, "info");
    };

    return (
        <AuthShell>
            <h1>Đăng nhập</h1>
            <p className="auth-sub">Mua sắm dễ dàng hơn với tài khoản ViQiTech</p>

            <form onSubmit={submit} className="auth-form">
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
                    <div className="input-with-icon">
                        <input
                            type={showPwd ? "text" : "password"}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <button
                            type="button"
                            className="toggle-pwd"
                            onClick={() => setShowPwd((v) => !v)}
                            tabIndex={-1}
                            aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                            <i className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                    </div>
                </div>

                {error && <div className="form-error">{error}</div>}

                <button type="submit" className="btn-primary btn-full btn-lg" disabled={submitting}>
                    {submitting ? (
                        <><i className="fa-solid fa-spinner fa-spin"></i> Đang đăng nhập...</>
                    ) : "Đăng nhập"}
                </button>

                <div className="auth-forgot">
                    <Link to="/quen-mat-khau" className="link-btn">
                        Quên mật khẩu?
                    </Link>
                </div>
            </form>

            

            

            <div className="auth-hint">
                <i className="fa-solid fa-circle-info"></i> Tài khoản admin demo:{" "}
                <code>admin@viqitech.vn</code> / <code>admin123</code>
            </div>

            <div className="auth-foot">
                Bạn chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link>
            </div>
        </AuthShell>
    );
};

export const Register = () => {
    const { register, isLoggedIn } = useAuth();
    const toast = useToast();
    const nav = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [error, setError] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isLoggedIn) nav("/", { replace: true });
    }, [isLoggedIn, nav]);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc.");
            return;
        }
        if (form.password.length < 6) {
            setError("Mật khẩu cần ít nhất 6 ký tự.");
            return;
        }
        setSubmitting(true);
        const r = await register(form);
        setSubmitting(false);
        if (!r.ok) {
            setError(r.error);
            return;
        }
        toast.show("Tạo tài khoản thành công!", "success");
        nav("/", { replace: true });
    };

    const onSocial = (provider) => {
        toast.show(`Đăng ký ${provider} đang được phát triển.`, "info");
    };

    return (
        <AuthShell>
            <h1>Đăng ký</h1>
            <p className="auth-sub">Tạo tài khoản ViQiTech trong 30 giây</p>

            <form onSubmit={submit} className="auth-form">
                <div className="form-row">
                    <label>Họ và tên *</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        autoFocus
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
                    <div className="input-with-icon">
                        <input
                            type={showPwd ? "text" : "password"}
                            placeholder="Tối thiểu 6 ký tự"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <button
                            type="button"
                            className="toggle-pwd"
                            onClick={() => setShowPwd((v) => !v)}
                            tabIndex={-1}
                            aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                            <i className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                    </div>
                </div>

                {error && <div className="form-error">{error}</div>}

                <button type="submit" className="btn-primary btn-full btn-lg" disabled={submitting}>
                    {submitting ? (
                        <><i className="fa-solid fa-spinner fa-spin"></i> Đang tạo tài khoản...</>
                    ) : "Tạo tài khoản"}
                </button>
            </form>

            

            <div className="auth-foot">
                Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
            </div>
        </AuthShell>
    );
};

// ============================================================
// QUÊN MẬT KHẨU - Bước 1: nhập email, nhận link reset
// ============================================================
export const ForgotPassword = () => {
    const toast = useToast();
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null); // { resetLink, expiresIn } cho demo

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email.trim()) {
            setError("Vui lòng nhập email.");
            return;
        }
        setSubmitting(true);
        try {
            const r = await api.post("/auth/forgot-password", { email: email.trim() }, { auth: false });
            setResult(r);
            if (r.demo?.found) {
                toast.show("Đã tạo link đặt lại mật khẩu.", "success");
            } else {
                toast.show("Nếu email tồn tại, link đã được gửi.", "info");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(result.demo.resetLink);
            toast.show("Đã copy link.", "success");
        } catch {
            toast.show("Không copy được, hãy chọn và copy thủ công.", "error");
        }
    };

    return (
        <AuthShell>
            <h1>Quên mật khẩu</h1>
            <p className="auth-sub">
                {result
                    ? "Link đặt lại mật khẩu đã được tạo."
                    : "Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu."}
            </p>

            {!result ? (
                <form onSubmit={submit} className="auth-form">
                    <div className="form-row">
                        <label>Email tài khoản</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            autoFocus
                        />
                    </div>

                    {error && <div className="form-error">{error}</div>}

                    <button type="submit" className="btn-primary btn-full btn-lg" disabled={submitting}>
                        {submitting ? (
                            <><i className="fa-solid fa-spinner fa-spin"></i> Đang gửi...</>
                        ) : (
                            <><i className="fa-solid fa-paper-plane"></i> Gửi link đặt lại</>
                        )}
                    </button>
                </form>
            ) : (
                <div className="reset-result">
                    {result.demo?.found ? (
                        <>
                            <div className="reset-success">
                                <i className="fa-solid fa-circle-check"></i>
                                <div>
                                    <strong>Email tồn tại!</strong>
                                    <small>Link có hiệu lực trong {result.demo.expiresIn}</small>
                                </div>
                            </div>

                            <div className="reset-link-box">
                                <label>Link đặt lại mật khẩu của bạn:</label>
                                <div className="reset-link-row">
                                    <input
                                        type="text"
                                        readOnly
                                        value={result.demo.resetLink}
                                        onClick={(e) => e.target.select()}
                                    />
                                    <button type="button" onClick={copyLink} title="Copy">
                                        <i className="fa-solid fa-copy"></i>
                                    </button>
                                </div>
                                <Link
                                    to={result.demo.resetLink.replace(/^https?:\/\/[^/]+/, "")}
                                    className="btn-primary btn-full"
                                    style={{ marginTop: 12 }}
                                >
                                    <i className="fa-solid fa-key"></i> Mở trang đặt lại mật khẩu
                                </Link>
                            </div>

                            <div className="reset-note">
                                <i className="fa-solid fa-circle-info"></i>
                                <span>
                                    <strong>Lưu ý (Demo):</strong> Trong môi trường thật, link này sẽ được gửi qua email cho bạn.
                                    Ở chế độ demo, link hiển thị trực tiếp để dễ test.
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="reset-info-box">
                            <i className="fa-solid fa-envelope-circle-check"></i>
                            <p>
                                Nếu email <b>{email}</b> tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.
                                Vui lòng kiểm tra hộp thư.
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        className="btn-outline btn-full"
                        style={{ marginTop: 12 }}
                        onClick={() => {
                            setResult(null);
                            setEmail("");
                        }}
                    >
                        <i className="fa-solid fa-rotate-left"></i> Thử email khác
                    </button>
                </div>
            )}

            <div className="auth-foot">
                Nhớ mật khẩu? <Link to="/dang-nhap">Đăng nhập</Link>
                {" · "}
                <Link to="/dang-ky">Đăng ký</Link>
            </div>
        </AuthShell>
    );
};

// ============================================================
// QUÊN MẬT KHẨU - Bước 2: nhập mật khẩu mới với token từ URL
// ============================================================
export const ResetPassword = () => {
    const [params] = useSearchParams();
    const token = params.get("token");
    const nav = useNavigate();
    const toast = useToast();

    const [verifying, setVerifying] = useState(true);
    const [tokenError, setTokenError] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");

    const [pwd, setPwd] = useState("");
    const [pwd2, setPwd2] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!token) {
            setTokenError("Link không hợp lệ (thiếu token).");
            setVerifying(false);
            return;
        }
        api.get("/auth/reset-password/verify", { query: { token }, auth: false })
            .then((r) => {
                if (r.ok) {
                    const e = r.email || "";
                    const [a, b] = e.split("@");
                    setMaskedEmail(
                        a ? `${a.slice(0, 2)}${"*".repeat(Math.max(1, a.length - 2))}@${b || ""}` : e
                    );
                } else {
                    setTokenError(r.error || "Token không hợp lệ.");
                }
            })
            .catch((err) => setTokenError(err.message))
            .finally(() => setVerifying(false));
    }, [token]);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (pwd.length < 6) {
            setError("Mật khẩu cần ít nhất 6 ký tự.");
            return;
        }
        if (pwd !== pwd2) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }
        setSubmitting(true);
        try {
            await api.post("/auth/reset-password", { token, newPassword: pwd }, { auth: false });
            setDone(true);
            toast.show("Đặt lại mật khẩu thành công!", "success");
            setTimeout(() => nav("/dang-nhap", { replace: true }), 2500);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (verifying) {
        return (
            <AuthShell>
                <div className="reset-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra link...
                </div>
            </AuthShell>
        );
    }

    if (tokenError) {
        return (
            <AuthShell>
                <h1>Liên kết không hợp lệ</h1>
                <div className="reset-error-box">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <p>{tokenError}</p>
                </div>
                <Link to="/quen-mat-khau" className="btn-primary btn-full btn-lg" style={{ marginTop: 16 }}>
                    <i className="fa-solid fa-rotate-left"></i> Tạo lại link đặt mật khẩu
                </Link>
                <div className="auth-foot">
                    <Link to="/dang-nhap">Quay lại đăng nhập</Link>
                </div>
            </AuthShell>
        );
    }

    if (done) {
        return (
            <AuthShell>
                <div className="reset-done">
                    <div className="reset-done-icon">
                        <i className="fa-solid fa-circle-check"></i>
                    </div>
                    <h1>Thành công!</h1>
                    <p>Mật khẩu của bạn đã được đặt lại. Đang chuyển đến trang đăng nhập...</p>
                    <Link to="/dang-nhap" className="btn-primary btn-full btn-lg">
                        Đăng nhập ngay
                    </Link>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <h1>Đặt lại mật khẩu</h1>
            <p className="auth-sub">
                Nhập mật khẩu mới cho tài khoản <strong>{maskedEmail}</strong>
            </p>

            <form onSubmit={submit} className="auth-form">
                <div className="form-row">
                    <label>Mật khẩu mới</label>
                    <div className="input-with-icon">
                        <input
                            type={showPwd ? "text" : "password"}
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            placeholder="Tối thiểu 6 ký tự"
                            autoFocus
                        />
                        <button
                            type="button"
                            className="toggle-pwd"
                            onClick={() => setShowPwd((v) => !v)}
                            tabIndex={-1}
                        >
                            <i className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                    </div>
                </div>

                <div className="form-row">
                    <label>Xác nhận mật khẩu</label>
                    <input
                        type={showPwd ? "text" : "password"}
                        value={pwd2}
                        onChange={(e) => setPwd2(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                    />
                </div>

                {error && <div className="form-error">{error}</div>}

                <button type="submit" className="btn-primary btn-full btn-lg" disabled={submitting}>
                    {submitting ? (
                        <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                    ) : (
                        <><i className="fa-solid fa-key"></i> Đặt lại mật khẩu</>
                    )}
                </button>
            </form>

            <div className="auth-foot">
                <Link to="/dang-nhap">← Quay lại đăng nhập</Link>
            </div>
        </AuthShell>
    );
};
