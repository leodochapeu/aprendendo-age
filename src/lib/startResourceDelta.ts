import type { StartTableRow } from "@/data/catalog";

export type ResourceField = "food" | "wood" | "gold";
export type ResourceDelta = "up" | "down";
export type RowResourceDeltas = Record<ResourceField, ResourceDelta | null>;

const FIELDS: ResourceField[] = ["food", "wood", "gold"];

type Cell = number | "dash" | "blank";

/** "-" é zero: ainda não houve aldeão naquele recurso. Célula vazia não entra na conta. */
function readCell(value: string | null | undefined): Cell {
  if (value == null) return "blank";
  const text = value.trim();
  if (text === "") return "blank";
  if (text === "-" || text === "–" || text === "—") return "dash";
  if (/^\d+$/.test(text)) return Number(text);
  return "blank";
}

/** Linha que registra a distribuição. Ação só com traços, ou marco sem números, não serve de referência. */
function isSnapshot(row: StartTableRow): boolean {
  return FIELDS.some((field) => typeof readCell(row[field]) === "number");
}

function baseline(cell: Cell): number | null {
  if (typeof cell === "number") return cell;
  if (cell === "dash") return 0;
  return null;
}

export function emptyResourceDeltas(): RowResourceDeltas {
  return { food: null, wood: null, gold: null };
}

/**
 * Compara comida, madeira e ouro com a última linha que tinha quantidades.
 * A primeira distribuição não pinta. Traço na referência vale 0.
 * Número maior pinta verde; menor, vermelho; igual, nada.
 */
export function resourceDeltasForRows(rows: StartTableRow[]): RowResourceDeltas[] {
  const out = rows.map(() => emptyResourceDeltas());
  let previous: StartTableRow | null = null;

  rows.forEach((row, index) => {
    if (!isSnapshot(row)) return;
    if (previous) {
      for (const field of FIELDS) {
        const current = readCell(row[field]);
        if (typeof current !== "number") continue;
        const prev = baseline(readCell(previous[field]));
        if (prev == null) continue;
        if (current > prev) out[index][field] = "up";
        else if (current < prev) out[index][field] = "down";
      }
    }
    previous = row;
  });

  return out;
}
