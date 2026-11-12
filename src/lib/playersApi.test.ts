import { describe, expect, it } from "vitest";

import { playerDisplayLabel, type AomRacePlayer } from "@/lib/playersApi";

function player(overrides: Partial<AomRacePlayer>): AomRacePlayer {
  return {
    id: "1",
    displayName: null,
    aomstatsAlias: null,
    logoPath: null,
    aomstatsId: "1",
    aomstatsClan: null,
    clanLinkedTag: null,
    clanLogoPath: null,
    rr: 1000,
    wins: null,
    losses: null,
    winRate: null,
    rank: null,
    snapshotAt: null,
    country: null,
    ...overrides,
  };
}

describe("playerDisplayLabel", () => {
  it("prefere o alias do perfil e ignora a tag de cor do AoM Stats", () => {
    expect(
      playerDisplayLabel(
        player({
          displayName: "Lipolessa",
          aomstatsAlias: "<COLOR=0,1,1,0,0.,4>LIPOLESSA",
        }),
      ),
    ).toBe("Lipolessa");
  });

  it("cai no nome do AoM Stats quando não há alias", () => {
    expect(
      playerDisplayLabel(
        player({
          displayName: "  ",
          aomstatsAlias: "<COLOR=0,1,1,0,0.,4>LIPOLESSA",
        }),
      ),
    ).toBe("LIPOLESSA");
  });
});
