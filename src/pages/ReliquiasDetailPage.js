import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, useParams } from "react-router-dom";
import { PageComments } from "@/components/comments/MapComments";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { entityDisplayDescription } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { listIndexReturnTo, listOrDetailBackLinkLabel, } from "@/lib/listIndexReturnState";
import { localeSectionPath } from "@/lib/localeRoutes";
import { getRelicAssetUrl } from "@/lib/relicAssetUrl";
export function ReliquiasDetailPage() {
    const { t, locale } = useTranslation();
    const { reliquiaBySlug } = useCatalog();
    const { state: navState } = useLocation();
    const relicsList = localeSectionPath(locale, "reliquias");
    const backToList = listIndexReturnTo(relicsList, navState);
    const backLabel = listOrDetailBackLinkLabel(backToList, relicsList, t("nav.reliquias"));
    const { slug } = useParams();
    const r = slug ? reliquiaBySlug.get(slug) : undefined;
    if (!r) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx("p", { className: "text-zinc-400", children: t("common.entityNotFound.relic") })] }));
    }
    const relicIcon = getRelicAssetUrl(r);
    return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx(PageHeader, { title: r.nome, description: entityDisplayDescription(r, locale, t), headerIconSrc: relicIcon, siblingNav: _jsx(CatalogRecordNav, { section: "reliquias", currentId: r.id }) }), r.descricao_resumida ? (_jsx(Section, { title: t("common.summary"), className: "mt-6", children: _jsx(NotionText, { text: r.descricao_resumida }) })) : null, r.descricao_avancada ? (_jsx(Section, { title: t("common.advancedDescription"), className: "mt-6", children: _jsx(NotionText, { text: r.descricao_avancada }) })) : null, slug ? (_jsx(PageComments, { pageKind: "reliquias", pageKey: slug, itemName: r.nome, kindLabel: t("comments.kinds.relic") })) : null] }));
}
