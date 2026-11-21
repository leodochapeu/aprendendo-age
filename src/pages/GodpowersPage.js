import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GodpowersSpreadsheet } from "@/components/godpower/GodpowersSpreadsheet";
import { SpreadsheetPageWidth } from "@/components/spreadsheet/SpreadsheetPageWidth";
import { ListViewModeToggle } from "@/components/list/ListViewModeToggle";
import { ListPageStickyHeader } from "@/components/layout/ListPageStickyHeader";
import { SpreadsheetHoverPreview } from "@/components/spreadsheet/SpreadsheetHoverPreview";
import { EntityCard } from "@/components/ui/EntityCard";
import { EntityCardPreviewDescription } from "@/components/ui/EntityCardPreview";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useCatalog } from "@/hooks/useCatalog";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useListPageSearchQuery } from "@/hooks/useListPageSearchQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { formatGodNameForMetaNotion } from "@/lib/deusAssetUrl";
import { getGodPowerAssetUrl } from "@/lib/godPowerAssetUrl";
import { firstNumId, joinRefNomes } from "@/lib/entityRefs";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { pantheonCardTint } from "@/lib/pantheonCardTint";
function matches(g, q) {
    if (!q.trim())
        return true;
    const s = q.toLowerCase();
    return [
        g.nome,
        g.ingles ?? "",
        joinRefNomes(g.god),
        joinRefNomes(g.era),
        joinRefNomes(g.panteao),
        g.descricao_resumida ?? "",
        g.descricao_avancada ?? "",
        g.incremento_por_uso != null ? String(g.incremento_por_uso) : "",
        g.cooldown_seg != null ? String(g.cooldown_seg) : "",
        g.duracao_no_mapa_seg != null ? String(g.duracao_no_mapa_seg) : "",
        g.custo_repetir != null ? String(g.custo_repetir) : "",
    ]
        .join(" ")
        .toLowerCase()
        .includes(s);
}
const toolbarBtn = "rounded-xl border border-aom-border bg-zinc-900/50 px-3.5 py-2 text-sm font-medium text-amber-100/95 transition-colors hover:border-amber-500/40 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25 disabled:cursor-not-allowed disabled:opacity-45";
export function GodpowersPage() {
    const { t } = useTranslation();
    const { deusById, godpowers, godpowerSlugById, panteaoById } = useCatalog();
    const navigate = useNavigate();
    const { pathname, search: locSearch } = useLocation();
    const listIndexState = useMemo(() => listIndexLinkStateFromLocation(pathname, locSearch), [pathname, locSearch]);
    const [q, setQ] = useListPageSearchQuery();
    const [viewMode, setViewMode] = useListViewMode("godpowers");
    const [spreadsheetPreview, setSpreadsheetPreview] = useState(null);
    const [compareMode, setCompareMode] = useState(false);
    const [selectedSlugs, setSelectedSlugs] = useState([]);
    const filtered = useMemo(() => godpowers.filter((g) => matches(g, q)), [godpowers, q]);
    function toggleSelect(slug) {
        setSelectedSlugs((prev) => {
            if (prev.includes(slug))
                return prev.filter((x) => x !== slug);
            if (prev.length >= 2)
                return prev;
            return [...prev, slug];
        });
    }
    function exitCompareMode() {
        setCompareMode(false);
        setSelectedSlugs([]);
    }
    function enterCompareMode() {
        setCompareMode(true);
        setSelectedSlugs([]);
    }
    const canCompare = selectedSlugs.length === 2;
    const showSpreadsheetPreview = viewMode === "planilha" && !compareMode;
    return (_jsxs("div", { className: "w-full min-w-0", children: [_jsxs(ListPageStickyHeader, { children: [_jsx(PageHeader, { title: t("pages.godpowers.title"), description: t("pages.godpowers.description"), className: "!mb-0 w-full", actions: showSpreadsheetPreview ? (_jsx(SpreadsheetHoverPreview, { preview: spreadsheetPreview, className: "sm:pt-1" })) : undefined }), _jsxs("div", { className: "flex flex-col items-start gap-3", children: [_jsxs("div", { className: "flex w-full flex-wrap items-center justify-between gap-3", children: [_jsx(SearchField, { value: q, onChange: setQ, placeholder: t("common.filter"), id: "gp-search" }), _jsx("div", { className: "flex flex-wrap items-center justify-end gap-2", children: !compareMode ? (_jsx("button", { type: "button", className: toolbarBtn, onClick: enterCompareMode, children: t("common.compareMode") })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: toolbarBtn, onClick: exitCompareMode, children: t("common.cancel") }), _jsx("button", { type: "button", className: toolbarBtn, disabled: !canCompare, onClick: () => {
                                                        if (!canCompare)
                                                            return;
                                                        navigate(`/poderes/compare/${selectedSlugs[0]}/${selectedSlugs[1]}`);
                                                    }, children: t("common.compare") })] })) })] }), !compareMode ? (_jsx(ListViewModeToggle, { mode: viewMode, onChange: setViewMode, id: "godpowers-view-mode" })) : null] })] }), viewMode === "planilha" ? (_jsx(SpreadsheetPageWidth, { children: _jsx(GodpowersSpreadsheet, { rows: filtered, linkState: listIndexState, onPreview: compareMode ? undefined : setSpreadsheetPreview, compareMode: compareMode, selectedSlugs: selectedSlugs, onToggleSelect: toggleSelect }) })) : (_jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: filtered.map((g) => {
                    const slug = godpowerSlugById.get(g.id) ?? String(g.id);
                    const selected = selectedSlugs.includes(slug);
                    const selectDisabled = compareMode && selectedSlugs.length >= 2 && !selected;
                    const godRefId = firstNumId(g.god);
                    const deus = godRefId != null ? deusById.get(godRefId) : undefined;
                    const godLine = deus ? formatGodNameForMetaNotion(deus) : joinRefNomes(g.god);
                    const pId = firstNumId(g.panteao);
                    return (_jsx("li", { children: _jsx(EntityCard, { to: `/poderes/${slug}`, linkState: listIndexState, title: g.nome, cardTint: pantheonCardTint(pId != null ? (panteaoById.get(pId)?.nome ?? "") : ""), subtitle: g.descricao_resumida, meta: _jsx(MetaNotionLine, { parts: [godLine, joinRefNomes(g.era), joinRefNomes(g.panteao)] }), watermarkSrc: getGodPowerAssetUrl(g), subtitleMinLines: 3, subtitleTag: false, hoverPreview: g.descricao_avancada ? (_jsx(EntityCardPreviewDescription, { text: g.descricao_avancada })) : undefined, compareMode: compareMode, selected: selected, selectDisabled: selectDisabled, onToggleSelect: () => toggleSelect(slug) }) }, g.id));
                }) })), filtered.length === 0 ? (_jsx("p", { className: "mt-8 text-center text-sm text-zinc-500", children: t("common.noResults") })) : null] }));
}
