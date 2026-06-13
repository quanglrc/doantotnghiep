import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useOrders } from "../context/OrdersContext";

const VNPayReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clear } = useCart();
    const toast = useToast();
    const [status, setStatus] = useState("processing"); // processing, success, error
    const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");
    const [orderId, setOrderId] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const called = useRef(false);

    const { cancelOrder, refresh } = useOrders();

    useEffect(() => {
        if (called.current) return;
        called.current = true;

        const verifyPayment = async () => {
            try {
                // Chuyển searchParams thành object
                const params = Object.fromEntries([...searchParams]);
                
                const res = await api.get("/payment/vnpay/verify", { query: params });
                
                if (res.success) {
                    setStatus("success");
                    setMessage("Thanh toán thành công! Đơn hàng của bạn đã được ghi nhận.");
                    setOrderId(res.orderId);
                    clear(); // Xóa giỏ hàng khi thanh toán thành công
                    await refresh(); // Làm mới danh sách đơn hàng để cập nhật trạng thái
                    // Chuyển hướng tới trang đặt hàng thành công sau 3 giây
                    setTimeout(() => {
                        navigate(`/dat-hang-thanh-cong/${res.orderId}`, { replace: true });
                    }, 3000);
                }
            } catch (err) {
                setStatus("error");
                setMessage(err.error || err.message || "Giao dịch không thành công hoặc đã bị hủy.");
                setOrderId(err.orderId || searchParams.get("vnp_TxnRef"));
            }
        };

        verifyPayment();
    }, [searchParams, navigate, clear, refresh]);

    const handleCancelOrder = async () => {
        if (!window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
        
        const r = await cancelOrder(orderId, "Khách hủy sau khi thanh toán thất bại");
        if (r.ok) {
            toast.show("Đã hủy đơn hàng.", "info");
            navigate("/don-hang", { replace: true });
        } else {
            toast.show(r.error || "Hủy đơn thất bại.", "error");
        }
    };

    const handleRetryVNPay = async () => {
        try {
            toast.show("Đang lấy thông tin đơn hàng...", "info");
            const order = await api.get(`/orders/${orderId}`);
            const res = await api.post("/payment/vnpay/create-payment-url", { orderId: order.id, amount: order.total });
            if (res.paymentUrl) {
                window.location.href = res.paymentUrl;
            }
        } catch (err) {
            toast.show("Lỗi khi tạo lại liên kết thanh toán.", "error");
        }
    };

    const handleChangePaymentMethod = async (method) => {
        try {
            await api.patch(`/orders/${orderId}/payment-method`, { paymentMethod: method });
            await refresh(); // Làm mới danh sách đơn hàng
            toast.show("Đã cập nhật phương thức thanh toán.", "success");
            navigate(`/dat-hang-thanh-cong/${orderId}`, { replace: true });
        } catch (err) {
            toast.show(err.message || "Lỗi khi đổi phương thức thanh toán.", "error");
        }
    };

    return (
        <div className="container" style={{ padding: "100px 20px", textAlign: "center", minHeight: "60vh" }}>
            <div style={{ maxWidth: 500, margin: "0 auto", padding: 30, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", background: "#fff" }}>
                {status === "processing" && (
                    <>
                        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 48, color: "#005BAA", marginBottom: 20 }}></i>
                        <h3>Đang xử lý giao dịch...</h3>
                        <p style={{ color: "#666", marginTop: 10 }}>Vui lòng không đóng trình duyệt trong lúc này.</p>
                    </>
                )}
                
                {status === "success" && (
                    <>
                        <i className="fa-regular fa-circle-check" style={{ fontSize: 56, color: "#16a34a", marginBottom: 20 }}></i>
                        <h3 style={{ color: "#16a34a" }}>Giao dịch thành công</h3>
                        <p style={{ color: "#666", marginTop: 10, marginBottom: 20 }}>{message}</p>
                        <p style={{ fontSize: 14, color: "#888" }}>Đang tự động chuyển hướng...</p>
                    </>
                )}

                {status === "error" && !showOptions && (
                    <>
                        <i className="fa-regular fa-circle-xmark" style={{ fontSize: 56, color: "#dc2626", marginBottom: 20 }}></i>
                        <h3 style={{ color: "#dc2626" }}>Thanh toán chưa hoàn tất</h3>
                        <p style={{ color: "#666", marginTop: 10, marginBottom: 20 }}>{message}</p>
                        
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
                            <button onClick={handleCancelOrder} className="btn" style={{ background: "#f1f5f9", color: "#dc2626", padding: "10px 20px", borderRadius: 6, border: "none", fontWeight: 500, cursor: "pointer" }}>
                                Hủy đơn hàng
                            </button>
                            <button onClick={() => setShowOptions(true)} className="btn" style={{ background: "#005BAA", color: "#fff", padding: "10px 20px", borderRadius: 6, border: "none", fontWeight: 500, cursor: "pointer" }}>
                                Tiếp tục thanh toán
                            </button>
                        </div>
                    </>
                )}

                {status === "error" && showOptions && (
                    <div style={{ textAlign: "left" }}>
                        <h3 style={{ marginBottom: 20, textAlign: "center" }}>Tiếp tục thanh toán</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <button onClick={handleRetryVNPay} style={{ padding: 15, borderRadius: 8, border: "1px solid #005BAA", background: "#f0f8ff", cursor: "pointer", textAlign: "left", fontWeight: 500, color: "#005BAA" }}>
                                <i className="fa-solid fa-qrcode" style={{ width: 24, marginRight: 10 }}></i> 
                                Giữ nguyên phương thức ban đầu (Thử lại VNPay)
                            </button>
                            <button onClick={() => handleChangePaymentMethod("cod")} style={{ padding: 15, borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", textAlign: "left", fontWeight: 500 }}>
                                <i className="fa-solid fa-money-bill-wave" style={{ width: 24, color: "#16a34a", marginRight: 10 }}></i> 
                                Đổi sang: Thanh toán khi nhận hàng (COD)
                            </button>
                            <button onClick={() => handleChangePaymentMethod("bank")} style={{ padding: 15, borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", textAlign: "left", fontWeight: 500 }}>
                                <i className="fa-solid fa-building-columns" style={{ width: 24, color: "#1e6fff", marginRight: 10 }}></i> 
                                Đổi sang: Chuyển khoản ngân hàng
                            </button>
                            <button onClick={() => setShowOptions(false)} style={{ padding: 15, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#666", textAlign: "center" }}>
                                Quay lại
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VNPayReturn;
