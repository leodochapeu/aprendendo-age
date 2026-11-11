import { Fragment, type ReactNode, useMemo, useState } from "react";

import { GodInsignias, PLAYER_INSIGNIA_ORDER, type GodInsigniaKind } from "@/components/gods/GodInsigniaBadges";
import { ModalApp } from "@/components/ui/ModalApp";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type GodStatRow,
  type PlayerStatsResponse,
  type ProfileStatRow,
} from "@/lib/formRetoldApi";
import { getGodPortraitUrl } from "@/lib/godIconFromName";
import { cn } from "@/lib/cn";
import { getRankGuideTiers } from "@/lib/rankGuideTiers";
import {
  type RankRomanStep,
  type RankTierId,
  TIER_ACHIEVEMENT_THEME,
  getRankClassification,
  rankRomanMedallionClass,
  rankRomanStepFromRr,
} from "@/lib/rankClassification";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";

const GRID_SCRIM =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M40 0L40 80M0 40L80 40'/%3E%3C/g%3E%3C/svg%3E\")";

/** Retratos em `public/assets/rank` — moldura/título no FormRankPage (perfil, deuses); Classificação continua com tokens de eras. */
const FORM_RANK_PORTRAIT: Record<RankTierId, string> = {
  bronze: "/assets/rank/Portrait_Archaic.webp",
  prata: "/assets/rank/Portrait_Classical.webp",
  ouro: "/assets/rank/Portrait_Heroic.webp",
  esmeralda: "/assets/rank/Portrait_Mythic.webp",
  diamante: "/assets/rank/Portrait_Wonder.webp",
};

function getFormRankPortraitPath(tierId: RankTierId): string {
  return FORM_RANK_PORTRAIT[tierId];
}

export { getFormRankPortraitPath };

/** Classes em `index.css` — mesmo critério do form-retold (Ouro+). */
function rankPortraitShineClass(tierId: RankTierId, compact = false): string | undefined {
  if (compact) {
    if (tierId === "ouro") return "shine-ouro-compact";
    if (tierId === "esmeralda") return "shine-esmeralda-compact";
    if (tierId === "diamante") return "shine-diamante-compact";
    return undefined;
  }
  if (tierId === "ouro") return "shine-ouro";
  if (tierId === "esmeralda") return "shine-esmeralda";
  if (tierId === "diamante") return "shine-diamante";
  return undefined;
}

/** GIF atrás da moldura + avatar só no tier Diamante (`public/assets/rank`). */
const FORM_RANK_BORDA_CHAMAS = "/assets/rank/borda-chamas.gif";

function AchievementShell({
  tierId,
  className,
  children,
}: {
  tierId: RankTierId;
  className?: string;
  children: ReactNode;
}) {
  const theme = TIER_ACHIEVEMENT_THEME[tierId];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-aom-border/60 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)]",
        theme.surfaceClass,
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: GRID_SCRIM }}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function StatSubCard({
  tierId,
  title,
  value,
  sub,
  /** Grelha estreita (cards de deus em 3 colunas no desktop). */
  tight,
  /** WR costuma ser mais largo (ex.: 100.00%) — fonte um pouco menor + tracking mais apertado. */
  wrTight,
}: {
  tierId: RankTierId;
  title: string;
  value: string;
  sub?: string;
  tight?: boolean;
  wrTight?: boolean;
}) {
  const theme = TIER_ACHIEVEMENT_THEME[tierId];
  return (
    <div
      className={cn(
        "box-border flex min-h-0 min-w-0 flex-col items-center justify-center rounded-2xl border border-aom-border/50 bg-zinc-950/55 text-center shadow-inner shadow-black/40 backdrop-blur-sm ring-inset",
        theme.stepRing,
        /* AJUSTE MANUAL (padding dos mini-stats): altere px-/py- abaixo. */
        tight ? "ring-1 px-2.5 py-3.5 sm:px-3 sm:py-3.5" : "ring-2 px-4 py-4 sm:px-5 sm:py-5",
      )}
    >
      <span
        className={cn(
          "max-w-full shrink-0 font-medium uppercase tracking-[0.18em] text-zinc-500",
          tight ? "text-[10px] leading-tight sm:text-[10px]" : "text-[10px] tracking-[0.2em]",
        )}
      >
        {title}
      </span>
      <span
        className={cn(
          /* RR / WR / números: uma linha; não usar break-words (partia "1488"). */
          "mt-2 block w-full min-w-0 max-w-full text-center font-semibold tabular-nums leading-none whitespace-nowrap",
          tight
            ? wrTight
              ? /* WR: mais compacto para caber em colunas estreitas */
                "px-0.5 text-[10px] tracking-tighter sm:px-1 sm:text-[11px] md:text-xs"
              : /* AJUSTE MANUAL (tamanho RR/Jogos nos deuses) */
                "px-1 text-[11px] tracking-tight sm:px-1.5 sm:text-xs md:text-sm"
            : "min-w-0 px-2.5 text-base sm:px-3 sm:text-lg md:text-xl",
          theme.stepAccent,
        )}
      >
        {value}
      </span>
      {sub ? (
        <span className="mt-1.5 max-w-full shrink-0 px-2 text-center font-mono text-[10px] leading-snug text-zinc-500 sm:text-[11px]">
          {sub}
        </span>
      ) : null}
    </div>
  );
}

function CategorySubCard({
  tierId,
  ageToken,
  label,
  value,
  hint,
  onOpenRankGuide,
  t,
}: {
  tierId: RankTierId;
  ageToken: string;
  label: string;
  value: string;
  hint: string;
  onOpenRankGuide: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const theme = TIER_ACHIEVEMENT_THEME[tierId];
  const ageSrc = getTokenAssetUrl(ageToken);
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-aom-border/50 bg-zinc-950/55 px-3 py-3 shadow-inner shadow-black/40 ring-2 ring-inset sm:px-4",
        theme.stepRing,
      )}
    >
      {ageSrc ? (
        <img src={ageSrc} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-aom-border/60 bg-black/20 object-contain p-0.5" width={40} height={40} />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">{label}</p>
        <p className="truncate text-sm font-semibold text-zinc-100">{value}</p>
      </div>
      <button
        type="button"
        onClick={onOpenRankGuide}
        title={hint}
        aria-label={t("pages.rank.openRankGuideHint", { hint })}
        className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-white/5 text-[11px] font-semibold text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        ?
      </button>
    </div>
  );
}

/** Conteúdo do modal: mesma progressão que `TierAchievement` em `RankPage`. */
function RankGuideModalContent({ t }: { t: (key: string) => string }) {
  const tiers = useMemo(() => getRankGuideTiers(t), [t]);
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-0 items-stretch gap-0.5 sm:gap-1">
        {tiers.map((tier, i) => {
          const iconSrc = getTokenAssetUrl(tier.token);
          return (
            <Fragment key={tier.id}>
              <div className="flex w-[7.5rem] shrink-0 flex-col items-center rounded-2xl border border-aom-border/50 bg-zinc-950/80 px-2 py-3 sm:w-[8.25rem] sm:px-2.5 md:w-[9rem] md:px-3">
                {iconSrc ? (
                  <img src={iconSrc} alt="" className="h-10 w-10 object-contain sm:h-11 sm:w-11" width={44} height={44} />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-zinc-600 text-zinc-600 sm:h-11 sm:w-11">—</div>
                )}
                <p className={cn("mt-2 text-center font-[family-name:var(--font-display)] text-xs font-semibold leading-tight sm:text-[13px]", tier.titleClass)}>
                  {tier.rankName}
                  <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-zinc-400 sm:text-[11px]">{tier.eraName}</span>
                </p>
                <p className="mt-1 text-center font-mono text-[9px] leading-tight text-zinc-500">{tier.rrBand}</p>
                <ul className="mt-2.5 w-full space-y-1">
                  {tier.steps.map((step) => (
                    <li
                      key={step.label}
                      className={cn(
                        "rounded-lg border border-aom-border/40 bg-black/25 px-1 py-1 text-center shadow-inner ring-1 ring-inset",
                        tier.stepRing,
                      )}
                    >
                      <span className={cn("block text-[10px] font-semibold leading-tight", tier.stepAccent)}>{step.label}</span>
                      <span className="mt-0.5 block font-mono text-[9px] text-zinc-500">{step.rr} RR</span>
                    </li>
                  ))}
                </ul>
              </div>
              {i < tiers.length - 1 ? (
                <div className="flex shrink-0 items-center self-center px-0.5 text-zinc-600 sm:px-1" aria-hidden>
                  <span className="text-base leading-none sm:text-lg">→</span>
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function splitCategoryLabel(categoryLabel: string): { rank: string; era: string } {
  const parts = categoryLabel.split("|").map((s) => s.trim());
  return { rank: parts[0] ?? categoryLabel, era: parts[1] ?? "" };
}

/**
 * Ícone da era (moldura) + retrato circular centrado — mesmo layout em Perfil, Deuses e Corrida AoM.
 * AJUSTE MANUAL: tamanhos em `w-[9rem]…`, retrato `h-[5.75rem]…` / `sm:h-24`.
 */
export function MolduraAgeAvatar({
  tierId,
  ageToken,
  /** Se definido (ex.: `/assets/rank/Portrait_*.png`), substitui o ícone de era dos tokens Notion só neste componente. */
  frameImageSrc,
  portraitUrl,
  emptyFallback,
  /** Selo romano na base da moldura (centro), alinhado ao overlay HUD Meta. */
  romanBadge,
  size = "default",
  t,
}: {
  tierId: RankTierId;
  ageToken: string;
  frameImageSrc?: string;
  portraitUrl: string | null | undefined;
  emptyFallback: ReactNode;
  romanBadge?: { step: RankRomanStep; medallionClass: string };
  size?: "default" | "compact" | "hero" | "large" | "clanMember";
  t?: (key: string, params?: Record<string, string | number>) => string;
}) {
  const theme = TIER_ACHIEVEMENT_THEME[tierId];
  const ageSrc = frameImageSrc?.trim() ? frameImageSrc : getTokenAssetUrl(ageToken);
  const showFlames = tierId === "diamante";
  const compact = size === "compact";
  const hero = size === "hero";
  const large = size === "large";
  const clanMember = size === "clanMember";

  return (
    <div
      className={cn(
        "relative mx-auto aspect-square overflow-visible",
        compact
          ? "h-full w-full"
          : hero
            ? "w-[12rem] sm:w-[14rem] md:w-[15rem]"
            : large
              ? "w-[10.5rem] sm:w-[12rem] md:w-[13rem]"
              : clanMember
                ? "w-[8rem] sm:w-[9rem] md:w-[9.75rem]"
                : "w-[9rem] sm:w-[9.75rem] md:w-[10rem]",
      )}
    >
      {!compact ? (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 z-0 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl",
            theme.iconBlurClass,
          )}
          aria-hidden
        />
      ) : null}
      {showFlames ? (
        <img
          src={FORM_RANK_BORDA_CHAMAS}
          alt=""
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 object-contain",
            compact ? "h-full w-full opacity-90" : "h-[118%] w-[118%] opacity-[0.92]",
          )}
          width={compact ? 64 : 200}
          height={compact ? 64 : 200}
        />
      ) : null}
      {ageSrc ? (
        <img
          src={ageSrc}
          alt=""
          className={cn(
            "absolute left-1/2 top-1/2 z-[2] h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 object-contain",
            rankPortraitShineClass(tierId, compact) ??
              (compact ? "drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]" : "drop-shadow-[0_16px_40px_rgba(0,0,0,0.55)]"),
          )}
          width={compact ? 56 : 160}
          height={compact ? 56 : 160}
        />
      ) : null}
      <div className="absolute inset-0 z-[3] flex items-center justify-center">
        <div
          className={cn(
            "shrink-0 rounded-full bg-zinc-950/90 shadow-lg ring-inset",
            compact
              ? "h-[58%] w-[58%] border-[2px] p-[2px] ring-1"
              : hero
                ? "h-[7.5rem] w-[7.5rem] border-[2.5px] p-[3px] ring-2 sm:h-[8.5rem] sm:w-[8.5rem] md:h-[9rem] md:w-[9rem]"
                : large
                  ? "h-[6.5rem] w-[6.5rem] border-[2.5px] p-[3px] ring-2 sm:h-[7.25rem] sm:w-[7.25rem] md:h-[7.75rem] md:w-[7.75rem]"
                  : clanMember
                    ? "h-[4.65rem] w-[4.65rem] border-[2px] p-[2px] ring-1 sm:h-[5.25rem] sm:w-[5.25rem] md:h-[5.65rem] md:w-[5.65rem]"
                    : "h-[5.75rem] w-[5.75rem] border-[2.5px] p-[3px] ring-2 sm:h-24 sm:w-24",
            theme.stepRing,
          )}
        >
          {portraitUrl?.trim() ? (
            <PlayerAvatarMark
              src={portraitUrl}
              tierId={tierId}
              className="rounded-full"
              width={compact ? 36 : 96}
              height={compact ? 36 : 96}
            />
          ) : (
            emptyFallback
          )}
        </div>
      </div>
      {romanBadge && t ? (
        <div
          className={cn(
            "pointer-events-none absolute bottom-0 left-1/2 z-[5] flex h-7 min-w-[2.55rem] -translate-x-1/2 translate-y-[18%] items-center justify-center rounded-lg border-[3px] px-2.5 py-0 shadow-[0_3px_10px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.14)] ring-2 ring-black/55 sm:h-8 sm:min-w-[2.95rem] sm:translate-y-[16%] sm:px-3 sm:rounded-xl md:h-9 md:min-w-[3.35rem] md:px-3.5 md:border-[3.5px]",
            romanBadge.medallionClass,
          )}
          title={t("pages.rank.rankSubdivisionTitle", { step: romanBadge.step })}
          aria-hidden
        >
          <span
            className={cn(
              "font-[family-name:var(--font-display)] text-sm font-semibold leading-none tracking-tight sm:text-[15px] md:text-lg",
              "[text-shadow:0_0_0.5px_rgba(0,0,0,0.95),0_1px_0_rgba(255,255,255,0.28)]",
            )}
          >
            {romanBadge.step}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function RankProfileHero({
  player,
  row1v1,
  rr,
  classification,
}: {
  player: PlayerStatsResponse;
  row1v1: ProfileStatRow;
  rr: number;
  classification: ReturnType<typeof getRankClassification>;
}) {
  const { t } = useTranslation();
  const [rankGuideOpen, setRankGuideOpen] = useState(false);
  const theme = TIER_ACHIEVEMENT_THEME[classification.tierId];
  const { rank: rankWord, era: eraWord } = splitCategoryLabel(classification.categoryLabel);
  const romanStep = rankRomanStepFromRr(rr);
  const romanMedallion = rankRomanMedallionClass(classification.tierId);

  const innerAvatar = (
    <MolduraAgeAvatar
      tierId={classification.tierId}
      ageToken={classification.ageToken}
      frameImageSrc={getFormRankPortraitPath(classification.tierId)}
      portraitUrl={player.playerAvatarUrl}
      emptyFallback={<PlayerAvatarMark src="" tierId={classification.tierId} className="rounded-full" />}
      romanBadge={{ step: romanStep, medallionClass: romanMedallion }}
      t={t}
    />
  );

  return (
    <>
      <AchievementShell tierId={classification.tierId} className="mx-auto w-full max-w-xl lg:max-w-5xl xl:max-w-6xl">
      <div className="px-4 pb-10 pt-8 sm:px-8 sm:pb-12 sm:pt-10">
        <p className="mb-6 text-center font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-white/85">
          {t("pages.rank.profileSection")}
        </p>

        {player.profileUrl ? (
          <a
            href={player.profileUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="block outline-none transition hover:opacity-95"
            title={t("pages.rank.openProfile", { name: player.profileName })}
          >
            {innerAvatar}
          </a>
        ) : (
          innerAvatar
        )}

        <h2 className="mt-8 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center sm:h-12 sm:w-12 md:h-[3.25rem] md:w-[3.25rem]">
            {classification.tierId === "diamante" ? (
              <img
                src={FORM_RANK_BORDA_CHAMAS}
                alt=""
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[145%] w-[145%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-90"
                width={72}
                height={72}
              />
            ) : null}
            <img
              src={getFormRankPortraitPath(classification.tierId)}
              alt=""
              className={cn(
                "relative z-[1] h-9 w-9 object-contain opacity-95 sm:h-10 sm:w-10 md:h-11 md:w-11",
                rankPortraitShineClass(classification.tierId) ?? "drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]",
              )}
              width={44}
              height={44}
            />
          </span>
          <span className="min-w-0">
            <span className={theme.titleRankClass}>{rankWord}</span>
            {eraWord ? (
              <>
                <span className="text-zinc-500"> | </span>
                <span className="text-zinc-200">{eraWord}</span>
              </>
            ) : null}
          </span>
        </h2>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center">
          {player.clanTag ? (
            <span
              className="rounded-md border border-zinc-500/45 bg-black/25 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-100"
              title={player.funStats?.clan_name ?? player.clanTag}
            >
              {player.clanTag}
            </span>
          ) : null}
          <span className="font-[family-name:var(--font-display)] text-lg font-medium text-zinc-100 sm:text-xl">{player.profileName}</span>
        </div>

        <div className="mt-10 grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div className="min-w-0 space-y-4">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 lg:mb-3 lg:text-left">
              {t("pages.rank.statistics")}
            </p>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 sm:[grid-template-columns:repeat(3,minmax(0,1fr))]">
              <StatSubCard tierId={classification.tierId} title="RR" value={String(rr)} />
              <StatSubCard tierId={classification.tierId} title={t("common.wins")} value={String(row1v1.wins)} />
              <StatSubCard tierId={classification.tierId} title={t("common.losses")} value={String(row1v1.losses)} />
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:[grid-template-columns:repeat(2,minmax(0,1fr))]">
              <StatSubCard tierId={classification.tierId} title={t("common.winRate")} value={row1v1.winRate} />
              {row1v1.rank ? (
                <StatSubCard
                  tierId={classification.tierId}
                  title={t("pages.rank.leaderboardRank")}
                  value={row1v1.rank}
                  sub={t("common.globalRank")}
                />
              ) : (
                <StatSubCard
                  tierId={classification.tierId}
                  title={t("common.matches")}
                  value={`${row1v1.wins + row1v1.losses}`}
                  sub={t("common.winsPlusLosses")}
                />
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 lg:mb-3 lg:text-left">
              {t("pages.rank.classification")}
            </p>
            <CategorySubCard
              tierId={classification.tierId}
              ageToken={classification.ageToken}
              label={t("common.category")}
              value={classification.categoryLabel}
              hint={classification.hintCategory}
              onOpenRankGuide={() => setRankGuideOpen(true)}
              t={t}
            />
            <CategorySubCard
              tierId={classification.tierId}
              ageToken={classification.ageToken}
              label={t("common.subcategory")}
              value={classification.subcategoryLabel}
              hint={classification.hintSub}
              onOpenRankGuide={() => setRankGuideOpen(true)}
              t={t}
            />
          </div>
        </div>
      </div>
    </AchievementShell>

      <ModalApp
        open={rankGuideOpen}
        onClose={() => setRankGuideOpen(false)}
        title={t("pages.rank.rankDivisions")}
        description={t("pages.rank.rankGuideModalDesc")}
        className="max-w-[min(96vw,80rem)]"
      >
        <RankGuideModalContent t={t} />
      </ModalApp>
    </>
  );
}

export function GodAchievementCard({
  god,
  t,
  insignias,
}: {
  god: GodStatRow;
  t: (key: string) => string;
  insignias?: GodInsigniaKind[];
}) {
  const cls = getRankClassification(god.elo);
  const theme = TIER_ACHIEVEMENT_THEME[cls.tierId];
  const portrait = getGodPortraitUrl(god.god);
  const { rank: rankWord, era: eraWord } = splitCategoryLabel(cls.categoryLabel);
  const godRomanStep = rankRomanStepFromRr(god.elo);
  const godRomanMedallion = rankRomanMedallionClass(cls.tierId);

  function playerInsigniaLabelKey(id: GodInsigniaKind): string {
    switch (id) {
      case "mostPlayed":
        return "auth.godsInsigniaMostPlayed";
      case "undefeated":
        return "auth.godsInsigniaUndefeated";
      case "highlight":
        return "auth.godsInsigniaHighlight";
      default:
        return "auth.godsInsigniaMostPlayed";
    }
  }

  function playerInsigniaHintKey(id: GodInsigniaKind): string {
    switch (id) {
      case "mostPlayed":
        return "auth.godsInsigniaMostPlayedHint";
      case "undefeated":
        return "auth.godsInsigniaUndefeatedHint";
      case "highlight":
        return "auth.godsInsigniaHighlightHint";
      default:
        return "auth.godsInsigniaMostPlayedHint";
    }
  }

  return (
    <AchievementShell tierId={cls.tierId} className="relative h-full">
      {insignias && insignias.length > 0 ? (
        <GodInsignias
          insignias={insignias}
          order={PLAYER_INSIGNIA_ORDER}
          labelKey={playerInsigniaLabelKey}
          hintKey={playerInsigniaHintKey}
          t={t}
        />
      ) : null}
      <div className="flex w-full min-w-0 max-w-full flex-col items-center px-3 pb-8 pt-7 sm:px-4 sm:pb-9 sm:pt-8 md:px-5">
        <p className="mb-4 text-center font-mono text-[9px] font-medium uppercase tracking-[0.32em] text-white/85">
          {t("pages.rank.godSection")}
        </p>

        <MolduraAgeAvatar
          tierId={cls.tierId}
          ageToken={cls.ageToken}
          frameImageSrc={getFormRankPortraitPath(cls.tierId)}
          portraitUrl={portrait}
          emptyFallback={<div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-500">—</div>}
          romanBadge={{ step: godRomanStep, medallionClass: godRomanMedallion }}
          t={t}
        />

        <h3 className="mt-5 text-center font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-amber-50/95 sm:text-xl">
          {god.god}
        </h3>

        <p className="mt-1 text-center font-[family-name:var(--font-display)] text-sm sm:text-base">
          <span className={theme.titleRankClass}>{rankWord}</span>
          {eraWord ? (
            <>
              <span className="text-zinc-500"> | </span>
              <span className="text-zinc-300">{eraWord}</span>
            </>
          ) : null}
        </p>
        <p className="mt-1 text-center text-xs text-zinc-500">({cls.subcategoryLabel})</p>

        <div className="mt-6 w-full min-w-0">
          <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            {t("pages.rank.statistics")}
          </p>
          <div className="grid w-full min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-[repeat(3,minmax(0,1fr))] sm:gap-x-2.5 sm:gap-y-2 md:gap-x-3 md:gap-y-2.5">
            <StatSubCard tight tierId={cls.tierId} title="RR" value={String(god.elo)} />
            <StatSubCard tight wrTight tierId={cls.tierId} title={t("common.winRate")} value={god.winRate} />
            <StatSubCard tight tierId={cls.tierId} title={t("pages.rank.games")} value={String(god.games)} />
          </div>
        </div>
      </div>
    </AchievementShell>
  );
}
