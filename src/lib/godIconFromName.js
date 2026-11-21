import { normalizeGodSlugFromApiName } from "@/data/aomGods";
import { getTokenAssetUrl } from "./notionTokenAssets";
/** Nome do deus como vem da API → slug do token `aomr_*_icon`. */
function godNameToTokenKey(god) {
    const ascii = god
        .trim()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/ü/gi, "u");
    const slug = ascii.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return `aomr_${slug}_icon`;
}
/**
 * URL do retrato do deus em `/public/assets/gods` (via mapa de tokens).
 * Resolve aliases PT/EN (ex.: Urano → oranos, Frey → freyr).
 */
export function getGodPortraitUrl(godName) {
    const canonicalSlug = normalizeGodSlugFromApiName(godName);
    if (canonicalSlug) {
        return getTokenAssetUrl(`aomr_${canonicalSlug}_icon`);
    }
    return getTokenAssetUrl(godNameToTokenKey(godName));
}
/** Retrato a partir do slug canônico (`oranos`, `freyr`, …). */
export function getGodPortraitUrlBySlug(godSlug) {
    const slug = godSlug.trim().toLowerCase();
    if (!slug)
        return undefined;
    return getTokenAssetUrl(`aomr_${slug}_icon`);
}
