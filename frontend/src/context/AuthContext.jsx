import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setToken, getToken, isTokenExpired, ApiError } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        // Không có token, hoặc token hết hạn → bỏ qua /auth/me (tránh 401 trong console)
        if (!token || isTokenExpired(token)) {
            if (token) setToken(null);
            setLoading(false);
            return;
        }
        api.get("/auth/me")
            .then((u) => setUser(u))
            .catch(() => {
                setToken(null);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    // Lắng nghe sự kiện từ api/client khi token bị revoke (server trả 401)
    useEffect(() => {
        const handler = () => setUser(null);
        window.addEventListener("auth:unauthenticated", handler);
        return () => window.removeEventListener("auth:unauthenticated", handler);
    }, []);

    const login = useCallback(async ({ email, password }) => {
        try {
            const { user: u, token } = await api.post("/auth/login", { email, password }, { auth: false });
            setToken(token);
            setUser(u);
            return { ok: true, user: u };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }, []);

    const register = useCallback(async ({ name, email, phone, password }) => {
        try {
            const { user: u, token } = await api.post(
                "/auth/register",
                { name, email, phone, password },
                { auth: false }
            );
            setToken(token);
            setUser(u);
            return { ok: true, user: u };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (patch) => {
        try {
            const u = await api.put("/auth/me", patch);
            setUser(u);
            return { ok: true, user: u };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }, []);

    const changePassword = useCallback(async ({ oldPassword, newPassword }) => {
        try {
            await api.put("/auth/me/password", { oldPassword, newPassword });
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            isLoggedIn: !!user,
            isAdmin: user?.role === "admin",
            login,
            register,
            logout,
            updateProfile,
            changePassword,
        }),
        [user, loading, login, register, logout, updateProfile, changePassword]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
};

export { ApiError };
