import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RacePlayerCard } from "@/components/jogadores/RacePlayerCard";
import { getFormRankPortraitPath, MolduraAgeAvatar } from "@/components/rank/rankProfileUi";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import type { ChampionshipPlayer } from "@/lib/championshipsApi";
import { type AomRacePlayer } from "@/lib/playersApi";
import { getRankClassification } from "@/lib/rankClassification";

const HOLD_MS = 6200;
const EXIT_MS = 500;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function byRating(players: ChampionshipPlayer[], stats: Map<string, AomRacePlayer>) {
  return [...players].sort((a, b) => {
    const left = stats.get(a.profileId)?.rr;
    const right = stats.get(b.profileId)?.rr;
    if (left != null && right != null && left !== right) return right - left;
    if (left != null) return -1;
    if (right != null) return 1;
    return a.name.localeCompare(b.name, "pt");
  });
}

export function RosterPresentation({ players, stats }: { players: ChampionshipPlayer[]; stats: AomRacePlayer[] }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const byId = useMemo(() => new Map(stats.map((player) => [player.id, player])), [stats]);
  const slides = useMemo(() => byRating(players, byId), [players, byId]);
  const orderKey = slides.map((player) => player.id).join("|");
  const [orderSeen, setOrderSeen] = useState(orderKey);
  const [cursor, setCursor] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const traveling = useRef(false);
  const exitTimer = useRef<number | null>(null);

  if (orderSeen !== orderKey) {
    setOrderSeen(orderKey);
    setCursor(0);
    setVisible(true);
    traveling.current = false;
  }

  const travel = useCallback(
    (dir: 1 | -1) => {
      if (slides.length < 2 || traveling.current) return;
      if (reduced) {
        setCursor((current) => (current + dir + slides.length) % slides.length);
        return;
      }
      traveling.current = true;
      setVisible(false);
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
      exitTimer.current = window.setTimeout(() => {
        setCursor((current) => (current + dir + slides.length) % slides.length);
        setVisible(true);
        traveling.current = false;
      }, EXIT_MS);
    },
    [reduced, slides.length],
  );

  useEffect(() => {
    if (paused || reduced || !visible || slides.length < 2) return;
    const id = window.setTimeout(() => travel(1), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [paused, reduced, visible, slides.length, cursor, travel]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") travel(1);
      if (event.key === "ArrowLeft") travel(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [travel]);

  useEffect(() => () => {
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
  }, []);

  if (slides.length === 0) return null;

  const player = slides[Math.min(cursor, slides.length - 1)];
  const ranked = byId.get(player.profileId) ?? null;
  const cls = ranked ? getRankClassification(ranked.rr) : null;
  const portrait = ranked?.logoPath || player.logoUrl || null;

  return (
    <div
      className="mx-auto max-w-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative">
        <div className="epic-gold-glow" aria-hidden />
        <div
          key={player.id}
          className={cn(
            "relative min-h-[26rem] overflow-hidden rounded-3xl border border-amber-200/20 bg-black/50 shadow-lg shadow-black/40",
            visible ? "roster-slide-in" : "roster-slide-out",
          )}
        >
          <div className="epic-wind" aria-hidden>
            <span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className="relative z-[3] flex flex-col items-center px-4 pb-8 pt-10 sm:px-8">
            <div className={cn("race-avatar-hop", visible && "is-hopping")}>
              {cls ? (
                <MolduraAgeAvatar
                  tierId={cls.tierId}
                  ageToken={cls.ageToken}
                  frameImageSrc={getFormRankPortraitPath(cls.tierId)}
                  portraitUrl={portrait}
                  size="hero"
                  emptyFallback={<span className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-2xl text-amber-100">{player.name.slice(0, 1).toUpperCase()}</span>}
                />
              ) : (
                <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-amber-200/70 bg-zinc-950 shadow-[0_0_28px_rgba(255,196,70,0.4)] sm:h-44 sm:w-44">
                  {portrait ? (
                    <img src={portrait} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-4xl text-amber-100">{player.name.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
              )}
            </div>
            {ranked ? (
              <div className="roster-card-in mt-2">
                <RacePlayerCard
                  player={{ ...ranked, logoPath: portrait }}
                  labelOverride={player.name}
                  showFlag
                  className="shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
                />
              </div>
            ) : (
              <p className="roster-card-in mt-6 text-center font-[family-name:var(--font-display)] text-3xl text-amber-50">{player.name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => travel(-1)}
          disabled={slides.length < 2}
          aria-label={t("pages.championship.rosterPrev")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-40"
        >
          ‹
        </button>
        <p className="min-w-16 text-center text-sm tabular-nums text-amber-100/80" aria-live="polite">
          {Math.min(cursor, slides.length - 1) + 1} / {slides.length}
        </p>
        <button
          type="button"
          onClick={() => travel(1)}
          disabled={slides.length < 2}
          aria-label={t("pages.championship.rosterNext")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-40"
        >
          ›
        </button>
      </div>
      {slides.length > 1 && !reduced ? (
        <div className="mx-auto mt-3 h-0.5 max-w-xs overflow-hidden rounded-full bg-white/10">
          {visible && !paused ? <div key={cursor} className="roster-progress h-full bg-amber-200/80" style={{ animationDuration: `${HOLD_MS}ms` }} /> : null}
        </div>
      ) : null}
    </div>
  );
}
