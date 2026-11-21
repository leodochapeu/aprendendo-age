import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
export function ModalApp({ open, onClose, title, description, children, className }) {
    const titleId = useId();
    const descriptionId = useId();
    const hasDescription = description != null && (typeof description !== "string" || description !== "");
    const describedBy = useMemo(() => (hasDescription ? descriptionId : undefined), [hasDescription, descriptionId]);
    useEffect(() => {
        if (!open)
            return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [open]);
    useEffect(() => {
        if (!open)
            return;
        const onKeyDown = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);
    if (!open)
        return null;
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-50", children: [_jsx("div", { className: "absolute inset-0 bg-black/70", "aria-hidden": true }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center p-4", onMouseDown: (e) => {
                    if (e.target === e.currentTarget)
                        onClose();
                }, children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, "aria-describedby": describedBy, className: cn("relative flex max-h-[min(90vh,48rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-aom-border bg-zinc-950 shadow-xl shadow-black/40", className), children: [_jsxs("div", { className: "flex shrink-0 items-start justify-between gap-6 border-b border-aom-border bg-zinc-950/80 px-5 py-4", children: [_jsx("div", { className: "min-w-0 pr-2", children: _jsx("h2", { id: titleId, className: "truncate font-[family-name:var(--font-display)] text-xl font-semibold tracking-wide text-amber-100", children: title }) }), _jsx("button", { type: "button", onClick: onClose, className: "shrink-0 rounded-xl border border-aom-border bg-zinc-900/50 px-3 py-2 text-sm font-medium text-amber-100/90 transition hover:border-amber-400/50 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25", children: "Fechar" })] }), hasDescription || children ? (_jsxs("div", { className: "min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5", children: [hasDescription ? (_jsx("div", { id: descriptionId, className: "text-sm text-zinc-300", children: description })) : null, children] })) : null] }) })] }), document.body);
}
