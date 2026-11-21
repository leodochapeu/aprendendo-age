import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { StartMiniMarkup } from "@/lib/startMiniMarkup";
import { cn } from "@/lib/cn";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { getTokenLabel } from "@/lib/notionTokenLabels";
function ResourceColumnHeader({ label, token, labelClassName, }) {
    const src = getTokenAssetUrl(token);
    return (_jsxs("span", { className: "inline-flex items-center justify-center gap-0 sm:gap-1", children: [_jsx("span", { className: cn(labelClassName, src && "sr-only sm:not-sr-only"), children: label }), src ? (_jsx("img", { src: src, alt: "", title: getTokenLabel(token), className: "notion-token-inline mx-0 inline-block h-[1em] max-h-[1.1em] w-auto shrink-0 align-[-0.12em] object-contain" })) : null] }));
}
function rowTypeClass(type) {
    if (!type)
        return undefined;
    const map = {
        hint: "start-row-hint",
        blue: "start-row-blue",
        pink: "start-row-pink",
        teal: "start-row-teal",
        orange: "start-row-orange",
        red: "start-row-red",
        gray: "start-row-hint",
    };
    return map[type];
}
function StartTable({ rows }) {
    const showFavor = rows.some((r) => r.favor != null && r.favor !== "");
    return (_jsx("div", { className: "start-table-wrap mt-4 overflow-x-auto", children: _jsxs("table", { className: "start-structured-table simple-table w-full table-fixed border-collapse text-[0.8125rem]", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "start-col-desc", children: "Descri\u00E7\u00E3o" }), _jsx("th", { className: "start-col-res", children: _jsx(ResourceColumnHeader, { label: "Comida", token: "foodaom", labelClassName: "highlight-red" }) }), _jsx("th", { className: "start-col-res", children: _jsx(ResourceColumnHeader, { label: "Madeira", token: "woodaom", labelClassName: "highlight-brown" }) }), _jsx("th", { className: "start-col-res", children: _jsx(ResourceColumnHeader, { label: "Ouro", token: "goldaom", labelClassName: "highlight-yellow" }) }), showFavor ? (_jsx("th", { className: "start-col-res", children: _jsx(ResourceColumnHeader, { label: "Favor", token: "favoraom", labelClassName: "text-blue-400" }) })) : null, _jsx("th", { className: "start-col-pop", children: _jsx(ResourceColumnHeader, { label: "Popula\u00E7\u00E3o", token: "aomr_population_provision_icon" }) })] }) }), _jsx("tbody", { children: rows.map((r, i) => (_jsxs("tr", { className: rowTypeClass(r.type ?? null), children: [_jsx("td", { className: "start-col-desc", children: _jsx(StartMiniMarkup, { text: r.description, expandResources: true }) }), _jsx("td", { className: "start-col-res", children: r.food != null && r.food !== "" ? _jsx(StartMiniMarkup, { text: r.food, expandResources: true }) : null }), _jsx("td", { className: "start-col-res", children: r.wood != null && r.wood !== "" ? _jsx(StartMiniMarkup, { text: r.wood, expandResources: true }) : null }), _jsx("td", { className: "start-col-res", children: r.gold != null && r.gold !== "" ? _jsx(StartMiniMarkup, { text: r.gold, expandResources: true }) : null }), showFavor ? (_jsx("td", { className: "start-col-res", children: r.favor != null && r.favor !== "" ? _jsx(StartMiniMarkup, { text: r.favor, expandResources: true }) : null })) : null, _jsx("td", { className: "start-col-pop", children: r.pop != null && r.pop !== "" ? _jsx(StartMiniMarkup, { text: r.pop, expandResources: true }) : null })] }, i))) })] }) }));
}
function CalloutBlock({ children }) {
    return (_jsxs("figure", { className: "callout block-color-gray_background mt-4 flex gap-3 rounded-xl border border-aom-border p-4 first:mt-0", children: [_jsx("div", { className: "text-xl leading-none text-zinc-500", "aria-hidden": true, children: "\u25CF" }), _jsx("div", { className: "min-w-0 flex-1 whitespace-pre-line text-sm leading-relaxed text-zinc-200", children: children })] }));
}
function LeadBlocks({ blocks }) {
    return (_jsx(_Fragment, { children: blocks.map((b, i) => {
            if (b.kind === "callout") {
                return (_jsx(CalloutBlock, { children: _jsx(StartMiniMarkup, { text: b.text, expandResources: true }) }, i));
            }
            const Tag = b.level <= 2 ? "h2" : "h3";
            return (_jsx(Tag, { className: "mt-6 whitespace-pre-line font-[family-name:var(--font-display)] text-lg font-semibold text-amber-100/95 first:mt-0", children: _jsx(StartMiniMarkup, { text: b.text, expandResources: true }) }, i));
        }) }));
}
function FooterBlocks({ blocks }) {
    return (_jsx(_Fragment, { children: blocks.map((b, i) => {
            if (b.kind === "paragraph") {
                return (_jsx("p", { className: "mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-300", children: _jsx(StartMiniMarkup, { text: b.text, expandResources: true }) }, i));
            }
            if (b.kind === "callout") {
                return (_jsx(CalloutBlock, { children: _jsx(StartMiniMarkup, { text: b.text, expandResources: true }) }, i));
            }
            const Tag = b.level <= 2 ? "h2" : "h3";
            return (_jsx(Tag, { className: "mt-6 whitespace-pre-line font-[family-name:var(--font-display)] text-lg font-semibold text-amber-100/95", children: _jsx(StartMiniMarkup, { text: b.text, expandResources: true }) }, i));
        }) }));
}
export function StartStructuredContent({ segments }) {
    return (_jsx("div", { className: "start-notion-content start-structured mt-8", children: segments.map((seg, si) => (_jsxs("section", { className: si > 0 ? "mt-10 border-t border-aom-border/60 pt-10" : undefined, children: [seg.lead?.length ? _jsx(LeadBlocks, { blocks: seg.lead }) : null, seg.table?.length ? _jsx(StartTable, { rows: seg.table }) : null, seg.footer?.length ? _jsx(FooterBlocks, { blocks: seg.footer }) : null] }, si))) }));
}
