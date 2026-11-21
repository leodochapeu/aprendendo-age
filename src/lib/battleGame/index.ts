export type {
  BattlePhase,
  BattleTrainingMode,
  PlayableEraId,
  RoundOutcome,
  RoundPlan,
  RoundRecord,
  RunSummary,
} from "./types";

export {
  DEFAULT_ERA_ROUND_COUNTS,
  PLAYABLE_ERA_IDS,
  buildRoundPlan,
  willAgeUp,
} from "./plan";

export {
  CATEGORY_EXAMPLE_UNIT_ID,
  categoriesForEra,
  categoryBeats,
  categoryById,
  categoryGroupsForEra,
  pickCategoryDefender,
  resolveCategoryChoice,
  type BattleCategory,
  type BattleCategoryId,
} from "./categoryDeck";

export {
  filterAttackerPool,
  filterDefenderPool,
  isHeroUnit,
  isHumanSoldierUnit,
  isMythUnit,
  isAttackerUnitLocked,
  isPreviousEraGranted,
  isUnitFromPreviousEra,
  isUnitEligibleForCurrentEra,
} from "./filters";

export {
  battlePairKey,
  buildBattleResultIndex,
  lookupBattleResult,
  mapPlayerOutcome,
  type BattleResultIndex,
} from "./lookup";

export {
  createRng,
  emptyEraStats,
  pickDefender,
  pickRandomUnit,
  resolvePlayerChoice,
  summarizeRun,
} from "./run";

export {
  FAVOR_EFFECT_COSTS,
  FAVOR_PER_WIN,
  INITIAL_FAVOR,
  canPurchaseFavorEffect,
  pickRandomUniqueIds,
  purchaseFavorEffect,
  rewardFavor,
  type FavorEffectId,
} from "./economy";
