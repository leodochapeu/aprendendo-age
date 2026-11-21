import { startsBuildOrder } from "@/data/catalog";
import { buildStartLookupKey, buildStartLookupKeyWithoutIcons, canonicalStartTitle, normalizeDeusesStartPart, } from "@/lib/startTitle";
const startByCanonicalKey = new Map();
for (const s of startsBuildOrder) {
    const keys = new Set([
        canonicalStartTitle(buildStartLookupKey(s)),
        canonicalStartTitle(buildStartLookupKeyWithoutIcons(s)),
    ]);
    for (const k of keys) {
        startByCanonicalKey.set(k, s);
    }
}
/**
 * O campo `starts` em `deuses_aom.json` é uma lista separada por vírgulas
 * cujos trechos coincidem com o título completo «nome - por autor» dos starts.
 */
export function parseStartReferences(startsText) {
    const parts = startsText
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    return parts.map((part) => {
        const normalized = normalizeDeusesStartPart(part);
        const c = canonicalStartTitle(normalized);
        const exact = startByCanonicalKey.get(c);
        if (exact)
            return { kind: "link", slug: exact.slug, titulo: exact.titulo };
        const collapsed = canonicalStartTitle(normalized.replace(/\s+/g, " ").trim());
        const fuzzy = startByCanonicalKey.get(collapsed);
        if (fuzzy)
            return { kind: "link", slug: fuzzy.slug, titulo: fuzzy.titulo };
        return { kind: "text", raw: part };
    });
}
