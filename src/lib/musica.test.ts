import { describe, expect, it } from "vitest";

import faixasJson from "@/data/music_tracks.json";
import { ganhoDoPercentual } from "@/lib/musica";

describe("volume da música", () => {
  it("deixa 50% no antigo 20% e 100% no antigo 50%", () => {
    expect(ganhoDoPercentual(0)).toBe(0);
    expect(ganhoDoPercentual(50)).toBeCloseTo(0.2, 5);
    expect(ganhoDoPercentual(100)).toBeCloseTo(0.5, 5);
  });
});

describe("trilha extraída do jogo", () => {
  it("lista faixas únicas, com título e caminho de ogg", () => {
    const ids = new Set<string>();
    const srcs = new Set<string>();
    expect(faixasJson.length).toBeGreaterThan(10);
    for (const faixa of faixasJson) {
      expect(ids.has(faixa.id)).toBe(false);
      expect(srcs.has(faixa.src)).toBe(false);
      ids.add(faixa.id);
      srcs.add(faixa.src);
      expect(faixa.title.length).toBeGreaterThan(0);
      expect(faixa.src).toBe(`/assets/music/${faixa.id}.ogg`);
      expect(faixa.durationSec).toBeGreaterThan(20);
    }
  });
});
