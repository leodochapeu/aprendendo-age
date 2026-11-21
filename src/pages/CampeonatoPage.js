import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ChampionshipBracketView } from "@/components/campeonato/ChampionshipBracketView";
import { ChampionshipEmblem } from "@/components/campeonato/ChampionshipEmblem";
import { ChampionshipMarkdown } from "@/components/campeonato/ChampionshipMarkdown";
import { EpicMatchCard } from "@/components/campeonato/EpicMatchCard";
import { RosterList } from "@/components/campeonato/RosterList";
import { RosterPresentation } from "@/components/campeonato/RosterPresentation";
import { ParticleField } from "@/components/campeonato/ParticleField";
import { PlayerAvatarMark } from "@/components/jogadores/PlayerAvatarMark";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { localeAuthPath } from "@/lib/localeRoutes";
import { fetchChampionshipBySlug, fetchMyChampionshipEntry, submitChampionshipEntry, } from "@/lib/championshipsApi";
import { fetchAomRacePlayersByIds } from "@/lib/playersApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const PANEL_SEGMENT = {
    about: { campeonato: "apresentacao", championship: "overview" },
    brackets: { campeonato: "chaves", championship: "brackets" },
    roster: { campeonato: "inscritos", championship: "roster" },
    table: { campeonato: "classificacao", championship: "standings" },
    calendar: { campeonato: "calendario", championship: "calendar" },
};
function tabFromPanel(panel) {
    if (!panel)
        return null;
    for (const [tab, segments] of Object.entries(PANEL_SEGMENT)) {
        if (segments.campeonato === panel || segments.championship === panel)
            return tab;
    }
    return null;
}
function panelBase(pathname) {
    return pathname.startsWith("/championship") ? "championship" : "campeonato";
}
function tabPath(base, slug, tab, preview = false) {
    const segment = tab === "about" ? "" : `/${PANEL_SEGMENT[tab][base]}`;
    return `/${base}/${slug}${segment}${preview ? "?preview=1" : ""}`;
}
const PHASE_KEY = {
    registration: "pages.championship.phase.registration",
    ongoing: "pages.championship.phase.ongoing",
    finished: "pages.championship.phase.finished",
};
function emptySpoilers() {
    return {
        brackets: { all: false, ids: [] },
        table: { all: false, ids: [] },
        calendar: { all: false, ids: [] },
    };
}
function spoilerKey(slug) {
    return `campeonato-spoilers:${slug}`;
}
function readEntry(value) {
    if (!value || typeof value !== "object")
        return { all: false, ids: [] };
    const row = value;
    const ids = Array.isArray(row.ids) ? row.ids.filter((id) => typeof id === "string") : [];
    return { all: row.all === true, ids };
}
function loadSpoilers(slug) {
    if (!slug || typeof window === "undefined")
        return emptySpoilers();
    try {
        const raw = window.localStorage.getItem(spoilerKey(slug));
        if (!raw)
            return emptySpoilers();
        const parsed = JSON.parse(raw);
        return {
            brackets: readEntry(parsed.brackets),
            table: readEntry(parsed.table),
            calendar: readEntry(parsed.calendar),
        };
    }
    catch {
        return emptySpoilers();
    }
}
function isSpoilerTab(tab) {
    return tab === "brackets" || tab === "table" || tab === "calendar";
}
function fixtureHasResult(fixture) {
    return fixture.status === "finished" || fixture.games.length > 0;
}
function tabHasContent(tab, camp) {
    if (tab === "about")
        return Boolean(camp.description.trim()) || Boolean(camp.rules.trim()) || camp.prizeEnabled;
    if (tab === "roster")
        return camp.players.length > 0 || camp.registrationEnabled;
    if (tab === "table")
        return camp.fixtures.some(fixtureHasResult);
    return camp.fixtures.length > 0;
}
function tabBlock(tab, camp, preview = false) {
    if (preview ? !camp.showPreviews[tab] : !camp.showTabs[tab])
        return "admin";
    if (camp.devMode)
        return null;
    return tabHasContent(tab, camp) ? null : "empty";
}
function isTabFullyRevealed(tab, fixtures, entry) {
    if (entry.all)
        return true;
    if (tab === "table")
        return false;
    const withResult = fixtures.filter(fixtureHasResult);
    return withResult.length > 0 && withResult.every((fixture) => entry.ids.includes(fixture.id));
}
function dateLocaleOf(locale) {
    return locale === "en" ? "en-US" : "pt-BR";
}
function dayKeyFromDate(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function dayKeyFromIso(iso) {
    if (!iso)
        return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime()))
        return "";
    return dayKeyFromDate(date);
}
function parseDayKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    if (!match)
        return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
}
function startOfWeek(date) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    copy.setDate(copy.getDate() - copy.getDay());
    return copy;
}
function initialDayKey(fixtures) {
    const keys = [...new Set(fixtures.map((fixture) => dayKeyFromIso(fixture.scheduledAt)).filter(Boolean))].sort();
    const today = dayKeyFromDate(new Date());
    if (keys.length === 0)
        return today;
    return keys.find((key) => key >= today) ?? keys[keys.length - 1];
}
function formatBrl(cents) {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function playerName(camp, id) {
    if (!id)
        return "—";
    return camp.players.find((player) => player.id === id)?.name || "—";
}
export function CampeonatoPage() {
    const { slug = "", panel } = useParams();
    const { pathname, search } = useLocation();
    const [searchParams] = useSearchParams();
    const panelTab = tabFromPanel(panel);
    const base = panelBase(pathname);
    const preview = searchParams.get("preview") === "1";
    const panelInvalid = Boolean(panel && !panelTab);
    const { t, locale } = useTranslation();
    const { user, profile, profileLoadState, status } = useAuth();
    // Qualquer logado: RLS libera Modo Dev só para admin, dono ou quem pode lançar.
    const includeDev = status === "authenticated" && profileLoadState === "ready";
    const authReady = status !== "loading" && (status !== "authenticated" || profileLoadState === "ready");
    const [camp, setCamp] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [spoilersSlug, setSpoilersSlug] = useState(slug);
    const [spoilers, setSpoilers] = useState(() => loadSpoilers(slug));
    const [entryStatus, setEntryStatus] = useState(null);
    const [entryMessage, setEntryMessage] = useState(null);
    const [entryPending, setEntryPending] = useState(false);
    const [bracketsView, setBracketsView] = useState("list");
    if (spoilersSlug !== slug) {
        setSpoilersSlug(slug);
        setSpoilers(loadSpoilers(slug));
    }
    useEffect(() => {
        if (!slug || spoilersSlug !== slug)
            return;
        window.localStorage.setItem(spoilerKey(slug), JSON.stringify(spoilers));
    }, [slug, spoilers, spoilersSlug]);
    const activeTab = panelTab ?? "about";
    useEffect(() => {
        if (!authReady)
            return;
        if (panelInvalid) {
            setCamp(null);
            setLoading(false);
            setError(t("pages.championship.notFound"));
            return;
        }
        if (!isSupabaseConfigured()) {
            setLoading(false);
            setError(t("pages.championship.unconfigured"));
            return;
        }
        let cancelled = false;
        setLoading(true);
        void fetchChampionshipBySlug(slug, includeDev)
            .then((row) => {
            if (cancelled)
                return;
            setCamp(row);
            setError(row ? null : t("pages.championship.notFound"));
        })
            .catch((err) => {
            if (!cancelled)
                setError(err instanceof Error ? err.message : t("pages.championship.loadError"));
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [authReady, includeDev, panelInvalid, slug, t]);
    useEffect(() => {
        if (!camp || !user)
            return;
        let cancelled = false;
        void fetchMyChampionshipEntry(camp.id, user.id).then((value) => {
            if (!cancelled)
                setEntryStatus(value);
        });
        return () => {
            cancelled = true;
        };
    }, [camp, user]);
    const standings = useMemo(() => {
        if (!camp)
            return [];
        const rows = new Map(camp.players.map((player) => [player.id, { name: player.name, logoUrl: player.logoUrl, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }]));
        for (const fixture of camp.fixtures) {
            if (fixture.status !== "finished" || fixture.isBye || !fixture.playerAId || !fixture.playerBId)
                continue;
            const a = rows.get(fixture.playerAId);
            const b = rows.get(fixture.playerBId);
            if (!a || !b)
                continue;
            a.played += 1;
            b.played += 1;
            if (fixture.scoreA === fixture.scoreB) {
                a.draws += 1;
                b.draws += 1;
                a.points += 1;
                b.points += 1;
            }
            else if (fixture.scoreA > fixture.scoreB) {
                a.wins += 1;
                a.points += 3;
                b.losses += 1;
            }
            else {
                b.wins += 1;
                b.points += 3;
                a.losses += 1;
            }
        }
        return [...rows.values()].sort((left, right) => right.points - left.points || right.wins - left.wins || left.name.localeCompare(right.name));
    }, [camp]);
    function toggleRevealAll(scope) {
        const fixtures = camp?.fixtures ?? [];
        setSpoilers((current) => {
            const entry = current[scope];
            const fully = isTabFullyRevealed(scope, fixtures, entry);
            return { ...current, [scope]: fully ? { all: false, ids: [] } : { all: true, ids: entry.ids } };
        });
    }
    function revealFixture(scope, fixtureId) {
        setSpoilers((current) => {
            const entry = current[scope];
            if (entry.all || entry.ids.includes(fixtureId))
                return current;
            return { ...current, [scope]: { all: false, ids: [...entry.ids, fixtureId] } };
        });
    }
    function revealTable() {
        setSpoilers((current) => (current.table.all ? current : { ...current, table: { all: true, ids: [] } }));
    }
    const previewHeaderRef = useRef(null);
    const previewScrollerRef = useRef(null);
    const compactRef = useRef(0);
    const compactLockRef = useRef(0);
    function setPreviewCompact(next) {
        if (next === compactRef.current)
            return;
        compactRef.current = next;
        compactLockRef.current = performance.now() + 420;
        previewHeaderRef.current?.style.setProperty("--compact", String(next));
    }
    function syncPreviewCompact(deltaY) {
        if (performance.now() < compactLockRef.current)
            return;
        const scroller = previewScrollerRef.current;
        if (!scroller)
            return;
        if (deltaY > 6)
            setPreviewCompact(1);
        else if (deltaY < -6 && scroller.scrollTop <= 0)
            setPreviewCompact(0);
    }
    const onPreviewScroll = (event) => {
        if (event.currentTarget.scrollTop > 8)
            setPreviewCompact(1);
    };
    const onPreviewWheel = (event) => {
        if (event.ctrlKey || event.metaKey)
            return;
        const scroller = previewScrollerRef.current;
        if (scroller && !scroller.contains(event.target))
            scroller.scrollTop += event.deltaY;
        syncPreviewCompact(event.deltaY);
    };
    const touchYRef = useRef(null);
    const onPreviewTouchStart = (event) => {
        touchYRef.current = event.touches[0]?.clientY ?? null;
    };
    const onPreviewTouchMove = (event) => {
        const y = event.touches[0]?.clientY;
        if (y == null || touchYRef.current == null)
            return;
        const delta = touchYRef.current - y;
        touchYRef.current = y;
        syncPreviewCompact(delta);
    };
    useLayoutEffect(() => {
        previewHeaderRef.current?.style.setProperty("--compact", String(compactRef.current));
    });
    const tabs = [
        { id: "about", label: t("pages.championship.tabs.about") },
        { id: "brackets", label: t("pages.championship.tabs.brackets") },
        { id: "roster", label: t("pages.championship.tabs.roster") },
        { id: "table", label: t("pages.championship.tabs.table") },
        { id: "calendar", label: t("pages.championship.tabs.calendar") },
    ];
    const visibleTabs = camp ? tabs.filter((item) => tabBlock(item.id, camp, false) === null) : tabs;
    const sectionTab = panelTab ?? "about";
    const sectionBlock = camp && (panel || preview) ? tabBlock(sectionTab, camp, preview) : null;
    const shownTab = visibleTabs.some((item) => item.id === activeTab) ? activeTab : (visibleTabs[0]?.id ?? "about");
    const championshipPath = camp ? tabPath(base, camp.slug, "about") : "/campeonato";
    useEffect(() => {
        compactRef.current = 0;
        compactLockRef.current = 0;
        previewHeaderRef.current?.style.setProperty("--compact", "0");
    }, [slug, preview, shownTab]);
    if (camp && panel && panelTab === "about" && sectionBlock == null) {
        return _jsx(Navigate, { to: tabPath(base, slug, "about", preview), replace: true });
    }
    if (camp && panel && !preview && sectionBlock === "empty") {
        const next = visibleTabs[0]?.id;
        if (next)
            return _jsx(Navigate, { to: tabPath(base, slug, next), replace: true });
    }
    if (camp && !preview && !sectionBlock && shownTab !== activeTab) {
        return _jsx(Navigate, { to: tabPath(base, slug, shownTab), replace: true });
    }
    if (camp && !panel && !preview && visibleTabs.length > 0 && !visibleTabs.some((item) => item.id === activeTab)) {
        return _jsx(Navigate, { to: tabPath(base, slug, shownTab), replace: true });
    }
    const championshipLoading = loading && !camp;
    const championshipMissing = !loading && !camp && Boolean(error);
    const centeredNotice = championshipLoading || championshipMissing;
    return (_jsxs("div", { className: "relative min-h-dvh bg-[#07080c] text-zinc-100", children: [_jsx(ParticleField, {}), _jsx("div", { className: "pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.72)_78%)]" }), _jsxs("div", { className: cn("relative mx-auto px-4 sm:px-6", centeredNotice
                    ? "flex min-h-dvh max-w-3xl items-center justify-center"
                    : cn(shownTab === "calendar" && !sectionBlock
                        ? "max-w-[90rem]"
                        : shownTab === "roster" && !sectionBlock
                            ? "max-w-6xl"
                            : "max-w-5xl", preview || sectionBlock ? "flex h-dvh max-h-dvh flex-col overflow-hidden pt-3" : "py-8")), onWheel: preview ? onPreviewWheel : undefined, onTouchStart: preview ? onPreviewTouchStart : undefined, onTouchMove: preview ? onPreviewTouchMove : undefined, children: [championshipLoading ? (_jsxs("div", { className: "flex flex-col items-center px-4 text-center", children: [_jsx("p", { className: "font-[family-name:var(--font-display)] text-4xl leading-tight tracking-wide text-amber-50 sm:text-6xl", children: t("pages.championship.loading").replace(/[.…]+$/, "") }), _jsx(ChampionshipLoadingSpinner, {})] })) : championshipMissing ? (_jsxs("div", { className: "flex flex-col items-center px-4 text-center", children: [_jsx("p", { className: "font-[family-name:var(--font-display)] text-4xl leading-tight tracking-wide text-amber-50 sm:text-6xl", children: error?.replace(/\.$/, "") }), _jsx(ChampionshipMissingIcon, {})] })) : null, centeredNotice || preview || sectionBlock ? null : (_jsxs("div", { className: "mb-8 flex items-center justify-between text-sm", children: [_jsx(Link, { to: "/", className: "font-[family-name:var(--font-display)] tracking-wide text-amber-100/90", children: "Aprendendo AGE" }), _jsx(Link, { to: "/campeonato", className: "text-zinc-400 hover:text-amber-100", children: t("pages.championship.backToIndex") })] })), centeredNotice || !loading ? null : _jsx("p", { className: "text-zinc-400", children: t("pages.championship.loading") }), centeredNotice || !error ? null : _jsx("p", { className: "text-red-200", children: error }), camp && sectionBlock ? (_jsx(HiddenSection, { camp: camp, message: sectionBlock === "admin" ? t("pages.championship.hiddenByAdmin") : t("pages.championship.emptySection"), backTo: championshipPath, backLabel: t("pages.championship.backToChampionship") })) : camp ? (_jsxs(_Fragment, { children: [preview ? (_jsx(PreviewStage, { ref: previewHeaderRef, camp: camp, tabLabel: tabs.find((item) => item.id === shownTab)?.label ?? "", backTo: championshipPath, backLabel: t("pages.championship.backToChampionship"), reveal: isSpoilerTab(shownTab) ? (_jsx(RevealAllButton, { revealed: isTabFullyRevealed(shownTab, camp.fixtures, spoilers[shownTab]), revealLabel: t("pages.championship.revealAll"), hideLabel: t("pages.championship.hideResults"), onClick: () => toggleRevealAll(shownTab) })) : null })) : (_jsxs("header", { className: "flex flex-col gap-5 sm:flex-row sm:items-center", children: [camp.logoUrl ? _jsx(ChampionshipEmblem, { src: camp.logoUrl, className: "mx-12 h-28 w-28", burst: 1.78 }) : null, _jsxs("div", { children: [_jsxs("div", { className: "text-xs uppercase tracking-[0.2em] text-amber-200/80", children: [t(PHASE_KEY[camp.phase]), camp.devMode ? " · Modo Dev" : ""] }), _jsx("h1", { className: "font-[family-name:var(--font-display)] text-4xl text-amber-50", children: camp.name }), camp.subtitle ? _jsx(ChampionshipMarkdown, { source: camp.subtitle, className: "mt-2 max-w-2xl text-base text-zinc-100 sm:text-lg" }) : null] })] })), preview || visibleTabs.length === 0 ? null : (_jsxs("div", { className: "relative z-20 mt-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3", children: [visibleTabs.map((item) => (_jsx(Link, { to: tabPath(base, camp.slug, item.id), "aria-current": shownTab === item.id ? "page" : undefined, className: `rounded-full px-3 py-1 text-sm ${shownTab === item.id ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40" : "text-zinc-400 hover:text-zinc-100"}`, children: item.label }, item.id))), _jsxs("div", { className: "ml-auto flex items-center gap-2", children: [isSpoilerTab(shownTab) ? (_jsx(RevealAllButton, { revealed: isTabFullyRevealed(shownTab, camp.fixtures, spoilers[shownTab]), revealLabel: t("pages.championship.revealAll"), hideLabel: t("pages.championship.hideResults"), onClick: () => toggleRevealAll(shownTab) })) : null, camp.showPreviews[shownTab] ? (_jsx(PreviewLink, { href: tabPath(base, camp.slug, shownTab, true), label: t("pages.championship.openPreview") })) : null] })] })), preview || visibleTabs.length > 0 ? (_jsxs("div", { ref: previewScrollerRef, className: cn(preview ? "min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-10" : "mt-6"), onScroll: preview ? onPreviewScroll : undefined, children: [shownTab === "about" ? (_jsxs("div", { className: "space-y-6", children: [camp.description ? (_jsxs("section", { className: "rounded-2xl border border-white/10 bg-black/35 p-5", children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-amber-100", children: t("pages.championship.description") }), _jsx(ChampionshipMarkdown, { source: camp.description, className: "mt-3" })] })) : null, camp.rules ? (_jsxs("section", { className: "rounded-2xl border border-white/10 bg-black/35 p-5", children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-amber-100", children: t("pages.championship.rules") }), _jsx(ChampionshipMarkdown, { source: camp.rules, className: "mt-3" })] })) : null, camp.prizeEnabled ? _jsx(PrizeBlock, { camp: camp }) : null] })) : null, shownTab === "brackets" ? (_jsxs("div", { className: "space-y-4", children: [camp.stages.length > 0 ? (_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: () => setBracketsView("list"), className: cn("rounded-full px-3 py-1 text-sm", bracketsView === "list"
                                                            ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40"
                                                            : "text-zinc-400 hover:text-zinc-100"), children: "Lista" }), _jsx("button", { type: "button", onClick: () => setBracketsView("bracket"), className: cn("rounded-full px-3 py-1 text-sm", bracketsView === "bracket"
                                                            ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40"
                                                            : "text-zinc-400 hover:text-zinc-100"), children: "Chave" })] })) : null, bracketsView === "bracket" && camp.stages.length > 0 ? (_jsx(ChampionshipBracketView, { camp: camp, revealedAll: spoilers.brackets.all, revealedIds: spoilers.brackets.ids, onReveal: (fixtureId) => revealFixture("brackets", fixtureId) })) : (_jsx(BracketList, { camp: camp, revealedAll: spoilers.brackets.all, revealedIds: spoilers.brackets.ids, onReveal: (fixtureId) => revealFixture("brackets", fixtureId) }))] })) : null, shownTab === "roster" ? (_jsx(Roster, { camp: camp, entryStatus: entryStatus, entryMessage: entryMessage, pending: entryPending, loggedIn: status === "authenticated", loginTo: `${localeAuthPath(locale, "login")}?next=${encodeURIComponent(`${pathname}${search}`)}`, onSubmit: () => {
                                            if (!user)
                                                return;
                                            setEntryPending(true);
                                            setEntryMessage(null);
                                            void submitChampionshipEntry({
                                                championshipId: camp.id,
                                                profileId: user.id,
                                                displayName: (profile?.displayName || profile?.aomstatsAlias || "Jogador")
                                                    .replace(/<color\b[^>]*>/gi, "")
                                                    .replace(/<\/color>/gi, "")
                                                    .trim() || "Jogador",
                                                logoPath: profile?.logoPath ?? null,
                                            }).then((res) => {
                                                setEntryPending(false);
                                                if (!res.ok) {
                                                    setEntryMessage(res.message);
                                                    return;
                                                }
                                                setEntryStatus("pending");
                                                setEntryMessage(t("pages.championship.entrySent"));
                                            });
                                        } })) : null, shownTab === "table" ? (_jsxs("div", { className: cn("relative rounded-2xl border border-white/10", spoilers.table.all ? "overflow-visible" : "overflow-hidden"), children: [_jsxs("table", { className: cn("w-full text-left text-sm", !spoilers.table.all && "pointer-events-none select-none"), children: [_jsx("thead", { className: "bg-black/40 text-zinc-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2", children: "#" }), _jsx("th", { className: "px-3 py-2", children: t("pages.championship.player") }), _jsx(StatHead, { label: t("pages.championship.played"), children: _jsx(PlayedIcon, {}) }), _jsx(StatHead, { label: t("pages.championship.wins"), tone: "text-emerald-400", children: _jsx(WinsIcon, {}) }), _jsx(StatHead, { label: t("pages.championship.draws"), tone: "text-yellow-300", children: _jsx(DrawsIcon, {}) }), _jsx(StatHead, { label: t("pages.championship.losses"), tone: "text-red-400", children: _jsx(LossesIcon, {}) }), _jsx(StatHead, { label: t("pages.championship.points"), children: _jsx(PointsIcon, {}) })] }) }), _jsx("tbody", { children: standings.map((row, index) => (_jsxs("tr", { className: "border-t border-white/5", children: [_jsx("td", { className: "px-3 py-2 text-zinc-500", children: index + 1 }), _jsx("td", { className: "px-3 py-2", children: _jsxs("span", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-900", children: _jsx(PlayerAvatarMark, { src: row.logoUrl, className: "h-full w-full", width: 32, height: 32 }) }), _jsx("span", { children: row.name })] }) }), _jsx("td", { className: "px-3 py-2 text-center", children: row.played }), _jsx("td", { className: "px-3 py-2 text-center text-emerald-400", children: row.wins }), _jsx("td", { className: "px-3 py-2 text-center text-yellow-300", children: row.draws }), _jsx("td", { className: "px-3 py-2 text-center text-red-400", children: row.losses }), _jsx("td", { className: "px-3 py-2 text-center text-amber-100", children: row.points })] }, row.name))) })] }), !spoilers.table.all ? (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-sm text-zinc-200 backdrop-blur-sm", children: [_jsx("span", { children: t("pages.championship.tableHidden") }), _jsx(RevealThisButton, { label: t("pages.championship.revealThis"), onClick: revealTable })] })) : null] })) : null, _jsx("div", { className: shownTab === "calendar" ? "block" : "hidden", children: _jsx(Calendar, { camp: camp, revealedAll: spoilers.calendar.all, revealedIds: spoilers.calendar.ids, onReveal: (fixtureId) => revealFixture("calendar", fixtureId) }) })] })) : null] })) : null] })] }));
}
function ChampionshipLoadingSpinner() {
    return (_jsxs("span", { className: "relative mt-12 inline-flex h-20 w-20 items-center justify-center text-amber-200/80", "aria-hidden": true, children: [_jsx("span", { className: "absolute inset-0 animate-spin rounded-full border border-amber-200/20 border-t-amber-100 drop-shadow-[0_0_22px_rgba(251,191,36,0.35)]" }), _jsx("span", { className: "h-10 w-10 animate-spin rounded-full border border-amber-200/45 border-b-transparent [animation-duration:1.6s] [animation-direction:reverse]" })] }));
}
function ChampionshipMissingIcon() {
    return (_jsxs("svg", { viewBox: "0 0 64 72", "aria-hidden": "true", className: "mt-12 h-20 w-20 text-amber-200/80 drop-shadow-[0_0_22px_rgba(251,191,36,0.35)]", children: [_jsx("path", { d: "M32 4 56 14.5v18.2C56 49.2 46.2 59.4 32 68 17.8 59.4 8 49.2 8 32.7V14.5L32 4Z", fill: "none", stroke: "currentColor", strokeWidth: "1.25", strokeLinejoin: "round" }), _jsx("path", { d: "M32 24v18", fill: "none", stroke: "currentColor", strokeWidth: "1.25", strokeLinecap: "round" }), _jsx("circle", { cx: "32", cy: "50", r: "1.4", fill: "currentColor" })] }));
}
function HiddenSection({ camp, message, backTo, backLabel }) {
    return (_jsxs("div", { className: "flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-16 text-center", children: [_jsx(Link, { to: backTo, className: "mb-10 text-xs uppercase tracking-[0.18em] text-zinc-500 hover:text-amber-100", children: backLabel }), camp.logoUrl ? _jsx(ChampionshipEmblem, { src: camp.logoUrl, className: "h-40 w-40", burst: 1.82 }) : null, _jsx("p", { className: "mt-10 max-w-md text-sm leading-6 text-zinc-300", children: message })] }));
}
function PrizeWind() {
    return (_jsxs("div", { className: "epic-wind", "aria-hidden": true, children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }));
}
function PrizeBlock({ camp }) {
    const { t } = useTranslation();
    const raised = camp.prizeRaisedCents ?? 0;
    const goal = camp.prizeGoalCents ?? 0;
    const ratio = goal > 0 ? Math.min(1, raised / goal) : 0;
    const ordered = [...camp.places].sort((a, b) => a.place - b.place);
    const podium = ordered.length === 3 ? [ordered[1], ordered[0], ordered[2]] : ordered;
    return (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "epic-gold-glow", "aria-hidden": true }), _jsxs("section", { className: "relative overflow-hidden rounded-2xl border border-amber-200/25 bg-black/55 p-5 shadow-lg shadow-black/40", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#3a2a12_0%,#120e09_58%,#07080c_100%)]" }), _jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/62 to-black/75" }), _jsx(PrizeWind, {}), _jsxs("div", { className: "relative z-[3]", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-amber-100", children: camp.prizeMode === "donations" ? t("pages.championship.prizeDonations") : t("pages.championship.prizeFixed") }), camp.prizeNote ? _jsx("p", { className: "mt-2 max-w-xl text-sm text-zinc-300", children: camp.prizeNote }) : null] }), camp.prizeMode === "donations" ? (_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-xs uppercase text-zinc-400", children: t("pages.championship.raised") }), _jsx("div", { className: "font-[family-name:var(--font-display)] text-2xl text-amber-50", children: formatBrl(raised) }), goal > 0 ? _jsxs("div", { className: "text-xs text-zinc-400", children: [t("pages.championship.goal"), " ", formatBrl(goal)] }) : null] })) : null] }), camp.prizeMode === "donations" && goal > 0 ? (_jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "h-1.5 overflow-hidden rounded-full bg-zinc-800", children: _jsx("div", { className: "h-full bg-amber-300", style: { width: `${ratio * 100}%` } }) }), _jsxs("div", { className: "mt-1 text-xs text-zinc-400", children: [Math.round(ratio * 1000) / 10, "% ", t("pages.championship.ofGoal")] })] })) : null, _jsx("div", { className: "mt-5 grid items-end gap-3 sm:grid-cols-3", children: podium.map((place) => {
                                    const amount = camp.prizeMode === "donations"
                                        ? place.sharePercent != null
                                            ? Math.round(raised * (place.sharePercent / 100))
                                            : null
                                        : place.amountCents;
                                    const highlight = place.place === 1;
                                    return (_jsxs("div", { className: cn("relative overflow-hidden rounded-xl border", highlight
                                            ? "border-amber-200/80 bg-amber-950/50 px-4 py-6 shadow-[0_0_32px_rgba(255,196,70,0.38)] sm:-translate-y-3 sm:py-8"
                                            : "border-white/10 bg-black/35 p-4"), children: [highlight ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "epic-gold-glow-inset", "aria-hidden": true }), _jsx(PrizeWind, {})] })) : null, _jsxs("div", { className: "relative z-[3]", children: [_jsxs("div", { className: cn("text-xs uppercase tracking-[0.16em]", highlight ? "text-amber-200" : "text-zinc-400"), children: [place.label || `${place.place}º`, camp.prizeMode === "donations" && place.sharePercent != null ? ` (${place.sharePercent.toFixed(2)}%)` : ""] }), _jsx("div", { className: cn("mt-1 text-amber-50", highlight ? "font-[family-name:var(--font-display)] text-3xl" : "text-xl"), children: amount != null ? formatBrl(amount) : "—" })] })] }, place.place));
                                }) })] })] })] }));
}
function StatHead({ label, tone, children }) {
    return (_jsx("th", { className: "px-3 py-2 text-center", children: _jsxs("span", { className: "group/stat relative inline-flex", children: [_jsx("span", { className: cn("inline-flex", tone), "aria-label": label, children: children }), _jsx("span", { role: "tooltip", className: "pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-2.5 py-1.5 text-xs font-normal text-zinc-200 opacity-0 shadow-xl shadow-black/40 transition duration-150 group-hover/stat:opacity-100 group-focus-within/stat:opacity-100", children: label })] }) }));
}
function StatIcon({ children }) {
    return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", children: children }));
}
function PlayedIcon() {
    return _jsx(CrossedSwords, { className: "h-4 w-4" });
}
function WinsIcon() {
    return (_jsxs(StatIcon, { children: [_jsx("path", { d: "M8 20h8" }), _jsx("path", { d: "M12 16v4" }), _jsx("path", { d: "M7 3h10v6a5 5 0 0 1-10 0V3Z" }), _jsx("path", { d: "M7 5.5H4.2a3 3 0 0 0 3 4.2" }), _jsx("path", { d: "M17 5.5h2.8a3 3 0 0 1-3 4.2" })] }));
}
function DrawsIcon() {
    return (_jsxs(StatIcon, { children: [_jsx("circle", { cx: "12", cy: "12", r: "8" }), _jsx("path", { d: "M8 10h8M8 14h8" })] }));
}
function LossesIcon() {
    return (_jsxs(StatIcon, { children: [_jsx("circle", { cx: "12", cy: "12", r: "8" }), _jsx("path", { d: "m9 9 6 6M15 9l-6 6" })] }));
}
function PointsIcon() {
    return (_jsx(StatIcon, { children: _jsx("path", { d: "m12 3 2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L12 15.6 7 18.1l1.2-5.5L4 8.8l5.6-.6L12 3Z" }) }));
}
function EyeIcon({ off }) {
    return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", children: off ? (_jsxs(_Fragment, { children: [_jsx("path", { d: "M3 3l18 18" }), _jsx("path", { d: "M10.6 6.2A10.6 10.6 0 0 1 12 6c5.5 0 9.2 4.2 10 6-.3.7-1 1.8-2 2.9" }), _jsx("path", { d: "M6.1 6.7C4 8.1 2.6 10.2 2 12c.8 1.8 4.5 6 10 6 1.5 0 2.9-.3 4.1-.9" }), _jsx("path", { d: "M9.9 9.9a3 3 0 0 0 4.2 4.2" })] })) : (_jsxs(_Fragment, { children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] })) }));
}
function RevealAllButton({ revealed, revealLabel, hideLabel, onClick, }) {
    const label = revealed ? hideLabel : revealLabel;
    return (_jsxs("div", { className: "group/eye relative shrink-0", children: [_jsx("button", { type: "button", "aria-pressed": revealed, "aria-label": label, onClick: onClick, className: cn("inline-flex h-8 w-8 items-center justify-center rounded-full border transition", revealed
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                    : "border-white/10 text-zinc-400 hover:border-amber-400/40 hover:text-amber-100"), children: _jsx(EyeIcon, { off: !revealed }) }), _jsx("div", { role: "tooltip", className: "pointer-events-none absolute top-full right-0 z-30 mt-2 whitespace-nowrap rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-2.5 py-1.5 text-xs text-zinc-200 opacity-0 shadow-xl shadow-black/40 transition duration-150 group-hover/eye:opacity-100 group-focus-within/eye:opacity-100", children: label })] }));
}
function MonitorIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "12", rx: "2" }), _jsx("path", { d: "M8 20h8" }), _jsx("path", { d: "M12 16v4" })] }));
}
function PreviewLink({ href, label }) {
    return (_jsxs("div", { className: "group/preview relative shrink-0", children: [_jsx(Link, { to: href, target: "_blank", rel: "noreferrer", "aria-label": label, className: "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:border-amber-400/40 hover:text-amber-100", children: _jsx(MonitorIcon, {}) }), _jsx("div", { role: "tooltip", className: "pointer-events-none absolute top-full right-0 z-30 mt-2 whitespace-nowrap rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-2.5 py-1.5 text-xs text-zinc-200 opacity-0 shadow-xl shadow-black/40 transition duration-150 group-hover/preview:opacity-100 group-focus-within/preview:opacity-100", children: label })] }));
}
const PreviewStage = forwardRef(function PreviewStage({ camp, tabLabel, backTo, backLabel, reveal }, ref) {
    const { t } = useTranslation();
    const frame = "calc(12rem - var(--compact) * 7.25rem)";
    return (_jsxs("header", { ref: ref, className: "preview-stage relative z-30 shrink-0 px-1 pb-2", children: [_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute -inset-x-8 -top-8 -bottom-28", style: {
                    background: "radial-gradient(ellipse 78% 68% at 50% 34%, rgba(7,8,12,0.94) 0%, rgba(7,8,12,0.62) 42%, rgba(7,8,12,0.22) 64%, rgba(7,8,12,0) 78%)",
                } }), _jsxs("div", { className: "relative flex items-center justify-between gap-3", children: [_jsx(Link, { to: backTo, className: "text-xs text-zinc-500 hover:text-amber-100", children: backLabel }), reveal ? _jsx("div", { className: "shrink-0", children: reveal }) : _jsx("span", {})] }), _jsxs("div", { className: "flex flex-col items-center text-center", style: { marginTop: "calc(0.85rem - var(--compact) * 0.55rem)" }, children: [camp.logoUrl ? (_jsx(ChampionshipEmblem, { src: camp.logoUrl, burst: 1.82, style: { width: frame, height: frame, marginTop: `calc(${frame} * 0.34)`, marginBottom: `calc(${frame} * 0.22)` } })) : null, _jsxs("div", { className: "uppercase text-amber-200/75", style: {
                            marginTop: "calc(0.35rem - var(--compact) * 0.15rem)",
                            fontSize: "calc(0.75rem - var(--compact) * 0.125rem)",
                            letterSpacing: "0.28em",
                        }, children: [t(PHASE_KEY[camp.phase]), camp.devMode ? " · Modo Dev" : ""] }), _jsx("h1", { className: "max-w-4xl font-[family-name:var(--font-display)] leading-none text-amber-50", style: {
                            marginTop: "calc(0.7rem - var(--compact) * 0.4rem)",
                            fontSize: "clamp(1.55rem, calc(3.4rem - var(--compact) * 1.85rem), 3.4rem)",
                        }, children: camp.name }), _jsx("p", { className: "uppercase text-zinc-400", style: {
                            marginTop: "calc(0.65rem - var(--compact) * 0.35rem)",
                            fontSize: "calc(0.8rem - var(--compact) * 0.15rem)",
                            letterSpacing: "0.22em",
                        }, children: tabLabel })] })] }));
});
function RevealThisButton({ label, onClick }) {
    return (_jsx("button", { type: "button", onClick: onClick, className: "rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100 transition hover:bg-amber-400/20", children: label }));
}
function FixtureCard({ camp, fixture, revealed, onReveal, layout = "row", }) {
    const { t, locale } = useTranslation();
    const dateLocale = dateLocaleOf(locale);
    const when = fixture.scheduledAt ? new Date(fixture.scheduledAt) : null;
    const hasResult = fixtureHasResult(fixture);
    const visible = revealed && hasResult;
    const whenLabel = !when || Number.isNaN(when.getTime())
        ? ""
        : when.toLocaleString(dateLocale, {
            day: "2-digit",
            month: "short",
            ...(layout === "stack" ? {} : { year: "numeric" }),
            hour: "2-digit",
            minute: "2-digit",
        });
    const playerA = camp.players.find((player) => player.id === fixture.playerAId) ?? {
        name: fixture.feederA || playerName(camp, fixture.playerAId),
        logoUrl: "",
    };
    const playerB = camp.players.find((player) => player.id === fixture.playerBId) ?? {
        name: fixture.feederB || playerName(camp, fixture.playerBId),
        logoUrl: "",
    };
    const games = visible && fixture.games.length > 0 ? fixture.games : [null];
    const compact = layout === "stack";
    return (_jsx("div", { className: cn("grid min-w-0", compact ? "gap-2" : "gap-3"), children: games.map((game, index) => (_jsx(EpicMatchCard, { locale: locale, campLogoUrl: camp.logoUrl, playerA: { name: playerA.name, logoUrl: playerA.logoUrl }, playerB: { name: playerB.name, logoUrl: playerB.logoUrl }, scoreA: visible ? fixture.scoreA : null, scoreB: visible ? fixture.scoreB : null, mapName: game?.mapName ?? "", godA: game?.godA ?? "", godB: game?.godB ?? "", winner: visible ? (game ? game.winnerSide : fixture.scoreA === fixture.scoreB ? null : fixture.scoreA > fixture.scoreB ? "A" : "B") : null, whenLabel: whenLabel, roundLabel: fixture.seriesLength === 1
                ? `${fixture.roundLabel} · MD1`
                : fixture.seriesLength === 5
                    ? `${fixture.roundLabel} · MD5`
                    : fixture.seriesLength === 7
                        ? `${fixture.roundLabel} · MD7`
                        : fixture.seriesLength === 3
                            ? `${fixture.roundLabel} · MD3`
                            : fixture.roundLabel, links: visible ? fixture.links : [], revealed: visible, compact: compact, revealLabel: t("pages.championship.revealThis"), victoryLabel: (name) => t("pages.championship.victory", { name }), watchLabel: t("pages.championship.watch"), onReveal: index === 0 && hasResult && !revealed ? onReveal : undefined }, game?.id ?? fixture.id))) }));
}
function BracketList({ camp, revealedAll, revealedIds, onReveal, }) {
    const listFixtures = camp.fixtures.filter((fixture) => !fixture.isBye && !fixture.isHidden);
    const rounds = [...new Set(listFixtures.map((fixture) => fixture.roundLabel))];
    if (rounds.length === 0)
        return _jsx("p", { className: "text-sm text-zinc-500", children: "\u2014" });
    return (_jsx("div", { className: "space-y-6", children: rounds.map((round) => (_jsxs("section", { children: [_jsx("h2", { className: "mb-3 font-[family-name:var(--font-display)] text-amber-100", children: round }), _jsx("div", { className: "grid gap-3", children: listFixtures
                        .filter((fixture) => fixture.roundLabel === round)
                        .map((fixture) => (_jsx(FixtureCard, { camp: camp, fixture: fixture, revealed: revealedAll || revealedIds.includes(fixture.id), onReveal: () => onReveal(fixture.id) }, fixture.id))) })] }, round))) }));
}
function weekdayInitials(dateLocale) {
    const sunday = new Date(2026, 0, 4, 12);
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + index);
        return date.toLocaleDateString(dateLocale, { weekday: "narrow" });
    });
}
function formatWeekLabel(start, dateLocale) {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        const endLabel = end.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
        return `${start.getDate()} – ${endLabel}`;
    }
    const startLabel = start.toLocaleDateString(dateLocale, { day: "numeric", month: "short" });
    const endLabel = end.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
    return `${startLabel} – ${endLabel}`;
}
function CalendarViewToggle({ view, onChange }) {
    const { t } = useTranslation();
    const options = [
        { id: "week", label: t("pages.championship.calendarWeek") },
        { id: "month", label: t("pages.championship.calendarMonth") },
    ];
    return (_jsx("div", { role: "group", "aria-label": t("pages.championship.calendarView"), className: "inline-flex rounded-lg border border-white/10 bg-zinc-900/50 p-0.5", children: options.map((option) => (_jsx("button", { type: "button", "aria-pressed": view === option.id, onClick: () => onChange(option.id), className: cn("rounded-md px-2.5 py-1 text-xs font-medium transition", view === option.id ? "bg-amber-500/20 text-amber-100" : "text-zinc-400 hover:text-zinc-200"), children: option.label }, option.id))) }));
}
function CrossedSwords({ className }) {
    return (_jsxs("svg", { viewBox: "0 0 24 24", className: className, "aria-hidden": true, children: [_jsx("path", { fill: "currentColor", d: "M3.2 18.9 12.6 9.5l1.6 1.6-9.4 9.4c-.45.45-1.15.45-1.6 0s-.45-1.15 0-1.6Z" }), _jsx("path", { fill: "currentColor", d: "M13.7 6.8 17.4 3.1c.35-.35.9-.35 1.25 0l1.25 1.25c.35.35.35.9 0 1.25L16.2 9.2 13.7 6.8Z" }), _jsx("path", { fill: "currentColor", d: "M20.8 18.9 11.4 9.5 9.8 11.1l9.4 9.4c.45.45 1.15.45 1.6 0s.45-1.15 0-1.6Z" }), _jsx("path", { fill: "currentColor", d: "M10.3 6.8 6.6 3.1c-.35-.35-.9-.35-1.25 0L4.1 4.35c-.35.35-.35.9 0 1.25L7.8 9.2l2.5-2.4Z" }), _jsx("circle", { cx: "12", cy: "13.4", r: "1.15", fill: "currentColor" })] }));
}
function CheckMark({ className }) {
    return (_jsx("svg", { viewBox: "0 0 24 24", className: className, "aria-hidden": true, fill: "none", children: _jsx("path", { d: "m6 12.5 4 4 8-9", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
function FixtureMonthCalendar({ markedDays, finishedDays, selectedKey, onSelect, }) {
    const { t, locale } = useTranslation();
    const dateLocale = dateLocaleOf(locale);
    const todayKey = dayKeyFromDate(new Date());
    const [cursor, setCursor] = useState(() => {
        const base = parseDayKey(selectedKey) ?? new Date();
        return { year: base.getFullYear(), month: base.getMonth() };
    });
    useEffect(() => {
        const base = parseDayKey(selectedKey);
        if (!base)
            return;
        setCursor({ year: base.getFullYear(), month: base.getMonth() });
    }, [selectedKey]);
    const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
    const title = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    const cells = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
    function shift(delta) {
        setCursor((current) => {
            const next = new Date(current.year, current.month + delta, 1);
            return { year: next.getFullYear(), month: next.getMonth() };
        });
    }
    return (_jsxs("div", { className: "mx-auto w-full max-w-md rounded-3xl border border-amber-500/25 bg-zinc-950 p-5 shadow-lg shadow-black/40", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h3", { className: "font-[family-name:var(--font-display)] text-lg tracking-wide text-amber-100", children: title }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", "aria-label": t("pages.championship.prevMonth"), className: "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-zinc-900 text-lg text-amber-100 hover:border-amber-400 hover:bg-zinc-800", onClick: () => shift(-1), children: "\u2039" }), _jsx("button", { type: "button", "aria-label": t("pages.championship.nextMonth"), className: "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-zinc-900 text-lg text-amber-100 hover:border-amber-400 hover:bg-zinc-800", onClick: () => shift(1), children: "\u203A" })] })] }), _jsx("div", { className: "mt-5 grid grid-cols-7 text-center text-xs font-medium tracking-wide text-zinc-500", children: weekdayInitials(dateLocale).map((label, index) => (_jsx("span", { children: label }, `${label}-${index}`))) }), _jsx("div", { className: "mt-3 grid grid-cols-7 justify-items-center gap-y-2", children: cells.map((day, index) => {
                    if (day == null)
                        return _jsx("span", { className: "h-10 w-10" }, `empty-${index}`);
                    const key = dayKeyFromDate(new Date(cursor.year, cursor.month, day));
                    const selected = key === selectedKey;
                    const today = key === todayKey;
                    const marked = markedDays.has(key);
                    const finished = finishedDays.has(key);
                    return (_jsxs("button", { type: "button", onClick: () => onSelect(key), className: cn("relative inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition", selected
                            ? "bg-amber-400 text-zinc-950"
                            : finished
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : marked
                                    ? "bg-blue-600 text-white hover:bg-blue-500"
                                    : "bg-amber-300/15 text-amber-100/75 hover:bg-amber-300/25", !selected && today && "ring-2 ring-amber-300/80"), children: [_jsx("span", { className: cn("leading-none", marked && "-translate-y-1"), children: day }), finished ? (_jsx(CheckMark, { className: cn("absolute bottom-0.5 h-3 w-3", selected ? "text-zinc-900" : "text-emerald-50") })) : marked ? (_jsx(CrossedSwords, { className: cn("absolute bottom-0.5 h-3 w-3", selected ? "text-zinc-900" : "text-sky-100") })) : null] }, key));
                }) }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-zinc-400", children: [_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-amber-300/40" }), t("pages.championship.legendOpen")] }), _jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { className: "inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-sky-100", children: _jsx(CrossedSwords, { className: "h-3 w-3" }) }), t("pages.championship.legendMatch")] }), _jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { className: "inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-emerald-50", children: _jsx(CheckMark, { className: "h-3 w-3" }) }), t("pages.championship.legendFinished")] }), _jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-amber-400" }), t("pages.championship.legendSelected")] })] })] }));
}
function Calendar({ camp, revealedAll, revealedIds, onReveal, }) {
    const { t, locale } = useTranslation();
    const dateLocale = dateLocaleOf(locale);
    const [view, setView] = useState("week");
    const [campId, setCampId] = useState(camp.id);
    const [selectedKey, setSelectedKey] = useState(() => initialDayKey(camp.fixtures));
    if (campId !== camp.id) {
        setCampId(camp.id);
        setSelectedKey(initialDayKey(camp.fixtures));
        setView("week");
    }
    const markedDays = useMemo(() => new Set(camp.fixtures
        .filter((fixture) => !fixture.isBye && !fixture.isHidden)
        .map((fixture) => dayKeyFromIso(fixture.scheduledAt))
        .filter(Boolean)), [camp.fixtures]);
    const finishedDays = useMemo(() => {
        return new Set([...markedDays].filter((key) => {
            const dayFixtures = camp.fixtures.filter((fixture) => dayKeyFromIso(fixture.scheduledAt) === key && fixture.status !== "cancelled");
            return dayFixtures.length > 0 && dayFixtures.every((fixture) => fixture.status === "finished");
        }));
    }, [camp.fixtures, markedDays]);
    const selectedDate = parseDayKey(selectedKey) ?? new Date();
    const weekStart = startOfWeek(selectedDate);
    const todayKey = dayKeyFromDate(new Date());
    const weekDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
    });
    function shiftWeek(delta) {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + delta * 7);
        setSelectedKey(dayKeyFromDate(next));
    }
    function revealed(fixtureId) {
        return revealedAll || revealedIds.includes(fixtureId);
    }
    const dayFixtures = camp.fixtures.filter((fixture) => dayKeyFromIso(fixture.scheduledAt) === selectedKey);
    return (_jsxs("div", { children: [_jsx("div", { className: "mb-4 flex justify-end", children: _jsx(CalendarViewToggle, { view: view, onChange: setView }) }), camp.fixtures.length === 0 ? _jsx("p", { className: "mb-4 text-sm text-zinc-500", children: t("pages.championship.noFixtures") }) : null, view === "week" ? (_jsxs("div", { children: [_jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [_jsx("button", { type: "button", "aria-label": t("pages.championship.prevWeek"), className: "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-zinc-900 text-lg text-amber-100 hover:border-amber-400 hover:bg-zinc-800", onClick: () => shiftWeek(-1), children: "\u2039" }), _jsx("h3", { className: "text-center font-[family-name:var(--font-display)] text-lg tracking-wide text-amber-100", children: formatWeekLabel(weekStart, dateLocale) }), _jsx("button", { type: "button", "aria-label": t("pages.championship.nextWeek"), className: "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-zinc-900 text-lg text-amber-100 hover:border-amber-400 hover:bg-zinc-800", onClick: () => shiftWeek(1), children: "\u203A" })] }), _jsx("div", { className: "flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 xl:grid xl:grid-cols-7 xl:overflow-visible", children: weekDays.map((date) => {
                            const key = dayKeyFromDate(date);
                            const fixtures = camp.fixtures.filter((fixture) => dayKeyFromIso(fixture.scheduledAt) === key);
                            const isToday = key === todayKey;
                            const weekday = date.toLocaleDateString(dateLocale, { weekday: "short" });
                            return (_jsxs("section", { className: cn("flex min-h-48 w-[11.5rem] min-w-0 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-black/30 xl:w-auto", isToday ? "border-amber-400/40" : "border-white/10"), children: [_jsxs("div", { className: cn("border-b border-white/10 px-3 py-2", isToday && "bg-amber-400/10"), children: [_jsx("div", { className: "text-[11px] uppercase tracking-wide text-zinc-500", children: weekday }), _jsx("div", { className: cn("font-[family-name:var(--font-display)] text-lg", isToday ? "text-amber-100" : "text-zinc-200"), children: date.getDate() })] }), _jsx("div", { className: "flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-1.5", children: fixtures.map((fixture) => (_jsx(FixtureCard, { camp: camp, fixture: fixture, layout: "stack", revealed: revealed(fixture.id), onReveal: () => onReveal(fixture.id) }, fixture.id))) })] }, key));
                        }) })] })) : (_jsxs("div", { children: [_jsx(FixtureMonthCalendar, { markedDays: markedDays, finishedDays: finishedDays, selectedKey: selectedKey, onSelect: setSelectedKey }), _jsx("div", { className: "mt-6 grid gap-3", children: dayFixtures.length > 0 ? (dayFixtures.map((fixture) => (_jsx(FixtureCard, { camp: camp, fixture: fixture, revealed: revealed(fixture.id), onReveal: () => onReveal(fixture.id) }, fixture.id)))) : (_jsx("p", { className: "text-sm text-zinc-500", children: t("pages.championship.noFixtureDay") })) })] }))] }));
}
function Roster({ camp, entryStatus, entryMessage, pending, loggedIn, loginTo, onSubmit, }) {
    const { t } = useTranslation();
    const [mode, setMode] = useState("list");
    const [showWeightedRr, setShowWeightedRr] = useState(camp.showWeightedRr);
    const [stats, setStats] = useState([]);
    const profileKey = camp.players.map((player) => player.profileId).join("|");
    useEffect(() => {
        setShowWeightedRr(camp.showWeightedRr);
    }, [camp.showWeightedRr]);
    useEffect(() => {
        let cancelled = false;
        void fetchAomRacePlayersByIds(profileKey.split("|")).then((rows) => {
            if (!cancelled)
                setStats(rows);
        }).catch(() => {
            if (!cancelled)
                setStats([]);
        });
        return () => {
            cancelled = true;
        };
    }, [profileKey]);
    return (_jsxs("div", { children: [camp.players.length > 0 ? (_jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-end gap-3", children: [_jsxs("label", { className: "inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300", children: [_jsx("input", { type: "checkbox", checked: showWeightedRr, onChange: (event) => setShowWeightedRr(event.target.checked), className: "size-3.5 rounded border-white/20 bg-zinc-950 text-amber-400 focus:ring-amber-400/40" }), _jsx("span", { children: t("pages.championship.showWeightedRr") })] }), _jsx("div", { role: "group", "aria-label": t("pages.championship.rosterView"), className: "inline-flex rounded-lg border border-white/10 bg-zinc-900/50 p-0.5", children: ["list", "show"].map((option) => (_jsx("button", { type: "button", "aria-pressed": mode === option, onClick: () => setMode(option), className: cn("rounded-md px-2.5 py-1 text-xs font-medium transition", mode === option ? "bg-amber-500/20 text-amber-100" : "text-zinc-400 hover:text-zinc-200"), children: option === "list" ? t("pages.championship.rosterList") : t("pages.championship.rosterShow") }, option))) })] })) : null, mode === "show" ? (_jsx(RosterPresentation, { players: camp.players, stats: stats, showWeightedRr: showWeightedRr })) : (_jsx(RosterList, { players: camp.players, stats: stats, showWeightedRr: showWeightedRr })), camp.registrationEnabled ? (_jsxs("div", { className: "mt-6 rounded-2xl border border-amber-900/40 bg-black/40 p-4", children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-amber-100", children: t("pages.championship.signup") }), entryStatus === "approved" ? _jsx("p", { className: "mt-2 text-sm text-zinc-300", children: t("pages.championship.entryApproved") }) : null, entryStatus === "pending" ? _jsx("p", { className: "mt-2 text-sm text-zinc-300", children: t("pages.championship.entryPending") }) : null, entryStatus === "rejected" ? _jsx("p", { className: "mt-2 text-sm text-zinc-300", children: t("pages.championship.entryRejected") }) : null, !entryStatus && loggedIn ? (_jsx("button", { type: "button", disabled: pending, onClick: onSubmit, className: "mt-3 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60", children: t("pages.championship.signupCta") })) : null, !loggedIn ? (_jsx(Link, { to: loginTo, className: "mt-3 inline-block text-sm text-amber-200 hover:underline", children: t("pages.championship.loginToJoin") })) : null, entryMessage ? _jsx("p", { className: "mt-2 text-sm text-zinc-300", children: entryMessage }) : null] })) : null] }));
}
