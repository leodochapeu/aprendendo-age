import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { SPREADSHEET_VIEWPORT_HEIGHT_VAR } from "@/lib/listPageStickyOffset";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
/** Primeira coluna fixa ao rolar horizontalmente (canto com thead sticky). */
export const spreadsheetStickyColThClass = "sticky left-0 top-0 z-20 bg-zinc-950 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.85)]";
/** Corpo: acompanha hover/seleção da linha (`group` no `SpreadsheetTr`). */
export const spreadsheetStickyColTdClass = "sticky left-0 z-[5] bg-zinc-950 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.7)] group-hover:bg-zinc-900 group-data-[selected]:bg-amber-950";
/** Planilha com altura limitada à viewport e scroll vertical + horizontal internos. */
export function SpreadsheetTable({ children, className, tableClassName }) {
    return (_jsx("div", { className: cn("flex w-full min-w-0 flex-col rounded-xl border border-aom-border bg-zinc-950/30", "px-4 py-4 md:px-5 md:py-5", className), children: _jsx("div", { className: "spreadsheet-scroll min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain", style: { maxHeight: `var(${SPREADSHEET_VIEWPORT_HEIGHT_VAR}, min(60vh, 32rem))` }, children: _jsx("table", { className: cn("w-max min-w-full border-collapse text-sm", tableClassName ?? "min-w-[960px]"), children: children }) }) }));
}
export function SpreadsheetHead({ children }) {
    return (_jsx("thead", { className: "sticky top-0 z-10 border-b border-aom-border bg-zinc-950 shadow-[0_1px_0_0] shadow-zinc-800/80", children: _jsx("tr", { className: "text-left text-xs font-medium uppercase tracking-wide text-zinc-500", children: children }) }));
}
export function SpreadsheetTh({ children, className, icon, stickyColumn, }) {
    const iconSrc = icon ? resolveTokenIconSrc(icon) : undefined;
    return (_jsx("th", { className: cn("whitespace-nowrap bg-zinc-950 px-3 py-2.5 font-medium", stickyColumn && spreadsheetStickyColThClass, className), children: _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [iconSrc ? (_jsx("img", { src: iconSrc, alt: "", "aria-hidden": true, className: "size-4 shrink-0 object-contain opacity-90" })) : null, _jsx("span", { children: children })] }) }));
}
export function SpreadsheetBody({ children }) {
    return _jsx("tbody", { className: "divide-y divide-aom-border/80", children: children });
}
export function SpreadsheetTr({ children, className, onClick, selected, }) {
    return (_jsx("tr", { className: cn("group bg-zinc-950/40 transition-colors hover:bg-zinc-900/50", className), "data-selected": selected ? "" : undefined, onClick: onClick, children: children }));
}
export function SpreadsheetTd({ children, className, onClick, stickyColumn, }) {
    return (_jsx("td", { className: cn("align-top px-3 py-2.5 text-zinc-200", stickyColumn && spreadsheetStickyColTdClass, className), onClick: onClick, children: children }));
}
/** Lista vertical de chips na mesma célula (como no Notion). */
export function SpreadsheetCellStack({ children, className }) {
    return _jsx("div", { className: cn("flex flex-col gap-0.5", className), children: children });
}
