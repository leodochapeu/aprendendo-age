import { useState } from "react";

import type { Locale } from "@/i18n/types";
import { cn } from "@/lib/cn";

import { resolveGodArt, resolveMatchMap } from "./matchArt";

export type EpicPlayer = { name: string; logoUrl: string };

export type EpicLink = { id: string; label: string; url: string };

function PlayerMark({ player, size }: { player: EpicPlayer; size: "sm" | "lg" }) {
  const box = size === "lg" ? "h-14 w-14 sm:h-16 sm:w-16" : "h-9 w-9";
  const [failed, setFailed] = useState(false);
  const letter = player.name.slice(0, 1).toUpperCase() || "•";
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full border-2 border-amber-200/70 bg-zinc-950 shadow-[0_0_18px_rgba(255,196,70,0.35)]", box)}>
      {player.logoUrl && !failed ? (
        <img src={player.logoUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-amber-100">{letter}</span>
      )}
    </div>
  );
}

function Wind() {
  return (
    <div className="epic-wind" aria-hidden>
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function EpicMatchCard({
  locale,
  campLogoUrl,
  playerA,
  playerB,
  scoreA,
  scoreB,
  mapName,
  godA,
  godB,
  winner,
  whenLabel,
  roundLabel,
  links,
  revealed,
  compact,
  revealLabel,
  victoryLabel,
  watchLabel,
  onReveal,
}: {
  locale: Locale;
  campLogoUrl: string;
  playerA: EpicPlayer;
  playerB: EpicPlayer;
  scoreA: number | null;
  scoreB: number | null;
  mapName: string;
  godA: string;
  godB: string;
  winner: "A" | "B" | null;
  whenLabel: string;
  roundLabel: string;
  links: EpicLink[];
  revealed: boolean;
  compact?: boolean;
  revealLabel: string;
  victoryLabel: (name: string) => string;
  watchLabel: string;
  onReveal?: () => void;
}) {
  const map = revealed ? resolveMatchMap(mapName, locale) : { title: "", bg: null };
  const leftGod = revealed ? resolveGodArt(godA) : { label: "", src: null };
  const rightGod = revealed ? resolveGodArt(godB) : { label: "", src: null };
  const leftWon = revealed && winner === "A";
  const rightWon = revealed && winner === "B";
  const scoreClass = "font-[family-name:var(--font-display)] font-bold tabular-nums text-amber-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]";

  return (
    <div className="relative">
      <div className="epic-gold-glow" aria-hidden />
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border border-amber-200/20 shadow-lg shadow-black/40",
          compact ? "min-h-[11.5rem]" : "min-h-[17rem]",
          leftWon && "ring-1 ring-emerald-400/30",
          rightWon && "ring-1 ring-sky-400/25",
        )}
      >
        {map.bg ? (
          <img src={map.bg} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#3a2a12_0%,#120e09_55%,#07080c_100%)]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/88 via-black/72 to-black/78" />
        {leftWon ? <div className="pointer-events-none absolute inset-y-0 left-0 w-[68%] bg-gradient-to-r from-emerald-500/50 via-emerald-500/15 to-transparent" /> : null}
        {rightWon ? <div className="pointer-events-none absolute inset-y-0 right-0 w-[68%] bg-gradient-to-l from-sky-500/45 via-sky-500/15 to-transparent" /> : null}
        {campLogoUrl ? (
          <img
            src={campLogoUrl}
            alt=""
            className={cn(
              "pointer-events-none absolute left-1/2 top-[62%] z-[1] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)]",
              compact ? "h-16 w-16 opacity-25" : "h-52 w-52 opacity-45 sm:h-64 sm:w-64",
            )}
          />
        ) : null}
        <Wind />

        <div className={cn("relative z-[3]", compact ? "p-3" : "p-4 sm:p-6")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <PlayerMark player={playerA} size={compact ? "sm" : "lg"} />
              <span className={cn(scoreClass, compact ? "text-xl" : "text-3xl sm:text-4xl")}>{scoreA == null ? "•" : scoreA}</span>
            </div>
            <div className="min-w-0 flex-1 px-2 text-center">
              <p className={cn("font-[family-name:var(--font-display)] font-bold tracking-wide text-amber-100 drop-shadow-sm", compact ? "text-sm" : "text-2xl sm:text-3xl")}>
                {revealed && map.title ? map.title : roundLabel || "—"}
              </p>
              {whenLabel ? <p className={cn("mt-1 text-zinc-200/90", compact ? "text-[10px]" : "text-sm")}>{whenLabel}</p> : null}
              {revealed && roundLabel && map.title ? (
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-amber-200/70">{roundLabel}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(scoreClass, compact ? "text-xl" : "text-3xl sm:text-4xl")}>{scoreB == null ? "•" : scoreB}</span>
              <PlayerMark player={playerB} size={compact ? "sm" : "lg"} />
            </div>
          </div>

          {compact ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <p className={cn("truncate font-medium", leftWon ? "text-emerald-100" : "text-zinc-50")}>{playerA.name}</p>
              <p className={cn("truncate text-right font-medium", rightWon ? "text-sky-100" : "text-zinc-50")}>{playerB.name}</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(5.5rem,0.55fr)_minmax(0,1fr)] sm:items-start">
              <PlayerPanel player={playerA} godLabel={leftGod.label} godSrc={leftGod.src} align="left" won={leftWon} victory={leftWon ? victoryLabel(playerA.name) : ""} />
              <div className="hidden min-h-px sm:block" aria-hidden />
              <PlayerPanel player={playerB} godLabel={rightGod.label} godSrc={rightGod.src} align="right" won={rightWon} victory={rightWon ? victoryLabel(playerB.name) : ""} />
            </div>
          )}

          {!revealed && onReveal ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={onReveal}
                className="rounded-full border border-amber-400/50 bg-black/60 px-3 py-1 text-xs font-medium text-amber-100 shadow-md backdrop-blur-sm transition hover:bg-amber-950/70"
              >
                {revealLabel}
              </button>
            </div>
          ) : null}

          {revealed && links.length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {links.map((link, index) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-black/60 px-4 py-2 text-sm font-medium text-amber-100 shadow-md backdrop-blur-sm transition hover:border-amber-300/70 hover:bg-amber-950/50"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current" aria-hidden>
                    ▶
                  </span>
                  {index === 0 ? watchLabel : link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}

function PlayerPanel({
  player,
  godLabel,
  godSrc,
  align,
  won,
  victory,
}: {
  player: EpicPlayer;
  godLabel: string;
  godSrc: string | null;
  align: "left" | "right";
  won: boolean;
  victory: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", align === "right" && "sm:items-end")}>
      <div
        className={cn(
          "flex w-full max-w-md items-center gap-3 rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 backdrop-blur-[2px]",
          align === "right" && "sm:flex-row-reverse",
          won && align === "left" && "ring-1 ring-emerald-400/35",
          won && align === "right" && "ring-1 ring-sky-400/35",
        )}
      >
        {godSrc ? (
          <img src={godSrc} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover object-top shadow-md ring-1 ring-white/20 sm:h-20 sm:w-20" />
        ) : null}
        <div className={cn("min-w-0", align === "right" && "sm:text-right")}>
          <p className="truncate text-base font-medium text-zinc-50 sm:text-lg">{player.name}</p>
          {godLabel ? <p className="mt-0.5 truncate text-sm text-amber-200/95">{godLabel}</p> : null}
        </div>
      </div>
      {victory ? (
        <span
          className={cn(
            "mt-2 inline-flex w-fit self-start rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm",
            align === "right" && "sm:self-end",
            align === "left"
              ? "border-emerald-400/50 bg-emerald-950/60 text-emerald-100"
              : "border-sky-400/50 bg-sky-950/60 text-sky-100",
          )}
        >
          {victory}
        </span>
      ) : null}
    </div>
  );
}
