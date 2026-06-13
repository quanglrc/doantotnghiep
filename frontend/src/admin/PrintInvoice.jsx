import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { formatPrice } from "../data/products";

const PrintInvoice = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await api.get(`/orders/${id}`);
                setOrder(data);
                // Đợi render xong rồi tự động mở hộp thoại in
                setTimeout(() => {
                    window.print();
                }, 500);
            } catch (err) {
                setError(err.message || "Không thể tải dữ liệu hóa đơn");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div style={{ padding: 20 }}>Đang tải hóa đơn...</div>;
    if (error) return <div style={{ padding: 20, color: "red" }}>Lỗi: {error}</div>;
    if (!order) return <div style={{ padding: 20 }}>Không tìm thấy đơn hàng.</div>;

    return (
        <div className="invoice-container">
            <style>{`
                body {
                    background: #f0f2f5;
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    color: #333;
                }
                .invoice-box {
                    max-width: 800px;
                    margin: auto;
                    padding: 40px;
                    border: 1px solid #eee;
                    background: #fff;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
                    font-size: 14px;
                    line-height: 24px;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                .invoice-title {
                    text-align: right;
                }
                .invoice-title h1 {
                    margin: 0;
                    font-size: 28px;
                    color: #333;
                    text-transform: uppercase;
                }
                .invoice-title p {
                    margin: 5px 0 0 0;
                    color: #666;
                }
                .company-info h2 {
                    margin: 0;
                    font-size: 24px;
                    color: #2563eb;
                }
                .company-info p {
                    margin: 5px 0 0 0;
                    color: #666;
                }
                .customer-info {
                    margin-bottom: 30px;
                }
                .customer-info h3 {
                    margin-top: 0;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }
                table {
                    width: 100%;
                    line-height: inherit;
                    text-align: left;
                    border-collapse: collapse;
                }
                table th, table td {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                table th {
                    background: #f8f9fa;
                    font-weight: bold;
                }
                .text-right {
                    text-align: right;
                }
                .text-center {
                    text-align: center;
                }
                .totals {
                    margin-top: 20px;
                    width: 50%;
                    float: right;
                }
                .totals table th, .totals table td {
                    border-bottom: none;
                    padding: 5px 10px;
                }
                .totals .grand-total {
                    font-size: 18px;
                    font-weight: bold;
                    color: #dc2626;
                }
                .footer {
                    clear: both;
                    margin-top: 50px;
                    text-align: center;
                    color: #666;
                    border-top: 1px solid #eee;
                    padding-top: 20px;
                }
                .no-print {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .btn-print {
                    padding: 10px 20px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }
                @media print {
                    body {
                        background: #fff;
                        padding: 0;
                    }
                    .invoice-box {
                        box-shadow: none;
                        border: none;
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>

            <div className="no-print">
                <button className="btn-print" onClick={() => window.print()}>
                    <i className="fa-solid fa-print"></i> In hóa đơn
                </button>
            </div>

            <div className="invoice-box">
                <div className="invoice-header">
                    <div className="company-info">
                        <h2>ViQiTECH</h2>
                        <p>Địa chỉ: 123 Đường Công Nghệ, Quận 1, TP.HCM</p>
                        <p>Điện thoại: 1900 1234</p>
                        <p>Email: hotro@viqitech.vn</p>
                    </div>
                    <div className="invoice-title">
                        <h1>HÓA ĐƠN BÁN HÀNG</h1>
                        <p>Mã hóa đơn: <strong>{order.id}</strong></p>
                        <p>Ngày lập: {new Date().toLocaleDateString("vi-VN")}</p>
                    </div>
                </div>

                <div className="customer-info">
                    <h3>Thông tin khách hàng</h3>
                    <p><strong>Họ tên:</strong> {order.customer?.name}</p>
                    <p><strong>Điện thoại:</strong> {order.customer?.phone || "Không có"}</p>
                    <p><strong>Email:</strong> {order.customer?.email || "Không có"}</p>
                    <p><strong>Địa chỉ:</strong> {order.customer?.address || "Không có"}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên sản phẩm</th>
                            <th className="text-center">Số lượng</th>
                            <th className="text-right">Đơn giá</th>
                            <th className="text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                    {item.name}
                                    {item.variant_label && ` - ${item.variant_label}`}
                                    {item.color_name && ` (${item.color_name})`}
                                </td>
                                <td className="text-center">{item.qty}</td>
                                <td className="text-right">{formatPrice(item.price)}</td>
                                <td className="text-right">{formatPrice(item.subtotal || (item.price * item.qty))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="totals">
                    <table>
                        <tbody>
                            <tr>
                                <td>Tạm tính:</td>
                                <td className="text-right">{formatPrice(order.subtotal)}</td>
                            </tr>
                            <tr>
                                <td>Phí vận chuyển:</td>
                                <td className="text-right">{order.shipping === 0 ? "Miễn phí" : formatPrice(order.shipping)}</td>
                            </tr>
                            {order.discount > 0 && (
                                <tr>
                                    <td>Giảm giá:</td>
                                    <td className="text-right">- {formatPrice(order.discount)}</td>
                                </tr>
                            )}
                            <tr>
                                <td><strong>Tổng thanh toán:</strong></td>
                                <td className="text-right grand-total">{formatPrice(order.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="footer">
                    <p>Cảm ơn quý khách đã mua sắm tại ViQiTECH!</p>
                    <p><small>Hóa đơn này được tạo tự động từ hệ thống quản lý.</small></p>
                </div>
            </div>
        </div>
    );
};

export default PrintInvoice;
