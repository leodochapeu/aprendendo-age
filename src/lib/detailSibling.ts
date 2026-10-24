import type { LocaleCatalog } from "@/data/catalogLocale";
import type { Locale } from "@/i18n/types";
import { AZTEC_PANTEON_ID, isObsidianMap, isPantheonConstrucao, isPantheonRef } from "@/lib/astecasCatalog";
import { isHiddenFamilyMember } from "@/lib/buildingFamilies";
import { localeSectionPath, type LocaleSection } from "@/lib/localeRoutes";
import { listIndexReturnTo } from "@/lib/listIndexReturnState";

/** Seções de catálogo com ficha por slug. Starts fica de fora. */
export type DetailNavSection = Exclude<LocaleSection, "starts">;

/** `"all"` ou o id do panteão cujo índice originou a ficha. */
export type DetailNavScope = "all" | number;

/**
 * Vizinho anterior e próximo numa lista ordenada por id.
 * O primeiro volta para o último; o último segue para o primeiro.
 */
export function circularSiblingIds(
  ids: readonly number[],
  currentId: number,
): { prev: number; next: number } | null {
  if (ids.length < 2) return null;
  const index = ids.indexOf(currentId);
  if (index < 0) return null;
  const last = ids.length - 1;
  return {
    prev: ids[index === 0 ? last : index - 1]!,
    next: ids[index === last ? 0 : index + 1]!,
  };
}

function sortedIds<T extends { id: number }>(
  items: readonly T[],
  slugById: Map<number, string>,
  include: (item: T) => boolean,
): number[] {
  return items
    .filter((item) => include(item) && slugById.has(item.id))
    .map((item) => item.id)
    .sort((a, b) => a - b);
}

function indexIds<T>(
  items: readonly T[],
  slugByIndex: Map<number, string>,
  include: (item: T) => boolean,
): number[] {
  const ids: number[] = [];
  items.forEach((item, index) => {
    if (include(item) && slugByIndex.has(index)) ids.push(index);
  });
  return ids;
}

/** Ids da seção, em ordem crescente. Construções ocultas de família ficam de fora, como na lista. */
export function orderedDetailIds(
  catalog: LocaleCatalog,
  section: DetailNavSection,
  scope: DetailNavScope,
): number[] {
  const pantheonId = scope === "all" ? null : scope;
  switch (section) {
    case "panteoes":
      return sortedIds(catalog.panteoes, catalog.panteaoSlugById, () => true);
    case "deuses":
      return sortedIds(catalog.deuses, catalog.deusSlugById, (d) => pantheonId == null || isPantheonRef(d.panteao, pantheonId));
    case "eras":
      return sortedIds(catalog.eras, catalog.eraSlugById, () => true);
    case "poderes":
      return sortedIds(
        catalog.godpowers,
        catalog.godpowerSlugById,
        (g) => pantheonId == null || isPantheonRef(g.panteao, pantheonId),
      );
    case "construcoes":
      return sortedIds(
        catalog.construcoes,
        catalog.construcaoSlugById,
        (c) => !isHiddenFamilyMember(c.id) && (pantheonId == null || isPantheonConstrucao(c, pantheonId)),
      );
    case "unidades":
      return sortedIds(
        catalog.unidades,
        catalog.unidadeSlugById,
        (u) => pantheonId == null || isPantheonRef(u.panteao, pantheonId),
      );
    case "aldeoes":
      return sortedIds(
        catalog.aldeoes,
        catalog.aldeaoSlugById,
        (a) => pantheonId == null || isPantheonRef(a.panteao, pantheonId),
      );
    case "reliquias":
      return sortedIds(catalog.reliquias, catalog.reliquiaSlugById, () => true);
    case "mapas":
      return indexIds(
        catalog.mapas,
        catalog.mapaSlugByIndex,
        (m) => pantheonId == null || (pantheonId === AZTEC_PANTEON_ID && isObsidianMap(m)),
      );
    case "tecnologias":
      return indexIds(catalog.tecnologias, catalog.tecnologiaSlugByIndex, () => true);
    default:
      return [];
  }
}

/**
 * Lista usada nas setas. Vindo do índice de um panteão, fica no recorte daquela
 * civilização quando a ficha atual pertence a ele; senão, a lista inteira da seção.
 */
export function detailIdsForScope(
  catalog: LocaleCatalog,
  section: DetailNavSection,
  currentId: number,
  scope: DetailNavScope,
): number[] {
  if (scope === "all") return orderedDetailIds(catalog, section, "all");
  const subset = orderedDetailIds(catalog, section, scope);
  if (subset.length >= 2 && subset.includes(currentId)) return subset;
  return orderedDetailIds(catalog, section, "all");
}

function slugFor(catalog: LocaleCatalog, section: DetailNavSection, id: number): string | undefined {
  switch (section) {
    case "panteoes":
      return catalog.panteaoSlugById.get(id);
    case "deuses":
      return catalog.deusSlugById.get(id);
    case "eras":
      return catalog.eraSlugById.get(id);
    case "poderes":
      return catalog.godpowerSlugById.get(id);
    case "construcoes":
      return catalog.construcaoSlugById.get(id);
    case "unidades":
      return catalog.unidadeSlugById.get(id);
    case "aldeoes":
      return catalog.aldeaoSlugById.get(id);
    case "reliquias":
      return catalog.reliquiaSlugById.get(id);
    case "mapas":
      return catalog.mapaSlugByIndex.get(id);
    case "tecnologias":
      return catalog.tecnologiaSlugByIndex.get(id);
    default:
      return undefined;
  }
}

export function detailNavScopeFromState(state: unknown, catalog: LocaleCatalog): DetailNavScope {
  const back = listIndexReturnTo("/", state);
  const path = back.split("?")[0] ?? "/";
  if (path === "/astecas") return AZTEC_PANTEON_ID;
  const hub = path.match(/^\/(?:panteoes|pantheons)\/([^/]+)\/indice$/);
  if (!hub) return "all";
  let slug = hub[1] ?? "";
  try {
    slug = decodeURIComponent(slug);
  } catch {
    /* mantém o segmento */
  }
  return catalog.panteaoBySlug.get(slug)?.id ?? "all";
}

export function detailSiblingPaths(
  catalog: LocaleCatalog,
  section: DetailNavSection,
  currentId: number,
  locale: Locale,
  scope: DetailNavScope,
): { prev: string; next: string } | null {
  const pair = circularSiblingIds(detailIdsForScope(catalog, section, currentId, scope), currentId);
  if (!pair) return null;
  const prevSlug = slugFor(catalog, section, pair.prev);
  const nextSlug = slugFor(catalog, section, pair.next);
  if (!prevSlug || !nextSlug) return null;
  return {
    prev: localeSectionPath(locale, section, prevSlug),
    next: localeSectionPath(locale, section, nextSlug),
  };
}
