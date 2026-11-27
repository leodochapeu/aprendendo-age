import { useMemo } from "react";

import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { PlayerClanLink } from "@/components/jogadores/PlayerClanLink";
import { PlayerProfileLink } from "@/components/jogadores/PlayerProfileLink";
import { SUMMER_PHASES, summerPhaseById } from "@/components/campeonato/verao/phases";
import { linkSummerDraw } from "@/components/campeonato/verao/draw";
import { linkSummerPots, type LinkedSummerPot } from "@/components/campeonato/verao/pots";
import { useTranslation } from "@/hooks/useTranslation";
import type { ChampionshipPlayer } from "@/lib/championshipsApi";
import { cn } from "@/lib/cn";
import type { AomRacePlayer } from "@/lib/playersApi";
import { TIER_ACHIEVEMENT_THEME, getRankClassification } from "@/lib/rankClassification";
import { computeWeightedRr } from "@/lib/weightedRr";

function ratingLine(ranked: AomRacePlayer | null, showWeightedRr: boolean) {
  if (!ranked || !Number.isFinite(ranked.rr)) return null;
  const cls = getRankClassification(ranked.rr);
  const rr = showWeightedRr ? computeWeightedRr(ranked.rr, ranked.rrBest) : ranked.rr;
  return { cls, rr, theme: TIER_ACHIEVEMENT_THEME[cls.tierId] };
}

function PotPlayerRow({
  code,
  name,
  ranked,
  logoUrl,
  accent,
  showWeightedRr,
}: {
  code: string;
  name: string;
  ranked: AomRacePlayer | null;
  logoUrl: string;
  accent: string;
  showWeightedRr: boolean;
}) {
  const rank = ratingLine(ranked, showWeightedRr);
  const avatar = (
    <div
      className={cn(
        "relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 bg-zinc-950 p-0.5 shadow-md shadow-black/50",
        rank ? cn("border-transparent", rank.theme.stepRing) : "border-white/20",
      )}
    >
      <PlayerAvatarMark src={logoUrl} tierId={rank?.cls.tierId} width={40} height={40} className="rounded-full" />
    </div>
  );

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
      <span
        className={cn(
          "flex h-8 w-10 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold tracking-wide",
          !code && "border-dashed opacity-40",
        )}
        style={{ borderColor: accent, color: accent, backgroundColor: "rgba(0,0,0,0.35)" }}
      >
        {code || "—"}
      </span>
      {ranked ? <PlayerProfileLink player={ranked}>{avatar}</PlayerProfileLink> : avatar}
      <div className="min-w-0 flex-1">
        {ranked ? (
          <PlayerProfileLink player={ranked} className="block min-w-0">
            <p className="truncate font-[family-name:var(--font-display)] font-semibold tracking-wide text-amber-50">{name}</p>
          </PlayerProfileLink>
        ) : (
          <p className="truncate font-[family-name:var(--font-display)] font-semibold tracking-wide text-amber-50">{name}</p>
        )}
        <p className="truncate text-[11px] text-zinc-400">
          {rank ? `${rank.cls.categoryLabel} · ${rank.rr}` : "—"}
        </p>
      </div>
      {ranked ? <PlayerClanLink player={ranked} size="sm" /> : null}
    </li>
  );
}

function PotColumn({
  pot,
  stats,
  logos,
  codes,
  showWeightedRr,
}: {
  pot: LinkedSummerPot;
  stats: Map<string, AomRacePlayer>;
  logos: Map<string, string>;
  codes: Map<string, string>;
  showWeightedRr: boolean;
}) {
  const phase = summerPhaseById(pot.phase);
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-lg shadow-black/30">
      <header className="flex items-end justify-between border-b border-white/10 px-4 py-3" style={{ background: phase.wash }}>
        <div>
          <p className="text-[10px] tracking-[0.28em] uppercase" style={{ color: phase.accent }}>
            Pote
          </p>
          <h3 className="font-[family-name:var(--font-display)] text-3xl leading-none" style={{ color: phase.ink }}>
            {pot.id}
          </h3>
        </div>
        <p className="text-xs tabular-nums text-zinc-300">{pot.slots.length}</p>
      </header>
      <ul className="divide-y divide-white/10">
        {pot.slots.map((slot) => {
          const ranked = slot.player ? stats.get(slot.player.id) ?? null : null;
          const name = slot.player?.name || slot.sheetName;
          const logoUrl = ranked?.logoPath || (slot.player ? logos.get(slot.player.id) : "") || "";
          return (
            <PotPlayerRow
              key={slot.code}
              code={slot.player ? codes.get(slot.player.id) ?? "" : ""}
              name={name}
              ranked={ranked}
              logoUrl={logoUrl}
              accent={phase.accent}
              showWeightedRr={showWeightedRr}
            />
          );
        })}
      </ul>
    </article>
  );
}

export function SummerPotsView({
  players,
  stats,
  showWeightedRr = false,
}: {
  players: ChampionshipPlayer[];
  stats: AomRacePlayer[];
  showWeightedRr?: boolean;
}) {
  const { t } = useTranslation();
  const byProfile = useMemo(() => new Map(stats.map((player) => [player.id, player])), [stats]);
  const linked = useMemo(
    () =>
      linkSummerPots(
        players.map((player) => ({
          id: player.profileId,
          name: player.name,
          rating: byProfile.get(player.profileId)?.rr ?? null,
        })),
      ),
    [players, byProfile],
  );
  const codeByPlayer = useMemo(() => {
    const drawn = linkSummerDraw(
      players.map((player) => ({
        id: player.profileId,
        name: player.name,
        rating: byProfile.get(player.profileId)?.rr ?? null,
      })),
    );
    return new Map(drawn.flatMap((slot) => (slot.player ? [[slot.player.id, slot.code] as const] : [])));
  }, [players, byProfile]);
  const logos = useMemo(() => new Map(players.map((player) => [player.profileId, player.logoUrl])), [players]);
  const potById = useMemo(() => new Map(linked.pots.map((pot) => [pot.id, pot])), [linked.pots]);

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-zinc-400">{t("pages.championship.summer.potsLead")}</p>
      {SUMMER_PHASES.map((phase) => (
        <section
          key={phase.id}
          className="relative overflow-hidden rounded-3xl border p-4 sm:p-5"
          style={{ borderColor: `${phase.accent}66`, background: `linear-gradient(180deg, ${phase.wash}, rgba(0,0,0,0.25))` }}
        >
          <p
            aria-hidden
            className="pointer-events-none absolute top-3 right-4 font-[family-name:var(--font-display)] text-5xl leading-none uppercase opacity-25 sm:text-6xl"
            style={{ color: phase.accent }}
          >
            {t(`pages.championship.summer.phaseName.${phase.id}`)}
          </p>
          <header className="relative mb-4">
            <p className="text-[11px] font-semibold tracking-[0.32em] uppercase" style={{ color: phase.accent }}>
              {t(`pages.championship.summer.phase.${phase.id}`)}
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-amber-50">
              {phase.pots.map((id) => `Pote ${id}`).join(" · ")}
            </h2>
          </header>
          <div className="relative grid max-w-xl gap-4">
            {phase.pots.map((id) => {
              const pot = potById.get(id);
              if (!pot) return null;
              return <PotColumn key={id} pot={pot} stats={byProfile} logos={logos} codes={codeByPlayer} showWeightedRr={showWeightedRr} />;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
