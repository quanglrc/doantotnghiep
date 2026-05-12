import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/dropdownAccount.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const DropdownAccount = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { isLoggedIn, user, logout } = useAuth();
    const toast = useToast();
    const nav = useNavigate();

    const onLogout = () => {
        logout();
        setIsOpen(false);
        toast.show("Đã đăng xuất.", "info");
        nav("/", { replace: true });
    };

    return (
        <div
            className="account-menu"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button type="button" className="account-trigger" aria-label="Tài khoản">
                <i className="fa-solid fa-user"></i>
            </button>

            {isOpen && (
                <ul className="account-dropdown">
                    {isLoggedIn ? (
                        <>
                            <li className="account-greeting">
                                Xin chào,<br />
                                <strong>{user.name}</strong>
                            </li>
                            <li className="divider" />
                            <li>
                                <Link to="/tai-khoan" onClick={() => setIsOpen(false)}>
                                    <i className="fa-solid fa-id-card"></i> Thông tin cá nhân
                                </Link>
                            </li>
                            <li>
                                <Link to="/don-hang" onClick={() => setIsOpen(false)}>
                                    <i className="fa-solid fa-box"></i> Đơn hàng của tôi
                                </Link>
                            </li>
                            <li className="divider" />
                            <li>
                                <button type="button" className="logout-btn" onClick={onLogout}>
                                    <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/dang-nhap" onClick={() => setIsOpen(false)}>
                                    <i className="fa-solid fa-right-to-bracket"></i> Đăng nhập
                                </Link>
                            </li>
                            <li>
                                <Link to="/dang-ky" onClick={() => setIsOpen(false)}>
                                    <i className="fa-solid fa-user-plus"></i> Đăng ký
                                </Link>
                            </li>
                            <li className="divider" />
                            <li>
                                <Link to="/don-hang" onClick={() => setIsOpen(false)}>
                                    <i className="fa-solid fa-box"></i> Tra cứu đơn hàng
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            )}
        </div>
    );
};

export default DropdownAccount;
