import { jsx as _jsx } from "react/jsx-runtime";
import { SpreadsheetStatBar } from "@/components/spreadsheet/SpreadsheetStatBar";
import { SpreadsheetStatRing } from "@/components/spreadsheet/SpreadsheetStatRing";
import { formatArmorPercent } from "@/lib/armorDisplay";
import { formatSpreadsheetStatValue, UNIDADE_STAT_VISUAL, } from "@/lib/unidadeSpreadsheetVisual";
function parseStatNumber(value) {
    if (value == null || value === "")
        return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
}
function renderVisual(n, spec) {
    if (spec.kind === "bar") {
        return _jsx(SpreadsheetStatBar, { value: n, max: spec.max, barClass: spec.barClass });
    }
    if (spec.kind === "percentRing") {
        return (_jsx(SpreadsheetStatRing, { value: n, max: spec.max, ringClass: spec.ringClass, label: formatArmorPercent(n) }));
    }
    return _jsx(SpreadsheetStatRing, { value: n, max: spec.max, ringClass: spec.ringClass });
}
/** Célula numérica com barra ou anel conforme `UNIDADE_STAT_VISUAL`. */
export function SpreadsheetStatCell({ field, value, }) {
    const n = parseStatNumber(value);
    if (n == null)
        return _jsx("span", { className: "text-zinc-500", children: "\u2014" });
    const spec = UNIDADE_STAT_VISUAL[field];
    if (!spec) {
        return _jsx("span", { className: "text-sm tabular-nums text-zinc-200", children: formatSpreadsheetStatValue(n) });
    }
    return renderVisual(n, spec);
}
/** Campo numérico opcional (dano, alcance, etc.) — só texto. */
export function SpreadsheetPlainNumCell({ value }) {
    const n = parseStatNumber(value);
    if (n == null)
        return _jsx("span", { className: "text-zinc-500", children: "\u2014" });
    return _jsx("span", { className: "text-sm tabular-nums text-zinc-200", children: formatSpreadsheetStatValue(n) });
}
