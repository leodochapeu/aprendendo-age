import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ListPageStickyHeader } from "@/components/layout/ListPageStickyHeader";
import { ListViewModeToggle } from "@/components/list/ListViewModeToggle";
import { SpreadsheetHoverPreview } from "@/components/spreadsheet/SpreadsheetHoverPreview";
import { SpreadsheetPageWidth } from "@/components/spreadsheet/SpreadsheetPageWidth";
import { TecnologiaTipoBadges } from "@/components/tecnologia/TecnologiaTipoBadges";
import { TecnologiasSpreadsheet } from "@/components/tecnologia/TecnologiasSpreadsheet";
import { EntityCard } from "@/components/ui/EntityCard";
import { EntityCardPreviewText } from "@/components/ui/EntityCardPreview";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { NotionText } from "@/components/ui/NotionText";
import { PantheonMetaIcon } from "@/components/ui/PantheonMetaIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useCatalog } from "@/hooks/useCatalog";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useListPageSearchQuery } from "@/hooks/useListPageSearchQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { firstNumId, joinRefNomesOrString } from "@/lib/entityRefs";
import { pantheonCardTint } from "@/lib/pantheonCardTint";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { getTecnologiaAssetUrl } from "@/lib/tecnologiaAssetUrl";
import { localeSectionPath } from "@/lib/localeRoutes";
import { campoSearchBlob } from "@/lib/tecnologiaCampo";
function matches(t, q) {
    if (!q.trim())
        return true;
    const s = q.toLowerCase();
    return [
        t.nome,
        t.ingles ?? "",
        t.tipo ?? "",
        t.beneficia ?? "",
        campoSearchBlob(t.campo),
        joinRefNomesOrString(t.panteoes),
        joinRefNomesOrString(t.eras),
        joinRefNomesOrString(t.god_especifico),
        joinRefNomesOrString(t.construcao_origem),
        t.comida != null ? String(t.comida) : "",
        t.madeira != null ? String(t.madeira) : "",
        t.ouro != null ? String(t.ouro) : "",
        t.favor != null ? String(t.favor) : "",
        t.tempo_s != null ? String(t.tempo_s) : "",
    ]
        .join(" ")
        .toLowerCase()
        .includes(s);
}
export function TecnologiasPage() {
    const { t, locale } = useTranslation();
    const { tecnologias, tecnologiaSlugByIndex } = useCatalog();
    const { pathname, search: locSearch } = useLocation();
    const listIndexState = useMemo(() => listIndexLinkStateFromLocation(pathname, locSearch), [pathname, locSearch]);
    const [q, setQ] = useListPageSearchQuery();
    const [viewMode, setViewMode] = useListViewMode("tecnologias");
    const [spreadsheetPreview, setSpreadsheetPreview] = useState(null);
    const filtered = useMemo(() => tecnologias
        .map((tec, index) => ({ t: tec, index }))
        .filter(({ t: tec }) => matches(tec, q)), [tecnologias, q]);
    return (_jsxs("div", { className: "w-full min-w-0", children: [_jsxs(ListPageStickyHeader, { children: [_jsx(PageHeader, { title: t("pages.tecnologias.title"), description: t("pages.tecnologias.description"), className: "!mb-0 w-full", actions: viewMode === "planilha" ? (_jsx(SpreadsheetHoverPreview, { preview: spreadsheetPreview, className: "sm:pt-1" })) : undefined }), _jsxs("div", { className: "flex flex-col items-start gap-3", children: [_jsx(SearchField, { value: q, onChange: setQ, placeholder: t("pages.tecnologias.filterPlaceholder"), id: "tec-search" }), _jsx(ListViewModeToggle, { mode: viewMode, onChange: setViewMode, id: "tecnologias-view-mode" })] })] }), viewMode === "planilha" ? (_jsx(SpreadsheetPageWidth, { children: _jsx(TecnologiasSpreadsheet, { rows: filtered, linkState: listIndexState, onPreview: setSpreadsheetPreview }) })) : (_jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: filtered.map(({ t: tec, index }) => (_jsx("li", { children: _jsx(EntityCard, { to: localeSectionPath(locale, "tecnologias", tecnologiaSlugByIndex.get(index) ?? index), linkState: listIndexState, title: tec.nome || t("pages.tecnologias.untitled", { index }), cardTint: pantheonCardTint(joinRefNomesOrString(tec.panteoes)), watermarkSrc: getTecnologiaAssetUrl(tec), subtitle: tec.beneficia ? _jsx(NotionText, { text: tec.beneficia }) : undefined, meta: _jsxs("span", { className: "flex flex-col gap-1.5", children: [_jsxs("span", { className: "inline-flex flex-wrap items-baseline gap-x-0", children: [Array.isArray(tec.panteoes) && firstNumId(tec.panteoes) != null ? (_jsx(PantheonMetaIcon, { panteaoId: firstNumId(tec.panteoes) })) : null, _jsx(MetaNotionLine, { parts: [joinRefNomesOrString(tec.panteoes), joinRefNomesOrString(tec.eras)] })] }), tec.tipo?.trim() ? _jsx(TecnologiaTipoBadges, { tipo: tec.tipo }) : null] }), hoverPreview: tec.campo?.length ? _jsx(EntityCardPreviewText, { lines: tec.campo, maxLines: 4 }) : undefined }) }, `${index}-${tec.nome}`))) })), filtered.length === 0 ? (_jsx("p", { className: "mt-8 text-center text-sm text-zinc-500", children: t("common.noResults") })) : null] }));
}
