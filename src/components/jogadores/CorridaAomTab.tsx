import { useEffect, useMemo, useState } from "react";

import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { RacePlayerMiniCard } from "@/components/jogadores/RacePlayerMiniCard";
import { RacePlayerPopover } from "@/components/jogadores/RacePlayerPopover";
import { getFormRankPortraitPath, MolduraAgeAvatar } from "@/components/rank/rankProfileUi";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { type AomRacePlayer, playerDisplayLabel } from "@/lib/playersApi";
import {
  computeRaceTrackLayout,
  RACE_AVATAR_RENDER_PX,
  RACE_AVATAR_RENDER_PX_LG,
  RACE_TRACK_LANE_CLASS,
} from "@/lib/raceTrackLayout";
import { getRankGuideTiers } from "@/lib/rankGuideTiers";
import { getRankClassification, TIER_ACHIEVEMENT_THEME } from "@/lib/rankClassification";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";

type PlacedPlayer = AomRacePlayer & {
  bottomPercent: number;
  zIndex: number;
};

function useMinWidthLg() {
  const [lg, setLg] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return lg;
}

function useRandomHopPlayerIds(playerIds: string[], intervalMs = 2800) {
  const [hoppingIds, setHoppingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (playerIds.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = intervalMs + Math.random() * 1200 - 600;
      timeoutId = setTimeout(() => {
        const count = playerIds.length <= 3 ? 1 : Math.random() < 0.35 ? 2 : 1;
        const picked = new Set<string>();
        while (picked.size < count && picked.size < playerIds.length) {
          picked.add(playerIds[Math.floor(Math.random() * playerIds.length)]!);
        }
        setHoppingIds(picked);
        setTimeout(() => setHoppingIds(new Set()), 650);
        schedule();
      }, delay);
    };

    schedule();
    return () => clearTimeout(timeoutId);
  }, [intervalMs, playerIds]);

  return hoppingIds;
}

function RaceAvatar({
  player,
  hopping,
  selected,
  onSelect,
}: {
  player: PlacedPlayer;
  hopping: boolean;
  selected: boolean;
  onSelect: (player: PlacedPlayer, anchor: HTMLElement) => void;
}) {
  const { t } = useTranslation();
  const cls = getRankClassification(player.rr);
  const label = playerDisplayLabel(player);

  return (
    <div
      className="pointer-events-auto absolute"
      style={{
        bottom: `${player.bottomPercent}%`,
        left: "50%",
        transform: "translateY(50%)",
        zIndex: selected ? 25 : player.zIndex,
      }}
    >
      <div className="relative h-0 w-0">
        <button
          type="button"
          aria-expanded={selected}
          aria-label={t("pages.players.raceAvatarOpen", { name: label })}
          onClick={(e) => onSelect(player, e.currentTarget)}
          className={cn(
            "race-avatar-hop absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 touch-manipulation rounded-full bg-transparent p-0 transition",
            "h-14 w-14 sm:h-16 sm:w-16 lg:h-[5.5rem] lg:w-[5.5rem]",
            "cursor-pointer overflow-visible",
            "hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
            selected && "ring-2 ring-amber-300/70 ring-offset-2 ring-offset-zinc-950",
            hopping && "is-hopping",
          )}
        >
          <MolduraAgeAvatar
            tierId={cls.tierId}
            ageToken={cls.ageToken}
            frameImageSrc={getFormRankPortraitPath(cls.tierId)}
            portraitUrl={player.logoPath}
            size="compact"
            emptyFallback={<PlayerAvatarMark src="" tierId={cls.tierId} className="rounded-full" />}
          />
        </button>

        <RacePlayerMiniCard
          player={player}
          className="absolute top-0 left-[2rem] z-[15] -translate-y-1/2 sm:left-[2.35rem] lg:left-[3.75rem]"
        />
      </div>
      <span className="sr-only">
        {t("pages.players.racePlayerRr", { name: label, rr: player.rr })}
      </span>
    </div>
  );
}

export function CorridaAomTab({ players }: { players: AomRacePlayer[] }) {
  const { t } = useTranslation();
  const tiers = useMemo(() => getRankGuideTiers(t), [t]);
  const isLg = useMinWidthLg();

  const layout = useMemo(
    () =>
      computeRaceTrackLayout(players, {
        avatarRenderPx: isLg ? RACE_AVATAR_RENDER_PX_LG : RACE_AVATAR_RENDER_PX,
      }),
    [players, isLg],
  );
  const trackMinHeight = layout.containerMinHeightPx;

  const placed = useMemo(() => {
    const byId = new Map(players.map((p) => [p.id, p]));

    return layout.avatars
      .map((slot) => {
        const player = byId.get(slot.id);
        if (!player) return null;
        return {
          ...player,
          bottomPercent: slot.bottomPercent,
          zIndex: slot.zIndex,
        };
      })
      .filter((p): p is PlacedPlayer => p != null);
  }, [players, layout]);

  const hoppingIds = useRandomHopPlayerIds(placed.map((p) => p.id));

  const [popover, setPopover] = useState<{ player: PlacedPlayer; anchor: HTMLElement } | null>(null);

  const handleAvatarSelect = (player: PlacedPlayer, anchor: HTMLElement) => {
    setPopover((prev) => (prev?.player.id === player.id ? null : { player, anchor }));
  };

  if (players.length === 0) {
    return (
      <p className="rounded-2xl border border-aom-border/60 bg-zinc-950/50 px-4 py-10 text-center text-sm text-zinc-500">
        {t("pages.players.raceEmpty")}
      </p>
    );
  }

  return (
    <div className="relative z-0 mx-auto w-full max-w-2xl lg:max-w-5xl">
      <p className="mb-6 text-center text-sm text-zinc-400 sm:mb-8">{t("pages.players.raceDesc")}</p>

      <div
        className="relative mx-auto w-full max-w-md overflow-visible px-4 pb-8 pt-4 sm:px-8 sm:pt-6 lg:max-w-3xl lg:px-12 lg:pb-10 lg:pt-8"
        style={{ minHeight: `${trackMinHeight}px` }}
      >
        <div className={cn(RACE_TRACK_LANE_CLASS)}>
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full lg:w-1"
            aria-hidden
            style={{
              background:
                "repeating-linear-gradient(to top, rgba(250,204,21,0.35) 0 12px, rgba(39,39,42,0.9) 12px 24px)",
              boxShadow: "0 0 20px rgba(250,204,21,0.15)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 w-16 -translate-x-1/2 rounded-full border border-dashed border-zinc-700/40 lg:w-28"
            aria-hidden
          />

          {layout.markers.map((marker) => {
            const tier = tiers.find((x) => x.id === marker.tierId);
            if (!tier) return null;
            const iconSrc = getTokenAssetUrl(tier.token);
            const theme = TIER_ACHIEVEMENT_THEME[marker.tierId];

            return (
              <div
                key={marker.tierId}
                className="pointer-events-none absolute left-0 right-0 z-20"
                style={{ bottom: `${marker.percent}%`, transform: "translateY(0)" }}
              >
                <div className="relative flex items-end pb-0">
                  <div
                    className={cn(
                      "flex w-[7.5rem] shrink-0 flex-col items-center rounded-2xl border border-aom-border/50 bg-zinc-950/90 px-2 py-2.5 shadow-lg sm:w-[8.25rem] sm:px-2.5 lg:w-44 lg:rounded-2xl lg:px-3.5 lg:py-3.5",
                      theme.surfaceClass,
                    )}
                  >
                    {iconSrc ? (
                      <img
                        src={iconSrc}
                        alt=""
                        className="h-9 w-9 object-contain sm:h-10 sm:w-10 lg:h-14 lg:w-14"
                        width={56}
                        height={56}
                      />
                    ) : null}
                    <p
                      className={cn(
                        "mt-1.5 text-center font-[family-name:var(--font-display)] text-[11px] font-semibold leading-tight sm:text-xs lg:mt-2 lg:text-sm",
                        tier.titleClass,
                      )}
                    >
                      {tier.rankName}
                      <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-zinc-400 lg:text-[10px]">
                        {tier.eraName}
                      </span>
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] text-zinc-500 lg:text-[11px]">{tier.rrBand}</p>
                  </div>

                  <div className="absolute bottom-0 left-[7.5rem] right-0 flex items-center gap-2 sm:left-[8.25rem] lg:left-44 lg:gap-3">
                    <div
                      className="h-px min-w-0 flex-1 bg-gradient-to-r from-amber-500/40 to-transparent"
                      aria-hidden
                    />
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-zinc-950 text-[10px] font-bold tabular-nums shadow-md sm:h-9 sm:w-9 lg:h-12 lg:w-12 lg:text-sm",
                        theme.stepRing,
                        theme.stepAccent,
                      )}
                      aria-hidden
                    >
                      {marker.rrStart}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
            {placed.map((player) => (
              <RaceAvatar
                key={player.id}
                player={player}
                hopping={hoppingIds.has(player.id)}
                selected={popover?.player.id === player.id}
                onSelect={handleAvatarSelect}
              />
            ))}
          </div>
        </div>

        {popover ? (
          <RacePlayerPopover
            player={popover.player}
            anchorEl={popover.anchor}
            onClose={() => setPopover(null)}
          />
        ) : null}
      </div>

      <p className="mt-2 text-center text-xs text-zinc-600">{t("pages.players.raceSnapshotHint")}</p>
    </div>
  );
}
