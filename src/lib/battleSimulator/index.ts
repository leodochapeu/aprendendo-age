export type {
  BattleGroup,
  BattleResult,
  BattleRoundSnapshot,
  BattleSimulatorOptions,
  BattleUnitTypeId,
  CategoryBattleResult,
  CombatBattleResult,
  DamageChannel,
  DamageChannelBreakdown,
  DirectionalDamage,
  MultiplierMatch,
} from "./types";
export type {
  PrecomputedBattleMode,
  PrecomputedBattleResult,
  PrecomputedBattleWinner,
  UnitSlugResolver,
} from "./precompute";

export {
  getDefenderTypeIds,
  isHumanSoldierType,
  resolveBattleTypeId,
  resolveBestMultiplier,
} from "./classification";

export {
  channelEffectiveDps,
  computeDirectionalDamage,
  listDamageChannels,
} from "./damage";

export { aliveFromHp, simulateBattle } from "./simulateBattle";
export {
  combatTypeIds,
  modeFromSlug,
  modeToSlug,
  resolveCategoryDuel,
  resolveRealDuel,
  resolveTrainingDuel,
  sameCombatType,
  trainingOutcome,
} from "./training";
export type { CategoryDuel, RealDuel, RealHitChannel, RealSide, TrainingDuel } from "./training";
export {
  precomputeAllBattleResults,
  precomputeBattleResult,
} from "./precompute";
