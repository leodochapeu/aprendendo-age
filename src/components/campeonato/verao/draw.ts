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
 * Com dois jogadores do mesmo nome, o de maior elo fica no pote anterior (A antes de F).
 */
const DRAWN_SLOTS: Record<string, string> = {
  F1: "Carlos",
  F2: "Takuje",
  F3: "Hades",
  F4: "Felipão",
  F5: "Makise_Kurisu_00",
  F6: "NHONHO",
  F7: "cebolinha_H4ck3r",
  F8: "Tabuada",
  F9: "Salahuddin",
  F10: "Dondonees",
  E1: "davihakodesh",
  E2: "Jethro Tull",
  E3: "HermesAOM",
  E4: "nemui_kuma",
  E5: "Bo2Paraizo",
  E6: "areczin",
  E7: "drcaiohistoriador (YT)",
  E8: "KyllByo",
  E9: "MinhaMae~",
  E10: "marcelo.f",
  E11: "TheVoidIs99",
};

export const SUMMER_DRAW: Record<string, string | null> = {
  ...Object.fromEntries(summerSlotCodes().map((code) => [code, null])),
  ...DRAWN_SLOTS,
};

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
  const pools = new Map<string, Map<SummerPotId, SummerPotPlayer[]>>();
  const leftovers = new Map<string, SummerPotPlayer[]>();
  for (const [key, list] of buckets) {
    const sorted = [...list].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    const byPot = new Map<SummerPotId, SummerPotPlayer[]>();
    let cursor = 0;
    for (const id of ["A", "B", "C", "D", "E", "F"] as SummerPotId[]) {
      const pot = SUMMER_POTS.find((item) => item.id === id);
      const count = (pot?.names ?? []).filter((item) => nameKey(item) === key).length;
      byPot.set(id, sorted.slice(cursor, cursor + count));
      cursor += count;
    }
    pools.set(key, byPot);
    leftovers.set(key, sorted.slice(cursor));
  }

  const assigned = new Map<string, SummerPotPlayer | null>();
  for (const code of codes) {
    const sheetName = draw[code];
    if (!sheetName) {
      assigned.set(code, null);
      continue;
    }
    const key = nameKey(sheetName);
    const pot = code.charAt(0) as SummerPotId;
    const fromPot = pools.get(key)?.get(pot)?.find((item) => !used.has(item.id));
    const fromLeftover = leftovers.get(key)?.find((item) => !used.has(item.id));
    const fromAny = buckets.get(key)?.find((item) => !used.has(item.id));
    const player = fromPot ?? fromLeftover ?? fromAny ?? null;
    if (player) used.add(player.id);
    assigned.set(code, player);
  }

  return codes.map((code) => ({
    code,
    name: draw[code]?.trim() || null,
    player: assigned.get(code) ?? null,
  }));
}
