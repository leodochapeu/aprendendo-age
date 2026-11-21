import type { Unidade } from "@/data/catalog";
import type { BattleTrainingMode, RoundOutcome } from "@/lib/battleGame/types";
import { visibleTipoItems } from "@/lib/unidadeTipo";

import { resolveBattleTypeId, resolveBestMultiplier } from "./classification";
import { listDamageChannels } from "./damage";
import type { BattleUnitTypeId, DamageChannel, MultiplierMatch } from "./types";

const EPS = 1e-6;

const TYPE_SKIP: ReadonlySet<BattleUnitTypeId> = new Set(["soldado_humano"]);

export type CategoryDuel = {
  mode: "category";
  winner: "a" | "b" | "draw";
  sameType: boolean;
  sideA: MultiplierMatch;
  sideB: MultiplierMatch;
};

export type RealHitChannel = {
  channel: DamageChannel;
  baseDamage: number;
  multiplier: number;
  matchedType: BattleUnitTypeId | null;
  /** Dano do golpe depois do multiplicador, antes da armadura. */
  boostedDamage: number;
  /** `null` = este canal ignora armadura (divino, área). */
  armorPercent: number | null;
  damagePerHit: number;
};

export type RealSide = {
  hp: number;
  attacksPerSecond: number;
  channels: RealHitChannel[];
  damagePerHit: number;
  dps: number;
  /** Segundos até derrubar o outro. `null` = não causa dano útil. */
  secondsToKill: number | null;
  /** Vida que sobra quando o confronto termina. */
  hpRemaining: number;
};

export type RealDuel = {
  mode: "real";
  winner: "a" | "b" | "draw";
  sideA: RealSide;
  sideB: RealSide;
};

export type TrainingDuel = CategoryDuel | RealDuel;

export function modeToSlug(mode: BattleTrainingMode): string {
  return mode === "category" ? "categoria" : "real";
}

export function modeFromSlug(slug: string | undefined): BattleTrainingMode | null {
  if (slug === "categoria" || slug === "category") return "category";
  if (slug === "real") return "real";
  return null;
}

/** Tipos de combate visíveis, sem a marca genérica de soldado humano. */
export function combatTypeIds(unit: Unidade): BattleUnitTypeId[] {
  const seen = new Set<BattleUnitTypeId>();
  const ids: BattleUnitTypeId[] = [];
  for (const item of visibleTipoItems(unit.tipo)) {
    const id = resolveBattleTypeId(item.type, item.icon);
    if (!id || TYPE_SKIP.has(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function sameCombatType(a: Unidade, b: Unidade): boolean {
  const left = combatTypeIds(a);
  const right = combatTypeIds(b);
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

function categoryWinner(sameType: boolean, sideA: MultiplierMatch, sideB: MultiplierMatch): CategoryDuel["winner"] {
  if (sameType) return "draw";
  if (sideA.factor > sideB.factor + EPS) return "a";
  if (sideB.factor > sideA.factor + EPS) return "b";
  return "draw";
}

export function resolveCategoryDuel(attacker: Unidade, defender: Unidade): CategoryDuel {
  const sameType = sameCombatType(attacker, defender);
  const sideA = resolveBestMultiplier(attacker, defender);
  const sideB = resolveBestMultiplier(defender, attacker);
  return {
    mode: "category",
    winner: categoryWinner(sameType, sideA, sideB),
    sameType,
    sideA,
    sideB,
  };
}

function unitHp(unit: Unidade): number {
  const hp = unit.pontos_de_vida ?? 0;
  return Number.isFinite(hp) ? Math.max(0, hp) : 0;
}

function armorMitigation(armorPercent: number | null): number {
  if (armorPercent == null) return 1;
  return 1 - Math.min(100, Math.max(0, armorPercent)) / 100;
}

function buildRealSide(attacker: Unidade, defender: Unidade): Omit<RealSide, "hpRemaining"> {
  const multiplier = resolveBestMultiplier(attacker, defender);
  const attacksPerSecond = Math.max(0, attacker.velocidade_de_ataque_atk_s ?? 0);
  const channels: RealHitChannel[] = listDamageChannels(attacker, defender).map((spec) => {
    const boostedDamage = spec.baseDamage * multiplier.factor;
    const damagePerHit = boostedDamage * armorMitigation(spec.armorPercent);
    return {
      channel: spec.channel,
      baseDamage: spec.baseDamage,
      multiplier: multiplier.factor,
      matchedType: multiplier.factor === 1 ? null : multiplier.matchedType,
      boostedDamage,
      armorPercent: spec.armorPercent,
      damagePerHit,
    };
  });
  const damagePerHit = channels.reduce((sum, channel) => sum + channel.damagePerHit, 0);
  const dps = damagePerHit * attacksPerSecond;
  const hp = unitHp(defender);
  const secondsToKill = dps > EPS && hp > EPS ? hp / dps : dps > EPS && hp <= EPS ? 0 : null;
  return { hp: unitHp(attacker), attacksPerSecond, channels, damagePerHit, dps, secondsToKill };
}

function fightDuration(sideA: Omit<RealSide, "hpRemaining">, sideB: Omit<RealSide, "hpRemaining">): number | null {
  const a = sideA.secondsToKill;
  const b = sideB.secondsToKill;
  if (a == null && b == null) return null;
  if (a == null) return b;
  if (b == null) return a;
  return Math.min(a, b);
}

function hpLeft(hp: number, incomingDps: number, duration: number | null): number {
  if (duration == null) return hp;
  return Math.max(0, hp - incomingDps * duration);
}

function realWinner(sideA: Omit<RealSide, "hpRemaining">, sideB: Omit<RealSide, "hpRemaining">): RealDuel["winner"] {
  const a = sideA.secondsToKill;
  const b = sideB.secondsToKill;
  if (a == null && b == null) return "draw";
  if (a == null) return "b";
  if (b == null) return "a";
  if (a + EPS < b) return "a";
  if (b + EPS < a) return "b";
  return "draw";
}

/**
 * Modo real: dano por golpe = ataque × multiplicador × (1 − armadura),
 * aplicado na vida do outro. Quem derruba primeiro vence.
 */
export function resolveRealDuel(attacker: Unidade, defender: Unidade): RealDuel {
  const rawA = buildRealSide(attacker, defender);
  const rawB = buildRealSide(defender, attacker);
  const duration = fightDuration(rawA, rawB);
  return {
    mode: "real",
    winner: realWinner(rawA, rawB),
    sideA: { ...rawA, hpRemaining: hpLeft(rawA.hp, rawB.dps, duration) },
    sideB: { ...rawB, hpRemaining: hpLeft(rawB.hp, rawA.dps, duration) },
  };
}

export function resolveTrainingDuel(
  attacker: Unidade,
  defender: Unidade,
  mode: BattleTrainingMode,
): TrainingDuel {
  return mode === "category" ? resolveCategoryDuel(attacker, defender) : resolveRealDuel(attacker, defender);
}

export function trainingOutcome(duel: TrainingDuel): RoundOutcome {
  if (duel.winner === "a") return "win";
  if (duel.winner === "b") return "loss";
  return "draw";
}
