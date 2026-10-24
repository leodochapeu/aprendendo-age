import type { LocaleCatalog } from "@/data/catalogLocale";
import type { Tecnologia, Unidade } from "@/data/catalog";
import { firstNumId } from "@/lib/entityRefs";
import { localeSectionPath } from "@/lib/localeRoutes";
import type { Deus } from "@/lib/godMajorTree";

export type GodTechTreeFrame = "tech" | "unit" | "myth" | "hero" | "ship";

export type GodTechTreeItem = {
  key: string;
  nome: string;
  icon?: string;
  to?: string;
  /** Nome em inglês, usado para alinhar linhas de melhoria (Machado → Serra → Carpinteiros). */
  ingles?: string;
  frame: GodTechTreeFrame;
};

/** Uma linha vertical de melhorias, com um espaço por era. `null` = essa era não tem o elo. */
export type GodTechTreeLine = {
  id: string;
  slots: (GodTechTreeItem | null)[];
};

export type GodTechTreeBuildingMark = {
  id: number;
  nome: string;
  icon?: string;
  to?: string;
};

export type GodTechTreeCell = {
  building?: GodTechTreeBuildingMark;
  items: GodTechTreeItem[];
};

export type GodTechTreeRow = {
  buildingId: number;
  cells: GodTechTreeCell[];
};

type CatalogBuilding = LocaleCatalog["construcoes"][number];

const AGE_COUNT = 4;

/**
 * Árvore de um deus maior (panteão + menores disponíveis) ou, num menor, só o que é dele.
 * Heróis ficam nos centros (urbano, de aldeia, cidadela). Tecnologia cuja construção só existe
 * numa era posterior não aparece nessa construção se houver outra no prazo certo.
 */
export function buildGodTechTree(god: Deus, catalog: LocaleCatalog): GodTechTreeRow[] {
  const pantheonId = firstNumId(god.panteao);
  if (pantheonId == null) return [];

  const isMajor = god.hierarquia === "Maior";
  const allowedGods = new Set<number>([god.id]);
  if (isMajor) {
    for (const rel of god.god_maior_relacao ?? []) allowedGods.add(rel.id);
  }

  const pantheonName = god.panteao?.[0]?.nome;
  const buildings = new Map<number, CatalogBuilding>();
  for (const building of catalog.construcoes) {
    if (!includeBuilding(building, god.nome, pantheonId, isMajor)) continue;
    buildings.set(building.id, building);
  }

  const drafts = new Map<number, { items: GodTechTreeItem[][]; seen: Set<string>[] }>();
  for (const id of buildings.keys()) {
    drafts.set(id, {
      items: Array.from({ length: AGE_COUNT }, () => []),
      seen: Array.from({ length: AGE_COUNT }, () => new Set<string>()),
    });
  }

  catalog.unidades.forEach((unit) => {
    if (!unitVisible(unit, pantheonId, allowedGods, isMajor)) return;
    const age = ageIndex(unit.era);
    if (age == null) return;
    for (const building of unitBuildings(unit, buildings)) {
      pushItem(drafts.get(building.id), age, {
        key: `u-${unit.id}`,
        nome: unit.nome,
        icon: unit.icon,
        to: linkTo(catalog, "unidades", catalog.unidadeSlugById.get(unit.id)),
        frame: unitFrame(unit),
      });
    }
  });

  catalog.tecnologias.forEach((tech, index) => {
    if (!techVisible(tech, pantheonId, allowedGods, isMajor)) return;
    const age = ageIndex(tech.eras);
    if (age == null) return;
    for (const building of techBuildings(tech, age, buildings)) {
      pushItem(drafts.get(building.id), age, {
        key: `t-${index}`,
        nome: tech.nome,
        icon: tech.icon,
        to: linkTo(catalog, "tecnologias", catalog.tecnologiaSlugByIndex.get(index)),
        ingles: tech.ingles,
        frame: "tech",
      });
    }
  });

  const rows: Array<GodTechTreeRow & { rank: number; iconAge: number; nome: string; role: "tc" | "village" | "citadel" | null }> = [];
  for (const [id, draft] of drafts) {
    const building = buildings.get(id);
    if (!building) continue;
    const hasItems = draft.items.some((cell) => cell.length > 0);
    if (!hasItems && !isMajor) continue;

    for (const cell of draft.items) {
      cell.sort((a, b) => {
        const kind = (item: { key: string }) => (item.key.startsWith("u-") ? 0 : 1);
        return kind(a) - kind(b) || a.nome.localeCompare(b.nome, catalog.locale);
      });
    }

    let iconAge = buildingEra(building) - 1;
    for (let age = 0; age < AGE_COUNT; age += 1) {
      if (draft.items[age]?.length) {
        iconAge = Math.min(iconAge, age);
        break;
      }
    }

    const nome = displayBuildingName(building, pantheonName);
    const mark: GodTechTreeBuildingMark = {
      id,
      nome,
      icon: building.icon,
      to: linkTo(catalog, "construcoes", catalog.construcaoSlugById.get(id)),
    };

    rows.push({
      buildingId: id,
      rank: buildingRank(building),
      iconAge,
      nome,
      role: settlementRole(building),
      cells: draft.items.map((items, age) => ({
        building: age === iconAge ? mark : undefined,
        items,
      })),
    });
  }

  const visible = collapseSettlements(rows);
  visible.sort((a, b) => a.rank - b.rank || a.iconAge - b.iconAge || a.nome.localeCompare(b.nome, catalog.locale));
  return visible.map(({ buildingId, cells }) => ({ buildingId, cells }));
}

const TECH_LINES: string[][] = [
  ["Hand Axe", "Bow Saw", "Carpenters"],
  ["Pickaxe", "Shaft Mine", "Quarry"],
  ["Husbandry", "Plow", "Irrigation", "Flood Control"],
  ["Masons", "Architects"],
  ["Medium Infantry", "Heavy Infantry", "Champion Infantry"],
  ["Levy Infantry", "Conscript Infantry"],
  ["Medium Cavalry", "Heavy Cavalry", "Champion Cavalry"],
  ["Levy Cavalry", "Conscript Cavalry"],
  ["Medium Ranged Soldiers", "Heavy Ranged Soldiers", "Champion Ranged Soldiers"],
  ["Levy Ranged Soldiers", "Conscript Ranged Soldiers"],
  ["Copper Weapons", "Bronze Weapons", "Iron Weapons"],
  ["Copper Armor", "Bronze Armor", "Iron Armor"],
  ["Copper Shields", "Bronze Shields", "Iron Shields"],
  ["Watch Tower", "Guard Tower"],
  ["Stone Wall", "Fortified Wall"],
];

/**
 * Separa tecnologias que formam uma linha de melhoria (uma embaixo da outra, como no jogo)
 * dos ícones que ficam num ramo horizontal da era.
 */
export function splitTechLines(cells: GodTechTreeCell[]): { loose: GodTechTreeItem[][]; lines: GodTechTreeLine[] } {
  const claimed = new Set<string>();
  const lines: GodTechTreeLine[] = [];

  TECH_LINES.forEach((names, lineIndex) => {
    const wanted = new Set(names.map((name) => name.toLowerCase()));
    const slots: (GodTechTreeItem | null)[] = [null, null, null, null];
    let found = 0;
    cells.forEach((cell, age) => {
      if (age > 3) return;
      for (const item of cell.items) {
        if (item.frame !== "tech" || claimed.has(item.key)) continue;
        const ingles = item.ingles?.trim().toLowerCase();
        if (!ingles || !wanted.has(ingles) || slots[age]) continue;
        slots[age] = item;
        found += 1;
      }
    });
    if (found < 2) return;
    for (const item of slots) if (item) claimed.add(item.key);
    lines.push({ id: `line-${lineIndex}`, slots });
  });

  const loose = cells.map((cell) => cell.items.filter((item) => !claimed.has(item.key)));
  return { loose, lines };
}

function collapseSettlements<T extends { role: "tc" | "village" | "citadel" | null; cells: GodTechTreeCell[] }>(rows: T[]): T[] {
  const tc = rows.find((row) => row.role === "tc");
  if (!tc) return rows;
  for (const other of rows) {
    if (other.role !== "village" && other.role !== "citadel") continue;
    for (let age = 0; age < AGE_COUNT; age += 1) {
      const target = tc.cells[age];
      const source = other.cells[age];
      if (!target || !source) continue;
      const seen = new Set(target.items.map((item) => item.key));
      for (const item of source.items) {
        if (seen.has(item.key)) continue;
        target.items.push(item);
        seen.add(item.key);
      }
      target.items.sort((a, b) => {
        const kind = (item: GodTechTreeItem) => (item.key.startsWith("u-") ? 0 : 1);
        return kind(a) - kind(b) || a.nome.localeCompare(b.nome);
      });
    }
  }
  return rows.filter((row) => row.role !== "village" && row.role !== "citadel");
}

function includeBuilding(building: CatalogBuilding, godName: string, pantheonId: number, isMajor: boolean): boolean {
  if (isWonder(building)) {
    if (!isMajor) return false;
    return wonderOwner(building.nome) === godName;
  }
  if (building.panteao_id === pantheonId) return true;
  return isMajor && building.panteao_id == null && isSharedDefensive(building);
}

function unitVisible(unit: Unidade, pantheonId: number, allowedGods: Set<number>, includeGeneric: boolean): boolean {
  if (!(unit.panteao ?? []).some((pantheon) => pantheon.id === pantheonId)) return false;
  const gods = unit.god_dono ?? [];
  if (!gods.length) return includeGeneric;
  return gods.some((god) => allowedGods.has(god.id));
}

function techVisible(tech: Tecnologia, pantheonId: number, allowedGods: Set<number>, includeGeneric: boolean): boolean {
  if (!techMatchesPantheon(tech, pantheonId)) return false;
  const gods = godIds(tech.god_especifico);
  if (gods == null) return includeGeneric;
  return gods.some((id) => allowedGods.has(id));
}

function techMatchesPantheon(tech: Tecnologia, pantheonId: number): boolean {
  const pantheons = tech.panteoes;
  if (pantheons == null || pantheons === "Geral") return true;
  if (typeof pantheons === "string") return /^geral$/i.test(pantheons);
  return pantheons.some((pantheon) => pantheon.id === pantheonId);
}

function godIds(value: Tecnologia["god_especifico"]): number[] | null {
  if (value == null || typeof value === "string") return null;
  const ids = value.map((god) => god.id).filter((id) => typeof id === "number");
  return ids.length ? ids : null;
}

function ageIndex(eras: { id: number }[] | undefined): number | null {
  const id = eras?.[0]?.id;
  if (typeof id !== "number" || id < 1 || id > AGE_COUNT) return null;
  return id - 1;
}

function buildingEra(building: CatalogBuilding): number {
  const id = building.era_id;
  if (typeof id !== "number" || id < 1) return 1;
  return Math.min(id, AGE_COUNT);
}

function unitBuildings(unit: Unidade, buildings: Map<number, CatalogBuilding>): CatalogBuilding[] {
  const linked = (unit.construcao ?? [])
    .map((ref) => buildings.get(ref.id))
    .filter((building): building is CatalogBuilding => building != null);
  if (!isHero(unit)) return linked;
  const settlements = linked.filter(isSettlement);
  return settlements.length ? settlements : linked;
}

function techBuildings(tech: Tecnologia, age: number, buildings: Map<number, CatalogBuilding>): CatalogBuilding[] {
  if (!Array.isArray(tech.construcao_origem)) return [];
  const linked = tech.construcao_origem
    .map((ref) => buildings.get(ref.id))
    .filter((building): building is CatalogBuilding => building != null);
  const fitting = linked.filter((building) => buildingEra(building) - 1 <= age);
  return fitting.length ? fitting : linked;
}

function pushItem(
  draft: { items: GodTechTreeItem[][]; seen: Set<string>[] } | undefined,
  age: number,
  item: GodTechTreeItem,
) {
  if (!draft) return;
  const seen = draft.seen[age];
  const items = draft.items[age];
  if (!seen || !items || seen.has(item.key)) return;
  seen.add(item.key);
  items.push(item);
}

function linkTo(catalog: LocaleCatalog, section: "unidades" | "tecnologias" | "construcoes", slug: string | undefined): string | undefined {
  if (!slug) return undefined;
  return localeSectionPath(catalog.locale, section, slug);
}

function labelOf(building: CatalogBuilding): string {
  return `${building.nome} ${building.ingles ?? ""}`.toLowerCase();
}

function unitFrame(unit: Unidade): GodTechTreeFrame {
  const tipo = (unit.tipo ?? []).map((item) => item.type ?? "").join(" ");
  if (/hero|her[oó]i/i.test(tipo)) return "hero";
  if (/m[ií]tic|myth/i.test(tipo)) return "myth";
  if (/navio|ship/i.test(tipo)) return "ship";
  return "unit";
}

function settlementRole(building: CatalogBuilding): "tc" | "village" | "citadel" | null {
  const label = labelOf(building);
  if (/citadel|cidadela/.test(label)) return "citadel";
  if (/village center|centro de aldeia/.test(label)) return "village";
  if (/town center|centro urbano/.test(label)) return "tc";
  return null;
}

function isHero(unit: Unidade): boolean {
  return (unit.tipo ?? []).some((tipo) => /hero|her[oó]i/i.test(tipo.type ?? ""));
}

function isSettlement(building: CatalogBuilding): boolean {
  return /town center|village center|citadel center|centro urbano|centro de aldeia|centro da cidadela/.test(labelOf(building));
}

function isWonder(building: CatalogBuilding): boolean {
  return /maravilha|wonder/.test(labelOf(building));
}

function wonderOwner(nome: string): string | null {
  const match = nome.match(/\(([^)]+)\)\s*$/);
  return match?.[1]?.trim() ?? null;
}

function isSharedDefensive(building: CatalogBuilding): boolean {
  const label = labelOf(building);
  if (/town center|centro urbano|temple|templo|wonder|maravilha/.test(label)) return false;
  return /wall|muralha|gate|port[aã]o|sentry|sentinela|torre/.test(label);
}

function displayBuildingName(building: CatalogBuilding, pantheonName: string | undefined): string {
  if (!pantheonName) return building.nome;
  const suffix = ` (${pantheonName})`;
  return building.nome.endsWith(suffix) ? building.nome.slice(0, -suffix.length).trim() : building.nome;
}

function buildingRank(building: CatalogBuilding): number {
  const label = labelOf(building);
  if (/citadel|cidadela/.test(label)) return 54;
  if (/village center|centro de aldeia/.test(label)) return 52;
  if (/town center|centro urbano/.test(label)) return 50;
  if (/house|casa/.test(label) && !/comunal|longhouse|guard/.test(label)) return 10;
  if (/temple|templo/.test(label)) return 15;
  if (/granary|celeiro|farm|moinho|fazenda/.test(label)) return 20;
  if (/storehouse|armaz[eé]m|guild|guilda/.test(label)) return 30;
  if (/dock|doca/.test(label)) return 40;
  if (/wall|muralha/.test(label)) return 60;
  if (/gate|port[aã]o/.test(label)) return 62;
  if (/tower|torre|sentry|sentinela|vigia/.test(label)) return 64;
  if (/military academy|academia militar|barracks|quartel|longhouse|casa comunal/.test(label)) return 70;
  if (/stable|est[aá]bulo/.test(label)) return 72;
  if (/archery|arqueiro/.test(label)) return 74;
  if (/market|mercado/.test(label)) return 80;
  if (/armou?ry|armaria/.test(label)) return 82;
  if (/fortress|fortaleza|migdol|pal[aá]cio|palace|castelo|castle|baolei|forte da/.test(label)) return 90;
  if (/wonder|maravilha/.test(label)) return 110;
  return 95;
}
