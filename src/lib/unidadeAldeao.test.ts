import { describe, expect, it } from "vitest";

import { aldeoes, unidades } from "@/data/catalog";
import { aldeaoIdMatchingUnit, unitIdMatchingAldeao } from "@/lib/unidadeAldeao";

/** Unidade (id) → aldeão da página de Aldeões (id). Heróis sem unidade ficam de fora. */
const UNIT_TO_ALDEAO = new Map<number, number>([
  [1, 1],
  [49, 10],
  [75, 2],
  [76, 6],
  [104, 4],
  [139, 3],
  [140, 7],
  [175, 9],
  [208, 11],
]);

describe("aldeaoIdMatchingUnit", () => {
  it("liga cada unidade de trabalhador à ficha de Aldeões, e nenhuma outra", () => {
    for (const unit of unidades) {
      expect(aldeaoIdMatchingUnit(unit, aldeoes) ?? null).toBe(UNIT_TO_ALDEAO.get(unit.id) ?? null);
    }
  });

  it("o Colono asteca não cai no Plebeu japonês, apesar do nome em português", () => {
    const settler = unidades.find((unit) => unit.id === 208);
    const commoner = unidades.find((unit) => unit.id === 175);
    expect(aldeaoIdMatchingUnit(settler!, aldeoes)).toBe(11);
    expect(aldeaoIdMatchingUnit(commoner!, aldeoes)).toBe(9);
  });

  it("Cidadão herói e Kuafu herói não têm unidade correspondente", () => {
    const matched = new Set([...UNIT_TO_ALDEAO.values()]);
    const unmatched = aldeoes.filter((aldeao) => !matched.has(aldeao.id)).map((aldeao) => aldeao.ingles);
    expect(unmatched).toEqual(["Citizen (Hero)", "Kuafu (Hero)"]);
  });
});

describe("unitIdMatchingAldeao", () => {
  it("volta da ficha de aldeão para a mesma unidade", () => {
    for (const [unitId, aldeaoId] of UNIT_TO_ALDEAO) {
      const aldeao = aldeoes.find((item) => item.id === aldeaoId);
      expect(unitIdMatchingAldeao(aldeao!, unidades)).toBe(unitId);
    }
  });

  it("o Colono asteca volta para o Plebeu asteca, e o Plebeu japonês para a unidade japonesa", () => {
    const colono = aldeoes.find((aldeao) => aldeao.id === 11);
    const plebeu = aldeoes.find((aldeao) => aldeao.id === 9);
    expect(unitIdMatchingAldeao(colono!, unidades)).toBe(208);
    expect(unitIdMatchingAldeao(plebeu!, unidades)).toBe(175);
  });

  it("Cidadão herói e Kuafu herói não apontam para uma unidade", () => {
    for (const ingles of ["Citizen (Hero)", "Kuafu (Hero)"]) {
      const aldeao = aldeoes.find((item) => item.ingles === ingles);
      expect(unitIdMatchingAldeao(aldeao!, unidades)).toBeUndefined();
    }
  });
});
