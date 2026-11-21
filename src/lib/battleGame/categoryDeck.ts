import type { PlayableEraId, RoundOutcome } from "./types";

/** Categorias jogáveis no modo Categoria. Cada uma vence exatamente a próxima do próprio ciclo. */
export type BattleCategoryId =
  | "infantaria"
  | "cavalaria"
  | "artilharia"
  | "unidade_mitica"
  | "soldado_humano"
  | "heroi"
  | "navio_flecheiro"
  | "navio_corpo"
  | "navio_cerco";

export type BattleCategory = {
  id: BattleCategoryId;
  icon: string;
  labelKey: string;
};

const SOLDIERS: readonly BattleCategory[] = [
  { id: "infantaria", icon: "aomr_type_infantry_icon", labelKey: "pages.battle.categories.infantaria" },
  { id: "cavalaria", icon: "aomr_type_cavalry_icon", labelKey: "pages.battle.categories.cavalaria" },
  { id: "artilharia", icon: "aomr_type_archer_icon", labelKey: "pages.battle.categories.artilharia" },
];

const MYTH_TRIANGLE: readonly BattleCategory[] = [
  { id: "unidade_mitica", icon: "aomr_type_myth_unit_icon", labelKey: "pages.battle.categories.unidade_mitica" },
  { id: "soldado_humano", icon: "aomr_type_human_soldier_icon", labelKey: "pages.battle.categories.soldado_humano" },
  { id: "heroi", icon: "aomr_type_hero_icon", labelKey: "pages.battle.categories.heroi" },
];

const SHIPS: readonly BattleCategory[] = [
  { id: "navio_flecheiro", icon: "aomr_type_archer_ship_icon", labelKey: "pages.battle.categories.navio_flecheiro" },
  { id: "navio_corpo", icon: "aomr_type_close_combat_ship_icon", labelKey: "pages.battle.categories.navio_corpo" },
  { id: "navio_cerco", icon: "aomr_type_siege_ship_icon", labelKey: "pages.battle.categories.navio_cerco" },
];

/** Quem está à esquerda vence o da direita. O último de cada ciclo vence o primeiro. */
const BEATS: Record<BattleCategoryId, BattleCategoryId> = {
  infantaria: "cavalaria",
  cavalaria: "artilharia",
  artilharia: "infantaria",
  unidade_mitica: "soldado_humano",
  soldado_humano: "heroi",
  heroi: "unidade_mitica",
  navio_flecheiro: "navio_corpo",
  navio_corpo: "navio_cerco",
  navio_cerco: "navio_flecheiro",
};

/**
 * Clássica: infantaria, cavalaria e artilharia.
 * Heróica: o mesmo triângulo, e ao sair da Clássica entram unidade mítica, soldados humanos e herói.
 * Mítica: o ciclo dos barcos.
 */
export function categoryGroupsForEra(eraId: PlayableEraId): BattleCategory[][] {
  if (eraId === 2) return [SOLDIERS.map((item) => ({ ...item }))];
  if (eraId === 3) {
    return [SOLDIERS.map((item) => ({ ...item })), MYTH_TRIANGLE.map((item) => ({ ...item }))];
  }
  return [SHIPS.map((item) => ({ ...item }))];
}

export function categoriesForEra(eraId: PlayableEraId): BattleCategory[] {
  return categoryGroupsForEra(eraId).flat();
}

export function categoryById(id: BattleCategoryId): BattleCategory {
  const found = [...SOLDIERS, ...MYTH_TRIANGLE, ...SHIPS].find((item) => item.id === id);
  if (!found) throw new Error(`missing category ${id}`);
  return found;
}

export function pickCategoryDefender(
  pool: readonly BattleCategory[],
  previousId: BattleCategoryId | null,
  rng: () => number = Math.random,
): BattleCategory | null {
  if (pool.length === 0) return null;
  const options = previousId ? pool.filter((item) => item.id !== previousId) : pool;
  const source = options.length > 0 ? options : pool;
  const index = Math.floor(rng() * source.length);
  return source[index] ?? null;
}

/** Mesma categoria empata. Fora do ciclo, a escolha não vence. */
export function resolveCategoryChoice(attackerId: BattleCategoryId, defenderId: BattleCategoryId): RoundOutcome {
  if (attackerId === defenderId) return "draw";
  if (BEATS[attackerId] === defenderId) return "win";
  if (BEATS[defenderId] === attackerId) return "loss";
  return "loss";
}

export function categoryBeats(id: BattleCategoryId): BattleCategoryId {
  return BEATS[id];
}
