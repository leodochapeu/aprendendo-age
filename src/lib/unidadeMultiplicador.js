/**
 * `multiplicador` em `unidades_aom.json`: lista estruturada + reconstrução do texto
 * no formato esperado por {@link NotionText} (ícones `:token:`).
 */
import { compareNumericTones, parseGameNumber, } from "@/lib/numericCompare";
const PANTHEON_PT = {
    greeks: "Grego",
    egyptians: "Egípcio",
    norse: "Nórdico",
    atlanteans: "Atlante",
    chinese: "Chinês",
    japanese: "Japonês",
    azteca: "Asteca",
};
/** Rótulo de “tipo” alinhado às categorias do jogo na UI (ex.: Artilharia para arqueiros). */
const TYPE_SLUG_PT = {
    archer: "Artilharia",
    infantry: "Infantaria",
    cavalry: "Cavalaria",
    building: "Construção",
    myth_unit: "Unidade mítica",
    hero: "Herói",
    ship: "Navio",
    siege_ship: "Navio de cerco",
    siege_weapon: "Arma de cerco",
    flying_unit: "Unidade voadora",
    titan: "Titã",
    tower: "Torre",
    wall: "Muralha",
    villager: "Aldeão",
    human_soldier: "Soldado humano",
    close_combat_ship: "Navio de combate corpo a corpo",
    archer_ship: "Navio arqueiro",
};
export function multiplicadorTypeFromIcon(icon) {
    const k = icon.toLowerCase().trim();
    if (!k)
        return "Texto";
    const pant = /^aomr_pantheon_([a-z]+)_icon$/.exec(k);
    if (pant?.[1]) {
        return PANTHEON_PT[pant[1]] ?? pant[1].charAt(0).toUpperCase() + pant[1].slice(1);
    }
    const unit = /^aomr_type_([a-z0-9_]+)_icon$/.exec(k);
    if (unit?.[1]) {
        return TYPE_SLUG_PT[unit[1]] ?? unit[1].replace(/_/g, " ");
    }
    return k.replace(/^aomr_/, "").replace(/_icon$/i, "").replace(/_/g, " ");
}
/** Fallback quando `multiplicador.icon` vem vazio no JSON — resolve pelo rótulo `type`. */
const TYPE_LABEL_TO_ICON = {
    construção: "aomr_type_building_icon",
    construcao: "aomr_type_building_icon",
    building: "aomr_type_building_icon",
    infantaria: "aomr_type_infantry_icon",
    infantry: "aomr_type_infantry_icon",
    cavalaria: "aomr_type_cavalry_icon",
    cavalry: "aomr_type_cavalry_icon",
    artilharia: "aomr_type_archer_icon",
    archer: "aomr_type_archer_icon",
    "unidade mítica": "aomr_type_myth_unit_icon",
    "myth unit": "aomr_type_myth_unit_icon",
    herói: "aomr_type_hero_icon",
    heroi: "aomr_type_hero_icon",
    hero: "aomr_type_hero_icon",
    navio: "aomr_type_ship_icon",
    ship: "aomr_type_ship_icon",
    "navio de cerco": "aomr_type_siege_ship_icon",
    "siege ship": "aomr_type_siege_ship_icon",
    "arma de cerco": "aomr_type_siege_weapon_icon",
    "siege weapon": "aomr_type_siege_weapon_icon",
    "unidade voadora": "aomr_type_flying_unit_icon",
    "flying unit": "aomr_type_flying_unit_icon",
    titã: "aomr_type_titan_icon",
    titan: "aomr_type_titan_icon",
    torre: "aomr_type_tower_icon",
    tower: "aomr_type_tower_icon",
    muralha: "aomr_type_wall_icon",
    wall: "aomr_type_wall_icon",
    aldeão: "aomr_type_villager_icon",
    aldeao: "aomr_type_villager_icon",
    villager: "aomr_type_villager_icon",
    "soldado humano": "aomr_type_human_soldier_icon",
    "human soldier": "aomr_type_human_soldier_icon",
};
export function multiplicadorIconFromType(type) {
    const key = (type ?? "").trim().toLowerCase();
    if (!key)
        return undefined;
    return TYPE_LABEL_TO_ICON[key];
}
/** Ícone do multiplicador: token explícito, ou fallback pelo rótulo `type`. */
export function resolveMultiplicadorIcon(item) {
    const explicit = (item.icon ?? "").trim();
    if (explicit)
        return explicit;
    return multiplicadorIconFromType(item.type);
}
/** Há conteúdo a mostrar (não é lista vazia / ausente). */
export function hasMultiplicadorContent(m) {
    return Array.isArray(m) && m.length > 0;
}
/**
 * Reconstrói o texto no estilo original (tokens `:name:` + sufixos) para render com {@link NotionText}.
 */
export function multiplicadorItemsToNotionText(items) {
    if (!items?.length)
        return "";
    const parts = [];
    for (const it of items) {
        const icon = (it.icon ?? "").trim();
        const value = it.value ?? "";
        if (!icon) {
            parts.push(value);
            continue;
        }
        const tail = formatMultiplicadorTailForNotion(value);
        parts.push(`:${icon}:${tail}`);
    }
    return parts.join(" || ");
}
/** Número canónico (`1.25`) → `1,25x` como no dataset antigo; resto mantém-se. */
export function formatMultiplicadorTailForNotion(value) {
    const v = value.trim();
    if (!v)
        return "";
    if (/^\d+(\.\d+)?$/.test(v)) {
        return `${v.replace(".", ",")}x`;
    }
    return v;
}
/**
 * Extrai um único número para comparação entre unidades (mesmo `type` nos dois lados).
 * Usa o valor completo quando já é parseável; senão tenta `Nx…` ou o primeiro número do texto.
 */
export function parseMultiplicadorCompareNumber(value) {
    const t = (value ?? "").trim();
    if (!t)
        return null;
    const direct = parseGameNumber(t);
    if (direct != null)
        return direct;
    const xHead = /^(\d+(?:[.,]\d+)?)\s*[xX]/.exec(t);
    if (xHead)
        return parseGameNumber(xHead[1]);
    const lead = /^(\d+(?:[.,]\d+)?)/.exec(t);
    if (lead)
        return parseGameNumber(lead[1]);
    return null;
}
/**
 * Pareamento por `type` (FIFO em cada tipo): quando há par no outro lado e ambos os
 * valores resolvem a um número, aplica a mesma lógica que {@link compareNumericTones}
 * (maior = melhor, como DPS / multiplicador de dano).
 */
export function multiplicadorCompareTones(left, right) {
    const toneL = Array.from({ length: left.length }, () => "default");
    const toneR = Array.from({ length: right.length }, () => "default");
    const rightQueues = new Map();
    for (let ri = 0; ri < right.length; ri++) {
        const ty = right[ri].type;
        if (!rightQueues.has(ty))
            rightQueues.set(ty, []);
        rightQueues.get(ty).push(ri);
    }
    for (let li = 0; li < left.length; li++) {
        const q = rightQueues.get(left[li].type);
        if (!q?.length)
            continue;
        const ri = q.shift();
        const nl = parseMultiplicadorCompareNumber(left[li].value);
        const nr = parseMultiplicadorCompareNumber(right[ri].value);
        if (nl == null || nr == null)
            continue;
        const { left: lt, right: rt } = compareNumericTones(nl, nr);
        toneL[li] = lt;
        toneR[ri] = rt;
    }
    return { left: toneL, right: toneR };
}
