import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { SpreadsheetExpandableStack } from "@/components/spreadsheet/SpreadsheetExpandableStack";
import { SpreadsheetRefChip } from "@/components/spreadsheet/SpreadsheetRefChip";
import { SpreadsheetStatCell } from "@/components/spreadsheet/SpreadsheetStatCell";
import { SpreadsheetBody, SpreadsheetHead, SpreadsheetTable, SpreadsheetTd, SpreadsheetTh, SpreadsheetTr, } from "@/components/spreadsheet/SpreadsheetTable";
import { TecnologiaTipoBadges } from "@/components/tecnologia/TecnologiaTipoBadges";
import { NotionText } from "@/components/ui/NotionText";
import { useTranslation } from "@/hooks/useTranslation";
import { firstNumId, joinRefNomesOrString } from "@/lib/entityRefs";
import { useEntityResolver } from "@/hooks/useEntityResolver";
function cellStr(s) {
    if (s == null)
        return "—";
    const text = s.trim();
    return text ? text : "—";
}
function hasText(s) {
    return Boolean(s?.trim());
}
function refList(v) {
    return Array.isArray(v) && v.length > 0;
}
export function TecnologiasSpreadsheet({ rows, linkState, onPreview }) {
    const { t: tr } = useTranslation();
    const { resolveConstrucaoLink, resolveDeusLink, resolveEntityNumRef, resolveTecnologiaLinkByIndex } = useEntityResolver();
    const showPreview = (link) => {
        onPreview?.(link);
    };
    return (_jsxs(SpreadsheetTable, { tableClassName: "min-w-[1500px]", children: [_jsxs(SpreadsheetHead, { children: [_jsx(SpreadsheetTh, { className: "min-w-[9rem]", stickyColumn: true, children: tr("spreadsheet.tecnologias.up") }), _jsx(SpreadsheetTh, { className: "min-w-[8rem]", children: tr("common.benefits") }), _jsx(SpreadsheetTh, { className: "min-w-[7rem]", children: tr("common.type") }), _jsx(SpreadsheetTh, { className: "min-w-[7rem]", children: tr("common.specificGod") }), _jsx(SpreadsheetTh, { className: "min-w-[9rem]", children: tr("common.originBuilding") }), _jsx(SpreadsheetTh, { children: tr("common.era") }), _jsx(SpreadsheetTh, { children: tr("spreadsheet.english") }), _jsx(SpreadsheetTh, { children: tr("spreadsheet.pantheons") }), _jsx(SpreadsheetTh, { icon: "foodaom", children: tr("spreadsheet.food") }), _jsx(SpreadsheetTh, { icon: "woodaom", children: tr("spreadsheet.wood") }), _jsx(SpreadsheetTh, { icon: "goldaom", children: tr("spreadsheet.gold") }), _jsx(SpreadsheetTh, { icon: "favoraom", children: tr("spreadsheet.favor") }), _jsx(SpreadsheetTh, { icon: "aomr_time_icon", children: tr("spreadsheet.timeSeconds") })] }), _jsx(SpreadsheetBody, { children: rows.map(({ t, index }) => {
                    const tecLink = resolveTecnologiaLinkByIndex(index, t.nome);
                    const panteaoId = refList(t.panteoes) ? firstNumId(t.panteoes) : undefined;
                    const construcaoItems = refList(t.construcao_origem)
                        ? t.construcao_origem.map((ref, i) => {
                            const link = resolveConstrucaoLink(ref.id, ref.nome);
                            return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview }, `${ref.id}-${i}`)) : (_jsx("span", { className: "text-sm text-zinc-400", children: _jsx(NotionText, { text: ref.nome }) }, `${ref.id}-${i}`));
                        })
                        : [];
                    const eraItems = (t.eras ?? []).map((ref, i) => {
                        const link = resolveEntityNumRef("era", ref);
                        return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview }, `${ref.id}-${i}`)) : (_jsx("span", { className: "text-sm text-zinc-400", children: _jsx(NotionText, { text: ref.nome }) }, `${ref.id}-${i}`));
                    });
                    const godItems = refList(t.god_especifico)
                        ? t.god_especifico.map((ref, i) => {
                            const link = resolveDeusLink(ref.id, ref.nome);
                            return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview }, `${ref.id}-${i}`)) : (_jsx("span", { className: "text-sm text-zinc-400", children: _jsx(NotionText, { text: ref.nome }) }, `${ref.id}-${i}`));
                        })
                        : [];
                    return (_jsxs(SpreadsheetTr, { children: [_jsx(SpreadsheetTd, { stickyColumn: true, children: tecLink ? (_jsxs(Link, { to: tecLink.to, state: linkState, onMouseEnter: () => showPreview(tecLink), onFocus: () => showPreview(tecLink), className: "inline-flex max-w-full items-center gap-2 rounded-md px-1 py-0.5 font-medium text-zinc-100 hover:bg-amber-500/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/40", children: [tecLink.imageSrc ? (_jsx("img", { src: tecLink.imageSrc, alt: "", className: "h-6 w-6 shrink-0 rounded object-contain" })) : null, _jsx("span", { children: t.nome || tr("spreadsheet.noTitle", { index }) })] })) : (t.nome || tr("spreadsheet.noTitle", { index })) }), _jsx(SpreadsheetTd, { children: hasText(t.beneficia) ? (_jsx("span", { className: "text-sm text-zinc-300", children: _jsx(NotionText, { text: t.beneficia }) })) : ("—") }), _jsx(SpreadsheetTd, { children: hasText(t.tipo) ? (_jsx(TecnologiaTipoBadges, { tipo: t.tipo })) : ("—") }), _jsx(SpreadsheetTd, { children: godItems.length > 0 ? (_jsx(SpreadsheetExpandableStack, { items: godItems })) : hasText(typeof t.god_especifico === "string" ? t.god_especifico : undefined) ? (_jsx(NotionText, { text: t.god_especifico })) : ("—") }), _jsx(SpreadsheetTd, { children: construcaoItems.length > 0 ? (_jsx(SpreadsheetExpandableStack, { items: construcaoItems })) : typeof t.construcao_origem === "string" && hasText(t.construcao_origem) ? (_jsx(NotionText, { text: t.construcao_origem })) : ("—") }), _jsx(SpreadsheetTd, { children: eraItems.length > 0 ? _jsx(SpreadsheetExpandableStack, { items: eraItems }) : "—" }), _jsx(SpreadsheetTd, { className: "text-zinc-400", children: cellStr(t.ingles) }), _jsx(SpreadsheetTd, { children: panteaoId != null ? ((() => {
                                    const link = resolveEntityNumRef("panteao", {
                                        id: panteaoId,
                                        nome: t.panteoes[0]?.nome ?? "",
                                    });
                                    return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview })) : (_jsx(NotionText, { text: joinRefNomesOrString(t.panteoes) }));
                                })()) : typeof t.panteoes === "string" && hasText(t.panteoes) ? (_jsx(NotionText, { text: t.panteoes })) : ("—") }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "comida", value: t.comida }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "madeira", value: t.madeira }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "ouro", value: t.ouro }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "favor", value: t.favor }) }), _jsx(SpreadsheetTd, { children: _jsx(SpreadsheetStatCell, { field: "tempo_s", value: t.tempo_s }) })] }, `${index}-${t.nome}`));
                }) })] }));
}
