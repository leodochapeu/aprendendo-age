import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { ModalApp } from "@/components/ui/ModalApp";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
import { COMPARE_OPS, UNIT_STAT_FIELDS, UNIT_STAT_META, collectTipoOptions, countActiveUnitFilters, createAdvancedRule, emptyUnitListFilters, unidadeMatchesFilters, } from "@/lib/unidadeFilters";
const OP_SYMBOL = {
    gt: ">",
    gte: "≥",
    eq: "=",
    lt: "<",
    lte: "≤",
};
function patch(filters, partial) {
    return { ...filters, ...partial };
}
function CompareOpPicker({ value, onChange, }) {
    const { t } = useTranslation();
    return (_jsx("div", { role: "group", "aria-label": t("pages.unidades.filters.compareAria"), className: "inline-flex shrink-0 rounded-lg border border-aom-border bg-zinc-950 p-0.5", children: COMPARE_OPS.map((op) => {
            const label = t(`pages.unidades.filters.ops.${op}`);
            const active = value === op;
            return (_jsxs("div", { className: "group/op relative", children: [_jsx("button", { type: "button", "aria-pressed": active, "aria-label": label, title: label, onClick: () => onChange(op), className: cn("flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40", active ? "bg-amber-500/20 text-amber-100" : "text-zinc-400 hover:text-zinc-100"), children: OP_SYMBOL[op] }), _jsx("span", { role: "tooltip", className: "pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-950/95 px-2 py-1 text-[10px] font-medium text-zinc-200 opacity-0 shadow-lg shadow-black/40 transition duration-150 group-hover/op:opacity-100 group-focus-within/op:opacity-100", children: label })] }, op));
        }) }));
}
function AdvancedRuleRow({ rule, onChange, onRemove, }) {
    const { t } = useTranslation();
    const icon = rule.field ? UNIT_STAT_META[rule.field].icon : undefined;
    const iconSrc = icon ? resolveTokenIconSrc(icon) : undefined;
    return (_jsxs("div", { className: "flex flex-col gap-2 rounded-xl border border-aom-border/80 bg-zinc-900/40 p-2 sm:flex-row sm:items-center", children: [_jsxs("label", { className: "flex min-w-0 flex-1 items-center gap-2", children: [iconSrc ? (_jsx("img", { src: iconSrc, alt: "", "aria-hidden": true, className: "size-5 shrink-0 object-contain" })) : (_jsx("span", { className: "size-5 shrink-0", "aria-hidden": true })), _jsx("span", { className: "sr-only", children: t("pages.unidades.filters.chooseStat") }), _jsxs("select", { value: rule.field, onChange: (event) => onChange({ ...rule, field: event.target.value }), className: "min-w-0 flex-1 rounded-lg border border-aom-border bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25", children: [_jsx("option", { value: "", children: t("pages.unidades.filters.chooseStat") }), UNIT_STAT_FIELDS.map((field) => (_jsx("option", { value: field, children: t(UNIT_STAT_META[field].labelKey) }, field)))] })] }), _jsx(CompareOpPicker, { value: rule.op, onChange: (op) => onChange({ ...rule, op }) }), _jsxs("label", { className: "shrink-0", children: [_jsx("span", { className: "sr-only", children: t("pages.unidades.filters.value") }), _jsx("input", { value: rule.value, inputMode: "decimal", placeholder: "0", onChange: (event) => onChange({ ...rule, value: event.target.value }), className: "w-full rounded-lg border border-aom-border bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25 sm:w-24" })] }), _jsx("button", { type: "button", onClick: onRemove, "aria-label": t("pages.unidades.filters.removeCondition"), className: "inline-flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-lg border border-aom-border text-zinc-400 transition hover:border-red-400/40 hover:text-red-300 sm:self-auto", children: "\u00D7" })] }));
}
export function UnidadeFiltersModal({ open, onClose, filters, onApply, pantheons, eras, units, countable, }) {
    const { t } = useTranslation();
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [draft, setDraft] = useState(filters);
    const [sessionOpen, setSessionOpen] = useState(open);
    if (open !== sessionOpen) {
        setSessionOpen(open);
        if (open)
            setDraft(filters);
    }
    const activeCount = countActiveUnitFilters(draft);
    const resultCount = useMemo(() => countable.filter((unit) => unidadeMatchesFilters(unit, draft)).length, [countable, draft]);
    const usedPantheonIds = useMemo(() => {
        const ids = new Set();
        for (const unit of units) {
            for (const ref of unit.panteao ?? [])
                ids.add(ref.id);
        }
        return ids;
    }, [units]);
    const usedEraIds = useMemo(() => {
        const ids = new Set();
        for (const unit of units) {
            for (const ref of unit.era ?? [])
                ids.add(ref.id);
        }
        return ids;
    }, [units]);
    const pantheonOptions = useMemo(() => pantheons
        .filter((item) => usedPantheonIds.has(item.id))
        .map((item) => ({
        value: String(item.id),
        label: item.nome,
        iconSrc: item.icon ? resolveTokenIconSrc(item.icon) : undefined,
    })), [pantheons, usedPantheonIds]);
    const eraOptions = useMemo(() => eras
        .filter((item) => usedEraIds.has(item.id))
        .map((item) => ({
        value: String(item.id),
        label: item.nome,
        iconSrc: item.icon ? resolveTokenIconSrc(item.icon) : undefined,
    })), [eras, usedEraIds]);
    const tipoOptions = useMemo(() => collectTipoOptions(units).map((item) => ({
        value: item.key,
        label: item.label,
        iconSrc: item.icon ? resolveTokenIconSrc(item.icon) : undefined,
    })), [units]);
    function updateRule(next) {
        setDraft((current) => patch(current, { advanced: current.advanced.map((rule) => (rule.id === next.id ? next : rule)) }));
    }
    const advancedCount = draft.advanced.filter((rule) => rule.field || rule.value.trim()).length;
    return (_jsxs(ModalApp, { open: open, onClose: onClose, title: t("pages.unidades.filters.title"), className: "max-w-2xl", children: [_jsxs("div", { className: "space-y-4 pb-8", children: [_jsx(MultiSelect, { label: t("common.pantheon"), placeholder: t("pages.unidades.filters.pantheonPlaceholder"), options: pantheonOptions, value: draft.pantheonIds.map(String), onChange: (next) => setDraft((current) => patch(current, { pantheonIds: next.map(Number).filter((id) => Number.isFinite(id)) })) }), _jsx(MultiSelect, { label: t("common.era"), placeholder: t("pages.unidades.filters.eraPlaceholder"), options: eraOptions, value: draft.eraIds.map(String), onChange: (next) => setDraft((current) => patch(current, { eraIds: next.map(Number).filter((id) => Number.isFinite(id)) })) }), _jsx(MultiSelect, { label: t("common.category"), placeholder: t("pages.unidades.filters.categoryPlaceholder"), options: tipoOptions, value: draft.tipoKeys, onChange: (tipoKeys) => setDraft((current) => patch(current, { tipoKeys })) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { type: "button", "aria-expanded": advancedOpen, onClick: () => setAdvancedOpen((current) => !current), className: "flex w-full items-center justify-between gap-3 rounded-xl border border-aom-border bg-zinc-900/50 px-3.5 py-2.5 text-sm font-medium text-amber-100/95 transition hover:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/25", children: [_jsxs("span", { className: "inline-flex items-center gap-2", children: [t("pages.unidades.filters.advanced"), advancedCount > 0 ? (_jsx("span", { className: "inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs text-amber-100", children: advancedCount })) : null] }), _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, className: cn("shrink-0 text-zinc-400 transition-transform", advancedOpen && "rotate-180"), children: _jsx("path", { d: "M6 9l6 6 6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), advancedOpen ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs text-zinc-500", children: t("pages.unidades.filters.advancedHint") }), draft.advanced.map((rule) => (_jsx(AdvancedRuleRow, { rule: rule, onChange: updateRule, onRemove: () => setDraft((current) => patch(current, { advanced: current.advanced.filter((item) => item.id !== rule.id) })) }, rule.id))), _jsx("button", { type: "button", onClick: () => setDraft((current) => patch(current, { advanced: [...current.advanced, createAdvancedRule()] })), className: "rounded-xl border border-dashed border-aom-border px-3 py-2 text-sm text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-100", children: t("pages.unidades.filters.addCondition") })] })) : null] })] }), _jsxs("div", { className: "sticky bottom-0 -mx-5 -mb-5 mt-1 flex items-center justify-between gap-3 border-t border-aom-border bg-zinc-950 px-5 py-4", children: [_jsx("button", { type: "button", disabled: activeCount === 0, onClick: () => setDraft(emptyUnitListFilters()), className: "rounded-xl border border-aom-border px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40", children: t("pages.unidades.filters.clear") }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("p", { className: "text-sm text-zinc-400", children: resultCount === 1
                                    ? t("pages.unidades.filters.showingOne")
                                    : t("pages.unidades.filters.showing", { count: resultCount }) }), _jsx("button", { type: "button", onClick: () => {
                                    onApply(draft);
                                    onClose();
                                }, className: "rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/25", children: t("pages.unidades.filters.apply") })] })] })] }));
}
