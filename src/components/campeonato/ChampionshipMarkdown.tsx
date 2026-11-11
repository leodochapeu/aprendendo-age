import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Block =
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "quote"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "p"; lines: string[] };

const NAMED_COLORS: Record<string, string> = {
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
const COLOR_TAG_RE = new RegExp(
  `<(${NAMED_COLOR_ALT}|#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))>([\\s\\S]*?)<\\/\\1>`,
  "i",
);

function resolveColor(token: string): string | null {
  const key = token.trim().toLowerCase();
  if (NAMED_COLORS[key]) return NAMED_COLORS[key];
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(token.trim())) return token.trim();
  return null;
}

function isStructural(line: string) {
  const trimmed = line.trimStart();
  if (trimmed.startsWith("/#")) return false;
  return /^(#{1,3})\s+\S/.test(trimmed) || /^>\s?/.test(trimmed) || /^[-*]\s+\S/.test(trimmed) || /^\d+\.\s+\S/.test(trimmed);
}

function unescapeMarker(line: string) {
  return line.replace(/^(\s*)\/(#{1,3}\s)/, "$1$2");
}

function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
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
      blocks.push({ type: "h", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      index += 1;
      continue;
    }
    if (/^>\s?/.test(trimmed)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trimStart())) {
        quote.push(lines[index].trimStart().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", lines: quote });
      continue;
    }
    if (/^[-*]\s+\S/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+\S/.test(lines[index].trimStart())) {
        items.push(lines[index].trimStart().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+\S/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+\S/.test(lines[index].trimStart())) {
        items.push(lines[index].trimStart().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isStructural(lines[index])) {
      paragraph.push(unescapeMarker(lines[index]));
      index += 1;
    }
    blocks.push({ type: "p", lines: paragraph });
  }

  return blocks;
}

function renderMarks(text: string, key: string): ReactNode[] {
  const pattern = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match = pattern.exec(text);
  let part = 0;
  while (match) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] && match[2]) {
      nodes.push(
        <a key={`${key}-a-${part}`} href={match[2]} target="_blank" rel="noreferrer" className="text-amber-200 underline decoration-amber-400/50 underline-offset-2 hover:text-amber-100">
          {match[1]}
        </a>,
      );
    } else if (match[3]) {
      nodes.push(
        <strong key={`${key}-b-${part}`} className="font-semibold text-zinc-100">
          {match[3]}
        </strong>,
      );
    } else if (match[4]) {
      nodes.push(
        <em key={`${key}-i-${part}`} className="italic text-zinc-200">
          {match[4]}
        </em>,
      );
    }
    last = match.index + match[0].length;
    part += 1;
    match = pattern.exec(text);
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderInline(text: string, key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
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
      nodes.push(
        <span key={`${key}-c-${part}`} style={{ color }} className="font-medium">
          {renderInline(inner, `${key}-c-${part}-i`)}
        </span>,
      );
    } else {
      nodes.push(...renderMarks(match[0], `${key}-m-${part}`));
    }
    rest = rest.slice(match.index + match[0].length);
    part += 1;
  }
  return nodes;
}

function linesToNodes(lines: string[], key: string) {
  return lines.flatMap((line, index) => {
    const nodes = renderInline(line, `${key}-${index}`);
    return index === 0 ? nodes : [<br key={`${key}-br-${index}`} />, ...nodes];
  });
}

const headingClass = [
  "font-[family-name:var(--font-display)] text-2xl text-amber-50",
  "font-[family-name:var(--font-display)] text-xl text-amber-100",
  "text-lg font-semibold text-amber-100",
];

export function ChampionshipMarkdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className={cn("space-y-3 text-sm leading-6 text-zinc-300", className)}>
      {blocks.map((block, index) => {
        const key = `md-${index}`;
        if (block.type === "h") {
          const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
          return (
            <Tag key={key} className={headingClass[block.level - 1]}>
              {renderInline(block.text, key)}
            </Tag>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={key} className="border-l-2 border-amber-400/60 pl-3 text-zinc-200 italic">
              {linesToNodes(block.lines, key)}
            </blockquote>
          );
        }
        if (block.type === "ul" || block.type === "ol") {
          const Tag = block.type === "ul" ? "ul" : "ol";
          return (
            <Tag key={key} className={cn("space-y-1 pl-5", block.type === "ul" ? "list-disc" : "list-decimal")}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </Tag>
          );
        }
        return <p key={key}>{linesToNodes(block.lines, key)}</p>;
      })}
    </div>
  );
}
