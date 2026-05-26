// Tự động dùng hostname đang load page → nếu mở từ điện thoại (192.168.x.x:5173)
// thì gọi API tại 192.168.x.x:4000, còn từ laptop thì localhost:4000.
// Có thể override bằng biến VITE_API_BASE trong .env nếu cần.
const detectBase = () => {
    if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
    if (typeof window !== "undefined" && window.location) {
        return `${window.location.protocol}//${window.location.hostname}:4000/api`;
    }
    return "http://localhost:4000/api";
};
const BASE = detectBase();
const TOKEN_KEY = "viqitech_token_v1";

export const getToken = () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
    try {
        if (t) localStorage.setItem(TOKEN_KEY, t);
        else localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
};

// Decode JWT payload (không verify signature - chỉ đọc exp)
const decodeJwt = (token) => {
    try {
        const part = token.split(".")[1];
        if (!part) return null;
        const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json);
    } catch {
        return null;
    }
};

// Token hết hạn? (có buffer 30s)
export const isTokenExpired = (token = getToken()) => {
    if (!token) return true;
    const p = decodeJwt(token);
    if (!p?.exp) return false;
    return p.exp * 1000 < Date.now() + 30_000;
};

// Tự dọn token hết hạn lúc start
if (typeof window !== "undefined" && isTokenExpired(getToken()) && getToken()) {
    setToken(null);
}

export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

const request = async (method, path, { body, query, auth = true } = {}) => {
    const url = new URL(BASE + path);
    if (query) {
        Object.entries(query).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
        });
    }

    const headers = { "Content-Type": "application/json" };
    let tokenSent = false;
    if (auth) {
        const t = getToken();
        // Bỏ qua token nếu hết hạn → không gửi Authorization header, tránh 401
        if (t && !isTokenExpired(t)) {
            headers.Authorization = `Bearer ${t}`;
            tokenSent = true;
        } else if (t) {
            // Hết hạn → xoá luôn
            setToken(null);
        }
    }

    let res;
    try {
        res = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError("Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy.", 0);
    }

    // Server trả 401 dù mình đã gửi token → token đã bị revoke / user bị xoá → dọn dẹp
    if (res.status === 401 && tokenSent) {
        setToken(null);
        // Báo cho app biết để reset state (AuthContext lắng nghe)
        window.dispatchEvent(new CustomEvent("auth:unauthenticated"));
    }

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
        const msg = (data && data.error) || `Lỗi ${res.status}`;
        throw new ApiError(msg, res.status, data);
    }
    return data;
};

export const api = {
    get: (path, opts) => request("GET", path, opts),
    post: (path, body, opts) => request("POST", path, { ...opts, body }),
    put: (path, body, opts) => request("PUT", path, { ...opts, body }),
    patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
    del: (path, opts) => request("DELETE", path, opts),
};
