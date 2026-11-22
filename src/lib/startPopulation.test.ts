import { describe, expect, it } from "vitest";

import {
  isHousedPopulation,
  nextPopulation,
  populationSumMismatch,
  villagerColumnSum,
} from "@/lib/startPopulation";

const row = (food: string, wood: string, gold: string, favor: string, pop: string) => ({
  food,
  wood,
  gold,
  favor,
  pop,
});

describe("villagerColumnSum", () => {
  it("soma as colunas numéricas e trata traço como zero", () => {
    expect(villagerColumnSum(row("4", "-", "-", "", ""))).toBe(4);
    expect(villagerColumnSum(row("2", "3", "0", "3", ""))).toBe(8);
    expect(villagerColumnSum(row("-", "-", "-", "-", ""))).toBeNull();
  });
});

describe("nextPopulation", () => {
  it("preenche o primeiro número e preserva o limite de casas", () => {
    const previous = row("4", "-", "-", "", "4/15");
    const next = row("4", "2", "-", "", "4/15");
    expect(nextPopulation(previous, next)).toBe("6/15");
  });

  it("não troca um primeiro número que a pessoa já alterou", () => {
    const previous = row("4", "-", "-", "", "5/15");
    const next = row("4", "2", "-", "", "5/15");
    expect(nextPopulation(previous, next)).toBe("5/15");
    expect(populationSumMismatch(row("4", "2", "-", "", "5/15"))).toBe(6);
  });

  it("não alerta quando o primeiro número é a soma", () => {
    expect(populationSumMismatch(row("4", "2", "1", "", "7/25"))).toBeNull();
  });
});

describe("isHousedPopulation", () => {
  it("reconhece população cheia", () => {
    expect(isHousedPopulation("15/15")).toBe(true);
    expect(isHousedPopulation("15 / 15")).toBe(true);
    expect(isHousedPopulation("9/15")).toBe(false);
    expect(isHousedPopulation("-")).toBe(false);
    expect(isHousedPopulation(null)).toBe(false);
  });
});
