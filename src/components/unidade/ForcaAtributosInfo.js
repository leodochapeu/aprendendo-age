import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { ModalApp } from "@/components/ui/ModalApp";
import { useTranslation } from "@/hooks/useTranslation";
import { attributeStrengthBreakdown, } from "@/lib/forcaAtributos";
import { cn } from "@/lib/cn";
const TERM_LABEL = {
    hitPoints: "spreadsheet.unidades.hitPoints",
    hackArmor: "spreadsheet.unidades.hackArmor",
    pierceArmor: "spreadsheet.unidades.pierceArmor",
    moveSpeed: "spreadsheet.unidades.moveSpeed",
    dps: "spreadsheet.unidades.dps",
    artilleryBonus: "spreadsheet.unidades.attributeStrengthInfo.artilleryBonus",
    trainTime: "spreadsheet.unidades.trainTime",
    resourceHalf: "spreadsheet.unidades.attributeStrengthInfo.resourceHalf",
    population: "spreadsheet.unidades.population",
};
function formatAmount(value, locale) {
    return value.toLocaleString(locale === "pt" ? "pt-BR" : "en-US", {
        maximumFractionDigits: 2,
    });
}
function signedAmount(amount, locale) {
    const formatted = formatAmount(Math.abs(amount), locale);
    return amount < 0 ? `− ${formatted}` : `+ ${formatted}`;
}
function InfoIcon() {
    return (_jsxs("svg", { viewBox: "0 0 20 20", "aria-hidden": true, className: "size-4", fill: "none", children: [_jsx("circle", { cx: "10", cy: "10", r: "7.25", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("circle", { cx: "10", cy: "6.35", r: "0.9", fill: "currentColor" }), _jsx("path", { d: "M10 9.15v5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
}
export function ForcaAtributosInfo({ u }) {
    const { t, locale } = useTranslation();
    const [open, setOpen] = useState(false);
    const breakdown = attributeStrengthBreakdown(u);
    const adds = t("spreadsheet.unidades.attributeStrengthInfo.adds").split("\n");
    const subtracts = t("spreadsheet.unidades.attributeStrengthInfo.subtracts").split("\n");
    return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", "aria-label": t("spreadsheet.unidades.attributeStrengthInfo.aria"), onClick: () => setOpen(true), className: "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40", children: _jsx(InfoIcon, {}) }), _jsxs(ModalApp, { open: open, onClose: () => setOpen(false), title: t("spreadsheet.unidades.attributeStrengthInfo.title"), className: "max-w-lg", children: [_jsx("p", { className: "text-sm leading-relaxed text-zinc-300", children: t("spreadsheet.unidades.attributeStrengthInfo.intro") }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(TermList, { title: t("spreadsheet.unidades.attributeStrengthInfo.addsTitle"), items: adds, sign: "+" }), _jsx(TermList, { title: t("spreadsheet.unidades.attributeStrengthInfo.subtractsTitle"), items: subtracts, sign: "\u2212" })] }), _jsx("p", { className: "text-sm leading-relaxed text-zinc-400", children: t("spreadsheet.unidades.attributeStrengthInfo.note") }), _jsxs("div", { className: "overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60", children: [_jsx("p", { className: "border-b border-zinc-800 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500", children: t("spreadsheet.unidades.attributeStrengthInfo.thisUnit") }), _jsx("ul", { children: breakdown.terms
                                    .filter((term) => term.id !== "artilleryBonus" || term.amount !== 0)
                                    .map((term) => (_jsx(BreakdownRow, { term: term, locale: locale, breakdown: breakdown, t: t }, term.id))) }), _jsxs("div", { className: "flex items-baseline justify-between gap-3 border-t border-zinc-700 bg-zinc-900/70 px-3 py-2.5", children: [_jsx("span", { className: "text-sm font-medium text-amber-100", children: t("spreadsheet.unidades.attributeStrengthInfo.result") }), _jsx("span", { className: "font-[family-name:var(--font-display)] text-lg tabular-nums text-amber-100", children: formatAmount(breakdown.total, locale) })] })] })] })] }));
}
function TermList({ title, items, sign }) {
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-wide text-zinc-500", children: title }), _jsx("ul", { className: "mt-2 space-y-1.5", children: items.filter(Boolean).map((item) => (_jsxs("li", { className: "flex gap-2 text-sm leading-snug text-zinc-200", children: [_jsx("span", { className: cn("w-3 shrink-0 tabular-nums", sign === "+" ? "text-emerald-400" : "text-red-300"), children: sign }), _jsx("span", { children: item })] }, item))) })] }));
}
function BreakdownRow({ term, locale, breakdown, t, }) {
    return (_jsxs("li", { className: "flex items-start justify-between gap-3 border-b border-zinc-800/80 px-3 py-2 last:border-0", children: [_jsxs("span", { className: "min-w-0 text-sm text-zinc-300", children: [_jsx("span", { className: "block", children: t(TERM_LABEL[term.id]) }), term.id === "resourceHalf" ? (_jsx("span", { className: "mt-0.5 block text-xs text-zinc-500", children: t("spreadsheet.unidades.attributeStrengthInfo.resourceHalfDetail", {
                            food: formatAmount(breakdown.food, locale),
                            wood: formatAmount(breakdown.wood, locale),
                            gold: formatAmount(breakdown.gold, locale),
                            sum: formatAmount(breakdown.resourceSum, locale),
                        }) })) : null] }), _jsx("span", { className: cn("shrink-0 tabular-nums text-sm", term.amount < 0 ? "text-red-300" : "text-emerald-300"), children: signedAmount(term.amount, locale) })] }));
}
