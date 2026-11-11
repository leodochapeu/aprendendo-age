import { useMemo } from "react";

import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { PlayerClanLink } from "@/components/jogadores/PlayerClanLink";
import { PlayerProfileLink } from "@/components/jogadores/PlayerProfileLink";
import { getFormRankPortraitPath } from "@/components/rank/rankProfileUi";
import { TierPortraitBadge } from "@/components/rank/TierPortraitBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { ChampionshipPlayer } from "@/lib/championshipsApi";
import { cn } from "@/lib/cn";
import type { AomRacePlayer } from "@/lib/playersApi";
import {
  TIER_ACHIEVEMENT_THEME,
  getRankClassification,
  rankRomanMedallionClass,
  rankRomanStepFromRr,
  type RankTierId,
} from "@/lib/rankClassification";

type Row = {
  entry: ChampionshipPlayer;
  ranked: AomRacePlayer | null;
};

function sortRoster(players: ChampionshipPlayer[], stats: AomRacePlayer[]): Row[] {
  const byId = new Map(stats.map((player) => [player.id, player]));
  return players
    .map((entry) => ({ entry, ranked: byId.get(entry.profileId) ?? null }))
    .sort((a, b) => {
      const left = a.ranked?.rr;
      const right = b.ranked?.rr;
      if (left != null && right == null) return -1;
      if (left == null && right != null) return 1;
      if (left != null && right != null && left !== right) return right - left;
      return a.entry.name.localeCompare(b.entry.name, "pt");
    });
}

function RosterAvatar({
  src,
  ringClass,
  tierId,
}: {
  src: string;
  ringClass: string;
  tierId?: RankTierId | null;
}) {
  return (
    <div
      className={cn(
        "relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 bg-zinc-950 p-0.5 shadow-md shadow-black/50 sm:h-11 sm:w-11",
        ringClass,
      )}
    >
      <PlayerAvatarMark src={src} tierId={tierId} width={40} height={40} className="rounded-full" />
    </div>
  );
}

function RankLabel({
  roman,
  tierId,
  label,
  className,
}: {
  roman: string;
  tierId: Parameters<typeof rankRomanMedallionClass>[0];
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold shadow-inner",
          rankRomanMedallionClass(tierId),
        )}
        aria-hidden
      >
        {roman}
      </span>
      <span className="font-semibold leading-tight">{label}</span>
    </div>
  );
}

export function RosterList({ players, stats }: { players: ChampionshipPlayer[]; stats: AomRacePlayer[] }) {
  const { t } = useTranslation();
  const rows = useMemo(() => sortRoster(players, stats), [players, stats]);

  if (rows.length === 0) return null;

  return (
    <div className="overflow-visible rounded-2xl border border-white/10 bg-black/40 shadow-lg shadow-black/40">
      <div className="hidden overflow-visible lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{t("pages.championship.tabs.roster")}</caption>
          <thead>
            <tr className="border-b border-white/10 bg-black/55 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
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
              <th scope="col" className="min-w-[6.5rem] px-3 py-3 font-medium">
                {t("pages.players.colCategory")}
              </th>
              <th scope="col" className="w-14 px-2 py-3 text-center font-medium">
                {t("pages.players.colTier")}
              </th>
              <th scope="col" className="w-24 whitespace-nowrap px-3 py-3 font-medium">
                {t("pages.players.racePopoverRr")}
              </th>
              <th scope="col" className="min-w-[8rem] px-3 py-3 font-medium">
                {t("pages.players.racePopoverRank")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const ranked = row.ranked;
              const cls = ranked ? getRankClassification(ranked.rr) : null;
              const theme = cls ? TIER_ACHIEVEMENT_THEME[cls.tierId] : null;
              const portrait = ranked?.logoPath || row.entry.logoUrl;
              const roman = ranked ? rankRomanStepFromRr(ranked.rr) : null;

              return (
                <tr
                  key={row.entry.id}
                  className={cn(
                    "border-b border-white/10 transition-colors last:border-b-0 hover:bg-amber-200/[0.04]",
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.025]",
                  )}
                >
                  <td className="px-3 py-3 text-center tabular-nums text-zinc-500">{i + 1}</td>
                  <td className="px-2 py-3">
                    {ranked ? (
                      <PlayerProfileLink player={ranked} className="inline-block">
                        <RosterAvatar src={portrait} tierId={cls?.tierId} ringClass={cn("border-transparent", theme?.stepRing)} />
                      </PlayerProfileLink>
                    ) : (
                      <RosterAvatar src={portrait} ringClass="border-white/20" />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {ranked ? (
                      <PlayerProfileLink player={ranked} className="inline-block max-w-full">
                        <span className="font-[family-name:var(--font-display)] font-semibold tracking-wide text-amber-50 transition hover:text-amber-100">
                          {row.entry.name}
                        </span>
                      </PlayerProfileLink>
                    ) : (
                      <span className="font-[family-name:var(--font-display)] font-semibold tracking-wide text-amber-50">
                        {row.entry.name}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {ranked ? <PlayerClanLink player={ranked} size="sm" className="justify-center" /> : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-3 py-3 text-zinc-400">{cls?.categoryLabel ?? "—"}</td>
                  <td className="relative overflow-visible px-2 py-3 text-center">
                    {cls && ranked ? (
                      <TierPortraitBadge
                        cls={cls}
                        tierPortrait={getFormRankPortraitPath(cls.tierId)}
                        rr={ranked.rr}
                        className="mx-auto w-fit"
                        tooltipPlacement="above"
                        tooltipAlign="center"
                      />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className={cn("px-3 py-3 font-semibold tabular-nums", theme?.stepAccent ?? "text-zinc-500")}>
                    {ranked ? ranked.rr : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {cls && roman && theme ? (
                      <RankLabel roman={roman} tierId={cls.tierId} label={cls.subcategoryLabel} className={theme.titleRankClass} />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-white/10 lg:hidden" aria-label={t("pages.championship.tabs.roster")}>
        {rows.map((row, i) => {
          const ranked = row.ranked;
          const cls = ranked ? getRankClassification(ranked.rr) : null;
          const theme = cls ? TIER_ACHIEVEMENT_THEME[cls.tierId] : null;
          const portrait = ranked?.logoPath || row.entry.logoUrl;
          const roman = ranked ? rankRomanStepFromRr(ranked.rr) : null;
          const avatar = (
            <RosterAvatar
              src={portrait}
              tierId={cls?.tierId}
              ringClass={theme ? cn("border-transparent", theme.stepRing) : "border-white/20"}
            />
          );

          return (
            <li key={row.entry.id} className={cn("px-4 py-4", i % 2 === 0 ? "bg-transparent" : "bg-white/[0.025]")}>
              <div className="flex items-start gap-3">
                <span className="mt-2 w-5 shrink-0 text-center text-xs tabular-nums text-zinc-500">{i + 1}</span>
                {ranked ? (
                  <PlayerProfileLink player={ranked} className="inline-block">
                    {avatar}
                  </PlayerProfileLink>
                ) : (
                  avatar
                )}
                <div className="min-w-0 flex-1">
                  {ranked ? (
                    <PlayerProfileLink player={ranked} className="inline-block max-w-full">
                      <p className="truncate font-[family-name:var(--font-display)] font-semibold tracking-wide text-amber-50 transition hover:text-amber-100">
                        {row.entry.name}
                      </p>
                    </PlayerProfileLink>
                  ) : (
                    <p className="truncate font-[family-name:var(--font-display)] font-semibold tracking-wide text-amber-50">{row.entry.name}</p>
                  )}
                  <p className="mt-0.5 truncate text-xs text-zinc-400">{cls?.categoryLabel ?? "—"}</p>
                </div>
                {ranked ? <PlayerClanLink player={ranked} size="sm" /> : null}
                {cls && ranked ? (
                  <TierPortraitBadge
                    cls={cls}
                    tierPortrait={getFormRankPortraitPath(cls.tierId)}
                    rr={ranked.rr}
                    tooltipPlacement="above"
                    tooltipAlign="end"
                  />
                ) : null}
              </div>

              {cls && ranked && roman && theme ? (
                <div className="mt-3 flex items-stretch gap-2 pl-8">
                  <div className={cn("w-[7.25rem] shrink-0 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-center ring-1 ring-inset", theme.stepRing)}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">{t("pages.players.racePopoverRr")}</p>
                    <p className={cn("mt-1 text-lg font-semibold tabular-nums leading-none", theme.stepAccent)}>{ranked.rr}</p>
                  </div>
                  <div className={cn("flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 ring-1 ring-inset", theme.stepRing)}>
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold shadow-inner",
                        rankRomanMedallionClass(cls.tierId),
                      )}
                      aria-hidden
                    >
                      {roman}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">{t("pages.players.racePopoverRank")}</span>
                      <span className={cn("block truncate text-sm font-semibold leading-tight", theme.titleRankClass)}>{cls.subcategoryLabel}</span>
                    </span>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
