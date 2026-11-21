import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
export function AuthPageLayout({ children, className }) {
    return (_jsx("div", { className: cn("mx-auto flex w-full max-w-md flex-col", className), children: _jsx("div", { className: "rounded-2xl border border-aom-border bg-zinc-950/80 p-6 shadow-lg shadow-black/20", children: children }) }));
}
const inputClassName = "rounded-lg border border-aom-border bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500/45 focus:ring-1 focus:ring-amber-500/25";
export function AuthField({ label, children, }) {
    return (_jsxs("label", { className: "flex flex-col gap-1.5", children: [_jsx("span", { className: "text-sm text-zinc-300", children: label }), children] }));
}
export function AuthInput({ className, ...props }) {
    return _jsx("input", { className: cn(inputClassName, className), ...props });
}
export function AuthError({ message }) {
    if (!message)
        return null;
    return (_jsx("p", { className: "rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: message }));
}
export function AuthSubmitButton({ children, pending, disabled, }) {
    return (_jsx("button", { type: "submit", disabled: pending || disabled, className: cn("mt-1 rounded-lg bg-amber-500/90 px-4 py-2.5 text-sm font-medium text-zinc-950", "transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50", "focus:outline-none focus:ring-2 focus:ring-amber-500/35"), children: children }));
}
export function AuthLink({ to, children }) {
    return (_jsx(Link, { to: to, className: "font-medium text-amber-300/95 underline-offset-2 hover:text-amber-200 hover:underline", children: children }));
}
export { inputClassName as authInputClassName };
