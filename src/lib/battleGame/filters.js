import { firstNumId } from "@/lib/entityRefs";
import { getDefenderTypeIds } from "@/lib/battleSimulator/classification";
/**
 * Unidades humanas (não-herói) disponíveis na Era atual (filtro cumulativo):
 * Clássica → era 2; Heróica → 2–3; Mítica → 2–4.
 * Arcaica (1) e Maravilha (5) ficam de fora.
 */
export function isUnitEligibleForCurrentEra(unit, currentEraId) {
    const eraId = firstNumId(unit.era);
    if (eraId == null)
        return false;
    return eraId >= 2 && eraId <= currentEraId;
}
/** Unidade humana disponível, mas pertencente a uma Era anterior à atual. */
export function isUnitFromPreviousEra(unit, currentEraId) {
    const eraId = firstNumId(unit.era);
    if (eraId == null)
        return false;
    return eraId >= 2 && eraId < currentEraId;
}
export function isMythUnit(unit) {
    return getDefenderTypeIds(unit).has("unidade_mitica");
}
export function isHeroUnit(unit) {
    return getDefenderTypeIds(unit).has("heroi");
}
/** Apenas Infantaria, Cavalaria ou Artilharia; exclui combinações com Herói/Mítica. */
export function isHumanSoldierUnit(unit) {
    const types = getDefenderTypeIds(unit);
    return (types.has("soldado_humano") &&
        !types.has("heroi") &&
        !types.has("unidade_mitica"));
}
/** Deck do atacante: apenas soldados humanos cumulativos do panteão. */
export function filterAttackerPool(units, pantheonId, currentEraId) {
    return units.filter((u) => firstNumId(u.panteao) === pantheonId &&
        isHumanSoldierUnit(u) &&
        isUnitEligibleForCurrentEra(u, currentEraId));
}
/** Pool da máquina: apenas soldados humanos cumulativos de qualquer panteão. */
export function filterDefenderPool(units, currentEraId, usedDefenderIds) {
    const used = new Set(usedDefenderIds);
    const fresh = units.filter((u) => isHumanSoldierUnit(u) &&
        isUnitEligibleForCurrentEra(u, currentEraId) &&
        !used.has(u.id));
    if (fresh.length > 0)
        return fresh;
    // Se esgotou opções inéditas, permite repetir.
    return units.filter((u) => isHumanSoldierUnit(u) &&
        isUnitEligibleForCurrentEra(u, currentEraId));
}
