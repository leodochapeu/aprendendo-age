import { describe, expect, it } from "vitest";

import {
  categoriesForEra,
  categoryBeats,
  resolveCategoryChoice,
} from "./categoryDeck";

describe("categoryDeck", () => {
  it("clássica só tem o triângulo de soldados", () => {
    expect(categoriesForEra(2).map((item) => item.id)).toEqual(["infantaria", "cavalaria", "artilharia"]);
  });

  it("heróica mantém os soldados e acrescenta o triângulo mítico", () => {
    expect(categoriesForEra(3).map((item) => item.id)).toEqual([
      "infantaria",
      "cavalaria",
      "artilharia",
      "unidade_mitica",
      "soldado_humano",
      "heroi",
    ]);
  });

  it("mítica é o ciclo dos barcos", () => {
    expect(categoriesForEra(4).map((item) => item.id)).toEqual([
      "navio_flecheiro",
      "navio_corpo",
      "navio_cerco",
    ]);
  });

  it("cada categoria vence a próxima do ciclo e empata consigo", () => {
    expect(resolveCategoryChoice("infantaria", "cavalaria")).toBe("win");
    expect(resolveCategoryChoice("cavalaria", "artilharia")).toBe("win");
    expect(resolveCategoryChoice("artilharia", "infantaria")).toBe("win");
    expect(resolveCategoryChoice("unidade_mitica", "soldado_humano")).toBe("win");
    expect(resolveCategoryChoice("soldado_humano", "heroi")).toBe("win");
    expect(resolveCategoryChoice("heroi", "unidade_mitica")).toBe("win");
    expect(resolveCategoryChoice("navio_flecheiro", "navio_corpo")).toBe("win");
    expect(resolveCategoryChoice("navio_corpo", "navio_cerco")).toBe("win");
    expect(resolveCategoryChoice("navio_cerco", "navio_flecheiro")).toBe("win");
    expect(resolveCategoryChoice("infantaria", "infantaria")).toBe("draw");
    expect(resolveCategoryChoice("cavalaria", "infantaria")).toBe("loss");
    expect(categoryBeats("heroi")).toBe("unidade_mitica");
  });
});
