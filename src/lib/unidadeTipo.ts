/**
 * `tipo` e `categoria` em `unidades_aom.json`: listas de `{ type, icon }` com ícones `:token:` via {@link NotionText}.
 */

export type UnidadeTipoItem = {
  type: string;
  /** Nome do token sem `:`; omitido ou vazio = só texto (sem ícone ao lado). */
  icon?: string;
};

export function hasTipoContent(t: UnidadeTipoItem[] | null | undefined): boolean {
  return Array.isArray(t) && t.length > 0;
}

/** Mesma forma que `tipo`: array `{ type, icon }` em `categoria`. */
export function hasCategoriaContent(c: UnidadeTipoItem[] | null | undefined): boolean {
  return hasTipoContent(c);
}

/** Texto equivalente ao formato antigo para pesquisa / meta. */
export function tipoItemsToSearchBlob(items: UnidadeTipoItem[] | null | undefined): string {
  if (!items?.length) return "";
  return items.map((it) => [it.type, it.icon].filter(Boolean).join(" ")).join(" ");
}

/** Reconstrói o fragmento Notion de um item (como no JSON string antigo). */
export function tipoItemToNotionText(it: UnidadeTipoItem): string {
  const icon = (it.icon ?? "").trim();
  if (!icon) return it.type ?? "";
  const label = (it.type ?? "").trim();
  return `${label} :${icon}:`;
}

export function tipoItemsToNotionText(items: UnidadeTipoItem[] | null | undefined): string {
  if (!items?.length) return "";
  return items.map(tipoItemToNotionText).join(", ");
}

/** Junta entradas de `categoria` como texto Notion (igual a {@link tipoItemsToNotionText}). */
export const categoriaItemsToNotionText = tipoItemsToNotionText;

/**
 * Tom de texto por rótulo de tipo (cápsula e listas com vários tipos).
 */
function tipoTypeToneTextClass(typeLabel: string): string {
  const t = (typeLabel ?? "").trim();
  if (!t) return "text-zinc-200";

  if (t.startsWith("Infantaria")) return "text-red-300";
  if (t.startsWith("Cavalaria")) return "text-emerald-300";
  if (t.startsWith("Artilharia") || t.startsWith("Flecheiro") || t.startsWith("Archer Ship")) {
    return "text-sky-300";
  }
  if (t.startsWith("Herói") || t.startsWith("Hero")) return "text-yellow-300";
  if (t.startsWith("Batedor") || t.startsWith("Scout")) return "text-zinc-300";
  if (t.startsWith("Combate curto") || t.startsWith("Close Combat")) return "text-orange-300";
  if (t.startsWith("Navio-cerco") || t.startsWith("Siege Ship")) return "text-amber-300";
  if (t.startsWith("Navio") || t === "Ship") return "text-cyan-300";
  if (
    t.startsWith("Mítica") ||
    t.startsWith("Mythic") ||
    t.includes("mítica") ||
    t.includes("Myth")
  ) {
    return "text-pink-300";
  }
  if (t.startsWith("Cerco") || t.startsWith("Arma de cerco")) return "text-amber-300";
  if (t.startsWith("Voador")) return "text-zinc-200";

  return "text-zinc-200";
}

/** Classe só de cor de texto (vários tipos, comparações, etc.). */
export function tipoTypeTextClass(typeLabel: string): string {
  return tipoTypeToneTextClass(typeLabel);
}

/**
 * Cápsula (borda + fundo + texto) para **um único** tipo — o `text-*` coincide com {@link tipoTypeTextClass}.
 */
export function tipoTypeTagShellClass(typeLabel: string): string {
  const t = (typeLabel ?? "").trim();
  const text = tipoTypeToneTextClass(typeLabel);

  if (!t) return `border-zinc-600/55 bg-zinc-900/75 ${text}`;

  if (t.startsWith("Infantaria")) {
    return `border-red-500/50 bg-red-950/50 ${text}`;
  }
  if (t.startsWith("Cavalaria")) {
    return `border-emerald-500/50 bg-emerald-950/45 ${text}`;
  }
  if (t.startsWith("Artilharia") || t.startsWith("Flecheiro") || t.startsWith("Archer Ship")) {
    return `border-sky-500/50 bg-sky-950/45 ${text}`;
  }
  if (t.startsWith("Herói") || t.startsWith("Hero")) {
    return `border-yellow-500/55 bg-yellow-950/40 ${text}`;
  }
  if (t.startsWith("Batedor") || t.startsWith("Scout")) {
    return `border-zinc-600 bg-zinc-900/90 ${text}`;
  }
  if (t.startsWith("Combate curto") || t.startsWith("Close Combat")) {
    return `border-orange-500/50 bg-orange-950/45 ${text}`;
  }
  if (t.startsWith("Navio-cerco") || t.startsWith("Siege Ship")) {
    return `border-amber-700/55 bg-amber-950/50 ${text}`;
  }
  if (t.startsWith("Navio") || t === "Ship") {
    return `border-cyan-500/50 bg-cyan-950/45 ${text}`;
  }
  if (
    t.startsWith("Mítica") ||
    t.startsWith("Mythic") ||
    t.includes("mítica") ||
    t.includes("Myth")
  ) {
    return `border-pink-500/50 bg-pink-950/45 ${text}`;
  }
  if (t.startsWith("Cerco") || t.startsWith("Arma de cerco")) {
    return `border-amber-700/55 bg-amber-950/50 ${text}`;
  }
  if (t.startsWith("Voador")) {
    return `border-zinc-500/50 bg-zinc-800/55 ${text}`;
  }

  return `border-zinc-600/55 bg-zinc-900/75 ${text}`;
}
