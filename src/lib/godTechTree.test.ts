import { describe, expect, it } from "vitest";

import {
  construcaoSlugById,
  construcoes,
  deuses,
  tecnologias,
  tecnologiaSlugByIndex,
  unidades,
  unidadeSlugById,
} from "@/data/catalog";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { buildGodTechTree } from "@/lib/godTechTree";

const catalog = {
  locale: "pt",
  construcoes,
  tecnologias,
  unidades,
  construcaoSlugById,
  unidadeSlugById,
  tecnologiaSlugByIndex,
} as LocaleCatalog;

function row(godName: string, buildingId: number) {
  const god = deuses.find((entry) => entry.nome === godName);
  if (!god) throw new Error(`missing ${godName}`);
  const tree = buildGodTechTree(god, catalog);
  const found = tree.find((entry) => entry.buildingId === buildingId);
  if (!found) throw new Error(`${godName} missing building ${buildingId}`);
  return { tree, found };
}

function names(godName: string, buildingId: number, age: number): string[] {
  return row(godName, buildingId).found.cells[age]?.items.map((item) => item.nome) ?? [];
}

describe("buildGodTechTree", () => {
  it("monta o templo e o centro urbano de Zeus por era, sem herói no templo", () => {
    const temple = row("Zeus", 21).found;
    expect(temple.cells[0]?.building?.nome).toBe("Templo");
    expect(temple.cells[1]?.building).toBeUndefined();
    expect(names("Zeus", 21, 0)).toEqual(expect.arrayContaining(["Pégaso", "Ascendência Olímpica"]));
    expect(names("Zeus", 21, 0)).not.toContain("Jasão (Herói)");
    expect(names("Zeus", 21, 1)).toEqual(expect.arrayContaining(["Minotauro", "Centauro", "Labirinto de Minos"]));
    expect(names("Zeus", 21, 1)).not.toContain("Hércules (Herói)");

    const town = row("Zeus", 1).found;
    expect(town.cells[0]?.building?.nome).toBe("Centro Urbano");
    expect(names("Zeus", 1, 0)).toEqual(expect.arrayContaining(["Aldeão", "Jasão (Herói)"]));
    expect(names("Zeus", 1, 3)).toContain("Belerofonte (Herói)");
  });

  it("coloca a academia na era clássica e a linha econômica no armazém", () => {
    const academy = row("Zeus", 35).found;
    expect(academy.cells[0]?.building).toBeUndefined();
    expect(academy.cells[1]?.building?.nome).toBe("Academia Militar");
    expect(names("Zeus", 35, 1)).toContain("Hoplita");
    expect(names("Zeus", 14, 0)).toEqual(expect.arrayContaining(["Machado de Mão", "Picareta"]));
    expect(names("Zeus", 14, 2)).toContain("Arco de Serra");
  });

  it("fica com a maravilha de Zeus e o mirmidão na fortaleza", () => {
    const { tree } = row("Zeus", 57);
    expect(tree.some((entry) => entry.buildingId === 81)).toBe(true);
    expect(tree.some((entry) => entry.buildingId === 82)).toBe(false);
    expect(names("Zeus", 57, 0)).not.toContain("Jasão (Herói)");
    expect(names("Zeus", 57, 0)).not.toContain("Ascendência Olímpica");
    expect(names("Zeus", 57, 3)).toContain("Mirmidão");
  });

  it("no deus menor mostra só as unidades e tecnologias dele", () => {
    const athena = buildGodTechTree(deuses.find((entry) => entry.nome === "Atena")!, catalog);
    const temple = athena.find((entry) => entry.buildingId === 21);
    const all = temple?.cells.flatMap((cell) => cell.items.map((item) => item.nome)) ?? [];
    expect(all).toContain("Minotauro");
    expect(all).not.toContain("Hoplita");
    expect(all).not.toContain("Pégaso");
    const academy = athena.find((entry) => entry.buildingId === 35);
    const academyNames = academy?.cells.flatMap((cell) => cell.items.map((item) => item.nome)) ?? [];
    expect(academyNames).toEqual(expect.arrayContaining(["Égide", "Sarissa"]));
    expect(academyNames).not.toContain("Hoplita");
  });
});
