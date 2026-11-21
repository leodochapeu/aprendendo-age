import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from "react";
import { NotionText } from "@/components/ui/NotionText";
import { cn } from "@/lib/cn";
import { hasTipoContent, tipoItemToNotionText, tipoItemsToNotionText, tipoTypeTagShellClass, tipoTypeTextClass, } from "@/lib/unidadeTipo";
const tipoTagShellLayoutClass = "inline-flex max-w-full shrink-0 items-center rounded border px-1.5 py-0.5 align-top text-sm font-medium normal-case leading-snug [word-break:break-word]";
/**
 * Renderiza `tipo` com ícones inline; com `colored` + `shell="auto"`, uma cápsula por tipo.
 */
export function UnidadeTipoLine({ tipo, colored = false, shell = "auto", className, }) {
    if (!hasTipoContent(tipo))
        return null;
    const items = tipo;
    if (!colored) {
        return _jsx(NotionText, { text: tipoItemsToNotionText(tipo), className: cn("inline", className) });
    }
    if (shell === "auto") {
        if (items.length === 1) {
            const it = items[0];
            return (_jsx("span", { className: cn(tipoTagShellLayoutClass, tipoTypeTagShellClass(it.type), className), children: _jsx(NotionText, { text: tipoItemToNotionText(it), className: "inline" }) }));
        }
        return (_jsx("span", { className: cn("inline-flex max-w-full flex-wrap items-center gap-1 align-top", className), children: items.map((it, i) => (_jsx("span", { className: cn(tipoTagShellLayoutClass, tipoTypeTagShellClass(it.type)), children: _jsx(NotionText, { text: tipoItemToNotionText(it), className: "inline" }) }, `${it.type}-${it.icon ?? ""}-${i}`))) }));
    }
    return (_jsx("span", { className: cn("inline", className), children: items.map((it, i) => (_jsxs(Fragment, { children: [i > 0 ? _jsx("span", { className: "text-amber-600/85", children: ", " }) : null, _jsx("span", { className: tipoTypeTextClass(it.type), children: _jsx(NotionText, { text: tipoItemToNotionText(it), className: "inline" }) })] }, i))) }));
}
