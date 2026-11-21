import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
const typeClassNames = {
    Info: {
        box: "border-blue-500/35 bg-blue-950/40 shadow-blue-950/20",
        icon: "text-blue-400",
        title: "text-blue-100",
        body: "text-blue-200/90",
        foot: "text-blue-300/80",
    },
    Alert: {
        box: "border-amber-500/40 bg-amber-950/35 shadow-amber-950/20",
        icon: "text-amber-400",
        title: "text-amber-100",
        body: "text-amber-200/90",
        foot: "text-amber-300/80",
    },
    Danger: {
        box: "border-red-500/40 bg-red-950/40 shadow-red-950/20",
        icon: "text-red-400",
        title: "text-red-100",
        body: "text-red-200/90",
        foot: "text-red-300/80",
    },
};
export function AppBanner({ title, description, footer, type, className }) {
    const s = typeClassNames[type];
    return (_jsxs("aside", { role: "status", className: cn("mb-8 flex gap-4 rounded-2xl border p-4 shadow-lg shadow-black/20", s.box, className), children: [_jsx("span", { className: cn("select-none text-2xl leading-none", s.icon), "aria-hidden": true, children: "\u26A0" }), _jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [_jsx("h2", { className: cn("font-[family-name:var(--font-display)] text-lg font-semibold tracking-wide", s.title), children: title }), _jsx("p", { className: cn("text-sm leading-relaxed", s.body), children: description }), _jsx("p", { className: cn("text-xs font-medium italic", s.foot), children: footer })] })] }));
}
