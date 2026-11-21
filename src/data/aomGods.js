export const AOM_MAJOR_GODS = [
    { slug: "amaterasu", label: "Amaterasu" },
    { slug: "demeter", label: "Demeter" },
    { slug: "huitzilopochtli", label: "Huitzilopochtli" },
    { slug: "kronos", label: "Cronos" },
    { slug: "freyr", label: "Frey" },
    { slug: "fuxi", label: "Fuxi" },
    { slug: "gaia", label: "Gaia" },
    { slug: "hades", label: "Hades" },
    { slug: "isis", label: "Isis" },
    { slug: "loki", label: "Loki" },
    { slug: "nuwa", label: "Nuwa" },
    { slug: "odin", label: "Odin" },
    { slug: "poseidon", label: "Poseidon" },
    { slug: "quetzalcoatl", label: "Quetzalcoatl" },
    { slug: "ra", label: "Ra" },
    { slug: "set", label: "Set" },
    { slug: "shennong", label: "Shennong" },
    { slug: "susanoo", label: "Susanoo" },
    { slug: "tezcatlipoca", label: "Tezcatlipoca" },
    { slug: "thor", label: "Thor" },
    { slug: "tsukuyomi", label: "Tsukuyomi" },
    { slug: "oranos", label: "Urano" },
    { slug: "zeus", label: "Zeus" },
];
export const AOM_MAJOR_GOD_BY_SLUG = Object.fromEntries(AOM_MAJOR_GODS.map((g) => [g.slug, g]));
function normalizeGodKey(raw) {
    return raw
        .trim()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/ü/gi, "u")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}
const SLUG_BY_KEY = (() => {
    const map = new Map();
    for (const god of AOM_MAJOR_GODS) {
        map.set(normalizeGodKey(god.slug), god.slug);
        map.set(normalizeGodKey(god.label), god.slug);
    }
    map.set("freyr", "freyr");
    map.set("frey", "freyr");
    map.set("urano", "oranos");
    map.set("ouranos", "oranos");
    map.set("oranos", "oranos");
    map.set("kronos", "kronos");
    map.set("cronos", "kronos");
    return map;
})();
/** Nome/slug da API AoM Stats → slug canônico ou `null` se desconhecido. */
export function normalizeGodSlugFromApiName(apiName) {
    const key = normalizeGodKey(apiName);
    if (!key)
        return null;
    return SLUG_BY_KEY.get(key) ?? null;
}
