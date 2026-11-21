import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { CompareInfoRow } from "@/components/ui/InfoRow";
import { NotionText } from "@/components/ui/NotionText";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { localeSectionPath } from "@/lib/localeRoutes";
import { formatMultiplicadorTailForNotion, hasMultiplicadorContent, multiplicadorCompareTones, } from "@/lib/unidadeMultiplicador";
import { formatArmorPercent } from "@/lib/armorDisplay";
import { parseGameNumber, toneToTextClass, } from "@/lib/numericCompare";
import { categoriaItemsToNotionText, hasCategoriaContent, hasTipoContent, } from "@/lib/unidadeTipo";
function hasRefList(v) {
    return Array.isArray(v) && v.length > 0 && typeof v[0]?.id === "number";
}
function renderRefCell(refs, locale, section, slugById) {
    if (!hasRefList(refs))
        return "—";
    return (_jsx("span", { className: "inline-flex flex-wrap items-baseline gap-x-1.5", children: refs.map((r, i) => (_jsxs(Fragment, { children: [i > 0 ? _jsx("span", { className: "text-zinc-600", children: "," }) : null, _jsx(Link, { to: localeSectionPath(locale, section, slugById.get(r.id) ?? r.id), className: "text-amber-200 underline-offset-2 hover:underline", children: _jsx(NotionText, { text: r.nome }) })] }, `${r.id}-${i}`))) }));
}
function showRefRow(u1, u2, key) {
    return !!(hasRefList(u1[key]) || hasRefList(u2[key]));
}
function numericPairFrom(a, b) {
    return { left: parseGameNumber(a), right: parseGameNumber(b) };
}
function MultiplicadorCompareSegment({ item, tone, }) {
    const toneCls = toneToTextClass(tone);
    const icon = (item.icon ?? "").trim();
    if (!icon) {
        return (_jsx("span", { className: toneCls, children: _jsx(NotionText, { text: item.value }) }));
    }
    return (_jsxs("span", { className: "inline align-baseline", children: [_jsx(NotionText, { text: `:${icon}:` }), _jsx("span", { className: toneCls, children: formatMultiplicadorTailForNotion(item.value) })] }));
}
function renderMultiplicadorCompareSide(items, tones) {
    return (_jsx(_Fragment, { children: items.map((item, i) => (_jsxs(Fragment, { children: [i > 0 ? _jsx("span", { className: "text-zinc-500", children: " || " }) : null, _jsx(MultiplicadorCompareSegment, { item: item, tone: tones[i] ?? "default" })] }, i))) }));
}
export function UnidadeVisaoGeralCompare({ u1, u2 }) {
    const { t } = useTranslation();
    const { locale, panteaoSlugById, eraSlugById, construcaoSlugById } = useCatalog();
    return (_jsxs("div", { className: "space-y-0", children: [hasTipoContent(u1.tipo) || hasTipoContent(u2.tipo) ? (_jsx(CompareInfoRow, { label: t("common.type"), left: hasTipoContent(u1.tipo) ? _jsx(UnidadeTipoLine, { tipo: u1.tipo, colored: true }) : "—", right: hasTipoContent(u2.tipo) ? _jsx(UnidadeTipoLine, { tipo: u2.tipo, colored: true }) : "—" })) : null, hasCategoriaContent(u1.categoria) || hasCategoriaContent(u2.categoria) ? (_jsx(CompareInfoRow, { label: t("common.category"), left: hasCategoriaContent(u1.categoria) ? (_jsx(NotionText, { text: categoriaItemsToNotionText(u1.categoria) })) : ("—"), right: hasCategoriaContent(u2.categoria) ? (_jsx(NotionText, { text: categoriaItemsToNotionText(u2.categoria) })) : ("—") })) : null, showRefRow(u1, u2, "panteao") ? (_jsx(CompareInfoRow, { label: t("common.pantheon"), left: renderRefCell(u1.panteao, locale, "panteoes", panteaoSlugById), right: renderRefCell(u2.panteao, locale, "panteoes", panteaoSlugById) })) : null, showRefRow(u1, u2, "era") ? (_jsx(CompareInfoRow, { label: t("common.era"), left: renderRefCell(u1.era, locale, "eras", eraSlugById), right: renderRefCell(u2.era, locale, "eras", eraSlugById) })) : null, showRefRow(u1, u2, "construcao") ? (_jsx(CompareInfoRow, { label: t("spreadsheet.unidades.building"), left: renderRefCell(u1.construcao, locale, "construcoes", construcaoSlugById), right: renderRefCell(u2.construcao, locale, "construcoes", construcaoSlugById) })) : null] }));
}
export function UnidadeCombateCompare({ u1, u2 }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "space-y-0", children: [_jsx(CompareInfoRow, { label: t("spreadsheet.unidades.hitPoints"), icon: "aomr_hit_points_icon", left: u1.pontos_de_vida ?? "—", right: u2.pontos_de_vida ?? "—", numericPair: numericPairFrom(u1.pontos_de_vida, u2.pontos_de_vida) }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.range"), icon: "rangeicon", left: u1.alcance ?? "—", right: u2.alcance ?? "—", numericPair: numericPairFrom(u1.alcance, u2.alcance) }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.hackDamage"), icon: "hackdamage", left: u1.dano_cortante ?? "—", right: u2.dano_cortante ?? "—", numericPair: numericPairFrom(u1.dano_cortante, u2.dano_cortante) }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.pierceDamage"), icon: "piercedamage", left: u1.dano_perfurante ?? "—", right: u2.dano_perfurante ?? "—", numericPair: numericPairFrom(u1.dano_perfurante, u2.dano_perfurante) }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.attackSpeed"), icon: "aomr_rate_of_fire_icon", left: u1.velocidade_de_ataque_atk_s ?? "—", right: u2.velocidade_de_ataque_atk_s ?? "—", numericPair: {
                    ...numericPairFrom(u1.velocidade_de_ataque_atk_s, u2.velocidade_de_ataque_atk_s),
                    lowerIsBetter: true,
                } }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.dps"), icon: "attack_cur", left: u1.dps ?? "—", right: u2.dps ?? "—", numericPair: numericPairFrom(u1.dps, u2.dps) }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.hackArmor"), icon: "hackarmor", left: formatArmorPercent(u1.armadura_anticorte), right: formatArmorPercent(u2.armadura_anticorte), numericPair: numericPairFrom(u1.armadura_anticorte, u2.armadura_anticorte) }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.pierceArmor"), icon: "piercearmor", left: formatArmorPercent(u1.armadura_antiperfurante), right: formatArmorPercent(u2.armadura_antiperfurante), numericPair: numericPairFrom(u1.armadura_antiperfurante, u2.armadura_antiperfurante) }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.counterOf"), left: u1.counter_de ? _jsx(NotionText, { text: u1.counter_de }) : "—", right: u2.counter_de ? _jsx(NotionText, { text: u2.counter_de }) : "—" }), (() => {
                const leftItems = hasMultiplicadorContent(u1.multiplicador) && u1.multiplicador ? u1.multiplicador : [];
                const rightItems = hasMultiplicadorContent(u2.multiplicador) && u2.multiplicador ? u2.multiplicador : [];
                const { left: tonesL, right: tonesR } = multiplicadorCompareTones(leftItems, rightItems);
                return (_jsx(CompareInfoRow, { label: t("spreadsheet.unidades.multiplier"), left: leftItems.length ? renderMultiplicadorCompareSide(leftItems, tonesL) : "—", right: rightItems.length ? renderMultiplicadorCompareSide(rightItems, tonesR) : "—" }));
            })(), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.strongAgainst"), icon: "aomr_better_icon", left: u1.forte_contra ? _jsx(NotionText, { text: u1.forte_contra }) : "—", right: u2.forte_contra ? _jsx(NotionText, { text: u2.forte_contra }) : "—" }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.weakAgainst"), icon: "aomr_worse_icon", left: u1.fraco_contra ? _jsx(NotionText, { text: u1.fraco_contra }) : "—", right: u2.fraco_contra ? _jsx(NotionText, { text: u2.fraco_contra }) : "—" })] }));
}
export function UnidadeCustoCompare({ u1, u2 }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "space-y-0", children: [_jsx(CompareInfoRow, { label: t("common.food"), icon: "foodaom", left: u1.comida ?? "—", right: u2.comida ?? "—", numericPair: { ...numericPairFrom(u1.comida, u2.comida), lowerIsBetter: true } }), _jsx(CompareInfoRow, { label: t("common.wood"), icon: "woodaom", left: u1.madeira ?? "—", right: u2.madeira ?? "—", numericPair: { ...numericPairFrom(u1.madeira, u2.madeira), lowerIsBetter: true } }), _jsx(CompareInfoRow, { label: t("common.gold"), icon: "goldaom", left: u1.ouro ?? "—", right: u2.ouro ?? "—", numericPair: { ...numericPairFrom(u1.ouro, u2.ouro), lowerIsBetter: true } }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.population"), icon: "aomr_population_provision_icon", left: u1.populacao ?? "—", right: u2.populacao ?? "—", numericPair: { ...numericPairFrom(u1.populacao, u2.populacao), lowerIsBetter: true } }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.trainTime"), icon: "aomr_time_icon", left: u1.tempo_treinamento ?? "—", right: u2.tempo_treinamento ?? "—", numericPair: { ...numericPairFrom(u1.tempo_treinamento, u2.tempo_treinamento), lowerIsBetter: true } }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.moveSpeed"), icon: "aomr_speed_icon", left: u1.velocidade_movimento ?? "—", right: u2.velocidade_movimento ?? "—", numericPair: numericPairFrom(u1.velocidade_movimento, u2.velocidade_movimento) }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.attributeStrength"), icon: "attack_cur", left: u1.forca_atributos ?? "—", right: u2.forca_atributos ?? "—", numericPair: numericPairFrom(u1.forca_atributos, u2.forca_atributos) })] }));
}
