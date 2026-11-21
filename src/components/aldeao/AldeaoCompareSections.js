import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { CompareInfoRow } from "@/components/ui/InfoRow";
import { NotionText } from "@/components/ui/NotionText";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { firstNome } from "@/lib/entityRefs";
import { localeSectionPath } from "@/lib/localeRoutes";
import { parseGameNumber } from "@/lib/numericCompare";
function numericPairFrom(a, b) {
    return { left: parseGameNumber(a), right: parseGameNumber(b) };
}
function hasRefList(v) {
    return Array.isArray(v) && v.length > 0 && typeof v[0]?.id === "number";
}
function renderPanteaoCell(a, locale, panteaoSlugById) {
    const refs = a.panteao;
    if (hasRefList(refs)) {
        return (_jsx("span", { className: "inline-flex flex-wrap items-baseline gap-x-1.5", children: refs.map((r, i) => (_jsxs(Fragment, { children: [i > 0 ? _jsx("span", { className: "text-zinc-600", children: "," }) : null, _jsx(Link, { to: localeSectionPath(locale, "panteoes", panteaoSlugById.get(r.id) ?? r.id), className: "text-amber-200 underline-offset-2 hover:underline", children: _jsx(NotionText, { text: r.nome }) })] }, `${r.id}-${i}`))) }));
    }
    const nome = firstNome(a.panteao);
    return nome ? _jsx(NotionText, { text: nome }) : "—";
}
function showPanteaoRow(a1, a2) {
    return !!(hasRefList(a1.panteao) || hasRefList(a2.panteao) || firstNome(a1.panteao) || firstNome(a2.panteao));
}
function showCarneRow(a1, a2) {
    return a1.carne != null || a2.carne != null;
}
function showMadeiraRow(a1, a2) {
    return a1.madeira != null || a2.madeira != null;
}
function showOuroRow(a1, a2) {
    return a1.ouro != null || a2.ouro != null;
}
export function AldeaoGeralCompare({ a1, a2 }) {
    const { t } = useTranslation();
    const { locale, panteaoSlugById } = useCatalog();
    return (_jsxs("div", { className: "space-y-0", children: [showPanteaoRow(a1, a2) ? (_jsx(CompareInfoRow, { label: t("common.pantheon"), left: renderPanteaoCell(a1, locale, panteaoSlugById), right: renderPanteaoCell(a2, locale, panteaoSlugById) })) : null, _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.hitPoints"), icon: "aomr_hit_points_icon", left: a1.vida ?? "—", right: a2.vida ?? "—", numericPair: numericPairFrom(a1.vida, a2.vida) }), _jsx(CompareInfoRow, { label: t("spreadsheet.unidades.population"), icon: "aomr_population_provision_icon", left: a1.populacao ?? "—", right: a2.populacao ?? "—", numericPair: { ...numericPairFrom(a1.populacao, a2.populacao), lowerIsBetter: true } }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.resourceCost"), icon: "aomr_type_villager_icon", left: a1.recursos ?? "—", right: a2.recursos ?? "—", numericPair: { ...numericPairFrom(a1.recursos, a2.recursos), lowerIsBetter: true } }), showCarneRow(a1, a2) ? (_jsx(CompareInfoRow, { label: t("common.food"), icon: "foodaom", left: a1.carne ?? "—", right: a2.carne ?? "—", numericPair: { ...numericPairFrom(a1.carne, a2.carne), lowerIsBetter: true } })) : null, showMadeiraRow(a1, a2) ? (_jsx(CompareInfoRow, { label: t("common.wood"), icon: "woodaom", left: a1.madeira ?? "—", right: a2.madeira ?? "—", numericPair: { ...numericPairFrom(a1.madeira, a2.madeira), lowerIsBetter: true } })) : null, showOuroRow(a1, a2) ? (_jsx(CompareInfoRow, { label: t("common.gold"), icon: "aomr_gold_icon", left: a1.ouro ?? "—", right: a2.ouro ?? "—", numericPair: { ...numericPairFrom(a1.ouro, a2.ouro), lowerIsBetter: true } })) : null, _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.trainTime"), icon: "aomr_time_icon", left: a1.tempo_de_treinamento ?? "—", right: a2.tempo_de_treinamento ?? "—", numericPair: { ...numericPairFrom(a1.tempo_de_treinamento, a2.tempo_de_treinamento), lowerIsBetter: true } })] }));
}
export function AldeaoColetaCompare({ a1, a2 }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "space-y-0", children: [_jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.hunt"), icon: "aomr_caribou_icon", left: a1.cacar ?? "—", right: a2.cacar ?? "—", numericPair: numericPairFrom(a1.cacar, a2.cacar) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.livestock"), icon: "aomr_cow_icon", left: a1.gado_galinhas ?? "—", right: a2.gado_galinhas ?? "—", numericPair: numericPairFrom(a1.gado_galinhas, a2.gado_galinhas) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.berries"), icon: "aomr_berry_bush_icon", left: a1.frutinhas ?? "—", right: a2.frutinhas ?? "—", numericPair: numericPairFrom(a1.frutinhas, a2.frutinhas) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.farm"), icon: "aomr_farm_icon", left: a1.fazenda ?? "—", right: a2.fazenda ?? "—", numericPair: numericPairFrom(a1.fazenda, a2.fazenda) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.tree"), icon: "aomr_tree_oak_icon", left: a1.arvore ?? "—", right: a2.arvore ?? "—", numericPair: numericPairFrom(a1.arvore, a2.arvore) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.mine"), icon: "aomr_gold_mine_icon", left: a1.mina ?? "—", right: a2.mina ?? "—", numericPair: numericPairFrom(a1.mina, a2.mina) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.buildSpeed"), icon: "aomr_type_building_icon", left: a1.velocidade_construcao ?? "—", right: a2.velocidade_construcao ?? "—", numericPair: numericPairFrom(a1.velocidade_construcao, a2.velocidade_construcao) })] }));
}
export function AldeaoBonusCompare({ a1, a2 }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "space-y-0", children: [_jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.huntPercent"), icon: "aomr_caribou_icon", left: a1.cacar_porcento ?? 0, right: a2.cacar_porcento ?? 0, numericPair: numericPairFrom(a1.cacar_porcento, a2.cacar_porcento) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.livestockPercent"), icon: "aomr_cow_icon", left: a1.gado_porcento ?? 0, right: a2.gado_porcento ?? 0, numericPair: numericPairFrom(a1.gado_porcento, a2.gado_porcento) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.berriesPercent"), icon: "aomr_berry_bush_icon", left: a1.frutinhas_porcento ?? 0, right: a2.frutinhas_porcento ?? 0, numericPair: numericPairFrom(a1.frutinhas_porcento, a2.frutinhas_porcento) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.farmPercent"), icon: "aomr_farm_icon", left: a1.fazenda_porcento ?? 0, right: a2.fazenda_porcento ?? 0, numericPair: numericPairFrom(a1.fazenda_porcento, a2.fazenda_porcento) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.treePercent"), icon: "aomr_tree_oak_icon", left: a1.arvore_porcento ?? 0, right: a2.arvore_porcento ?? 0, numericPair: numericPairFrom(a1.arvore_porcento, a2.arvore_porcento) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.minePercent"), icon: "aomr_gold_mine_icon", left: a1.mina_porcento ?? 0, right: a2.mina_porcento ?? 0, numericPair: numericPairFrom(a1.mina_porcento, a2.mina_porcento) }), _jsx(CompareInfoRow, { label: t("spreadsheet.aldeoes.buildSpeedPercent"), icon: "aomr_type_building_icon", left: a1.velocidade_construcao_porcento ?? 0, right: a2.velocidade_construcao_porcento ?? 0, numericPair: numericPairFrom(a1.velocidade_construcao_porcento, a2.velocidade_construcao_porcento) })] }));
}
