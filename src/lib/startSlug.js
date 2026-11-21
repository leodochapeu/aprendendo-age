/** Tokens `:aomr_foo_icon:` e similares no título Notion. */
const NOTION_TOKEN = /:[a-z0-9_-]+:/gi;
/**
 * Segmento URL: remove tokens Notion, acentos e caracteres não alfanuméricos.
 */
export function slugifyStartSegment(raw) {
    const noTokens = raw.replace(NOTION_TOKEN, " ");
    return noTokens
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-+/g, "-");
}
/**
 * Slug estável para rotas: `titulo` + `author` (vários autores concatenados com hífen).
 * Colisões devem ser resolvidas ao gerar dados (sufixo `-2`, `-3`, …).
 */
export function buildStartSlug(s) {
    const title = slugifyStartSegment(s.titulo);
    const authors = s.author
        .map((a) => slugifyStartSegment(typeof a === "string" ? a : a.name))
        .filter(Boolean);
    const authorJoined = authors.join("-");
    const combined = authorJoined ? `${title}-${authorJoined}` : title;
    return combined || "start";
}
