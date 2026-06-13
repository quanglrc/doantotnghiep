import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrdersContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { formatPrice } from "../data/products";
import "../styles/Checkout.css";

const PROVINCES = [
    "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
    "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
    "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước",
    "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông",
    "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang",
    "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình",
    "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
    "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
    "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên",
    "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
    "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
    "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang",
    "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

const PAYMENT_METHODS = [
    {
        id: "cod",
        label: "Thanh toán khi nhận hàng (COD)",
        desc: "Bạn chỉ thanh toán khi nhận được hàng tại nhà",
        icon: "fa-money-bill-wave",
        color: "#16a34a",
    },
    {
        id: "qr",
        label: "Chuyển khoản mã QR",
        desc: "Quét mã QR qua ứng dụng ngân hàng",
        icon: "fa-qrcode",
        color: "#1e6fff",
    },
    {
        id: "vnpay",
        label: "Thanh toán VNPay",
        desc: "Thanh toán qua cổng VNPay (ATM/Visa/Mastercard)",
        icon: "fa-credit-card",
        color: "#005BAA",
    },
];

const Checkout = () => {
    const { user, isLoggedIn } = useAuth();
    const { items, subtotal, clear } = useCart();
    const { createOrder } = useOrders();
    const toast = useToast();
    const nav = useNavigate();

    const [form, setForm] = useState(() => ({
        name: user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
        province: "TP. Hồ Chí Minh",
        district: "",
        addressDetail: user?.address || "",
        deliveryMethod: "home", // home | store
        storeBranch: "",
        paymentMethod: "cod",
        note: "",
        voucherCode: "",
        agreedTerms: true,
    }));
    const [voucherApplied, setVoucherApplied] = useState(null);
    const [applyingVoucher, setApplyingVoucher] = useState(false);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Phí ship
    const isFreeShipVoucher = voucherApplied?.voucher?.discount_type === "freeship";
    const baseShipping = form.deliveryMethod === "store" ? 0 : (subtotal >= 500000 ? 0 : 30000);
    const shipping = isFreeShipVoucher ? 0 : baseShipping;
    const discount = isFreeShipVoucher ? 0 : (voucherApplied?.discount || 0);
    const total = Math.max(0, subtotal + shipping - discount);

    // Hooks must run before any early return — keep these here
    useEffect(() => {
        document.title = "Thanh toán — ViQiTech";
        return () => { document.title = "ViQiTech"; };
    }, []);

    // Load các voucher đang còn hiệu lực để gợi ý
    useEffect(() => {
        api.get("/vouchers", { query: { active: 1 }, auth: false })
            .then((vs) => setAvailableVouchers(vs))
            .catch(() => { /* ignore */ });
    }, []);

    if (!isLoggedIn) return <Navigate to="/dang-nhap" state={{ from: "/thanh-toan" }} replace />;
    if (items.length === 0) return <Navigate to="/gio-hang" replace />;

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const applyVoucher = async (codeArg) => {
        const code = (codeArg || form.voucherCode).trim().toUpperCase();
        if (!code) {
            toast.show("Nhập mã voucher.", "error");
            return;
        }
        setApplyingVoucher(true);
        try {
            const r = await api.post("/vouchers/validate", { code, subtotal }, { auth: false });
            setVoucherApplied(r);
            update("voucherCode", code);
            toast.show(`Đã áp dụng: ${r.voucher.label}`, "success");
        } catch (err) {
            toast.show(err.message || "Mã không hợp lệ.", "error");
        } finally {
            setApplyingVoucher(false);
        }
    };

    const removeVoucher = () => {
        setVoucherApplied(null);
        update("voucherCode", "");
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.name.trim() || !form.phone.trim()) {
            setError("Vui lòng nhập họ tên và số điện thoại.");
            return;
        }
        if (!/^0\d{9,10}$/.test(form.phone.replace(/\s/g, ""))) {
            setError("Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0).");
            return;
        }
        if (form.deliveryMethod === "home") {
            if (!form.district.trim() || !form.addressDetail.trim()) {
                setError("Vui lòng nhập đầy đủ địa chỉ giao hàng.");
                return;
            }
        }
        if (!form.agreedTerms) {
            setError("Bạn cần đồng ý với điều khoản trước khi đặt hàng.");
            return;
        }

        const fullAddress =
            form.deliveryMethod === "store"
                ? `Nhận tại cửa hàng: ${form.storeBranch || "ViQiTech 123 Nguyễn Văn Cừ, Q.5, TP.HCM"}`
                : `${form.addressDetail}, ${form.district}, ${form.province}`;

        setSubmitting(true);
        const r = await createOrder({
            items,
            subtotal,
            shipping,
            discount,
            total,
            customer: {
                name: form.name.trim(),
                email: form.email.trim() || user.email,
                phone: form.phone.replace(/\s/g, ""),
                address: fullAddress,
            },
            paymentMethod: form.paymentMethod,
            note: form.note.trim() || null,
            voucherCode: voucherApplied?.voucher?.code || null,
        });
        setSubmitting(false);

        if (!r.ok) {
            setError(r.error || "Đặt hàng thất bại. Vui lòng thử lại.");
            return;
        }

        if (form.paymentMethod === "vnpay") {
            try {
                const res = await api.post("/payment/vnpay/create-payment-url", { orderId: r.order.id, amount: total });
                if (res.paymentUrl) {
                    clear(); // Xóa giỏ hàng ngay khi tạo đơn thành công và chuẩn bị sang VNPay
                    window.location.href = res.paymentUrl;
                    return;
                }
            } catch (err) {
                toast.show("Không thể tạo liên kết thanh toán VNPay.", "error");
            }
        }

        toast.show("Đặt hàng thành công!", "success");
        clear();
        if (form.paymentMethod === "cod") {
            nav("/don-hang", { replace: true });
        } else {
            nav(`/dat-hang-thanh-cong/${r.order.id}`, { replace: true });
        }
    };

    return (
        <div className="checkout-page">
            <div className="checkout-stepper container">
                <div className="step done">
                    <span className="step-circle"><i className="fa-solid fa-check"></i></span>
                    <span>Giỏ hàng</span>
                </div>
                <span className="step-line done" />
                <div className="step current">
                    <span className="step-circle">2</span>
                    <span>Thông tin & thanh toán</span>
                </div>
                <span className="step-line" />
                <div className="step">
                    <span className="step-circle">3</span>
                    <span>Hoàn tất</span>
                </div>
            </div>

            <div className="container checkout-layout">
                <form onSubmit={submit} className="checkout-main">
                    {/* 1. Customer info */}
                    <section className="ck-card">
                        <h3 className="ck-card-title">
                            <i className="fa-solid fa-user"></i> Thông tin người nhận
                        </h3>
                        <div className="ck-grid-2">
                            <div className="form-row">
                                <label>Họ và tên <span className="req">*</span></label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => update("name", e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            <div className="form-row">
                                <label>Số điện thoại <span className="req">*</span></label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => update("phone", e.target.value)}
                                    placeholder="0912 345 678"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <label>Email (để nhận hoá đơn)</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => update("email", e.target.value)}
                                placeholder="email@example.com"
                            />
                        </div>
                    </section>

                    {/* 2. Delivery method */}
                    <section className="ck-card">
                        <h3 className="ck-card-title">
                            <i className="fa-solid fa-truck-fast"></i> Hình thức nhận hàng
                        </h3>
                        <div className="ck-radio-group">
                            <label className={`ck-radio-card ${form.deliveryMethod === "home" ? "active" : ""}`}>
                                <input
                                    type="radio"
                                    name="delivery"
                                    checked={form.deliveryMethod === "home"}
                                    onChange={() => update("deliveryMethod", "home")}
                                />
                                <i className="fa-solid fa-house-chimney"></i>
                                <div>
                                    <strong>Giao tận nơi</strong>
                                    <small>Nhận hàng tại địa chỉ của bạn</small>
                                </div>
                            </label>
                            <label className={`ck-radio-card ${form.deliveryMethod === "store" ? "active" : ""}`}>
                                <input
                                    type="radio"
                                    name="delivery"
                                    checked={form.deliveryMethod === "store"}
                                    onChange={() => update("deliveryMethod", "store")}
                                />
                                <i className="fa-solid fa-store"></i>
                                <div>
                                    <strong>Nhận tại cửa hàng</strong>
                                    <small>Tới ViQiTech lấy hàng (tiết kiệm phí ship)</small>
                                </div>
                            </label>
                        </div>

                        {form.deliveryMethod === "home" ? (
                            <>
                                <div className="ck-grid-2" style={{ marginTop: 16 }}>
                                    <div className="form-row">
                                        <label>Tỉnh / Thành phố <span className="req">*</span></label>
                                        <select
                                            value={form.province}
                                            onChange={(e) => update("province", e.target.value)}
                                        >
                                            {PROVINCES.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <label>Quận / Huyện <span className="req">*</span></label>
                                        <input
                                            type="text"
                                            value={form.district}
                                            onChange={(e) => update("district", e.target.value)}
                                            placeholder="Quận 1"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <label>Địa chỉ chi tiết <span className="req">*</span></label>
                                    <input
                                        type="text"
                                        value={form.addressDetail}
                                        onChange={(e) => update("addressDetail", e.target.value)}
                                        placeholder="Số nhà, tên đường, phường/xã"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="form-row" style={{ marginTop: 16 }}>
                                <label>Chọn cửa hàng</label>
                                <select
                                    value={form.storeBranch}
                                    onChange={(e) => update("storeBranch", e.target.value)}
                                >
                                    <option value="">ViQiTech 123 Nguyễn Văn Cừ, Q.5, TP.HCM (mặc định)</option>
                                    <option>ViQiTech 456 Cách Mạng Tháng 8, Q.10, TP.HCM</option>
                                    <option>ViQiTech 78 Bà Triệu, Hai Bà Trưng, Hà Nội</option>
                                    <option>ViQiTech 12 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</option>
                                </select>
                                <small className="ck-hint">
                                    <i className="fa-solid fa-circle-info"></i> Bạn sẽ nhận email/sms khi hàng sẵn sàng (thường trong 2 giờ).
                                </small>
                            </div>
                        )}
                    </section>

                    {/* 3. Payment method */}
                    <section className="ck-card">
                        <h3 className="ck-card-title">
                            <i className="fa-solid fa-credit-card"></i> Phương thức thanh toán
                        </h3>
                        <div className="ck-payments">
                            {PAYMENT_METHODS.map((p) => (
                                <label
                                    key={p.id}
                                    className={`ck-payment ${form.paymentMethod === p.id ? "active" : ""}`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={form.paymentMethod === p.id}
                                        onChange={() => update("paymentMethod", p.id)}
                                    />
                                    <span className="pm-icon" style={{ background: p.color }}>
                                        <i className={`fa-solid ${p.icon}`}></i>
                                    </span>
                                    <div className="pm-text">
                                        <strong>{p.label}</strong>
                                        <small>{p.desc}</small>
                                    </div>
                                    <span className="pm-check">
                                        <i className="fa-solid fa-check"></i>
                                    </span>
                                </label>
                            ))}
                        </div>

                        {form.paymentMethod === "qr" && (
                            <div className="ck-info-box">
                                <strong>Thông tin chuyển khoản:</strong>
                                <div>Ngân hàng: <b>Vietcombank</b> — Chủ TK: <b>CONG TY VIQITECH</b></div>
                                <div>Số TK: <b>0123 4567 89</b> — Nội dung: <b>VQ [SĐT người nhận]</b></div>
                            </div>
                        )}
                        {form.paymentMethod === "vnpay" && (
                            <div className="ck-info-box">
                                Bạn sẽ được chuyển sang cổng thanh toán VNPay sau khi bấm Đặt hàng để hoàn tất thanh toán.
                            </div>
                        )}
                    </section>

                    {/* 4. Note */}
                    <section className="ck-card">
                        <h3 className="ck-card-title">
                            <i className="fa-solid fa-note-sticky"></i> Ghi chú đơn hàng (tuỳ chọn)
                        </h3>
                        <textarea
                            rows={3}
                            value={form.note}
                            onChange={(e) => update("note", e.target.value)}
                            placeholder="Ví dụ: Giao buổi chiều, gọi trước khi tới..."
                            className="ck-textarea"
                        />
                    </section>

                    {error && <div className="form-error">{error}</div>}
                </form>

                {/* Sidebar summary */}
                <aside className="checkout-sidebar">
                    <div className="ck-card cs-card">
                        <h3 className="ck-card-title">
                            Đơn hàng <span className="ck-badge">{items.length}</span>
                        </h3>

                        <ul className="cs-items">
                            {items.map((it) => (
                                <li key={it.id}>
                                    <img src={it.image} alt={it.name} />
                                    <div className="cs-item-info">
                                        <div className="cs-item-name">{it.name}</div>
                                        <small>SL: {it.qty}</small>
                                    </div>
                                    <strong>{formatPrice(it.price * it.qty)}</strong>
                                </li>
                            ))}
                        </ul>

                        <div className="cs-voucher">
                            {voucherApplied ? (
                                <div className="cs-voucher-applied">
                                    <i className="fa-solid fa-ticket"></i>
                                    <div>
                                        <strong>{voucherApplied.voucher.code}</strong>
                                        <small>{voucherApplied.voucher.label}</small>
                                    </div>
                                    <button type="button" onClick={removeVoucher} aria-label="Xoá voucher">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            ) : (
                                <div className="cs-voucher-input">
                                    <input
                                        type="text"
                                        value={form.voucherCode}
                                        onChange={(e) => update("voucherCode", e.target.value.toUpperCase())}
                                        placeholder="Nhập mã voucher"
                                        disabled={applyingVoucher}
                                    />
                                    <button type="button" onClick={() => applyVoucher()} disabled={applyingVoucher}>
                                        {applyingVoucher ? <i className="fa-solid fa-spinner fa-spin"></i> : "Áp dụng"}
                                    </button>
                                </div>
                            )}
                            {!voucherApplied && availableVouchers.length > 0 && (
                                <div className="cs-voucher-list">
                                    <small className="ck-hint">
                                        <i className="fa-solid fa-tag"></i> Mã đang khả dụng:
                                    </small>
                                    <div className="cs-voucher-chips">
                                        {availableVouchers.slice(0, 4).map((v) => (
                                            <button
                                                type="button"
                                                key={v.id}
                                                className="cs-voucher-chip"
                                                onClick={() => applyVoucher(v.code)}
                                                title={v.label}
                                            >
                                                {v.code}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="cs-rows">
                            <div><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
                            <div>
                                <span>Phí vận chuyển</span>
                                <span>{shipping === 0 ? <em className="free">Miễn phí</em> : formatPrice(shipping)}</span>
                            </div>
                            {discount > 0 && (
                                <div>
                                    <span>Giảm giá voucher</span>
                                    <span className="discount-amount">-{formatPrice(discount)}</span>
                                </div>
                            )}
                            <div className="cs-total">
                                <span>Tổng cộng</span>
                                <strong>{formatPrice(total)}</strong>
                            </div>
                            <small className="cs-vat">(đã bao gồm VAT nếu có)</small>
                        </div>

                        <label className="cs-terms">
                            <input
                                type="checkbox"
                                checked={form.agreedTerms}
                                onChange={(e) => update("agreedTerms", e.target.checked)}
                            />
                            <span>
                                Tôi đồng ý với <a href="#" onClick={(e) => e.preventDefault()}>Điều khoản dịch vụ</a> và{" "}
                                <a href="#" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a> của ViQiTech.
                            </span>
                        </label>

                        <button
                            type="button"
                            className="btn-checkout"
                            onClick={submit}
                            disabled={submitting || !form.agreedTerms}
                        >
                            {submitting ? (
                                <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                            ) : (
                                <>ĐẶT HÀNG <i className="fa-solid fa-arrow-right"></i></>
                            )}
                        </button>

                        <Link to="/gio-hang" className="cs-back">
                            <i className="fa-solid fa-arrow-left"></i> Quay lại giỏ hàng
                        </Link>
                    </div>

                    <div className="cs-trust">
                        <div><i className="fa-solid fa-shield-halved"></i> Hàng chính hãng 100%</div>
                        <div><i className="fa-solid fa-rotate-left"></i> Đổi trả miễn phí 30 ngày</div>
                        <div><i className="fa-solid fa-truck-fast"></i> Giao nhanh 24h nội thành</div>
                        <div><i className="fa-solid fa-headset"></i> Hotline 1900 1234</div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Checkout;
