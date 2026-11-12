import { describe, expect, it } from "vitest";

import { computeWeightedRr } from "@/lib/weightedRr";

describe("computeWeightedRr", () => {
  it("aplica ((rr * 1) + (melhor * 2)) / 3", () => {
    // ((1089 * 1) + (1408 * 2)) / 3 = 3905 / 3 = 1301.666… → 1302
    expect(computeWeightedRr(1089, 1408)).toBe(1302);
  });

  it("retorna null sem melhor RR", () => {
    expect(computeWeightedRr(1500, null)).toBeNull();
    expect(computeWeightedRr(1500, 0)).toBeNull();
  });
});
