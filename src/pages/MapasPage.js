import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ListPageStickyHeader } from "@/components/layout/ListPageStickyHeader";
import { EntityCard } from "@/components/ui/EntityCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useCatalog } from "@/hooks/useCatalog";
import { useListPageSearchQuery } from "@/hooks/useListPageSearchQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { getMapaAssetUrl, getMapaPreviewUrl } from "@/lib/entityWatermarkUrls";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { formatMapaOrigem, MAPA_ORIGEM_FILTERS, mapaOrigemTitleIcons, } from "@/lib/mapaOrigemIcons";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
function MapFilterChip({ option, active, onClick, }) {
    const fitContain = option.iconFit === "contain";
    return (_jsxs("div", { className: "group/filter relative shrink-0", children: [_jsx("button", { type: "button", onClick: (e) => {
                    onClick();
                    e.currentTarget.blur();
                }, "aria-pressed": active, "aria-label": option.label, title: option.label, className: cn("flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40", active
                    ? "border-amber-500/55 bg-amber-500/15 ring-2 ring-amber-500/35 ring-offset-1 ring-offset-zinc-950"
                    : "border-aom-border/80 bg-zinc-900/60 hover:border-zinc-500"), children: _jsx("img", { src: option.iconSrc, alt: "", className: cn("h-7 w-7", fitContain ? "rounded-md object-contain p-0.5" : "rounded-full object-cover"), width: 28, height: 28, loading: "lazy", decoding: "async" }) }), _jsx("span", { role: "tooltip", className: cn("pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-950/95 px-2 py-1 text-[10px] font-medium text-zinc-200 shadow-lg shadow-black/40", "opacity-0 transition duration-150 group-hover/filter:opacity-100"), children: option.label })] }));
}
function matchesMapFilter(m, filterKey) {
    if (!filterKey)
        return true;
    if (filterKey === "ranked")
        return m.mapas_da_ranqueada;
    if (filterKey === "default")
        return m.padrao;
    if (filterKey === "quickMatches")
        return m.partidas_rapidas;
    if (filterKey === "land")
        return m.tipo?.toLowerCase().includes("terra");
    return m.tipo?.toLowerCase().includes("naval");
}
function matchesOrigemFilter(m, origem) {
    if (!origem)
        return true;
    return m.origem?.includes(origem) ?? false;
}
function matches(m, q, index, filterKey, origemFilter) {
    if (!matchesMapFilter(m, filterKey))
        return false;
    if (!matchesOrigemFilter(m, origemFilter))
        return false;
    if (!q.trim())
        return true;
    const s = q.toLowerCase();
    const blob = [m.nome, m.ingles ?? "", m.tipo ?? "", formatMapaOrigem(m.origem), String(index)]
        .join(" ")
        .toLowerCase();
    return blob.includes(s);
}
export function MapasPage() {
    const { t } = useTranslation();
    const { mapas, mapaSlugByIndex } = useCatalog();
    const { pathname, search: locSearch } = useLocation();
    const listIndexState = useMemo(() => listIndexLinkStateFromLocation(pathname, locSearch), [pathname, locSearch]);
    const [q, setQ] = useListPageSearchQuery();
    const [filterKey, setFilterKey] = useState(null);
    const [origemFilter, setOrigemFilter] = useState(null);
    const filtered = useMemo(() => mapas
        .map((m, i) => ({ m, i }))
        .filter(({ m, i }) => matches(m, q, i, filterKey, origemFilter)), [mapas, q, filterKey, origemFilter]);
    const filterOptions = [
        { key: "all", label: t("pages.mapas.filterTagAll"), iconSrc: "/assets/maps/all_maps.webp" },
        {
            key: "ranked",
            label: t("pages.mapas.filters.ranked"),
            iconSrc: resolveTokenIconSrc("aomr_type_hero_icon") ?? "",
        },
        {
            key: "default",
            label: t("pages.mapas.filters.default"),
            iconSrc: "/assets/maps/MapThumb_Standard.webp",
        },
        {
            key: "quickMatches",
            label: t("pages.mapas.filters.quickMatches"),
            iconSrc: "/assets/maps/MapThumb_Standard.webp",
        },
        { key: "land", label: t("pages.mapas.filters.land"), iconSrc: "/assets/maps/MapThumb_Land.webp" },
        { key: "water", label: t("pages.mapas.filters.water"), iconSrc: "/assets/maps/MapThumb_Navy.webp" },
    ];
    const origemFilterOptions = MAPA_ORIGEM_FILTERS.map((o) => ({
        key: o.label,
        label: o.label,
        iconSrc: o.iconSrc,
        iconFit: "contain",
    }));
    return (_jsxs("div", { children: [_jsxs(ListPageStickyHeader, { children: [_jsx(PageHeader, { title: t("pages.mapas.title"), description: t("pages.mapas.description"), className: "!mb-0" }), _jsxs("div", { className: "flex w-full flex-col gap-3", children: [_jsx(SearchField, { value: q, onChange: setQ, placeholder: t("pages.mapas.filterPlaceholder"), id: "mapas-search", className: "relative w-full max-w-none" }), _jsxs("div", { className: "flex min-w-0 flex-wrap items-center gap-2", "aria-label": t("pages.mapas.filterTagLabel"), children: [filterOptions.map((option) => {
                                        const active = option.key === "all" ? filterKey === null : filterKey === option.key;
                                        return (_jsx(MapFilterChip, { option: option, active: active, onClick: () => setFilterKey(option.key === "all"
                                                ? null
                                                : active
                                                    ? null
                                                    : option.key) }, option.key));
                                    }), _jsx("span", { "aria-hidden": true, className: "mx-1 hidden h-6 w-px shrink-0 bg-zinc-700/80 sm:block" }), origemFilterOptions.map((option) => {
                                        const active = origemFilter === option.key;
                                        return (_jsx(MapFilterChip, { option: option, active: active, onClick: () => setOrigemFilter(active ? null : option.key) }, option.key));
                                    })] })] })] }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: filtered.map(({ m, i }) => {
                    const mapaIcon = getMapaAssetUrl(m);
                    const origemMeta = formatMapaOrigem(m.origem);
                    const dlcIcons = mapaOrigemTitleIcons(m.origem);
                    return (_jsx("li", { children: _jsx(EntityCard, { to: `/mapas/${mapaSlugByIndex.get(i) ?? i}`, linkState: listIndexState, title: m.nome, subtitle: m.tipo, meta: origemMeta || dlcIcons.length ? (_jsxs("span", { className: "inline-flex items-center gap-1.5", children: [dlcIcons.map((ti) => (_jsx("img", { src: ti.src, alt: "", title: ti.label, draggable: false, className: "size-4 shrink-0 object-contain" }, ti.src))), origemMeta ? _jsx("span", { children: origemMeta }) : null] })) : undefined, backgroundCoverSrc: getMapaPreviewUrl(m), backgroundCoverFallbackSrc: mapaIcon, watermarkSrc: mapaIcon, rankedHighlight: m.mapas_da_ranqueada, titleIcons: m.mapas_da_ranqueada
                                ? [{ icon: "aomr_type_hero_icon", label: t("common.ranked") }]
                                : undefined, hoverPreview: mapaIcon ? (_jsx("div", { className: "flex justify-center", children: _jsx("img", { src: mapaIcon, alt: "", "aria-hidden": true, className: "size-64 rounded-xl object-contain" }) })) : undefined }) }, `${m.nome}-${i}`));
                }) }), filtered.length === 0 ? (_jsx("p", { className: "mt-8 text-center text-sm text-zinc-500", children: t("common.noResults") })) : null] }));
}
