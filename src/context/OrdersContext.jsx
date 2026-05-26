import { createContext, useContext, useEffect, useMemo, useState } from "react";

const OrdersContext = createContext(null);

const ORDERS_KEY = "viqitech_orders_v1";
const REVIEWS_KEY = "viqitech_reviews_v1";

const load = (key) => {
    try {
        const raw = localStorage.getItem(key);
        const v = raw ? JSON.parse(raw) : [];
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
};

let counter = Date.now();
const today = () => new Date().toISOString().slice(0, 10);

export const STATUS = {
    pending: { label: "Chờ xác nhận", cls: "pending" },
    confirmed: { label: "Đã xác nhận", cls: "delivering" },
    shipping: { label: "Đang giao", cls: "delivering" },
    completed: { label: "Hoàn thành", cls: "completed" },
    cancelled: { label: "Đã hủy", cls: "cancelled" },
};

export const STATUS_FLOW = ["pending", "confirmed", "shipping", "completed", "cancelled"];

export const OrdersProvider = ({ children }) => {
    const [orders, setOrders] = useState(() => load(ORDERS_KEY));
    const [reviews, setReviews] = useState(() => load(REVIEWS_KEY));

    useEffect(() => { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }, [orders]);
    useEffect(() => { localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews)); }, [reviews]);

    const value = useMemo(() => ({
        orders,
        reviews,

        createOrder: ({ userId, customer, items, subtotal, shipping, total }) => {
            const o = {
                id: `VQ-${today().replaceAll("-", "")}-${String(++counter).slice(-4)}`,
                userId,
                customer,
                items,
                subtotal,
                shipping,
                total,
                status: "pending",
                date: today(),
                cancelReason: null,
            };
            setOrders((arr) => [o, ...arr]);
            return o;
        },

        cancelOrder: (id, reason) =>
            setOrders((arr) =>
                arr.map((o) =>
                    o.id === id && (o.status === "pending" || o.status === "confirmed")
                        ? { ...o, status: "cancelled", cancelReason: reason || "Khách hủy đơn" }
                        : o
                )
            ),

        adminUpdateStatus: (id, status) =>
            setOrders((arr) => arr.map((o) => (o.id === id ? { ...o, status } : o))),

        ordersByUser: (userId) => orders.filter((o) => o.userId === userId),

        addReview: ({ productId, userId, userName, rating, comment }) => {
            const r = {
                id: `r-${++counter}`,
                productId,
                userId,
                userName,
                rating,
                comment,
                date: today(),
            };
            setReviews((arr) => [r, ...arr]);
            return r;
        },

        reviewsOf: (productId) => reviews.filter((r) => r.productId === productId),
        deleteReview: (id) => setReviews((arr) => arr.filter((r) => r.id !== id)),
    }), [orders, reviews]);

    return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};

export const useOrders = () => {
    const ctx = useContext(OrdersContext);
    if (!ctx) throw new Error("useOrders must be used within <OrdersProvider>");
    return ctx;
};
