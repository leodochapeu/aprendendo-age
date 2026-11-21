import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DeusesSpreadsheet } from "@/components/deus/DeusesSpreadsheet";
import { ListViewModeToggle } from "@/components/list/ListViewModeToggle";
import { ListPageStickyHeader } from "@/components/layout/ListPageStickyHeader";
import { SpreadsheetHoverPreview } from "@/components/spreadsheet/SpreadsheetHoverPreview";
import { SpreadsheetPageWidth } from "@/components/spreadsheet/SpreadsheetPageWidth";
import { EntityCard } from "@/components/ui/EntityCard";
import { EntityCardPreviewGodBonuses } from "@/components/ui/EntityCardPreview";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { NotionText } from "@/components/ui/NotionText";
import { PantheonMetaIcon } from "@/components/ui/PantheonMetaIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useCatalog } from "@/hooks/useCatalog";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useListPageSearchQuery } from "@/hooks/useListPageSearchQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { firstNome, firstNumId, joinRefNomes } from "@/lib/entityRefs";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { pantheonCardTint } from "@/lib/pantheonCardTint";
function matches(d, q) {
    if (!q.trim())
        return true;
    const s = q.toLowerCase();
    const blob = [
        d.nome,
        firstNome(d.panteao) ?? "",
        d.hierarquia ?? "",
        firstNome(d.era) ?? "",
        d.foco ?? "",
        joinRefNomes(d.god_maior_relacao),
        joinRefNomes(d.tecnologias),
        joinRefNomes(d.unidades_exclusivas),
    ]
        .join(" ")
        .toLowerCase();
    return blob.includes(s);
}
function isHierarquiaMaior(h) {
    return h?.toLowerCase() === "maior";
}
export function DeusesPage() {
    const { t } = useTranslation();
    const { deuses, deusSlugById } = useCatalog();
    const { pathname, search: locSearch } = useLocation();
    const listIndexState = useMemo(() => listIndexLinkStateFromLocation(pathname, locSearch), [pathname, locSearch]);
    const [q, setQ] = useListPageSearchQuery();
    const [viewMode, setViewMode] = useListViewMode("deuses");
    const [spreadsheetPreview, setSpreadsheetPreview] = useState(null);
    const filtered = useMemo(() => {
        const list = deuses.filter((d) => matches(d, q));
        return [...list].sort((a, b) => {
            const aM = isHierarquiaMaior(a.hierarquia) ? 0 : 1;
            const bM = isHierarquiaMaior(b.hierarquia) ? 0 : 1;
            if (aM !== bM)
                return aM - bM;
            return a.id - b.id;
        });
    }, [deuses, q]);
    return (_jsxs("div", { className: "w-full min-w-0", children: [_jsxs(ListPageStickyHeader, { children: [_jsx(PageHeader, { title: t("pages.deuses.title"), description: t("pages.deuses.description"), className: "!mb-0 w-full", actions: viewMode === "planilha" ? (_jsx(SpreadsheetHoverPreview, { preview: spreadsheetPreview, className: "sm:pt-1" })) : undefined }), _jsxs("div", { className: "flex flex-col items-start gap-3", children: [_jsx(SearchField, { value: q, onChange: setQ, placeholder: t("pages.deuses.filterPlaceholder"), id: "deuses-search" }), _jsx(ListViewModeToggle, { mode: viewMode, onChange: setViewMode, id: "deuses-view-mode" })] })] }), viewMode === "grade" ? (_jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: filtered.map((d) => (_jsx("li", { children: _jsx(EntityCard, { to: `/deuses/${deusSlugById.get(d.id) ?? d.id}`, linkState: listIndexState, title: d.nome, cardTint: pantheonCardTint(firstNome(d.panteao) ?? ""), subtitle: d.foco ? _jsx(NotionText, { text: d.foco }) : undefined, meta: _jsxs("span", { className: "inline-flex flex-wrap items-baseline gap-x-0", children: [firstNumId(d.panteao) != null ? _jsx(PantheonMetaIcon, { panteaoId: firstNumId(d.panteao) }) : null, _jsx(MetaNotionLine, { parts: [firstNome(d.panteao), firstNome(d.era)] })] }), watermarkSrc: getDeusAssetUrl(d), hoverPreview: d.explicacao_maior?.blocos?.length ? (_jsx(EntityCardPreviewGodBonuses, { blocks: d.explicacao_maior.blocos })) : undefined }) }, d.id))) })) : (_jsx(SpreadsheetPageWidth, { children: _jsx(DeusesSpreadsheet, { rows: filtered, linkState: listIndexState, onPreview: setSpreadsheetPreview }) })), filtered.length === 0 ? (_jsx("p", { className: "mt-8 text-center text-sm text-zinc-500", children: t("common.noResults") })) : null] }));
}
