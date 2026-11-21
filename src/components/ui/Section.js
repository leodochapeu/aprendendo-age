import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { sectionWatermarkStripStyle } from "@/lib/watermarkImageStyle";
export function Section({ title, children, className, watermarkSrc }) {
    return (_jsxs("section", { className: cn("relative overflow-hidden rounded-2xl border border-aom-border bg-aom-card/60 p-5 shadow-sm shadow-black/20", className), children: [watermarkSrc ? (_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(40%,15rem)] overflow-hidden", children: _jsx("div", { className: "absolute inset-0 opacity-[0.33]", style: sectionWatermarkStripStyle(watermarkSrc) }) })) : null, _jsxs("div", { className: "relative z-[1]", children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-lg font-semibold text-amber-100/95", children: title }), _jsx("div", { className: "mt-3 text-sm leading-relaxed text-zinc-300", children: children })] })] }));
}
