import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { NotionText } from "@/components/ui/NotionText";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { firstNome, firstNumId } from "@/lib/entityRefs";
import { localeSectionPath } from "@/lib/localeRoutes";
import { parseGameNumber } from "@/lib/numericCompare";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";
export function AldeaoGeralBody({ a, linkState }) {
    const { locale, panteaoById, panteaoSlugById } = useCatalog();
    const { t } = useTranslation();
    const panteaoId = firstNumId(a.panteao);
    const panteao = panteaoId != null ? panteaoById.get(panteaoId) : undefined;
    return (_jsxs("div", { className: "space-y-0", children: [panteao ? (_jsx(InfoRow, { label: t("common.pantheon"), children: _jsx(InfoRowPortraitOrText, { portraits: _jsx(PortraitHeaderActions, { items: [
                            {
                                key: String(panteao.id),
                                to: localeSectionPath(locale, "panteoes", panteaoSlugById.get(panteao.id) ?? panteao.id),
                                nome: panteao.nome,
                                src: getPantheonWatermarkUrl(panteao),
                            },
                        ], linkState: linkState ?? {}, size: "sm", justify: "start" }), textFallback: null }) })) : firstNome(a.panteao) ? (_jsx(InfoRow, { label: t("common.pantheon"), children: _jsx(InfoRowPortraitOrText, { portraits: null, textFallback: _jsx(NotionText, { text: firstNome(a.panteao) }) }) })) : null, _jsx(InfoRow, { label: t("spreadsheet.unidades.hitPoints"), icon: "aomr_hit_points_icon", children: a.vida ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.unidades.population"), icon: "aomr_population_provision_icon", children: a.populacao ?? "—" }), _jsx(InfoRow, { label: t("spreadsheet.aldeoes.resourceCost"), icon: "aomr_type_villager_icon", children: a.recursos ?? "—" }), a.carne != null && (_jsx(InfoRow, { label: t("spreadsheet.aldeoes.resourceCostFood"), icon: "foodaom", children: a.carne })), a.madeira != null && (_jsx(InfoRow, { label: t("spreadsheet.aldeoes.resourceCostWood"), icon: "woodaom", children: a.madeira })), a.ouro != null && (_jsx(InfoRow, { label: t("spreadsheet.aldeoes.resourceCostGold"), icon: "aomr_gold_icon", children: a.ouro })), _jsx(InfoRow, { label: t("spreadsheet.aldeoes.trainTime"), icon: "aomr_time_icon", children: a.tempo_de_treinamento ?? "—" })] }));
}
function coletaRow(label, icon, value) {
    return (_jsx(InfoRow, { label: label, icon: icon, children: value }));
}
function AldeaoBonusBar({ value, locale }) {
    const parsed = parseGameNumber(value) ?? 0;
    const magnitude = Math.min(Math.abs(parsed) / 100, 1) * 50;
    const positive = parsed > 0;
    const negative = parsed < 0;
    const formatted = parsed.toLocaleString(locale === "pt" ? "pt-BR" : "en-US", {
        maximumFractionDigits: 2,
    });
    return (_jsxs("div", { className: "flex min-w-[11rem] items-center justify-end gap-3", children: [_jsxs("span", { className: [
                    "w-16 shrink-0 text-right text-sm font-semibold tabular-nums",
                    positive ? "text-emerald-400" : negative ? "text-red-400" : "text-zinc-400",
                ].join(" "), children: [positive ? "+" : "", formatted, "%"] }), _jsxs("div", { className: "relative h-2.5 w-32 overflow-hidden rounded-full bg-zinc-800/90 ring-1 ring-inset ring-zinc-700/60", title: `${positive ? "+" : ""}${formatted}%`, children: [_jsx("span", { className: "absolute inset-y-0 left-1/2 w-px bg-zinc-500/70", "aria-hidden": true }), positive ? (_jsx("span", { className: "absolute inset-y-0 left-1/2 rounded-r-full bg-emerald-500 transition-[width]", style: { width: `${magnitude}%` }, "aria-hidden": true })) : null, negative ? (_jsx("span", { className: "absolute inset-y-0 right-1/2 rounded-l-full bg-red-500 transition-[width]", style: { width: `${magnitude}%` }, "aria-hidden": true })) : null] })] }));
}
export function AldeaoColetaBody({ a }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "space-y-0", children: [coletaRow(t("spreadsheet.aldeoes.hunt"), "aomr_caribou_icon", a.cacar ?? "—"), coletaRow(t("spreadsheet.aldeoes.livestock"), "aomr_cow_icon", a.gado_galinhas ?? "—"), coletaRow(t("spreadsheet.aldeoes.berries"), "aomr_berry_bush_icon", a.frutinhas ?? "—"), coletaRow(t("spreadsheet.aldeoes.farm"), "aomr_farm_icon", a.fazenda ?? "—"), coletaRow(t("spreadsheet.aldeoes.tree"), "aomr_tree_oak_icon", a.arvore ?? "—"), coletaRow(t("spreadsheet.aldeoes.mine"), "aomr_gold_mine_icon", a.mina ?? "—"), coletaRow(t("spreadsheet.aldeoes.buildSpeed"), "aomr_type_building_icon", a.velocidade_construcao ?? "—")] }));
}
export function AldeaoBonusBody({ a }) {
    const { t, locale } = useTranslation();
    return (_jsxs("div", { className: "space-y-0", children: [_jsx(InfoRow, { label: t("spreadsheet.aldeoes.huntPercent"), icon: "aomr_caribou_icon", children: _jsx(AldeaoBonusBar, { value: a.cacar_porcento, locale: locale }) }), _jsx(InfoRow, { label: t("spreadsheet.aldeoes.livestockPercent"), icon: "aomr_cow_icon", children: _jsx(AldeaoBonusBar, { value: a.gado_porcento, locale: locale }) }), _jsx(InfoRow, { label: t("spreadsheet.aldeoes.berriesPercent"), icon: "aomr_berry_bush_icon", children: _jsx(AldeaoBonusBar, { value: a.frutinhas_porcento, locale: locale }) }), _jsx(InfoRow, { label: t("spreadsheet.aldeoes.farmPercent"), icon: "aomr_farm_icon", children: _jsx(AldeaoBonusBar, { value: a.fazenda_porcento, locale: locale }) }), _jsx(InfoRow, { label: t("spreadsheet.aldeoes.treePercent"), icon: "aomr_tree_oak_icon", children: _jsx(AldeaoBonusBar, { value: a.arvore_porcento, locale: locale }) }), _jsx(InfoRow, { label: t("spreadsheet.aldeoes.minePercent"), icon: "aomr_gold_mine_icon", children: _jsx(AldeaoBonusBar, { value: a.mina_porcento, locale: locale }) }), _jsx(InfoRow, { label: t("spreadsheet.aldeoes.buildSpeedPercent"), icon: "aomr_type_building_icon", children: _jsx(AldeaoBonusBar, { value: a.velocidade_construcao_porcento, locale: locale }) })] }));
}
