import { familyMemberForPantheon, isHiddenFamilyMember } from "@/lib/buildingFamilies";
import { firstNumId, type EntityNumRef } from "@/lib/entityRefs";

/** Panteão Asteca em `panteoes.json`. */
export const AZTEC_PANTEON_ID = 7;

/** Origem dos mapas da página Astecas. */
export const MAPAS_OBSIDIAN_ORIGEM = "AoM: Obsidian Mirror (2026)";

export function isAztecPantheon(panteao: EntityNumRef[] | null | undefined): boolean {
  return firstNumId(panteao) === AZTEC_PANTEON_ID;
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

/** Mesma seleção de construções da página Astecas: ficha visível do panteão ou da família. */
export function isAztecConstrucao(c: { id: number; panteao_id?: number | null }): boolean {
  return (
    !isHiddenFamilyMember(c.id) &&
    (c.panteao_id === AZTEC_PANTEON_ID || familyMemberForPantheon(c.id, AZTEC_PANTEON_ID) != null)
  );
}

export function isObsidianMap(m: { origem: readonly string[] }): boolean {
  return m.origem.includes(MAPAS_OBSIDIAN_ORIGEM);
}
