import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { SpreadsheetBody, SpreadsheetCellStack, SpreadsheetHead, SpreadsheetTable, SpreadsheetTd, SpreadsheetTh, SpreadsheetTr, } from "@/components/spreadsheet/SpreadsheetTable";
import { SpreadsheetExpandableStack } from "@/components/spreadsheet/SpreadsheetExpandableStack";
import { SpreadsheetRefChip } from "@/components/spreadsheet/SpreadsheetRefChip";
import { AppTag } from "@/components/ui/AppTag";
import { NotionText } from "@/components/ui/NotionText";
import { firstNumId } from "@/lib/entityRefs";
import { useEntityResolver } from "@/hooks/useEntityResolver";
import { cn } from "@/lib/cn";
function hierarquiaTagClass(h) {
    if (h?.toLowerCase() === "maior") {
        return "border-red-900/60 bg-red-950/70 text-red-100/90 normal-case";
    }
    return "border-zinc-700/60 bg-zinc-800/80 text-zinc-300 normal-case";
}
export function DeusesSpreadsheet({ rows, linkState, onPreview }) {
    const { resolveDeusLink, resolveEntityNumRef, resolveGodpowerLink, resolveTecnologiaLink } = useEntityResolver();
    const showPreview = (link) => {
        onPreview?.(link);
    };
    return (_jsxs(SpreadsheetTable, { children: [_jsxs(SpreadsheetHead, { children: [_jsx(SpreadsheetTh, { stickyColumn: true, children: "Deus" }), _jsx(SpreadsheetTh, { children: "Foco" }), _jsx(SpreadsheetTh, { children: "Pante\u00E3o" }), _jsx(SpreadsheetTh, { children: "Era" }), _jsx(SpreadsheetTh, { children: "GodPower" }), _jsx(SpreadsheetTh, { className: "min-w-[9rem]", children: "Unidades exclusivas" }), _jsx(SpreadsheetTh, { className: "min-w-[9rem]", children: "God maior rela\u00E7\u00E3o" }), _jsx(SpreadsheetTh, { className: "min-w-[9rem]", children: "Tecnologias" }), _jsx(SpreadsheetTh, { children: "Hierarquia" })] }), _jsx(SpreadsheetBody, { children: rows.map((d) => {
                    const deusLink = resolveDeusLink(d.id, d.nome);
                    const panteaoId = firstNumId(d.panteao);
                    const eraId = firstNumId(d.era);
                    const gpId = firstNumId(d.godpower);
                    const tecnologiaItems = (d.tecnologias ?? []).map((ref, i) => {
                        const link = resolveTecnologiaLink(ref);
                        return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview }, `${ref.id}-${i}`)) : (_jsx("span", { className: "text-sm text-zinc-400", children: _jsx(NotionText, { text: ref.nome }) }, `${ref.id}-${i}`));
                    });
                    return (_jsxs(SpreadsheetTr, { children: [_jsx(SpreadsheetTd, { stickyColumn: true, children: deusLink ? (_jsxs(Link, { to: deusLink.to, state: linkState, onMouseEnter: () => showPreview(deusLink), onFocus: () => showPreview(deusLink), className: "inline-flex max-w-full items-center gap-2 rounded-md px-1 py-0.5 font-medium text-zinc-100 hover:bg-amber-500/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/40", children: [deusLink.imageSrc ? (_jsx("img", { src: deusLink.imageSrc, alt: "", className: "h-6 w-6 shrink-0 rounded object-contain" })) : null, _jsx("span", { children: d.nome })] })) : (d.nome) }), _jsx(SpreadsheetTd, { children: d.foco ? _jsx(NotionText, { text: d.foco, className: "text-sm" }) : "—" }), _jsx(SpreadsheetTd, { children: panteaoId != null ? ((() => {
                                    const link = resolveEntityNumRef("panteao", { id: panteaoId, nome: d.panteao?.[0]?.nome ?? "" });
                                    return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview })) : (d.panteao?.[0]?.nome ?? "—");
                                })()) : ("—") }), _jsx(SpreadsheetTd, { children: eraId != null ? ((() => {
                                    const link = resolveEntityNumRef("era", { id: eraId, nome: d.era?.[0]?.nome ?? "" });
                                    return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview })) : (_jsx(NotionText, { text: d.era?.[0]?.nome ?? "—" }));
                                })()) : ("—") }), _jsx(SpreadsheetTd, { children: gpId != null ? ((() => {
                                    const link = resolveGodpowerLink(gpId, d.godpower?.[0]?.nome);
                                    return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview })) : (d.godpower?.[0]?.nome ?? "—");
                                })()) : ("—") }), _jsx(SpreadsheetTd, { children: (d.unidades_exclusivas ?? []).length > 0 ? (_jsx(SpreadsheetCellStack, { children: d.unidades_exclusivas.map((ref) => {
                                        const link = resolveEntityNumRef("unidade", ref);
                                        return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview }, ref.id)) : (_jsx("span", { className: "text-sm text-zinc-400", children: _jsx(NotionText, { text: ref.nome }) }, ref.id));
                                    }) })) : ("—") }), _jsx(SpreadsheetTd, { children: (d.god_maior_relacao ?? []).length > 0 ? (_jsx(SpreadsheetCellStack, { children: d.god_maior_relacao.map((ref) => {
                                        const link = resolveDeusLink(ref.id, ref.nome);
                                        return link ? (_jsx(SpreadsheetRefChip, { link: link, linkState: linkState, onPreview: showPreview }, ref.id)) : (_jsx("span", { className: "text-sm text-zinc-400", children: ref.nome }, ref.id));
                                    }) })) : ("—") }), _jsx(SpreadsheetTd, { children: tecnologiaItems.length > 0 ? (_jsx(SpreadsheetExpandableStack, { items: tecnologiaItems })) : ("—") }), _jsx(SpreadsheetTd, { children: d.hierarquia ? (_jsx(AppTag, { variant: "rich", className: cn("text-xs", hierarquiaTagClass(d.hierarquia)), children: d.hierarquia })) : ("—") })] }, d.id));
                }) })] }));
}
