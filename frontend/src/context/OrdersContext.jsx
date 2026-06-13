import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const OrdersContext = createContext(null);

export const STATUS = {
    pending: { label: "Chờ xác nhận", cls: "pending" },
    confirmed: { label: "Đã xác nhận", cls: "delivering" },
    shipping: { label: "Đang giao", cls: "delivering" },
    completed: { label: "Hoàn thành", cls: "completed" },
    cancelled: { label: "Đã hủy", cls: "cancelled" },
};

export const OrdersProvider = ({ children }) => {
    const { user, isAdmin } = useAuth();
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);

    const refreshOrders = useCallback(async () => {
        if (!user) {
            setOrders([]);
            return;
        }
        try {
            const data = await api.get(isAdmin ? "/orders" : "/orders/me");
            setOrders(data);
        } catch (err) {
            console.error("[orders] load failed:", err.message);
        }
    }, [user, isAdmin]);

    const refreshReviews = useCallback(async () => {
        try {
            const data = await api.get("/reviews");
            setReviews(data);
        } catch (err) {
            console.error("[reviews] load failed:", err.message);
        }
    }, []);

    useEffect(() => { refreshOrders(); }, [refreshOrders]);
    useEffect(() => { refreshReviews(); }, [refreshReviews]);

    const value = useMemo(() => ({
        orders,
        reviews,
        refresh: () => Promise.all([refreshOrders(), refreshReviews()]),

        createOrder: async ({ items, subtotal, shipping, discount, total, customer, paymentMethod, note, voucherCode }) => {
            try {
                const o = await api.post("/orders", {
                    items: items.map((it) => ({
                        id: it.id,
                        name: it.name,
                        image: it.image,
                        price: it.price,
                        qty: it.qty,
                    })),
                    subtotal,
                    shipping,
                    discount,
                    total,
                    customer,
                    paymentMethod,
                    note,
                    voucherCode,
                });
                setOrders((arr) => [o, ...arr]);
                return { ok: true, order: o };
            } catch (err) {
                return { ok: false, error: err.message };
            }
        },

        cancelOrder: async (id, reason) => {
            try {
                const o = await api.patch(`/orders/${id}/cancel`, { reason });
                setOrders((arr) => arr.map((x) => (x.id === id ? o : x)));
                return { ok: true };
            } catch (err) {
                return { ok: false, error: err.message };
            }
        },

        adminUpdateStatus: async (id, status) => {
            try {
                const o = await api.patch(`/orders/${id}/status`, { status });
                setOrders((arr) => arr.map((x) => (x.id === id ? o : x)));
                return { ok: true };
            } catch (err) {
                return { ok: false, error: err.message };
            }
        },

        ordersByUser: (userId) => orders.filter((o) => o.userId === userId),

        reviewsOf: (productId) =>
            reviews.filter((r) => String(r.productId) === String(productId)),

        addReview: async ({ productId, rating, comment }) => {
            try {
                const r = await api.post("/reviews", { productId, rating, comment });
                setReviews((arr) => [r, ...arr]);
                return { ok: true, review: r };
            } catch (err) {
                return { ok: false, error: err.message };
            }
        },

        deleteReview: async (id) => {
            await api.del(`/reviews/${id}`);
            setReviews((arr) => arr.filter((r) => r.id !== id));
        },
    }), [orders, reviews, refreshOrders, refreshReviews]);

    return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};

export const useOrders = () => {
    const ctx = useContext(OrdersContext);
    if (!ctx) throw new Error("useOrders must be used within <OrdersProvider>");
    return ctx;
};
