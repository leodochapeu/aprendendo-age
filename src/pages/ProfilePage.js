import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AomStatsSyncModal } from "@/components/aomstats/AomStatsSyncModal";
import { ProfileGodsSection } from "@/components/rank/ProfileGodsSection";
import { RankProfileHero } from "@/components/rank/rankProfileUi";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { buildRankHeroFromProfile } from "@/lib/aomstatsProfileSync";
import { buildPlayerGods, fetchProfileGods } from "@/lib/clanGodsApi";
import { cn } from "@/lib/cn";
import { getRankClassification } from "@/lib/rankClassification";
import { localeAuthPath } from "@/lib/localeRoutes";
import { isSupabaseConfigured } from "@/lib/supabase/env";
function formatMemberSince(iso, locale) {
    if (!iso)
        return "—";
    try {
        return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
            dateStyle: "long",
        }).format(new Date(iso));
    }
    catch {
        return iso;
    }
}
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
export function ProfilePage() {
    const { t, locale } = useTranslation();
    const { status, profile, profileLoadState, signOut, syncAomStats, unsyncAomStats } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [profileGods, setProfileGods] = useState([]);
    const [godsLoading, setGodsLoading] = useState(false);
    useEffect(() => {
        if (status === "loading")
            return;
        if (status === "unauthenticated" || status === "unconfigured") {
            const next = encodeURIComponent(`${location.pathname}${location.search}`);
            navigate(`${localeAuthPath(locale, "login")}?next=${next}`, { replace: true });
        }
    }, [locale, location.pathname, location.search, navigate, status]);
    useEffect(() => {
        const profileId = profile?.id;
        const hasAomstats = Boolean(profile?.aomstatsId);
        if (!profileId || !hasAomstats || !isSupabaseConfigured()) {
            setProfileGods([]);
            setGodsLoading(false);
            return;
        }
        let cancelled = false;
        setGodsLoading(true);
        void (async () => {
            try {
                const rows = await fetchProfileGods(profileId);
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
        })();
        return () => {
            cancelled = true;
        };
    }, [profile?.id, profile?.aomstatsId, profile?.aomstatsSnapshotAt]);
    const rankHero = useMemo(() => (profile ? buildRankHeroFromProfile(profile) : null), [profile]);
    const classification = rankHero ? getRankClassification(rankHero.rr) : null;
    if (status === "loading" || status === "unauthenticated" || status === "unconfigured") {
        return (_jsx("div", { className: "mx-auto w-full max-w-md rounded-2xl border border-aom-border bg-zinc-950/80 p-6", children: _jsx("p", { className: "text-sm text-zinc-400", children: t("auth.redirecting") }) }));
    }
    const loadingProfile = profileLoadState !== "ready";
    const email = profile?.email?.trim() || "—";
    const memberSince = formatMemberSince(profile?.createdAt ?? null, locale);
    const hasAomstats = Boolean(profile?.aomstatsId);
    async function handleUnsync() {
        setActionBusy(true);
        setActionError(null);
        const res = await unsyncAomStats();
        setActionBusy(false);
        if (res.ok === false)
            setActionError(res.message);
    }
    return (_jsxs("div", { className: "mx-auto w-full max-w-[min(100%,88rem)] space-y-8 pb-10", children: [_jsxs("div", { className: "rounded-2xl border border-aom-border bg-zinc-950/80 p-5 sm:p-6", children: [_jsx("h1", { className: "font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-amber-200", children: t("auth.profileTitle") }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: t("auth.profileSubtitle") }), loadingProfile ? (_jsx("p", { className: "mt-4 text-sm text-zinc-400", children: t("auth.loadingProfile") })) : (_jsxs("dl", { className: "mt-5 grid gap-3 text-sm sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-zinc-500", children: t("auth.email") }), _jsx("dd", { className: "mt-0.5 font-medium text-zinc-100", children: email })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-zinc-500", children: t("auth.memberSince") }), _jsx("dd", { className: "mt-0.5 font-medium text-zinc-100", children: memberSince })] })] })), _jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [_jsx("button", { type: "button", disabled: actionBusy, onClick: () => setSyncModalOpen(true), className: cn("rounded-lg border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-semibold text-amber-200/95", "transition hover:border-amber-500/45 hover:bg-zinc-800/90 disabled:opacity-50"), children: t("auth.aomstatsSyncButton") }), hasAomstats ? (_jsx("button", { type: "button", disabled: actionBusy, onClick: () => void handleUnsync(), className: cn("rounded-lg border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-300", "transition hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-100 disabled:opacity-50"), children: t("auth.aomstatsUnsync") })) : null, _jsx("button", { type: "button", disabled: actionBusy, onClick: () => void signOut().then(() => navigate("/")), className: cn("rounded-lg border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-300", "transition hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-100 disabled:opacity-50"), children: t("auth.signOut") })] }), actionError ? (_jsx("p", { className: "mt-3 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: actionError })) : null] }), rankHero && classification ? (_jsxs("div", { className: "space-y-10", children: [_jsxs("section", { "aria-labelledby": "profile-rank-heading", children: [_jsx("h2", { id: "profile-rank-heading", className: "sr-only", children: t("pages.rank.resultHeading", { name: rankHero.player.profileName }) }), profile?.aomstatsSnapshotAt ? (_jsx("p", { className: "mb-4 text-center text-xs text-zinc-500", children: t("auth.aomstatsSnapshotNote", {
                                    date: formatSnapshotDate(profile.aomstatsSnapshotAt, locale),
                                }) })) : null, _jsx(RankProfileHero, { player: rankHero.player, row1v1: rankHero.row1v1, rr: rankHero.rr, classification: classification })] }), _jsx(ProfileGodsSection, { gods: profileGods, loading: godsLoading })] })) : (_jsx("p", { className: "rounded-2xl border border-aom-border/60 bg-zinc-950/50 px-4 py-8 text-center text-sm text-zinc-500", children: t("auth.aomstatsNotLinked") })), _jsx(AomStatsSyncModal, { open: syncModalOpen, onClose: () => setSyncModalOpen(false), initialSearchText: profile?.displayName?.trim() ?? profile?.aomstatsAlias?.trim() ?? "", onConfirm: async (payload) => {
                    setActionBusy(true);
                    setActionError(null);
                    const res = await syncAomStats(payload);
                    setActionBusy(false);
                    if (res.ok === false)
                        return { error: res.message };
                } })] }));
}
