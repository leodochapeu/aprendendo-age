import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, useParams } from "react-router-dom";
import { PageComments } from "@/components/comments/MapComments";
import { DeusPortraitHeaderActions } from "@/components/deus/DeusPortraitHeaderActions";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { entityDisplayDescription } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { formatGodNameStringForMetaNotion, getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { firstNome, firstNumId } from "@/lib/entityRefs";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { getGodPowerAssetUrl } from "@/lib/godPowerAssetUrl";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { listIndexLinkStateFromLocation, listIndexReturnTo, listOrDetailBackLinkLabel, } from "@/lib/listIndexReturnState";
export function GodpowerDetailPage() {
    const { t, locale } = useTranslation();
    const { deusById, deusSlugById, eraById, eraSlugById, godpowerBySlug, panteaoById, panteaoSlugById } = useCatalog();
    const { pathname, search: locSearch, state: navState } = useLocation();
    const deusLinkFromPowerState = listIndexLinkStateFromLocation(pathname, locSearch);
    const backToList = listIndexReturnTo("/poderes", navState);
    const backLabel = listOrDetailBackLinkLabel(backToList, "/poderes", t("nav.godpowers"));
    const { slug } = useParams();
    const g = slug ? godpowerBySlug.get(slug) : undefined;
    if (!g) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx("p", { className: "text-zinc-400", children: t("common.entityNotFound.power") })] }));
    }
    const godId = firstNumId(g.god);
    const eraId = firstNumId(g.era);
    const panteaoId = firstNumId(g.panteao);
    const deus = godId != null ? deusById.get(godId) : undefined;
    const era = eraId != null ? eraById.get(eraId) : undefined;
    const panteao = panteaoId != null ? panteaoById.get(panteaoId) : undefined;
    const powerIcon = getGodPowerAssetUrl(g);
    const deusSlug = deus ? (deusSlugById.get(deus.id) ?? String(deus.id)) : undefined;
    const deusPortraitItems = deus && deusSlug
        ? [
            {
                key: String(deus.id),
                slug: deusSlug,
                nome: deus.nome,
                src: getDeusAssetUrl(deus),
            },
        ]
        : [];
    const eraPortraitItems = era != null
        ? [
            {
                key: `era-${era.id}`,
                to: `/eras/${eraSlugById.get(era.id) ?? era.id}`,
                nome: era.nome,
                src: getEraAssetUrl(era),
            },
        ]
        : [];
    const panteaoPortraitItems = panteao != null
        ? [
            {
                key: `panteao-${panteao.id}`,
                to: `/panteoes/${panteaoSlugById.get(panteao.id) ?? panteao.id}`,
                nome: panteao.nome,
                src: getPantheonWatermarkUrl(panteao),
            },
        ]
        : [];
    const godNomeRef = firstNome(g.god);
    const eraNomeRef = firstNome(g.era);
    const panteaoNomeRef = firstNome(g.panteao);
    const showDeusRow = !!(deusPortraitItems.length || godNomeRef);
    const showEraRow = !!(eraPortraitItems.length || eraNomeRef);
    const showPanteaoRow = !!(panteaoPortraitItems.length || panteaoNomeRef);
    return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx(PageHeader, { title: g.nome, description: entityDisplayDescription(g, locale, t), headerIconSrc: powerIcon, siblingNav: _jsx(CatalogRecordNav, { section: "poderes", currentId: g.id }) }), _jsxs("div", { className: "mt-6 grid gap-6 lg:grid-cols-2", children: [_jsx(Section, { title: t("common.links"), children: _jsxs("div", { className: "space-y-0", children: [showDeusRow ? (_jsx(InfoRow, { label: t("common.god"), children: _jsx(InfoRowPortraitOrText, { portraits: deusPortraitItems.length > 0 ? (_jsx(DeusPortraitHeaderActions, { items: deusPortraitItems, linkState: deusLinkFromPowerState, size: "sm", justify: "start" })) : null, textFallback: godNomeRef ? _jsx(NotionText, { text: formatGodNameStringForMetaNotion(godNomeRef, godId) }) : null }) })) : null, showEraRow ? (_jsx(InfoRow, { label: t("common.era"), children: _jsx(InfoRowPortraitOrText, { portraits: eraPortraitItems.length > 0 ? (_jsx(PortraitHeaderActions, { items: eraPortraitItems, linkState: deusLinkFromPowerState, size: "sm", justify: "start" })) : null, textFallback: eraNomeRef ? _jsx(NotionText, { text: eraNomeRef }) : null }) })) : null, showPanteaoRow ? (_jsx(InfoRow, { label: t("common.pantheon"), children: _jsx(InfoRowPortraitOrText, { portraits: panteaoPortraitItems.length > 0 ? (_jsx(PortraitHeaderActions, { items: panteaoPortraitItems, linkState: deusLinkFromPowerState, size: "sm", justify: "start" })) : null, textFallback: panteaoNomeRef ? _jsx(NotionText, { text: panteaoNomeRef }) : null }) })) : null] }) }), _jsx(Section, { title: t("common.numbers"), children: _jsxs("div", { className: "space-y-0", children: [_jsx(InfoRow, { label: t("common.cooldownSec"), children: g.cooldown_seg ?? "—" }), _jsx(InfoRow, { label: t("common.mapDurationSec"), children: g.duracao_no_mapa_seg ?? "—" }), _jsx(InfoRow, { label: t("common.repeatCost"), children: g.custo_repetir ?? "—" }), _jsx(InfoRow, { label: t("common.incrementPerUse"), children: g.incremento_por_uso ?? "—" })] }) })] }), g.descricao_resumida ? (_jsx(Section, { title: t("common.summary"), className: "mt-6", children: _jsx(NotionText, { text: g.descricao_resumida }) })) : null, g.descricao_avancada ? (_jsx(Section, { title: t("common.advancedDescription"), className: "mt-6", children: _jsx(NotionText, { text: g.descricao_avancada }) })) : null, slug ? (_jsx(PageComments, { pageKind: "poderes", pageKey: slug, itemName: g.nome, kindLabel: t("comments.kinds.godPower") })) : null] }));
}
