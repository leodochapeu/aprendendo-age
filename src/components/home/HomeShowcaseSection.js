import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
export function HomeShowcaseSection({ title, description, trailHint, children, className, accent = "amber", }) {
    const accentBar = accent === "teal" ? "from-teal-500/80 to-teal-400/20" : "from-amber-500/80 to-amber-400/20";
    return (_jsxs("section", { className: cn("space-y-5", className), children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: cn("mb-2 h-1 w-12 rounded-full bg-gradient-to-r", accentBar), "aria-hidden": true }), _jsx("h2", { className: "font-[family-name:var(--font-display)] text-xl font-semibold text-amber-100 sm:text-2xl", children: title }), _jsx("p", { className: "mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base", children: description })] }), trailHint ? (_jsx("p", { className: "shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 sm:text-right", children: trailHint })) : null] }), children] }));
}
