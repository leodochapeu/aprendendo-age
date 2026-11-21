import deusesEn from "@/data/locale/en/deuses_aom.json";
import mapasEn from "@/data/locale/en/mapas.json";
import deusesPt from "@/data/locale/pt/deuses_aom.json";
import mapasPt from "@/data/locale/pt/mapas.json";
import { getDeusAssetUrl } from "@/lib/deusAssetUrl";
const MAP_BG = new Set([
    "anatolia",
    "coracaodetenochtitlan",
    "elisio",
    "estepe",
    "florestadastrevas",
    "lagofantasma",
    "mediterraneo",
    "muspelheim",
    "oasis",
    "pantano",
    "savana",
    "senhogahara",
    "tundra",
    "vausdonilo",
]);
const MAP_ALIAS = {
    steppe: "estepe",
    elysium: "elisio",
    ghostlake: "lagofantasma",
    mediterranean: "mediterraneo",
    marsh: "pantano",
    savannah: "savana",
    nileshallows: "vausdonilo",
    muspellheim: "muspelheim",
    senjogahara: "senhogahara",
    mirkwood: "florestadastrevas",
    ocoracaodetenochtitlan: "coracaodetenochtitlan",
    tenochtitlansheart: "coracaodetenochtitlan",
};
const GOD_JPG = new Set([
    "amaterasu",
    "cronos",
    "demeter",
    "freyr",
    "fuxi",
    "gaia",
    "hades",
    "huitzilopochtli",
    "isis",
    "loki",
    "nuwa",
    "odin",
    "poseidon",
    "quetzalcoatl",
    "ra",
    "set",
    "shennong",
    "susanoo",
    "tezcatlipoca",
    "thor",
    "tsukuyomi",
    "urano",
    "zeus",
]);
const GOD_ALIAS = {
    oranos: "urano",
    ouranos: "urano",
    kronos: "cronos",
};
function norm(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}
const deusByKey = new Map();
for (const deus of [...deusesPt, ...deusesEn]) {
    const key = norm(deus.nome);
    if (key && !deusByKey.has(key))
        deusByKey.set(key, deus);
}
const mapByKey = new Map();
for (let index = 0; index < mapasPt.length; index += 1) {
    const pt = mapasPt[index];
    const en = mapasEn[index];
    const art = { pt: pt?.nome ?? "", en: en?.nome || pt?.ingles || pt?.nome || "" };
    for (const label of [pt?.nome, pt?.ingles, en?.nome]) {
        const key = norm(label ?? "");
        if (key && !mapByKey.has(key))
            mapByKey.set(key, art);
    }
}
function mapFile(name) {
    const key = norm(name);
    if (!key)
        return null;
    const file = MAP_ALIAS[key] ?? key;
    return MAP_BG.has(file) ? file : null;
}
export function resolveMatchMap(name, locale) {
    const key = norm(name);
    const art = mapByKey.get(key);
    const file = mapFile(name) ?? (art ? mapFile(art.pt) ?? mapFile(art.en) : null);
    const title = art ? (locale === "en" ? art.en : art.pt) : name.trim();
    return {
        title,
        bg: file ? `/assets/mapas-bg/${file}.jpeg` : null,
    };
}
export function resolveGodArt(name) {
    const key = norm(name);
    if (!key)
        return { label: "", src: null };
    const file = GOD_ALIAS[key] ?? key;
    const deus = deusByKey.get(key) ?? deusByKey.get(file);
    const jpg = GOD_JPG.has(file) ? `/assets/gods-animated/${file}.jpg` : null;
    const icon = deus ? getDeusAssetUrl(deus) ?? null : null;
    return {
        label: deus?.nome || name.trim(),
        src: jpg ?? icon,
    };
}
