/**
 * RR Ponderado para equilíbrio de sorteio/fases:
 * ((rr_atual * 1) + (rr_melhor * 2)) / 3
 *
 * Sem melhor RR conhecido, retorna null (UI mostra "—").
 */
export function computeWeightedRr(rr: number, rrBest: number | null | undefined): number | null {
  if (!Number.isFinite(rr) || rr <= 0) return null;
  if (rrBest == null || !Number.isFinite(rrBest) || rrBest <= 0) return null;
  return Math.round((rr * 1 + rrBest * 2) / 3);
}
