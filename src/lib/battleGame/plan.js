/** Clássica / Heróica / Mítica — ordem do cronograma padrão. */
export const PLAYABLE_ERA_IDS = [2, 3, 4];
/** Padrão: 4 clássica + 4 heróica + 2 mítica. */
export const DEFAULT_ERA_ROUND_COUNTS = [4, 4, 2];
export function buildRoundPlan(counts = DEFAULT_ERA_ROUND_COUNTS) {
    const plan = [];
    let index = 0;
    for (let i = 0; i < PLAYABLE_ERA_IDS.length; i++) {
        const eraId = PLAYABLE_ERA_IDS[i];
        const n = counts[i] ?? 0;
        for (let j = 0; j < n; j++) {
            plan.push({ index, eraId });
            index += 1;
        }
    }
    return plan;
}
/** True se a próxima rodada muda de Era em relação à atual. */
export function willAgeUp(plan, currentRoundIndex) {
    const current = plan[currentRoundIndex];
    const next = plan[currentRoundIndex + 1];
    if (!current || !next)
        return false;
    return next.eraId !== current.eraId;
}
