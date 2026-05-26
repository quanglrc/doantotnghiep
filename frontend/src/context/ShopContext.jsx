import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const [p, c, b] = await Promise.all([
                api.get("/products"),
                api.get("/categories"),
                api.get("/brands"),
            ]);
            setProducts(p);
            setCategories(c);
            setBrands(b);
        } catch (err) {
            console.error("[shop] load failed:", err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const value = useMemo(() => ({
        products,
        categories,
        brands,
        loading,
        refresh,

        getProduct: (id) =>
            products.find((p) => String(p.id) === String(id)),
        getProductsByCategory: (catId) =>
            products.filter((p) => p.category === catId),

        addProduct: async (data) => {
            const p = await api.post("/products", data);
            setProducts((arr) => [p, ...arr]);
            return p;
        },
        updateProduct: async (id, patch) => {
            const p = await api.put(`/products/${id}`, patch);
            setProducts((arr) => arr.map((x) => (x.id === id ? p : x)));
            return p;
        },
        deleteProduct: async (id) => {
            await api.del(`/products/${id}`);
            setProducts((arr) => arr.filter((p) => p.id !== id));
        },

        addCategory: async (data) => {
            const c = await api.post("/categories", data);
            setCategories((arr) => [...arr, c]);
            return c;
        },
        updateCategory: async (id, patch) => {
            const c = await api.put(`/categories/${id}`, patch);
            setCategories((arr) => arr.map((x) => (x.id === id ? c : x)));
            return c;
        },
        deleteCategory: async (id) => {
            await api.del(`/categories/${id}`);
            setCategories((arr) => arr.filter((c) => c.id !== id));
        },

        addBrand: async (data) => {
            const b = await api.post("/brands", data);
            setBrands((arr) => [...arr, b]);
            return b;
        },
        updateBrand: async (id, patch) => {
            const b = await api.put(`/brands/${id}`, patch);
            setBrands((arr) => arr.map((x) => (x.id === id ? b : x)));
            return b;
        },
        deleteBrand: async (id) => {
            await api.del(`/brands/${id}`);
            setBrands((arr) => arr.filter((b) => b.id !== id));
        },
    }), [products, categories, brands, loading, refresh]);

    return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
    const ctx = useContext(ShopContext);
    if (!ctx) throw new Error("useShop must be used within <ShopProvider>");
    return ctx;
};
