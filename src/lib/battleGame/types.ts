export type PlayableEraId = 2 | 3 | 4;

/** Treino escolhido antes do panteão. */
export type BattleTrainingMode = "category" | "real";

export type RoundPlan = {
  index: number;
  eraId: PlayableEraId;
};

export type RoundOutcome = "win" | "loss" | "draw";

export type RoundRecord = {
  index: number;
  eraId: PlayableEraId;
  defenderId: number;
  attackerId: number;
  outcome: RoundOutcome;
  mode: BattleTrainingMode;
};

export type RunSummary = {
  totalRounds: number;
  wins: number;
  losses: number;
  draws: number;
  byEra: Record<
    PlayableEraId,
    { rounds: number; wins: number; losses: number; draws: number }
  >;
  history: RoundRecord[];
};

export type BattlePhase = "playing" | "result" | "age_up" | "summary";
