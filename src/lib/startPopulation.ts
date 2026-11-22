export type VillagerCountCells = {
  food: string;
  wood: string;
  gold: string;
  favor: string;
  pop: string;
};

const COUNT_FIELDS = ["food", "wood", "gold", "favor"] as const;

function countCell(value: string): number | null {
  const text = value.trim();
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
}

/** Soma de comida, madeira, ouro e favor. Traço e vazio valem zero. Sem nenhum número, não há soma. */
export function villagerColumnSum(cells: Pick<VillagerCountCells, "food" | "wood" | "gold" | "favor">): number | null {
  let sum = 0;
  let any = false;
  for (const field of COUNT_FIELDS) {
    const count = countCell(cells[field]);
    if (count == null) continue;
    any = true;
    sum += count;
  }
  return any ? sum : null;
}

/** Primeiro número de "7/15". O segundo é o limite de casas e fica de fora. */
export function populationUsed(pop: string): number | null {
  const match = pop.trim().match(/^(\d+)(?:\s*\/\s*\d+)?$/);
  return match ? Number(match[1]) : null;
}

export function populationWithUsed(pop: string, used: number): string {
  const cap = pop.trim().match(/^\d+\s*\/\s*(\d+)$/);
  return cap ? `${used}/${cap[1]}` : String(used);
}

/**
 * Atualiza o primeiro número quando a população ainda acompanhava a soma.
 * Se a pessoa já tiver colocado outro valor, a população digitada permanece.
 */
export function nextPopulation(previous: VillagerCountCells, next: VillagerCountCells): string {
  const sum = villagerColumnSum(next);
  if (sum == null) return next.pop;
  const previousSum = villagerColumnSum(previous);
  const used = populationUsed(previous.pop);
  const followsSum = used == null || previousSum == null || used === previousSum;
  if (!followsSum) return next.pop;
  return populationWithUsed(previous.pop, sum);
}

/** Soma esperada quando o primeiro número não bate. `null` quando está certo ou não há o que somar. */
export function populationSumMismatch(cells: VillagerCountCells): number | null {
  const sum = villagerColumnSum(cells);
  if (sum == null) return null;
  if (populationUsed(cells.pop) === sum) return null;
  return sum;
}

/** Os dois números iguais, como "15/15": população cheia (Housed). */
export function isHousedPopulation(pop: string | null | undefined): boolean {
  if (!pop) return false;
  const match = pop.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return false;
  return Number(match[1]) === Number(match[2]);
}
