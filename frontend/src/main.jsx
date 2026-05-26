import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ShopProvider } from "./context/ShopContext";
import { OrdersProvider } from "./context/OrdersContext";

import Layout from "./components/Layout";
import Home from "./HomePage/Home";
import Collection from "./HomePage/Collection";
import ProductDetail from "./components/ProductDetail";
import ShoppingCart from "./components/ShoppingCart";
import Checkout from "./components/Checkout";
import OrderSuccess from "./components/OrderSuccess";
import Account from "./components/AccountPage/Account";
import ChangePassword from "./components/AccountPage/ChangePassword";
import Order from "./components/OrderPage/Order";
import KhuyenMai from "./components/KhuyenMai";
import { Login, Register, ForgotPassword, ResetPassword } from "./components/AuthPages";
import { GioiThieu, LienHe, TinTuc } from "./components/StaticPages";
import NotFound from "./components/NotFound";

import AdminLayout, { RequireAdmin } from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AdminCategories from "./admin/AdminCategories";
import AdminBrands from "./admin/AdminBrands";
import AdminVouchers from "./admin/AdminVouchers";
import AdminOrders from "./admin/AdminOrders";
import AdminUsers from "./admin/AdminUsers";
import AdminChatbot from "./admin/AdminChatbot";
import AdminReports from "./admin/AdminReports";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <ShopProvider>
                        <OrdersProvider>
                            <CartProvider>
                                <Routes>
                                    {/* Auth standalone (no navbar/footer) */}
                                    <Route path="/dang-nhap" element={<Login />} />
                                    <Route path="/dang-ky" element={<Register />} />
                                    <Route path="/quen-mat-khau" element={<ForgotPassword />} />
                                    <Route path="/dat-lai-mat-khau" element={<ResetPassword />} />

                                    {/* Admin standalone */}
                                    <Route
                                        path="/admin"
                                        element={
                                            <RequireAdmin>
                                                <AdminLayout />
                                            </RequireAdmin>
                                        }
                                    >
                                        <Route index element={<AdminDashboard />} />
                                        <Route path="san-pham" element={<AdminProducts />} />
                                        <Route path="danh-muc" element={<AdminCategories />} />
                                        <Route path="thuong-hieu" element={<AdminBrands />} />
                                        <Route path="voucher" element={<AdminVouchers />} />
                                        <Route path="don-hang" element={<AdminOrders />} />
                                        <Route path="nguoi-dung" element={<AdminUsers />} />
                                        <Route path="chatbot" element={<AdminChatbot />} />
                                        <Route path="thong-ke" element={<AdminReports />} />
                                    </Route>

                                    {/* Customer site (with navbar/footer/chatbot) */}
                                    <Route element={<Layout />}>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/san-pham" element={<Collection />} />
                                        <Route path="/san-pham/:id" element={<ProductDetail />} />
                                        <Route path="/khuyen-mai" element={<KhuyenMai />} />
                                        <Route path="/gio-hang" element={<ShoppingCart />} />
                                        <Route path="/thanh-toan" element={<Checkout />} />
                                        <Route path="/dat-hang-thanh-cong/:id" element={<OrderSuccess />} />
                                        <Route path="/tai-khoan" element={<Account />} />
                                        <Route path="/doi-mat-khau" element={<ChangePassword />} />
                                        <Route path="/don-hang" element={<Order />} />
                                        <Route path="/gioi-thieu" element={<GioiThieu />} />
                                        <Route path="/lien-he" element={<LienHe />} />
                                        <Route path="/tin-tuc" element={<TinTuc />} />
                                        <Route path="*" element={<NotFound />} />
                                    </Route>
                                </Routes>
                            </CartProvider>
                        </OrdersProvider>
                    </ShopProvider>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    </StrictMode>
);
