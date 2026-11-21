import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { compareNumericTones, toneToTextClass } from "@/lib/numericCompare";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
export function InfoRow({ label, children, icon, labelAddon, aside = false, borderless = false }) {
    const icons = (Array.isArray(icon) ? icon : icon ? [icon] : [])
        .map((key) => resolveTokenIconSrc(key))
        .filter((src) => Boolean(src));
    return (_jsxs("div", { className: cn(aside
            ? "grid grid-cols-[minmax(0,1fr)_minmax(0,max-content)] items-center gap-x-3 py-3"
            : "grid gap-1 py-3 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-start sm:gap-6", !borderless && "border-b border-zinc-800/80 last:border-0"), children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [icons.length ? (_jsx("span", { className: "flex shrink-0 items-center gap-1", children: icons.map((src) => (_jsx("img", { src: src, alt: "", "aria-hidden": true, className: "size-5 shrink-0 object-contain opacity-90" }, src))) })) : null, _jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-zinc-500", children: label }), labelAddon] }), _jsx("div", { className: cn("min-w-0 text-sm text-zinc-200", aside && "text-right"), children: children })] }));
}
/** Uma linha de comparação: rótulo | valor A | valor B (uso típico em telas estreitas). */
export function CompareInfoRow({ label, left, right, icon, numericPair }) {
    const iconSrc = icon ? resolveTokenIconSrc(icon) : undefined;
    const tones = numericPair
        ? compareNumericTones(numericPair.left, numericPair.right, {
            lowerIsBetter: numericPair.lowerIsBetter,
        })
        : { left: "default", right: "default" };
    const leftToneClass = toneToTextClass(tones.left);
    const rightToneClass = toneToTextClass(tones.right);
    return (_jsxs("div", { className: "grid grid-cols-[minmax(0,5.75rem)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-2 gap-y-1 border-b border-zinc-800/80 py-2.5 last:border-0 sm:grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-3 sm:py-3", children: [_jsxs("div", { className: "flex min-w-0 items-start gap-1.5 pt-0.5", children: [iconSrc ? (_jsx("img", { src: iconSrc, alt: "", "aria-hidden": true, className: "mt-0.5 size-4 shrink-0 object-contain opacity-90 sm:size-5" })) : null, _jsx("span", { className: "text-[10px] font-medium uppercase leading-snug tracking-wide text-zinc-500 sm:text-xs", children: label })] }), _jsx("div", { className: cn("min-w-0 break-words text-xs sm:text-sm", leftToneClass), children: left }), _jsx("div", { className: cn("min-w-0 break-words text-right text-xs sm:text-sm", rightToneClass), children: right })] }));
}
