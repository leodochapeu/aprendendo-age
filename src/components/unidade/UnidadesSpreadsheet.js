import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { SpreadsheetExpandableStack } from "@/components/spreadsheet/SpreadsheetExpandableStack";
import { SpreadsheetStatCell } from "@/components/spreadsheet/SpreadsheetStatCell";
import { SpreadsheetRefChip } from "@/components/spreadsheet/SpreadsheetRefChip";
import { SpreadsheetBody, SpreadsheetHead, SpreadsheetTable, SpreadsheetTd, SpreadsheetTh, SpreadsheetTr, } from "@/components/spreadsheet/SpreadsheetTable";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { NotionCounterIconsRow } from "@/components/ui/NotionTokensOnly";
import { NotionText } from "@/components/ui/NotionText";
import { useTranslation } from "@/hooks/useTranslation";
import { unidadeSlugById } from "@/data/catalog";
import { firstNumId } from "@/lib/entityRefs";
import { useEntityResolver } from "@/hooks/useEntityResolver";
import { hasMultiplicadorContent, multiplicadorItemsToNotionText, } from "@/lib/unidadeMultiplicador";
import { hasTipoContent } from "@/lib/unidadeTipo";
import { cn } from "@/lib/cn";
function cellStr(s) {
    if (s == null)
        return "—";
    const text = s.trim();
    return text ? text : "—";
}
function hasText(s) {
    return Boolean(s?.trim());
}
export function UnidadesSpreadsheet({ rows, linkState, onPreview, compareMode = false, selectedSlugs = [], onToggleSelect, }) {
    const { resolveConstrucaoLink, resolveEntityNumRef, resolveUnidadeLink } = useEntityResolver();
    const { t } = useTranslation();
    const showPreview = (link) => {
        onPreview?.(link);
    };
    return (_jsxs(SpreadsheetTable, { tableClassName: "min-w-[2600px]", children: [_jsxs(SpreadsheetHead, { children: [_jsx(SpreadsheetTh, { className: "min-w-[8.5rem]", stickyColumn: true, children: t("spreadsheet.unidades.soldier") }), _jsx(SpreadsheetTh, { children: t("spreadsheet.english") }), _jsx(SpreadsheetTh, { className: "min-w-[7rem]", children: t("common.type") }), _jsx(SpreadsheetTh, { className: "min-w-[8rem]", icon: "aomr_better_icon", children: t("spreadsheet.unidades.strongAgainst") }), _jsx(SpreadsheetTh, { className: "min-w-[8rem]", icon: "aomr_worse_icon", children: t("spreadsheet.unidades.weakAgainst") }), _jsx(SpreadsheetTh, { children: t("common.pantheon") }), _jsx(SpreadsheetTh, { children: t("common.era") }), _jsx(SpreadsheetTh, { className: "min-w-[7rem]", children: t("spreadsheet.unidades.counterOf") }), _jsx(SpreadsheetTh, { className: "min-w-[7rem]", children: t("spreadsheet.unidades.multiplier") }), _jsx(SpreadsheetTh, { icon: "aomr_type_building_icon", className: "min-w-[8rem]", children: t("spreadsheet.unidades.building") }), _jsx(SpreadsheetTh, { className: "min-w-[6.5rem]", icon: "aomr_hit_points_icon", children: t("spreadsheet.unidades.hitPoints") }), _jsx(SpreadsheetTh, { icon: "hackdamage", children: t("spreadsheet.unidades.hackDamage") }), _jsx(SpreadsheetTh, { icon: "piercedamage", children: t("spreadsheet.unidades.pierceDamage") }), _jsx(SpreadsheetTh, { icon: "rangeicon", children: t("spreadsheet.unidades.range") }), _jsx(SpreadsheetTh, { icon: "crushdamage", children: t("spreadsheet.unidades.crushDamage") }), _jsx(SpreadsheetTh, { icon: "aomr_divine_damage_icon", children: t("spreadsheet.unidades.divineDamage") }), _jsx(SpreadsheetTh, { icon: "attack_cur", children: t("spreadsheet.unidades.areaDamage") }), _jsx(SpreadsheetTh, { icon: "aomr_rate_of_fire_icon", children: t("spreadsheet.unidades.attackSpeed") }), _jsx(SpreadsheetTh, { icon: "attack_cur", children: t("spreadsheet.unidades.dps") }), _jsx(SpreadsheetTh, { icon: "hackarmor", children: t("spreadsheet.unidades.hackArmor") }), _jsx(SpreadsheetTh, { icon: "piercearmor", children: t("spreadsheet.unidades.pierceArmor") }), _jsx(SpreadsheetTh, { icon: "foodaom", children: t("spreadsheet.food") }), _jsx(SpreadsheetTh, { icon: "woodaom", children: t("spreadsheet.wood") }), _jsx(SpreadsheetTh, { icon: "goldaom", children: t("spreadsheet.gold") }), _jsx(SpreadsheetTh, { icon: "favoraom", children: t("spreadsheet.favor") }), _jsx(SpreadsheetTh, { icon: "aomr_population_provision_icon", children: t("spreadsheet.unidades.population") }), _jsx(SpreadsheetTh, { icon: "aomr_time_icon", children: t("spreadsheet.unidades.trainTime") }), _jsx(SpreadsheetTh, { icon: "aomr_speed_icon", children: t("spreadsheet.unidades.moveSpeed") }), _jsx(SpreadsheetTh, { icon: "attack_cur", children: t("spreadsheet.unidades.attributeStrength") })] }), _jsx(SpreadsheetBody, { children: rows.map((u) => {
                    const slug = unidadeSlugById.get(u.id) ?? String(u.id);
                    const unitLink = resolveUnidadeLink(u.id, u.nome);
                    const panteaoId = firstNumId(u.panteao);
                    const eraId = firstNumId(u.era);
                    const selected = selectedSlugs.includes(slug);
                    const selectDisabled = compareMode && selectedSlugs.length >= 2 && !selected;
                    const construcaoItems = (u.construcao ?? []).map((ref, i) => {
                        const link = resolveConstrucaoLink(ref.id, ref.nome);
                        return link && !compareMode ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview }, `${ref.id}-${i}`)) : (_jsx("span", { className: "text-sm text-zinc-400", children: _jsx(NotionText, { text: ref.nome }) }, `${ref.id}-${i}`));
                    });
                    return (_jsxs(SpreadsheetTr, { selected: compareMode && selected, className: cn(compareMode && "cursor-pointer", compareMode && selected && "bg-amber-500/10 ring-1 ring-inset ring-amber-500/40", compareMode && selectDisabled && "cursor-not-allowed opacity-45"), onClick: compareMode && (selected || !selectDisabled) ? () => onToggleSelect?.(slug) : undefined, children: [_jsx(SpreadsheetTd, { stickyColumn: true, children: compareMode ? (_jsxs("span", { className: "inline-flex max-w-full items-center gap-2 font-medium text-zinc-100", children: [_jsx("span", { className: cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", selected
                                                ? "border-amber-500 bg-amber-500/30"
                                                : "border-zinc-600 bg-zinc-900/80"), "aria-hidden": true, children: selected ? _jsx("span", { className: "text-[10px] text-amber-100", children: "\u2713" }) : null }), unitLink?.imageSrc ? (_jsx("img", { src: unitLink.imageSrc, alt: "", className: "h-6 w-6 shrink-0 rounded object-contain" })) : null, _jsx("span", { children: u.nome })] })) : unitLink ? (_jsxs(Link, { to: unitLink.to, state: linkState, onMouseEnter: () => showPreview(unitLink), onFocus: () => showPreview(unitLink), className: "inline-flex max-w-full items-center gap-2 rounded-md px-1 py-0.5 font-medium text-zinc-100 hover:bg-amber-500/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/40", children: [unitLink.imageSrc ? (_jsx("img", { src: unitLink.imageSrc, alt: "", className: "h-6 w-6 shrink-0 rounded object-contain" })) : null, _jsx("span", { children: u.nome })] })) : (u.nome) }), _jsx(SpreadsheetTd, { className: "text-zinc-400", children: cellStr(u.ingles) }), _jsx(SpreadsheetTd, { children: hasTipoContent(u.tipo) ? _jsx(UnidadeTipoLine, { tipo: u.tipo, colored: true, shell: "auto" }) : "—" }), _jsx(SpreadsheetTd, { children: hasText(u.forte_contra) ? (_jsx(NotionCounterIconsRow, { text: u.forte_contra })) : ("—") }), _jsx(SpreadsheetTd, { children: hasText(u.fraco_contra) ? (_jsx(NotionCounterIconsRow, { text: u.fraco_contra })) : ("—") }), _jsx(SpreadsheetTd, { onClick: compareMode ? (e) => e.stopPropagation() : undefined, children: panteaoId != null ? ((() => {
                                    const link = resolveEntityNumRef("panteao", {
                                        id: panteaoId,
                                        nome: u.panteao?.[0]?.nome ?? "",
                                    });
                                    return link && !compareMode ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview })) : (_jsx(NotionText, { text: u.panteao?.[0]?.nome ?? "—" }));
                                })()) : ("—") }), _jsx(SpreadsheetTd, { onClick: compareMode ? (e) => e.stopPropagation() : undefined, children: eraId != null ? ((() => {
                                    const link = resolveEntityNumRef("era", {
                                        id: eraId,
                                        nome: u.era?.[0]?.nome ?? "",
                                    });
                                    return link && !compareMode ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview })) : (_jsx(NotionText, { text: u.era?.[0]?.nome ?? "—" }));
                                })()) : ("—") }), _jsx(SpreadsheetTd, { children: hasText(u.counter_de) ? _jsx(NotionText, { text: u.counter_de }) : "—" }), _jsx(SpreadsheetTd, { children: hasMultiplicadorContent(u.multiplicador) ? (_jsx(NotionText, { text: multiplicadorItemsToNotionText(u.multiplicador) })) : ("—") }), _jsx(SpreadsheetTd, { onClick: compareMode ? (e) => e.stopPropagation() : undefined, children: construcaoItems.length > 0 ? (_jsx(SpreadsheetExpandableStack, { items: construcaoItems })) : ("—") }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "pontos_de_vida", value: u.pontos_de_vida }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "dano_cortante", value: u.dano_cortante }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "dano_perfurante", value: u.dano_perfurante }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "alcance", value: u.alcance }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "dano_contundente", value: u.dano_contundente }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "dano_divino", value: u.dano_divino }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "dano_area", value: u.dano_area }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "velocidade_de_ataque_atk_s", value: u.velocidade_de_ataque_atk_s }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "dps", value: u.dps }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "armadura_anticorte", value: u.armadura_anticorte }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "armadura_antiperfurante", value: u.armadura_antiperfurante }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "comida", value: u.comida }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "madeira", value: u.madeira }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "ouro", value: u.ouro }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "favor", value: u.favor }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "populacao", value: u.populacao }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "tempo_treinamento", value: u.tempo_treinamento }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "velocidade_movimento", value: u.velocidade_movimento }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "forca_atributos", value: u.forca_atributos }) })] }, u.id));
                }) })] }));
}
