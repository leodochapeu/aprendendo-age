import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { CLAN_INSIGNIA_ORDER, GodInsignias } from "@/components/gods/GodInsigniaBadges";
import { useTranslation } from "@/hooks/useTranslation";
import { computeClanGodInsigniaMap, formatClanPlayRate } from "@/lib/clanGodsApi";
import { cn } from "@/lib/cn";
import { getGodPortraitUrlBySlug } from "@/lib/godIconFromName";
function clanInsigniaLabelKey(id) {
    switch (id) {
        case "mostPlayed":
            return "pages.clans.detail.godsInsigniaMostPlayed";
        case "favorite":
            return "pages.clans.detail.godsInsigniaFavorite";
        case "undefeated":
            return "pages.clans.detail.godsInsigniaUndefeated";
        case "highlight":
            return "pages.clans.detail.godsInsigniaHighlight";
    }
}
function clanInsigniaHintKey(id) {
    switch (id) {
        case "mostPlayed":
            return "pages.clans.detail.godsInsigniaMostPlayedHint";
        case "favorite":
            return "pages.clans.detail.godsInsigniaFavoriteHint";
        case "undefeated":
            return "pages.clans.detail.godsInsigniaUndefeatedHint";
        case "highlight":
            return "pages.clans.detail.godsInsigniaHighlightHint";
    }
}
function GodPortrait({ slug, muted }) {
    const src = getGodPortraitUrlBySlug(slug);
    return (_jsx("div", { className: cn("relative mx-auto flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-zinc-950/80 shadow-inner sm:h-24 sm:w-24", muted ? "border-zinc-700/60 opacity-50" : "border-zinc-600/50"), children: src ? (_jsx("img", { src: src, alt: "", className: "h-full w-full object-cover", width: 96, height: 96 })) : (_jsx("span", { className: "text-xs text-zinc-600", children: "?" })) }));
}
function ClanGodCard({ god, theme, compact, insignias, t, }) {
    const muted = !god.hasData;
    return (_jsxs("article", { className: cn("relative flex flex-col items-center rounded-2xl border bg-zinc-950/55 text-center shadow-lg shadow-black/30 backdrop-blur-sm", theme.accentBorder, compact ? "px-3 py-4" : "px-4 py-5 sm:px-5 sm:py-6", muted && "opacity-70"), children: [!muted ? (_jsx(GodInsignias, { insignias: insignias, order: CLAN_INSIGNIA_ORDER, labelKey: clanInsigniaLabelKey, hintKey: clanInsigniaHintKey, t: t })) : null, _jsx(GodPortrait, { slug: god.slug, muted: muted }), _jsx("h3", { className: cn("mt-3 font-[family-name:var(--font-display)] font-semibold text-zinc-100", compact ? "text-sm" : "text-base sm:text-lg"), children: god.label }), muted ? (_jsx("p", { className: "mt-2 text-xs text-zinc-500", children: t("pages.clans.detail.godsNoGames") })) : (_jsxs("div", { className: cn("mt-4 grid w-full grid-cols-2 gap-2", !compact && "sm:grid-cols-3"), children: [_jsxs("div", { className: cn("rounded-xl border px-2 py-2", theme.statSurface), children: [_jsx("p", { className: "text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-500", children: t("pages.clans.detail.godsStatPlayers") }), _jsx("p", { className: cn("mt-1 text-sm font-bold tabular-nums", theme.accentText), children: god.playerCount })] }), _jsxs("div", { className: cn("rounded-xl border px-2 py-2", theme.statSurface), children: [_jsx("p", { className: "text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-500", children: t("pages.clans.detail.godsStatGames") }), _jsx("p", { className: "mt-1 text-sm font-bold tabular-nums text-zinc-100", children: god.totalGames })] }), _jsxs("div", { className: cn("rounded-xl border px-2 py-2", theme.statSurface), children: [_jsx("p", { className: "text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-500", children: t("pages.clans.detail.godsStatWr") }), _jsx("p", { className: "mt-1 text-sm font-bold tabular-nums text-zinc-100", children: god.avgWinRate })] }), _jsxs("div", { className: cn("rounded-xl border px-2 py-2", theme.statSurface), children: [_jsx("p", { className: "text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-500", children: "RR" }), _jsx("p", { className: cn("mt-1 text-sm font-bold tabular-nums", theme.accentText), children: god.avgElo ?? "—" })] }), _jsxs("div", { className: cn("col-span-2 rounded-xl border px-2 py-2 sm:col-span-1", theme.statSurface), children: [_jsx("p", { className: "text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-500", children: t("pages.clans.detail.godsStatClanShare") }), _jsx("p", { className: "mt-1 text-sm font-bold tabular-nums text-zinc-100", children: formatClanPlayRate(god.clanPlayRate) })] })] }))] }));
}
function GodsIcon({ className }) {
    return (_jsxs("svg", { viewBox: "0 0 24 24", className: cn("h-5 w-5", className), fill: "none", stroke: "currentColor", strokeWidth: "1.75", "aria-hidden": true, children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6", strokeLinecap: "round" })] }));
}
export function ClanGodsSection({ gods, theme, loading, }) {
    const { t } = useTranslation();
    const [showAll, setShowAll] = useState(false);
    const insigniaMap = useMemo(() => computeClanGodInsigniaMap(gods), [gods]);
    const topGods = gods.filter((g) => g.hasData).sort((a, b) => b.totalGames - a.totalGames).slice(0, 5);
    const hasAnyData = topGods.length > 0;
    return (_jsxs("section", { children: [_jsxs("div", { className: "mb-5 flex items-start gap-3", children: [_jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-aom-border/50 bg-zinc-950/80 shadow-inner", children: _jsx(GodsIcon, { className: theme.sectionIcon }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-100 sm:text-xl", children: t("pages.clans.detail.godsTitle") }), _jsx("p", { className: "mt-0.5 text-sm text-zinc-500", children: t("pages.clans.detail.godsSubtitle") })] })] }), loading ? (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-950/40 py-12", children: [_jsx("span", { className: "inline-block h-7 w-7 animate-spin rounded-full border-2 border-amber-500/25 border-t-amber-500", "aria-hidden": true }), _jsx("p", { className: "mt-3 text-sm text-zinc-500", children: t("pages.clans.detail.godsLoading") })] })) : !hasAnyData ? (_jsx("p", { className: "rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-950/40 px-4 py-10 text-center text-sm text-zinc-500", children: t("pages.clans.detail.godsEmpty") })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500", children: t("pages.clans.detail.godsTopLabel") }), _jsx("ul", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", children: topGods.map((god) => (_jsx("li", { children: _jsx(ClanGodCard, { god: god, theme: theme, insignias: insigniaMap[god.slug] ?? [], t: t }) }, god.slug))) }), _jsxs("div", { className: "mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between", children: [_jsx("p", { className: "text-xs text-zinc-600", children: t("pages.players.raceSnapshotHint") }), _jsx("button", { type: "button", onClick: () => setShowAll((v) => !v), className: cn("inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50", theme.badgeBg), children: showAll ? t("pages.clans.detail.godsHideAll") : t("pages.clans.detail.godsShowAll") })] }), showAll ? (_jsx("ul", { className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: gods.map((god) => (_jsx("li", { children: _jsx(ClanGodCard, { god: god, theme: theme, compact: true, insignias: insigniaMap[god.slug] ?? [], t: t }) }, god.slug))) })) : null] }))] }));
}
