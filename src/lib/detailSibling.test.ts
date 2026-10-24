import { describe, expect, it } from "vitest";

import { getLocaleCatalog } from "@/data/catalogLocale";
import { AZTEC_PANTEON_ID } from "@/lib/astecasCatalog";
import { isHiddenFamilyMember } from "@/lib/buildingFamilies";
import { circularSiblingIds, detailIdsForScope, orderedDetailIds } from "@/lib/detailSibling";

describe("circularSiblingIds", () => {
  const ids = [1, 2, 5];

  it("avança e recua na ordem do id, com volta nas pontas", () => {
    expect(circularSiblingIds(ids, 1)).toEqual({ prev: 5, next: 2 });
    expect(circularSiblingIds(ids, 2)).toEqual({ prev: 1, next: 5 });
    expect(circularSiblingIds(ids, 5)).toEqual({ prev: 2, next: 1 });
  });

  it("não navega com um único item ou um id fora da lista", () => {
    expect(circularSiblingIds([1], 1)).toBeNull();
    expect(circularSiblingIds(ids, 9)).toBeNull();
  });
});

describe("detailIdsForScope", () => {
  const catalog = getLocaleCatalog("pt");

  it("ordena a seção inteira pelo id e deixa construções ocultas de fora", () => {
    const gods = orderedDetailIds(catalog, "deuses", "all");
    expect(gods[0]).toBe(1);
    expect(gods.at(-1)).toBe(Math.max(...catalog.deuses.map((d) => d.id)));
    for (let i = 1; i < gods.length; i++) expect(gods[i]!).toBeGreaterThan(gods[i - 1]!);

    const buildings = orderedDetailIds(catalog, "construcoes", "all");
    expect(buildings.some((id) => isHiddenFamilyMember(id))).toBe(false);
  });

  it("vindo de Astecas, deuses e mapas ficam no recorte da página", () => {
    const gods = detailIdsForScope(
      catalog,
      "deuses",
      orderedDetailIds(catalog, "deuses", AZTEC_PANTEON_ID)[0]!,
      AZTEC_PANTEON_ID,
    );
    expect(gods.length).toBeGreaterThan(1);
    expect(gods.length).toBeLessThan(catalog.deuses.length);

    const maps = detailIdsForScope(
      catalog,
      "mapas",
      orderedDetailIds(catalog, "mapas", AZTEC_PANTEON_ID)[0]!,
      AZTEC_PANTEON_ID,
    );
    expect(maps.length).toBeGreaterThan(1);
    expect(maps.length).toBeLessThan(catalog.mapas.length);
  });

  it("uma ficha fora do recorte asteca usa a lista inteira", () => {
    const all = orderedDetailIds(catalog, "deuses", "all");
    const aztec = new Set(orderedDetailIds(catalog, "deuses", AZTEC_PANTEON_ID));
    const outsider = all.find((id) => !aztec.has(id));
    expect(outsider).toBeDefined();
    expect(detailIdsForScope(catalog, "deuses", outsider!, AZTEC_PANTEON_ID)).toEqual(all);
  });
});
