import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NotionText } from "@/components/ui/NotionText";
import { cn } from "@/lib/cn";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
export function EntityCardPreviewStats({ items }) {
    const visibleItems = items.filter((item) => item.value != null && item.value !== "");
    if (!visibleItems.length)
        return null;
    return (_jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3", children: visibleItems.map((item, index) => {
            const iconSrc = item.icon ? resolveTokenIconSrc(item.icon) : undefined;
            return (_jsxs("div", { title: item.label, className: "flex min-w-0 items-center gap-2 rounded-lg border border-zinc-800/90 bg-zinc-900/65 px-2.5 py-2", children: [iconSrc ? (_jsx("img", { src: iconSrc, alt: "", "aria-hidden": true, className: "size-5 shrink-0 object-contain" })) : (_jsx("span", { className: "max-w-20 shrink-0 truncate text-[9px] font-medium uppercase tracking-wide text-zinc-500", children: item.label })), _jsx("span", { className: cn("min-w-0 truncate text-xs font-semibold tabular-nums", item.valueClassName ?? "text-zinc-100"), children: item.value }), _jsx("span", { className: "sr-only", children: item.label })] }, `${item.label}-${index}`));
        }) }));
}
export function EntityCardPreviewText({ lines, maxLines = 4, }) {
    const visible = lines.filter(Boolean).slice(0, maxLines);
    if (!visible.length)
        return null;
    return (_jsxs("div", { className: "space-y-2 text-xs leading-relaxed text-zinc-300", children: [visible.map((line, index) => (_jsx("p", { className: "line-clamp-3", children: _jsx(NotionText, { text: line }) }, index))), lines.length > visible.length ? (_jsxs("p", { className: "text-[10px] font-medium text-zinc-500", children: ["+", lines.length - visible.length] })) : null] }));
}
export function EntityCardPreviewDescription({ text }) {
    return (_jsx("p", { className: "line-clamp-6 text-xs leading-relaxed text-zinc-300", children: _jsx(NotionText, { text: text }) }));
}
export function EntityCardPreviewGodBonuses({ blocks }) {
    const lines = blocks.flatMap((block) => {
        if (block.tipo === "lista")
            return block.itens;
        return [block.texto];
    });
    return _jsx(EntityCardPreviewText, { lines: lines, maxLines: 6 });
}
