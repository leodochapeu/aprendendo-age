import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { ModalApp } from "@/components/ui/ModalApp";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { searchPlayersByName } from "@/lib/formRetoldApi";
import { cn } from "@/lib/cn";
import { getRankGuideTiers } from "@/lib/rankGuideTiers";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";
function TierAchievement({ tier, index, total, t, }) {
    const iconSrc = getTokenAssetUrl(tier.token);
    return (_jsxs("section", { id: tier.id, "aria-labelledby": `${tier.id}-heading`, className: cn("relative scroll-mt-28 overflow-hidden rounded-3xl border border-aom-border/60 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)] md:scroll-mt-24", tier.surfaceClass), children: [_jsx("div", { className: "pointer-events-none absolute inset-0 opacity-[0.07]", style: {
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M40 0L40 80M0 40L80 40'/%3E%3C/g%3E%3C/svg%3E\")",
                }, "aria-hidden": true }), _jsxs("div", { className: "relative flex min-h-[min(88dvh,52rem)] flex-col items-center justify-center px-4 py-16 sm:px-8 sm:py-20 md:py-24", children: [_jsx("p", { className: "mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500", children: t("pages.rank.progression", { current: index + 1, total }) }), _jsxs("div", { className: "relative mb-8 flex items-center justify-center", children: [_jsx("div", { className: cn("absolute h-[min(52vw,16rem)] w-[min(52vw,16rem)] rounded-full blur-3xl sm:h-72 sm:w-72", tier.id === "diamante" && "bg-sky-500/25", tier.id === "esmeralda" && "bg-emerald-500/20", tier.id === "ouro" && "bg-amber-500/20", tier.id === "prata" && "bg-zinc-400/15", tier.id === "bronze" && "bg-amber-800/25"), "aria-hidden": true }), iconSrc ? (_jsx("img", { src: iconSrc, alt: "", className: "relative z-[1] h-[min(44vw,13rem)] w-[min(44vw,13rem)] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:h-56 sm:w-56 md:h-64 md:w-64", width: 256, height: 256 })) : (_jsx("div", { className: "relative z-[1] flex h-48 w-48 items-center justify-center rounded-2xl border border-dashed border-zinc-600 bg-zinc-900/80 text-zinc-500", children: "\u2014" }))] }), _jsxs("div", { className: "relative z-[1] max-w-2xl text-center", children: [_jsxs("h2", { id: `${tier.id}-heading`, className: cn("font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl", tier.titleClass), children: [tier.rankName, _jsx("span", { className: "text-zinc-500", children: " | " }), _jsx("span", { className: "text-zinc-200", children: tier.eraName })] }), _jsxs("p", { className: "mt-3 text-sm text-zinc-400 sm:text-base", children: [t("pages.rank.generalBand"), " ", _jsx("span", { className: "font-medium text-zinc-200", children: tier.rrBand }), _jsx("span", { className: "mx-2 text-zinc-600", children: "\u00B7" }), t("pages.rank.playerShareLabel"), " ", _jsx("span", { className: "font-medium text-zinc-200", children: tier.playerShare })] }), _jsx("ul", { className: "mt-4 space-y-1.5 text-sm leading-relaxed text-zinc-400 sm:text-[0.9375rem]", children: tier.narrative.map((line) => (_jsxs("li", { children: ["\u2022 ", line] }, line))) })] }), _jsxs("div", { className: "relative z-[1] mt-12 w-full max-w-3xl", children: [_jsx("p", { className: "mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500", children: t("pages.rank.subdivisions") }), _jsx("p", { className: "mb-6 text-center text-[11px] text-zinc-600", children: t("pages.rank.subdivisionsHint") }), _jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4", children: tier.steps.map((step) => (_jsxs("div", { className: cn("relative z-[1] flex flex-col items-center rounded-2xl border border-aom-border/50 bg-zinc-950/55 px-4 py-5 text-center shadow-inner shadow-black/40 backdrop-blur-sm ring-2 ring-inset", tier.stepRing), children: [_jsx("span", { className: cn("text-sm font-semibold tracking-tight", tier.stepAccent), children: step.label }), _jsxs("span", { className: "mt-2 font-mono text-xs text-zinc-400", children: [step.rr, " RR"] })] }, step.label))) })] })] })] }));
}
function goToRankForm(navigate, alias, profileId) {
    const sp = new URLSearchParams();
    sp.set("player", alias.trim() || String(profileId));
    sp.set("aomstats_id", String(profileId));
    navigate({ pathname: "/rank/form", search: sp.toString() });
}
export function RankPage({ embedded = false }) {
    const { t } = useTranslation();
    const tiers = useMemo(() => getRankGuideTiers(t), [t]);
    const headerIcon = getTokenAssetUrl("aomr_wonder_age_icon");
    const navigate = useNavigate();
    const [playerQuery, setPlayerQuery] = useState("");
    const [formError, setFormError] = useState(null);
    const [searchBusy, setSearchBusy] = useState(false);
    const [pickModalOpen, setPickModalOpen] = useState(false);
    const [pickProfiles, setPickProfiles] = useState([]);
    const [pickSelectedId, setPickSelectedId] = useState(null);
    async function onConsultRank(e) {
        e.preventDefault();
        const q = playerQuery.trim();
        if (!q) {
            setFormError(t("pages.rank.enterPlayerName"));
            return;
        }
        setFormError(null);
        setSearchBusy(true);
        try {
            const profiles = await searchPlayersByName(q);
            if (profiles.length === 0) {
                setFormError(t("pages.rank.noPlayerFound"));
                return;
            }
            if (profiles.length === 1) {
                const p = profiles[0];
                goToRankForm(navigate, p.alias ?? q, p.profile_id);
                return;
            }
            setPickProfiles(profiles);
            setPickSelectedId(null);
            setPickModalOpen(true);
        }
        catch (err) {
            setFormError(err instanceof Error ? err.message : t("pages.rank.searchError"));
        }
        finally {
            setSearchBusy(false);
        }
    }
    function confirmPickAndGo() {
        if (pickSelectedId == null)
            return;
        const p = pickProfiles.find((x) => x.profile_id === pickSelectedId);
        if (!p)
            return;
        setPickModalOpen(false);
        setPickProfiles([]);
        goToRankForm(navigate, p.alias || String(p.profile_id), p.profile_id);
    }
    return (_jsxs("div", { className: embedded ? "space-y-10" : "space-y-10 pb-16", children: [embedded ? null : (_jsx(PageHeader, { title: t("pages.rank.pageTitle"), headerIconSrc: headerIcon, description: t("pages.rank.pageDescription") })), _jsxs("div", { className: "rounded-2xl border border-aom-border/50 bg-zinc-900/40 p-4 sm:p-5", children: [_jsx("p", { className: "text-sm leading-relaxed text-zinc-400 sm:max-w-2xl", children: t("pages.rank.consultIntro") }), _jsxs("form", { onSubmit: onConsultRank, className: cn("mt-4 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3", searchBusy && "pointer-events-none opacity-70"), children: [_jsxs("label", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "sr-only", children: t("pages.rank.playerNameLabel") }), _jsx("input", { type: "text", value: playerQuery, onChange: (ev) => {
                                            setPlayerQuery(ev.target.value);
                                            if (formError)
                                                setFormError(null);
                                        }, disabled: searchBusy, placeholder: t("pages.rank.playerNamePlaceholder"), autoComplete: "off", className: "w-full rounded-xl border border-zinc-600/90 bg-black/35 px-4 py-3.5 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 disabled:cursor-not-allowed" })] }), _jsx("button", { type: "submit", disabled: searchBusy, className: "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-900/25 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/35 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[10.5rem]", children: searchBusy ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950", "aria-hidden": true }), t("pages.rank.searching")] })) : (t("pages.rank.consultButton")) })] }), formError ? (_jsx("p", { className: "mt-3 rounded-xl border border-red-900/45 bg-red-950/35 px-3 py-2 text-center text-sm text-red-200", role: "alert", children: formError })) : null] }), _jsxs(ModalApp, { open: pickModalOpen, onClose: () => {
                    setPickModalOpen(false);
                    setPickProfiles([]);
                    setPickSelectedId(null);
                }, title: t("pages.rank.pickPlayerTitle"), description: t("pages.rank.pickPlayerDescRank"), className: "max-w-lg", children: [_jsx("ul", { className: "max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-0.5", role: "list", children: pickProfiles.map((p) => {
                            const active = pickSelectedId === p.profile_id;
                            return (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => setPickSelectedId(p.profile_id), className: cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", "border-zinc-600/80 bg-zinc-900/60 hover:border-amber-500/40", active && "border-amber-500/60 ring-2 ring-amber-500/25"), children: [_jsx(PlayerAvatarMark, { src: p.avatar_link, className: "h-11 w-11 shrink-0 rounded-full", width: 44, height: 44 }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "text-sm text-zinc-200", children: [(p.clan_name ?? "").trim() ? (_jsxs("span", { className: "text-amber-200/90", children: ["[", (p.clan_name ?? "").trim(), "] "] })) : null, _jsx("span", { className: "font-medium", children: p.alias || p.profile_id })] }), _jsxs("div", { className: "font-mono text-xs text-zinc-500", children: ["ID ", p.profile_id] })] })] }) }, p.profile_id));
                        }) }), _jsx("div", { className: "mt-5 flex flex-wrap gap-2", children: _jsx("button", { type: "button", disabled: pickSelectedId == null, onClick: confirmPickAndGo, className: "rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50", children: t("pages.rank.consultThisProfile") }) })] }), _jsx("nav", { "aria-label": t("pages.rank.tierNavLabel"), className: "sticky top-[calc(env(safe-area-inset-top,0px)+4.25rem)] z-20 -mx-1 flex flex-wrap justify-center gap-2 rounded-2xl border border-aom-border/50 bg-zinc-950/90 px-2 py-3 shadow-lg shadow-black/40 backdrop-blur-md sm:top-6 sm:px-4 md:top-8", children: tiers.map((tTier) => {
                    const iconSrc = getTokenAssetUrl(tTier.token);
                    return (_jsxs("a", { href: `#${tTier.id}`, className: cn("inline-flex items-center gap-1.5 rounded-full border border-aom-border/60 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-100"), children: [iconSrc ? (_jsx("img", { src: iconSrc, alt: "", className: "h-4 w-4 shrink-0 object-contain opacity-95 sm:h-[1.125rem] sm:w-[1.125rem]", width: 18, height: 18 })) : null, _jsx("span", { children: tTier.rankName })] }, tTier.id));
                }) }), _jsx("div", { className: "space-y-12 md:space-y-16", children: tiers.map((tier, index) => (_jsx(TierAchievement, { tier: tier, index: index, total: tiers.length, t: t }, tier.id))) }), _jsxs("section", { "aria-labelledby": "como-funciona-heading", className: "rounded-2xl border border-zinc-700/40 bg-zinc-900/40 px-5 py-6 sm:px-8 sm:py-8", children: [_jsx("h2", { id: "como-funciona-heading", className: "font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-100 sm:text-2xl", children: t("pages.rank.howItWorks") }), _jsx("p", { className: "mt-3 text-sm leading-relaxed text-zinc-400", children: t("pages.rank.howItWorksDesc") }), _jsxs("ul", { className: "mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-400 marker:text-zinc-600", children: [_jsx("li", { children: t("pages.rank.howItWorksBullet1") }), _jsx("li", { children: t("pages.rank.howItWorksBullet2") }), _jsx("li", { children: t("pages.rank.howItWorksBullet3") })] }), _jsxs("div", { className: "mt-6 space-y-2 border-t border-zinc-700/35 pt-6 text-sm text-zinc-400", children: [_jsxs("p", { children: ["\uD83D\uDD39 ", t("pages.rank.howItWorksNote1")] }), _jsxs("p", { children: ["\uD83D\uDD39 ", t("pages.rank.howItWorksNote2")] }), _jsxs("p", { children: ["\uD83D\uDD39 ", t("pages.rank.howItWorksNote3")] }), _jsxs("p", { children: ["\uD83D\uDD39 ", t("pages.rank.howItWorksNote4")] })] })] })] }));
}
