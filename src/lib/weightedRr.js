/**
 * RR Ponderado para equilíbrio de sorteio/fases:
 * ((rr_atual * 1) + (rr_melhor * 2)) / 3
 *
 * Sem melhor RR conhecido, usa o RR atual como piso (peak ≥ atual).
 */
export function computeWeightedRr(rr, rrBest) {
    if (!Number.isFinite(rr) || rr <= 0)
        return null;
    const best = rrBest != null && Number.isFinite(rrBest) && rrBest > 0 ? rrBest : rr;
    return Math.round((rr * 1 + best * 2) / 3);
}
