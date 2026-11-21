import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageSuggestionButton } from "@/components/suggestions/PageSuggestionButton";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { detailNavScopeFromState, detailSiblingPaths, } from "@/lib/detailSibling";
const buttonClass = "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-aom-border bg-zinc-900/50 text-amber-100/90 transition hover:border-amber-500/40 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25";
function ArrowIcon({ direction }) {
    return (_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: direction === "prev" ? (_jsx("path", { d: "M19 12H5M11 6l-6 6 6 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })) : (_jsx("path", { d: "M5 12h14M13 6l6 6-6 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })) }));
}
export function DetailSiblingNav({ prevTo, nextTo, state, className }) {
    const { t } = useTranslation();
    const previousLabel = t("common.previousRecord");
    const nextLabel = t("common.nextRecord");
    return (_jsxs("div", { role: "group", "aria-label": t("common.recordNavigation"), className: cn("flex items-center gap-1.5", className), children: [_jsx(Link, { to: prevTo, state: state, title: previousLabel, "aria-label": previousLabel, className: buttonClass, children: _jsx(ArrowIcon, { direction: "prev" }) }), _jsx(Link, { to: nextTo, state: state, title: nextLabel, "aria-label": nextLabel, className: buttonClass, children: _jsx(ArrowIcon, { direction: "next" }) }), _jsx(PageSuggestionButton, {})] }));
}
/** Setas da ficha atual para a anterior e a próxima da mesma lista, em ordem de id. */
export function CatalogRecordNav({ section, currentId, className }) {
    const catalog = useCatalog();
    const { locale } = useTranslation();
    const { state } = useLocation();
    const paths = useMemo(() => detailSiblingPaths(catalog, section, currentId, locale, detailNavScopeFromState(state, catalog)), [catalog, section, currentId, locale, state]);
    if (!paths)
        return null;
    return _jsx(DetailSiblingNav, { prevTo: paths.prev, nextTo: paths.next, state: state, className: className });
}
