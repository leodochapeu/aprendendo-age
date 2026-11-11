import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { getFormRankPortraitPath, MolduraAgeAvatar } from "@/components/rank/rankProfileUi";
import { TierPortraitBadge } from "@/components/rank/TierPortraitBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { ClanTheme } from "@/lib/clanTheme";
import { cn } from "@/lib/cn";
import { type AomRacePlayer, playerDisplayLabel } from "@/lib/playersApi";
import {
  getRankClassification,
  rankRomanMedallionClass,
  rankRomanStepFromRr,
  TIER_ACHIEVEMENT_THEME,
} from "@/lib/rankClassification";

const GRID_SCRIM =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M40 0L40 80M0 40L80 40'/%3E%3C/g%3E%3C/svg%3E\")";

type MemberVariant = "champion" | "elite" | "member";

function ClanMemberCard({
  player,
  rank,
  variant,
  theme,
}: {
  player: AomRacePlayer;
  rank: number;
  variant: MemberVariant;
  theme: ClanTheme;
}) {
  const { t } = useTranslation();
  const cls = getRankClassification(player.rr);
  const tierTheme = TIER_ACHIEVEMENT_THEME[cls.tierId];
  const label = playerDisplayLabel(player);
  const roman = rankRomanStepFromRr(player.rr);
  const tierPortrait = getFormRankPortraitPath(cls.tierId);

  const avatarSize =
    variant === "champion" ? "hero" : variant === "elite" ? "large" : "clanMember";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-lg shadow-black/50 backdrop-blur-sm",
        theme.accentBorder,
        variant === "champion" && cn("ring-2 ring-inset", theme.accentRing),
        variant === "elite" && "sm:mt-6",
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0", tierTheme.clanMemberCardBg)} aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: GRID_SCRIM }}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-[30%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:h-40 sm:w-40",
          variant === "champion" ? "opacity-35" : "opacity-22",
          tierTheme.iconBlurClass,
        )}
        aria-hidden
      />

      <div className={cn("relative", variant === "champion" ? "p-5 sm:p-6" : "p-4 sm:p-5")}>
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
              theme.badgeBg,
            )}
          >
            {variant === "champion"
              ? t("pages.clans.detail.rankChampion")
              : t("pages.clans.detail.rankPosition", { rank })}
          </span>
          <TierPortraitBadge cls={cls} tierPortrait={tierPortrait} rr={player.rr} />
        </div>

        <div className={cn("mt-4 flex flex-col items-center text-center", variant !== "member" && "sm:mt-5")}>
          <div className="relative mx-auto shrink-0">
            <MolduraAgeAvatar
              tierId={cls.tierId}
              ageToken={cls.ageToken}
              frameImageSrc={tierPortrait}
              portraitUrl={player.logoPath}
              size={avatarSize}
              emptyFallback={<PlayerAvatarMark src="" tierId={cls.tierId} className="rounded-full" />}
            />
          </div>

          <h3
            className={cn(
              "font-[family-name:var(--font-display)] font-semibold tracking-wide text-zinc-50",
              variant === "champion"
                ? "mt-5 text-xl sm:mt-6 sm:text-2xl"
                : variant === "elite"
                  ? "mt-4 text-base sm:mt-5 sm:text-lg"
                  : "mt-4 text-base sm:mt-4 sm:text-lg",
            )}
          >
            {label}
          </h3>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">{cls.categoryLabel}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5">
          <div className={cn("rounded-xl border px-2 py-2.5 text-center", theme.statSurface)}>
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500 sm:text-[10px]">
              {t("pages.players.racePopoverRr")}
            </p>
            <p className={cn("mt-1 text-lg font-bold tabular-nums leading-none", tierTheme.stepAccent)}>{player.rr}</p>
          </div>
          <div className={cn("rounded-xl border px-2 py-2.5 text-center", theme.statSurface)}>
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500 sm:text-[10px]">
              {t("pages.clans.detail.winsLosses")}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-100">
              {player.wins ?? "—"}
              <span className="text-zinc-600"> / </span>
              {player.losses ?? "—"}
            </p>
          </div>
          <div className={cn("rounded-xl border px-2 py-2.5 text-center", theme.statSurface)}>
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500 sm:text-[10px]">
              {t("pages.clans.detail.division")}
            </p>
            <div className="mt-1 flex items-center justify-center gap-1">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold shadow-inner",
                  rankRomanMedallionClass(cls.tierId),
                )}
                aria-hidden
              >
                {roman}
              </span>
              <span className={cn("text-xs font-semibold leading-tight", tierTheme.titleRankClass)}>
                {cls.subcategoryLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ClanRoster({
  players,
  theme,
}: {
  players: AomRacePlayer[];
  theme: ClanTheme;
}) {
  const { t } = useTranslation();

  if (players.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-950/40 px-4 py-12 text-center text-sm text-zinc-500">
        {t("pages.clans.detail.rosterEmpty")}
      </p>
    );
  }

  const [first, second, third, ...rest] = players;

  return (
    <div className="space-y-8">
      {first ? (
        <div className="grid gap-4 lg:grid-cols-3 lg:items-end lg:gap-5">
          {second ? (
            <div className="order-2 lg:order-1">
              <ClanMemberCard player={second} rank={2} variant="elite" theme={theme} />
            </div>
          ) : (
            <div className="hidden lg:block" />
          )}
          <div className="order-1 lg:order-2">
            <ClanMemberCard player={first} rank={1} variant="champion" theme={theme} />
          </div>
          {third ? (
            <div className="order-3">
              <ClanMemberCard player={third} rank={3} variant="elite" theme={theme} />
            </div>
          ) : (
            <div className="hidden lg:block" />
          )}
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            {t("pages.clans.detail.rosterMore")}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((player, i) => (
              <li key={player.id}>
                <ClanMemberCard player={player} rank={i + 4} variant="member" theme={theme} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
