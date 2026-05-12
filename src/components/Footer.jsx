import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-features container">
                <div className="ff-item">
                    <i className="fa-solid fa-truck-fast"></i>
                    <div>
                        <strong>Miễn phí giao hàng</strong>
                        <small>Đơn từ 500.000đ</small>
                    </div>
                </div>
                <div className="ff-item">
                    <i className="fa-solid fa-shield-halved"></i>
                    <div>
                        <strong>Bảo hành chính hãng</strong>
                        <small>Lên đến 24 tháng</small>
                    </div>
                </div>
                <div className="ff-item">
                    <i className="fa-solid fa-rotate-left"></i>
                    <div>
                        <strong>Đổi trả miễn phí</strong>
                        <small>Trong vòng 30 ngày</small>
                    </div>
                </div>
                <div className="ff-item">
                    <i className="fa-solid fa-headset"></i>
                    <div>
                        <strong>Hỗ trợ 24/7</strong>
                        <small>Hotline 1900 1234</small>
                    </div>
                </div>
            </div>

            <div className="footer-main">
                <div className="container footer-cols">
                    <div className="fc">
                        <div className="footer-brand">
                            <span className="footer-logo">Vi<span>Qi</span>TECH</span>
                            <p>Hệ thống bán lẻ điện thoại, laptop, máy tính bảng và phụ kiện chính hãng.</p>
                        </div>
                        <div className="socials">
                            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
                            <a href="#" aria-label="YouTube"><i className="fa-brands fa-youtube"></i></a>
                            <a href="#" aria-label="TikTok"><i className="fa-brands fa-tiktok"></i></a>
                            <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                        </div>
                    </div>

                    <div className="fc">
                        <h4>Về ViQiTech</h4>
                        <ul>
                            <li><Link to="/gioi-thieu">Giới thiệu</Link></li>
                            <li><Link to="/lien-he">Liên hệ</Link></li>
                            <li><Link to="/tin-tuc">Tin tức công nghệ</Link></li>
                            <li><Link to="/tuyen-dung">Tuyển dụng</Link></li>
                        </ul>
                    </div>

                    <div className="fc">
                        <h4>Hỗ trợ khách hàng</h4>
                        <ul>
                            <li><a href="#">Hướng dẫn mua hàng</a></li>
                            <li><a href="#">Chính sách bảo hành</a></li>
                            <li><a href="#">Chính sách đổi trả</a></li>
                            <li><a href="#">Chính sách bảo mật</a></li>
                        </ul>
                    </div>

                    <div className="fc">
                        <h4>Liên hệ</h4>
                        <ul className="contact-list">
                            <li><i className="fa-solid fa-location-dot"></i> 123 Nguyễn Văn Cừ, Q.5, TP.HCM</li>
                            <li><i className="fa-solid fa-phone"></i> 1900 1234</li>
                            <li><i className="fa-solid fa-envelope"></i> support@viqitech.vn</li>
                        </ul>

                        <div className="payments">
                            <span>Thanh toán:</span>
                            <i className="fa-brands fa-cc-visa"></i>
                            <i className="fa-brands fa-cc-mastercard"></i>
                            <i className="fa-brands fa-cc-paypal"></i>
                            <i className="fa-solid fa-money-bill-wave"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container">
                    © {new Date().getFullYear()} ViQiTech. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
