/**
 * Texto do tooltip (`title`) para tokens `:token:` substituídos por ícones.
 * Eras, panteões e tipos têm etiquetas em PT; o resto usa um nome legível derivado do token.
 */
const AGE_BY_SLUG = {
    archaic: "Arcaica",
    classical: "Clássica",
    heroic: "Heróica",
    mythic: "Mítica",
    wonder: "Maravilha",
};
const PANTHEON_BY_SLUG = {
    greeks: "Grego",
    egyptians: "Egípcio",
    norse: "Nórdico",
    atlanteans: "Atlante",
    chinese: "Chinês",
    japanese: "Japonês",
    azteca: "Asteca",
};
/** `aomr_type_*_icon` → rótulo curto em português */
const UNIT_TYPE_BY_SLUG = {
    archer: "Arqueiro",
    archer_ship: "Navio arqueiro",
    building: "Construção",
    cavalry: "Cavalaria",
    close_combat_ship: "Navio de combate corpo a corpo",
    flying_unit: "Unidade voadora",
    hero: "Herói",
    human_soldier: "Soldado humano",
    infantry: "Infantaria",
    myth_unit: "Unidade mítica",
    ship: "Navio",
    siege_ship: "Navio de cerco",
    siege_weapon: "Arma de cerco",
    titan: "Titã",
    tower: "Torre",
    villager: "Aldeão",
    wall: "Muralha",
};
function labelAgeToken(k) {
    const m = /^aomr_(archaic|classical|heroic|mythic|wonder)_age_icon$/.exec(k);
    if (!m)
        return undefined;
    return AGE_BY_SLUG[m[1] ?? ""] ?? undefined;
}
function labelPantheonToken(k) {
    const m = /^aomr_pantheon_([a-z]+)_icon$/.exec(k);
    if (!m)
        return undefined;
    return PANTHEON_BY_SLUG[m[1] ?? ""] ?? undefined;
}
function labelTypeToken(k) {
    const m = /^aomr_type_(.+)_icon$/.exec(k);
    if (!m)
        return undefined;
    const slug = m[1] ?? "";
    return UNIT_TYPE_BY_SLUG[slug] ?? undefined;
}
/** Palavras comuns em nomes de ficheiro → PT (apenas para legibilidade do tooltip) */
const TOKEN_WORD_PT = {
    age: "Era",
    icon: "",
    power: "Poder",
    ability: "Habilidade",
    building: "Edifício",
    tech: "Tecnologia",
    unit: "Unidade",
    ship: "Navio",
    villager: "Aldeão",
    hero: "Herói",
    tower: "Torre",
    wall: "Muralha",
    gold: "Ouro",
    food: "Comida",
    wood: "Madeira",
    favor: "Favor",
};
/**
 * Converte token sem mapeamento explícito num texto legível (não mostra `:token:` cru).
 */
function prettifyTokenFallback(k) {
    let s = k.toLowerCase();
    if (s.startsWith("aoe2de_"))
        s = s.slice(7);
    if (s.startsWith("aom_"))
        s = s.slice(4);
    if (s.startsWith("aomr_"))
        s = s.slice(5);
    if (s.endsWith("_icon"))
        s = s.slice(0, -5);
    if (s.endsWith("_power"))
        s = s.slice(0, -6);
    const parts = s.split("_").filter(Boolean);
    const out = [];
    for (const p of parts) {
        const tr = TOKEN_WORD_PT[p];
        if (tr === "")
            continue;
        if (tr) {
            out.push(tr);
            continue;
        }
        if (p.length <= 2) {
            out.push(p.toUpperCase());
            continue;
        }
        out.push(p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
    }
    const joined = out.join(" ").trim();
    return joined || k;
}
/**
 * Rótulo em português para tooltip do ícone associado ao token (nome sem `:`).
 */
export function getTokenLabel(token) {
    const k = token.toLowerCase().trim();
    if (!k)
        return "";
    const age = labelAgeToken(k);
    if (age)
        return age;
    const pantheon = labelPantheonToken(k);
    if (pantheon)
        return pantheon;
    const unitType = labelTypeToken(k);
    if (unitType)
        return unitType;
    if (k === "aomr_japaneses_icon")
        return "Japonês";
    return prettifyTokenFallback(k);
}
