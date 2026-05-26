import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "viqitech_cart_v1";

const loadInitial = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const reducer = (state, action) => {
    switch (action.type) {
        case "ADD": {
            const { product, qty = 1 } = action;
            const idx = state.findIndex((x) => x.id === product.id);
            if (idx >= 0) {
                const next = state.slice();
                next[idx] = { ...next[idx], qty: next[idx].qty + qty };
                return next;
            }
            return [
                ...state,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    oldPrice: product.oldPrice,
                    image: product.image,
                    qty,
                },
            ];
        }
        case "UPDATE_QTY":
            return state.map((x) =>
                x.id === action.id ? { ...x, qty: Math.max(1, action.qty) } : x
            );
        case "REMOVE":
            return state.filter((x) => x.id !== action.id);
        case "CLEAR":
            return [];
        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    const [items, dispatch] = useReducer(reducer, undefined, loadInitial);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            /* ignore */
        }
    }, [items]);

    const value = useMemo(() => {
        const count = items.reduce((s, x) => s + x.qty, 0);
        const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
        return {
            items,
            count,
            subtotal,
            addItem: (product, qty) => dispatch({ type: "ADD", product, qty }),
            updateQty: (id, qty) => dispatch({ type: "UPDATE_QTY", id, qty }),
            removeItem: (id) => dispatch({ type: "REMOVE", id }),
            clear: () => dispatch({ type: "CLEAR" }),
        };
    }, [items]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within <CartProvider>");
    return ctx;
};
