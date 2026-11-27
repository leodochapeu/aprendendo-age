import { useEffect, useMemo, useRef, useState } from "react";

import { EpicMatchCard } from "@/components/campeonato/EpicMatchCard";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { SUMMER_MATCHES, SUMMER_ROUNDS, type SummerMatch } from "@/components/campeonato/verao/bracket";
import { SUMMER_STAGE_NAME, summerSlotIndexes } from "@/components/campeonato/verao/fixtures";
import { SUMMER_PHASES, summerPhaseById, type SummerPhaseId } from "@/components/campeonato/verao/phases";
import { linkSummerPots } from "@/components/campeonato/verao/pots";
import { ModalApp } from "@/components/ui/ModalApp";
import { useTranslation } from "@/hooks/useTranslation";
import type { Locale } from "@/i18n/types";
import type { ChampionshipDetail, ChampionshipFixture, ChampionshipPlayer } from "@/lib/championshipsApi";
import { fetchAomRacePlayersByIds } from "@/lib/playersApi";
import { cn } from "@/lib/cn";

const CARD_W = 200;
const CARD_H = 68;
const COL_GAP = 64;
const ROW_UNIT = 36;
const HEADER_H = 36;
const MIN_ROW = 5;
const PAD = 20;

type Seat = {
  name: string;
  logoUrl: string;
  hint: string;
  waiting: boolean;
  phase: SummerPhaseId;
};

function seriesLabel(length: number | null | undefined) {
  if (length === 1) return "MD1";
  if (length === 3) return "MD3";
  if (length === 5) return "MD5";
  if (length === 7) return "MD7";
  return null;
}

function cardOrigin(match: SummerMatch) {
  return {
    x: PAD + match.round * (CARD_W + COL_GAP),
    y: PAD + HEADER_H + (match.row - MIN_ROW) * ROW_UNIT,
  };
}

function slotAnchor(match: SummerMatch, side: "a" | "b") {
  const origin = cardOrigin(match);
  return {
    x: origin.x,
    y: origin.y + (side === "a" ? CARD_H * 0.3 : CARD_H * 0.74),
  };
}

function phaseOfSeed(code: string): SummerPhaseId {
  const letter = code.charAt(0);
  if (letter === "F" || letter === "E") return "green";
  if (letter === "A") return "red";
  return "yellow";
}

export function SummerBracketView({
  camp,
  revealedAll,
  revealedIds,
  onReveal,
}: {
  camp: ChampionshipDetail;
  revealedAll: boolean;
  revealedIds: string[];
  onReveal: (fixtureId: string) => void;
}) {
  const { t, locale } = useTranslation();
  const boardRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Map<string, number>>(new Map());
  const profileKey = camp.players.map((player) => player.profileId).join("|");

  useEffect(() => {
    let cancelled = false;
    void fetchAomRacePlayersByIds(profileKey.split("|").filter(Boolean)).then((rows) => {
      if (cancelled) return;
      setRatings(new Map(rows.map((player) => [player.id, player.rr])));
    }).catch(() => {
      if (!cancelled) setRatings(new Map());
    });
    return () => {
      cancelled = true;
    };
  }, [profileKey]);
  const byId = useMemo(() => new Map(SUMMER_MATCHES.map((match) => [match.id, match])), []);
  const slotOf = useMemo(() => summerSlotIndexes(), []);
  const stage = camp.stages.find((item) => item.name === SUMMER_STAGE_NAME) ?? null;
  const seriesLength = stage?.seriesLength ?? camp.stages[0]?.seriesLength ?? 3;
  const playerById = useMemo(() => new Map(camp.players.map((player) => [player.id, player])), [camp.players]);
  const byCode = useMemo(() => {
    const linked = linkSummerPots(
      camp.players.map((player) => ({
        id: player.id,
        name: player.name,
        rating: ratings.get(player.profileId) ?? null,
      })),
    );
    const map = new Map<string, ChampionshipPlayer>();
    for (const pot of linked.pots) {
      for (const slot of pot.slots) {
        if (!slot.player) continue;
        const entry = playerById.get(slot.player.id);
        if (entry) map.set(slot.code, entry);
      }
    }
    return map;
  }, [camp.players, playerById, ratings]);
  const fixtureByKey = useMemo(() => {
    const map = new Map<string, ChampionshipFixture>();
    for (const fixture of camp.fixtures) {
      if (stage && fixture.stageId !== stage.id) continue;
      if (fixture.roundIndex == null || fixture.slotIndex == null) continue;
      map.set(`${fixture.roundIndex}:${fixture.slotIndex}`, fixture);
    }
    return map;
  }, [camp.fixtures, stage]);

  function fixtureOf(match: SummerMatch) {
    const slot = slotOf.get(match.id);
    if (slot == null) return null;
    return fixtureByKey.get(`${match.round}:${slot}`) ?? null;
  }

  function matchRevealed(match: SummerMatch) {
    if (revealedAll) return true;
    const fixture = fixtureOf(match);
    return Boolean(fixture && revealedIds.includes(fixture.id));
  }

  function positionSeat(match: SummerMatch, side: "a" | "b"): Seat {
    const slot = match[side];
    if (slot.kind === "seed") {
      return { name: slot.code, logoUrl: "", hint: "", waiting: true, phase: phaseOfSeed(slot.code) };
    }
    const source = byId.get(slot.of);
    return {
      name: t(slot.kind === "winner" ? "pages.championship.summer.winner" : "pages.championship.summer.loser"),
      logoUrl: "",
      hint: source ? SUMMER_ROUNDS[source.round].name : "",
      waiting: true,
      phase: SUMMER_ROUNDS[source?.round ?? match.round].phase,
    };
  }

  function seatOf(match: SummerMatch, side: "a" | "b", showPlayers: boolean): Seat {
    if (!showPlayers) return positionSeat(match, side);
    const slot = match[side];
    const fixture = fixtureOf(match);
    const entryId = side === "a" ? fixture?.playerAId : fixture?.playerBId;
    const fromFixture = entryId ? playerById.get(entryId) : null;
    if (fromFixture) {
      return {
        name: fromFixture.name,
        logoUrl: fromFixture.logoUrl,
        hint: slot.kind === "seed" ? slot.code : "",
        waiting: false,
        phase: slot.kind === "seed" ? phaseOfSeed(slot.code) : summerPhaseById(SUMMER_ROUNDS[match.round].phase).id,
      };
    }
    if (slot.kind === "seed") {
      const entry = byCode.get(slot.code);
      return {
        name: entry?.name ?? slot.code,
        logoUrl: entry?.logoUrl ?? "",
        hint: slot.code,
        waiting: !entry,
        phase: phaseOfSeed(slot.code),
      };
    }
    const source = byId.get(slot.of);
    return {
      name: t(slot.kind === "winner" ? "pages.championship.summer.winner" : "pages.championship.summer.loser"),
      logoUrl: "",
      hint: source ? SUMMER_ROUNDS[source.round].name : "",
      waiting: true,
      phase: SUMMER_ROUNDS[source?.round ?? match.round].phase,
    };
  }

  const maxRow = Math.max(...SUMMER_MATCHES.map((match) => match.row));
  const width = PAD * 2 + SUMMER_ROUNDS.length * CARD_W + (SUMMER_ROUNDS.length - 1) * COL_GAP;
  const height = PAD * 2 + HEADER_H + (maxRow - MIN_ROW) * ROW_UNIT + CARD_H;
  const md = seriesLabel(seriesLength);
  const openMatch = openId ? byId.get(openId) ?? null : null;
  const openVisible = openMatch && matchRevealed(openMatch) ? openMatch : null;
  const openFixture = openVisible ? fixtureOf(openVisible) : null;

  function jump(phase: SummerPhaseId) {
    const board = boardRef.current;
    const round = SUMMER_ROUNDS.findIndex((item) => item.phase === phase);
    const node = board?.querySelector<HTMLElement>(`[data-round="${round}"]`);
    if (!board || !node) return;
    board.scrollTo({ left: Math.max(0, node.offsetLeft - 28), behavior: "smooth" });
  }

  function edge(match: SummerMatch, side: "a" | "b") {
    const slot = match[side];
    if (slot.kind === "seed") return null;
    const source = byId.get(slot.of);
    if (!source) return null;
    const from = cardOrigin(source);
    const to = slotAnchor(match, side);
    const x1 = from.x + CARD_W;
    const y1 = from.y + CARD_H / 2;
    const x2 = to.x;
    const y2 = to.y;
    const mid = (x1 + x2) / 2;
    const phase = summerPhaseById(SUMMER_ROUNDS[source.round].phase);
    return {
      id: `${match.id}-${side}`,
      d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`,
      color: phase.accent,
      dashed: slot.kind === "loser",
    };
  }

  const edges = SUMMER_MATCHES.flatMap((match) => [edge(match, "a"), edge(match, "b")].filter((item) => item != null));
  const bands = SUMMER_PHASES.map((phase) => {
    const indexes = SUMMER_ROUNDS.map((round, index) => (round.phase === phase.id ? index : -1)).filter((index) => index >= 0);
    const start = Math.min(...indexes);
    const end = Math.max(...indexes);
    return {
      phase,
      start,
      x: PAD + start * (CARD_W + COL_GAP) - 12,
      width: (end - start + 1) * CARD_W + (end - start) * COL_GAP + 24,
    };
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-amber-50">{t("pages.championship.summer.bracketTitle")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">{t("pages.championship.summer.bracketLead")}</p>
        </div>
        {md ? (
          <span className="rounded-md border border-amber-300/40 bg-amber-400/15 px-2 py-1 text-[11px] font-bold tracking-wider text-amber-100">
            {md}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("pages.championship.summer.jump")}>
        {SUMMER_PHASES.map((phase) => (
          <button
            key={phase.id}
            type="button"
            onClick={() => jump(phase.id)}
            className="rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
            style={{ borderColor: phase.accent, color: phase.ink, background: phase.wash }}
          >
            {t(`pages.championship.summer.phase.${phase.id}`)}
          </button>
        ))}
      </div>
      <div ref={boardRef} className="flow-space-board">
        <div className="flow-space-board__stars" />
        <div className="relative" style={{ width, height }}>
          {bands.map((band) => (
            <div
              key={band.phase.id}
              data-round={band.start}
              className="absolute top-3 bottom-3 rounded-2xl"
              style={{
                left: band.x,
                width: band.width,
                background: band.phase.wash,
                boxShadow: `inset 0 0 0 1px ${band.phase.accent}55`,
              }}
            />
          ))}
          <svg className="pointer-events-none absolute inset-0" width={width} height={height}>
            {edges.map((item) => (
              <path
                key={item.id}
                d={item.d}
                fill="none"
                stroke={item.color}
                strokeWidth={item.dashed ? 1.4 : 1.8}
                strokeDasharray={item.dashed ? "5 6" : undefined}
                strokeLinecap="round"
                opacity={0.85}
              />
            ))}
          </svg>
          {SUMMER_ROUNDS.map((round, index) => {
            const phase = summerPhaseById(round.phase);
            return (
              <p
                key={`${round.name}-${index}`}
                className="absolute text-center text-[11px] font-semibold tracking-[0.22em] uppercase"
                style={{
                  left: PAD + index * (CARD_W + COL_GAP),
                  top: PAD,
                  width: CARD_W,
                  color: phase.accent,
                }}
              >
                {round.name}
              </p>
            );
          })}
          {SUMMER_MATCHES.map((match) => {
            const origin = cardOrigin(match);
            const phase = summerPhaseById(SUMMER_ROUNDS[match.round].phase);
            const revealed = matchRevealed(match);
            const seatA = seatOf(match, "a", revealed);
            const seatB = seatOf(match, "b", revealed);
            const label = match.badge === "third" ? t("pages.championship.summer.third") : match.badge === "final" ? t("pages.championship.summer.final") : SUMMER_ROUNDS[match.round].name;
            const cardClass = cn(
              "h-full w-full overflow-hidden rounded-lg border bg-zinc-950/92 text-left shadow-[0_10px_24px_rgba(0,0,0,0.45)]",
              revealed && "transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
            );
            return (
              <div key={match.id} className="absolute" style={{ left: origin.x, top: origin.y, width: CARD_W, height: CARD_H }}>
                {match.badge ? (
                  <span
                    className="absolute -top-4 left-0 rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase"
                    style={{ background: phase.accent, color: "#1a0a0a" }}
                  >
                    {match.badge === "final" ? t("pages.championship.summer.final") : t("pages.championship.summer.third")}
                  </span>
                ) : null}
                {revealed ? (
                  <button type="button" onClick={() => setOpenId(match.id)} aria-label={label} className={cardClass} style={{ borderColor: `${phase.accent}99` }}>
                    <SeatLine seat={seatA} />
                    <SeatLine seat={seatB} />
                  </button>
                ) : (
                  <div className={cardClass} style={{ borderColor: `${phase.accent}99` }}>
                    <SeatLine seat={seatA} />
                    <SeatLine seat={seatB} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <MatchModal
        camp={camp}
        match={openVisible}
        fixture={openFixture}
        seatA={openVisible ? seatOf(openVisible, "a", true) : null}
        seatB={openVisible ? seatOf(openVisible, "b", true) : null}
        revealedAll={revealedAll}
        revealedIds={revealedIds}
        locale={locale}
        seriesLength={seriesLength}
        onClose={() => setOpenId(null)}
        onReveal={onReveal}
      />
    </section>
  );
}

function SeatLine({ seat }: { seat: Seat }) {
  const phase = summerPhaseById(seat.phase);
  return (
    <div className={cn("flex h-[34px] items-center gap-2 border-b border-white/5 px-2 last:border-b-0", seat.waiting && "bg-black/25")}>
      <span
        className={cn("h-5 w-5 shrink-0 overflow-hidden rounded-full border", seat.waiting && "border-dashed")}
        style={{ borderColor: phase.accent, background: seat.waiting ? "transparent" : phase.wash }}
      >
        {seat.logoUrl ? <PlayerAvatarMark src={seat.logoUrl} width={20} height={20} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color: seat.waiting ? "#e4e4e7" : phase.ink }}>
        {seat.name}
      </span>
      {seat.hint ? <span className="shrink-0 text-[9px] tracking-wide text-zinc-500 uppercase">{seat.hint}</span> : null}
    </div>
  );
}

function MatchModal({
  camp,
  match,
  fixture,
  seatA,
  seatB,
  revealedAll,
  revealedIds,
  locale,
  seriesLength,
  onClose,
  onReveal,
}: {
  camp: ChampionshipDetail;
  match: SummerMatch | null;
  fixture: ChampionshipFixture | null;
  seatA: Seat | null;
  seatB: Seat | null;
  revealedAll: boolean;
  revealedIds: string[];
  locale: Locale;
  seriesLength: number;
  onClose: () => void;
  onReveal: (fixtureId: string) => void;
}) {
  const { t } = useTranslation();
  if (!match || !seatA || !seatB) {
    return <ModalApp open={false} onClose={onClose} title="" />;
  }
  const roundName = match.badge === "third" ? t("pages.championship.summer.third") : match.badge === "final" ? t("pages.championship.summer.final") : SUMMER_ROUNDS[match.round].name;
  const revealed = Boolean(fixture && (revealedAll || revealedIds.includes(fixture.id) || fixture.status === "finished"));
  const when = fixture?.scheduledAt ? new Date(fixture.scheduledAt) : null;
  const whenLabel =
    when && !Number.isNaN(when.getTime())
      ? when.toLocaleString(locale === "en" ? "en-US" : "pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
      : t("pages.championship.summer.unscheduled");
  const md = seriesLabel(fixture?.seriesLength ?? seriesLength);

  return (
    <ModalApp open onClose={onClose} title={`${roundName}${md ? ` · ${md}` : ""}`} description={whenLabel}>
      <EpicMatchCard
        locale={locale}
        campLogoUrl={camp.logoUrl}
        playerA={{ name: seatA.name, logoUrl: seatA.logoUrl }}
        playerB={{ name: seatB.name, logoUrl: seatB.logoUrl }}
        scoreA={revealed && fixture ? fixture.scoreA : null}
        scoreB={revealed && fixture ? fixture.scoreB : null}
        mapName={fixture?.games[0]?.mapName ?? ""}
        godA={fixture?.games[0]?.godA ?? ""}
        godB={fixture?.games[0]?.godB ?? ""}
        winner={
          revealed && fixture && fixture.scoreA !== fixture.scoreB
            ? fixture.scoreA > fixture.scoreB
              ? "A"
              : "B"
            : null
        }
        whenLabel={whenLabel}
        roundLabel={roundName}
        links={revealed && fixture ? fixture.links : []}
        revealed={revealed}
        revealLabel={t("pages.championship.revealThis")}
        victoryLabel={(name) => t("pages.championship.victory", { name })}
        watchLabel={t("pages.championship.watch")}
        onReveal={fixture && !revealed && (fixture.scoreA > 0 || fixture.scoreB > 0 || fixture.games.length > 0) ? () => onReveal(fixture.id) : undefined}
      />
    </ModalApp>
  );
}
