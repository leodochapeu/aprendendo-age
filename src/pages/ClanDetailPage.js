import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ClanAboutSection, ClanChannelsSection } from "@/components/clans/ClanChannelsSection";
import { ClanGodsSection } from "@/components/clans/ClanGodsSection";
import { ClanLogo } from "@/components/clans/ClanLogo";
import { ClanRoster } from "@/components/clans/ClanRoster";
import { BackLink } from "@/components/ui/BackLink";
import { useTranslation } from "@/hooks/useTranslation";
import { getClanLogoUrl } from "@/lib/clanAssetUrl";
import { getClanTheme } from "@/lib/clanTheme";
import { fetchClanBySlug } from "@/lib/clansApi";
import { aggregateClanGods, fetchClanProfileGods } from "@/lib/clanGodsApi";
import { fetchClanChannels } from "@/lib/channelsApi";
import { cn } from "@/lib/cn";
import { fetchClanPlayers } from "@/lib/playersApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
function ClanStats({ players, theme, }) {
    const { t } = useTranslation();
    const memberCount = players.length;
    const topRr = players[0]?.rr ?? null;
    const avgRr = players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.rr, 0) / players.length) : null;
    const items = [
        { label: t("pages.clans.detail.statMembers"), value: String(memberCount) },
        { label: t("pages.clans.detail.statTopRr"), value: topRr != null ? String(topRr) : "—" },
        { label: t("pages.clans.detail.statAvgRr"), value: avgRr != null ? String(avgRr) : "—" },
    ];
    return (_jsx("div", { className: "mt-6 grid grid-cols-3 gap-2 sm:gap-3", children: items.map((item) => (_jsxs("div", { className: cn("rounded-xl border px-2 py-3 text-center backdrop-blur-sm sm:rounded-2xl sm:px-4 sm:py-4", theme.statSurface), children: [_jsx("p", { className: "text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500 sm:text-[10px]", children: item.label }), _jsx("p", { className: cn("mt-1 text-xl font-bold tabular-nums sm:text-2xl", theme.accentText), children: item.value })] }, item.label))) }));
}
export function ClanDetailPage() {
    const { slug } = useParams();
    const { t } = useTranslation();
    const supabaseConfigured = isSupabaseConfigured();
    const routeSlug = slug?.trim().toLowerCase() ?? "";
    const [clan, setClan] = useState(null);
    const [players, setPlayers] = useState([]);
    const [clanGods, setClanGods] = useState([]);
    const [clanChannels, setClanChannels] = useState([]);
    const [godsLoading, setGodsLoading] = useState(false);
    const [loading, setLoading] = useState(supabaseConfigured);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const theme = useMemo(() => getClanTheme(routeSlug), [routeSlug]);
    const logoSrc = clan ? getClanLogoUrl(clan) : undefined;
    useEffect(() => {
        if (!supabaseConfigured || !routeSlug) {
            setLoading(false);
            setClan(null);
            setPlayers([]);
            setClanGods([]);
            setClanChannels([]);
            setNotFound(!routeSlug);
            return;
        }
        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            if (!cancelled) {
                setError(t("pages.clans.loadTimeout"));
                setLoading(false);
            }
        }, 20_000);
        void (async () => {
            setLoading(true);
            setError(null);
            setNotFound(false);
            try {
                const found = await fetchClanBySlug(routeSlug);
                if (cancelled)
                    return;
                if (!found) {
                    window.clearTimeout(timeoutId);
                    setClan(null);
                    setPlayers([]);
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                const roster = await fetchClanPlayers(found.id);
                if (cancelled)
                    return;
                const channels = await fetchClanChannels(found.id);
                if (cancelled)
                    return;
                setGodsLoading(true);
                let godsAgg = [];
                try {
                    const godRows = await fetchClanProfileGods(found.id);
                    godsAgg = aggregateClanGods(godRows);
                }
                catch {
                    godsAgg = aggregateClanGods([]);
                }
                finally {
                    if (!cancelled)
                        setGodsLoading(false);
                }
                window.clearTimeout(timeoutId);
                setClan(found);
                setPlayers(roster);
                setClanChannels(channels);
                setClanGods(godsAgg);
                setError(null);
            }
            catch (err) {
                if (cancelled)
                    return;
                window.clearTimeout(timeoutId);
                setError(err instanceof Error ? err.message : t("pages.clans.loadError"));
                setClan(null);
                setPlayers([]);
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [routeSlug, supabaseConfigured, t]);
    if (!routeSlug || notFound) {
        return (_jsxs("div", { className: "pb-16", children: [_jsx(BackLink, { to: "/clans", children: t("pages.clans.detail.backToList") }), _jsx("p", { className: "text-zinc-400", children: t("pages.clans.detail.notFound") })] }));
    }
    return (_jsxs("div", { className: "pb-16", children: [_jsx(BackLink, { to: "/clans", children: t("pages.clans.detail.backToList") }), _jsxs("div", { className: "overflow-hidden rounded-3xl border border-aom-border/60 shadow-2xl shadow-black/50", children: [_jsxs("header", { className: cn("relative isolate border-b border-zinc-800/80 bg-gradient-to-br px-4 py-8 sm:px-8 sm:py-10", theme.heroGradient), children: [logoSrc ? (_jsx("img", { src: logoSrc, alt: "", className: "pointer-events-none absolute -right-6 top-1/2 h-48 w-48 -translate-y-1/2 opacity-[0.12] blur-[1px] sm:-right-4 sm:h-64 sm:w-64", "aria-hidden": true })) : null, _jsx("div", { className: "pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl", style: { background: theme.heroGlow }, "aria-hidden": true }), _jsxs("div", { className: "relative flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 scale-125 rounded-full blur-2xl", style: { background: theme.heroGlow }, "aria-hidden": true }), _jsx(ClanLogo, { tag: clan?.tag ?? routeSlug, logoSrc: logoSrc, size: "hero", className: cn("relative border-2 shadow-2xl", theme.accentBorder) })] }), _jsxs("div", { className: "mt-5 min-w-0 flex-1 sm:mt-0", children: [_jsx("span", { className: cn("inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest", theme.badgeBg), children: clan?.tag ?? routeSlug.toUpperCase() }), _jsx("h1", { className: "mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-zinc-50 sm:text-3xl lg:text-4xl", children: clan?.name ?? t("pages.clans.detail.loadingName") }), _jsx("p", { className: "mt-2 max-w-xl text-sm text-zinc-400 sm:text-base", children: t("pages.clans.detail.heroSubtitle") }), !loading && clan ? _jsx(ClanStats, { players: players, theme: theme }) : null] })] })] }), _jsx("div", { className: "space-y-10 bg-[#141414] px-4 py-8 sm:px-8 sm:py-10", children: loading ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-16", children: [_jsx("span", { className: "inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-500/25 border-t-amber-500", "aria-hidden": true }), _jsx("p", { className: "mt-4 text-sm text-zinc-500", children: t("pages.clans.detail.loading") })] })) : !supabaseConfigured ? (_jsx("p", { className: "rounded-xl border border-amber-900/45 bg-amber-950/35 px-4 py-3 text-sm text-amber-100/90", role: "status", children: t("pages.clans.unconfigured") })) : error ? (_jsx("p", { className: "rounded-xl border border-red-900/45 bg-red-950/35 px-4 py-3 text-sm text-red-200", role: "alert", children: error })) : clan ? (_jsxs(_Fragment, { children: [_jsxs("section", { children: [_jsxs("div", { className: "mb-5 flex items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.2em] text-zinc-500", children: t("pages.clans.detail.rosterLabel") }), _jsx("h2", { className: "mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-100 sm:text-2xl", children: t("pages.clans.detail.rosterTitle") })] }), _jsx("p", { className: "hidden text-xs text-zinc-600 sm:block", children: t("pages.players.raceSnapshotHint") })] }), _jsx(ClanRoster, { players: players, theme: theme })] }), _jsx(ClanChannelsSection, { channels: clanChannels, theme: theme }), _jsx(ClanAboutSection, { slug: routeSlug, theme: theme }), _jsx(ClanGodsSection, { gods: clanGods, theme: theme, loading: godsLoading })] })) : null })] })] }));
}
