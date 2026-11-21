import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { PageComments } from "@/components/comments/MapComments";
import { BuildingProjection } from "@/components/construcao/BuildingProjection";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitCluster, InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { formatArmorPercent } from "@/lib/armorDisplay";
import { buildingFamilyOf, construcaoPublicId, construcaoVariantQuery, isHiddenFamilyMember, legacyBuildingSlugId, presentFamilyMember, selectedFamilyMember, variantButtonLabel, variantGodLabel, } from "@/lib/buildingFamilies";
import { buildingModelUrl } from "@/lib/buildingModelUrl";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
import { getConstrucaoAssetUrl, getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { listIndexLinkStateFromLocation, listIndexReturnTo, listOrDetailBackLinkLabel, } from "@/lib/listIndexReturnState";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
import { tecnologiaPortraitItemsFromNames } from "@/lib/tecnologiaPortraitItems";
import { localeSectionPath } from "@/lib/localeRoutes";
import { hasTipoContent } from "@/lib/unidadeTipo";
function splitCommaNames(raw) {
    if (!raw?.trim())
        return [];
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
function unidadeIdsFromConstrucao(c) {
    const ids = [...(c.unidades_ids ?? [])];
    const single = c.unidades_id;
    if (typeof single === "number" && !ids.includes(single))
        ids.push(single);
    return ids;
}
function unidadePortraitItemsFromIds(catalog, ids) {
    const { locale, unidadeById, unidadeSlugById } = catalog;
    return ids.map((uid, i) => {
        const u = unidadeById.get(uid);
        const slug = unidadeSlugById.get(uid);
        return {
            key: `u-${uid}-${i}`,
            to: localeSectionPath(locale, "unidades", slug ?? uid),
            nome: u?.nome ?? `#${uid}`,
            src: u ? getUnidadeAssetUrl(u) : undefined,
        };
    });
}
export function ConstrucaoDetailPage() {
    const { t, locale } = useTranslation();
    const catalog = useCatalog();
    const { construcaoById, construcaoBySlug, construcaoSlugById, deusById, deusSlugById, eraById, eraSlugById, panteaoById, panteaoSlugById } = catalog;
    const [searchParams, setSearchParams] = useSearchParams();
    const { pathname, search: locSearch, state: navState } = useLocation();
    const linkState = listIndexLinkStateFromLocation(pathname, locSearch);
    const buildingsList = localeSectionPath(locale, "construcoes");
    const backToList = listIndexReturnTo(buildingsList, navState);
    const backLabel = listOrDetailBackLinkLabel(backToList, buildingsList, t("nav.buildings"));
    const { slug } = useParams();
    const legacyId = slug ? legacyBuildingSlugId(slug) : undefined;
    if (legacyId != null) {
        const dest = construcaoSlugById.get(legacyId) ?? legacyId;
        return _jsx(Navigate, { to: localeSectionPath(locale, "construcoes", dest), replace: true, state: navState });
    }
    const c = slug ? construcaoBySlug.get(slug) : undefined;
    if (c && isHiddenFamilyMember(c.id)) {
        const ownerId = construcaoPublicId(c.id);
        const dest = construcaoSlugById.get(ownerId) ?? ownerId;
        return (_jsx(Navigate, { to: `${localeSectionPath(locale, "construcoes", dest)}${construcaoVariantQuery(c.id)}`, replace: true, state: navState }));
    }
    if (!c) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx("p", { className: "text-zinc-400", children: t("common.entityNotFound.building") })] }));
    }
    const family = buildingFamilyOf(c.id);
    const member = family && family.canonicalId === c.id ? selectedFamilyMember(family, searchParams.get("v")) : undefined;
    const source = member ? construcaoById.get(member.sourceId) : undefined;
    const view = member && source ? presentFamilyMember(c, source) : c;
    const deus = member?.deusId != null ? deusById.get(member.deusId) : undefined;
    const visuals = family
        ? family.members.map((item) => {
            const row = construcaoById.get(item.sourceId);
            if (family.kind === "upgrade") {
                const god = item.deusId != null ? deusById.get(item.deusId) : undefined;
                return {
                    id: String(item.sourceId),
                    label: row ? variantButtonLabel(row) : String(item.sourceId),
                    icon: (god ? getDeusAssetUrl(god) : undefined) ?? (row ? getConstrucaoAssetUrl(row) : undefined),
                };
            }
            if (item.deusId != null) {
                const god = deusById.get(item.deusId);
                return {
                    id: String(item.sourceId),
                    label: variantGodLabel(row?.nome ?? god?.nome ?? String(item.sourceId)),
                    icon: god ? getDeusAssetUrl(god) : undefined,
                };
            }
            const pantheon = panteaoById.get(item.pantheonId);
            return {
                id: String(item.sourceId),
                label: pantheon?.nome ?? String(item.pantheonId),
                icon: pantheon ? getPantheonWatermarkUrl(pantheon) : undefined,
            };
        })
        : undefined;
    const selectVisual = (id) => {
        if (!family)
            return;
        const next = new URLSearchParams(searchParams);
        if (Number(id) === family.members[0].sourceId)
            next.delete("v");
        else
            next.set("v", id);
        setSearchParams(next, { replace: true, state: navState });
    };
    const era = view.era_id != null ? eraById.get(view.era_id) : undefined;
    const construcaoIcon = getConstrucaoAssetUrl(family?.kind === "upgrade" && source ? source : view);
    const panteao = view.panteao_id != null ? panteaoById.get(view.panteao_id) : undefined;
    const tecnologiaNames = splitCommaNames(view.tecnologias);
    const tecnologiaPortraitItems = tecnologiaNames.length ? tecnologiaPortraitItemsFromNames(catalog, tecnologiaNames) : [];
    const unidadeIdList = unidadeIdsFromConstrucao(view);
    const unidadePortraitItems = unidadeIdList.length ? unidadePortraitItemsFromIds(catalog, unidadeIdList) : [];
    const showTecnologiasSection = tecnologiaPortraitItems.length > 0 || Boolean(view.tecnologias?.trim());
    const showUnidadesSection = unidadePortraitItems.length > 0 || Boolean(view.unidades?.trim());
    const modelUrl = buildingModelUrl(member?.sourceId ?? view.id);
    const shortDesc = (view.descricao_resumida ?? "").trim();
    const longDesc = (view.descricao_avancada ?? "").trim();
    const hist = (view.historia ?? "").trim();
    const costSection = (_jsx(Section, { title: t("common.costAndTime"), children: _jsxs("div", { className: "space-y-0", children: [_jsx(InfoRow, { label: t("common.totalCost"), children: view.custo ?? "—" }), "comida" in view && typeof view.comida === "number" ? (_jsx(InfoRow, { label: t("common.food"), icon: "foodaom", children: view.comida })) : null, _jsx(InfoRow, { label: t("common.wood"), icon: "woodaom", children: view.madeira ?? "—" }), _jsx(InfoRow, { label: t("common.gold"), icon: "goldaom", children: view.ouro ?? "—" }), _jsx(InfoRow, { label: t("common.buildTime"), icon: "aomr_time_icon", children: view.tempo_construir_segundos ?? "—" }), _jsx(InfoRow, { label: t("common.garrison"), icon: "aom_garrison_icon", children: view.guarnicao ?? "—" })] }) }));
    return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx(PageHeader, { title: view.nome, description: shortDesc ? _jsx(NotionText, { text: shortDesc, className: "block" }) : undefined, headerIconSrc: construcaoIcon, siblingNav: _jsx(CatalogRecordNav, { section: "construcoes", currentId: c.id }) }), _jsxs("div", { className: "grid items-start gap-6 lg:grid-cols-2", children: [_jsx(Section, { title: t("common.aboutBuilding"), children: _jsxs("div", { className: "space-y-0", children: [hasTipoContent(c.tipo) ? (_jsx(InfoRow, { label: t("common.type"), children: _jsx(UnidadeTipoLine, { tipo: c.tipo, colored: true }) })) : null, panteao ? (_jsx(InfoRow, { label: t("common.pantheon"), children: _jsx(InfoRowPortraitOrText, { portraits: _jsx(PortraitHeaderActions, { items: [
                                                {
                                                    key: String(panteao.id),
                                                    to: localeSectionPath(locale, "panteoes", panteaoSlugById.get(panteao.id) ?? panteao.id),
                                                    nome: panteao.nome,
                                                    src: getPantheonWatermarkUrl(panteao),
                                                },
                                            ], linkState: linkState, size: "sm", justify: "start" }), textFallback: null }) })) : view.panteao ? (_jsx(InfoRow, { label: t("common.pantheon"), children: _jsx(InfoRowPortraitOrText, { portraits: null, textFallback: _jsx(NotionText, { text: view.panteao }) }) })) : null, deus ? (_jsx(InfoRow, { label: t("common.god"), children: _jsx(InfoRowPortraitOrText, { portraits: _jsx(PortraitHeaderActions, { items: [
                                                {
                                                    key: String(deus.id),
                                                    to: localeSectionPath(locale, "deuses", deusSlugById.get(deus.id) ?? deus.id),
                                                    nome: variantGodLabel(source?.nome ?? deus.nome),
                                                    src: getDeusAssetUrl(deus),
                                                },
                                            ], linkState: linkState, size: "sm", justify: "start" }), textFallback: null }) })) : null, era ? (_jsx(InfoRow, { label: t("common.era"), children: _jsx(InfoRowPortraitOrText, { portraits: _jsx(PortraitHeaderActions, { items: [
                                                {
                                                    key: String(era.id),
                                                    to: localeSectionPath(locale, "eras", eraSlugById.get(era.id) ?? era.id),
                                                    nome: era.nome,
                                                    src: getEraAssetUrl(era),
                                                },
                                            ], linkState: linkState, size: "sm", justify: "start" }), textFallback: null }) })) : view.era ? (_jsx(InfoRow, { label: t("common.era"), children: _jsx(InfoRowPortraitOrText, { portraits: null, textFallback: _jsx(NotionText, { text: view.era }) }) })) : null, longDesc && longDesc !== shortDesc ? (_jsx("div", { className: "border-t border-aom-border/50 pt-3", children: _jsx(NotionText, { text: longDesc, className: "block whitespace-pre-line text-sm leading-relaxed text-zinc-300" }) })) : null] }) }), modelUrl ? (_jsx(Section, { title: t("common.projection3d"), children: _jsx(BuildingProjection, { buildingId: c.id, fallbackUrl: modelUrl, defaultPantheonId: view.panteao_id, visuals: visuals, activeVisual: member ? String(member.sourceId) : undefined, onVisual: selectVisual }, c.id) })) : (costSection)] }), _jsxs("div", { className: "mt-6 grid items-start gap-6 lg:grid-cols-2", children: [modelUrl ? costSection : null, _jsx(Section, { title: t("common.combatDefense"), children: _jsxs("div", { className: "space-y-0", children: [_jsx(InfoRow, { label: t("common.hitPoints"), icon: "aomr_hit_points_icon", children: view.pontos_de_vida ?? "—" }), _jsx(InfoRow, { label: t("common.pierceDamage"), icon: "piercedamage", children: view.dano_perfurante ?? "—" }), _jsx(InfoRow, { label: t("common.attackSpeed"), icon: "aomr_rate_of_fire_icon", children: view.velocidade_de_ataque_atk_s ?? "—" }), _jsx(InfoRow, { label: t("common.dps"), icon: "attack_cur", children: view.dps ?? "—" }), _jsx(InfoRow, { label: t("common.range"), icon: "rangeicon", children: view.alcance ?? "—" }), _jsx(InfoRow, { label: t("common.projectiles"), icon: "piercedamage", children: view.no_projeteis ?? "—" }), _jsx(InfoRow, { label: t("common.hackArmor"), icon: "hackarmor", children: formatArmorPercent(view.armadura_anticorte) }), _jsx(InfoRow, { label: t("common.pierceArmor"), icon: "piercearmor", children: formatArmorPercent(view.armadura_antiperfurante) }), _jsx(InfoRow, { label: t("common.crushArmor"), icon: "crusharmor", children: formatArmorPercent(view.armadura_anticontucao) })] }) }), showTecnologiasSection ? (_jsx(Section, { title: t("common.technologies"), children: tecnologiaPortraitItems.length > 0 ? (_jsx(InfoRowPortraitCluster, { children: _jsx(PortraitHeaderActions, { items: tecnologiaPortraitItems, linkState: linkState, size: "sm", justify: "start" }) })) : (_jsx(NotionText, { text: view.tecnologias })) })) : (_jsx("div", {}))] }), showUnidadesSection ? (_jsx(Section, { title: unidadePortraitItems.length > 0 ? t("common.relatedUnits") : t("nav.units"), className: "mt-6", children: unidadePortraitItems.length > 0 ? (_jsx(InfoRowPortraitCluster, { children: _jsx(PortraitHeaderActions, { items: unidadePortraitItems, linkState: linkState, size: "sm", justify: "start" }) })) : (_jsx(NotionText, { text: view.unidades })) })) : null, hist ? (_jsx(Section, { title: t("common.history"), className: "mt-6", children: _jsx(NotionText, { text: hist, className: "block whitespace-pre-line text-sm leading-relaxed text-zinc-300" }) })) : null, slug ? (_jsx(PageComments, { pageKind: "construcoes", pageKey: slug, itemName: view.nome, kindLabel: t("comments.kinds.building") })) : null] }));
}
