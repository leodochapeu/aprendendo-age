import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { GodAchievementCard, RankProfileHero } from "@/components/rank/rankProfileUi";
import { ModalApp } from "@/components/ui/ModalApp";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { AmbiguousPlayerError, fetchGodStats, fetchPlayerStats, fetchPlayerStatsByProfileId, parseElo, pickSup1v1Row, } from "@/lib/formRetoldApi";
import { cn } from "@/lib/cn";
import { getRankClassification } from "@/lib/rankClassification";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
export function FormRankPage() {
    const { t } = useTranslation();
    const headerIcon = getTokenAssetUrl("aomr_wonder_age_icon");
    const [searchParams, setSearchParams] = useSearchParams();
    const playerParam = searchParams.get("player")?.trim() ?? "";
    const aomstatsIdParam = searchParams.get("aomstats_id")?.trim() ?? "";
    const aomstatsIdNum = aomstatsIdParam ? Number.parseInt(aomstatsIdParam, 10) : NaN;
    const hasAomstatsId = Number.isFinite(aomstatsIdNum) && aomstatsIdNum > 0;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [player, setPlayer] = useState(null);
    const [row1v1, setRow1v1] = useState(undefined);
    const [gods, setGods] = useState([]);
    const [godsLoading, setGodsLoading] = useState(false);
    const [pickModalOpen, setPickModalOpen] = useState(false);
    const [pickProfiles, setPickProfiles] = useState([]);
    const [pickSelectedId, setPickSelectedId] = useState(null);
    const rr = row1v1 ? parseElo(row1v1.elo) : undefined;
    const classification = rr != null ? getRankClassification(rr) : null;
    useEffect(() => {
        if (!playerParam && !hasAomstatsId) {
            setPlayer(null);
            setRow1v1(undefined);
            setGods([]);
            setGodsLoading(false);
            setError(null);
            setLoading(false);
            return;
        }
        let cancelled = false;
        void (async () => {
            setError(null);
            setLoading(true);
            setPlayer(null);
            setRow1v1(undefined);
            setGods([]);
            setGodsLoading(false);
            try {
                let data;
                if (hasAomstatsId) {
                    data = await fetchPlayerStatsByProfileId(aomstatsIdNum);
                }
                else {
                    try {
                        data = await fetchPlayerStats(playerParam);
                    }
                    catch (amb) {
                        if (amb instanceof AmbiguousPlayerError) {
                            if (!cancelled) {
                                setPickProfiles(amb.profiles);
                                setPickSelectedId(null);
                                setPickModalOpen(true);
                                setLoading(false);
                            }
                            return;
                        }
                        throw amb;
                    }
                }
                if (cancelled)
                    return;
                const one = pickSup1v1Row(data.profileStats);
                if (!one) {
                    setError("Resposta sem estatísticas de modo.");
                    return;
                }
                const eloNum = parseElo(one.elo);
                if (eloNum == null) {
                    setError(`Dados de ${data.profileName} carregados, mas o RR de Sup 1v1 não foi encontrado.`);
                    setPlayer(data);
                    return;
                }
                if (cancelled)
                    return;
                setPlayer(data);
                setRow1v1(one);
                setGodsLoading(true);
                setGods([]);
                try {
                    const g = await fetchGodStats(data.profileId);
                    if (!cancelled)
                        setGods(g.slice(0, 3));
                }
                catch {
                    if (!cancelled)
                        setGods([]);
                }
                finally {
                    if (!cancelled)
                        setGodsLoading(false);
                }
            }
            catch (err) {
                if (!cancelled)
                    setError(err instanceof Error ? err.message : "Falha ao buscar os dados.");
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            setGodsLoading(false);
        };
    }, [playerParam, aomstatsIdParam, hasAomstatsId, aomstatsIdNum]);
    function applyPickedProfile() {
        if (pickSelectedId == null)
            return;
        const row = pickProfiles.find((p) => p.profile_id === pickSelectedId);
        if (!row)
            return;
        setPickModalOpen(false);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("player", (row.alias ?? playerParam).trim() || playerParam);
            next.set("aomstats_id", String(row.profile_id));
            return next;
        }, { replace: true });
    }
    return (_jsxs("div", { className: "space-y-8 pb-16", children: [_jsx(PageHeader, { title: t("pages.rank.rrClassification"), headerIconSrc: headerIcon, description: t("pages.rank.formDescription"), actions: _jsx(Link, { to: "/rank", className: "inline-flex items-center rounded-lg border border-aom-border bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-amber-500/35 hover:text-amber-100", children: t("pages.rank.backToGuide") }) }), !playerParam && !hasAomstatsId ? (_jsxs("div", { className: "relative mx-auto max-w-xl overflow-hidden rounded-2xl border border-zinc-700/55 bg-zinc-950 p-6 text-center shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)] sm:p-7", children: [_jsx("p", { className: "text-sm leading-relaxed text-zinc-400", children: t("pages.rank.noPlayerInUrl") }), _jsx(Link, { to: "/rank", className: "mt-5 inline-flex items-center justify-center rounded-xl border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-amber-500/35 hover:text-amber-100", children: t("pages.rank.backToGuide") })] })) : loading && !(player && row1v1 && classification && rr != null) ? (_jsxs("div", { className: "relative mx-auto max-w-xl overflow-hidden rounded-2xl border border-zinc-700/55 bg-zinc-950 p-8 text-center shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)] sm:p-10", children: [_jsx("span", { className: "inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-500/25 border-t-amber-500", "aria-hidden": true }), _jsx("p", { className: "mt-4 text-sm text-zinc-400", children: t("pages.rank.loadingData", {
                            name: playerParam || (hasAomstatsId ? `perfil #${aomstatsIdNum}` : "…"),
                        }) })] })) : error && !(player && row1v1 && classification && rr != null) ? (_jsxs("div", { className: "relative mx-auto max-w-xl overflow-hidden rounded-2xl border border-zinc-700/55 bg-zinc-950 p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)] sm:p-7", children: [_jsx("p", { className: "rounded-xl border border-red-900/45 bg-red-950/35 px-3 py-2 text-center text-sm text-red-200", role: "alert", children: error }), _jsx(Link, { to: "/rank", className: "mt-5 flex w-full items-center justify-center rounded-xl border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-amber-500/35 hover:text-amber-100", children: t("pages.rank.backRetry") })] })) : null, player && row1v1 && classification && rr != null ? (_jsxs("div", { className: "space-y-12", children: [_jsxs("section", { "aria-labelledby": "result-main-heading", children: [_jsx("h2", { id: "result-main-heading", className: "sr-only", children: t("pages.rank.resultHeading", { name: player.profileName }) }), _jsx(RankProfileHero, { player: player, row1v1: row1v1, rr: rr, classification: classification })] }), _jsxs("section", { "aria-labelledby": "gods-heading", className: "mx-auto w-full max-w-[min(100%,88rem)] px-2 sm:px-4 md:px-6", children: [_jsx("p", { className: "mb-2 text-center font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-zinc-500", children: t("pages.rank.progressionLabel") }), _jsx("h3", { id: "gods-heading", className: "text-center font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl", children: t("pages.rank.mainGods") }), _jsx("p", { className: "mx-auto mt-2 max-w-md text-center text-[11px] text-zinc-500", children: t("pages.rank.mainGodsDesc") }), godsLoading ? (_jsxs("div", { className: "mx-auto mt-8 flex max-w-xl flex-col items-center justify-center rounded-2xl border border-aom-border/50 bg-zinc-950/60 py-12 text-center", children: [_jsx("span", { className: "inline-block h-8 w-8 animate-spin rounded-full border-2 border-zinc-500/30 border-t-zinc-300", "aria-hidden": true }), _jsx("p", { className: "mt-4 text-sm text-zinc-500", children: t("pages.rank.loadingGods") })] })) : gods.length === 0 ? (_jsx("p", { className: "mx-auto mt-8 max-w-xl rounded-2xl border border-aom-border/50 bg-zinc-950/60 py-8 text-center text-sm text-zinc-500", children: t("pages.rank.noGodStats") })) : (_jsx("div", { className: "mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5 md:gap-6 lg:gap-8", children: gods.map((g, i) => (_jsxs("div", { className: "relative", children: [_jsxs("p", { className: "mb-2 text-center font-mono text-[9px] font-medium uppercase tracking-[0.35em] text-zinc-500", children: [i + 1, " / ", gods.length] }), _jsx(GodAchievementCard, { god: g, t: t })] }, g.god))) }))] })] })) : null, _jsxs(ModalApp, { open: pickModalOpen, onClose: () => {
                    setPickModalOpen(false);
                    setPickProfiles([]);
                    setPickSelectedId(null);
                }, title: t("pages.rank.pickPlayerTitle"), description: t("pages.rank.pickPlayerDescForm"), className: "max-w-lg", children: [_jsx("ul", { className: "max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-0.5", role: "list", children: pickProfiles.map((p) => {
                            const active = pickSelectedId === p.profile_id;
                            return (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => setPickSelectedId(p.profile_id), className: cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", "border-zinc-600/80 bg-zinc-900/60 hover:border-amber-500/40", active && "border-amber-500/60 ring-2 ring-amber-500/25"), children: [_jsx(PlayerAvatarMark, { src: p.avatar_link, className: "h-11 w-11 shrink-0 rounded-full", width: 44, height: 44 }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "text-sm text-zinc-200", children: [(p.clan_name ?? "").trim() ? (_jsxs("span", { className: "text-amber-200/90", children: ["[", (p.clan_name ?? "").trim(), "] "] })) : null, _jsx("span", { className: "font-medium", children: p.alias || p.profile_id })] }), _jsxs("div", { className: "font-mono text-xs text-zinc-500", children: ["ID ", p.profile_id] })] })] }) }, p.profile_id));
                        }) }), _jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [_jsx("button", { type: "button", disabled: pickSelectedId == null, onClick: applyPickedProfile, className: "rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50", children: t("pages.rank.continueWithProfile") }), _jsx(Link, { to: "/rank", className: "inline-flex items-center rounded-xl border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-amber-500/35 hover:text-amber-100", onClick: () => setPickModalOpen(false), children: t("pages.rank.backToGuide") })] })] })] }));
}
