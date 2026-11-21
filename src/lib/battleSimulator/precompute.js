import { simulateBattle } from "./simulateBattle";
function mapWinner(winner) {
    if (winner === "a")
        return "attacker";
    if (winner === "b")
        return "defender";
    return "draw";
}
/**
 * Resolve um confronto didático. Se os multiplicadores não definirem um
 * vencedor, usa o combate completo como desempate por atributos.
 */
export function precomputeBattleResult(attacker, defender, resolveSlug) {
    const attackerSlug = resolveSlug(attacker);
    const defenderSlug = resolveSlug(defender);
    const category = simulateBattle({ unidade: attacker, quantity: 1 }, { unidade: defender, quantity: 1 }, { mode_category_battle: true });
    let winner;
    let mode;
    if (category.mode === "category" && category.winner !== "draw") {
        winner = mapWinner(category.winner);
        mode = "mode_category_battle";
    }
    else {
        const combat = simulateBattle({ unidade: attacker, quantity: 1 }, { unidade: defender, quantity: 1 });
        winner = mapWinner(combat.winner);
        mode = "attributes_fallback";
    }
    return {
        attacker: attackerSlug,
        defender: defenderSlug,
        winner,
        winner_name: winner === "attacker"
            ? attackerSlug
            : winner === "defender"
                ? defenderSlug
                : null,
        mode,
        attacker_id: attacker.id,
        defender_id: defender.id,
    };
}
/**
 * Gera todos os confrontos ordenados A→B. O confronto A→A é omitido por não
 * ter utilidade para consulta e sempre produzir empate/desempate redundante.
 */
export function precomputeAllBattleResults(units, resolveSlug) {
    const results = [];
    for (const attacker of units) {
        for (const defender of units) {
            if (attacker.id === defender.id)
                continue;
            results.push(precomputeBattleResult(attacker, defender, resolveSlug));
        }
    }
    return results;
}
