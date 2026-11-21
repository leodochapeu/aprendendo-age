import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { PlayerStreamBadges } from "@/components/jogadores/PlayerStreamBadges";
import { RacePlayerCard } from "@/components/jogadores/RacePlayerCard";
import { getFormRankPortraitPath, MolduraAgeAvatar } from "@/components/rank/rankProfileUi";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { playerClanLogoUrl } from "@/lib/playersApi";
import { getRankClassification } from "@/lib/rankClassification";
import { resolvePlayerAvatarSrc } from "@/lib/steamAvatarUrl";
const HOLD_MS = 6200;
const EXIT_MS = 500;
function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduced(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);
    return reduced;
}
function byRating(players, stats) {
    return [...players].sort((a, b) => {
        const left = stats.get(a.profileId)?.rr;
        const right = stats.get(b.profileId)?.rr;
        if (left != null && right != null && left !== right)
            return right - left;
        if (left != null)
            return -1;
        if (right != null)
            return 1;
        return a.name.localeCompare(b.name, "pt");
    });
}
export function RosterPresentation({ players, stats, showWeightedRr = false, }) {
    const { t } = useTranslation();
    const reduced = useReducedMotion();
    const byId = useMemo(() => new Map(stats.map((player) => [player.id, player])), [stats]);
    const slides = useMemo(() => byRating(players, byId), [players, byId]);
    const orderKey = slides.map((player) => player.id).join("|");
    const [orderSeen, setOrderSeen] = useState(orderKey);
    const [cursor, setCursor] = useState(0);
    const [visible, setVisible] = useState(true);
    const [paused, setPaused] = useState(false);
    const traveling = useRef(false);
    const exitTimer = useRef(null);
    if (orderSeen !== orderKey) {
        setOrderSeen(orderKey);
        setCursor(0);
        setVisible(true);
        traveling.current = false;
    }
    const travel = useCallback((dir) => {
        if (slides.length < 2 || traveling.current)
            return;
        if (reduced) {
            setCursor((current) => (current + dir + slides.length) % slides.length);
            return;
        }
        traveling.current = true;
        setVisible(false);
        if (exitTimer.current)
            window.clearTimeout(exitTimer.current);
        exitTimer.current = window.setTimeout(() => {
            setCursor((current) => (current + dir + slides.length) % slides.length);
            setVisible(true);
            traveling.current = false;
        }, EXIT_MS);
    }, [reduced, slides.length]);
    useEffect(() => {
        if (paused || reduced || !visible || slides.length < 2)
            return;
        const id = window.setTimeout(() => travel(1), HOLD_MS);
        return () => window.clearTimeout(id);
    }, [paused, reduced, visible, slides.length, cursor, travel]);
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "ArrowRight")
                travel(1);
            if (event.key === "ArrowLeft")
                travel(-1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [travel]);
    useEffect(() => () => {
        if (exitTimer.current)
            window.clearTimeout(exitTimer.current);
    }, []);
    if (slides.length === 0)
        return null;
    const player = slides[Math.min(cursor, slides.length - 1)];
    const ranked = byId.get(player.profileId) ?? null;
    const cls = ranked ? getRankClassification(ranked.rr) : null;
    const portrait = resolvePlayerAvatarSrc(ranked?.logoPath || player.logoUrl);
    const clanMark = ranked ? playerClanLogoUrl(ranked) : undefined;
    return (_jsxs("div", { className: "mx-auto max-w-xl", onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "epic-gold-glow", "aria-hidden": true }), _jsxs("div", { className: cn("relative min-h-[26rem] overflow-hidden rounded-3xl border border-amber-200/20 bg-black/50 shadow-lg shadow-black/40", visible ? "roster-slide-in" : "roster-slide-out"), children: [_jsxs("div", { className: "epic-wind", "aria-hidden": true, children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }), clanMark ? (_jsx("div", { className: "roster-clan-mark", "aria-hidden": true, children: _jsx("img", { src: clanMark, alt: "", draggable: false }) })) : null, _jsxs("div", { className: "relative z-[3] flex flex-col items-center px-4 pb-8 pt-10 sm:px-8", children: [ranked ? _jsx(PlayerStreamBadges, { streams: ranked.streams }) : null, _jsx("div", { className: cn("race-avatar-hop", visible && "is-hopping"), children: cls ? (_jsx(MolduraAgeAvatar, { tierId: cls.tierId, ageToken: cls.ageToken, frameImageSrc: getFormRankPortraitPath(cls.tierId), portraitUrl: portrait, size: "hero", emptyFallback: _jsx(PlayerAvatarMark, { src: "", tierId: cls.tierId, className: "rounded-full" }) })) : (_jsx("div", { className: "relative h-36 w-36 overflow-hidden rounded-full border-2 border-amber-200/70 bg-zinc-950 shadow-[0_0_28px_rgba(255,196,70,0.4)] sm:h-44 sm:w-44", children: _jsx(PlayerAvatarMark, { src: portrait, className: "rounded-full" }) })) }), ranked ? (_jsx("div", { className: "roster-card-in relative z-20 mt-2", children: _jsx(RacePlayerCard, { player: { ...ranked, logoPath: portrait }, labelOverride: player.name, showFlag: true, showWeightedRr: showWeightedRr, className: "shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]" }) })) : (_jsx("p", { className: "roster-card-in mt-6 text-center font-[family-name:var(--font-display)] text-3xl text-amber-50", children: player.name }))] })] }, player.id)] }), _jsxs("div", { className: "mt-4 flex items-center justify-center gap-3", children: [_jsx("button", { type: "button", onClick: () => travel(-1), disabled: slides.length < 2, "aria-label": t("pages.championship.rosterPrev"), className: "inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-40", children: "\u2039" }), _jsxs("p", { className: "min-w-16 text-center text-sm tabular-nums text-amber-100/80", "aria-live": "polite", children: [Math.min(cursor, slides.length - 1) + 1, " / ", slides.length] }), _jsx("button", { type: "button", onClick: () => travel(1), disabled: slides.length < 2, "aria-label": t("pages.championship.rosterNext"), className: "inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 text-amber-100 transition hover:bg-amber-400/10 disabled:opacity-40", children: "\u203A" })] }), slides.length > 1 && !reduced ? (_jsx("div", { className: "mx-auto mt-3 h-0.5 max-w-xs overflow-hidden rounded-full bg-white/10", children: visible && !paused ? _jsx("div", { className: "roster-progress h-full bg-amber-200/80", style: { animationDuration: `${HOLD_MS}ms` } }, cursor) : null })) : null] }));
}
