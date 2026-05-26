import { createContext, useCallback, useContext, useState } from "react";
import "../styles/Toast.css";

const ToastContext = createContext(null);
let idCounter = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback(
        (id) => setToasts((arr) => arr.filter((t) => t.id !== id)),
        []
    );

    const show = useCallback(
        (message, type = "info", duration = 2500) => {
            const id = ++idCounter;
            setToasts((arr) => [...arr, { id, message, type }]);
            setTimeout(() => remove(id), duration);
        },
        [remove]
    );

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            <div className="toast-stack">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <i
                            className={`fa-solid ${
                                t.type === "success"
                                    ? "fa-circle-check"
                                    : t.type === "error"
                                    ? "fa-circle-exclamation"
                                    : "fa-circle-info"
                            }`}
                        ></i>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
    return ctx;
};
