import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { StartAuthorsMeta } from "@/components/start/StartAuthorsMeta";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { BackLink } from "@/components/ui/BackLink";
import { EntityCard } from "@/components/ui/EntityCard";
import { MetaNotionLine } from "@/components/ui/MetaNotionLine";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { PantheonMetaIcon } from "@/components/ui/PantheonMetaIcon";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { familyMemberForPantheon } from "@/lib/buildingFamilies";
import { AZTEC_PANTEON_ID, MAPAS_OBSIDIAN_ORIGEM, isObsidianMap, isPantheonConstrucao, isPantheonRef, } from "@/lib/astecasCatalog";
import { localeSectionPath } from "@/lib/localeRoutes";
import { getAldeaoAssetUrl, getConstrucaoAssetUrl, getMapaAssetUrl, getMapaPreviewUrl, getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { formatGodNameForMetaNotion, getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { getGodPowerAssetUrl } from "@/lib/godPowerAssetUrl";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { firstNome, firstNumId, joinRefNomes } from "@/lib/entityRefs";
import { formatMapaOrigem, mapaOrigemTitleIcons } from "@/lib/mapaOrigemIcons";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { panteaoFieldHasMultiplePantheons, pantheonCardTint } from "@/lib/pantheonCardTint";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
import { hasTipoContent } from "@/lib/unidadeTipo";
import { StartGodPortraits } from "@/components/start/StartGodPortraits";
import { startNovoTagClass } from "@/components/start/startNovoTag";
const sectionTitleClass = "mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-amber-100/95";
export function PanteaoFullPage() {
    const { t, locale } = useTranslation();
    const { slug } = useParams();
    const catalog = useCatalog();
    const { aldeaoSlugById, aldeoes, construcaoById, construcaoSlugById, construcoes, deusSlugById, deuses, deusById, godpowerSlugById, godpowers, mapaSlugByIndex, mapas, panteaoById, panteaoBySlug, startsBuildOrder, unidadeSlugById, unidades, } = catalog;
    const { pathname, search: locSearch } = useLocation();
    const listIndexState = useMemo(() => listIndexLinkStateFromLocation(pathname, locSearch), [pathname, locSearch]);
    const pantheon = slug ? panteaoBySlug.get(slug) : undefined;
    const pantheonId = pantheon?.id;
    const cardTint = pantheonCardTint(pantheon?.nome ?? "");
    const backTo = slug ? localeSectionPath(locale, "panteoes", slug) : localeSectionPath(locale, "panteoes");
    const deusesDoPanteao = useMemo(() => [...deuses]
        .filter((d) => pantheonId != null && isPantheonRef(d.panteao, pantheonId))
        .sort((a, b) => {
        const aM = a.hierarquia?.toLowerCase() === "maior" ? 0 : 1;
        const bM = b.hierarquia?.toLowerCase() === "maior" ? 0 : 1;
        if (aM !== bM)
            return aM - bM;
        return a.id - b.id;
    }), [deuses, pantheonId]);
    const godpowersDoPanteao = useMemo(() => [...godpowers]
        .filter((g) => pantheonId != null && isPantheonRef(g.panteao, pantheonId))
        .sort((a, b) => a.id - b.id), [godpowers, pantheonId]);
    const aldeoesDoPanteao = useMemo(() => aldeoes.filter((a) => pantheonId != null && isPantheonRef(a.panteao, pantheonId)), [aldeoes, pantheonId]);
    const unidadesDoPanteao = useMemo(() => [...unidades]
        .filter((u) => pantheonId != null && isPantheonRef(u.panteao, pantheonId))
        .sort((a, b) => a.id - b.id), [unidades, pantheonId]);
    const construcoesDoPanteao = useMemo(() => [...construcoes]
        .filter((c) => pantheonId != null && isPantheonConstrucao(c, pantheonId))
        .sort((a, b) => a.id - b.id), [construcoes, pantheonId]);
    const mapasObsidian = useMemo(() => mapas
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => isObsidianMap(m)), [mapas]);
    const startsDoPanteao = useMemo(() => [...startsBuildOrder]
        .filter((s) => pantheon != null && s.pantheon === pantheon.nome)
        .sort((a, b) => {
        const aNew = a.status === "new" ? 0 : 1;
        const bNew = b.status === "new" ? 0 : 1;
        if (aNew !== bNew)
            return aNew - bNew;
        return a.id - b.id;
    }), [pantheon, startsBuildOrder]);
    if (!pantheon || pantheonId == null) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backTo, children: t("nav.pantheons") }), _jsx("p", { className: "text-zinc-400", children: t("common.entityNotFound.pantheon") })] }));
    }
    return (_jsxs("div", { children: [_jsx(BackLink, { to: backTo, children: pantheon.nome }), _jsx(PageHeader, { title: t("common.pantheonIndex"), headerIconSrc: getPantheonWatermarkUrl(pantheon), description: pantheonId === AZTEC_PANTEON_ID ? t("pages.astecas.description") : t("common.pantheonIndexHint") }), deusesDoPanteao.length > 0 ? (_jsxs("section", { className: "mt-10", children: [_jsx("h2", { className: sectionTitleClass, children: t("nav.gods") }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: deusesDoPanteao.map((d) => (_jsx("li", { children: _jsx(EntityCard, { to: localeSectionPath(locale, "deuses", deusSlugById.get(d.id) ?? d.id), linkState: listIndexState, title: d.nome, cardTint: cardTint, subtitle: d.foco ? _jsx(NotionText, { text: d.foco }) : undefined, meta: _jsxs("span", { className: "inline-flex flex-wrap items-baseline gap-x-0", children: [firstNumId(d.panteao) != null ? _jsx(PantheonMetaIcon, { panteaoId: firstNumId(d.panteao) }) : null, _jsx(MetaNotionLine, { parts: [firstNome(d.panteao), firstNome(d.era)] })] }), watermarkSrc: getDeusAssetUrl(d) }) }, d.id))) })] })) : null, godpowersDoPanteao.length > 0 ? (_jsxs("section", { className: "mt-10", children: [_jsx("h2", { className: sectionTitleClass, children: t("nav.godpowers") }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: godpowersDoPanteao.map((g) => {
                            const gid = firstNumId(g.god);
                            const deus = gid != null ? deusById.get(gid) : undefined;
                            const godLine = deus ? formatGodNameForMetaNotion(deus) : joinRefNomes(g.god);
                            return (_jsx("li", { children: _jsx(EntityCard, { to: localeSectionPath(locale, "poderes", godpowerSlugById.get(g.id) ?? g.id), linkState: listIndexState, title: g.nome, cardTint: cardTint, subtitle: g.descricao_resumida, meta: _jsx(MetaNotionLine, { parts: [godLine, joinRefNomes(g.era), joinRefNomes(g.panteao)] }), watermarkSrc: getGodPowerAssetUrl(g), subtitleMinLines: 3, subtitleTag: false }) }, g.id));
                        }) })] })) : null, aldeoesDoPanteao.length > 0 ? (_jsxs("section", { className: "mt-10", children: [_jsx("h2", { className: sectionTitleClass, children: t("nav.villagers") }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: aldeoesDoPanteao.map((a) => (_jsx("li", { children: _jsx(EntityCard, { to: localeSectionPath(locale, "aldeoes", aldeaoSlugById.get(a.id) ?? a.id), linkState: listIndexState, title: a.nome, cardTint: cardTint, subtitle: firstNome(a.panteao) ? _jsx(NotionText, { text: firstNome(a.panteao) }) : undefined, meta: a.ingles ? a.ingles : undefined, watermarkSrc: getAldeaoAssetUrl(a) }) }, a.id))) })] })) : null, unidadesDoPanteao.length > 0 ? (_jsxs("section", { className: "mt-10", children: [_jsx("h2", { className: sectionTitleClass, children: t("nav.units") }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: unidadesDoPanteao.map((u) => (_jsx("li", { children: _jsx(EntityCard, { to: localeSectionPath(locale, "unidades", unidadeSlugById.get(u.id) ?? u.id), linkState: listIndexState, title: u.nome, cardTint: cardTint, subtitleTag: false, subtitle: hasTipoContent(u.tipo) ? _jsx(UnidadeTipoLine, { tipo: u.tipo, colored: true }) : undefined, meta: _jsx(MetaNotionLine, { parts: [
                                        joinRefNomes(u.panteao),
                                        joinRefNomes(u.era),
                                        u.categoria?.filter((c) => c.type != null).map((c) => c.type).join(", "),
                                    ] }), watermarkSrc: getUnidadeAssetUrl(u) }) }, u.id))) })] })) : null, construcoesDoPanteao.length > 0 ? (_jsxs("section", { className: "mt-10", children: [_jsx("h2", { className: sectionTitleClass, children: t("nav.buildings") }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: construcoesDoPanteao.map((c) => {
                            const variantId = familyMemberForPantheon(c.id, pantheonId);
                            const variant = variantId != null && variantId !== c.id ? construcaoById.get(variantId) : undefined;
                            const tintName = (variant?.panteao_id != null ? panteaoById.get(variant.panteao_id) : c.panteao_id != null ? panteaoById.get(c.panteao_id) : undefined)?.nome ?? "";
                            const buildingSlug = construcaoSlugById.get(c.id) ?? c.id;
                            return (_jsx("li", { children: _jsx(EntityCard, { to: variant
                                        ? `${localeSectionPath(locale, "construcoes", buildingSlug)}?v=${variant.id}`
                                        : localeSectionPath(locale, "construcoes", buildingSlug), linkState: listIndexState, title: c.nome, cardTint: panteaoFieldHasMultiplePantheons(variant?.panteao ?? c.panteao) ? undefined : pantheonCardTint(tintName), subtitle: hasTipoContent(c.tipo) ? _jsx(UnidadeTipoLine, { tipo: c.tipo, colored: true, shell: "none" }) : undefined, meta: _jsx(MetaNotionLine, { parts: [variant?.panteao ?? c.panteao, c.era] }), watermarkSrc: getConstrucaoAssetUrl(c) }) }, c.id));
                        }) })] })) : null, startsDoPanteao.length > 0 ? (_jsxs("section", { className: "mt-10", children: [_jsx("h2", { className: sectionTitleClass, children: t("common.startsBuildOrders") }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: startsDoPanteao.map((s) => (_jsx("li", { className: "min-h-[8.5rem]", children: _jsx(EntityCard, { className: "h-full", to: localeSectionPath(locale, "starts", s.slug), linkState: listIndexState, watermarkSrc: resolveTokenIconSrc(s.image), title: _jsxs("span", { className: "flex w-full min-w-0 items-start justify-between gap-2", children: [_jsx("span", { className: "min-w-0", children: _jsx(NotionText, { text: s.titulo }) }), s.status === "new" ? (_jsxs("span", { className: startNovoTagClass, title: t("common.new"), children: ["\uD83D\uDD37 ", t("common.new"), " !"] })) : null] }), subtitleTag: false, subtitle: s.god.length ? _jsx(StartGodPortraits, { names: s.god }) : undefined, cardTint: s.pantheon ? pantheonCardTint(s.pantheon) : cardTint, meta: _jsx(StartAuthorsMeta, { authors: s.author }) }) }, s.slug))) })] })) : null, pantheonId === AZTEC_PANTEON_ID && mapasObsidian.length > 0 ? (_jsxs("section", { className: "mt-10", children: [_jsx("h2", { className: sectionTitleClass, children: t("common.mapsObsidianMirror") }), _jsx("p", { className: "mb-4 text-sm text-zinc-400", children: t("common.mapsObsidianDesc", { origin: MAPAS_OBSIDIAN_ORIGEM }) }), _jsx("ul", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: mapasObsidian.map(({ m, i }) => {
                            const dlcIcons = mapaOrigemTitleIcons(m.origem);
                            const origemMeta = formatMapaOrigem(m.origem);
                            return (_jsx("li", { children: _jsx(EntityCard, { to: localeSectionPath(locale, "mapas", mapaSlugByIndex.get(i) ?? i), linkState: listIndexState, title: m.nome, subtitle: m.tipo, meta: origemMeta || dlcIcons.length ? (_jsxs("span", { className: "inline-flex items-center gap-1.5", children: [dlcIcons.map((ti) => (_jsx("img", { src: ti.src, alt: "", title: ti.label, draggable: false, className: "size-4 shrink-0 object-contain" }, ti.src))), origemMeta ? _jsx("span", { children: origemMeta }) : null] })) : undefined, backgroundCoverSrc: getMapaPreviewUrl(m), backgroundCoverFallbackSrc: getMapaAssetUrl(m), watermarkSrc: getMapaAssetUrl(m), rankedHighlight: m.mapas_da_ranqueada, titleIcons: m.mapas_da_ranqueada
                                        ? [{ icon: "aomr_type_hero_icon", label: t("common.ranked") }]
                                        : undefined }) }, `${m.nome}-${i}`));
                        }) })] })) : null] }));
}
