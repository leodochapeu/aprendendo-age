import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { RacePlayerMiniCard } from "@/components/jogadores/RacePlayerMiniCard";
import { RacePlayerPopover } from "@/components/jogadores/RacePlayerPopover";
import { getFormRankPortraitPath, MolduraAgeAvatar } from "@/components/rank/rankProfileUi";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { playerDisplayLabel } from "@/lib/playersApi";
import { computeRaceTrackLayout, RACE_AVATAR_RENDER_PX, RACE_AVATAR_RENDER_PX_LG, RACE_TRACK_LANE_CLASS, } from "@/lib/raceTrackLayout";
import { getRankGuideTiers } from "@/lib/rankGuideTiers";
import { getRankClassification, TIER_ACHIEVEMENT_THEME, } from "@/lib/rankClassification";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
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
function useRandomHopPlayerIds(playerIds, intervalMs = 2800) {
    const [hoppingIds, setHoppingIds] = useState(new Set());
    useEffect(() => {
        if (playerIds.length === 0)
            return;
        let timeoutId;
        const schedule = () => {
            const delay = intervalMs + Math.random() * 1200 - 600;
            timeoutId = setTimeout(() => {
                const count = playerIds.length <= 3 ? 1 : Math.random() < 0.35 ? 2 : 1;
                const picked = new Set();
                while (picked.size < count && picked.size < playerIds.length) {
                    picked.add(playerIds[Math.floor(Math.random() * playerIds.length)]);
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
function RaceAvatar({ player, hopping, selected, onSelect, }) {
    const { t } = useTranslation();
    const cls = getRankClassification(player.rr);
    const label = playerDisplayLabel(player);
    return (_jsxs("div", { className: "pointer-events-auto absolute", style: {
            bottom: `${player.bottomPercent}%`,
            left: "50%",
            transform: "translateY(50%)",
            zIndex: selected ? 25 : player.zIndex,
        }, children: [_jsxs("div", { className: "relative h-0 w-0", children: [_jsx("button", { type: "button", "aria-expanded": selected, "aria-label": t("pages.players.raceAvatarOpen", { name: label }), onClick: (e) => onSelect(player, e.currentTarget), className: cn("race-avatar-hop absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 touch-manipulation rounded-full bg-transparent p-0 transition", "h-20 w-20 sm:h-24 sm:w-24 lg:h-[8.25rem] lg:w-[8.25rem]", "cursor-pointer overflow-visible", "hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950", selected && "ring-2 ring-amber-300/70 ring-offset-2 ring-offset-zinc-950", hopping && "is-hopping"), children: _jsx(MolduraAgeAvatar, { tierId: cls.tierId, ageToken: cls.ageToken, frameImageSrc: getFormRankPortraitPath(cls.tierId), portraitUrl: player.logoPath, size: "compact", emptyFallback: _jsx(PlayerAvatarMark, { src: "", tierId: cls.tierId, className: "rounded-full" }) }) }), _jsx(RacePlayerMiniCard, { player: player, className: "absolute top-0 left-[2.85rem] z-[15] -translate-y-1/2 sm:left-[3.4rem] lg:left-[4.7rem]" })] }), _jsx("span", { className: "sr-only", children: t("pages.players.racePlayerRr", { name: label, rr: player.rr }) })] }));
}
const TIER_GATE_COLOR = {
    bronze: "#d97706",
    prata: "#d4d4d8",
    ouro: "#fbbf24",
    esmeralda: "#34d399",
    diamante: "#38bdf8",
};
const GATE_CLEARANCE_PX = 76;
const GATE_CLEARANCE_PX_LG = 112;
function hexWithAlpha(hex, alpha) {
    const clamped = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
        .toString(16)
        .padStart(2, "0");
    return `${hex}${clamped}`;
}
function RaceTierJump({ tiers, activeTier, onJump, onOverview, }) {
    const { t } = useTranslation();
    return (_jsxs("nav", { "aria-label": t("pages.players.raceJumpLabel"), className: "mb-6 flex flex-wrap justify-center gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-950/90 px-3 py-3 shadow-lg shadow-black/40", children: [_jsx("button", { type: "button", "aria-pressed": activeTier === null, onClick: onOverview, className: cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition", activeTier === null
                    ? "border-amber-500/55 bg-amber-950/35 text-amber-100 ring-1 ring-amber-500/25"
                    : "border-aom-border/60 bg-zinc-900/80 text-zinc-300 hover:border-amber-500/40 hover:text-amber-100"), children: t("pages.players.tierFilterAll") }), tiers.map((tier) => {
                const tierId = tier.id;
                const active = activeTier === tierId;
                return (_jsxs("button", { type: "button", "aria-pressed": active, onClick: () => onJump(tierId), className: cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition", active
                        ? "border-amber-500/55 bg-amber-950/35 text-amber-100 ring-1 ring-amber-500/25"
                        : "border-aom-border/60 bg-zinc-900/80 text-zinc-300 hover:border-amber-500/40 hover:text-amber-100"), children: [_jsx("img", { src: getFormRankPortraitPath(tierId), alt: "", className: "h-[1.125rem] w-[1.125rem] shrink-0 object-contain opacity-95 sm:h-5 sm:w-5", width: 20, height: 20 }), _jsx("span", { children: tier.rankName })] }, tier.id));
            })] }));
}
function RaceTierGate({ marker, tier, arrived, delayMs, }) {
    const color = TIER_GATE_COLOR[marker.tierId];
    const theme = TIER_ACHIEVEMENT_THEME[marker.tierId];
    const iconSrc = getTokenAssetUrl(tier.token);
    const portraitSrc = getFormRankPortraitPath(marker.tierId);
    return (_jsxs("div", { id: `race-gate-${marker.tierId}`, "data-race-gate": marker.tierId, className: cn("race-gate pointer-events-none absolute inset-x-0 z-20 translate-y-1/2", arrived && "is-arrived"), style: {
            bottom: `${marker.percent}%`,
            ["--race-gate"]: color,
        }, children: [_jsx("div", { className: "pointer-events-none absolute inset-x-[6%] top-1/2 h-16 -translate-y-1/2 rounded-full blur-2xl sm:h-20", style: { background: color, opacity: 0.28 }, "aria-hidden": true }), _jsx("div", { className: "race-gate-beam pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2", style: { animationDelay: `${delayMs}ms` }, "aria-hidden": true }), _jsxs("div", { className: "relative grid grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] items-center gap-1.5 px-1 sm:grid-cols-[minmax(0,1fr)_4.75rem_minmax(0,1fr)] sm:gap-3 sm:px-2 lg:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1fr)] lg:gap-6", children: [_jsxs("article", { className: cn("relative h-[6.5rem] w-full max-w-[11rem] justify-self-start overflow-hidden rounded-2xl border px-2.5 py-2 shadow-lg sm:h-[8.5rem] sm:max-w-[16rem] sm:rounded-3xl sm:px-4 sm:py-3 lg:h-[11.25rem] lg:max-w-[22rem] lg:px-5", theme.surfaceClass), style: {
                            borderColor: hexWithAlpha(color, 0.55),
                            boxShadow: `0 0 28px ${hexWithAlpha(color, 0.28)}, 0 16px 40px rgba(0,0,0,0.45)`,
                        }, children: [_jsx("span", { className: "race-gate-sheen pointer-events-none absolute inset-y-0 w-1/2", style: { animationDelay: `${delayMs}ms` }, "aria-hidden": true }), _jsxs("div", { className: "relative flex h-full flex-col items-center justify-center text-center", children: [iconSrc ? (_jsx("img", { src: iconSrc, alt: "", className: "h-10 w-10 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16", style: { filter: `drop-shadow(0 0 10px ${color})` }, width: 64, height: 64 })) : null, _jsx("p", { className: cn("mt-1 font-[family-name:var(--font-display)] text-sm font-semibold leading-none sm:mt-2 sm:text-lg lg:text-2xl", tier.titleClass), children: tier.rankName }), _jsx("p", { className: "mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-400 sm:text-[11px]", children: tier.eraName }), _jsx("p", { className: cn("mt-0.5 font-mono text-[10px] sm:text-xs", theme.stepAccent), children: tier.rrBand })] })] }), _jsxs("div", { className: "relative mx-auto flex h-12 w-12 items-center justify-center sm:h-[4.75rem] sm:w-[4.75rem] lg:h-24 lg:w-24", "aria-hidden": true, children: [_jsx("span", { className: "race-gate-ring absolute inset-0 rounded-full border-2", style: { animationDelay: `${delayMs}ms` } }), _jsx("span", { className: "race-gate-ring absolute inset-1 rounded-full border", style: { animationDelay: `${delayMs + 700}ms` } }), _jsx("span", { className: "absolute inset-1.5 rounded-full border bg-zinc-950/90 sm:inset-2", style: { borderColor: color, boxShadow: `inset 0 0 16px ${hexWithAlpha(color, 0.45)}` } }), _jsx("img", { src: portraitSrc, alt: "", className: "relative h-7 w-7 object-contain sm:h-10 sm:w-10 lg:h-14 lg:w-14" })] }), _jsxs("article", { className: cn("relative h-[6.5rem] w-full max-w-[11rem] justify-self-end overflow-hidden rounded-2xl border px-2 py-2 text-center shadow-lg sm:h-[8.5rem] sm:max-w-[16rem] sm:rounded-3xl sm:px-4 lg:h-[11.25rem] lg:max-w-[22rem]", theme.surfaceClass), style: {
                            borderColor: hexWithAlpha(color, 0.55),
                            boxShadow: `0 0 28px ${hexWithAlpha(color, 0.28)}, 0 16px 40px rgba(0,0,0,0.45)`,
                        }, children: [_jsx("span", { className: "race-gate-sheen pointer-events-none absolute inset-y-0 w-1/2", style: { animationDelay: `${delayMs + 400}ms` }, "aria-hidden": true }), _jsxs("div", { className: "relative flex h-full flex-col items-center justify-center", children: [_jsx("p", { className: "text-[9px] font-semibold uppercase tracking-[0.28em] text-zinc-400 sm:text-[11px]", children: "RR" }), _jsx("p", { className: "font-[family-name:var(--font-display)] text-3xl font-semibold leading-none tabular-nums sm:text-5xl lg:text-7xl", style: { color, textShadow: `0 0 18px ${hexWithAlpha(color, 0.75)}` }, children: marker.rrStart }), _jsx("p", { className: cn("mt-1 text-[10px] uppercase tracking-[0.14em] sm:text-xs", theme.stepAccent), children: tier.eraName })] })] })] })] }));
}
export function CorridaAomTab({ players }) {
    const { t } = useTranslation();
    const tiers = useMemo(() => getRankGuideTiers(t), [t]);
    const isLg = useMinWidthLg();
    const layout = useMemo(() => computeRaceTrackLayout(players, {
        avatarRenderPx: isLg ? RACE_AVATAR_RENDER_PX_LG : RACE_AVATAR_RENDER_PX,
        gateClearancePx: isLg ? GATE_CLEARANCE_PX_LG : GATE_CLEARANCE_PX,
    }), [players, isLg]);
    const trackMinHeight = layout.containerMinHeightPx;
    const placed = useMemo(() => {
        const byId = new Map(players.map((p) => [p.id, p]));
        return layout.avatars
            .map((slot) => {
            const player = byId.get(slot.id);
            if (!player)
                return null;
            return {
                ...player,
                bottomPercent: slot.bottomPercent,
                zIndex: slot.zIndex,
            };
        })
            .filter((p) => p != null);
    }, [players, layout]);
    const hoppingIds = useRandomHopPlayerIds(placed.map((p) => p.id));
    const [popover, setPopover] = useState(null);
    const [activeTier, setActiveTier] = useState(null);
    const [arrivedTier, setArrivedTier] = useState(null);
    const trackRef = useRef(null);
    useEffect(() => {
        const root = trackRef.current;
        if (!root)
            return;
        const nodes = [...root.querySelectorAll("[data-race-gate]")];
        if (nodes.length === 0)
            return;
        const observer = new IntersectionObserver((entries) => {
            const hit = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!hit)
                return;
            const id = hit.target.getAttribute("data-race-gate");
            if (id === "bronze" || id === "prata" || id === "ouro" || id === "esmeralda" || id === "diamante") {
                setActiveTier(id);
            }
        }, { root: null, rootMargin: "-32% 0px -38% 0px", threshold: [0.35, 0.6, 0.85] });
        for (const node of nodes)
            observer.observe(node);
        return () => observer.disconnect();
    }, [layout.markers]);
    useEffect(() => {
        if (!arrivedTier)
            return;
        const timeoutId = window.setTimeout(() => setArrivedTier(null), 1200);
        return () => window.clearTimeout(timeoutId);
    }, [arrivedTier]);
    const scrollToTier = (tierId) => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setActiveTier(tierId);
        setArrivedTier(null);
        document.getElementById(`race-gate-${tierId}`)?.scrollIntoView({
            behavior: reduce ? "auto" : "smooth",
            block: "center",
        });
        window.requestAnimationFrame(() => setArrivedTier(tierId));
    };
    const scrollToOverview = () => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setActiveTier(null);
        setArrivedTier(null);
        trackRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    };
    const handleAvatarSelect = (player, anchor) => {
        setPopover((prev) => (prev?.player.id === player.id ? null : { player, anchor }));
    };
    if (players.length === 0) {
        return (_jsx("p", { className: "rounded-2xl border border-aom-border/60 bg-zinc-950/50 px-4 py-10 text-center text-sm text-zinc-500", children: t("pages.players.raceEmpty") }));
    }
    return (_jsxs("div", { className: "relative z-0 mx-auto w-full", children: [_jsx("p", { className: "mb-4 text-center text-sm text-zinc-400 sm:mb-5", children: t("pages.players.raceDesc") }), _jsx(RaceTierJump, { tiers: tiers, activeTier: activeTier, onJump: scrollToTier, onOverview: scrollToOverview }), _jsxs("div", { ref: trackRef, className: "relative mx-auto w-full scroll-mt-28 overflow-visible", style: { minHeight: `${trackMinHeight}px` }, children: [_jsxs("div", { className: cn(RACE_TRACK_LANE_CLASS), children: [layout.markers.map((marker, index) => {
                                const next = layout.markers[index + 1]?.percent ?? 100;
                                const color = TIER_GATE_COLOR[marker.tierId];
                                return (_jsxs("div", { className: "pointer-events-none absolute inset-x-0", style: { bottom: `${marker.percent}%`, height: `${next - marker.percent}%` }, "aria-hidden": true, children: [_jsx("div", { className: "absolute inset-0", style: {
                                                background: `linear-gradient(90deg, ${hexWithAlpha(color, 0.2)} 0%, transparent 34%, transparent 66%, ${hexWithAlpha(color, 0.2)} 100%)`,
                                            } }), _jsx("div", { className: "absolute bottom-0 left-1/2 top-0 w-1 -translate-x-1/2 rounded-full", style: {
                                                background: `linear-gradient(to top, ${color}, ${hexWithAlpha(color, 0.25)})`,
                                                boxShadow: `0 0 16px ${hexWithAlpha(color, 0.65)}`,
                                            } })] }, `${marker.tierId}-session`));
                            }), _jsx("div", { className: "pointer-events-none absolute inset-y-0 left-1/2 w-14 -translate-x-1/2 rounded-full border border-dashed border-zinc-700/35 sm:w-20 lg:w-28", "aria-hidden": true }), layout.markers.map((marker, index) => {
                                const tier = tiers.find((item) => item.id === marker.tierId);
                                if (!tier)
                                    return null;
                                return (_jsx(RaceTierGate, { marker: marker, tier: tier, arrived: arrivedTier === marker.tierId, delayMs: index * 280 }, marker.tierId));
                            }), _jsx("div", { className: "pointer-events-none absolute inset-0 z-10 overflow-visible", children: placed.map((player) => (_jsx(RaceAvatar, { player: player, hopping: hoppingIds.has(player.id), selected: popover?.player.id === player.id, onSelect: handleAvatarSelect }, player.id))) })] }), popover ? (_jsx(RacePlayerPopover, { player: popover.player, anchorEl: popover.anchor, onClose: () => setPopover(null) })) : null] }), _jsx("p", { className: "mt-2 text-center text-xs text-zinc-600", children: t("pages.players.raceSnapshotHint") })] }));
}
