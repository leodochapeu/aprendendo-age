import { describe, expect, it } from "vitest";

import {
  deusById,
  deusSlugById,
  deuses,
  godpowerById,
  godpowerSlugById,
  tecnologiaIndexByNotionId,
  tecnologiaSlugByIndex,
  tecnologias,
  unidadeById,
  unidadeSlugById,
} from "@/data/catalog";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { buildGodMinorChoices } from "@/lib/godMinorChoices";

const catalog = {
  locale: "pt",
  deusById,
  deusSlugById,
  godpowerById,
  godpowerSlugById,
  tecnologiaIndexByNotionId,
  tecnologiaSlugByIndex,
  tecnologias,
  unidadeById,
  unidadeSlugById,
} as LocaleCatalog;

function board(godName: string) {
  const god = deuses.find((entry) => entry.nome === godName);
  if (!god) throw new Error(`missing ${godName}`);
  return buildGodMinorChoices(god, catalog);
}

describe("buildGodMinorChoices", () => {
  it("na Arcaica mostra o poder e a tecnologia de Zeus, e nas eras seguintes cada deus menor", () => {
    const rows = board("Zeus");
    expect(rows?.map((row) => row.eraId)).toEqual([1, 2, 3, 4]);

    expect(rows?.[0]?.icons?.map((icon) => icon.nome)).toEqual(["Raio", "Ascendência Olímpica"]);

    const classical = rows?.[1]?.minors ?? [];
    expect(classical.map((minor) => minor.portrait.nome)).toEqual(["Atena", "Hermes"]);
    expect(classical[0]?.icons.map((icon) => icon.nome)).toEqual([
      "Restauração",
      "Minotauro",
      "Labirinto de Minos",
      "Égide",
      "Sarissa",
    ]);
    expect(classical[0]?.icons.map((icon) => icon.frame)).toEqual(["power", "myth", "tech", "tech", "tech"]);
  });

  it("não monta a sessão para um deus menor", () => {
    expect(board("Atena")).toBeNull();
  });
});
