import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { parseStartMiniMarkup } from "@/lib/startMiniMarkup";
/**
 * Texto exportado do Notion: `:token:` viram ícones; `<highlight-*>` usam as cores do legado (starts).
 */
export function NotionText({ text, className }) {
    if (!text)
        return null;
    return _jsx("span", { className: cn("notion-rich-text", className), children: parseStartMiniMarkup(text) });
}
