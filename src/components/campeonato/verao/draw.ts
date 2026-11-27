import { SUMMER_POTS, nameKey, type SummerPotId, type SummerPotPlayer } from "@/components/campeonato/verao/pots";

const SLOT_POTS: SummerPotId[] = ["F", "E", "D", "C", "B", "A"];

/** Códigos das vagas, na ordem em que a chave joga: F1…F10, E1…, até A12. */
export function summerSlotCodes() {
  return SLOT_POTS.flatMap((id) => {
    const pot = SUMMER_POTS.find((item) => item.id === id);
    return (pot?.names ?? []).map((_, index) => `${id}${index + 1}`);
  });
}

/**
 * Sorteio das vagas do chaveamento.
 * Troque `null` pelo nome do inscrito. A chave lê estes nomes;
 * as partidas geradas são atualizadas no mesmo passo.
 * Com dois jogadores do mesmo nome, o de maior elo ocupa a vaga do pote anterior (A antes de F).
 */
export const SUMMER_DRAW: Record<string, string | null> = Object.fromEntries(summerSlotCodes().map((code) => [code, null]));

export type SummerDrawSlot = {
  code: string;
  name: string | null;
  player: SummerPotPlayer | null;
};

function slotRank(code: string) {
  const letter = code.charAt(0);
  const index = ["A", "B", "C", "D", "E", "F"].indexOf(letter);
  return index * 100 + Number(code.slice(1));
}

/** Liga cada vaga ao inscrito sorteado. Vaga null fica sem jogador. */
export function linkSummerDraw(players: SummerPotPlayer[], draw: Record<string, string | null> = SUMMER_DRAW): SummerDrawSlot[] {
  const buckets = new Map<string, SummerPotPlayer[]>();
  for (const player of players) {
    const key = nameKey(player.name);
    const list = buckets.get(key) ?? [];
    list.push(player);
    buckets.set(key, list);
  }
  for (const list of buckets.values()) {
    list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  }

  const used = new Set<string>();
  const codes = Object.keys(draw).sort((a, b) => slotRank(a) - slotRank(b));
  const assigned = new Map<string, SummerPotPlayer | null>();
  for (const code of codes) {
    const sheetName = draw[code];
    if (!sheetName) {
      assigned.set(code, null);
      continue;
    }
    const list = buckets.get(nameKey(sheetName)) ?? [];
    const player = list.find((item) => !used.has(item.id)) ?? null;
    if (player) used.add(player.id);
    assigned.set(code, player);
  }

  return codes.map((code) => ({
    code,
    name: draw[code]?.trim() || null,
    player: assigned.get(code) ?? null,
  }));
}
