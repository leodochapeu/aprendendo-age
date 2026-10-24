import { familyMemberForPantheon, isHiddenFamilyMember } from "@/lib/buildingFamilies";
import { firstNumId, type EntityNumRef } from "@/lib/entityRefs";

/** Panteão Asteca em `panteoes.json`. */
export const AZTEC_PANTEON_ID = 7;

/** Origem dos mapas da página Astecas. */
export const MAPAS_OBSIDIAN_ORIGEM = "AoM: Obsidian Mirror (2026)";

export function isPantheonRef(panteao: EntityNumRef[] | null | undefined, pantheonId: number): boolean {
  return firstNumId(panteao) === pantheonId;
}

export function isAztecPantheon(panteao: EntityNumRef[] | null | undefined): boolean {
  return isPantheonRef(panteao, AZTEC_PANTEON_ID);
}

export function isAztecDeus(d: { panteao?: EntityNumRef[] | null }): boolean {
  return isAztecPantheon(d.panteao);
}

export function isAztecGodpower(g: { panteao?: EntityNumRef[] | null }): boolean {
  return isAztecPantheon(g.panteao);
}

export function isAztecAldeao(a: { panteao?: EntityNumRef[] | null }): boolean {
  return isAztecPantheon(a.panteao);
}

export function isAztecUnidade(u: { panteao?: EntityNumRef[] | null }): boolean {
  return isAztecPantheon(u.panteao);
}

/** Ficha visível do panteão ou a variante da família daquele panteão. */
export function isPantheonConstrucao(c: { id: number; panteao_id?: number | null }, pantheonId: number): boolean {
  return (
    !isHiddenFamilyMember(c.id) &&
    (c.panteao_id === pantheonId || familyMemberForPantheon(c.id, pantheonId) != null)
  );
}

/** Mesma seleção de construções da página Astecas: ficha visível do panteão ou da família. */
export function isAztecConstrucao(c: { id: number; panteao_id?: number | null }): boolean {
  return isPantheonConstrucao(c, AZTEC_PANTEON_ID);
}

export function isObsidianMap(m: { origem: readonly string[] }): boolean {
  return m.origem.includes(MAPAS_OBSIDIAN_ORIGEM);
}
