import { describe, expect, it } from "vitest";
import type { Unidade } from "@/data/catalog";
import unidadesPt from "@/data/locale/pt/unidades_aom.json";
import battleResultsJson from "@/data/unidades_aom_battle_results.json";
import type { PrecomputedBattleResult } from "@/lib/battleSimulator/precompute";
import {
  buildBattleResultIndex,
  buildRoundPlan,
  createRng,
  filterAttackerPool,
  filterDefenderPool,
  FAVOR_EFFECT_COSTS,
  INITIAL_FAVOR,
  isHeroUnit,
  isHumanSoldierUnit,
  isMythUnit,
  isUnitFromPreviousEra,
  lookupBattleResult,
  pickDefender,
  pickRandomUniqueIds,
  purchaseFavorEffect,
  resolvePlayerChoice,
  rewardFavor,
  summarizeRun,
  willAgeUp,
  type RoundRecord,
} from "@/lib/battleGame";

const units = unidadesPt as Unidade[];
const battleResults = battleResultsJson as PrecomputedBattleResult[];

function byId(id: number): Unidade {
  const u = units.find((x) => x.id === id);
  if (!u) throw new Error(`missing ${id}`);
  return u;
}

function idByIngles(ingles: string): number {
  const u = units.find((x) => x.ingles === ingles);
  if (!u) throw new Error(`missing ingles=${ingles}`);
  return u.id;
}

const HOPLITE = idByIngles("Hoplite");
const TOXOTES = idByIngles("Toxotes");

describe("battleGame plan", () => {
  it("gera cronograma 4/4/2 começando na Clássica", () => {
    const plan = buildRoundPlan();
    expect(plan).toHaveLength(10);
    expect(plan.map((r) => r.eraId)).toEqual([2, 2, 2, 2, 3, 3, 3, 3, 4, 4]);
    expect(plan[0]!.index).toBe(0);
    expect(plan[9]!.index).toBe(9);
  });

  it("detecta avanço de Era nas rodadas 5 e 9 (índices 3→4 e 7→8)", () => {
    const plan = buildRoundPlan();
    expect(willAgeUp(plan, 3)).toBe(true);
    expect(willAgeUp(plan, 7)).toBe(true);
    expect(willAgeUp(plan, 0)).toBe(false);
    expect(willAgeUp(plan, 9)).toBe(false);
  });
});

describe("battleGame filters", () => {
  it("monta deck apenas com soldados humanos", () => {
    const classic = filterAttackerPool(units, 1, 2);
    expect(classic.length).toBeGreaterThan(0);
    expect(classic.every((u) => u.panteao?.[0]?.id === 1)).toBe(true);
    expect(classic.every(isHumanSoldierUnit)).toBe(true);
    expect(classic.every((u) => !isMythUnit(u))).toBe(true);
    expect(classic.every((u) => !isHeroUnit(u))).toBe(true);
  });

  it("monta pool defensor apenas com soldados humanos", () => {
    const defenders = filterDefenderPool(units, 4, []);
    expect(defenders.length).toBeGreaterThan(0);
    expect(defenders.every(isHumanSoldierUnit)).toBe(true);
    expect(defenders.every((u) => !isMythUnit(u))).toBe(true);
    expect(defenders.every((u) => !isHeroUnit(u))).toBe(true);
  });

  it("mantém pools não vazios para todos os panteões nas 3 eras", () => {
    for (const pantheonId of [1, 2, 3, 4, 5, 6, 7]) {
      for (const eraId of [2, 3, 4] as const) {
        expect(filterAttackerPool(units, pantheonId, eraId).length).toBeGreaterThan(0);
        expect(filterDefenderPool(units, eraId, []).length).toBeGreaterThan(0);
      }
    }
  });

  it("evita repetir defensores enquanto houver opções", () => {
    const pool = filterDefenderPool(units, 2, []);
    const used = pool.slice(0, 3).map((u) => u.id);
    const next = filterDefenderPool(units, 2, used);
    expect(next.every((u) => !used.includes(u.id))).toBe(true);
  });

  it("identifica unidades de Eras anteriores a partir da Heróica", () => {
    const heroicDeck = filterAttackerPool(units, 1, 3);
    const previous = heroicDeck.filter((u) => isUnitFromPreviousEra(u, 3));
    const current = heroicDeck.filter((u) => !isUnitFromPreviousEra(u, 3));

    expect(previous.length).toBeGreaterThan(0);
    expect(previous.every((u) => u.era?.[0]?.id === 2)).toBe(true);
    expect(current.some((u) => u.era?.[0]?.id === 3)).toBe(true);
    expect(
      filterAttackerPool(units, 1, 2).some((u) =>
        isUnitFromPreviousEra(u, 2),
      ),
    ).toBe(false);
  });
});

describe("battleGame lookup", () => {
  const index = buildBattleResultIndex(battleResults);

  it("Toxotes vence Hoplita no lookup pré-calculado", () => {
    const result = lookupBattleResult(index, TOXOTES, HOPLITE);
    expect(result?.winner).toBe("attacker");
    expect(result?.mode).toBe("mode_category_battle");
  });

  it("resolve escolha do jogador como win/loss/draw", () => {
    const win = resolvePlayerChoice(index, TOXOTES, HOPLITE);
    expect(win?.outcome).toBe("win");

    const loss = resolvePlayerChoice(index, HOPLITE, TOXOTES);
    expect(loss?.outcome).toBe("loss");
  });

  it("empata quando atacante e defensor são a mesma unidade", () => {
    const same = resolvePlayerChoice(index, HOPLITE, HOPLITE);
    expect(same?.outcome).toBe("draw");
  });
});

describe("battleGame favor economy", () => {
  it("começa com 10 e concede mais 10 somente em vitória", () => {
    expect(INITIAL_FAVOR).toBe(10);
    expect(rewardFavor(INITIAL_FAVOR, "win")).toBe(20);
    expect(rewardFavor(INITIAL_FAVOR, "loss")).toBe(10);
    expect(rewardFavor(INITIAL_FAVOR, "draw")).toBe(10);
  });

  it("cobra os custos configurados para cada efeito", () => {
    expect(FAVOR_EFFECT_COSTS.revealDefenderCategory).toBe(20);
    expect(FAVOR_EFFECT_COSTS.revealDeckUnitCategory).toBe(10);
    expect(FAVOR_EFFECT_COSTS.unlockPreviousAgeUnits).toBe(30);
    expect(purchaseFavorEffect(20, "revealDefenderCategory")).toBe(0);
    expect(purchaseFavorEffect(10, "revealDeckUnitCategory")).toBe(0);
    expect(purchaseFavorEffect(30, "unlockPreviousAgeUnits")).toBe(0);
    expect(purchaseFavorEffect(10, "revealDefenderCategory")).toBeNull();
  });

  it("desbloqueia 2 IDs aleatórios distintos de forma reproduzível", () => {
    const first = pickRandomUniqueIds([1, 2, 3, 4], 2, createRng(7));
    const second = pickRandomUniqueIds([1, 2, 3, 4], 2, createRng(7));

    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
    expect(new Set(first).size).toBe(2);
    expect(pickRandomUniqueIds([1], 2, createRng(7))).toEqual([1]);
  });
});

describe("battleGame run", () => {
  it("sorteio com seed é reproduzível", () => {
    const a = pickDefender(units, 2, [], createRng(42));
    const b = pickDefender(units, 2, [], createRng(42));
    expect(a?.id).toBe(b?.id);
  });

  it("derrota e empate contabilizam e o resumo agrega por Era", () => {
    const history: RoundRecord[] = [
      {
        index: 0,
        eraId: 2,
        defenderId: 2,
        attackerId: 1,
        outcome: "win",
        mode: "mode_category_battle",
      },
      {
        index: 1,
        eraId: 2,
        defenderId: 3,
        attackerId: 1,
        outcome: "loss",
        mode: "mode_category_battle",
      },
      {
        index: 4,
        eraId: 3,
        defenderId: byId(40).id,
        attackerId: 1,
        outcome: "draw",
        mode: "attributes_fallback",
      },
    ];
    const summary = summarizeRun(history);
    expect(summary.wins).toBe(1);
    expect(summary.losses).toBe(1);
    expect(summary.draws).toBe(1);
    expect(summary.byEra[2].wins).toBe(1);
    expect(summary.byEra[2].losses).toBe(1);
    expect(summary.byEra[3].draws).toBe(1);
  });
});
