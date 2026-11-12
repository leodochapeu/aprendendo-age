import { describe, expect, it } from "vitest";

import { computeRaceTrackLayout } from "@/lib/raceTrackLayout";

describe("computeRaceTrackLayout", () => {
  it("afasta o avatar da linha de entrada da divisão", () => {
    const gateClearancePx = 112;
    const avatarRenderPx = 88;
    const layout = computeRaceTrackLayout([{ id: "a", rr: 1810 }], {
      avatarRenderPx,
      gateClearancePx,
    });
    const diamante = layout.markers.find((marker) => marker.tierId === "diamante");
    const avatar = layout.avatars[0];
    expect(diamante).toBeTruthy();
    expect(avatar).toBeTruthy();
    const distancePx = (Math.abs(avatar!.bottomPercent - diamante!.percent) / 100) * layout.laneHeightPx;
    expect(distancePx).toBeGreaterThan(gateClearancePx + avatarRenderPx / 2);
  });
});
