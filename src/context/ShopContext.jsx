import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    products as seedProducts,
    categories as seedCategories,
    brands as seedBrands,
} from "../data/products";

const ShopContext = createContext(null);

const KEYS = {
    products: "viqitech_products_v1",
    categories: "viqitech_categories_v1",
    brands: "viqitech_brands_v1",
};

const load = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            const v = JSON.parse(raw);
            if (Array.isArray(v) && v.length > 0) return v;
        }
    } catch {
        /* ignore */
    }
    return fallback;
};

let idCounter = Date.now();
const nextId = () => `g-${++idCounter}`;

export const ShopProvider = ({ children }) => {
    const [products, setProducts] = useState(() => load(KEYS.products, seedProducts));
    const [categories, setCategories] = useState(() => load(KEYS.categories, seedCategories));
    const [brands, setBrands] = useState(() => load(KEYS.brands, seedBrands));

    useEffect(() => { localStorage.setItem(KEYS.products, JSON.stringify(products)); }, [products]);
    useEffect(() => { localStorage.setItem(KEYS.categories, JSON.stringify(categories)); }, [categories]);
    useEffect(() => { localStorage.setItem(KEYS.brands, JSON.stringify(brands)); }, [brands]);

    const value = useMemo(() => ({
        products,
        categories,
        brands,

        getProduct: (id) => products.find((p) => p.id === Number(id) || p.id === id),
        getProductsByCategory: (catId) => products.filter((p) => p.category === catId),

        addProduct: (data) => {
            const p = {
                id: nextId(),
                rating: 5,
                sold: 0,
                ...data,
                price: Number(data.price) || 0,
                oldPrice: Number(data.oldPrice) || 0,
            };
            setProducts((arr) => [p, ...arr]);
            return p;
        },
        updateProduct: (id, patch) =>
            setProducts((arr) =>
                arr.map((p) =>
                    p.id === id
                        ? {
                              ...p,
                              ...patch,
                              price: Number(patch.price ?? p.price),
                              oldPrice: Number(patch.oldPrice ?? p.oldPrice),
                          }
                        : p
                )
            ),
        deleteProduct: (id) => setProducts((arr) => arr.filter((p) => p.id !== id)),

        addCategory: (data) => {
            const c = { id: data.id || `cat-${++idCounter}`, name: data.name, icon: data.icon || "fa-tag" };
            setCategories((arr) => [...arr, c]);
            return c;
        },
        updateCategory: (id, patch) =>
            setCategories((arr) => arr.map((c) => (c.id === id ? { ...c, ...patch } : c))),
        deleteCategory: (id) => setCategories((arr) => arr.filter((c) => c.id !== id)),

        addBrand: (data) => {
            const b = { id: data.id || `br-${++idCounter}`, name: data.name };
            setBrands((arr) => [...arr, b]);
            return b;
        },
        updateBrand: (id, patch) =>
            setBrands((arr) => arr.map((b) => (b.id === id ? { ...b, ...patch } : b))),
        deleteBrand: (id) => setBrands((arr) => arr.filter((b) => b.id !== id)),
    }), [products, categories, brands]);

    return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
    const ctx = useContext(ShopContext);
    if (!ctx) throw new Error("useShop must be used within <ShopProvider>");
    return ctx;
};
