import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from "react";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { getTokenLabel } from "@/lib/notionTokenLabels";
const TOKEN_RE = /:([a-z0-9_-]+):/gi;
/** Apenas ícones `:token:` de um trecho (sem rótulos de texto). */
export function NotionTokensOnly({ text, iconClassName = "h-[1.1em] max-h-5 w-auto object-contain", }) {
    const tokens = [...text.matchAll(TOKEN_RE)];
    if (!tokens.length)
        return null;
    return (_jsx("span", { className: "inline-flex items-center gap-0.5", children: tokens.map((m, i) => {
            const name = (m[1] ?? "").toLowerCase();
            const src = getTokenAssetUrl(name);
            if (!src)
                return null;
            return (_jsx("img", { src: src, alt: "", title: getTokenLabel(name), className: iconClassName }, `${name}-${i}`));
        }) }));
}
/**
 * Forte/fraco contra na planilha: só ícones, vários grupos separados por ` | `.
 * Ex.: `Cavalaria :aomr_type_cavalry_icon: | Artilharia :aomr_type_archer_icon:`
 */
export function NotionCounterIconsRow({ text, iconClassName }) {
    const trimmed = text.trim();
    if (!trimmed || trimmed === "-") {
        return _jsx("span", { className: "text-zinc-500", children: "\u2014" });
    }
    const segments = trimmed.split(/\s*\|\s*/).filter((s) => s.trim());
    const withIcons = segments.filter((seg) => TOKEN_RE.test(seg));
    TOKEN_RE.lastIndex = 0;
    if (!withIcons.length) {
        return _jsx("span", { className: "text-zinc-500", children: "\u2014" });
    }
    return (_jsx("span", { className: "inline-flex flex-wrap items-center gap-x-1 gap-y-0.5", children: withIcons.map((seg, i) => (_jsxs(Fragment, { children: [i > 0 ? (_jsx("span", { className: "select-none px-0.5 text-xs text-zinc-600", "aria-hidden": true, children: "|" })) : null, _jsx(NotionTokensOnly, { text: seg, iconClassName: iconClassName })] }, i))) }));
}
