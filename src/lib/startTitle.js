import { startAuthorName } from "@/lib/startAuthor";
/** Remove apenas `:tokens:` Notion no início do título (para casar com `deuses_aom.json` sem ícones). */
export function stripLeadingNotionTokens(text) {
    let t = text.trim();
    const re = /^:[a-z0-9_-]+:\s*/i;
    while (re.test(t)) {
        t = t.replace(re, "");
    }
    return t.trim();
}
/** Reconstrói o título longo usado em `deuses_aom.json` → campo `starts`. */
export function buildStartLookupKey(s) {
    const t = s.titulo.trim();
    if (!s.author?.length)
        return t;
    return `${t} - por ${s.author.map((a) => startAuthorName(a)).join(" | ")}`;
}
/** Mesma chave com ícones `:token:` removidos do nome (lista de deuses não os inclui). */
export function buildStartLookupKeyWithoutIcons(s) {
    const t = stripLeadingNotionTokens(s.titulo);
    if (!s.author?.length)
        return t;
    return `${t} - por ${s.author.map((a) => startAuthorName(a)).join(" | ")}`;
}
/**
 * Normaliza variações como `:- por` vs `: - por` para o mesmo texto,
 * alinhando com as strings em `deuses_aom.json`.
 */
export function canonicalStartTitle(s) {
    return s
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\)\s*-\s*por\b/gi, ") - por")
        .replace(/:\s*-\s*por\b/gi, ":- por")
        .replace(/\s-\s*por\b/gi, " - por");
}
/**
 * Alinha trechos do campo `starts` em `deuses_aom.json` com as chaves dos starts:
 * « - por », « … por Autor » (sem hífen) ou «Nome - Autor» sem «por» (ex.: Fu Xi - HuskSuppe).
 */
export function normalizeDeusesStartPart(part) {
    const p = part.trim().replace(/\s+/g, " ");
    if (/\s-\s*por\s+/i.test(p)) {
        return p;
    }
    const porIdx = p.lastIndexOf(" por ");
    if (porIdx >= 0) {
        const left = p.slice(0, porIdx).trim();
        const right = p.slice(porIdx + 4).trim();
        if (left && right) {
            return `${left} - por ${right}`;
        }
    }
    const dashIdx = p.lastIndexOf(" - ");
    if (dashIdx <= 0) {
        return p;
    }
    const left = p.slice(0, dashIdx).trim();
    const right = p.slice(dashIdx + 3).trim();
    if (!right) {
        return p;
    }
    return `${left} - por ${right}`;
}
