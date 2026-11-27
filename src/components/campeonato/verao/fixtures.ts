import { SUMMER_MATCHES, SUMMER_ROUNDS, type SummerMatch, type SummerSlot } from "@/components/campeonato/verao/bracket";

export const SUMMER_STAGE_NAME = "Chaveamento";

export type SummerFixtureSection = "winners" | "losers" | "grand_final";

export type SummerFixtureDraft = {
  matchId: string;
  roundLabel: string;
  roundIndex: number;
  slotIndex: number;
  section: SummerFixtureSection;
  playerACode: string | null;
  playerBCode: string | null;
  feederA: string | null;
  feederB: string | null;
  nextMatchId: string | null;
  nextSlot: "A" | "B" | null;
  loserMatchId: string | null;
  loserSlot: "A" | "B" | null;
};

export function summerSlotIndexes() {
  const groups = new Map<number, SummerMatch[]>();
  for (const match of SUMMER_MATCHES) {
    const list = groups.get(match.round) ?? [];
    list.push(match);
    groups.set(match.round, list);
  }
  const slotOf = new Map<string, number>();
  for (const list of groups.values()) {
    list.sort((a, b) => a.row - b.row || a.id.localeCompare(b.id));
    list.forEach((match, index) => slotOf.set(match.id, index));
  }
  return slotOf;
}

function roundTitle(match: SummerMatch) {
  if (match.badge === "third") return "3º lugar";
  if (match.badge === "final") return "Final";
  return SUMMER_ROUNDS[match.round]?.name ?? "Chave";
}

export function summerFixtureLabel(draft: Pick<SummerFixtureDraft, "roundLabel" | "playerACode" | "playerBCode">) {
  const codes = [draft.playerACode, draft.playerBCode].filter((code): code is string => Boolean(code));
  if (codes.length === 0) return draft.roundLabel;
  return `${draft.roundLabel} · ${codes.join(" × ")}`;
}

function feederLabel(slot: SummerSlot, byId: Map<string, SummerMatch>) {
  if (slot.kind === "seed") return null;
  const source = byId.get(slot.of);
  const name = source ? roundTitle(source) : "chave";
  return slot.kind === "winner" ? `Vencedor · ${name}` : `Perdedor · ${name}`;
}

/** Confrontos do chaveamento, prontos para virar partidas sem data. */
export function buildSummerFixtureDrafts(): SummerFixtureDraft[] {
  const byId = new Map(SUMMER_MATCHES.map((match) => [match.id, match]));
  const slotOf = summerSlotIndexes();
  const next = new Map<string, { id: string; slot: "A" | "B" }>();
  const loser = new Map<string, { id: string; slot: "A" | "B" }>();

  for (const match of SUMMER_MATCHES) {
    for (const side of ["a", "b"] as const) {
      const slot = match[side];
      const target = { id: match.id, slot: side === "a" ? "A" as const : "B" as const };
      if (slot.kind === "winner") next.set(slot.of, target);
      if (slot.kind === "loser") loser.set(slot.of, target);
    }
  }

  return SUMMER_MATCHES.map((match) => ({
    matchId: match.id,
    roundLabel: roundTitle(match),
    roundIndex: match.round,
    slotIndex: slotOf.get(match.id) ?? 0,
    section: match.badge === "third" ? "losers" : match.badge === "final" ? "grand_final" : "winners",
    playerACode: match.a.kind === "seed" ? match.a.code : null,
    playerBCode: match.b.kind === "seed" ? match.b.code : null,
    feederA: match.a.kind === "seed" ? null : feederLabel(match.a, byId),
    feederB: match.b.kind === "seed" ? null : feederLabel(match.b, byId),
    nextMatchId: next.get(match.id)?.id ?? null,
    nextSlot: next.get(match.id)?.slot ?? null,
    loserMatchId: loser.get(match.id)?.id ?? null,
    loserSlot: loser.get(match.id)?.slot ?? null,
  }));
}
