import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import { BattleAgeUpOverlay } from "@/components/battle/BattleAgeUpOverlay";
import { BattleAtmosphere, BattleEpicFrame } from "@/components/battle/BattleAtmosphere";
import { BattleConfirmSheet } from "@/components/battle/BattleConfirmSheet";
import { BattleUnitHoverCard } from "@/components/battle/BattleUnitPortrait";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import {
  buildRoundPlan,
  CATEGORY_EXAMPLE_UNIT_ID,
  categoryBeats,
  categoryById,
  categoryGroupsForEra,
  pickCategoryDefender,
  resolveCategoryChoice,
  willAgeUp,
  type BattleCategory,
  type BattleCategoryId,
  type BattlePhase,
  type PlayableEraId,
  type RoundOutcome,
} from "@/lib/battleGame";
import { cn } from "@/lib/cn";
import { getUnidadeAssetUrl } from "@/lib/entityWatermarkUrls";
import { getIconFieldUrl } from "@/lib/notionTokenAssets";
import { unitIdleVfx } from "@/lib/unitIdleVfx";

type CategoryRound = {
  index: number;
  eraId: PlayableEraId;
  attackerId: BattleCategoryId;
  defenderId: BattleCategoryId;
  outcome: RoundOutcome;
};

function outcomeClass(outcome: RoundOutcome): string {
  if (outcome === "win") return "border-emerald-500/50 bg-emerald-950/50 text-emerald-200";
  if (outcome === "loss") return "border-rose-500/50 bg-rose-950/50 text-rose-200";
  return "border-amber-500/40 bg-amber-950/40 text-amber-100";
}

function CategoryIcon({
  category,
  size = "md",
}: {
  category: BattleCategory;
  size?: "md" | "lg";
}) {
  const { t } = useTranslation();
  const { unidadeById } = useCatalog();
  const example = unidadeById.get(CATEGORY_EXAMPLE_UNIT_ID[category.id]);
  const hero = category.id === "heroi";
  const [previewOpen, setPreviewOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const src = getIconFieldUrl(category.icon);
  const label = t(category.labelKey);
  return (
    <span
      ref={anchorRef}
      className={cn("flex flex-col items-center gap-2 text-center", size === "md" && "w-full")}
      onMouseEnter={() => setPreviewOpen(true)}
      onMouseLeave={() => setPreviewOpen(false)}
      onFocus={() => setPreviewOpen(true)}
      onBlur={(event: FocusEvent<HTMLSpanElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPreviewOpen(false);
      }}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl border border-white/10 bg-[#1a1612]",
          size === "lg" ? "size-28 sm:size-32" : "size-16",
        )}
      >
        {src ? <img src={src} alt="" className={size === "lg" ? "size-20 object-contain" : "size-12 object-contain"} /> : null}
      </span>
      <span
        className={cn(
          "font-semibold leading-tight text-amber-50",
          size === "lg" ? "text-base" : "flex h-10 w-full items-center justify-center text-center text-sm",
        )}
      >
        {label}
      </span>
      {previewOpen && example ? (
        <BattleUnitHoverCard
          nome={example.nome}
          unitId={example.id}
          portraitSrc={getUnidadeAssetUrl({ icon: example.icon })}
          anchorRef={anchorRef}
          hero={hero}
          vfx={hero ? unitIdleVfx(example.id) : undefined}
        />
      ) : null}
    </span>
  );
}

export function BattleCategorySession({ onRestart }: { onRestart: () => void }) {
  const { t } = useTranslation();
  const { eraById, eras } = useCatalog();
  const plan = useMemo(() => buildRoundPlan(), []);
  const firstEra = (plan[0]?.eraId ?? 2) as PlayableEraId;

  const [phase, setPhase] = useState<BattlePhase>("playing");
  const [roundIndex, setRoundIndex] = useState(0);
  const [defenderId, setDefenderId] = useState<BattleCategoryId | null>(
    () => pickCategoryDefender(categoryGroupsForEra(firstEra).flat(), null)?.id ?? null,
  );
  const [pendingId, setPendingId] = useState<BattleCategoryId | null>(null);
  const [history, setHistory] = useState<CategoryRound[]>([]);
  const [lastRound, setLastRound] = useState<CategoryRound | null>(null);
  const [ageUpEraId, setAgeUpEraId] = useState<PlayableEraId | null>(null);
  const [lockedHintOpen, setLockedHintOpen] = useState(false);
  const lockedButtonRef = useRef<HTMLButtonElement>(null);

  const currentEraId = (plan[roundIndex]?.eraId ?? 2) as PlayableEraId;
  const currentEra = eraById.get(currentEraId);
  const groups = categoryGroupsForEra(currentEraId);
  const defender = defenderId ? categoryById(defenderId) : null;
  const pending = pendingId ? categoryById(pendingId) : null;

  const wins = history.filter((row) => row.outcome === "win").length;
  const losses = history.filter((row) => row.outcome === "loss").length;

  useEffect(() => {
    setLockedHintOpen(false);
  }, [defenderId]);

  const advanceDefender = useCallback(
    (eraId: PlayableEraId, previousId: BattleCategoryId | null) => {
      const next = pickCategoryDefender(categoryGroupsForEra(eraId).flat(), previousId);
      setDefenderId(next?.id ?? null);
    },
    [],
  );

  const confirmChoice = () => {
    if (!pendingId || !defenderId || phase !== "playing" || pendingId === defenderId) return;
    const outcome = resolveCategoryChoice(pendingId, defenderId);
    const record: CategoryRound = {
      index: roundIndex,
      eraId: currentEraId,
      attackerId: pendingId,
      defenderId,
      outcome,
    };
    setHistory((prev) => [...prev, record]);
    setLastRound(record);
    setPendingId(null);
    setPhase("result");
  };

  const continueAfterResult = () => {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= plan.length) {
      setPhase("summary");
      return;
    }
    if (willAgeUp(plan, roundIndex)) {
      setAgeUpEraId(plan[nextIndex]!.eraId);
      setPhase("age_up");
      return;
    }
    const nextEra = plan[nextIndex]!.eraId;
    setRoundIndex(nextIndex);
    advanceDefender(nextEra, defenderId);
    setLastRound(null);
    setPhase("playing");
  };

  const finishAgeUp = () => {
    const nextIndex = roundIndex + 1;
    const nextEra = plan[nextIndex]?.eraId ?? currentEraId;
    setRoundIndex(nextIndex);
    advanceDefender(nextEra, defenderId);
    setAgeUpEraId(null);
    setLastRound(null);
    setPhase("playing");
  };

  const resultLine = (round: CategoryRound) => {
    const attackerName = t(categoryById(round.attackerId).labelKey);
    const defenderName = t(categoryById(round.defenderId).labelKey);
    if (round.outcome === "draw") return t("pages.battle.categorySame");
    if (categoryBeats(round.attackerId) === round.defenderId) {
      return t("pages.battle.categoryBeats", { winner: attackerName, loser: defenderName });
    }
    if (categoryBeats(round.defenderId) === round.attackerId) {
      return t("pages.battle.categoryBeats", { winner: defenderName, loser: attackerName });
    }
    return t("pages.battle.categoryNoRelation", { choice: attackerName, defender: defenderName });
  };

  if (!defender) {
    return (
      <BattleAtmosphere>
        <BattleEpicFrame wash="rose" bodyClassName="p-6 text-rose-100">
          {t("pages.battle.noDefender")}
        </BattleEpicFrame>
      </BattleAtmosphere>
    );
  }

  if (phase === "summary") {
    const byEra = { 2: { wins: 0, losses: 0, draws: 0 }, 3: { wins: 0, losses: 0, draws: 0 }, 4: { wins: 0, losses: 0, draws: 0 } };
    for (const row of history) {
      byEra[row.eraId][row.outcome === "win" ? "wins" : row.outcome === "loss" ? "losses" : "draws"] += 1;
    }
    return (
      <BattleAtmosphere>
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-pink-300">{t("common.beta")}</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide text-amber-50">
            {t("pages.battle.summaryTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-200">{t("pages.battle.summaryDescription")}</p>
          <div className="mt-6 grid max-w-lg grid-cols-2 gap-3">
            <SummaryStat label={t("pages.battle.wins")} value={wins} tone="win" />
            <SummaryStat label={t("pages.battle.losses")} value={losses} tone="loss" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {([2, 3, 4] as const).map((eraId) => (
              <BattleEpicFrame key={eraId} bodyClassName="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/80">
                  {eraById.get(eraId)?.nome ?? `Era ${eraId}`}
                </p>
                <p className="mt-2 text-sm text-zinc-100">
                  {t("pages.battle.eraStatsRecord", {
                    wins: String(byEra[eraId].wins),
                    losses: String(byEra[eraId].losses),
                  })}
                </p>
              </BattleEpicFrame>
            ))}
          </div>
          <ul className="mt-6 space-y-2">
            {history.map((row) => {
              const era = eras.find((item) => item.id === row.eraId);
              return (
                <li
                  key={row.index}
                  className={cn("flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 text-sm", outcomeClass(row.outcome))}
                >
                  <span className="font-semibold">#{row.index + 1}</span>
                  <span className="text-zinc-400">{era?.nome}</span>
                  <span>
                    {t(categoryById(row.attackerId).labelKey)} → {t(categoryById(row.defenderId).labelKey)}
                  </span>
                  <span className="ml-auto font-semibold uppercase">{t(`pages.battle.outcome.${row.outcome}`)}</span>
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
      <div className={pending ? "mx-auto max-w-5xl pb-44" : "mx-auto max-w-5xl"}>
        <header className="mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pink-300">{t("common.beta")}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/80">
              {t("pages.battle.modeCategoryTitle")}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-wide text-amber-50 sm:text-4xl">
              {currentEra?.nome}
            </h1>
            <p className="mt-1 text-sm text-zinc-300">
              {t("pages.battle.roundProgress", {
                current: String(roundIndex + 1),
                total: String(plan.length),
              })}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <ScorePill label={t("pages.battle.wins")} value={wins} tone="win" />
            <ScorePill label={t("pages.battle.losses")} value={losses} tone="loss" />
          </div>
        </header>

        <BattleEpicFrame glow={false} className="mb-6" bodyClassName="flex items-center gap-3 px-4 py-3">
          {currentEra?.icon ? (
            <img src={getIconFieldUrl(currentEra.icon)} alt="" aria-hidden className="size-10 object-contain" />
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-amber-200/70">{t("pages.battle.currentAge")}</p>
            <p className="font-semibold text-amber-100">{currentEra?.nome}</p>
          </div>
          <div className="ml-auto flex gap-1">
            {plan.map((round) => (
              <span
                key={round.index}
                className={cn(
                  "size-2.5 rounded-full",
                  round.index < roundIndex
                    ? "bg-amber-400"
                    : round.index === roundIndex
                      ? "bg-amber-200 ring-2 ring-amber-400/40"
                      : "bg-zinc-700",
                )}
              />
            ))}
          </div>
        </BattleEpicFrame>

        <section className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          <BattleEpicFrame wash="emerald" bodyClassName="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              {t("pages.battle.yourChoice")}
            </p>
            <p className="mt-1 text-sm text-zinc-300">{t("pages.battle.pickCategoryHint")}</p>
            <div className="mt-4 flex flex-col gap-4">
              {groups.map((group) => (
                <ul key={group.map((item) => item.id).join("-")} className="flex flex-wrap items-stretch justify-center gap-3">
                  {group.map((category) => {
                    const locked = category.id === defender.id;
                    const selected = pendingId === category.id;
                    return (
                      <li key={category.id} className="flex">
                        <button
                          type="button"
                          ref={locked ? lockedButtonRef : undefined}
                          disabled={phase !== "playing"}
                          aria-expanded={locked ? lockedHintOpen : undefined}
                          onClick={() => {
                            if (locked) {
                              setLockedHintOpen((open) => !open);
                              return;
                            }
                            setLockedHintOpen(false);
                            setPendingId(category.id);
                          }}
                          className={cn(
                            "relative flex h-[8.5rem] w-[8.5rem] flex-col items-center justify-center rounded-2xl border px-2 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
                            locked
                              ? "border-white/10 bg-black/50 text-zinc-500 grayscale hover:border-amber-200/40"
                              : selected
                                ? "border-amber-200 bg-amber-500/15 shadow-[0_0_18px_rgba(251,191,36,0.25)]"
                                : "border-white/10 bg-black/25 hover:border-amber-200/45",
                            phase !== "playing" && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <CategoryIcon category={category} />
                          {locked ? (
                            <span className="absolute right-2 top-2 text-sm leading-none" aria-hidden>
                              🔒
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ))}
              {lockedHintOpen && lockedButtonRef.current ? (
                <LockedCategoryPopover
                  anchorEl={lockedButtonRef.current}
                  title={t("pages.battle.categoryLocked")}
                  hint={t("pages.battle.categoryLockedHint")}
                  onClose={() => setLockedHintOpen(false)}
                />
              ) : null}
            </div>
          </BattleEpicFrame>

          <div className="hidden items-center justify-center lg:flex">
            <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-amber-100 drop-shadow-[0_0_18px_rgba(255,196,70,0.45)]">
              VS
            </span>
          </div>

          <BattleEpicFrame wash="rose" bodyClassName="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-200">{t("pages.battle.enemy")}</p>
            <div className="mt-6 flex justify-center">
              <CategoryIcon category={defender} size="lg" />
            </div>
          </BattleEpicFrame>
        </section>

        <BattleConfirmSheet
          open={pending != null && phase === "playing"}
          onClose={() => setPendingId(null)}
          title={t("pages.battle.confirmTitle")}
          description={t("pages.battle.confirmCategory")}
        >
          {pending ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90">
                    {t("pages.battle.you")}
                  </p>
                  <CategoryIcon category={pending} />
                </div>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-amber-400">VS</p>
                <div className="text-center">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-rose-300/90">
                    {t("pages.battle.enemy")}
                  </p>
                  <CategoryIcon category={defender} />
                </div>
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setPendingId(null)}
                  className="flex-1 rounded-xl border border-aom-border bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 sm:flex-none"
                >
                  {t("pages.battle.cancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmChoice}
                  className="flex-1 rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 sm:flex-none"
                >
                  {t("pages.battle.confirmAttack")}
                </button>
              </div>
            </div>
          ) : null}
        </BattleConfirmSheet>

        {lastRound ? (
          <CategoryResultModal
            open={phase === "result"}
            round={lastRound}
            explanation={resultLine(lastRound)}
            continueLabel={roundIndex + 1 >= plan.length ? t("pages.battle.seeSummary") : t("pages.battle.continue")}
            onContinue={continueAfterResult}
          />
        ) : null}

        <BattleAgeUpOverlay
          open={phase === "age_up" && ageUpEraId != null}
          eraId={ageUpEraId ?? 3}
          eraName={eraById.get(ageUpEraId ?? 3)?.nome ?? ""}
          eraIcon={eraById.get(ageUpEraId ?? 3)?.icon}
          hint={t("pages.battle.ageUpCategoriesHint")}
          onDone={finishAgeUp}
        />
      </div>
    </BattleAtmosphere>
  );
}

function LockedCategoryPopover({
  anchorEl,
  title,
  hint,
  onClose,
}: {
  anchorEl: HTMLElement;
  title: string;
  hint: string;
  onClose: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, arrow: 120, place: "above" as "above" | "below" });

  useLayoutEffect(() => {
    const update = () => {
      const pad = 12;
      const gap = 10;
      const rect = anchorEl.getBoundingClientRect();
      const width = popoverRef.current?.offsetWidth ?? 240;
      const height = popoverRef.current?.offsetHeight ?? 88;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
      const above = rect.top - gap - height;
      const place = above >= pad ? "above" : "below";
      const top = place === "above" ? above : rect.bottom + gap;
      const arrow = Math.max(16, Math.min(width - 16, rect.left + rect.width / 2 - left));
      setPosition({ top, left, arrow, place });
    };
    update();
    const el = popoverRef.current;
    const observer = el ? new ResizeObserver(update) : null;
    if (el && observer) observer.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorEl, title, hint]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorEl.contains(target)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [anchorEl, onClose]);

  return createPortal(
    <div
      ref={popoverRef}
      role="status"
      className="fixed z-[80] w-60 rounded-xl border border-amber-200/40 bg-[#1a1612] px-3 py-2.5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
      style={{ top: position.top, left: position.left }}
    >
      <p className="text-sm font-semibold text-amber-50">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-300">{hint}</p>
      <span
        aria-hidden
        className={cn(
          "absolute size-2.5 -translate-x-1/2 rotate-45 border-amber-200/40 bg-[#1a1612]",
          position.place === "above" ? "-bottom-1.5 border-b border-r" : "-top-1.5 border-l border-t",
        )}
        style={{ left: position.arrow }}
      />
    </div>,
    document.body,
  );
}

const RESULT_TITLE: Record<RoundOutcome, string> = {
  win: "text-emerald-300 drop-shadow-[0_0_28px_rgba(52,211,153,0.55)]",
  loss: "text-rose-300 drop-shadow-[0_0_28px_rgba(251,113,133,0.5)]",
  draw: "text-amber-200 drop-shadow-[0_0_28px_rgba(251,191,36,0.45)]",
};

const RESULT_GLOW: Record<RoundOutcome, string> = {
  win: "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.28),transparent_62%)]",
  loss: "bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.28),transparent_62%)]",
  draw: "bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.24),transparent_62%)]",
};

function resultMark(outcome: RoundOutcome, side: "you" | "enemy"): "crown" | "skull" | null {
  if (outcome === "draw") return null;
  const youWon = outcome === "win";
  return (side === "you") === youWon ? "crown" : "skull";
}

function CategoryFighter({
  category,
  label,
  labelClass,
  mark,
  markLabel,
}: {
  category: BattleCategory;
  label: string;
  labelClass: string;
  mark: "crown" | "skull" | null;
  markLabel: string;
}) {
  const { t } = useTranslation();
  const src = getIconFieldUrl(category.icon);
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em]", labelClass)}>
        {label}
        {mark ? (
          <span role="img" aria-label={markLabel} className="text-lg leading-none">
            {mark === "crown" ? "👑" : "💀"}
          </span>
        ) : null}
      </p>
      <span
        className={cn(
          "mt-3 flex size-28 items-center justify-center rounded-2xl border bg-[#1a1612] sm:size-32",
          mark === "crown" && "border-amber-200 shadow-[0_0_28px_rgba(251,191,36,0.5)] ring-2 ring-amber-200/50",
          mark === "skull" && "border-rose-300/30 opacity-80 grayscale-[0.2]",
          mark == null && "border-white/10",
        )}
      >
        {src ? <img src={src} alt="" className="size-20 object-contain" /> : null}
      </span>
      <p className="mt-3 text-sm font-semibold text-amber-50 sm:text-base">{t(category.labelKey)}</p>
    </div>
  );
}

function CategoryResultModal({
  open,
  round,
  explanation,
  continueLabel,
  onContinue,
}: {
  open: boolean;
  round: CategoryRound;
  explanation: string;
  continueLabel: string;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const attacker = categoryById(round.attackerId);
  const defender = categoryById(round.defenderId);
  const title = t(`pages.battle.outcome.${round.outcome}`);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onContinue]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" aria-hidden />
      <div className={cn("pointer-events-none absolute inset-0", RESULT_GLOW[round.outcome])} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-amber-200/30 bg-[#100e0b] shadow-[0_30px_80px_rgba(0,0,0,0.65)]"
      >
        <div className="px-5 py-8 sm:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">
            {t("pages.battle.modeCategory")}
          </p>
          <h2
            className={cn(
              "mt-3 text-center font-[family-name:var(--font-display)] text-5xl font-semibold tracking-[0.12em] sm:text-6xl",
              RESULT_TITLE[round.outcome],
            )}
          >
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-zinc-300">{explanation}</p>
          <div className="mt-6 flex items-center justify-center gap-2 sm:gap-6">
            <CategoryFighter
              category={attacker}
              label={t("pages.battle.you")}
              labelClass="text-emerald-200"
              mark={resultMark(round.outcome, "you")}
              markLabel={round.outcome === "win" ? t("pages.battle.winnerMark") : t("pages.battle.loserMark")}
            />
            <p className="shrink-0 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-widest text-amber-200 sm:text-3xl">
              VS
            </p>
            <CategoryFighter
              category={defender}
              label={t("pages.battle.enemy")}
              labelClass="text-rose-200"
              mark={resultMark(round.outcome, "enemy")}
              markLabel={round.outcome === "loss" ? t("pages.battle.winnerMark") : t("pages.battle.loserMark")}
            />
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-xl border border-amber-200/50 bg-amber-500/20 px-4 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/30"
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ScorePill({ label, value, tone }: { label: string; value: number; tone: "win" | "loss" | "draw" }) {
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

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: "win" | "loss" | "draw" }) {
  return (
    <div className={cn("rounded-xl border p-4 text-center", outcomeClass(tone))}>
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
