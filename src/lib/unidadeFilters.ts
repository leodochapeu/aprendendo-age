import type { Unidade } from "@/data/catalog";
import type { UnidadeTipoItem } from "@/lib/unidadeTipo";

/** Operadores da condição numérica. O valor digitado só filtra depois de escolher um destes. */
export type CompareOp = "gt" | "gte" | "eq" | "lt" | "lte";

export const COMPARE_OPS: readonly CompareOp[] = ["gt", "gte", "eq", "lt", "lte"];

/**
 * Campos numéricos comparáveis. A ordem é a do seletor de filtros avançados.
 * `dano_contundente` também lê o alias legado `dano_contusao`.
 */
export const UNIT_STAT_FIELDS = [
  "pontos_de_vida",
  "armadura_anticorte",
  "armadura_antiperfurante",
  "velocidade_movimento",
  "dano_cortante",
  "dano_perfurante",
  "dano_contundente",
  "dano_divino",
  "dano_area",
  "alcance",
  "velocidade_de_ataque_atk_s",
  "dps",
  "custo_total",
  "populacao",
  "tempo_treinamento",
  "comida",
  "madeira",
  "ouro",
  "favor",
] as const;

export type UnitStatField = (typeof UNIT_STAT_FIELDS)[number];

export const UNIT_STAT_META: Record<UnitStatField, { labelKey: string; icon?: string }> = {
  pontos_de_vida: { labelKey: "spreadsheet.unidades.hitPoints", icon: "aomr_hit_points_icon" },
  armadura_anticorte: { labelKey: "spreadsheet.unidades.hackArmor", icon: "hackarmor" },
  armadura_antiperfurante: { labelKey: "spreadsheet.unidades.pierceArmor", icon: "piercearmor" },
  velocidade_movimento: { labelKey: "spreadsheet.unidades.moveSpeed", icon: "aomr_speed_icon" },
  dano_cortante: { labelKey: "spreadsheet.unidades.hackDamage", icon: "hackdamage" },
  dano_perfurante: { labelKey: "spreadsheet.unidades.pierceDamage", icon: "piercedamage" },
  dano_contundente: { labelKey: "spreadsheet.unidades.crushDamage", icon: "crushdamage" },
  dano_divino: { labelKey: "spreadsheet.unidades.divineDamage", icon: "aomr_divine_damage_icon" },
  dano_area: { labelKey: "spreadsheet.unidades.areaDamage", icon: "attack_cur" },
  alcance: { labelKey: "spreadsheet.unidades.range", icon: "rangeicon" },
  velocidade_de_ataque_atk_s: { labelKey: "spreadsheet.unidades.attackSpeed", icon: "aomr_rate_of_fire_icon" },
  dps: { labelKey: "spreadsheet.unidades.dps", icon: "attack_cur" },
  custo_total: { labelKey: "common.totalCost" },
  populacao: { labelKey: "spreadsheet.unidades.population", icon: "aomr_population_provision_icon" },
  tempo_treinamento: { labelKey: "spreadsheet.unidades.trainTime", icon: "aomr_time_icon" },
  comida: { labelKey: "spreadsheet.food", icon: "foodaom" },
  madeira: { labelKey: "spreadsheet.wood", icon: "woodaom" },
  ouro: { labelKey: "spreadsheet.gold", icon: "goldaom" },
  favor: { labelKey: "spreadsheet.favor", icon: "favoraom" },
};

export type UnitAdvancedRule = {
  id: string;
  field: UnitStatField | "";
  op: CompareOp;
  value: string;
};

export type UnitListFilters = {
  pantheonIds: number[];
  eraIds: number[];
  /**
   * Chaves de `tipo` (Infantaria, Cavalaria…). O rótulo na UI é "Categoria",
   * porque é assim que o filtro é pedido; o campo `categoria` do JSON é o counter.
   */
  tipoKeys: string[];
  advanced: UnitAdvancedRule[];
};

const TIPO_ICON_ORDER = [
  "aomr_type_infantry_icon",
  "aomr_type_cavalry_icon",
  "aomr_type_archer_icon",
  "aomr_type_siege_weapon_icon",
  "aomr_type_hero_icon",
  "aomr_type_myth_unit_icon",
  "aomr_type_flying_unit_icon",
  "aomr_type_scout_icon",
  "aomr_type_ship_icon",
  "aomr_type_villager_icon",
];

export function emptyUnitListFilters(): UnitListFilters {
  return { pantheonIds: [], eraIds: [], tipoKeys: [], advanced: [] };
}

function finiteIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is number => typeof id === "number" && Number.isFinite(id));
}

function isCompareOp(value: unknown): value is CompareOp {
  return typeof value === "string" && (COMPARE_OPS as readonly string[]).includes(value);
}

function isStatField(value: unknown): value is UnitStatField | "" {
  return value === "" || (typeof value === "string" && (UNIT_STAT_FIELDS as readonly string[]).includes(value));
}

/** Reidrata o filtro salvo ao voltar do detalhe. JSON inválido vira filtro vazio. */
export function parseUnitListFilters(raw: string): UnitListFilters {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return emptyUnitListFilters();
    const record = data as Record<string, unknown>;
    const tipoKeys = Array.isArray(record.tipoKeys)
      ? record.tipoKeys.filter((key): key is string => typeof key === "string" && key.length > 0)
      : [];
    const advanced = Array.isArray(record.advanced)
      ? record.advanced.flatMap((rule) => {
          if (!rule || typeof rule !== "object") return [];
          const item = rule as Record<string, unknown>;
          if (typeof item.id !== "string" || !item.id) return [];
          if (!isStatField(item.field) || !isCompareOp(item.op) || typeof item.value !== "string") return [];
          return [{ id: item.id, field: item.field, op: item.op, value: item.value }];
        })
      : [];
    return {
      pantheonIds: finiteIds(record.pantheonIds),
      eraIds: finiteIds(record.eraIds),
      tipoKeys,
      advanced,
    };
  } catch {
    return emptyUnitListFilters();
  }
}

export function createAdvancedRule(): UnitAdvancedRule {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, field: "", op: "gte", value: "" };
}

/** Chave estável entre idiomas: o ícone do tipo não muda com a tradução do rótulo. */
export function tipoFilterKey(item: UnidadeTipoItem): string {
  const icon = item.icon?.trim();
  if (icon) return `icon:${icon}`;
  const type = item.type.trim().toLowerCase();
  return type ? `type:${type}` : "";
}

export type TipoFilterOption = {
  key: string;
  label: string;
  icon?: string;
};

export function collectTipoOptions(units: readonly Unidade[]): TipoFilterOption[] {
  const map = new Map<string, TipoFilterOption>();
  for (const unit of units) {
    for (const item of unit.tipo ?? []) {
      const key = tipoFilterKey(item);
      if (!key || map.has(key)) continue;
      const label = item.type.trim();
      if (!label) continue;
      map.set(key, { key, label, icon: item.icon?.trim() || undefined });
    }
  }
  return [...map.values()].sort((a, b) => {
    const ia = a.icon ? TIPO_ICON_ORDER.indexOf(a.icon) : -1;
    const ib = b.icon ? TIPO_ICON_ORDER.indexOf(b.icon) : -1;
    const oa = ia === -1 ? TIPO_ICON_ORDER.length : ia;
    const ob = ib === -1 ? TIPO_ICON_ORDER.length : ib;
    if (oa !== ob) return oa - ob;
    return a.label.localeCompare(b.label);
  });
}

export function parseFilterNumber(raw: string): number | undefined {
  const trimmed = raw.trim().replace(/%/g, "").replace(",", ".");
  if (!trimmed || trimmed === "-" || trimmed === "." || trimmed === "-.") return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

export function compareNumber(actual: number, op: CompareOp, target: number): boolean {
  switch (op) {
    case "gt":
      return actual > target;
    case "gte":
      return actual >= target;
    case "eq":
      return Math.abs(actual - target) < 1e-6;
    case "lt":
      return actual < target;
    case "lte":
      return actual <= target;
  }
}

export function readUnitStat(unit: Unidade, field: UnitStatField): number | undefined {
  const value = field === "dano_contundente" ? (unit.dano_contundente ?? unit.dano_contusao) : unit[field];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function matchesIdSelection(refs: { id: number }[] | undefined, selected: number[]): boolean {
  if (selected.length === 0) return true;
  const ids = new Set(selected);
  return Boolean(refs?.some((ref) => ids.has(ref.id)));
}

export function unidadeMatchesFilters(unit: Unidade, filters: UnitListFilters): boolean {
  if (!matchesIdSelection(unit.panteao, filters.pantheonIds)) return false;
  if (!matchesIdSelection(unit.era, filters.eraIds)) return false;
  if (filters.tipoKeys.length > 0) {
    const keys = new Set(filters.tipoKeys);
    if (!unit.tipo?.some((item) => keys.has(tipoFilterKey(item)))) return false;
  }
  for (const rule of filters.advanced) {
    if (!rule.field) continue;
    const target = parseFilterNumber(rule.value);
    if (target == null) continue;
    const actual = readUnitStat(unit, rule.field);
    if (actual == null || !compareNumber(actual, rule.op, target)) return false;
  }
  return true;
}

export function countActiveUnitFilters(filters: UnitListFilters): number {
  let count = filters.pantheonIds.length + filters.eraIds.length + filters.tipoKeys.length;
  for (const rule of filters.advanced) {
    if (rule.field && parseFilterNumber(rule.value) != null) count += 1;
  }
  return count;
}
