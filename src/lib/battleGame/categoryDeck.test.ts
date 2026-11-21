import { describe, expect, it } from "vitest";

import {
  CATEGORY_EXAMPLE_UNIT_ID,
  categoriesForEra,
  categoryBeats,
  resolveCategoryChoice,
} from "./categoryDeck";

describe("categoryDeck", () => {
  it("clássica é o triângulo mítico", () => {
    expect(categoriesForEra(2).map((item) => item.id)).toEqual(["unidade_mitica", "soldado_humano", "heroi"]);
  });

  it("heróica troca para infantaria, cavalaria e artilharia", () => {
    expect(categoriesForEra(3).map((item) => item.id)).toEqual(["infantaria", "cavalaria", "artilharia"]);
  });

  it("mítica é o ciclo dos barcos", () => {
    expect(categoriesForEra(4).map((item) => item.id)).toEqual([
      "navio_flecheiro",
      "navio_corpo",
      "navio_cerco",
    ]);
  });

  it("cada categoria tem um exemplo grego", () => {
    expect(CATEGORY_EXAMPLE_UNIT_ID).toEqual({
      infantaria: 10,
      cavalaria: 11,
      artilharia: 12,
      soldado_humano: 10,
      unidade_mitica: 22,
      heroi: 4,
      navio_flecheiro: 250,
      navio_corpo: 251,
      navio_cerco: 252,
    });
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
