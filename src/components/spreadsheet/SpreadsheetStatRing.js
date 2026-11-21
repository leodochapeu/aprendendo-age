import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { formatSpreadsheetStatValue, spreadsheetStatRatio } from "@/lib/unidadeSpreadsheetVisual";
const R = 10;
const C = 2 * Math.PI * R;
/** Anel circular proporcional ao máximo de referência (ex.: Comida ÷ 100). */
export function SpreadsheetStatRing({ value, max, ringClass = "stroke-amber-400", label, className, }) {
    const ratio = spreadsheetStatRatio(value, max);
    const offset = C * (1 - ratio);
    const display = label ?? formatSpreadsheetStatValue(value);
    return (_jsxs("div", { className: cn("flex min-w-[4.75rem] items-center gap-2", className), title: `${display} / ${max}`, children: [_jsx("span", { className: "min-w-[1.75rem] shrink-0 text-sm tabular-nums text-zinc-200", children: display }), _jsxs("svg", { width: "26", height: "26", viewBox: "0 0 28 28", className: "shrink-0 -rotate-90", "aria-hidden": true, children: [_jsx("circle", { cx: "14", cy: "14", r: R, className: "stroke-zinc-800", strokeWidth: "3", fill: "none" }), _jsx("circle", { cx: "14", cy: "14", r: R, className: cn(ringClass, "fill-none"), strokeWidth: "3", strokeDasharray: C, strokeDashoffset: offset, strokeLinecap: "round" })] })] }));
}
