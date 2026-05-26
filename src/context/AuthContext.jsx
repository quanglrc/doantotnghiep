import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const SESSION_KEY = "viqitech_session_v1";
const USERS_KEY = "viqitech_users_v1";

const ADMIN_SEED = {
    id: "admin-root",
    name: "Quản trị viên",
    email: "admin@viqitech.vn",
    phone: "0900000000",
    address: "Trụ sở ViQiTech",
    password: "admin123",
    role: "admin",
    locked: false,
    createdAt: "2026-01-01",
};

const loadUsers = () => {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length > 0) return arr;
        }
    } catch {
        /* ignore */
    }
    return [ADMIN_SEED];
};

const loadSession = () => {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

let userIdCounter = Date.now();

export const AuthProvider = ({ children }) => {
    const [users, setUsers] = useState(loadUsers);
    const [session, setSession] = useState(loadSession);

    useEffect(() => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        else localStorage.removeItem(SESSION_KEY);
    }, [session]);

    const value = useMemo(() => {
        const currentUser = session
            ? users.find((u) => u.id === session.id) || null
            : null;

        return {
            user: currentUser,
            users,
            isLoggedIn: !!currentUser,
            isAdmin: currentUser?.role === "admin",

            login: ({ email, password }) => {
                const u = users.find(
                    (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password
                );
                if (!u) return { ok: false, error: "Email hoặc mật khẩu không đúng." };
                if (u.locked) return { ok: false, error: "Tài khoản đã bị khóa." };
                setSession({ id: u.id });
                return { ok: true, user: u };
            },

            register: ({ name, email, phone, password }) => {
                if (users.some((x) => x.email.toLowerCase() === email.toLowerCase())) {
                    return { ok: false, error: "Email đã được sử dụng." };
                }
                const newUser = {
                    id: `u-${++userIdCounter}`,
                    name: name || email.split("@")[0],
                    email,
                    phone: phone || "",
                    address: "",
                    password,
                    role: "customer",
                    locked: false,
                    createdAt: new Date().toISOString().slice(0, 10),
                };
                setUsers((arr) => [...arr, newUser]);
                setSession({ id: newUser.id });
                return { ok: true, user: newUser };
            },

            logout: () => setSession(null),

            updateProfile: (patch) => {
                if (!currentUser) return;
                setUsers((arr) =>
                    arr.map((u) => (u.id === currentUser.id ? { ...u, ...patch } : u))
                );
            },

            // Admin only
            adminCreateUser: (data) => {
                if (users.some((x) => x.email.toLowerCase() === data.email.toLowerCase())) {
                    return { ok: false, error: "Email đã tồn tại." };
                }
                const newUser = {
                    id: `u-${++userIdCounter}`,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || "",
                    address: data.address || "",
                    password: data.password || "123456",
                    role: data.role || "customer",
                    locked: false,
                    createdAt: new Date().toISOString().slice(0, 10),
                };
                setUsers((arr) => [...arr, newUser]);
                return { ok: true, user: newUser };
            },
            adminUpdateUser: (id, patch) =>
                setUsers((arr) => arr.map((u) => (u.id === id ? { ...u, ...patch } : u))),
            adminToggleLock: (id) =>
                setUsers((arr) =>
                    arr.map((u) => (u.id === id ? { ...u, locked: !u.locked } : u))
                ),
            adminDeleteUser: (id) =>
                setUsers((arr) => arr.filter((u) => u.id !== id || u.id === ADMIN_SEED.id)),
        };
    }, [users, session]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
};
