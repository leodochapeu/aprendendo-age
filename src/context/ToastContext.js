import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
const ToastContext = createContext(null);
const TOAST_DURATION_MS = 4000;
export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message, variant = "success") => {
        setToast({ message, variant });
        window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    }, []);
    const value = useMemo(() => ({ showToast }), [showToast]);
    return (_jsxs(ToastContext.Provider, { value: value, children: [children, toast
                ? createPortal(_jsx("div", { className: "pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4", role: "status", "aria-live": "polite", children: _jsx("p", { className: cn("pointer-events-auto max-w-md rounded-xl border px-4 py-3 text-center text-sm font-medium shadow-lg shadow-black/40", toast.variant === "success"
                            ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
                            : "border-red-500/40 bg-red-950/90 text-red-100"), children: toast.message }) }), document.body)
                : null] }));
}
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
