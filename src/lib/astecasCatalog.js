import { familyMemberForPantheon, isHiddenFamilyMember } from "@/lib/buildingFamilies";
import { firstNumId } from "@/lib/entityRefs";
/** Panteão Asteca em `panteoes.json`. */
export const AZTEC_PANTEON_ID = 7;
/** Origem dos mapas da página Astecas. */
export const MAPAS_OBSIDIAN_ORIGEM = "AoM: Obsidian Mirror (2026)";
export function isPantheonRef(panteao, pantheonId) {
    return firstNumId(panteao) === pantheonId;
}
export function isAztecPantheon(panteao) {
    return isPantheonRef(panteao, AZTEC_PANTEON_ID);
}
export function isAztecDeus(d) {
    return isAztecPantheon(d.panteao);
}
export function isAztecGodpower(g) {
    return isAztecPantheon(g.panteao);
}
export function isAztecAldeao(a) {
    return isAztecPantheon(a.panteao);
}
export function isAztecUnidade(u) {
    return isAztecPantheon(u.panteao);
}
/** Ficha visível do panteão ou a variante da família daquele panteão. */
export function isPantheonConstrucao(c, pantheonId) {
    return (!isHiddenFamilyMember(c.id) &&
        (c.panteao_id === pantheonId || familyMemberForPantheon(c.id, pantheonId) != null));
}
/** Mesma seleção de construções da página Astecas: ficha visível do panteão ou da família. */
export function isAztecConstrucao(c) {
    return isPantheonConstrucao(c, AZTEC_PANTEON_ID);
}
export function isObsidianMap(m) {
    return m.origem.includes(MAPAS_OBSIDIAN_ORIGEM);
}
