import unitModelTechsJson from "@/data/unit_model_techs.json";
const visuals = unitModelTechsJson;
export function unitTechVisual(id) {
    const entry = visuals[String(id)];
    if (!entry?.groups?.length && !entry?.stance && !entry?.sex)
        return undefined;
    return entry;
}
/** Cada grupo fica com um único nível. Armas, armadura e escudo continuam grupos separados. */
export function effectiveTechTags(groups, selected) {
    const active = new Set(selected);
    for (const group of groups) {
        const highest = group.options
            .filter((option) => active.has(option.tag))
            .sort((a, b) => a.rank - b.rank || a.tag.localeCompare(b.tag))
            .at(-1);
        for (const option of group.options) {
            if (option.tag !== highest?.tag)
                active.delete(option.tag);
        }
    }
    return active;
}
export function projectionUrls(visual, selected, fallback, stance = "hack", sex = "male") {
    if (!visual)
        return fallback ? [fallback] : [];
    const active = effectiveTechTags(visual.groups, selected);
    const urls = [];
    for (const entries of Object.values(visual.pieces)) {
        const tagged = entries.some((entry) => entry.sex);
        const matches = entries.filter((entry) => (!entry.stance || entry.stance === stance) &&
            (!tagged || (entry.sex ?? "male") === sex) &&
            entry.requires.every((tag) => active.has(tag)));
        if (!matches.length)
            continue;
        matches.sort((a, b) => b.requires.length - a.requires.length);
        urls.push(matches[0].url);
    }
    return urls.length ? urls : fallback ? [fallback] : [];
}
export function toggleTechTag(groups, selected, groupId, tag) {
    const group = groups.find((item) => item.id === groupId);
    if (!group)
        return [...selected];
    const next = new Set(selected);
    const wasOn = next.has(tag);
    for (const option of group.options)
        next.delete(option.tag);
    if (!wasOn)
        next.add(tag);
    return [...next];
}
const HERO_MARK = /\((?:heroina|heroine|heroi|hero)\)/i;
const HERO_TYPE = /^(?:her[oó]i|hero|heroine|heroina)\b/i;
function stripDiacritics(value) {
    return value.normalize("NFD").replace(/\p{M}/gu, "");
}
/** Partículas de herói: sufixo no nome ou `tipo` Herói (ex.: Nezha Child/Youth). */
export function isUnitHero(nome, ingles, tipo) {
    if (tipo?.some((item) => HERO_TYPE.test(stripDiacritics((item.type ?? "").trim())))) {
        return true;
    }
    return [nome, ingles].some((value) => {
        if (!value)
            return false;
        return HERO_MARK.test(stripDiacritics(value));
    });
}
