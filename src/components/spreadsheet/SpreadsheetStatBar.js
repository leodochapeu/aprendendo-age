import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { formatSpreadsheetStatValue, spreadsheetStatRatio } from "@/lib/unidadeSpreadsheetVisual";
/** Barra horizontal proporcional ao máximo de referência (ex.: PV ÷ 500). */
export function SpreadsheetStatBar({ value, max, barClass = "bg-red-500", className }) {
    const pct = spreadsheetStatRatio(value, max) * 100;
    return (_jsxs("div", { className: cn("flex min-w-[5.5rem] items-center gap-2", className), children: [_jsx("span", { className: "w-9 shrink-0 text-right text-sm tabular-nums text-zinc-200", children: formatSpreadsheetStatValue(value) }), _jsx("div", { className: "h-2 min-w-[3.25rem] flex-1 overflow-hidden rounded-full bg-zinc-800/90 ring-1 ring-inset ring-zinc-700/50", title: `${formatSpreadsheetStatValue(value)} / ${max}`, children: _jsx("div", { className: cn("h-full rounded-full transition-[width]", barClass), style: { width: `${pct}%` } }) })] }));
}
