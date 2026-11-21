import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation } from "react-router-dom";
import { ForcaAtributosInfo } from "@/components/unidade/ForcaAtributosInfo";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { formatArmorPercent } from "@/lib/armorDisplay";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { NotionText } from "@/components/ui/NotionText";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { hasMultiplicadorContent, multiplicadorItemsToNotionText, } from "@/lib/unidadeMultiplicador";
import { categoriaItemsToNotionText, hasCategoriaContent, hasTipoContent, } from "@/lib/unidadeTipo";
import { getConstrucaoAssetUrl } from "@/lib/entityWatermarkUrls";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { construcaoPublicId, construcaoVariantQuery } from "@/lib/buildingFamilies";
import { localeSectionPath } from "@/lib/localeRoutes";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
export function UnidadeVisaoGeralBody({ u }) {
    const { t } = useTranslation();
    const catalog = useCatalog();
    const { locale, construcaoById, construcaoSlugById, eraById, eraSlugById, panteaoById, panteaoSlugById } = catalog;
    const { pathname, search: locSearch } = useLocation();
    const linkState = listIndexLinkStateFromLocation(pathname, locSearch);
    const panteaoRefs = u.panteao;
    const eraRefs = u.era;
    const constrRefs = u.construcao;
    const panteoesPortraitItems = Array.isArray(panteaoRefs) && panteaoRefs.length
        ? panteaoRefs.map((r, i) => {
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
    const construcaoPortraitItems = Array.isArray(constrRefs) && constrRefs.length
        ? constrRefs.map((r, i) => {
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
    const descricaoResumida = (u.descricao_resumida ?? "").trim();
    const descricaoAvancada = (u.descricao_avancada ?? "").trim();
    const showAvancada = Boolean(descricaoAvancada && descricaoAvancada !== descricaoResumida);
    return (_jsxs("div", { className: "space-y-0", children: [descricaoResumida ? (_jsx(InfoRow, { label: t("common.description"), children: _jsx(NotionText, { text: descricaoResumida }) })) : null, hasTipoContent(u.tipo) ? (_jsx(InfoRow, { label: t("common.type"), children: _jsx(UnidadeTipoLine, { tipo: u.tipo, colored: true }) })) : null, hasCategoriaContent(u.categoria) ? (_jsx(InfoRow, { label: t("common.category"), children: _jsx(NotionText, { text: categoriaItemsToNotionText(u.categoria) }) })) : null, panteoesPortraitItems.length ? (_jsx(InfoRow, { label: t("common.pantheon"), children: _jsx(InfoRowPortraitOrText, { portraits: _jsx(PortraitHeaderActions, { items: panteoesPortraitItems, linkState: linkState, size: "sm", justify: "start" }), textFallback: null }) })) : null, eraPortraitItems.length ? (_jsx(InfoRow, { label: t("common.era"), children: _jsx(InfoRowPortraitOrText, { portraits: _jsx(PortraitHeaderActions, { items: eraPortraitItems, linkState: linkState, size: "sm", justify: "start" }), textFallback: null }) })) : null, construcaoPortraitItems.length ? (_jsx(InfoRow, { label: t("spreadsheet.unidades.building"), children: _jsx(InfoRowPortraitOrText, { portraits: _jsx(PortraitHeaderActions, { items: construcaoPortraitItems, linkState: linkState, size: "sm", justify: "start" }), textFallback: null }) })) : null, showAvancada ? (_jsx("div", { className: "border-t border-aom-border/50 pt-3", children: _jsx(NotionText, { text: descricaoAvancada, className: "block whitespace-pre-line text-sm leading-relaxed text-zinc-300" }) })) : null] }));
}
export function UnidadeCombateBody({ u }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "space-y-0", children: [_jsx(InfoRow, { label: t("spreadsheet.unidades.hitPoints"), icon: "aomr_hit_points_icon", children: u.pontos_de_vida ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.range"), icon: "rangeicon", children: u.alcance ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.hackDamage"), icon: "hackdamage", children: u.dano_cortante ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.pierceDamage"), icon: "piercedamage", children: u.dano_perfurante ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.attackSpeed"), icon: "aomr_rate_of_fire_icon", children: u.velocidade_de_ataque_atk_s ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.dps"), icon: "attack_cur", children: u.dps ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.hackArmor"), icon: "hackarmor", children: formatArmorPercent(u.armadura_anticorte) }), _jsx(InfoRow, { label: t("spreadsheet.unidades.pierceArmor"), icon: "piercearmor", children: formatArmorPercent(u.armadura_antiperfurante) }), _jsx(InfoRow, { label: t("spreadsheet.unidades.counterOf"), children: u.counter_de ? _jsx(NotionText, { text: u.counter_de }) : "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.multiplier"), children: hasMultiplicadorContent(u.multiplicador) ? (_jsx(NotionText, { text: multiplicadorItemsToNotionText(u.multiplicador) })) : ("—") }), _jsx(InfoRow, { label: t("spreadsheet.unidades.strongAgainst"), icon: "aomr_better_icon", children: u.forte_contra ? _jsx(NotionText, { text: u.forte_contra }) : "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.weakAgainst"), icon: "aomr_worse_icon", children: u.fraco_contra ? _jsx(NotionText, { text: u.fraco_contra }) : "—" })] }));
}
export function UnidadeCustoBody({ u }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "space-y-0", children: [_jsx(InfoRow, { label: t("common.food"), icon: "foodaom", children: u.comida ?? "—" }), _jsx(InfoRow, { label: t("common.wood"), icon: "woodaom", children: u.madeira ?? "—" }), _jsx(InfoRow, { label: t("common.gold"), icon: "goldaom", children: u.ouro ?? "—" }), typeof u.favor === "number" && u.favor > 0 ? (_jsx(InfoRow, { label: t("spreadsheet.favor"), icon: "favoraom", children: u.favor })) : null, _jsx(InfoRow, { label: t("spreadsheet.unidades.population"), icon: "aomr_population_provision_icon", children: u.populacao ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.trainTime"), icon: "aomr_time_icon", children: u.tempo_treinamento ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.moveSpeed"), icon: "aomr_speed_icon", children: u.velocidade_movimento ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.attributeStrength"), icon: "attack_cur", labelAddon: _jsx(ForcaAtributosInfo, { u: u }), children: u.forca_atributos ?? "—" })] }));
}
export function UnidadeHabilidadesBody({ u }) {
    const habilidades = Array.isArray(u.habilidades) ? u.habilidades : [];
    if (!habilidades.length)
        return null;
    return (_jsx("ul", { className: "space-y-3", children: habilidades.map((h, i) => {
            const iconToken = (h.icon ?? "").replace(/^:+|:+$/g, "");
            const iconSrc = iconToken ? resolveTokenIconSrc(iconToken) : undefined;
            return (_jsxs("li", { className: "flex items-start gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5", children: [iconSrc ? (_jsx("img", { src: iconSrc, alt: "", "aria-hidden": true, className: "mt-0.5 size-10 shrink-0 rounded-md border border-zinc-700/60 bg-zinc-900/80 object-contain p-0.5" })) : null, _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx(NotionText, { text: h.nome, className: "text-sm font-medium text-zinc-100" }), h.descricao ? (_jsx(NotionText, { text: h.descricao, className: "mt-1 block text-sm leading-relaxed text-zinc-400" })) : null] })] }, `${h.nome}-${i}`));
        }) }));
}
/** Seção de história do jogo — sempre aberta. */
export function UnidadeHistoriaDetails({ historia }) {
    const { t } = useTranslation();
    const text = historia.trim();
    if (!text)
        return null;
    return (_jsx(Section, { title: t("common.history"), className: "mt-6", children: _jsx(NotionText, { text: text.replace(/\n\n+/g, "\n\n"), className: "block whitespace-pre-line text-sm leading-relaxed text-zinc-300" }) }));
}
