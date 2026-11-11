import { useMemo, useState } from "react";

import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { PlayerClanLink } from "@/components/jogadores/PlayerClanLink";
import { PlayerProfileLink } from "@/components/jogadores/PlayerProfileLink";
import { getFormRankPortraitPath } from "@/components/rank/rankProfileUi";
import { TierPortraitBadge } from "@/components/rank/TierPortraitBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { type AomRacePlayer, playerDisplayLabel } from "@/lib/playersApi";
import { getRankGuideTiers } from "@/lib/rankGuideTiers";
import {
  TIER_ACHIEVEMENT_THEME,
  getRankClassification,
  rankRomanMedallionClass,
  rankRomanStepFromRr,
  type RankTierId,
} from "@/lib/rankClassification";

function PlayerAvatar({
  player,
  ringClass,
  tierId,
}: {
  player: AomRacePlayer;
  ringClass: string;
  tierId: RankTierId;
}) {
  const avatar = (
    <div
      className={cn(
        "relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 bg-zinc-950 p-0.5 shadow-md sm:h-11 sm:w-11",
        ringClass,
      )}
    >
      <PlayerAvatarMark src={player.logoPath} tierId={tierId} width={40} height={40} className="rounded-full" />
    </div>
  );

  return <PlayerProfileLink player={player} className="inline-block">{avatar}</PlayerProfileLink>;
}

export function JogadoresAomTab({ players }: { players: AomRacePlayer[] }) {
  const { t } = useTranslation();
  const tiers = useMemo(() => getRankGuideTiers(t), [t]);
  const [tierFilter, setTierFilter] = useState<RankTierId | null>(null);

  const sorted = useMemo(
    () => [...players].sort((a, b) => b.rr - a.rr || playerDisplayLabel(a).localeCompare(playerDisplayLabel(b))),
    [players],
  );

  const filtered = useMemo(() => {
    if (!tierFilter) return sorted;
    return sorted.filter((player) => getRankClassification(player.rr).tierId === tierFilter);
  }, [sorted, tierFilter]);

  if (sorted.length === 0) {
    return (
      <p className="rounded-2xl border border-aom-border/60 bg-zinc-950/50 px-4 py-10 text-center text-sm text-zinc-500">
        {t("pages.players.raceEmpty")}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-aom-border/60 bg-[#141414] shadow-lg shadow-black/40">
      <div className="border-b border-zinc-800/90 px-4 py-3 sm:px-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{t("common.community")}</p>
        <p className="mt-1 text-sm text-zinc-400">{t("pages.players.tableSectionDesc")}</p>
      </div>

      <nav
        aria-label={t("pages.players.tierFilterLabel")}
        className="flex flex-wrap justify-center gap-2 border-b border-zinc-800/90 bg-zinc-950/50 px-3 py-3 sm:px-5"
      >
        <button
          type="button"
          aria-pressed={tierFilter === null}
          onClick={() => setTierFilter(null)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
            tierFilter === null
              ? "border-amber-500/55 bg-amber-950/35 text-amber-100 ring-1 ring-amber-500/25"
              : "border-aom-border/60 bg-zinc-900/80 text-zinc-300 hover:border-amber-500/40 hover:text-amber-100",
          )}
        >
          {t("pages.players.tierFilterAll")}
        </button>
        {tiers.map((tTier) => {
          const portraitSrc = getFormRankPortraitPath(tTier.id as RankTierId);
          const active = tierFilter === tTier.id;
          return (
            <button
              key={tTier.id}
              type="button"
              aria-pressed={active}
              onClick={() => setTierFilter(tTier.id as RankTierId)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "border-amber-500/55 bg-amber-950/35 text-amber-100 ring-1 ring-amber-500/25"
                  : "border-aom-border/60 bg-zinc-900/80 text-zinc-300 hover:border-amber-500/40 hover:text-amber-100",
              )}
            >
              <img
                src={portraitSrc}
                alt=""
                className="h-[1.125rem] w-[1.125rem] shrink-0 object-contain opacity-95 sm:h-5 sm:w-5"
                width={20}
                height={20}
              />
              <span>{tTier.rankName}</span>
            </button>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-zinc-500 sm:px-5">{t("pages.players.tierFilterEmpty")}</p>
      ) : (
        <>
          <div className="hidden overflow-visible lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{t("pages.players.tableCaption")}</caption>
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th scope="col" className="w-12 px-3 py-3 text-center font-medium">
                    #
                  </th>
                  <th scope="col" className="w-14 px-2 py-3 font-medium">
                    {t("pages.players.colAvatar")}
                  </th>
                  <th scope="col" className="min-w-[8rem] px-3 py-3 font-medium">
                    {t("common.name")}
                  </th>
                  <th scope="col" className="w-16 px-2 py-3 text-center font-medium">
                    {t("pages.players.colClan")}
                  </th>
                  <th scope="col" className="min-w-[7rem] px-3 py-3 font-medium">
                    {t("pages.players.colCategory")}
                  </th>
                  <th scope="col" className="w-14 px-2 py-3 text-center font-medium">
                    {t("pages.players.colTier")}
                  </th>
                  <th scope="col" className="w-20 px-3 py-3 font-medium">
                    {t("pages.players.racePopoverRr")}
                  </th>
                  <th scope="col" className="min-w-[8rem] px-3 py-3 font-medium">
                    {t("pages.players.racePopoverRank")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((player, i) => {
                  const cls = getRankClassification(player.rr);
                  const theme = TIER_ACHIEVEMENT_THEME[cls.tierId];
                  const label = playerDisplayLabel(player);
                  const roman = rankRomanStepFromRr(player.rr);

                  return (
                    <tr
                      key={player.id}
                      className={cn(
                        "border-b border-zinc-800/90 transition-colors hover:bg-zinc-900/50",
                        i % 2 === 0 ? "bg-zinc-950/25" : "bg-zinc-900/20",
                      )}
                    >
                      <td className="px-3 py-3 text-center tabular-nums text-zinc-500">{i + 1}</td>
                      <td className="px-2 py-3">
                        <PlayerAvatar player={player} ringClass={theme.stepRing} tierId={cls.tierId} />
                      </td>
                      <td className="px-3 py-3">
                        <PlayerProfileLink player={player} className="inline-block">
                          <span className="font-[family-name:var(--font-display)] font-semibold tracking-wide text-zinc-100 transition hover:text-amber-100">
                            {label}
                          </span>
                        </PlayerProfileLink>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <PlayerClanLink player={player} size="sm" className="justify-center" />
                      </td>
                      <td className="px-3 py-3 text-zinc-400">{cls.categoryLabel}</td>
                      <td className="relative overflow-visible px-2 py-3 text-center">
                        <TierPortraitBadge
                          cls={cls}
                          tierPortrait={getFormRankPortraitPath(cls.tierId)}
                          rr={player.rr}
                          className="mx-auto w-fit"
                          tooltipPlacement="above"
                          tooltipAlign="center"
                        />
                      </td>
                      <td className={cn("px-3 py-3 font-semibold tabular-nums", theme.stepAccent)}>{player.rr}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold shadow-inner",
                              rankRomanMedallionClass(cls.tierId),
                            )}
                            aria-hidden
                          >
                            {roman}
                          </span>
                          <span className={cn("font-semibold", theme.titleRankClass)}>{cls.subcategoryLabel}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-zinc-800/90 lg:hidden" aria-label={t("pages.players.listAria")}>
            {filtered.map((player, i) => {
              const cls = getRankClassification(player.rr);
              const theme = TIER_ACHIEVEMENT_THEME[cls.tierId];
              const label = playerDisplayLabel(player);
              const roman = rankRomanStepFromRr(player.rr);

              return (
                <li
                  key={player.id}
                  className={cn("px-4 py-4", i % 2 === 0 ? "bg-zinc-950/30" : "bg-zinc-900/15")}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-2 w-5 shrink-0 text-center text-xs tabular-nums text-zinc-500">{i + 1}</span>
                    <PlayerAvatar player={player} ringClass={theme.stepRing} tierId={cls.tierId} />
                    <div className="min-w-0 flex-1">
                      <PlayerProfileLink player={player} className="inline-block max-w-full">
                        <p className="truncate font-[family-name:var(--font-display)] font-semibold tracking-wide text-zinc-100 transition hover:text-amber-100">
                          {label}
                        </p>
                      </PlayerProfileLink>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">{cls.categoryLabel}</p>
                    </div>
                    <PlayerClanLink player={player} size="sm" />
                    <TierPortraitBadge
                      cls={cls}
                      tierPortrait={getFormRankPortraitPath(cls.tierId)}
                      rr={player.rr}
                      tooltipPlacement="above"
                      tooltipAlign="end"
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 pl-8">
                    <div
                      className={cn(
                        "rounded-xl border border-aom-border/45 bg-zinc-950/60 px-3 py-2 text-center ring-1 ring-inset",
                        theme.stepRing,
                      )}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                        {t("pages.players.racePopoverRr")}
                      </p>
                      <p className={cn("mt-1 font-semibold tabular-nums leading-none", theme.stepAccent, "text-lg")}>
                        {player.rr}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl border border-aom-border/45 bg-zinc-950/60 px-3 py-2 ring-1 ring-inset",
                        theme.stepRing,
                      )}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                        {t("pages.players.racePopoverRank")}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold shadow-inner",
                            rankRomanMedallionClass(cls.tierId),
                          )}
                          aria-hidden
                        >
                          {roman}
                        </span>
                        <span className={cn("text-sm font-semibold leading-tight", theme.titleRankClass)}>
                          {cls.subcategoryLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="border-t border-zinc-800/90 px-4 py-3 text-center text-xs text-zinc-600 sm:px-5">
        {t("pages.players.raceSnapshotHint")}
      </p>
    </div>
  );
}
