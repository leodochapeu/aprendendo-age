const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const MENTION_TOKEN = new RegExp(`@\\[([^\\]\\n]{1,40})\\]\\((${UUID})\\)`, "g");

export type CommentMention = {
  label: string;
  id: string;
};

export type CommentSpan =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "mention"; label: string; id: string };

export type CommentBlock =
  | { type: "heading"; spans: CommentSpan[] }
  | { type: "paragraph"; spans: CommentSpan[] }
  | { type: "blank" };

export function sanitizeMentionLabel(raw: string): string {
  return raw.replace(/[^\p{L}\p{N} ._'’-]/gu, "").trim().slice(0, 40);
}

export function mentionQueryAt(value: string, caret: number): { start: number; query: string } | null {
  const upto = value.slice(0, caret);
  const match = upto.match(/(^|[\s])@([^\s@]{0,30})$/);
  if (!match || match.index == null) return null;
  const query = match[2] ?? "";
  return { start: caret - query.length - 1, query };
}

export function mentionsToDisplay(body: string): { text: string; mentions: CommentMention[] } {
  const mentions: CommentMention[] = [];
  const text = body.replace(MENTION_TOKEN, (_full, label: string, id: string) => {
    const safe = sanitizeMentionLabel(label);
    if (!safe) return `@${label}`;
    mentions.push({ label: safe, id });
    return `@${safe}`;
  });
  return { text, mentions };
}

export function displayToStored(text: string, mentions: CommentMention[]): string {
  const unique = [...mentions].sort((a, b) => b.label.length - a.label.length);
  let next = text;
  for (const mention of unique) {
    const label = sanitizeMentionLabel(mention.label);
    if (!label || !isUuid(mention.id)) continue;
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const visible = new RegExp(`@${escaped}(?![\\p{L}\\p{N}_])`, "gu");
    next = next.replace(visible, `@[${label}](${mention.id})`);
  }
  return next;
}

export function commentExcerpt(body: string, max = 180): string {
  const plain = mentionsToDisplay(body)
    .text.replace(/^#{1,3}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

export function parseComment(body: string): CommentBlock[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  return lines.map((line) => {
    if (line.trim() === "") return { type: "blank" };
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading?.[2]) return { type: "heading", spans: parseInline(heading[2]) };
    return { type: "paragraph", spans: parseInline(line) };
  });
}

function parseInline(input: string): CommentSpan[] {
  const spans: CommentSpan[] = [];
  const mention = new RegExp(MENTION_TOKEN.source, "g");
  let last = 0;
  for (const match of input.matchAll(mention)) {
    const index = match.index ?? 0;
    if (index > last) spans.push(...parseEmphasis(input.slice(last, index)));
    const label = sanitizeMentionLabel(match[1] ?? "");
    const id = match[2] ?? "";
    if (label && isUuid(id)) spans.push({ type: "mention", label, id });
    else spans.push({ type: "text", text: match[0] });
    last = index + match[0].length;
  }
  if (last < input.length) spans.push(...parseEmphasis(input.slice(last)));
  return spans;
}

function parseEmphasis(input: string): CommentSpan[] {
  const spans: CommentSpan[] = [];
  const re = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let last = 0;
  for (const match of input.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > last) spans.push({ type: "text", text: input.slice(last, index) });
    if (match[1] != null) spans.push({ type: "bold", text: match[1] });
    else if (match[2] != null) spans.push({ type: "italic", text: match[2] });
    last = index + match[0].length;
  }
  if (last < input.length) spans.push({ type: "text", text: input.slice(last) });
  return spans;
}

function isUuid(value: string): boolean {
  return new RegExp(`^${UUID}$`).test(value);
}
