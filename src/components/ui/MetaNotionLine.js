import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NotionText } from "@/components/ui/NotionText";
/** Meta de card com `NotionText` (emojis de tipo + panteão → ícones). */
export function MetaNotionLine({ parts }) {
    const items = parts.filter((p) => typeof p === "string" && p.length > 0);
    if (items.length === 0)
        return null;
    return (_jsx(_Fragment, { children: items.map((s, i) => (_jsxs("span", { children: [i > 0 ? " · " : null, _jsx(NotionText, { text: s })] }, `${i}-${s.slice(0, 24)}`))) }));
}
