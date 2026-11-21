import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, useParams } from "react-router-dom";
import { PageComments } from "@/components/comments/MapComments";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitCluster } from "@/components/ui/InfoRowPortraitCluster";
import { TecnologiaTipoBadges } from "@/components/tecnologia/TecnologiaTipoBadges";
import { NotionText } from "@/components/ui/NotionText";
import { hasTecnologiaTipo } from "@/lib/tecnologiaTipo";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortraitHeaderActions, } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { getConstrucaoAssetUrl } from "@/lib/entityWatermarkUrls";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { listIndexLinkStateFromLocation, listIndexReturnTo, listOrDetailBackLinkLabel, } from "@/lib/listIndexReturnState";
import { construcaoPublicId, construcaoVariantQuery } from "@/lib/buildingFamilies";
import { localeSectionPath } from "@/lib/localeRoutes";
import { getTecnologiaAssetUrl } from "@/lib/tecnologiaAssetUrl";
export function TecnologiaDetailPage() {
    const { t, locale } = useTranslation();
    const { construcaoById, construcaoSlugById, deusById, deusSlugById, eraById, eraSlugById, panteaoById, panteaoSlugById, tecnologiaBySlug, tecnologias, } = useCatalog();
    const { pathname, search: locSearch, state: navState } = useLocation();
    const tecLinkState = listIndexLinkStateFromLocation(pathname, locSearch);
    const techList = localeSectionPath(locale, "tecnologias");
    const backToList = listIndexReturnTo(techList, navState);
    const backLabel = listOrDetailBackLinkLabel(backToList, techList, t("nav.technologies"));
    const { slug } = useParams();
    const tech = slug ? tecnologiaBySlug.get(slug) : undefined;
    if (!tech) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx("p", { className: "text-zinc-400", children: t("common.entityNotFound.tech") })] }));
    }
    const tecIndex = tecnologias.indexOf(tech);
    const shortDesc = (tech.descricao_resumida ?? "").trim();
    const hist = (tech.historia ?? "").trim();
    const eraRefs = tech.eras;
    const panteoesField = tech.panteoes;
    const construcaoOrigemField = tech.construcao_origem;
    const godEspecificoField = tech.god_especifico;
    const deusPortraitItems = Array.isArray(godEspecificoField) && godEspecificoField.length
        ? godEspecificoField.map((r, i) => {
            const d = deusById.get(r.id);
            return {
                key: `${r.id}-${i}`,
                to: localeSectionPath(locale, "deuses", deusSlugById.get(r.id) ?? r.id),
                nome: r.nome,
                src: d ? getDeusAssetUrl(d) : undefined,
            };
        })
        : [];
    const panteoesPortraitItems = Array.isArray(panteoesField) && panteoesField.length
        ? panteoesField.map((r, i) => {
            const p = panteaoById.get(r.id);
            return {
                key: `${r.id}-${i}`,
                to: localeSectionPath(locale, "panteoes", panteaoSlugById.get(r.id) ?? r.id),
                nome: r.nome,
                src: p ? getPantheonWatermarkUrl(p) : undefined,
            };
        })
        : [];
    const eraPortraitItems = Array.isArray(eraRefs) && eraRefs.length
        ? eraRefs.map((r, i) => {
            const e = eraById.get(r.id);
            return {
                key: `${r.id}-${i}`,
                to: localeSectionPath(locale, "eras", eraSlugById.get(r.id) ?? r.id),
                nome: r.nome,
                src: e ? getEraAssetUrl(e) : undefined,
            };
        })
        : [];
    const construcaoPortraitItems = Array.isArray(construcaoOrigemField) && construcaoOrigemField.length
        ? construcaoOrigemField.map((r, i) => {
            const publicId = construcaoPublicId(r.id);
            const c = construcaoById.get(publicId);
            return {
                key: `${r.id}-${i}`,
                to: `${localeSectionPath(locale, "construcoes", construcaoSlugById.get(publicId) ?? publicId)}${construcaoVariantQuery(r.id)}`,
                nome: r.nome,
                src: c ? getConstrucaoAssetUrl(c) : undefined,
            };
        })
        : [];
    return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx(PageHeader, { title: tech.nome ||
                    t("common.untitledTech", { index: tecIndex >= 0 ? tecIndex : "?" }), description: shortDesc ? _jsx(NotionText, { text: shortDesc, className: "block" }) : undefined, headerIconSrc: getTecnologiaAssetUrl(tech), siblingNav: tecIndex >= 0 ? _jsx(CatalogRecordNav, { section: "tecnologias", currentId: tecIndex }) : undefined }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx(Section, { title: t("common.summary"), children: _jsxs("div", { className: "space-y-0", children: [tech.beneficia ? (_jsx(InfoRow, { label: t("common.benefits"), children: _jsx(NotionText, { text: tech.beneficia }) })) : null, hasTecnologiaTipo(tech.tipo) || tech.tipo?.trim() ? (_jsx(InfoRow, { label: t("common.type"), children: _jsx(TecnologiaTipoBadges, { tipo: tech.tipo }) })) : null, panteoesPortraitItems.length > 0 ? (_jsx(InfoRow, { label: t("common.pantheon"), children: _jsx(InfoRowPortraitCluster, { children: _jsx(PortraitHeaderActions, { items: panteoesPortraitItems, linkState: tecLinkState, size: "sm", justify: "start" }) }) })) : typeof tech.panteoes === "string" && tech.panteoes.trim() ? (_jsx(InfoRow, { label: t("common.pantheon"), children: _jsx(NotionText, { text: tech.panteoes }) })) : null, eraPortraitItems.length > 0 ? (_jsx(InfoRow, { label: t("common.era"), children: _jsx(InfoRowPortraitCluster, { children: _jsx(PortraitHeaderActions, { items: eraPortraitItems, linkState: tecLinkState, size: "sm", justify: "start" }) }) })) : null, construcaoPortraitItems.length > 0 ? (_jsx(InfoRow, { label: t("common.originBuilding"), children: _jsx(InfoRowPortraitCluster, { children: _jsx(PortraitHeaderActions, { items: construcaoPortraitItems, linkState: tecLinkState, size: "sm", justify: "start" }) }) })) : typeof construcaoOrigemField === "string" && construcaoOrigemField.trim() ? (_jsx(InfoRow, { label: t("common.originBuilding"), children: _jsx(NotionText, { text: construcaoOrigemField }) })) : null, deusPortraitItems.length > 0 ? (_jsx(InfoRow, { label: t("common.specificGod"), children: _jsx(InfoRowPortraitCluster, { children: _jsx(PortraitHeaderActions, { items: deusPortraitItems, linkState: tecLinkState, size: "sm", justify: "start" }) }) })) : null] }) }), tech.campo && tech.campo.length > 0 ? (_jsx(Section, { title: t("common.fieldEffect"), children: _jsx("div", { className: "flex flex-col gap-3", children: tech.campo.map((line, i) => (_jsx("p", { className: "m-0 block w-full leading-relaxed text-zinc-300", children: _jsx(NotionText, { text: line, className: "block" }) }, i))) }) })) : null] }), hist ? (_jsx(Section, { title: t("common.history"), className: "mt-6", children: _jsx(NotionText, { text: hist, className: "block whitespace-pre-line text-sm leading-relaxed text-zinc-300" }) })) : null, slug ? (_jsx(PageComments, { pageKind: "tecnologias", pageKey: slug, itemName: tech.nome, kindLabel: t("comments.kinds.technology") })) : null] }));
}
