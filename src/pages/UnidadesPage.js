import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ListHeaderCollapseMark, ListPageStickyHeader } from "@/components/layout/ListPageStickyHeader";
import { ListViewModeToggle } from "@/components/list/ListViewModeToggle";
import { SpreadsheetHoverPreview } from "@/components/spreadsheet/SpreadsheetHoverPreview";
import { SpreadsheetPageWidth } from "@/components/spreadsheet/SpreadsheetPageWidth";
import { UnidadeFiltersModal } from "@/components/unidade/UnidadeFiltersModal";
import { UnidadeMultiplierDamagePreview } from "@/components/unidade/UnidadeMultiplierDamagePreview";
import { UnidadesSpreadsheet } from "@/components/unidade/UnidadesSpreadsheet";
import { EntityCard } from "@/components/ui/EntityCard";
import { EntityCardPreviewStats } from "@/components/ui/EntityCardPreview";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { ModalApp } from "@/components/ui/ModalApp";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useCatalog } from "@/hooks/useCatalog";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useListPageSearchQuery } from "@/hooks/useListPageSearchQuery";
import { useUnitListFilters } from "@/hooks/useUnitListFilters";
import { useTranslation } from "@/hooks/useTranslation";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { formatArmorPercent } from "@/lib/armorDisplay";
import { firstNumId, joinRefNomes } from "@/lib/entityRefs";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { cn } from "@/lib/cn";
import { pantheonCardTint } from "@/lib/pantheonCardTint";
import { LIST_VIEW_MODE_PARAM, listViewModeFromSearch } from "@/lib/listViewMode";
import { countActiveUnitFilters, unidadeMatchesFilters } from "@/lib/unidadeFilters";
import { hasTipoContent, tipoItemsToSearchBlob, } from "@/lib/unidadeTipo";
import { hasMultiplicadorContent, multiplicadorItemsToNotionText, } from "@/lib/unidadeMultiplicador";
function matches(u, q) {
    if (!q.trim())
        return true;
    const s = q.toLowerCase();
    return [
        u.nome,
        u.ingles ?? "",
        tipoItemsToSearchBlob(u.tipo),
        joinRefNomes(u.panteao),
        joinRefNomes(u.era),
        tipoItemsToSearchBlob(u.categoria),
        u.forte_contra ?? "",
        u.fraco_contra ?? "",
        u.counter_de ?? "",
        hasMultiplicadorContent(u.multiplicador) ? multiplicadorItemsToNotionText(u.multiplicador) : "",
        u.pontos_de_vida != null ? String(u.pontos_de_vida) : "",
        u.comida != null ? String(u.comida) : "",
        u.dps != null ? String(u.dps) : "",
    ]
        .join(" ")
        .toLowerCase()
        .includes(s);
}
function unitBenchmarkValueClass(value, benchmark, lowerIsBetter) {
    if (value === 0)
        return "text-zinc-500";
    if (value == null)
        return undefined;
    const isBetter = lowerIsBetter ? value <= benchmark : value >= benchmark;
    return isBetter ? "text-emerald-400" : "text-red-400";
}
const HUMAN_UNIT_BENCHMARKS = {
    totalCost: 147,
    population: 2,
    trainTime: 15,
    moveSpeed: 4.5,
    hitPoints: 80,
    hackDamage: 10,
    pierceDamage: 10,
    attackSpeed: 1,
    hackArmor: 40,
    pierceArmor: 40,
};
const MYTH_UNIT_BENCHMARKS = {
    ...HUMAN_UNIT_BENCHMARKS,
    totalCost: 227,
    hitPoints: 300,
    pierceDamage: 6,
};
const HERO_UNIT_BENCHMARKS = {
    ...MYTH_UNIT_BENCHMARKS,
    totalCost: 288,
};
function hasUnitType(u, icons, labels) {
    return Boolean(u.tipo?.some((item) => {
        const icon = item.icon?.toLowerCase();
        const type = item.type.toLowerCase();
        return (icon != null && icons.includes(icon)) || labels.includes(type);
    }));
}
function unitBenchmarksFor(u) {
    if (hasUnitType(u, ["aomr_type_hero_icon"], ["herói", "hero"])) {
        return HERO_UNIT_BENCHMARKS;
    }
    if (hasUnitType(u, ["aomr_type_myth_unit_icon"], ["unidade mítica", "myth unit"])) {
        return MYTH_UNIT_BENCHMARKS;
    }
    return HUMAN_UNIT_BENCHMARKS;
}
const toolbarBtn = "rounded-xl border border-aom-border bg-zinc-900/50 px-3.5 py-2 text-sm font-medium text-amber-100/95 transition-colors hover:border-amber-500/40 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-amber-500/25 disabled:cursor-not-allowed disabled:opacity-45";
export function UnidadesPage() {
    const { t } = useTranslation();
    const { panteaoById, unidadeSlugById, unidades, panteoes, eras } = useCatalog();
    const navigate = useNavigate();
    const { pathname, search: locSearch } = useLocation();
    const [, setSearchParams] = useSearchParams();
    const listIndexState = useMemo(() => listIndexLinkStateFromLocation(pathname, locSearch), [pathname, locSearch]);
    const [q, setQ] = useListPageSearchQuery();
    const [viewMode, setStoredViewMode] = useListViewMode("unidades", locSearch);
    const urlViewMode = listViewModeFromSearch(locSearch);
    useEffect(() => {
        if (urlViewMode)
            setStoredViewMode(urlViewMode);
    }, [urlViewMode, setStoredViewMode]);
    function setViewMode(mode) {
        setStoredViewMode(mode);
        setSearchParams((prev) => {
            if (!prev.has(LIST_VIEW_MODE_PARAM))
                return prev;
            const next = new URLSearchParams(prev);
            next.set(LIST_VIEW_MODE_PARAM, mode);
            return next;
        }, { replace: true });
    }
    const [spreadsheetPreview, setSpreadsheetPreview] = useState(null);
    const [compareMode, setCompareMode] = useState(false);
    const [selectedSlugs, setSelectedSlugs] = useState([]);
    const [beneficiosOpen, setBeneficiosOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [unitFilters, setUnitFilters] = useUnitListFilters();
    const searched = useMemo(() => unidades.filter((u) => matches(u, q)), [unidades, q]);
    const filtered = useMemo(() => searched.filter((u) => unidadeMatchesFilters(u, unitFilters)), [searched, unitFilters]);
    const activeFilterCount = countActiveUnitFilters(unitFilters);
    function toggleSelect(unitSlug) {
        setSelectedSlugs((prev) => {
            if (prev.includes(unitSlug))
                return prev.filter((x) => x !== unitSlug);
            if (prev.length >= 2)
                return prev;
            return [...prev, unitSlug];
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
    const beneficiosImgSrc = "/trilha-de-aprendizado/tipos-unidades-multiplicadores/Militares_Beneficios.webp";
    const beneficiosButton = (_jsx("button", { type: "button", onClick: () => setBeneficiosOpen(true), title: t("pages.unidades.troopBenefits"), "aria-label": t("pages.unidades.troopBenefitsAria"), className: "group shrink-0 cursor-pointer rounded-xl border border-aom-border bg-zinc-900/60 shadow-sm shadow-black/30 transition hover:border-amber-400/50 hover:ring-1 hover:ring-amber-400/30", children: _jsx("img", { src: beneficiosImgSrc, alt: "", "aria-hidden": true, className: "h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20" }) }));
    return (_jsxs("div", { className: "w-full min-w-0", children: [_jsxs(ListPageStickyHeader, { children: [_jsx(PageHeader, { title: t("pages.unidades.title"), description: t("pages.unidades.description"), className: "!mb-0 w-full", actions: _jsxs("div", { className: "flex flex-wrap items-start justify-end gap-3", children: [showSpreadsheetPreview ? (_jsx(SpreadsheetHoverPreview, { preview: spreadsheetPreview, className: "sm:pt-1" })) : null, beneficiosButton] }) }), _jsxs("div", { id: "unidades-header-tools", className: "flex flex-col items-start gap-3", children: [_jsxs("div", { className: "flex w-full flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2", children: [_jsx(SearchField, { value: q, onChange: setQ, placeholder: t("common.filter"), id: "unidades-search", className: "relative min-w-[14rem] flex-1" }), _jsxs("button", { type: "button", onClick: () => setFiltersOpen(true), "aria-label": t("pages.unidades.filters.buttonAria"), className: cn(toolbarBtn, "inline-flex items-center gap-2", activeFilterCount > 0 && "border-amber-500/50 bg-amber-500/10 text-amber-100"), children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: _jsx("path", { d: "M4 5h16l-6 7.2V19l-4 2v-8.8L4 5z", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }) }), t("pages.unidades.filters.button"), activeFilterCount > 0 ? (_jsx("span", { className: "inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500/25 px-1.5 text-xs", children: activeFilterCount })) : null] })] }), _jsx("div", { className: "flex flex-wrap items-center justify-end gap-2", children: !compareMode ? (_jsx("button", { type: "button", className: toolbarBtn, onClick: enterCompareMode, children: t("common.compareMode") })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: toolbarBtn, onClick: exitCompareMode, children: t("common.cancel") }), _jsx("button", { type: "button", className: toolbarBtn, disabled: !canCompare, onClick: () => {
                                                        if (!canCompare)
                                                            return;
                                                        navigate(`/unidades/compare/${selectedSlugs[0]}/${selectedSlugs[1]}`);
                                                    }, children: t("common.compare") })] })) })] }), !compareMode ? (_jsx(ListViewModeToggle, { mode: viewMode, onChange: setViewMode, id: "unidades-view-mode" })) : null] }), _jsx(ModalApp, { open: beneficiosOpen, onClose: () => setBeneficiosOpen(false), title: t("pages.unidades.troopBenefits"), description: _jsx("img", { src: beneficiosImgSrc, alt: t("pages.unidades.troopBenefits"), className: "mt-1 w-full rounded-xl border border-aom-border bg-zinc-950/40 object-contain" }) }), _jsx(ListHeaderCollapseMark, { active: activeFilterCount > 0 }), _jsx(UnidadeFiltersModal, { open: filtersOpen, onClose: () => setFiltersOpen(false), filters: unitFilters, onApply: setUnitFilters, pantheons: panteoes, eras: eras, units: unidades, countable: searched })] }), viewMode === "planilha" ? (_jsx(SpreadsheetPageWidth, { children: _jsx(UnidadesSpreadsheet, { rows: filtered, linkState: listIndexState, onPreview: compareMode ? undefined : setSpreadsheetPreview, compareMode: compareMode, selectedSlugs: selectedSlugs, onToggleSelect: toggleSelect }) })) : (_jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: filtered.map((u) => {
                    const slug = unidadeSlugById.get(u.id) ?? String(u.id);
                    const selected = selectedSlugs.includes(slug);
                    const selectDisabled = compareMode && selectedSlugs.length >= 2 && !selected;
                    const categoriaText = u.categoria && u.categoria.map((c) => c.type).join(", ");
                    const pIdUn = firstNumId(u.panteao);
                    const panteaoNomeCard = pIdUn != null ? (panteaoById.get(pIdUn)?.nome ?? "") : "";
                    const benchmarks = unitBenchmarksFor(u);
                    return (_jsx("li", { children: _jsx(EntityCard, { to: `/unidades/${slug}`, linkState: listIndexState, title: u.nome, cardTint: pantheonCardTint(panteaoNomeCard), subtitleTag: false, subtitle: hasTipoContent(u.tipo) ? _jsx(UnidadeTipoLine, { tipo: u.tipo, colored: true }) : undefined, meta: _jsx(MetaNotionLine, { parts: [joinRefNomes(u.panteao), joinRefNomes(u.era), categoriaText] }), hoverPreview: _jsxs("div", { className: "space-y-2", children: [_jsx(EntityCardPreviewStats, { items: [
                                            {
                                                label: t("common.totalCost"),
                                                value: u.custo_total,
                                                valueClassName: unitBenchmarkValueClass(u.custo_total, benchmarks.totalCost, true),
                                            },
                                            {
                                                icon: "aomr_population_provision_icon",
                                                label: t("spreadsheet.unidades.population"),
                                                value: u.populacao,
                                                valueClassName: unitBenchmarkValueClass(u.populacao, benchmarks.population, true),
                                            },
                                            {
                                                icon: "aomr_time_icon",
                                                label: t("spreadsheet.unidades.trainTime"),
                                                value: u.tempo_treinamento,
                                                valueClassName: unitBenchmarkValueClass(u.tempo_treinamento, benchmarks.trainTime, true),
                                            },
                                            {
                                                icon: "aomr_rate_of_fire_icon",
                                                label: t("spreadsheet.unidades.attackSpeed"),
                                                value: u.velocidade_de_ataque_atk_s,
                                                valueClassName: unitBenchmarkValueClass(u.velocidade_de_ataque_atk_s, benchmarks.attackSpeed, true),
                                            },
                                            { icon: "rangeicon", label: t("spreadsheet.unidades.range"), value: u.alcance },
                                            {
                                                icon: "aomr_hit_points_icon",
                                                label: t("spreadsheet.unidades.hitPoints"),
                                                value: u.pontos_de_vida,
                                                valueClassName: unitBenchmarkValueClass(u.pontos_de_vida, benchmarks.hitPoints, false),
                                            },
                                            {
                                                icon: "hackarmor",
                                                label: t("spreadsheet.unidades.hackArmor"),
                                                value: u.armadura_anticorte != null ? formatArmorPercent(u.armadura_anticorte) : null,
                                                valueClassName: unitBenchmarkValueClass(u.armadura_anticorte, benchmarks.hackArmor, false),
                                            },
                                            {
                                                icon: "piercearmor",
                                                label: t("spreadsheet.unidades.pierceArmor"),
                                                value: u.armadura_antiperfurante != null
                                                    ? formatArmorPercent(u.armadura_antiperfurante)
                                                    : null,
                                                valueClassName: unitBenchmarkValueClass(u.armadura_antiperfurante, benchmarks.pierceArmor, false),
                                            },
                                            {
                                                icon: "hackdamage",
                                                label: t("spreadsheet.unidades.hackDamage"),
                                                value: u.dano_cortante,
                                                valueClassName: unitBenchmarkValueClass(u.dano_cortante, benchmarks.hackDamage, false),
                                            },
                                            {
                                                icon: "piercedamage",
                                                label: t("spreadsheet.unidades.pierceDamage"),
                                                value: u.dano_perfurante,
                                                valueClassName: unitBenchmarkValueClass(u.dano_perfurante, benchmarks.pierceDamage, false),
                                            },
                                            {
                                                icon: "aomr_speed_icon",
                                                label: t("spreadsheet.unidades.moveSpeed"),
                                                value: u.velocidade_movimento,
                                                valueClassName: unitBenchmarkValueClass(u.velocidade_movimento, benchmarks.moveSpeed, false),
                                            },
                                        ] }), _jsx(UnidadeMultiplierDamagePreview, { unidade: u })] }), watermarkSrc: getUnidadeAssetUrl(u), compareMode: compareMode, selected: selected, selectDisabled: selectDisabled, onToggleSelect: () => toggleSelect(slug) }) }, u.id));
                }) })), filtered.length === 0 ? (_jsx("p", { className: "mt-8 text-center text-sm text-zinc-500", children: t("common.noResults") })) : null] }));
}
