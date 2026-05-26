import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "../styles/Static.css";

const Breadcrumb = ({ label }) => (
    <nav className="breadcrumbs">
        <Link to="/">Trang chủ</Link>
        <i className="fa-solid fa-chevron-right"></i>
        <span>{label}</span>
    </nav>
);

export const GioiThieu = () => (
    <div className="container static-page">
        <Breadcrumb label="Giới thiệu" />
        <div className="static-card">
            <h1>Về ViQiTech</h1>
            <p>
                ViQiTech là hệ thống bán lẻ điện thoại, laptop, máy tính bảng và phụ kiện chính hãng,
                phục vụ khách hàng trên toàn quốc với cam kết: hàng chính hãng - giá tốt nhất - bảo
                hành nhanh chóng.
            </p>
            <h2>Tại sao chọn ViQiTech?</h2>
            <ul>
                <li><i className="fa-solid fa-circle-check"></i> Sản phẩm chính hãng 100%, hóa đơn VAT đầy đủ</li>
                <li><i className="fa-solid fa-circle-check"></i> Trả góp 0% qua thẻ tín dụng và các công ty tài chính</li>
                <li><i className="fa-solid fa-circle-check"></i> Giao hàng nhanh trong 2 giờ tại nội thành</li>
                <li><i className="fa-solid fa-circle-check"></i> Đổi trả miễn phí trong 30 ngày</li>
                <li><i className="fa-solid fa-circle-check"></i> Bảo hành chính hãng tới 24 tháng</li>
            </ul>
            <h2>Thành tựu</h2>
            <div className="stat-grid">
                <div><strong>50+</strong><span>Chi nhánh toàn quốc</span></div>
                <div><strong>2M+</strong><span>Khách hàng tin dùng</span></div>
                <div><strong>10K+</strong><span>Sản phẩm chính hãng</span></div>
                <div><strong>4.9★</strong><span>Đánh giá trung bình</span></div>
            </div>
        </div>
    </div>
);

export const LienHe = () => {
    const toast = useToast();
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

    const submit = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.message.trim()) {
            toast.show("Vui lòng nhập họ tên và nội dung.", "error");
            return;
        }
        toast.show("Đã gửi tin nhắn. Chúng tôi sẽ liên hệ bạn sớm!", "success");
        setForm({ name: "", email: "", phone: "", message: "" });
    };

    return (
        <div className="container static-page">
            <Breadcrumb label="Liên hệ" />
            <div className="contact-layout">
                <div className="static-card">
                    <h1>Liên hệ với chúng tôi</h1>
                    <p>Để lại tin nhắn, đội ngũ ViQiTech sẽ liên hệ trong vòng 24 giờ.</p>
                    <form onSubmit={submit} className="contact-form">
                        <div className="form-row">
                            <label>Họ và tên *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="form-row">
                            <label>Email</label>
                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div className="form-row">
                            <label>Số điện thoại</label>
                            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className="form-row">
                            <label>Nội dung *</label>
                            <textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                        </div>
                        <button type="submit" className="btn-primary">
                            <i className="fa-solid fa-paper-plane"></i> Gửi tin nhắn
                        </button>
                    </form>
                </div>

                <aside className="contact-info static-card">
                    <h2>Thông tin liên hệ</h2>
                    <ul>
                        <li><i className="fa-solid fa-location-dot"></i> 123 Nguyễn Văn Cừ, Q.5, TP.HCM</li>
                        <li><i className="fa-solid fa-phone"></i> <a href="tel:19001234">1900 1234</a></li>
                        <li><i className="fa-solid fa-envelope"></i> <a href="mailto:support@viqitech.vn">support@viqitech.vn</a></li>
                        <li><i className="fa-solid fa-clock"></i> 8:00 - 22:00 (T2 - CN)</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
};

const news = [
    { id: 1, title: "iPhone 16 Pro Max ra mắt - những điều cần biết", excerpt: "Apple chính thức công bố thế hệ iPhone mới với chip A18 Pro và camera nâng cấp...", date: "10/05/2026" },
    { id: 2, title: "So sánh MacBook Air M3 và MacBook Pro M3", excerpt: "Hai lựa chọn nổi bật trong dòng MacBook 2024 với hiệu năng vượt trội...", date: "08/05/2026" },
    { id: 3, title: "Top 5 tablet đáng mua nhất 2026", excerpt: "iPad Pro M4, Galaxy Tab S9, Xiaomi Pad 6 Pro... đâu là lựa chọn tốt nhất?", date: "05/05/2026" },
    { id: 4, title: "Mẹo tăng tuổi thọ pin smartphone", excerpt: "Những thói quen đơn giản giúp pin điện thoại của bạn bền hơn theo thời gian...", date: "01/05/2026" },
];

export const TinTuc = () => (
    <div className="container static-page">
        <Breadcrumb label="Tin công nghệ" />
        <div className="static-card">
            <h1>Tin công nghệ</h1>
            <div className="news-list">
                {news.map((n) => (
                    <article key={n.id} className="news-item">
                        <div className="news-thumb">
                            <i className="fa-solid fa-newspaper"></i>
                        </div>
                        <div>
                            <h3>{n.title}</h3>
                            <p>{n.excerpt}</p>
                            <small><i className="fa-regular fa-calendar"></i> {n.date}</small>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    </div>
);
