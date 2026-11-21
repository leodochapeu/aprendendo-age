import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NotionText } from "@/components/ui/NotionText";
import { cn } from "@/lib/cn";
const previewImgClass = "h-11 w-11 shrink-0 rounded-xl border border-aom-border bg-zinc-900/60 object-contain p-1 shadow-sm shadow-black/30 sm:h-12 sm:w-12";
/** Imagem + nome no canto superior (sem card); rótulo com tokens Notion. */
export function SpreadsheetHoverPreview({ preview, className }) {
    if (!preview)
        return null;
    return (_jsxs("div", { className: cn("flex max-w-[11rem] items-center gap-2 sm:max-w-[14rem]", className), "aria-live": "polite", children: [preview.imageSrc ? (_jsx("img", { src: preview.imageSrc, alt: "", className: previewImgClass })) : (_jsx("span", { className: cn(previewImgClass, "flex items-center justify-center text-xs font-semibold text-zinc-500"), children: preview.label.slice(0, 3) })), _jsx("span", { className: "min-w-0 truncate text-sm font-medium leading-tight text-zinc-200", children: _jsx(NotionText, { text: preview.label }) })] }));
}
