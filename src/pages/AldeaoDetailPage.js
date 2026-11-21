import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation, useParams } from "react-router-dom";
import { AldeaoBonusBody, AldeaoColetaBody, AldeaoGeralBody } from "@/components/aldeao/AldeaoSectionBodies";
import { PageComments } from "@/components/comments/MapComments";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { entityDisplayDescription } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getAldeaoAssetUrl } from "@/lib/entityWatermarkUrls";
import { localeSectionPath } from "@/lib/localeRoutes";
import { unitIdMatchingAldeao } from "@/lib/unidadeAldeao";
import { listIndexLinkStateFromLocation, listIndexReturnTo, listOrDetailBackLinkLabel, } from "@/lib/listIndexReturnState";
export function AldeaoDetailPage() {
    const { t, locale } = useTranslation();
    const { aldeaoBySlug, unidades, unidadeSlugById } = useCatalog();
    const { pathname, search: locSearch, state: navState } = useLocation();
    const linkState = listIndexLinkStateFromLocation(pathname, locSearch);
    const villagersList = localeSectionPath(locale, "aldeoes");
    const backToList = listIndexReturnTo(villagersList, navState);
    const backLabel = listOrDetailBackLinkLabel(backToList, villagersList, t("nav.villagers"));
    const { slug } = useParams();
    const a = slug ? aldeaoBySlug.get(slug) : undefined;
    if (!a) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx("p", { className: "text-zinc-400", children: t("common.entityNotFound.villager") })] }));
    }
    const aldeaoIcon = getAldeaoAssetUrl(a);
    const unitId = unitIdMatchingAldeao(a, unidades);
    const unitSlug = unitId != null ? unidadeSlugById.get(unitId) : undefined;
    const unitPath = unitSlug ? localeSectionPath(locale, "unidades", unitSlug) : undefined;
    return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx(PageHeader, { title: a.nome, description: entityDisplayDescription(a, locale, t), headerIconSrc: aldeaoIcon, siblingNav: _jsx(CatalogRecordNav, { section: "aldeoes", currentId: a.id }) }), unitPath ? (_jsx("div", { className: "mb-6", children: _jsx(Link, { to: unitPath, "aria-label": t("pages.aldeoes.openUnitAria"), className: "inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/25", children: t("pages.aldeoes.openUnit") }) })) : null, _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx(Section, { title: t("common.general"), className: "h-full", children: _jsx(AldeaoGeralBody, { a: a, linkState: linkState }) }), aldeaoIcon ? (_jsx(Section, { title: t("common.icon"), className: "h-full", children: _jsx("img", { src: aldeaoIcon, alt: `${a.nome} — ${t("common.icon")}`, className: "mx-auto h-auto w-full max-w-96 rounded-xl object-contain" }) })) : null] }), _jsxs("div", { className: "mt-6 grid gap-6 lg:grid-cols-2", children: [_jsx(Section, { title: t("common.baseGatherRates"), className: "h-full", children: _jsx(AldeaoColetaBody, { a: a }) }), _jsx(Section, { title: t("common.percentBonus"), className: "h-full", children: _jsx(AldeaoBonusBody, { a: a }) })] }), slug ? (_jsx(PageComments, { pageKind: "aldeoes", pageKey: slug, itemName: a.nome, kindLabel: t("comments.kinds.villager") })) : null] }));
}
