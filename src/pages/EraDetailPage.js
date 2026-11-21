import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation, useParams } from "react-router-dom";
import { PageComments } from "@/components/comments/MapComments";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { listIndexReturnTo, listOrDetailBackLinkLabel } from "@/lib/listIndexReturnState";
export function EraDetailPage() {
    const { t } = useTranslation();
    const { construcaoById, construcaoSlugById, eraBySlug } = useCatalog();
    const { state: navState } = useLocation();
    const backToList = listIndexReturnTo("/eras", navState);
    const backLabel = listOrDetailBackLinkLabel(backToList, "/eras", t("nav.eras"));
    const { slug } = useParams();
    const e = slug ? eraBySlug.get(slug) : undefined;
    if (!e) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx("p", { className: "text-zinc-400", children: t("common.entityNotFound.era") })] }));
    }
    const reqIds = e.requisitos_para_subir_de_era_ids;
    const reqSingle = e.requisitos_para_subir_de_era_id;
    const eraIcon = getEraAssetUrl(e);
    const reqLinks = (reqIds ?? (reqSingle != null ? [reqSingle] : []))
        .map((cid) => {
        const c = construcaoById.get(cid);
        return c ? (_jsx(Link, { to: `/construcoes/${construcaoSlugById.get(cid) ?? cid}`, className: "text-amber-200 underline-offset-2 hover:underline", children: c.nome }, cid)) : (_jsxs("span", { children: ["#", cid] }, cid));
    })
        .filter(Boolean);
    return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx(PageHeader, { title: e.nome, description: e.hint, headerIconSrc: eraIcon, siblingNav: _jsx(CatalogRecordNav, { section: "eras", currentId: e.id }) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx(Section, { title: t("common.description"), children: _jsx(NotionText, { text: e.description }) }), _jsx(Section, { title: t("common.advanceCosts"), children: _jsxs("div", { className: "space-y-0", children: [_jsx(InfoRow, { label: t("common.food"), icon: "foodaom", children: e.comida === 0 ? t("common.none") : e.comida ?? 0 }), _jsx(InfoRow, { label: t("common.wood"), icon: "woodaom", children: e.madeira === 0 ? t("common.none") : e.madeira ?? 0 }), _jsx(InfoRow, { label: t("common.gold"), icon: "goldaom", children: e.ouro === 0 ? t("common.none") : e.ouro ?? 0 }), _jsx(InfoRow, { label: t("common.baseTimeSec"), icon: "aomr_time_icon", children: e.tempo_seg === 0 ? t("common.initial") : e.tempo_seg ?? 0 })] }) }), (e.requisitos_para_subir_de_era || reqLinks.length > 0) && (_jsx(Section, { title: t("common.ageUpRequirements"), children: reqLinks.length > 0 ? (_jsx("ul", { className: "flex flex-wrap gap-2", children: reqLinks.map((el, i) => (_jsxs("li", { children: [el, i < reqLinks.length - 1 ? _jsx("span", { className: "text-zinc-600", children: "," }) : null] }, i))) })) : null }))] }), slug ? _jsx(PageComments, { pageKind: "eras", pageKey: slug, itemName: e.nome, kindLabel: t("comments.kinds.age") }) : null] }));
}
