import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListPageStickyHeader } from "@/components/layout/ListPageStickyHeader";
import { EntityCard } from "@/components/ui/EntityCard";
import { EntityCardPreviewStats } from "@/components/ui/EntityCardPreview";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useCatalog } from "@/hooks/useCatalog";
import { useListPageSearchQuery } from "@/hooks/useListPageSearchQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { firstNome, firstNumId, joinRefNomes } from "@/lib/entityRefs";
import { getAldeaoAssetUrl } from "@/lib/entityWatermarkUrls";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { pantheonCardTint } from "@/lib/pantheonCardTint";
function matches(a, q) {
    if (!q.trim())
        return true;
    const s = q.toLowerCase();
    return [a.nome, a.ingles ?? "", joinRefNomes(a.panteao)].join(" ").toLowerCase().includes(s);
}
function zeroValueClass(value) {
    return value === 0 ? "text-zinc-500" : undefined;
}
function gatherBonusValueClass(baseValue, percentBonus) {
    if (baseValue === 0)
        return "text-zinc-500";
    if (percentBonus == null || percentBonus === 0)
        return undefined;
    return percentBonus > 0 ? "text-emerald-400" : "text-red-400";
}
const toolbarBtn = "rounded-xl border border-aom-border bg-zinc-900/50 px-3.5 py-2 text-sm font-medium text-amber-100/95 transition-colors hover:border-amber-500/40 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25 disabled:cursor-not-allowed disabled:opacity-45";
export function AldeoesPage() {
    const { t } = useTranslation();
    const { aldeoes, aldeaoSlugById, panteaoById } = useCatalog();
    const navigate = useNavigate();
    const { pathname, search: locSearch } = useLocation();
    const listIndexState = useMemo(() => listIndexLinkStateFromLocation(pathname, locSearch), [pathname, locSearch]);
    const [q, setQ] = useListPageSearchQuery();
    const [compareMode, setCompareMode] = useState(false);
    const [selectedSlugs, setSelectedSlugs] = useState([]);
    const filtered = useMemo(() => aldeoes.filter((a) => matches(a, q)), [aldeoes, q]);
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
    return (_jsxs("div", { children: [_jsxs(ListPageStickyHeader, { children: [_jsx(PageHeader, { title: t("pages.aldeoes.title"), description: t("pages.aldeoes.description"), className: "!mb-0" }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsx(SearchField, { value: q, onChange: setQ, placeholder: t("common.filter"), id: "aldeoes-search" }), _jsx("div", { className: "flex flex-wrap items-center justify-end gap-2 sm:ml-auto", children: !compareMode ? (_jsx("button", { type: "button", className: toolbarBtn, onClick: enterCompareMode, children: t("common.compareMode") })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: toolbarBtn, onClick: exitCompareMode, children: t("common.cancel") }), _jsx("button", { type: "button", className: toolbarBtn, disabled: !canCompare, onClick: () => {
                                                if (!canCompare)
                                                    return;
                                                navigate(`/aldeoes/compare/${selectedSlugs[0]}/${selectedSlugs[1]}`);
                                            }, children: t("common.compare") })] })) })] })] }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: filtered.map((a) => {
                    const slug = aldeaoSlugById.get(a.id) ?? String(a.id);
                    const selected = selectedSlugs.includes(slug);
                    const selectDisabled = compareMode && selectedSlugs.length >= 2 && !selected;
                    const panteaoId = firstNumId(a.panteao);
                    const tintNome = panteaoId != null ? (panteaoById.get(panteaoId)?.nome ?? "") : "";
                    return (_jsx("li", { children: _jsx(EntityCard, { to: `/aldeoes/${slug}`, linkState: listIndexState, title: a.nome, cardTint: pantheonCardTint(tintNome), subtitle: firstNome(a.panteao) ? _jsx(NotionText, { text: firstNome(a.panteao) }) : undefined, meta: _jsx(MetaNotionLine, { parts: [a.ingles] }), hoverPreview: _jsx(EntityCardPreviewStats, { items: [
                                    {
                                        icon: "aomr_hit_points_icon",
                                        label: t("spreadsheet.unidades.hitPoints"),
                                        value: a.vida,
                                        valueClassName: zeroValueClass(a.vida),
                                    },
                                    {
                                        icon: "aomr_population_provision_icon",
                                        label: t("spreadsheet.unidades.population"),
                                        value: a.populacao,
                                        valueClassName: zeroValueClass(a.populacao),
                                    },
                                    {
                                        icon: "aomr_time_icon",
                                        label: t("spreadsheet.aldeoes.trainTime"),
                                        value: a.tempo_de_treinamento,
                                        valueClassName: zeroValueClass(a.tempo_de_treinamento),
                                    },
                                    {
                                        icon: "aomr_caribou_icon",
                                        label: t("spreadsheet.aldeoes.hunt"),
                                        value: a.cacar,
                                        valueClassName: gatherBonusValueClass(a.cacar, a.cacar_porcento),
                                    },
                                    {
                                        icon: "aomr_cow_icon",
                                        label: t("spreadsheet.aldeoes.livestock"),
                                        value: a.gado_galinhas,
                                        valueClassName: gatherBonusValueClass(a.gado_galinhas, a.gado_porcento),
                                    },
                                    {
                                        icon: "aomr_berry_bush_icon",
                                        label: t("spreadsheet.aldeoes.berries"),
                                        value: a.frutinhas,
                                        valueClassName: gatherBonusValueClass(a.frutinhas, a.frutinhas_porcento),
                                    },
                                    {
                                        icon: "aomr_farm_icon",
                                        label: t("spreadsheet.aldeoes.farm"),
                                        value: a.fazenda,
                                        valueClassName: gatherBonusValueClass(a.fazenda, a.fazenda_porcento),
                                    },
                                    {
                                        icon: "aomr_tree_oak_icon",
                                        label: t("spreadsheet.aldeoes.tree"),
                                        value: a.arvore,
                                        valueClassName: gatherBonusValueClass(a.arvore, a.arvore_porcento),
                                    },
                                    {
                                        icon: "aomr_gold_mine_icon",
                                        label: t("spreadsheet.aldeoes.mine"),
                                        value: a.mina,
                                        valueClassName: gatherBonusValueClass(a.mina, a.mina_porcento),
                                    },
                                    {
                                        icon: "aomr_type_building_icon",
                                        label: t("spreadsheet.aldeoes.buildSpeed"),
                                        value: a.velocidade_construcao,
                                        valueClassName: gatherBonusValueClass(a.velocidade_construcao, a.velocidade_construcao_porcento),
                                    },
                                ] }), watermarkSrc: getAldeaoAssetUrl(a), compareMode: compareMode, selected: selected, selectDisabled: selectDisabled, onToggleSelect: () => toggleSelect(slug) }) }, a.id));
                }) }), filtered.length === 0 ? (_jsx("p", { className: "mt-8 text-center text-sm text-zinc-500", children: t("common.noResults") })) : null] }));
}
