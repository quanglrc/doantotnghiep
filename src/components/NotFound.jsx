import { Link } from "react-router-dom";

const NotFound = () => (
    <div className="container" style={{ padding: "60px 16px", textAlign: "center" }}>
        <i className="fa-regular fa-face-frown" style={{ fontSize: 72, color: "#d1d5db" }}></i>
        <h1 style={{ marginTop: 16 }}>404 - Không tìm thấy trang</h1>
        <p style={{ color: "#6b7280" }}>Trang bạn tìm có thể đã bị di chuyển hoặc không tồn tại.</p>
        <Link to="/" className="btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
            <i className="fa-solid fa-house"></i> Về trang chủ
        </Link>
    </div>
);

export default NotFound;
