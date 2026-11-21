import { deuses, panteoes } from "@/data/catalog";
/** Nomes de `starts_build_order` / builder que não batem com `deuses_aom.nome`. */
const GOD_NAME_ALIASES = {
    Isis: "Ísis",
    Ra: "Rá",
    Freyr: "Frey",
};
const deusByNome = new Map(deuses.map((d) => [d.nome, d]));
const panteaoByNome = new Map(panteoes.map((p) => [p.nome, p]));
const FALLBACK = "aomr_pantheon_greeks_icon";
/**
 * Token `aomr_…` para `starts_build_order.image`: um deus (se houver 1 em `god`) ou ícone do panteão.
 * Mesma regra usada ao preencher `image` no JSON.
 */
export function resolveStartImageToken(god, pantheon) {
    if (god.length === 1) {
        const resolved = GOD_NAME_ALIASES[god[0]] ?? god[0];
        const d = deusByNome.get(resolved);
        const icon = d && d.icon;
        if (icon)
            return icon;
    }
    if (pantheon) {
        const p = panteaoByNome.get(pantheon);
        if (p?.icon)
            return p.icon;
    }
    return FALLBACK;
}
