import { parseMultiplicadorCompareNumber, resolveMultiplicadorIcon, } from "@/lib/unidadeMultiplicador";
const HUMAN_SOLDIER_TYPES = new Set([
    "infantaria",
    "cavalaria",
    "artilharia",
]);
/** Aliases de rótulo (PT/EN e variações) → id canónico. */
const LABEL_ALIASES = {
    infantaria: "infantaria",
    infantry: "infantaria",
    cavalaria: "cavalaria",
    cavalry: "cavalaria",
    artilharia: "artilharia",
    archer: "artilharia",
    archers: "artilharia",
    "ranged soldier": "artilharia",
    heroi: "heroi",
    herói: "heroi",
    hero: "heroi",
    "unidade mitica": "unidade_mitica",
    "unidade mítica": "unidade_mitica",
    "myth unit": "unidade_mitica",
    mythic: "unidade_mitica",
    myth: "unidade_mitica",
    "soldado humano": "soldado_humano",
    "soldados humanos": "soldado_humano",
    "human soldier": "soldado_humano",
    "human soldiers": "soldado_humano",
    construcao: "construcao",
    construção: "construcao",
    building: "construcao",
    buildings: "construcao",
    aldeao: "aldeao",
    aldeão: "aldeao",
    villager: "aldeao",
    voador: "voador",
    "unidade voadora": "voador",
    "flying unit": "voador",
    flying: "voador",
    barco: "barco",
    navio: "barco",
    ship: "barco",
    ships: "barco",
    cerco: "cerco",
    siege: "cerco",
    "arma de cerco": "cerco",
    "siege weapon": "cerco",
    "anti-construcao": "cerco",
    "anti-construção": "cerco",
    "anti-building": "cerco",
    tita: "tita",
    titã: "tita",
    titan: "tita",
};
/** Ícone AoMR → id canónico. */
const ICON_TO_TYPE = {
    aomr_type_infantry_icon: "infantaria",
    aomr_type_cavalry_icon: "cavalaria",
    aomr_type_archer_icon: "artilharia",
    aomr_type_hero_icon: "heroi",
    aomr_type_myth_unit_icon: "unidade_mitica",
    aomr_type_human_soldier_icon: "soldado_humano",
    aomr_type_building_icon: "construcao",
    aomr_type_villager_icon: "aldeao",
    aomr_type_flying_unit_icon: "voador",
    aomr_type_ship_icon: "barco",
    aomr_type_siege_ship_icon: "barco",
    aomr_type_close_combat_ship_icon: "barco",
    aomr_type_archer_ship_icon: "barco",
    aomr_type_siege_weapon_icon: "cerco",
    crushdamage: "cerco",
    aomr_type_titan_icon: "tita",
};
function normalizeLabel(raw) {
    return raw
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}
/** Resolve um rótulo ou ícone para id canónico. */
export function resolveBattleTypeId(typeLabel, icon) {
    const iconKey = (icon ?? "").trim().toLowerCase();
    if (iconKey && ICON_TO_TYPE[iconKey])
        return ICON_TO_TYPE[iconKey];
    const label = normalizeLabel(typeLabel ?? "");
    if (label && LABEL_ALIASES[label])
        return LABEL_ALIASES[label];
    // Soft/Hard-Counter "Infantaria" etc. em categoria
    for (const [alias, id] of Object.entries(LABEL_ALIASES)) {
        if (label.includes(alias))
            return id;
    }
    return null;
}
/**
 * Tipos efetivos do defensor: tipos declarados + `soldado_humano`
 * quando há Infantaria, Cavalaria ou Artilharia.
 */
export function getDefenderTypeIds(unidade) {
    const ids = new Set();
    for (const item of unidade.tipo ?? []) {
        const id = resolveTipoItem(item);
        if (id)
            ids.add(id);
    }
    let isHumanSoldier = false;
    for (const id of ids) {
        if (HUMAN_SOLDIER_TYPES.has(id)) {
            isHumanSoldier = true;
            break;
        }
    }
    if (isHumanSoldier)
        ids.add("soldado_humano");
    return ids;
}
function resolveTipoItem(item) {
    const icon = (item.icon ?? "").trim() || undefined;
    return resolveBattleTypeId(item.type, icon);
}
function multiplierTargetIds(item) {
    const ids = new Set();
    const icon = resolveMultiplicadorIcon(item);
    const fromIcon = resolveBattleTypeId(item.type, icon);
    if (fromIcon)
        ids.add(fromIcon);
    const fromLabel = resolveBattleTypeId(item.type, null);
    if (fromLabel)
        ids.add(fromLabel);
    return ids;
}
/**
 * Maior multiplicador numérico do atacante compatível com os tipos do defensor.
 * Sem match numérico → fator `1` (neutro).
 */
export function resolveBestMultiplier(attacker, defender) {
    const defenderTypes = getDefenderTypeIds(defender);
    let best = {
        factor: 1,
        matchedType: null,
        multiplierLabel: null,
    };
    let found = false;
    for (const item of attacker.multiplicador ?? []) {
        const factor = parseMultiplicadorCompareNumber(item.value);
        if (factor == null)
            continue;
        const targets = multiplierTargetIds(item);
        let matched = null;
        for (const target of targets) {
            if (defenderTypes.has(target)) {
                matched = target;
                break;
            }
            // Multiplicador "soldado_humano" vs qualquer Inf/Cav/Art
            if (target === "soldado_humano") {
                for (const d of defenderTypes) {
                    if (HUMAN_SOLDIER_TYPES.has(d)) {
                        matched = "soldado_humano";
                        break;
                    }
                }
                if (matched)
                    break;
            }
        }
        if (!matched)
            continue;
        if (!found || factor > best.factor) {
            found = true;
            best = {
                factor,
                matchedType: matched,
                multiplierLabel: item.type,
            };
        }
    }
    return best;
}
export function isHumanSoldierType(id) {
    return HUMAN_SOLDIER_TYPES.has(id);
}
