import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { SpreadsheetExpandableStack } from "@/components/spreadsheet/SpreadsheetExpandableStack";
import { SpreadsheetBody, SpreadsheetHead, SpreadsheetTable, SpreadsheetTd, SpreadsheetTh, SpreadsheetTr, } from "@/components/spreadsheet/SpreadsheetTable";
import { SpreadsheetRefChip } from "@/components/spreadsheet/SpreadsheetRefChip";
import { NotionText } from "@/components/ui/NotionText";
import { useTranslation } from "@/hooks/useTranslation";
import { godpowerSlugById } from "@/data/catalog";
import { firstNumId } from "@/lib/entityRefs";
import { useEntityResolver } from "@/hooks/useEntityResolver";
import { cn } from "@/lib/cn";
function cellNum(n) {
    return n != null && !Number.isNaN(n) ? String(n) : "—";
}
function cellStr(s) {
    if (s == null)
        return "—";
    const text = typeof s === "string" ? s.trim() : String(s);
    return text ? text : "—";
}
function hasText(s) {
    return Boolean(s?.trim());
}
export function GodpowersSpreadsheet({ rows, linkState, onPreview, compareMode = false, selectedSlugs = [], onToggleSelect, }) {
    const { resolveDeusLink, resolveEntityNumRef, resolveGodpowerLink } = useEntityResolver();
    const { t } = useTranslation();
    const showPreview = (link) => {
        onPreview?.(link);
    };
    return (_jsxs(SpreadsheetTable, { tableClassName: "min-w-[1280px]", children: [_jsxs(SpreadsheetHead, { children: [_jsx(SpreadsheetTh, { className: "min-w-[8rem]", stickyColumn: true, children: t("common.godPower") }), _jsx(SpreadsheetTh, { children: t("spreadsheet.english") }), _jsx(SpreadsheetTh, { children: t("nav.gods") }), _jsx(SpreadsheetTh, { children: t("common.era") }), _jsx(SpreadsheetTh, { children: t("spreadsheet.godpowers.cooldown") }), _jsx(SpreadsheetTh, { children: t("spreadsheet.godpowers.mapDuration") }), _jsx(SpreadsheetTh, { children: t("spreadsheet.godpowers.repeatCost") }), _jsx(SpreadsheetTh, { children: t("spreadsheet.godpowers.incrementPerUse") }), _jsx(SpreadsheetTh, { className: "min-w-[12rem]", children: t("spreadsheet.godpowers.summaryDescription") }), _jsx(SpreadsheetTh, { className: "min-w-[12rem]", children: t("common.advancedDescription") }), _jsx(SpreadsheetTh, { className: "min-w-[7.5rem]", children: t("common.pantheon") })] }), _jsx(SpreadsheetBody, { children: rows.map((g) => {
                    const slug = godpowerSlugById.get(g.id) ?? String(g.id);
                    const gpLink = resolveGodpowerLink(g.id, g.nome);
                    const godId = firstNumId(g.god);
                    const eraId = firstNumId(g.era);
                    const panteaoId = firstNumId(g.panteao);
                    const selected = selectedSlugs.includes(slug);
                    const selectDisabled = compareMode && selectedSlugs.length >= 2 && !selected;
                    const advContent = hasText(g.descricao_avancada)
                        ? [
                            _jsx("span", { className: "text-sm leading-snug text-zinc-300", children: g.descricao_avancada }, "adv"),
                        ]
                        : [];
                    return (_jsxs(SpreadsheetTr, { selected: compareMode && selected, className: cn(compareMode && "cursor-pointer", compareMode && selected && "bg-amber-500/10 ring-1 ring-inset ring-amber-500/40", compareMode && selectDisabled && "cursor-not-allowed opacity-45"), onClick: compareMode && (selected || !selectDisabled) ? () => onToggleSelect?.(slug) : undefined, children: [_jsx(SpreadsheetTd, { stickyColumn: true, children: compareMode ? (_jsxs("span", { className: "inline-flex max-w-full items-center gap-2 font-medium text-zinc-100", children: [_jsx("span", { className: cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", selected
                                                ? "border-amber-500 bg-amber-500/30"
                                                : "border-zinc-600 bg-zinc-900/80"), "aria-hidden": true, children: selected ? _jsx("span", { className: "text-[10px] text-amber-100", children: "\u2713" }) : null }), gpLink?.imageSrc ? (_jsx("img", { src: gpLink.imageSrc, alt: "", className: "h-6 w-6 shrink-0 rounded object-contain" })) : null, _jsx("span", { children: g.nome })] })) : gpLink ? (_jsxs(Link, { to: gpLink.to, state: linkState, onMouseEnter: () => showPreview(gpLink), onFocus: () => showPreview(gpLink), className: "inline-flex max-w-full items-center gap-2 rounded-md px-1 py-0.5 font-medium text-zinc-100 hover:bg-amber-500/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/40", children: [gpLink.imageSrc ? (_jsx("img", { src: gpLink.imageSrc, alt: "", className: "h-6 w-6 shrink-0 rounded object-contain" })) : null, _jsx("span", { children: g.nome })] })) : (g.nome) }), _jsx(SpreadsheetTd, { className: "text-zinc-400", children: cellStr(g.ingles) }), _jsx(SpreadsheetTd, { onClick: compareMode ? (e) => e.stopPropagation() : undefined, children: godId != null ? ((() => {
                                    const link = resolveDeusLink(godId, g.god?.[0]?.nome);
                                    return link && !compareMode ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview })) : (_jsx(NotionText, { text: g.god?.[0]?.nome ?? "—" }));
                                })()) : ("—") }), _jsx(SpreadsheetTd, { onClick: compareMode ? (e) => e.stopPropagation() : undefined, children: eraId != null ? ((() => {
                                    const link = resolveEntityNumRef("era", { id: eraId, nome: g.era?.[0]?.nome ?? "" });
                                    return link && !compareMode ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview })) : (_jsx(NotionText, { text: g.era?.[0]?.nome ?? "—" }));
                                })()) : ("—") }), _jsx(SpreadsheetTd, { className: "tabular-nums", children: cellNum(g.cooldown_seg) }), _jsx(SpreadsheetTd, { className: "tabular-nums", children: cellNum(g.duracao_no_mapa_seg) }), _jsx(SpreadsheetTd, { className: "tabular-nums", children: cellNum(g.custo_repetir) }), _jsx(SpreadsheetTd, { children: cellStr(g.incremento_por_uso) }), _jsx(SpreadsheetTd, { children: hasText(g.descricao_resumida) ? (_jsx("p", { className: "max-w-md text-sm leading-snug text-zinc-300", children: g.descricao_resumida })) : ("—") }), _jsx(SpreadsheetTd, { children: advContent.length > 0 ? _jsx(SpreadsheetExpandableStack, { items: advContent }) : "—" }), _jsx(SpreadsheetTd, { onClick: compareMode ? (e) => e.stopPropagation() : undefined, children: panteaoId != null ? ((() => {
                                    const link = resolveEntityNumRef("panteao", {
                                        id: panteaoId,
                                        nome: g.panteao?.[0]?.nome ?? "",
                                    });
                                    return link && !compareMode ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview })) : (_jsx(NotionText, { text: g.panteao?.[0]?.nome ?? "—" }));
                                })()) : ("—") })] }, g.id));
                }) })] }));
}
