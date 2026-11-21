import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
const STYLE = {
    game: "border-amber-300/40 bg-amber-400/15 text-amber-50",
    bug: "border-rose-300/40 bg-rose-400/15 text-rose-50",
    matches: "border-sky-300/40 bg-sky-400/15 text-sky-50",
    mods: "border-violet-300/40 bg-violet-400/15 text-violet-50",
    news: "border-emerald-300/40 bg-emerald-400/15 text-emerald-50",
    championships: "border-orange-300/40 bg-orange-400/15 text-orange-50",
    other: "border-zinc-300/30 bg-zinc-400/10 text-zinc-100",
};
export function TopicCategoryBadge({ category, label, selected = false, onClick, }) {
    const className = cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide", STYLE[category], onClick && "transition hover:brightness-110", selected && "ring-2 ring-white/70");
    const content = (_jsxs(_Fragment, { children: [_jsx(CategoryIcon, { category: category }), label] }));
    if (!onClick)
        return _jsx("span", { className: className, children: content });
    return (_jsx("button", { type: "button", className: className, "aria-pressed": selected, onClick: onClick, children: content }));
}
function CategoryIcon({ category }) {
    const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true };
    const paths = {
        game: _jsx("path", { d: "M8 8h.01M16 8h.01M7 16c1.5-1.5 3.2-2 5-2s3.5.5 5 2M8 12h8M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" }),
        bug: _jsx("path", { d: "M8 9h8M12 9V5M7 13H5M19 13h-2M8 17l-2 3M16 17l2 3M8 13a4 4 0 0 0 8 0V9H8v4Z" }),
        matches: _jsx("path", { d: "M14.5 4.5 19 9l-5 1-4 4-1 5-4.5-4.5L9 10l4-4 1.5-1.5ZM5 19l4-4" }),
        mods: _jsx("path", { d: "M14 7h6v6M10 17H4v-6M14 7l-4 4M4 11l6 6" }),
        news: _jsx("path", { d: "M5 6h11a3 3 0 0 1 3 3v9H8a3 3 0 0 0-3 3V6Zm0 12a3 3 0 0 1 3-3h11M9 10h6M9 14h4" }),
        championships: _jsx("path", { d: "M8 4h8v3a4 4 0 0 1-8 0V4ZM6 6H4a3 3 0 0 0 3 4M18 6h2a3 3 0 0 1-3 4M12 15v2M9 21h6M10 19h4" }),
        other: _jsx("path", { d: "M6 12h.01M12 12h.01M18 12h.01", strokeLinecap: "round" }),
    };
    return _jsx("svg", { ...common, children: paths[category] });
}
