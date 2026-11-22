import { describe, expect, it } from "vitest";

import type { StartTableRow } from "@/data/catalog";
import { resourceDeltasForRows } from "@/lib/startResourceDelta";

function row(
  food: string | null,
  wood: string | null,
  gold: string | null,
  type: string | null = null,
): StartTableRow {
  return { description: "", food, wood, gold, favor: null, pop: null, type };
}

describe("resourceDeltasForRows", () => {
  it("pinta adição e remoção contra a última distribuição, pulando traços e marcos", () => {
    const deltas = resourceDeltasForRows([
      row("4", "-", "-"),
      row("4", "-", "2"),
      row("4", "2", "2"),
      row("9", "2", "2"),
      row("-", "-", "-"),
      row(null, null, null, "blue"),
      row("9", "2", "1"),
      row("9", "5", "1"),
      row(null, null, null, "pink"),
      row("5", "6", "4"),
    ]);

    expect(deltas[0]).toEqual({ food: "up", wood: null, gold: null });
    expect(deltas[1]).toEqual({ food: null, wood: null, gold: "up" });
    expect(deltas[2]).toEqual({ food: null, wood: "up", gold: null });
    expect(deltas[3]).toEqual({ food: "up", wood: null, gold: null });
    expect(deltas[4]).toEqual({ food: null, wood: null, gold: null });
    expect(deltas[5]).toEqual({ food: null, wood: null, gold: null });
    expect(deltas[6]).toEqual({ food: null, wood: null, gold: "down" });
    expect(deltas[7]).toEqual({ food: null, wood: "up", gold: null });
    expect(deltas[8]).toEqual({ food: null, wood: null, gold: null });
    expect(deltas[9]).toEqual({ food: "down", wood: "up", gold: "up" });
  });
});
