import { forwardRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";

import { FlagPennant } from "@/components/campeonato/FlagPennant";
import { PlayerProfileLink } from "@/components/jogadores/PlayerProfileLink";
import { getFormRankPortraitPath } from "@/components/rank/rankProfileUi";
import { TierPortraitBadge } from "@/components/rank/TierPortraitBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import {
  type AomRacePlayer,
  playerClanLogoUrl,
  playerClanPagePath,
  playerClanTag,
  playerDisplayLabel,
} from "@/lib/playersApi";
import { flagIsoFromStoredCountry } from "@/lib/playerCountry";
import {
  TIER_ACHIEVEMENT_THEME,
  getRankClassification,
  rankRomanMedallionClass,
  rankRomanStepFromRr,
} from "@/lib/rankClassification";

const GRID_SCRIM =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M40 0L40 80M0 40L80 40'/%3E%3C/g%3E%3C/svg%3E\")";

export const RacePlayerCard = forwardRef<
  HTMLDivElement,
  {
    player: AomRacePlayer;
    onNavigate?: () => void;
    className?: string;
    style?: CSSProperties;
    role?: string;
    showFlag?: boolean;
  }
>(function RacePlayerCard({ player, onNavigate, className, style, role, showFlag = false }, ref) {
  const { t } = useTranslation();
  const cls = getRankClassification(player.rr);
  const theme = TIER_ACHIEVEMENT_THEME[cls.tierId];
  const label = playerDisplayLabel(player);
  const tierPortrait = getFormRankPortraitPath(cls.tierId);
  const roman = rankRomanStepFromRr(player.rr);
  const clanLogoUrl = playerClanLogoUrl(player);
  const clanTag = playerClanTag(player);
  const clanPath = playerClanPagePath(player);
  const flagIso = showFlag ? flagIsoFromStoredCountry(player.country) : null;

  return (
    <div
      ref={ref}
      role={role}
      aria-label={label}
      className={cn(
        "relative w-fit min-w-[17rem] max-w-[min(calc(100vw-1.25rem),28rem)]",
        "overflow-visible rounded-2xl border border-aom-border/60 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]",
        theme.surfaceClass,
        className,
      )}
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: GRID_SCRIM }} aria-hidden />

      <div className={cn("relative flex items-start gap-3 p-4", flagIso && "pt-5")}>
        {flagIso ? <FlagPennant country={player.country} /> : null}
        <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <PlayerProfileLink player={player} onNavigate={onNavigate} className="block shrink-0">
            <div className={cn("relative h-12 w-12 overflow-hidden rounded-full border-2 bg-zinc-950 p-0.5 shadow-md transition hover:brightness-110", theme.stepRing)}>
              {player.logoPath ? (
                <img src={player.logoPath} alt="" className="h-full w-full rounded-full object-cover" width={44} height={44} />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-500">?</div>
              )}
            </div>
          </PlayerProfileLink>

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 items-center gap-2">
              {clanTag ? (
                clanPath ? (
                  <Link
                    to={clanPath}
                    onClick={onNavigate}
                    className="shrink-0 rounded-md border border-zinc-500/45 bg-black/25 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-100 transition hover:border-sky-500/50 hover:text-sky-200"
                    title={t("pages.players.openClanPage", { tag: clanTag })}
                  >
                    {clanTag}
                  </Link>
                ) : (
                  <span className="shrink-0 rounded-md border border-zinc-500/45 bg-black/25 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-100" title={clanTag}>
                    {clanTag}
                  </span>
                )
              ) : null}
              <PlayerProfileLink player={player} onNavigate={onNavigate} className="min-w-0">
                <p className="truncate whitespace-nowrap font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-zinc-50 transition hover:text-amber-100">
                  {label}
                </p>
              </PlayerProfileLink>
            </div>
            <p className="mt-0.5 truncate whitespace-nowrap text-[11px] text-zinc-400">{cls.categoryLabel}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {clanLogoUrl && clanPath ? (
              <Link
                to={clanPath}
                onClick={onNavigate}
                title={t("pages.players.openClanPage", { tag: clanTag ?? "" })}
                className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-500/50 bg-zinc-950 shadow-inner shadow-black/40 transition hover:border-sky-500/50 hover:ring-2 hover:ring-sky-500/25"
              >
                <img src={clanLogoUrl} alt="" className="h-full w-full object-cover" width={36} height={36} />
              </Link>
            ) : clanLogoUrl ? (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-500/50 bg-zinc-950 shadow-inner shadow-black/40" aria-hidden>
                <img src={clanLogoUrl} alt="" className="h-full w-full object-cover" width={36} height={36} />
              </div>
            ) : null}
            <TierPortraitBadge cls={cls} tierPortrait={tierPortrait} rr={player.rr} tooltipPlacement="above" tooltipAlign="end" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2.5">
          <div className={cn("min-w-[5.5rem] rounded-xl border border-aom-border/45 bg-zinc-950/60 px-3 py-2.5 text-center ring-1 ring-inset", theme.stepRing)}>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">{t("pages.players.racePopoverRr")}</p>
            <p className={cn("mt-1 text-xl font-semibold tabular-nums leading-none", theme.stepAccent)}>{player.rr}</p>
          </div>
          <div className={cn("flex min-w-[5.5rem] flex-col items-center justify-center rounded-xl border border-aom-border/45 bg-zinc-950/60 px-3 py-2.5 ring-1 ring-inset", theme.stepRing)}>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">{t("pages.players.racePopoverRank")}</p>
            <div className="mt-1.5 flex items-center gap-2 whitespace-nowrap">
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold shadow-inner", rankRomanMedallionClass(cls.tierId))} aria-hidden>
                {roman}
              </span>
              <span className={cn("text-sm font-semibold leading-none", theme.titleRankClass)}>{cls.subcategoryLabel}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
});
