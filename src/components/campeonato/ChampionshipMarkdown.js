import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/cn";
const NAMED_COLORS = {
    verde: "#22c55e",
    vermelho: "#ef4444",
    amarelo: "#eab308",
    azul: "#38bdf8",
    ciano: "#22d3ee",
    laranja: "#f97316",
    roxo: "#a855f7",
    rosa: "#f472b6",
    dourado: "#fbbf24",
    branco: "#f8fafc",
    cinza: "#a1a1aa",
    preto: "#18181b",
};
const NAMED_COLOR_ALT = Object.keys(NAMED_COLORS).join("|");
const COLOR_TAG_RE = new RegExp(`<(${NAMED_COLOR_ALT}|#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))>([\\s\\S]*?)<\\/\\1>`, "i");
function resolveColor(token) {
    const key = token.trim().toLowerCase();
    if (NAMED_COLORS[key])
        return NAMED_COLORS[key];
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(token.trim()))
        return token.trim();
    return null;
}
function isStructural(line) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("/#"))
        return false;
    return /^(#{1,3})\s+\S/.test(trimmed) || /^>\s?/.test(trimmed) || /^[-*]\s+\S/.test(trimmed) || /^\d+\.\s+\S/.test(trimmed);
}
function unescapeMarker(line) {
    return line.replace(/^(\s*)\/(#{1,3}\s)/, "$1$2");
}
function parseMarkdown(source) {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    const blocks = [];
    let index = 0;
    while (index < lines.length) {
        const raw = lines[index];
        if (!raw.trim()) {
            index += 1;
            continue;
        }
        const trimmed = raw.trimStart();
        const heading = /^(#{1,3})\s+(\S.*)$/.exec(trimmed);
        if (heading && !trimmed.startsWith("/")) {
            blocks.push({ type: "h", level: heading[1].length, text: heading[2] });
            index += 1;
            continue;
        }
        if (/^>\s?/.test(trimmed)) {
            const quote = [];
            while (index < lines.length && /^>\s?/.test(lines[index].trimStart())) {
                quote.push(lines[index].trimStart().replace(/^>\s?/, ""));
                index += 1;
            }
            blocks.push({ type: "quote", lines: quote });
            continue;
        }
        if (/^[-*]\s+\S/.test(trimmed)) {
            const items = [];
            while (index < lines.length && /^[-*]\s+\S/.test(lines[index].trimStart())) {
                items.push(lines[index].trimStart().replace(/^[-*]\s+/, ""));
                index += 1;
            }
            blocks.push({ type: "ul", items });
            continue;
        }
        if (/^\d+\.\s+\S/.test(trimmed)) {
            const items = [];
            while (index < lines.length && /^\d+\.\s+\S/.test(lines[index].trimStart())) {
                items.push(lines[index].trimStart().replace(/^\d+\.\s+/, ""));
                index += 1;
            }
            blocks.push({ type: "ol", items });
            continue;
        }
        const paragraph = [];
        while (index < lines.length && lines[index].trim() && !isStructural(lines[index])) {
            paragraph.push(unescapeMarker(lines[index]));
            index += 1;
        }
        blocks.push({ type: "p", lines: paragraph });
    }
    return blocks;
}
function renderMarks(text, key) {
    const pattern = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
    const nodes = [];
    let last = 0;
    let match = pattern.exec(text);
    let part = 0;
    while (match) {
        if (match.index > last)
            nodes.push(text.slice(last, match.index));
        if (match[1] && match[2]) {
            nodes.push(_jsx("a", { href: match[2], target: "_blank", rel: "noreferrer", className: "text-amber-200 underline decoration-amber-400/50 underline-offset-2 hover:text-amber-100", children: match[1] }, `${key}-a-${part}`));
        }
        else if (match[3]) {
            nodes.push(_jsx("strong", { className: "font-semibold text-zinc-100", children: match[3] }, `${key}-b-${part}`));
        }
        else if (match[4]) {
            nodes.push(_jsx("em", { className: "italic text-zinc-200", children: match[4] }, `${key}-i-${part}`));
        }
        last = match.index + match[0].length;
        part += 1;
        match = pattern.exec(text);
    }
    if (last < text.length)
        nodes.push(text.slice(last));
    return nodes;
}
function renderInline(text, key) {
    const nodes = [];
    let rest = text;
    let part = 0;
    while (rest.length > 0) {
        const match = COLOR_TAG_RE.exec(rest);
        if (!match || match.index == null) {
            nodes.push(...renderMarks(rest, `${key}-m-${part}`));
            break;
        }
        if (match.index > 0) {
            nodes.push(...renderMarks(rest.slice(0, match.index), `${key}-m-${part}`));
        }
        const color = resolveColor(match[1] ?? "");
        const inner = match[2] ?? "";
        if (color) {
            nodes.push(_jsx("span", { style: { color }, className: "font-medium", children: renderInline(inner, `${key}-c-${part}-i`) }, `${key}-c-${part}`));
        }
        else {
            nodes.push(...renderMarks(match[0], `${key}-m-${part}`));
        }
        rest = rest.slice(match.index + match[0].length);
        part += 1;
    }
    return nodes;
}
function linesToNodes(lines, key) {
    return lines.flatMap((line, index) => {
        const nodes = renderInline(line, `${key}-${index}`);
        return index === 0 ? nodes : [_jsx("br", {}, `${key}-br-${index}`), ...nodes];
    });
}
const headingClass = [
    "font-[family-name:var(--font-display)] text-2xl text-amber-50",
    "font-[family-name:var(--font-display)] text-xl text-amber-100",
    "text-lg font-semibold text-amber-100",
];
export function ChampionshipMarkdown({ source, className }) {
    const blocks = parseMarkdown(source);
    return (_jsx("div", { className: cn("space-y-3 text-sm leading-6 text-zinc-300", className), children: blocks.map((block, index) => {
            const key = `md-${index}`;
            if (block.type === "h") {
                const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
                return (_jsx(Tag, { className: headingClass[block.level - 1], children: renderInline(block.text, key) }, key));
            }
            if (block.type === "quote") {
                return (_jsx("blockquote", { className: "border-l-2 border-amber-400/60 pl-3 text-zinc-200 italic", children: linesToNodes(block.lines, key) }, key));
            }
            if (block.type === "ul" || block.type === "ol") {
                const Tag = block.type === "ul" ? "ul" : "ol";
                return (_jsx(Tag, { className: cn("space-y-1 pl-5", block.type === "ul" ? "list-disc" : "list-decimal"), children: block.items.map((item, itemIndex) => (_jsx("li", { children: renderInline(item, `${key}-${itemIndex}`) }, `${key}-${itemIndex}`))) }, key));
            }
            return _jsx("p", { children: linesToNodes(block.lines, key) }, key);
        }) }));
}
