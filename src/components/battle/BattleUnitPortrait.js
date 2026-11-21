import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
const SIZE = {
    sm: "size-14",
    md: "size-20",
    lg: "size-28 sm:size-32",
};
export function BattleUnitPortrait({ nome, icon, selected, disabled, locked, size = "md", onClick, className, }) {
    const src = getUnidadeAssetUrl({ icon });
    const body = (_jsx(_Fragment, { children: src ? (_jsx("img", { src: src, alt: "", "aria-hidden": true, className: cn("size-full object-contain p-1.5 transition", locked && "grayscale opacity-45") })) : (_jsx("span", { className: "px-1 text-center text-[10px] leading-tight text-zinc-400", children: nome })) }));
    if (onClick) {
        return (_jsxs("button", { type: "button", title: nome, disabled: disabled, onClick: onClick, className: cn("relative shrink-0 overflow-hidden rounded-xl border bg-zinc-900/80 shadow-md shadow-black/40 transition", SIZE[size], selected
                ? "border-amber-400 ring-2 ring-amber-400/40"
                : "border-aom-border hover:border-amber-400/60 hover:bg-zinc-900", disabled && !locked && "cursor-not-allowed opacity-40 hover:border-aom-border", locked &&
                "cursor-not-allowed border-zinc-700 bg-zinc-950 hover:border-zinc-700", className), children: [body, locked ? (_jsx("span", { "aria-hidden": true, className: "absolute inset-0 flex items-center justify-center bg-black/30", children: _jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "size-6 text-zinc-200 drop-shadow", children: [_jsx("rect", { x: "5", y: "10", width: "14", height: "11", rx: "2" }), _jsx("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })] }) })) : null, _jsx("span", { className: "sr-only", children: nome })] }));
    }
    return (_jsx("div", { title: nome, className: cn("relative shrink-0 overflow-hidden rounded-xl border border-aom-border bg-zinc-900/80 shadow-md shadow-black/40", SIZE[size], className), children: body }));
}
