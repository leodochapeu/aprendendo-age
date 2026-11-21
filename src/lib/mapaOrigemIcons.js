/** Ícones de DLC / origem dos mapas em `/public/assets/dlc_icons`. */
const ORIGEM_ICON_BY_LABEL = {
    "AoM: Original (2002)": "original",
    "AoM: Titans (2003)": "titans",
    "AoM: Tale of the Dragon (2016)": "tale_of_the_dragon",
    "AoM: Retold (2024)": "retold",
    "AoM: Immortal Pillars (2025)": "immortal_pillars",
    "AoM: Heavenly Spear (2025)": "heavenly_spear",
    "AoM: Obsidian Mirror (2026)": "obsidian_mirror",
    "Mod: Pandoras Box 2": "pandoras_box_2",
};
/** Ordem estável dos filtros de origem na listagem de mapas. */
export const MAPA_ORIGEM_FILTERS = Object.entries(ORIGEM_ICON_BY_LABEL).map(([label, slug]) => ({
    label,
    iconSrc: `/assets/dlc_icons/${slug}.webp`,
}));
export function mapaOrigemIconSrc(origem) {
    const slug = ORIGEM_ICON_BY_LABEL[origem.trim()];
    return slug ? `/assets/dlc_icons/${slug}.webp` : undefined;
}
export function mapaOrigemTitleIcons(origem) {
    if (!origem?.length)
        return [];
    const out = [];
    for (const label of origem) {
        const src = mapaOrigemIconSrc(label);
        if (src)
            out.push({ src, label });
    }
    return out;
}
export function formatMapaOrigem(origem) {
    if (!origem?.length)
        return "";
    return origem.join(", ");
}
