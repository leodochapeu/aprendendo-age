import { getLocaleCatalog } from "@/data/catalogLocale";
import { AZTEC_PANTEON_ID } from "@/lib/astecasCatalog";
import { readStoredLocale } from "@/lib/locale";

/** Chave de `location.state` ao abrir o detalhe a partir de uma listagem. */
export const LIST_INDEX_RETURN = "aprendendoListIndex" as const;

export type ListIndexLinkState = { [K in typeof LIST_INDEX_RETURN]?: string };

/**
 * `state` a passar em `<Link state={...} />` a partir do índice (pathname + search
 * com `?search=`), para o "← Voltar" reabrir a mesma listagem e filtro.
 */
export function listIndexLinkStateFromLocation(pathname: string, search: string): ListIndexLinkState {
  return { [LIST_INDEX_RETURN]: `${pathname}${search}` };
}

/**
 * URL completa (path + `?...`) de volta à listagem, ou o fallback (ex. `/deuses`)
 * se não houver `state` (abrir detalhe em tab nova, partilhado, etc.).
 */
export function listIndexReturnTo(fallback: string, state: unknown): string {
  if (!state || typeof state !== "object" || !(LIST_INDEX_RETURN in state)) {
    return fallback;
  }
  const p = (state as ListIndexLinkState)[LIST_INDEX_RETURN];
  if (typeof p !== "string" || p.length < 1) return fallback;
  if (p === "/" || p.startsWith("/")) {
    if (
      p.startsWith("//") ||
      p.includes("://") ||
      p.includes(" ") ||
      p.includes("\n") ||
      p.includes("\r") ||
      p.includes("\t")
    ) {
      return fallback;
    }
    return p;
  }
  return fallback;
}

/** Nome do panteão quando o «Voltar» aponta para o índice (`/panteoes/:slug/indice` ou `/astecas`). */
export function pantheonHubName(backTo: string): string | null {
  const path = pathnameOnly(backTo);
  const catalog = getLocaleCatalog(readStoredLocale());
  if (path === "/astecas") return catalog.panteaoById.get(AZTEC_PANTEON_ID)?.nome ?? null;
  const hub = path.match(/^\/(?:panteoes|pantheons)\/([^/]+)\/indice$/);
  if (!hub?.[1]) return null;
  let slug = hub[1];
  try {
    slug = decodeURIComponent(slug);
  } catch {
    /* mantém o segmento */
  }
  return catalog.panteaoBySlug.get(slug)?.nome ?? null;
}

/**
 * Rótulo do «Voltar» quando o `to` provém de {@link listIndexReturnTo} após o índice
 * de um panteão; caso contrário usa `defaultLabel` (ex.: "Unidades").
 */
export function listIndexBackLinkLabel(backTo: string, defaultLabel: string): string {
  return pantheonHubName(backTo) ?? defaultLabel;
}

function pathnameOnly(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

/**
 * Rótulo do «Voltar» quando {@link listIndexReturnTo} pode apontar para a listagem
 * (`listPath`, com ou sem `?search=`) ou para outra página (ex.: detalhe aberto via retrato).
 */
export function listOrDetailBackLinkLabel(backTo: string, listPath: string, listLabel: string): string {
  const hubName = pantheonHubName(backTo);
  if (hubName) return hubName;
  const listBase = pathnameOnly(listPath);
  const backPath = pathnameOnly(backTo);
  if (backPath === listBase || backTo.startsWith(`${listBase}?`)) {
    return listIndexBackLinkLabel(backTo, listLabel);
  }
  return "Voltar";
}
