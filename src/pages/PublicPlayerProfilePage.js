import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PlayerClanLink } from "@/components/jogadores/PlayerClanLink";
import { PlayerStreamBadges } from "@/components/jogadores/PlayerStreamBadges";
import { ProfileGodsSection } from "@/components/rank/ProfileGodsSection";
import { RankProfileHero } from "@/components/rank/rankProfileUi";
import { BackLink } from "@/components/ui/BackLink";
import { useTranslation } from "@/hooks/useTranslation";
import { buildRankHeroFromRacePlayer } from "@/lib/aomstatsProfileSync";
import { buildPlayerGods, fetchProfileGods } from "@/lib/clanGodsApi";
import { localePlayersPath } from "@/lib/localeRoutes";
import { fetchAomRacePlayerById, playerClanTag, playerDisplayLabel, } from "@/lib/playersApi";
import { getRankClassification } from "@/lib/rankClassification";
import { isSupabaseConfigured } from "@/lib/supabase/env";
function formatSnapshotDate(iso, locale) {
    if (!iso)
        return "—";
    try {
        return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(iso));
    }
    catch {
        return iso;
    }
}
export function PublicPlayerProfilePage() {
    const { id } = useParams();
    const { t, locale } = useTranslation();
    const profileId = id?.trim() ?? "";
    const [player, setPlayer] = useState(null);
    const [profileGods, setProfileGods] = useState([]);
    const [loading, setLoading] = useState(isSupabaseConfigured());
    const [godsLoading, setGodsLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!profileId || !isSupabaseConfigured()) {
            setLoading(false);
            setPlayer(null);
            setNotFound(!profileId);
            return;
        }
        let cancelled = false;
        void (async () => {
            setLoading(true);
            setError(null);
            setNotFound(false);
            try {
                const found = await fetchAomRacePlayerById(profileId);
                if (cancelled)
                    return;
                if (!found) {
                    setPlayer(null);
                    setProfileGods([]);
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                setPlayer(found);
                setLoading(false);
                setGodsLoading(true);
                try {
                    const rows = await fetchProfileGods(found.id);
                    if (!cancelled)
                        setProfileGods(buildPlayerGods(rows));
                }
                catch {
                    if (!cancelled)
                        setProfileGods(buildPlayerGods([]));
                }
                finally {
                    if (!cancelled)
                        setGodsLoading(false);
                }
            }
            catch (err) {
                if (cancelled)
                    return;
                setError(err instanceof Error ? err.message : t("pages.players.loadError"));
                setPlayer(null);
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [profileId, t]);
    const rankHero = useMemo(() => (player ? buildRankHeroFromRacePlayer(player) : null), [player]);
    const classification = rankHero ? getRankClassification(rankHero.rr) : null;
    const label = player ? playerDisplayLabel(player) : "";
    const clanTag = player ? playerClanTag(player) : null;
    if (loading) {
        return (_jsx("div", { className: "mx-auto w-full max-w-md rounded-2xl border border-aom-border bg-zinc-950/80 p-6", children: _jsx("p", { className: "text-sm text-zinc-400", children: t("pages.players.loading") }) }));
    }
    if (notFound) {
        return (_jsxs("div", { className: "mx-auto w-full max-w-lg space-y-4", children: [_jsx(BackLink, { to: localePlayersPath(locale), children: t("pages.players.backToList") }), _jsx("p", { className: "rounded-2xl border border-aom-border/60 bg-zinc-950/50 px-4 py-8 text-center text-sm text-zinc-500", children: t("pages.players.profileNotFound") })] }));
    }
    if (error || !player || !rankHero || !classification) {
        return (_jsxs("div", { className: "mx-auto w-full max-w-lg space-y-4", children: [_jsx(BackLink, { to: localePlayersPath(locale), children: t("pages.players.backToList") }), _jsx("p", { className: "rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-8 text-center text-sm text-red-200", role: "alert", children: error ?? t("pages.players.loadError") })] }));
    }
    return (_jsxs("div", { className: "mx-auto w-full max-w-[min(100%,88rem)] space-y-8 pb-10", children: [_jsx(BackLink, { to: localePlayersPath(locale), children: t("pages.players.backToList") }), _jsxs("header", { className: "rounded-2xl border border-aom-border bg-zinc-950/80 p-5 sm:p-6", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.2em] text-zinc-500", children: t("pages.players.publicProfileLabel") }), _jsxs("div", { className: "mt-3 flex items-center gap-3", children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-3", children: [_jsx("h1", { className: "font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-amber-200", children: label }), clanTag ? _jsx(PlayerClanLink, { player: player, size: "sm", showTag: true }) : null] }), _jsxs("div", { className: "ml-6 flex shrink-0 items-center gap-1", children: [_jsx(PlayerStreamBadges, { streams: player.streams, placement: "inline" }), rankHero.player.profileUrl ? (_jsx("a", { href: rankHero.player.profileUrl, target: "_blank", rel: "noreferrer noopener", title: t("pages.rank.openProfile", { name: label }), "aria-label": t("pages.rank.openProfile", { name: label }), className: "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/70", children: _jsx("img", { src: "/assets/aomstats-icon.png", alt: "", className: "h-9 w-9 object-contain", width: 36, height: 36 }) })) : null] })] }), player.snapshotAt ? (_jsx("p", { className: "mt-3 text-sm text-zinc-500", children: t("pages.players.profileSnapshotNote", {
                            date: formatSnapshotDate(player.snapshotAt, locale),
                        }) })) : null] }), _jsxs("div", { className: "space-y-10", children: [_jsxs("section", { "aria-labelledby": "public-player-rank-heading", children: [_jsx("h2", { id: "public-player-rank-heading", className: "sr-only", children: t("pages.rank.resultHeading", { name: rankHero.player.profileName }) }), _jsx(RankProfileHero, { player: rankHero.player, row1v1: rankHero.row1v1, rr: rankHero.rr, classification: classification })] }), _jsx(ProfileGodsSection, { gods: profileGods, loading: godsLoading, titleKey: "pages.players.publicProfileGodsTitle", subtitleKey: "pages.players.publicProfileGodsSubtitle" })] })] }));
}
