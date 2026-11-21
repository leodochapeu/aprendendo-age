import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { PageComments } from "@/components/comments/MapComments";
import { UnidadeCombateBody, UnidadeCustoBody, UnidadeHabilidadesBody, UnidadeHistoriaDetails, UnidadeVisaoGeralBody, } from "@/components/unidade/UnidadeSectionBodies";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { hasTipoContent } from "@/lib/unidadeTipo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { aldeaoIdMatchingUnit } from "@/lib/unidadeAldeao";
import { localeSectionPath } from "@/lib/localeRoutes";
import { listIndexReturnTo, listOrDetailBackLinkLabel } from "@/lib/listIndexReturnState";
import { isUnitHero } from "@/lib/unitModelTechs";
import { unitModelUrl } from "@/lib/unitModelUrl";
const UnidadeProjection = lazy(() => import("@/components/unidade/UnidadeProjection").then((mod) => ({ default: mod.UnidadeProjection })));
export function UnidadeDetailPage() {
    const { t, locale } = useTranslation();
    const { unidadeBySlug, aldeoes, aldeaoSlugById } = useCatalog();
    const { state: navState } = useLocation();
    const unitsList = localeSectionPath(locale, "unidades");
    const backToList = listIndexReturnTo(unitsList, navState);
    const backLabel = listOrDetailBackLinkLabel(backToList, unitsList, t("nav.units"));
    const { slug } = useParams();
    const u = slug ? unidadeBySlug.get(slug) : undefined;
    if (!u) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx("p", { className: "text-zinc-400", children: t("common.entityNotFound.unit") })] }));
    }
    const unidadeIcon = getUnidadeAssetUrl(u);
    const modelUrl = unitModelUrl(u.id);
    const aldeaoId = aldeaoIdMatchingUnit(u, aldeoes);
    const aldeaoSlug = aldeaoId != null ? aldeaoSlugById.get(aldeaoId) : undefined;
    const villagerPath = aldeaoSlug ? localeSectionPath(locale, "aldeoes", aldeaoSlug) : undefined;
    const hasHabilidades = Array.isArray(u.habilidades) && u.habilidades.length > 0;
    return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx(PageHeader, { title: u.nome, description: hasTipoContent(u.tipo) ? _jsx(UnidadeTipoLine, { tipo: u.tipo, colored: true }) : undefined, descriptionTag: false, headerIconSrc: unidadeIcon, siblingNav: _jsx(CatalogRecordNav, { section: "unidades", currentId: u.id }) }), villagerPath ? (_jsx("div", { className: "mb-6", children: _jsx(Link, { to: villagerPath, "aria-label": t("pages.unidades.openVillagerAria"), className: "inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/25", children: t("pages.unidades.openVillager") }) })) : null, _jsxs("div", { className: modelUrl ? "grid items-start gap-6 lg:grid-cols-2" : "grid gap-6", children: [_jsx(Section, { title: t("common.overview"), children: _jsx(UnidadeVisaoGeralBody, { u: u }) }), modelUrl ? (_jsx(Section, { title: t("common.projection3d"), children: _jsx(Suspense, { fallback: _jsx("p", { className: "text-zinc-500", children: t("common.loading") }), children: _jsx(UnidadeProjection, { unitId: u.id, fallbackUrl: modelUrl, hero: isUnitHero(u.nome, u.ingles, u.tipo) }) }) })) : null] }), _jsxs("div", { className: "mt-6 grid items-start gap-6 lg:grid-cols-2", children: [_jsx(Section, { title: t("common.combat"), children: _jsx(UnidadeCombateBody, { u: u }) }), _jsx(Section, { title: t("common.costAndTraining"), children: _jsx(UnidadeCustoBody, { u: u }) })] }), hasHabilidades ? (_jsx(Section, { title: t("common.abilities"), className: "mt-6", children: _jsx(UnidadeHabilidadesBody, { u: u }) })) : null, (u.historia ?? "").trim() ? _jsx(UnidadeHistoriaDetails, { historia: u.historia }) : null, slug ? (_jsx(PageComments, { pageKind: "unidades", pageKey: slug, itemName: u.nome, kindLabel: t("comments.kinds.unit") })) : null] }));
}
