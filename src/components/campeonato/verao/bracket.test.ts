import { describe, expect, it } from "vitest";

import { SUMMER_MATCHES, SUMMER_ROUNDS } from "@/components/campeonato/verao/bracket";
import { buildSummerFixtureDrafts, summerFixtureLabel } from "@/components/campeonato/verao/fixtures";
import { SUMMER_DRAW, linkSummerDraw, summerSlotCodes } from "@/components/campeonato/verao/draw";
import { linkSummerPots, SUMMER_POTS } from "@/components/campeonato/verao/pots";

describe("chave do Torneio de Verão", () => {
  it("cobre cada vaga dos potes uma vez", () => {
    const expected = SUMMER_POTS.flatMap((pot) => pot.names.map((_, index) => `${pot.id}${index + 1}`)).sort();
    const used = SUMMER_MATCHES.flatMap((match) => [match.a, match.b])
      .flatMap((slot) => (slot.kind === "seed" ? [slot.code] : []))
      .sort();
    expect(used).toEqual(expected);
  });

  it("liga cada vencedor a um confronto anterior e guarda o 3º lugar", () => {
    const byId = new Map(SUMMER_MATCHES.map((match) => [match.id, match]));
    const winnerRefs = new Map<string, number>();
    const loserRefs = new Map<string, number>();

    for (const match of SUMMER_MATCHES) {
      for (const slot of [match.a, match.b]) {
        if (slot.kind === "seed") continue;
        const source = byId.get(slot.of);
        expect(source, slot.of).toBeTruthy();
        expect(source!.round).toBeLessThan(match.round);
        const bag = slot.kind === "winner" ? winnerRefs : loserRefs;
        bag.set(slot.of, (bag.get(slot.of) ?? 0) + 1);
      }
    }

    for (const match of SUMMER_MATCHES) {
      const winners = winnerRefs.get(match.id) ?? 0;
      const losers = loserRefs.get(match.id) ?? 0;
      if (match.id === "final" || match.id === "third") {
        expect(winners).toBe(0);
        expect(losers).toBe(0);
      } else if (match.id === "sf1" || match.id === "sf2") {
        expect(winners).toBe(1);
        expect(losers).toBe(1);
      } else {
        expect(winners).toBe(1);
        expect(losers).toBe(0);
      }
    }

    expect(SUMMER_MATCHES).toHaveLength(97);
    expect(SUMMER_ROUNDS).toHaveLength(12);
    expect(new Set(SUMMER_MATCHES.map((match) => match.id)).size).toBe(SUMMER_MATCHES.length);
  });

  it("monta uma partida por confronto, com F1 no primeiro jogo", () => {
    const drafts = buildSummerFixtureDrafts();
    expect(drafts).toHaveLength(97);
    const first = drafts.find((draft) => draft.matchId === "f1");
    expect(first?.playerACode).toBe("F1");
    expect(first?.playerBCode).toBe("F2");
    expect(first?.roundLabel).toBe("Pote F");
    expect(summerFixtureLabel(first!)).toBe("Pote F · F1 × F2");
    expect(drafts.filter((draft) => draft.nextMatchId == null).map((draft) => draft.matchId).sort()).toEqual(["final", "third"]);
  });

  it("não sobrepõe confrontos da mesma coluna", () => {
    const rows = new Map<number, number[]>();
    for (const match of SUMMER_MATCHES) {
      const list = rows.get(match.round) ?? [];
      list.push(match.row);
      rows.set(match.round, list);
    }
    for (const list of rows.values()) {
      const sorted = [...list].sort((a, b) => a - b);
      for (let index = 1; index < sorted.length; index += 1) {
        expect(sorted[index] - sorted[index - 1]).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("potes do Torneio de Verão", () => {
  it("liga Veja ao Vega e manda o Carlos de menor elo para F10", () => {
    const { pots } = linkSummerPots([
      { id: "c-low", name: "Carlos", rating: 1137 },
      { id: "c-high", name: "Carlos", rating: 1418 },
      { id: "vega", name: "Vega" },
      { id: "mosca", name: "Mosca_" },
    ]);
    const slots = pots.flatMap((pot) => pot.slots);
    expect(slots.find((slot) => slot.code === "A9")?.player?.id).toBe("vega");
    expect(slots.find((slot) => slot.code === "A1")?.player?.id).toBe("mosca");
    expect(slots.find((slot) => slot.code === "D2")?.player?.id).toBe("c-high");
    expect(slots.find((slot) => slot.code === "F10")?.player?.id).toBe("c-low");
  });

  it("o pote F já foi sorteado e o Carlos de menor elo fica no F1", () => {
    expect(summerSlotCodes()).toHaveLength(97);
    expect(SUMMER_DRAW.F1).toBe("Carlos");
    expect(SUMMER_DRAW.F10).toBe("Dondonees");
    expect(SUMMER_DRAW.E1).toBe("davihakodesh");
    expect(SUMMER_DRAW.E11).toBe("TheVoidIs99");
    expect(SUMMER_DRAW.D1).toBe("Shotokai");
    expect(SUMMER_DRAW.D13).toBe("Carlos");
    expect(SUMMER_DRAW.D24).toBe("Pe-Vermei");
    expect(SUMMER_DRAW.C1).toBeNull();
    const slots = linkSummerDraw([
      { id: "c-low", name: "Carlos", rating: 939 },
      { id: "c-high", name: "Carlos", rating: 1308 },
      { id: "cebo", name: "cebolinha_H4ck3r" },
      { id: "sala", name: "Salahuddin" },
    ]);
    expect(slots.find((slot) => slot.code === "F1")?.player?.id).toBe("c-low");
    expect(slots.find((slot) => slot.code === "D13")?.player?.id).toBe("c-high");
    expect(slots.find((slot) => slot.code === "F7")?.player?.id).toBe("cebo");
    expect(slots.find((slot) => slot.code === "F9")?.player?.id).toBe("sala");
    const override = linkSummerDraw(
      [
        { id: "cebo", name: "cebolinha_H4ck3r" },
        { id: "sala", name: "Salahuddin" },
      ],
      { F1: "Salahuddin", F2: "cebolinha_H4ck3r" },
    );
    expect(override.find((slot) => slot.code === "F1")?.player?.id).toBe("sala");
    expect(override.find((slot) => slot.code === "F2")?.player?.id).toBe("cebo");
  });
});
