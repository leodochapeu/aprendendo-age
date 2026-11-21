import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
import { expandStartInlineKeywords } from "@/lib/startResourceKeywords";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { getTokenLabel } from "@/lib/notionTokenLabels";
const KNOWN_TAGS = new Set([
    "food",
    "wood",
    "gold",
    "strong",
    "code",
    "highlight-red",
    "highlight-yellow",
    "highlight-brown",
    "highlight-blue",
    "highlight-teal",
    "highlight-orange",
    "highlight-pink",
    "highlight-purple",
    "highlight-gray",
]);
function highlightClass(tag) {
    if (tag === "food")
        return "highlight-red";
    if (tag === "wood")
        return "highlight-brown";
    if (tag === "gold")
        return "highlight-yellow";
    return tag;
}
function wrapTag(tag, inner, key) {
    if (!KNOWN_TAGS.has(tag)) {
        return (_jsxs("span", { children: ["<", tag, ">", inner, "</", tag, ">"] }, key));
    }
    if (tag === "strong") {
        return (_jsx("strong", { className: "font-semibold text-zinc-100", children: inner }, key));
    }
    if (tag === "code") {
        return (_jsx("code", { className: "rounded bg-black/35 px-1 py-0.5 text-[0.85em]", children: inner }, key));
    }
    const hc = highlightClass(tag);
    return (_jsx("span", { className: hc, children: inner }, key));
}
function renderToken(name, key) {
    const src = getTokenAssetUrl(name);
    if (src) {
        return (_jsx("img", { src: src, alt: "", title: getTokenLabel(name), className: "notion-token-inline mx-0.5 inline-block h-[1em] max-h-[1.1em] w-auto align-[-0.12em] object-contain" }, key));
    }
    return (_jsx("span", { className: "mx-0.5 inline rounded bg-zinc-800/90 px-1 py-0.5 align-baseline font-mono text-[0.65rem] text-amber-200/95", title: getTokenLabel(name), children: `:${name}:` }, key));
}
/**
 * Mini-markup dos starts: `:token:`, `<food>`, `<highlight-teal>`, `<strong>`, `<code>`, etc.
 */
export function parseStartMiniMarkup(text, baseKey = "m") {
    const nodes = [];
    let pos = 0;
    let uid = 0;
    while (pos < text.length) {
        const nextColon = text.indexOf(":", pos);
        const nextLt = text.indexOf("<", pos);
        const nextSpecial = nextColon >= 0 && nextLt >= 0
            ? Math.min(nextColon, nextLt)
            : nextColon >= 0
                ? nextColon
                : nextLt >= 0
                    ? nextLt
                    : -1;
        if (nextSpecial < 0) {
            nodes.push(_jsx("span", { children: text.slice(pos) }, `${baseKey}-rest-${uid++}`));
            break;
        }
        if (nextSpecial > pos) {
            nodes.push(_jsx("span", { children: text.slice(pos, nextSpecial) }, `${baseKey}-txt-${uid++}`));
            pos = nextSpecial;
        }
        if (text[pos] === ":") {
            const m = /^:([a-z0-9_-]+):/.exec(text.slice(pos));
            if (m) {
                nodes.push(renderToken(m[1].toLowerCase(), `${baseKey}-tok-${uid++}`));
                pos += m[0].length;
                continue;
            }
            nodes.push(_jsx("span", { children: ":" }, `${baseKey}-c-${uid++}`));
            pos++;
            continue;
        }
        const tagM = /^<([a-z0-9_-]+)>/.exec(text.slice(pos));
        if (!tagM) {
            nodes.push(_jsx("span", { children: "<" }, `${baseKey}-lt-${uid++}`));
            pos++;
            continue;
        }
        const tagName = tagM[1];
        const close = `</${tagName}>`;
        const startContent = pos + tagM[0].length;
        const closeIdx = text.indexOf(close, startContent);
        if (closeIdx < 0) {
            nodes.push(_jsx("span", { children: text.slice(pos, pos + tagM[0].length) }, `${baseKey}-bad-${uid++}`));
            pos += tagM[0].length;
            continue;
        }
        const inner = text.slice(startContent, closeIdx);
        pos = closeIdx + close.length;
        const innerNodes = parseStartMiniMarkup(inner, `${baseKey}-${tagName}-${uid}`);
        nodes.push(wrapTag(tagName, _jsx(_Fragment, { children: innerNodes }), `${baseKey}-wrap-${uid++}`));
    }
    return nodes;
}
export function StartMiniMarkup({ text, className, expandResources, }) {
    if (!text)
        return null;
    const processed = expandResources ? expandStartInlineKeywords(text) : text;
    return (_jsx("span", { className: cn(expandResources && "min-w-0 whitespace-pre-line", className), children: parseStartMiniMarkup(processed) }));
}
