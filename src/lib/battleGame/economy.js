export const INITIAL_FAVOR = 10;
export const FAVOR_PER_WIN = 10;
export const FAVOR_EFFECT_COSTS = {
    revealDefenderCategory: 20,
    revealDeckUnitCategory: 10,
    unlockPreviousAgeUnits: 30,
};
export function canPurchaseFavorEffect(favor, effect) {
    return favor >= FAVOR_EFFECT_COSTS[effect];
}
export function purchaseFavorEffect(favor, effect) {
    if (!canPurchaseFavorEffect(favor, effect))
        return null;
    return favor - FAVOR_EFFECT_COSTS[effect];
}
export function rewardFavor(favor, outcome) {
    return outcome === "win" ? favor + FAVOR_PER_WIN : favor;
}
/** Sorteia até `count` IDs distintos sem alterar o array original. */
export function pickRandomUniqueIds(ids, count, rng = Math.random) {
    const pool = [...new Set(ids)];
    const amount = Math.max(0, Math.min(Math.floor(count), pool.length));
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, amount);
}
