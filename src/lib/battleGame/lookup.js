export function battlePairKey(attackerId, defenderId) {
    return `${attackerId}|${defenderId}`;
}
export function buildBattleResultIndex(results) {
    const map = new Map();
    for (const result of results) {
        map.set(battlePairKey(result.attacker_id, result.defender_id), result);
    }
    return map;
}
export function lookupBattleResult(index, attackerId, defenderId) {
    return index.get(battlePairKey(attackerId, defenderId)) ?? null;
}
export function mapPlayerOutcome(winner) {
    if (winner === "attacker")
        return "win";
    if (winner === "defender")
        return "loss";
    return "draw";
}
