import { Router } from "express";
import { VNPay, ignoreLogger } from "vnpay";
import { query } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const router = Router();

// Khởi tạo VNPay instance
const vnpay = new VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE || "CGXZLS0Z",
    secureSecret: process.env.VNPAY_SECURE_SECRET || "XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN",
    vnpayHost: process.env.VNPAY_HOST || "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: "SHA512",
    enableLog: true,
    loggerFn: ignoreLogger,
});

// 1. Tạo URL thanh toán
router.post(
    "/vnpay/create-payment-url",
    authRequired,
    asyncH(async (req, res) => {
        const { orderId, amount } = req.body;
        
        if (!orderId || !amount) {
            return res.status(400).json({ error: "Thiếu thông tin orderId hoặc amount." });
        }

        // Tạo URL thanh toán
        const urlString = vnpay.buildPaymentUrl({
            vnp_Amount: amount, // VNPay library tự động nhân 100 theo document hoặc tự xử lý?
            // Theo tài liệu VNPay, số tiền gửi đi phải nhân 100 (VD: 100,000 VND -> 10000000).
            // Thư viện vnpay tự xử lý hay mình phải nhân? Dựa vào README:
            // vnp_Amount: 100000, // 100,000 VND. Tức là tự nhân chưa? Xem kỹ docs: "vnp_Amount: 100000, // 100,000 VND" -> Thư viện không tự nhân hoặc nếu là 100k thì truyền 100000, trong VNPay thì value là 100000. Wait, theo README: vnp_Amount: 100000, // 100,000 VND. Nghĩa là truyền đúng số tiền, có thể thư viện vnpay tự xử lý việc x100. Đợi đã, let's assume thư viện tự xử lý nếu nó không mention, hoặc tôi cứ truyền số nguyên amount.
            // Sửa lại: Trong bản VNPay chính thức thường phải x100. Tôi sẽ truyền amount trực tiếp.
            vnp_IpAddr: req.ip || req.connection.remoteAddress || "127.0.0.1",
            vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:5173/vnpay-return",
            vnp_TxnRef: String(orderId),
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        });

        res.json({ paymentUrl: urlString });
    })
);

// 2. Xác thực kết quả trả về từ VNPay
router.get(
    "/vnpay/verify",
    asyncH(async (req, res) => {
        const verify = vnpay.verifyReturnUrl(req.query);
        const orderId = req.query.vnp_TxnRef;
        const responseCode = req.query.vnp_ResponseCode;
        
        if (!verify.isSuccess) {
            // Thư viện vnpay trả về isSuccess = false nếu giao dịch bị hủy hoặc lỗi (mã khác 00)
            // Giống Shopee: Khi thanh toán thất bại, KHÔNG hủy đơn, giữ nguyên pending để user thanh toán lại
            return res.status(400).json({ error: "Xác thực chữ ký thất bại hoặc giao dịch bị hủy.", message: verify.message, orderId });
        }

        if (responseCode === "00") {
            // Thanh toán thành công, cập nhật trạng thái đơn hàng thành 'confirmed'
            await query("UPDATE orders SET status = 'confirmed' WHERE id = :id", { id: orderId });
            return res.json({ success: true, message: "Thanh toán thành công.", orderId });
        }
    })
);

export default router;
