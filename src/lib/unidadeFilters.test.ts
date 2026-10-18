import { describe, expect, it } from "vitest";

import type { Unidade } from "@/data/catalog";
import {
  countActiveUnitFilters,
  emptyUnitListFilters,
  unidadeMatchesFilters,
  type UnitListFilters,
} from "@/lib/unidadeFilters";

function unit(partial: Partial<Unidade> & Pick<Unidade, "id" | "nome">): Unidade {
  return {
    panteao: [],
    era: [],
    tipo: [],
    icon: "",
    ...partial,
  };
}

const hoplite = unit({
  id: 1,
  nome: "Hoplita",
  panteao: [{ id: 1, nome: "Grego" }],
  era: [{ id: 2, nome: "Clássica" }],
  tipo: [{ type: "Infantaria", icon: "aomr_type_infantry_icon" }],
  pontos_de_vida: 115,
  armadura_anticorte: 40,
  velocidade_movimento: 4.3,
});

function filters(partial: Partial<UnitListFilters> = {}): UnitListFilters {
  return { ...emptyUnitListFilters(), ...partial };
}

describe("unidadeMatchesFilters", () => {
  it("deixa passar tudo quando não há filtro", () => {
    expect(unidadeMatchesFilters(hoplite, emptyUnitListFilters())).toBe(true);
  });

  it("aceita qualquer panteão, era ou categoria selecionados", () => {
    expect(unidadeMatchesFilters(hoplite, filters({ pantheonIds: [1, 2] }))).toBe(true);
    expect(unidadeMatchesFilters(hoplite, filters({ pantheonIds: [2] }))).toBe(false);
    expect(unidadeMatchesFilters(hoplite, filters({ eraIds: [2], pantheonIds: [1] }))).toBe(true);
    expect(
      unidadeMatchesFilters(hoplite, filters({ tipoKeys: ["icon:aomr_type_infantry_icon"] })),
    ).toBe(true);
    expect(
      unidadeMatchesFilters(hoplite, filters({ tipoKeys: ["icon:aomr_type_cavalry_icon"] })),
    ).toBe(false);
  });

  it("combina panteão e categoria", () => {
    expect(
      unidadeMatchesFilters(
        hoplite,
        filters({ pantheonIds: [1], tipoKeys: ["icon:aomr_type_cavalry_icon"] }),
      ),
    ).toBe(false);
  });

  it("compara o número com o operador escolhido", () => {
    const hp = (op: UnitListFilters["advanced"][number]["op"], value: string) =>
      filters({ advanced: [{ id: "hp", field: "pontos_de_vida", op, value }] });

    expect(unidadeMatchesFilters(hoplite, hp("gte", "115"))).toBe(true);
    expect(unidadeMatchesFilters(hoplite, hp("gt", "115"))).toBe(false);
    expect(unidadeMatchesFilters(hoplite, hp("eq", "115"))).toBe(true);
    expect(unidadeMatchesFilters(hoplite, hp("lt", "200"))).toBe(true);
    expect(unidadeMatchesFilters(hoplite, hp("lte", "100"))).toBe(false);
    expect(unidadeMatchesFilters(hoplite, hp("gte", "50,5"))).toBe(true);
    expect(unidadeMatchesFilters(hoplite, hp("eq", "40%"))).toBe(false);
  });

  it("ignora condição incompleta e exclui unidade sem o número", () => {
    expect(
      unidadeMatchesFilters(
        hoplite,
        filters({ advanced: [{ id: "x", field: "", op: "gte", value: "50" }] }),
      ),
    ).toBe(true);
    expect(
      unidadeMatchesFilters(
        hoplite,
        filters({ advanced: [{ id: "x", field: "pontos_de_vida", op: "gte", value: "" }] }),
      ),
    ).toBe(true);
    const semVida = unit({ id: 2, nome: "Sem vida" });
    expect(
      unidadeMatchesFilters(
        semVida,
        filters({ advanced: [{ id: "hp", field: "pontos_de_vida", op: "gte", value: "0" }] }),
      ),
    ).toBe(false);
  });

  it("exige todas as condições numéricas e lê o alias de dano contundente", () => {
    const siege = unit({
      id: 3,
      nome: "Cerco",
      pontos_de_vida: 200,
      dano_contusao: 30,
    });
    expect(
      unidadeMatchesFilters(
        siege,
        filters({
          advanced: [
            { id: "hp", field: "pontos_de_vida", op: "gte", value: "150" },
            { id: "crush", field: "dano_contundente", op: "eq", value: "30" },
          ],
        }),
      ),
    ).toBe(true);
    expect(
      unidadeMatchesFilters(
        siege,
        filters({
          advanced: [
            { id: "hp", field: "pontos_de_vida", op: "gte", value: "150" },
            { id: "speed", field: "velocidade_movimento", op: "gte", value: "4" },
          ],
        }),
      ),
    ).toBe(false);
  });
});

describe("countActiveUnitFilters", () => {
  it("soma seleções e só condições numéricas completas", () => {
    expect(
      countActiveUnitFilters(
        filters({
          pantheonIds: [1],
          eraIds: [2, 3],
          tipoKeys: ["icon:aomr_type_infantry_icon"],
          advanced: [
            { id: "a", field: "pontos_de_vida", op: "gte", value: "50" },
            { id: "b", field: "armadura_anticorte", op: "gt", value: "" },
          ],
        }),
      ),
    ).toBe(5);
  });
});
