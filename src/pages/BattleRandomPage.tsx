import { useCallback, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { BattleAgeUpOverlay } from "@/components/battle/BattleAgeUpOverlay";
import { BattleAtmosphere, BattleEpicFrame } from "@/components/battle/BattleAtmosphere";
import { BattleConfirmModal } from "@/components/battle/BattleConfirmModal";
import { BattleResultModal } from "@/components/battle/BattleResultModal";
import { BattleFavorModal } from "@/components/battle/BattleFavorModal";
import { BattleRevealConfirmModal, RevealEyeButton } from "@/components/battle/BattleRevealConfirmModal";
import { BattleUnitPortrait } from "@/components/battle/BattleUnitPortrait";
import type { Unidade } from "@/data/catalog";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import {
  buildRoundPlan,
  filterAttackerPool,
  INITIAL_FAVOR,
  isUnitFromPreviousEra,
  pickRandomUniqueIds,
  canPurchaseFavorEffect,
  FAVOR_EFFECT_COSTS,
  pickDefender,
  purchaseFavorEffect,
  rewardFavor,
  summarizeRun,
  willAgeUp,
  type BattlePhase,
  type BattleTrainingMode,
  type PlayableEraId,
  type RoundOutcome,
  type RoundRecord,
} from "@/lib/battleGame";
import { modeFromSlug, modeToSlug, resolveTrainingDuel, trainingOutcome, type TrainingDuel } from "@/lib/battleSimulator";
import { cn } from "@/lib/cn";
import { firstNome } from "@/lib/entityRefs";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
import { NotionText } from "@/components/ui/NotionText";
import { visibleTipoItems } from "@/lib/unidadeTipo";

type LastResult = {
  outcome: RoundOutcome;
  mode: BattleTrainingMode;
  attacker: Unidade;
  defender: Unidade;
  duel: TrainingDuel;
};

type CatalogSlice = ReturnType<typeof useCatalog>;

function outcomeClass(outcome: RoundOutcome): string {
  if (outcome === "win") return "border-emerald-500/50 bg-emerald-950/50 text-emerald-200";
  if (outcome === "loss") return "border-rose-500/50 bg-rose-950/50 text-rose-200";
  return "border-amber-500/40 bg-amber-950/40 text-amber-100";
}

function initialDefender(
  units: readonly Unidade[],
  eraId: PlayableEraId,
): { defenderId: number | null; used: number[] } {
  const defender = pickDefender(units, eraId, []);
  return {
    defenderId: defender?.id ?? null,
    used: defender ? [defender.id] : [],
  };
}

export function BattleRandomPage() {
  const { pantheonSlug, mode: modeSlug } = useParams<{ pantheonSlug: string; mode: string }>();
  const mode = modeFromSlug(modeSlug);
  const catalog = useCatalog();
  const { panteaoBySlug } = catalog;
  const [bootKey, setBootKey] = useState(0);

  const pantheon = pantheonSlug ? panteaoBySlug.get(pantheonSlug) : undefined;

  if (!mode) return <Navigate to="/battle/random" replace />;

  if (!pantheonSlug || !pantheon) {
    return <Navigate to={`/battle/random/${modeToSlug(mode)}`} replace />;
  }

  return (
    <BattleRandomSession
      key={`${pantheon.id}-${mode}-${bootKey}`}
      mode={mode}
      pantheon={pantheon}
      catalog={catalog}
      onRestart={() => setBootKey((k) => k + 1)}
    />
  );
}

function BattleRandomSession({
  mode,
  pantheon,
  catalog,
  onRestart,
}: {
  mode: BattleTrainingMode;
  pantheon: CatalogSlice["panteoes"][number];
  catalog: CatalogSlice;
  onRestart: () => void;
}) {
  const { t } = useTranslation();
  const { unidades, unidadeById, eras, eraById } = catalog;
  const plan = useMemo(() => buildRoundPlan(), []);
  const firstEra = (plan[0]?.eraId ?? 2) as PlayableEraId;
  const first = initialDefender(unidades, firstEra);

  const [phase, setPhase] = useState<BattlePhase>("playing");
  const [roundIndex, setRoundIndex] = useState(0);
  const [defenderId, setDefenderId] = useState<number | null>(first.defenderId);
  const [usedDefenderIds, setUsedDefenderIds] = useState<number[]>(first.used);
  const [pendingAttackerId, setPendingAttackerId] = useState<number | null>(null);
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [ageUpEraId, setAgeUpEraId] = useState<PlayableEraId | null>(null);
  const [favor, setFavor] = useState(INITIAL_FAVOR);
  const [favorModalOpen, setFavorModalOpen] = useState(false);
  const [pendingReveal, setPendingReveal] = useState<"defender" | "deck" | null>(null);
  const [revealDefenderCategory, setRevealDefenderCategory] = useState(false);
  const [revealDeckUnitArmed, setRevealDeckUnitArmed] = useState(false);
  const [revealedAttackerId, setRevealedAttackerId] = useState<number | null>(
    null,
  );
  const [unlockedPreviousAgeUnitIds, setUnlockedPreviousAgeUnitIds] = useState<
    number[]
  >([]);

  const currentEraId = (plan[roundIndex]?.eraId ?? 2) as PlayableEraId;
  const currentEra = eraById.get(currentEraId);

  const attackerPool = useMemo(
    () => filterAttackerPool(unidades, pantheon.id, currentEraId),
    [unidades, pantheon.id, currentEraId],
  );
  const previousAgeUnitIds = useMemo(
    () =>
      attackerPool
        .filter((unit) => isUnitFromPreviousEra(unit, currentEraId))
        .map((unit) => unit.id),
    [attackerPool, currentEraId],
  );
  const unlockedPreviousAgeUnitIdSet = useMemo(
    () => new Set(unlockedPreviousAgeUnitIds),
    [unlockedPreviousAgeUnitIds],
  );
  const lockedPreviousAgeUnitIds = previousAgeUnitIds.filter(
    (id) => !unlockedPreviousAgeUnitIdSet.has(id),
  );

  const defender = defenderId != null ? unidadeById.get(defenderId) : undefined;
  const pendingAttacker =
    pendingAttackerId != null ? unidadeById.get(pendingAttackerId) : undefined;

  const wins = history.filter((h) => h.outcome === "win").length;
  const losses = history.filter((h) => h.outcome === "loss").length;
  const draws = history.filter((h) => h.outcome === "draw").length;
  const deckUnitRevealPurchased =
    revealDeckUnitArmed || revealedAttackerId != null;

  const selectAttacker = (attackerId: number) => {
    setPendingAttackerId(attackerId);
    if (revealDeckUnitArmed && revealedAttackerId == null) {
      setRevealedAttackerId(attackerId);
      setRevealDeckUnitArmed(false);
    }
  };

  const buyDefenderReveal = () => {
    const nextFavor = purchaseFavorEffect(favor, "revealDefenderCategory");
    if (nextFavor == null || revealDefenderCategory) return;
    setFavor(nextFavor);
    setRevealDefenderCategory(true);
  };

  const buyDeckUnitReveal = () => {
    const nextFavor = purchaseFavorEffect(favor, "revealDeckUnitCategory");
    if (nextFavor == null || deckUnitRevealPurchased) return;
    setFavor(nextFavor);
    setRevealDeckUnitArmed(true);
    setFavorModalOpen(false);
  };

  const buyPreviousAgeUnlock = () => {
    const nextFavor = purchaseFavorEffect(favor, "unlockPreviousAgeUnits");
    if (
      nextFavor == null ||
      unlockedPreviousAgeUnitIds.length > 0 ||
      lockedPreviousAgeUnitIds.length === 0
    ) {
      return;
    }
    const unlocked = pickRandomUniqueIds(lockedPreviousAgeUnitIds, 2);
    setFavor(nextFavor);
    setUnlockedPreviousAgeUnitIds(unlocked);
    setFavorModalOpen(false);
  };

  const confirmAttack = useCallback(() => {
    if (!pendingAttacker || !defender || phase !== "playing") return;
    const duel = resolveTrainingDuel(pendingAttacker, defender, mode);
    const outcome = trainingOutcome(duel);

    const record: RoundRecord = {
      index: roundIndex,
      eraId: currentEraId,
      defenderId: defender.id,
      attackerId: pendingAttacker.id,
      outcome,
      mode,
    };

    setHistory((prev) => [...prev, record]);
    setLastResult({
      outcome,
      mode,
      attacker: pendingAttacker,
      defender,
      duel,
    });
    setFavor((current) => rewardFavor(current, outcome));
    setPendingAttackerId(null);
    setPhase("result");
  }, [pendingAttacker, defender, phase, mode, roundIndex, currentEraId]);

  const continueAfterResult = useCallback(() => {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= plan.length) {
      setPhase("summary");
      return;
    }

    setRevealDefenderCategory(false);
    setRevealDeckUnitArmed(false);
    setRevealedAttackerId(null);
    setUnlockedPreviousAgeUnitIds([]);
    setFavorModalOpen(false);
    setPendingReveal(null);

    if (willAgeUp(plan, roundIndex)) {
      setAgeUpEraId(plan[nextIndex]!.eraId);
      setPhase("age_up");
      return;
    }

    const nextEra = plan[nextIndex]!.eraId;
    const nextDefender = pickDefender(unidades, nextEra, usedDefenderIds);
    setRoundIndex(nextIndex);
    setDefenderId(nextDefender?.id ?? null);
    if (nextDefender) {
      setUsedDefenderIds((prev) =>
        prev.includes(nextDefender.id) ? prev : [...prev, nextDefender.id],
      );
    }
    setLastResult(null);
    setPhase("playing");
  }, [roundIndex, plan, unidades, usedDefenderIds]);

  const finishAgeUp = useCallback(() => {
    const nextIndex = roundIndex + 1;
    const nextEra = plan[nextIndex]?.eraId ?? currentEraId;
    const nextDefender = pickDefender(unidades, nextEra, usedDefenderIds);
    setRoundIndex(nextIndex);
    setDefenderId(nextDefender?.id ?? null);
    if (nextDefender) {
      setUsedDefenderIds((prev) =>
        prev.includes(nextDefender.id) ? prev : [...prev, nextDefender.id],
      );
    }
    setAgeUpEraId(null);
    setLastResult(null);
    setPhase("playing");
  }, [roundIndex, plan, currentEraId, unidades, usedDefenderIds]);

  if (defenderId == null) {
    return (
      <BattleAtmosphere>
        <BattleEpicFrame wash="rose" bodyClassName="p-6 text-rose-100">
          {t("pages.battle.noDefender")}
        </BattleEpicFrame>
      </BattleAtmosphere>
    );
  }

  if (phase === "summary") {
    const summary = summarizeRun(history);
    return (
      <BattleAtmosphere>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-pink-300">{t("common.beta")}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide text-amber-50">
          {t("pages.battle.summaryTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-200">{t("pages.battle.summaryDescription")}</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard label={t("pages.battle.wins")} value={summary.wins} tone="win" />
          <StatCard label={t("pages.battle.losses")} value={summary.losses} tone="loss" />
          <StatCard label={t("pages.battle.draws")} value={summary.draws} tone="draw" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {([2, 3, 4] as const).map((eraId) => {
            const era = eraById.get(eraId);
            const stats = summary.byEra[eraId];
            return (
              <BattleEpicFrame key={eraId} bodyClassName="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/80">
                  {era?.nome ?? `Era ${eraId}`}
                </p>
                <p className="mt-2 text-sm text-zinc-100">
                  {t("pages.battle.eraStats", {
                    wins: String(stats.wins),
                    losses: String(stats.losses),
                    draws: String(stats.draws),
                  })}
                </p>
              </BattleEpicFrame>
            );
          })}
        </div>

        <ul className="mt-6 space-y-2">
          {summary.history.map((row) => {
            const atk = unidadeById.get(row.attackerId);
            const def = unidadeById.get(row.defenderId);
            const era = eras.find((e) => e.id === row.eraId);
            return (
              <li
                key={row.index}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                  outcomeClass(row.outcome),
                )}
              >
                <span className="font-semibold">#{row.index + 1}</span>
                <span className="text-zinc-400">{era?.nome}</span>
                <span>
                  {atk?.nome ?? row.attackerId} → {def?.nome ?? row.defenderId}
                </span>
                <span className="ml-auto font-semibold uppercase">
                  {t(`pages.battle.outcome.${row.outcome}`)}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30"
          >
            {t("pages.battle.playAgain")}
          </button>
          <Link
            to="/battle"
            className="rounded-xl border border-amber-200/25 bg-black/40 px-4 py-2.5 text-center text-sm font-medium text-amber-50 transition hover:border-amber-200/55"
          >
            {t("pages.battle.backToMenu")}
          </Link>
        </div>
      </div>
      </BattleAtmosphere>
    );
  }

  return (
    <BattleAtmosphere>
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pink-300">
            {t("common.beta")}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/80">
            {mode === "category" ? t("pages.battle.modeCategoryTitle") : t("pages.battle.modeRealTitle")}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-wide text-amber-50 sm:text-4xl">
            {pantheon.nome}
          </h1>
          <p className="mt-1 text-sm text-zinc-300">
            {t("pages.battle.roundProgress", {
              current: String(roundIndex + 1),
              total: String(plan.length),
            })}
          </p>
          <button
            type="button"
            disabled={phase !== "playing"}
            onClick={() => setFavorModalOpen(true)}
            className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-400/30 bg-blue-950/35 px-3 py-1.5 text-sm font-semibold text-blue-100 shadow-sm shadow-blue-950/40 transition hover:border-blue-300/55 hover:bg-blue-950/55 focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {getIconFieldUrl("favoraom") ? (
              <img
                src={getIconFieldUrl("favoraom")}
                alt=""
                aria-hidden
                className="size-5 object-contain"
              />
            ) : null}
            <span className="tabular-nums">{favor}</span>
            <span className="font-medium text-blue-200/75">
              {t("pages.battle.favor")}
            </span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <ScorePill label={t("pages.battle.wins")} value={wins} tone="win" />
          <ScorePill label={t("pages.battle.losses")} value={losses} tone="loss" />
          <ScorePill label={t("pages.battle.draws")} value={draws} tone="draw" />
        </div>
      </header>

      <BattleEpicFrame glow={false} className="mb-6" bodyClassName="flex items-center gap-3 px-4 py-3">
        {currentEra?.icon ? (
          <img
            src={getIconFieldUrl(currentEra.icon)}
            alt=""
            aria-hidden
            className="size-10 object-contain"
          />
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-amber-200/70">{t("pages.battle.currentAge")}</p>
          <p className="font-semibold text-amber-100">{currentEra?.nome ?? `Era ${currentEraId}`}</p>
        </div>
        <div className="ml-auto flex gap-1">
          {plan.map((r) => (
            <span
              key={r.index}
              className={cn(
                "size-2.5 rounded-full",
                r.index < roundIndex
                  ? "bg-amber-400"
                  : r.index === roundIndex
                    ? "bg-amber-200 ring-2 ring-amber-400/40"
                    : "bg-zinc-700",
              )}
              title={`#${r.index + 1}`}
            />
          ))}
        </div>
      </BattleEpicFrame>

      <section className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
        <BattleEpicFrame wash="emerald" bodyClassName="p-4">
          <div className="flex items-start justify-between gap-8">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                {t("pages.battle.yourDeck")}
              </p>
              <p className="mt-1 text-sm text-zinc-300">{t("pages.battle.pickUnitHint")}</p>
            </div>
            <RevealEyeButton
              label={t("pages.battle.revealDeckUnitCategory")}
              active={deckUnitRevealPurchased}
              disabled={phase !== "playing"}
              locked={!canPurchaseFavorEffect(favor, "revealDeckUnitCategory")}
              onClick={() => setPendingReveal("deck")}
            />
          </div>
          <ul
            className={cn(
              "mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6",
              revealedAttackerId != null && "pb-8",
            )}
          >
            {attackerPool.map((u) => {
              const locked =
                isUnitFromPreviousEra(u, currentEraId) &&
                !unlockedPreviousAgeUnitIdSet.has(u.id);
              return (
                <li key={u.id} className="flex flex-col items-center gap-1.5">
                  <BattleUnitPortrait
                    nome={u.nome}
                    icon={u.icon}
                    unitId={u.id}
                    size="sm"
                    locked={locked}
                    disabled={phase !== "playing" || locked}
                    selected={pendingAttackerId === u.id}
                    onClick={() => selectAttacker(u.id)}
                  />
                  {u.id === revealedAttackerId ? <RevealedTipoIcons tipo={u.tipo} /> : null}
                </li>
              );
            })}
          </ul>
          {attackerPool.length === 0 ? (
            <p className="mt-4 text-sm text-rose-200">{t("pages.battle.emptyDeck")}</p>
          ) : null}
        </BattleEpicFrame>

        <div className="hidden items-center justify-center lg:flex">
          <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-amber-100 drop-shadow-[0_0_18px_rgba(255,196,70,0.45)]">
            VS
          </span>
        </div>

        <BattleEpicFrame wash="rose" bodyClassName="p-4">
          <div className="flex items-start justify-between gap-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-200">
              {t("pages.battle.enemy")}
            </p>
            <RevealEyeButton
              label={t("pages.battle.revealDefenderCategory")}
              active={revealDefenderCategory}
              disabled={phase !== "playing"}
              locked={!canPurchaseFavorEffect(favor, "revealDefenderCategory")}
              onClick={() => setPendingReveal("defender")}
            />
          </div>
          {defender ? (
            <div className="mt-4 flex flex-col items-center gap-3 text-center">
              <BattleUnitPortrait nome={defender.nome} icon={defender.icon} unitId={defender.id} size="lg" />
              {revealDefenderCategory ? <RevealedTipoIcons tipo={defender.tipo} /> : null}
              <p className="font-semibold text-amber-50">{defender.nome}</p>
              {firstNome(defender.panteao) ? (
                <p className="text-xs text-zinc-300">
                  <NotionText text={firstNome(defender.panteao)!} />
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-300">{t("pages.battle.noDefender")}</p>
          )}
        </BattleEpicFrame>
      </section>

      {lastResult ? (
        <BattleResultModal
          open={phase === "result"}
          outcome={lastResult.outcome}
          attacker={lastResult.attacker}
          defender={lastResult.defender}
          duel={lastResult.duel}
          continueLabel={
            roundIndex + 1 >= plan.length ? t("pages.battle.seeSummary") : t("pages.battle.continue")
          }
          onContinue={continueAfterResult}
        />
      ) : null}

      <BattleConfirmModal
        open={pendingAttackerId != null && phase === "playing"}
        attacker={pendingAttacker ?? null}
        defender={defender ?? null}
        revealAttackerCategory={
          pendingAttackerId != null &&
          pendingAttackerId === revealedAttackerId
        }
        revealDefenderCategory={revealDefenderCategory}
        onClose={() => setPendingAttackerId(null)}
        onConfirm={confirmAttack}
      />

      <BattleRevealConfirmModal
        open={pendingReveal != null && phase === "playing"}
        title={
          pendingReveal === "defender"
            ? t("pages.battle.revealDefenderCategory")
            : t("pages.battle.revealDeckUnitCategory")
        }
        description={
          pendingReveal === "defender"
            ? t("pages.battle.revealDefenderCategoryHint")
            : t("pages.battle.revealDeckUnitCategoryHint")
        }
        cost={
          pendingReveal === "defender"
            ? FAVOR_EFFECT_COSTS.revealDefenderCategory
            : FAVOR_EFFECT_COSTS.revealDeckUnitCategory
        }
        onClose={() => setPendingReveal(null)}
        onConfirm={() => {
          if (pendingReveal === "defender") buyDefenderReveal();
          if (pendingReveal === "deck") buyDeckUnitReveal();
          setPendingReveal(null);
        }}
      />

      <BattleFavorModal
        open={favorModalOpen && phase === "playing"}
        favor={favor}
        defenderRevealed={revealDefenderCategory}
        deckUnitRevealPurchased={deckUnitRevealPurchased}
        hasLockedPreviousAgeUnits={lockedPreviousAgeUnitIds.length > 0}
        previousAgeUnitsUnlocked={unlockedPreviousAgeUnitIds.length > 0}
        onClose={() => setFavorModalOpen(false)}
        onRevealDefender={buyDefenderReveal}
        onRevealDeckUnit={buyDeckUnitReveal}
        onUnlockPreviousAgeUnits={buyPreviousAgeUnlock}
      />

      <BattleAgeUpOverlay
        open={phase === "age_up" && ageUpEraId != null}
        eraId={ageUpEraId ?? 3}
        eraName={eraById.get(ageUpEraId ?? 3)?.nome ?? ""}
        eraIcon={eraById.get(ageUpEraId ?? 3)?.icon}
        onDone={finishAgeUp}
      />
    </div>
    </BattleAtmosphere>
  );
}

function RevealedTipoIcons({ tipo }: { tipo: Unidade["tipo"] }) {
  const items = visibleTipoItems(tipo);
  if (!items.length) return null;

  return (
    <div className="flex items-center justify-center gap-1">
      {items.map((item, index) => {
        const src = getIconFieldUrl(item.icon);
        const label = item.type?.trim() || "";
        return (
          <span key={`${label}-${item.icon ?? ""}-${index}`} className="group relative inline-flex">
            <span
              tabIndex={0}
              aria-label={label}
              className="flex size-6 items-center justify-center rounded-md border border-amber-200/25 bg-black/55 shadow-sm shadow-black/40 outline-none ring-amber-200/40 focus-visible:ring-2"
            >
              {src ? <img src={src} alt="" aria-hidden className="size-4 object-contain" /> : null}
            </span>
            {label ? (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-30 -translate-x-1/2 whitespace-nowrap rounded-lg border border-amber-200/35 bg-[#1a1612] px-2.5 py-1 text-xs font-medium text-amber-50 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {label}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function ScorePill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "win" | "loss" | "draw";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 font-semibold tabular-nums",
        tone === "win" && "border-emerald-500/40 bg-emerald-950/40 text-emerald-200",
        tone === "loss" && "border-rose-500/40 bg-rose-950/40 text-rose-200",
        tone === "draw" && "border-amber-500/40 bg-amber-950/40 text-amber-100",
      )}
    >
      {label}: {value}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "win" | "loss" | "draw";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-center",
        outcomeClass(tone === "win" ? "win" : tone === "loss" ? "loss" : "draw"),
      )}
    >
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
