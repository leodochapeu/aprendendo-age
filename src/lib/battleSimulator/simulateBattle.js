import { resolveBestMultiplier } from "./classification";
import { computeDirectionalDamage } from "./damage";
const DEFAULT_MAX_ROUNDS = 10_000;
const EPS = 1e-9;
function normalizeQuantity(quantity) {
    if (quantity == null || !Number.isFinite(quantity) || quantity < 1)
        return 1;
    return Math.floor(quantity);
}
function unitHp(group) {
    return Math.max(0, group.unidade.pontos_de_vida ?? 0);
}
/** Unidades ainda vivas: unidade ferida conta como viva (ceil). */
export function aliveFromHp(remainingHp, hpPerUnit) {
    if (remainingHp <= EPS || hpPerUnit <= 0)
        return 0;
    return Math.ceil(remainingHp / hpPerUnit - EPS);
}
function simulateCategoryBattle(groupA, groupB) {
    const sideA = resolveBestMultiplier(groupA.unidade, groupB.unidade);
    const sideB = resolveBestMultiplier(groupB.unidade, groupA.unidade);
    let winner = "draw";
    if (sideA.factor > sideB.factor)
        winner = "a";
    else if (sideB.factor > sideA.factor)
        winner = "b";
    return {
        mode: "category",
        winner,
        sideA,
        sideB,
    };
}
function simulateCombatBattle(groupA, groupB, maxRounds) {
    const qtyA = normalizeQuantity(groupA.quantity);
    const qtyB = normalizeQuantity(groupB.quantity);
    const hpPerA = unitHp(groupA);
    const hpPerB = unitHp(groupB);
    const damageAtoB = computeDirectionalDamage(groupA.unidade, groupB.unidade);
    const damageBtoA = computeDirectionalDamage(groupB.unidade, groupA.unidade);
    let hpA = hpPerA * qtyA;
    let hpB = hpPerB * qtyB;
    const hpStartA = hpA;
    const hpStartB = hpB;
    const rounds = [];
    let second = 0;
    const dpsA = damageAtoB.effectiveDpsPerUnit;
    const dpsB = damageBtoA.effectiveDpsPerUnit;
    // Impasse: ninguém causa dano (ou ambos sem HP/ataque útil)
    if ((dpsA <= EPS && dpsB <= EPS) || (hpStartA <= EPS && hpStartB <= EPS)) {
        return {
            mode: "combat",
            winner: "stalemate",
            durationSeconds: 0,
            sideA: {
                quantityStart: qtyA,
                quantityEnd: aliveFromHp(hpA, hpPerA),
                hpStart: hpStartA,
                hpEnd: hpA,
                damage: damageAtoB,
            },
            sideB: {
                quantityStart: qtyB,
                quantityEnd: aliveFromHp(hpB, hpPerB),
                hpStart: hpStartB,
                hpEnd: hpB,
                damage: damageBtoA,
            },
            rounds,
        };
    }
    while (second < maxRounds && hpA > EPS && hpB > EPS) {
        const aliveA = aliveFromHp(hpA, hpPerA);
        const aliveB = aliveFromHp(hpB, hpPerB);
        const damageToB = aliveA * dpsA;
        const damageToA = aliveB * dpsB;
        // Impasse mid-fight: ambos vivos mas nenhum causa dano
        if (damageToA <= EPS && damageToB <= EPS) {
            return {
                mode: "combat",
                winner: "stalemate",
                durationSeconds: second,
                sideA: {
                    quantityStart: qtyA,
                    quantityEnd: aliveA,
                    hpStart: hpStartA,
                    hpEnd: hpA,
                    damage: damageAtoB,
                },
                sideB: {
                    quantityStart: qtyB,
                    quantityEnd: aliveB,
                    hpStart: hpStartB,
                    hpEnd: hpB,
                    damage: damageBtoA,
                },
                rounds,
            };
        }
        hpA = Math.max(0, hpA - damageToA);
        hpB = Math.max(0, hpB - damageToB);
        second += 1;
        rounds.push({
            second,
            sideAAlive: aliveFromHp(hpA, hpPerA),
            sideBAlive: aliveFromHp(hpB, hpPerB),
            sideAHp: hpA,
            sideBHp: hpB,
            damageToA,
            damageToB,
        });
    }
    const endA = aliveFromHp(hpA, hpPerA);
    const endB = aliveFromHp(hpB, hpPerB);
    let winner;
    if (hpA > EPS && hpB <= EPS)
        winner = "a";
    else if (hpB > EPS && hpA <= EPS)
        winner = "b";
    else if (hpA <= EPS && hpB <= EPS)
        winner = "draw";
    else
        winner = "stalemate"; // atingiu maxRounds com ambos vivos
    return {
        mode: "combat",
        winner,
        durationSeconds: second,
        sideA: {
            quantityStart: qtyA,
            quantityEnd: endA,
            hpStart: hpStartA,
            hpEnd: hpA,
            damage: damageAtoB,
        },
        sideB: {
            quantityStart: qtyB,
            quantityEnd: endB,
            hpStart: hpStartB,
            hpEnd: hpB,
            damage: damageBtoA,
        },
        rounds,
    };
}
/**
 * Simula o confronto entre dois grupos.
 *
 * - `mode_category_battle: false` (padrão): combate simultâneo por segundo.
 * - `mode_category_battle: true`: vencedor só pelo maior multiplicador compatível.
 */
export function simulateBattle(groupA, groupB, options) {
    const modeCategory = options?.mode_category_battle === true;
    if (modeCategory) {
        return simulateCategoryBattle(groupA, groupB);
    }
    const maxRounds = options?.maxRounds ?? DEFAULT_MAX_ROUNDS;
    return simulateCombatBattle(groupA, groupB, maxRounds);
}
