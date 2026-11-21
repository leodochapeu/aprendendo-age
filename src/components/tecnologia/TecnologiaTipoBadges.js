import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NotionText } from "@/components/ui/NotionText";
import { cn } from "@/lib/cn";
import { hasTecnologiaTipo, parseTecnologiaTipos, TECNOLOGIA_TIPO_DEFS, } from "@/lib/tecnologiaTipo";
const badgeLayout = "inline-flex max-w-full shrink-0 cursor-default items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium leading-snug [word-break:break-word]";
/**
 * Badges coloridas para Econômico / Ofensivo / Defensivo / Utilidade (legado Notion).
 * Tooltip nativo via `title` ao passar o mouse.
 */
export function TecnologiaTipoBadges({ tipo, className }) {
    const kinds = parseTecnologiaTipos(tipo);
    if (!kinds.length) {
        if (!tipo?.trim())
            return null;
        return (_jsx("span", { className: cn("text-sm text-zinc-300", className), children: _jsx(NotionText, { text: tipo }) }));
    }
    return (_jsx("span", { className: cn("inline-flex max-w-full flex-wrap items-center gap-1", className), children: kinds.map((kind) => {
            const def = TECNOLOGIA_TIPO_DEFS[kind];
            return (_jsxs("span", { title: def.description, className: cn(badgeLayout, def.shellClass), children: [_jsx("span", { children: def.label }), _jsx("span", { "aria-hidden": true, children: def.emoji })] }, kind));
        }) }));
}
export { hasTecnologiaTipo };
