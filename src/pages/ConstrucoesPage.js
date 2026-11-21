import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ListPageStickyHeader } from "@/components/layout/ListPageStickyHeader";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { EntityCard } from "@/components/ui/EntityCard";
import { EntityCardPreviewStats } from "@/components/ui/EntityCardPreview";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useCatalog } from "@/hooks/useCatalog";
import { useListPageSearchQuery } from "@/hooks/useListPageSearchQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { buildingFamilyOf, familyListedAsGeneral, isHiddenFamilyMember, variantButtonLabel } from "@/lib/buildingFamilies";
import { getConstrucaoAssetUrl } from "@/lib/entityWatermarkUrls";
import { panteaoFieldHasMultiplePantheons, pantheonCardTint } from "@/lib/pantheonCardTint";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { hasTipoContent, tipoItemsToSearchBlob } from "@/lib/unidadeTipo";
function matches(c, q, byId) {
    if (!q.trim())
        return true;
    const s = q.toLowerCase();
    const tipoBlob = hasTipoContent(c.tipo) ? tipoItemsToSearchBlob(c.tipo) : "";
    const family = buildingFamilyOf(c.id);
    const variants = family && family.canonicalId === c.id
        ? family.members
            .map((member) => {
            const row = byId.get(member.sourceId);
            return row ? `${variantButtonLabel(row)} ${row.nome} ${row.panteao ?? ""} ${row.ingles ?? ""}` : "";
        })
            .join(" ")
        : "";
    return [c.nome, tipoBlob, c.panteao ?? "", c.era ?? "", c.ingles ?? "", variants].join(" ").toLowerCase().includes(s);
}
export function ConstrucoesPage() {
    const { t } = useTranslation();
    const { construcoes, construcaoById, construcaoSlugById, panteaoById } = useCatalog();
    const { pathname, search: locSearch } = useLocation();
    const listIndexState = useMemo(() => listIndexLinkStateFromLocation(pathname, locSearch), [pathname, locSearch]);
    const [q, setQ] = useListPageSearchQuery();
    const filtered = useMemo(() => construcoes.filter((c) => !isHiddenFamilyMember(c.id) && matches(c, q, construcaoById)), [construcoes, construcaoById, q]);
    return (_jsxs("div", { children: [_jsxs(ListPageStickyHeader, { children: [_jsx(PageHeader, { title: t("pages.construcoes.title"), description: t("pages.construcoes.description"), className: "!mb-0" }), _jsx(SearchField, { value: q, onChange: setQ, placeholder: t("pages.construcoes.filterPlaceholder"), id: "constr-search" })] }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: filtered.map((c) => (_jsx("li", { children: _jsx(EntityCard, { to: `/construcoes/${construcaoSlugById.get(c.id) ?? c.id}`, linkState: listIndexState, title: c.nome, cardTint: familyListedAsGeneral(c.id) || panteaoFieldHasMultiplePantheons(c.panteao)
                            ? undefined
                            : pantheonCardTint((c.panteao_id != null ? panteaoById.get(c.panteao_id) : undefined)?.nome ?? ""), subtitle: hasTipoContent(c.tipo) ? (_jsx(UnidadeTipoLine, { tipo: c.tipo, colored: true, shell: "none" })) : undefined, meta: _jsx(MetaNotionLine, { parts: [familyListedAsGeneral(c.id) ? t("common.general") : c.panteao, c.era] }), hoverPreview: _jsx(EntityCardPreviewStats, { items: [
                                { label: t("common.totalCost"), value: c.custo },
                                { icon: "woodaom", label: t("common.wood"), value: c.madeira },
                                { icon: "goldaom", label: t("common.gold"), value: c.ouro },
                                {
                                    icon: "aomr_time_icon",
                                    label: t("common.buildTime"),
                                    value: c.tempo_construir_segundos,
                                },
                                { icon: "aom_garrison_icon", label: t("common.garrison"), value: c.guarnicao },
                            ] }), watermarkSrc: getConstrucaoAssetUrl(c) }) }, c.id))) }), filtered.length === 0 ? (_jsx("p", { className: "mt-8 text-center text-sm text-zinc-500", children: t("common.noResults") })) : null] }));
}
