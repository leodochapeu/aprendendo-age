import { resolveBattleTypeId } from "@/lib/battleSimulator/classification";
/** Bônus fixo de unidades de artilharia. O alcance em si não entra na conta. */
export const ATTRIBUTE_STRENGTH_RANGED_BONUS = 50;
function n(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
export function unitIsArtillery(tipo) {
    return (tipo ?? []).some((item) => resolveBattleTypeId(item.type, item.icon) === "artilharia");
}
/**
 * Força atributos =
 *   PV + armadura anticorte + armadura antiperfurante + velocidade + DPS
 *   + 50 se for artilharia
 *   − tempo de treino − (comida + madeira + ouro) / 2 − população
 */
export function attributeStrengthBreakdown(unit) {
    const food = n(unit.comida);
    const wood = n(unit.madeira);
    const gold = n(unit.ouro);
    const resourceSum = food + wood + gold;
    const resourceHalf = resourceSum / 2;
    const artillery = unitIsArtillery(unit.tipo);
    const artilleryBonus = artillery ? ATTRIBUTE_STRENGTH_RANGED_BONUS : 0;
    const terms = [
        { id: "hitPoints", amount: n(unit.pontos_de_vida) },
        { id: "hackArmor", amount: n(unit.armadura_anticorte) },
        { id: "pierceArmor", amount: n(unit.armadura_antiperfurante) },
        { id: "moveSpeed", amount: n(unit.velocidade_movimento) },
        { id: "dps", amount: n(unit.dps) },
        { id: "artilleryBonus", amount: artilleryBonus },
        { id: "trainTime", amount: -n(unit.tempo_treinamento) },
        { id: "resourceHalf", amount: -resourceHalf },
        { id: "population", amount: -n(unit.populacao) },
    ];
    const total = terms.reduce((sum, term) => sum + term.amount, 0);
    return { terms, total, artillery, food, wood, gold, resourceSum };
}
