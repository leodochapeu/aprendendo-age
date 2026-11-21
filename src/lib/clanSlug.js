/** Slug de rota a partir da sigla (`CaOK` → `caok`). */
export function clanSlugFromTag(tag) {
    return tag.trim().toLowerCase();
}
