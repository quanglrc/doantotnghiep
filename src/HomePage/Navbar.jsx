import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { useCart } from "../context/CartContext";
import DropdownAccount from "./DropdownAccount";
import "../styles/Navbar.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Navbar = () => {
    const [query, setQuery] = useState("");
    const [openCats, setOpenCats] = useState(false);
    const navigate = useNavigate();
    const { count } = useCart();
    const { categories } = useShop();

    const onSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/san-pham?q=${encodeURIComponent(q)}` : "/san-pham");
    };

    return (
        <header className="site-header">
            <div className="topbar">
                <div className="container topbar-inner">
                    <div className="topbar-left">
                        <span><i className="fa-solid fa-truck-fast"></i> Miễn phí giao hàng toàn quốc</span>
                        <span><i className="fa-solid fa-rotate-left"></i> Đổi trả trong 30 ngày</span>
                    </div>
                    <div className="topbar-right">
                        <Link to="/tai-khoan"><i className="fa-solid fa-user"></i> Tài khoản</Link>
                        <Link to="/don-hang"><i className="fa-solid fa-box"></i> Đơn hàng</Link>
                        <a href="tel:19001234"><i className="fa-solid fa-phone"></i> 1900 1234</a>
                    </div>
                </div>
            </div>

            <div className="mainbar">
                <div className="container mainbar-inner">
                    <Link to="/" className="logo">
                        <span className="logo-mark">Vi<span>Qi</span></span>
                        <span className="logo-sub">TECH</span>
                    </Link>

                    <form className="search" onSubmit={onSearch}>
                        <input
                            type="text"
                            placeholder="Bạn đang tìm sản phẩm gì?"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button type="submit" aria-label="Tìm">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <span>Tìm kiếm</span>
                        </button>
                    </form>

                    <div className="hotline">
                        <i className="fa-solid fa-headset"></i>
                        <div>
                            <small>Hotline mua hàng</small>
                            <strong>1900 1234</strong>
                        </div>
                    </div>

                    <Link to="/gio-hang" className="cart">
                        <i className="fa-solid fa-cart-shopping"></i>
                        <span className="cart-label">Giỏ hàng</span>
                        {count > 0 && <span className="cart-count">{count > 99 ? "99+" : count}</span>}
                    </Link>

                    <div className="account-wrap">
                        <DropdownAccount />
                    </div>
                </div>
            </div>

            <nav className="catbar">
                <div className="container catbar-inner">
                    <button
                        type="button"
                        className="cat-toggle"
                        onClick={() => setOpenCats((v) => !v)}
                    >
                        <i className="fa-solid fa-bars"></i>
                        Danh mục sản phẩm
                        <i className={`fa-solid fa-chevron-${openCats ? "up" : "down"}`}></i>
                    </button>

                    <ul className="cat-menu">
                        <li><NavLink to="/" end>Trang chủ</NavLink></li>
                        <li><NavLink to="/san-pham">Sản phẩm</NavLink></li>
                        <li><NavLink to="/khuyen-mai">Khuyến mãi</NavLink></li>
                        <li><NavLink to="/tin-tuc">Tin công nghệ</NavLink></li>
                        <li><NavLink to="/gioi-thieu">Giới thiệu</NavLink></li>
                        <li><NavLink to="/lien-he">Liên hệ</NavLink></li>
                    </ul>

                    {openCats && (
                        <div className="cat-dropdown" onMouseLeave={() => setOpenCats(false)}>
                            {categories.map((c) => (
                                <Link
                                    key={c.id}
                                    to={`/san-pham?cat=${c.id}`}
                                    className="cat-dropdown-item"
                                    onClick={() => setOpenCats(false)}
                                >
                                    <i className={`fa-solid ${c.icon}`}></i>
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
