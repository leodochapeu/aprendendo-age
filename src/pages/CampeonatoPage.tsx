import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent, type UIEvent, type WheelEvent } from "react";
import { Link, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";

import { ChampionshipBracketView } from "@/components/campeonato/ChampionshipBracketView";
import { ChampionshipEmblem } from "@/components/campeonato/ChampionshipEmblem";
import { ChampionshipMarkdown } from "@/components/campeonato/ChampionshipMarkdown";
import { EpicMatchCard } from "@/components/campeonato/EpicMatchCard";
import { RosterList } from "@/components/campeonato/RosterList";
import { RosterPresentation } from "@/components/campeonato/RosterPresentation";
import { ParticleField } from "@/components/campeonato/ParticleField";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { Locale } from "@/i18n/types";
import { cn } from "@/lib/cn";
import { localeAuthPath } from "@/lib/localeRoutes";
import {
  fetchChampionshipBySlug,
  fetchMyChampionshipEntry,
  submitChampionshipEntry,
  type ChampionshipDetail,
  type ChampionshipFixture,
  type ChampionshipPhase,
} from "@/lib/championshipsApi";
import { fetchAomRacePlayersByIds, type AomRacePlayer } from "@/lib/playersApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Tab = "about" | "brackets" | "roster" | "table" | "calendar";
type SpoilerTab = "brackets" | "table" | "calendar";
type CalendarView = "week" | "month";
type SpoilerEntry = { all: boolean; ids: string[] };
type SpoilerState = Record<SpoilerTab, SpoilerEntry>;

const PANEL_SEGMENT: Record<Tab, { campeonato: string; championship: string }> = {
  about: { campeonato: "apresentacao", championship: "overview" },
  brackets: { campeonato: "chaves", championship: "brackets" },
  roster: { campeonato: "inscritos", championship: "roster" },
  table: { campeonato: "classificacao", championship: "standings" },
  calendar: { campeonato: "calendario", championship: "calendar" },
};

function tabFromPanel(panel: string | undefined): Tab | null {
  if (!panel) return null;
  for (const [tab, segments] of Object.entries(PANEL_SEGMENT) as [Tab, (typeof PANEL_SEGMENT)[Tab]][]) {
    if (segments.campeonato === panel || segments.championship === panel) return tab;
  }
  return null;
}

type PanelBase = "campeonato" | "championship";

function panelBase(pathname: string): PanelBase {
  return pathname.startsWith("/championship") ? "championship" : "campeonato";
}

function tabPath(base: PanelBase, slug: string, tab: Tab, preview = false) {
  const segment = tab === "about" ? "" : `/${PANEL_SEGMENT[tab][base]}`;
  return `/${base}/${slug}${segment}${preview ? "?preview=1" : ""}`;
}

const PHASE_KEY: Record<ChampionshipPhase, string> = {
  registration: "pages.championship.phase.registration",
  ongoing: "pages.championship.phase.ongoing",
  finished: "pages.championship.phase.finished",
};

function emptySpoilers(): SpoilerState {
  return {
    brackets: { all: false, ids: [] },
    table: { all: false, ids: [] },
    calendar: { all: false, ids: [] },
  };
}

function spoilerKey(slug: string) {
  return `campeonato-spoilers:${slug}`;
}

function readEntry(value: unknown): SpoilerEntry {
  if (!value || typeof value !== "object") return { all: false, ids: [] };
  const row = value as { all?: unknown; ids?: unknown };
  const ids = Array.isArray(row.ids) ? row.ids.filter((id): id is string => typeof id === "string") : [];
  return { all: row.all === true, ids };
}

function loadSpoilers(slug: string): SpoilerState {
  if (!slug || typeof window === "undefined") return emptySpoilers();
  try {
    const raw = window.localStorage.getItem(spoilerKey(slug));
    if (!raw) return emptySpoilers();
    const parsed = JSON.parse(raw) as Partial<Record<SpoilerTab, unknown>>;
    return {
      brackets: readEntry(parsed.brackets),
      table: readEntry(parsed.table),
      calendar: readEntry(parsed.calendar),
    };
  } catch {
    return emptySpoilers();
  }
}

function isSpoilerTab(tab: Tab): tab is SpoilerTab {
  return tab === "brackets" || tab === "table" || tab === "calendar";
}

function fixtureHasResult(fixture: ChampionshipFixture) {
  return fixture.status === "finished" || fixture.games.length > 0;
}

function tabHasContent(tab: Tab, camp: ChampionshipDetail) {
  if (tab === "about") return Boolean(camp.description.trim()) || Boolean(camp.rules.trim()) || camp.prizeEnabled;
  if (tab === "roster") return camp.players.length > 0 || camp.registrationEnabled;
  if (tab === "table") return camp.fixtures.some(fixtureHasResult);
  return camp.fixtures.length > 0;
}

function tabBlock(tab: Tab, camp: ChampionshipDetail, preview = false) {
  if (preview ? !camp.showPreviews[tab] : !camp.showTabs[tab]) return "admin" as const;
  if (camp.devMode) return null;
  return tabHasContent(tab, camp) ? null : ("empty" as const);
}

function isTabFullyRevealed(tab: SpoilerTab, fixtures: ChampionshipFixture[], entry: SpoilerEntry) {
  if (entry.all) return true;
  if (tab === "table") return false;
  const withResult = fixtures.filter(fixtureHasResult);
  return withResult.length > 0 && withResult.every((fixture) => entry.ids.includes(fixture.id));
}

function dateLocaleOf(locale: Locale) {
  return locale === "en" ? "en-US" : "pt-BR";
}

function dayKeyFromDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayKeyFromIso(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dayKeyFromDate(date);
}

function parseDayKey(key: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(date: Date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function initialDayKey(fixtures: ChampionshipFixture[]) {
  const keys = [...new Set(fixtures.map((fixture) => dayKeyFromIso(fixture.scheduledAt)).filter(Boolean))].sort();
  const today = dayKeyFromDate(new Date());
  if (keys.length === 0) return today;
  return keys.find((key) => key >= today) ?? keys[keys.length - 1];
}

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function playerName(camp: ChampionshipDetail, id: string | null | undefined) {
  if (!id) return "—";
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
  const [camp, setCamp] = useState<ChampionshipDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [spoilersSlug, setSpoilersSlug] = useState(slug);
  const [spoilers, setSpoilers] = useState<SpoilerState>(() => loadSpoilers(slug));
  const [entryStatus, setEntryStatus] = useState<string | null>(null);
  const [entryMessage, setEntryMessage] = useState<string | null>(null);
  const [entryPending, setEntryPending] = useState(false);
  const [bracketsView, setBracketsView] = useState<"list" | "bracket">("list");

  if (spoilersSlug !== slug) {
    setSpoilersSlug(slug);
    setSpoilers(loadSpoilers(slug));
  }

  useEffect(() => {
    if (!slug || spoilersSlug !== slug) return;
    window.localStorage.setItem(spoilerKey(slug), JSON.stringify(spoilers));
  }, [slug, spoilers, spoilersSlug]);

  const activeTab: Tab = panelTab ?? "about";

  useEffect(() => {
    if (!authReady) return;
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
        if (cancelled) return;
        setCamp(row);
        setError(row ? null : t("pages.championship.notFound"));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("pages.championship.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, includeDev, panelInvalid, slug, t]);

  useEffect(() => {
    if (!camp || !user) return;
    let cancelled = false;
    void fetchMyChampionshipEntry(camp.id, user.id).then((value) => {
      if (!cancelled) setEntryStatus(value);
    });
    return () => {
      cancelled = true;
    };
  }, [camp, user]);

  const standings = useMemo(() => {
    if (!camp) return [];
    const rows = new Map(camp.players.map((player) => [player.id, { name: player.name, logoUrl: player.logoUrl, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }]));
    for (const fixture of camp.fixtures) {
      if (fixture.status !== "finished" || fixture.isBye || !fixture.playerAId || !fixture.playerBId) continue;
      const a = rows.get(fixture.playerAId);
      const b = rows.get(fixture.playerBId);
      if (!a || !b) continue;
      a.played += 1;
      b.played += 1;
      if (fixture.scoreA === fixture.scoreB) {
        a.draws += 1;
        b.draws += 1;
        a.points += 1;
        b.points += 1;
      } else if (fixture.scoreA > fixture.scoreB) {
        a.wins += 1;
        a.points += 3;
        b.losses += 1;
      } else {
        b.wins += 1;
        b.points += 3;
        a.losses += 1;
      }
    }
    return [...rows.values()].sort((left, right) => right.points - left.points || right.wins - left.wins || left.name.localeCompare(right.name));
  }, [camp]);

  function toggleRevealAll(scope: SpoilerTab) {
    const fixtures = camp?.fixtures ?? [];
    setSpoilers((current) => {
      const entry = current[scope];
      const fully = isTabFullyRevealed(scope, fixtures, entry);
      return { ...current, [scope]: fully ? { all: false, ids: [] } : { all: true, ids: entry.ids } };
    });
  }

  function revealFixture(scope: "brackets" | "calendar", fixtureId: string) {
    setSpoilers((current) => {
      const entry = current[scope];
      if (entry.all || entry.ids.includes(fixtureId)) return current;
      return { ...current, [scope]: { all: false, ids: [...entry.ids, fixtureId] } };
    });
  }

  function revealTable() {
    setSpoilers((current) => (current.table.all ? current : { ...current, table: { all: true, ids: [] } }));
  }

  const previewHeaderRef = useRef<HTMLElement>(null);
  const previewScrollerRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef(0);
  const compactLockRef = useRef(0);

  function setPreviewCompact(next: number) {
    if (next === compactRef.current) return;
    compactRef.current = next;
    compactLockRef.current = performance.now() + 420;
    previewHeaderRef.current?.style.setProperty("--compact", String(next));
  }

  function syncPreviewCompact(deltaY: number) {
    if (performance.now() < compactLockRef.current) return;
    const scroller = previewScrollerRef.current;
    if (!scroller) return;
    if (deltaY > 6) setPreviewCompact(1);
    else if (deltaY < -6 && scroller.scrollTop <= 0) setPreviewCompact(0);
  }

  const onPreviewScroll = (event: UIEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollTop > 8) setPreviewCompact(1);
  };

  const onPreviewWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey) return;
    const scroller = previewScrollerRef.current;
    if (scroller && !scroller.contains(event.target as Node)) scroller.scrollTop += event.deltaY;
    syncPreviewCompact(event.deltaY);
  };

  const touchYRef = useRef<number | null>(null);
  const onPreviewTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchYRef.current = event.touches[0]?.clientY ?? null;
  };
  const onPreviewTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const y = event.touches[0]?.clientY;
    if (y == null || touchYRef.current == null) return;
    const delta = touchYRef.current - y;
    touchYRef.current = y;
    syncPreviewCompact(delta);
  };

  useLayoutEffect(() => {
    previewHeaderRef.current?.style.setProperty("--compact", String(compactRef.current));
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: t("pages.championship.tabs.about") },
    { id: "brackets", label: t("pages.championship.tabs.brackets") },
    { id: "roster", label: t("pages.championship.tabs.roster") },
    { id: "table", label: t("pages.championship.tabs.table") },
    { id: "calendar", label: t("pages.championship.tabs.calendar") },
  ];
  const visibleTabs = camp ? tabs.filter((item) => tabBlock(item.id, camp, false) === null) : tabs;
  const sectionTab: Tab = panelTab ?? "about";
  const sectionBlock = camp && (panel || preview) ? tabBlock(sectionTab, camp, preview) : null;
  const shownTab: Tab = visibleTabs.some((item) => item.id === activeTab) ? activeTab : (visibleTabs[0]?.id ?? "about");
  const championshipPath = camp ? tabPath(base, camp.slug, "about") : "/campeonato";

  useEffect(() => {
    compactRef.current = 0;
    compactLockRef.current = 0;
    previewHeaderRef.current?.style.setProperty("--compact", "0");
  }, [slug, preview, shownTab]);

  if (camp && panel && panelTab === "about" && sectionBlock == null) {
    return <Navigate to={tabPath(base, slug, "about", preview)} replace />;
  }
  if (camp && panel && !preview && sectionBlock === "empty") {
    const next = visibleTabs[0]?.id;
    if (next) return <Navigate to={tabPath(base, slug, next)} replace />;
  }
  if (camp && !preview && !sectionBlock && shownTab !== activeTab) {
    return <Navigate to={tabPath(base, slug, shownTab)} replace />;
  }
  if (camp && !panel && !preview && visibleTabs.length > 0 && !visibleTabs.some((item) => item.id === activeTab)) {
    return <Navigate to={tabPath(base, slug, shownTab)} replace />;
  }

  const championshipLoading = loading && !camp;
  const championshipMissing = !loading && !camp && Boolean(error);
  const centeredNotice = championshipLoading || championshipMissing;

  return (
    <div className="relative min-h-dvh bg-[#07080c] text-zinc-100">
      <ParticleField />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.72)_78%)]" />
      <div
        className={cn(
          "relative mx-auto px-4 sm:px-6",
          centeredNotice
            ? "flex min-h-dvh max-w-3xl items-center justify-center"
            : cn(
                shownTab === "calendar" && !sectionBlock
                  ? "max-w-[90rem]"
                  : shownTab === "roster" && !sectionBlock
                    ? "max-w-6xl"
                    : "max-w-5xl",
                preview || sectionBlock ? "flex h-dvh max-h-dvh flex-col overflow-hidden pt-3" : "py-8",
              ),
        )}
        onWheel={preview ? onPreviewWheel : undefined}
        onTouchStart={preview ? onPreviewTouchStart : undefined}
        onTouchMove={preview ? onPreviewTouchMove : undefined}
      >
        {championshipLoading ? (
          <div className="flex flex-col items-center px-4 text-center">
            <p className="font-[family-name:var(--font-display)] text-4xl leading-tight tracking-wide text-amber-50 sm:text-6xl">
              {t("pages.championship.loading").replace(/[.…]+$/, "")}
            </p>
            <ChampionshipLoadingSpinner />
          </div>
        ) : championshipMissing ? (
          <div className="flex flex-col items-center px-4 text-center">
            <p className="font-[family-name:var(--font-display)] text-4xl leading-tight tracking-wide text-amber-50 sm:text-6xl">
              {error?.replace(/\.$/, "")}
            </p>
            <ChampionshipMissingIcon />
          </div>
        ) : null}
        {centeredNotice || preview || sectionBlock ? null : (
        <div className="mb-8 flex items-center justify-between text-sm">
          <Link to="/" className="font-[family-name:var(--font-display)] tracking-wide text-amber-100/90">
            Aprendendo AGE
          </Link>
          <Link to="/campeonato" className="text-zinc-400 hover:text-amber-100">
            {t("pages.championship.backToIndex")}
          </Link>
        </div>
        )}

        {centeredNotice || !loading ? null : <p className="text-zinc-400">{t("pages.championship.loading")}</p>}
        {centeredNotice || !error ? null : <p className="text-red-200">{error}</p>}
        {camp && sectionBlock ? (
          <HiddenSection
            camp={camp}
            message={sectionBlock === "admin" ? t("pages.championship.hiddenByAdmin") : t("pages.championship.emptySection")}
            backTo={championshipPath}
            backLabel={t("pages.championship.backToChampionship")}
          />
        ) : camp ? (
          <>
            {preview ? (
              <PreviewStage
                ref={previewHeaderRef}
                camp={camp}
                tabLabel={tabs.find((item) => item.id === shownTab)?.label ?? ""}
                backTo={championshipPath}
                backLabel={t("pages.championship.backToChampionship")}
                reveal={
                  isSpoilerTab(shownTab) ? (
                    <RevealAllButton
                      revealed={isTabFullyRevealed(shownTab, camp.fixtures, spoilers[shownTab])}
                      revealLabel={t("pages.championship.revealAll")}
                      hideLabel={t("pages.championship.hideResults")}
                      onClick={() => toggleRevealAll(shownTab)}
                    />
                  ) : null
                }
              />
            ) : (
            <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {camp.logoUrl ? <ChampionshipEmblem src={camp.logoUrl} className="mx-12 h-28 w-28" burst={1.78} /> : null}
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">
                  {t(PHASE_KEY[camp.phase])}
                  {camp.devMode ? " · Modo Dev" : ""}
                </div>
                <h1 className="font-[family-name:var(--font-display)] text-4xl text-amber-50">{camp.name}</h1>
                {camp.subtitle ? <ChampionshipMarkdown source={camp.subtitle} className="mt-2 max-w-2xl text-base text-zinc-100 sm:text-lg" /> : null}
              </div>
            </header>
            )}

            {preview || visibleTabs.length === 0 ? null : (
            <div className="relative z-20 mt-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              {visibleTabs.map((item) => (
                <Link
                  key={item.id}
                  to={tabPath(base, camp.slug, item.id)}
                  aria-current={shownTab === item.id ? "page" : undefined}
                  className={`rounded-full px-3 py-1 text-sm ${shownTab === item.id ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40" : "text-zinc-400 hover:text-zinc-100"}`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="ml-auto flex items-center gap-2">
                {isSpoilerTab(shownTab) ? (
                  <RevealAllButton
                    revealed={isTabFullyRevealed(shownTab, camp.fixtures, spoilers[shownTab])}
                    revealLabel={t("pages.championship.revealAll")}
                    hideLabel={t("pages.championship.hideResults")}
                    onClick={() => toggleRevealAll(shownTab)}
                  />
                ) : null}
                {camp.showPreviews[shownTab] ? (
                  <PreviewLink href={tabPath(base, camp.slug, shownTab, true)} label={t("pages.championship.openPreview")} />
                ) : null}
              </div>
            </div>
            )}

            {preview || visibleTabs.length > 0 ? (
            <div ref={previewScrollerRef} className={cn(preview ? "min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-10" : "mt-6")} onScroll={preview ? onPreviewScroll : undefined}>
              {shownTab === "about" ? (
                <div className="space-y-6">
                  {camp.description ? (
                    <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <h2 className="font-[family-name:var(--font-display)] text-amber-100">{t("pages.championship.description")}</h2>
                      <ChampionshipMarkdown source={camp.description} className="mt-3" />
                    </section>
                  ) : null}
                  {camp.rules ? (
                    <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <h2 className="font-[family-name:var(--font-display)] text-amber-100">{t("pages.championship.rules")}</h2>
                      <ChampionshipMarkdown source={camp.rules} className="mt-3" />
                    </section>
                  ) : null}
                  {camp.prizeEnabled ? <PrizeBlock camp={camp} /> : null}
                </div>
              ) : null}
              {shownTab === "brackets" ? (
                <div className="space-y-4">
                  {camp.stages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setBracketsView("list")}
                        className={cn(
                          "rounded-full px-3 py-1 text-sm",
                          bracketsView === "list"
                            ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40"
                            : "text-zinc-400 hover:text-zinc-100",
                        )}
                      >
                        Lista
                      </button>
                      <button
                        type="button"
                        onClick={() => setBracketsView("bracket")}
                        className={cn(
                          "rounded-full px-3 py-1 text-sm",
                          bracketsView === "bracket"
                            ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40"
                            : "text-zinc-400 hover:text-zinc-100",
                        )}
                      >
                        Chave
                      </button>
                    </div>
                  ) : null}
                  {bracketsView === "bracket" && camp.stages.length > 0 ? (
                    <ChampionshipBracketView
                      camp={camp}
                      revealedAll={spoilers.brackets.all}
                      revealedIds={spoilers.brackets.ids}
                      onReveal={(fixtureId) => revealFixture("brackets", fixtureId)}
                    />
                  ) : (
                    <BracketList
                      camp={camp}
                      revealedAll={spoilers.brackets.all}
                      revealedIds={spoilers.brackets.ids}
                      onReveal={(fixtureId) => revealFixture("brackets", fixtureId)}
                    />
                  )}
                </div>
              ) : null}
              {shownTab === "roster" ? (
                <Roster
                  camp={camp}
                  entryStatus={entryStatus}
                  entryMessage={entryMessage}
                  pending={entryPending}
                  loggedIn={status === "authenticated"}
                  loginTo={`${localeAuthPath(locale, "login")}?next=${encodeURIComponent(`${pathname}${search}`)}`}
                  onSubmit={() => {
                    if (!user) return;
                    setEntryPending(true);
                    setEntryMessage(null);
                    void submitChampionshipEntry({
                      championshipId: camp.id,
                      profileId: user.id,
                      displayName:
                        (profile?.displayName || profile?.aomstatsAlias || "Jogador")
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
                  }}
                />
              ) : null}
              {shownTab === "table" ? (
                <div className={cn("relative rounded-2xl border border-white/10", spoilers.table.all ? "overflow-visible" : "overflow-hidden")}>
                  <table className={cn("w-full text-left text-sm", !spoilers.table.all && "pointer-events-none select-none")}>
                    <thead className="bg-black/40 text-zinc-400">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">{t("pages.championship.player")}</th>
                        <StatHead label={t("pages.championship.played")}><PlayedIcon /></StatHead>
                        <StatHead label={t("pages.championship.wins")} tone="text-emerald-400"><WinsIcon /></StatHead>
                        <StatHead label={t("pages.championship.draws")} tone="text-yellow-300"><DrawsIcon /></StatHead>
                        <StatHead label={t("pages.championship.losses")} tone="text-red-400"><LossesIcon /></StatHead>
                        <StatHead label={t("pages.championship.points")}><PointsIcon /></StatHead>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row, index) => (
                        <tr key={row.name} className="border-t border-white/5">
                          <td className="px-3 py-2 text-zinc-500">{index + 1}</td>
                          <td className="px-3 py-2">
                            <span className="flex items-center gap-3">
                              <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-900">
                                {row.logoUrl ? <img src={row.logoUrl} alt="" className="h-full w-full object-cover" /> : null}
                              </span>
                              <span>{row.name}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">{row.played}</td>
                          <td className="px-3 py-2 text-center text-emerald-400">{row.wins}</td>
                          <td className="px-3 py-2 text-center text-yellow-300">{row.draws}</td>
                          <td className="px-3 py-2 text-center text-red-400">{row.losses}</td>
                          <td className="px-3 py-2 text-center text-amber-100">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!spoilers.table.all ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-sm text-zinc-200 backdrop-blur-sm">
                      <span>{t("pages.championship.tableHidden")}</span>
                      <RevealThisButton label={t("pages.championship.revealThis")} onClick={revealTable} />
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className={shownTab === "calendar" ? "block" : "hidden"}>
                <Calendar
                  camp={camp}
                  revealedAll={spoilers.calendar.all}
                  revealedIds={spoilers.calendar.ids}
                  onReveal={(fixtureId) => revealFixture("calendar", fixtureId)}
                />
              </div>
            </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function ChampionshipLoadingSpinner() {
  return (
    <span className="relative mt-12 inline-flex h-20 w-20 items-center justify-center text-amber-200/80" aria-hidden>
      <span className="absolute inset-0 animate-spin rounded-full border border-amber-200/20 border-t-amber-100 drop-shadow-[0_0_22px_rgba(251,191,36,0.35)]" />
      <span className="h-10 w-10 animate-spin rounded-full border border-amber-200/45 border-b-transparent [animation-duration:1.6s] [animation-direction:reverse]" />
    </span>
  );
}

function ChampionshipMissingIcon() {
  return (
    <svg viewBox="0 0 64 72" aria-hidden="true" className="mt-12 h-20 w-20 text-amber-200/80 drop-shadow-[0_0_22px_rgba(251,191,36,0.35)]">
      <path
        d="M32 4 56 14.5v18.2C56 49.2 46.2 59.4 32 68 17.8 59.4 8 49.2 8 32.7V14.5L32 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M32 24v18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="32" cy="50" r="1.4" fill="currentColor" />
    </svg>
  );
}

function HiddenSection({ camp, message, backTo, backLabel }: { camp: ChampionshipDetail; message: string; backTo: string; backLabel: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-16 text-center">
      <Link to={backTo} className="mb-10 text-xs uppercase tracking-[0.18em] text-zinc-500 hover:text-amber-100">
        {backLabel}
      </Link>
      {camp.logoUrl ? <ChampionshipEmblem src={camp.logoUrl} className="h-40 w-40" burst={1.82} /> : null}
      <p className="mt-10 max-w-md text-sm leading-6 text-zinc-300">{message}</p>
    </div>
  );
}

function PrizeWind() {
  return (
    <div className="epic-wind" aria-hidden>
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function PrizeBlock({ camp }: { camp: ChampionshipDetail }) {
  const { t } = useTranslation();
  const raised = camp.prizeRaisedCents ?? 0;
  const goal = camp.prizeGoalCents ?? 0;
  const ratio = goal > 0 ? Math.min(1, raised / goal) : 0;
  const ordered = [...camp.places].sort((a, b) => a.place - b.place);
  const podium = ordered.length === 3 ? [ordered[1], ordered[0], ordered[2]] : ordered;

  return (
    <div className="relative">
      <div className="epic-gold-glow" aria-hidden />
      <section className="relative overflow-hidden rounded-2xl border border-amber-200/25 bg-black/55 p-5 shadow-lg shadow-black/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#3a2a12_0%,#120e09_58%,#07080c_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/62 to-black/75" />
        <PrizeWind />
        <div className="relative z-[3]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-amber-100">
                {camp.prizeMode === "donations" ? t("pages.championship.prizeDonations") : t("pages.championship.prizeFixed")}
              </h2>
              {camp.prizeNote ? <p className="mt-2 max-w-xl text-sm text-zinc-300">{camp.prizeNote}</p> : null}
            </div>
            {camp.prizeMode === "donations" ? (
              <div className="text-right">
                <div className="text-xs uppercase text-zinc-400">{t("pages.championship.raised")}</div>
                <div className="font-[family-name:var(--font-display)] text-2xl text-amber-50">{formatBrl(raised)}</div>
                {goal > 0 ? <div className="text-xs text-zinc-400">{t("pages.championship.goal")} {formatBrl(goal)}</div> : null}
              </div>
            ) : null}
          </div>
          {camp.prizeMode === "donations" && goal > 0 ? (
            <div className="mt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-amber-300" style={{ width: `${ratio * 100}%` }} />
              </div>
              <div className="mt-1 text-xs text-zinc-400">{Math.round(ratio * 1000) / 10}% {t("pages.championship.ofGoal")}</div>
            </div>
          ) : null}
          <div className="mt-5 grid items-end gap-3 sm:grid-cols-3">
            {podium.map((place) => {
              const amount =
                camp.prizeMode === "donations"
                  ? place.sharePercent != null
                    ? Math.round(raised * (place.sharePercent / 100))
                    : null
                  : place.amountCents;
              const highlight = place.place === 1;
              return (
                <div
                  key={place.place}
                  className={cn(
                    "relative overflow-hidden rounded-xl border",
                    highlight
                      ? "border-amber-200/80 bg-amber-950/50 px-4 py-6 shadow-[0_0_32px_rgba(255,196,70,0.38)] sm:-translate-y-3 sm:py-8"
                      : "border-white/10 bg-black/35 p-4",
                  )}
                >
                  {highlight ? (
                    <>
                      <div className="epic-gold-glow-inset" aria-hidden />
                      <PrizeWind />
                    </>
                  ) : null}
                  <div className="relative z-[3]">
                    <div className={cn("text-xs uppercase tracking-[0.16em]", highlight ? "text-amber-200" : "text-zinc-400")}>
                      {place.label || `${place.place}º`}
                      {camp.prizeMode === "donations" && place.sharePercent != null ? ` (${place.sharePercent.toFixed(2)}%)` : ""}
                    </div>
                    <div className={cn("mt-1 text-amber-50", highlight ? "font-[family-name:var(--font-display)] text-3xl" : "text-xl")}>
                      {amount != null ? formatBrl(amount) : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatHead({ label, tone, children }: { label: string; tone?: string; children: ReactNode }) {
  return (
    <th className="px-3 py-2 text-center">
      <span className="group/stat relative inline-flex">
        <span className={cn("inline-flex", tone)} aria-label={label}>
          {children}
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-2.5 py-1.5 text-xs font-normal text-zinc-200 opacity-0 shadow-xl shadow-black/40 transition duration-150 group-hover/stat:opacity-100 group-focus-within/stat:opacity-100"
        >
          {label}
        </span>
      </span>
    </th>
  );
}

function StatIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function PlayedIcon() {
  return <CrossedSwords className="h-4 w-4" />;
}

function WinsIcon() {
  return (
    <StatIcon>
      <path d="M8 20h8" />
      <path d="M12 16v4" />
      <path d="M7 3h10v6a5 5 0 0 1-10 0V3Z" />
      <path d="M7 5.5H4.2a3 3 0 0 0 3 4.2" />
      <path d="M17 5.5h2.8a3 3 0 0 1-3 4.2" />
    </StatIcon>
  );
}

function DrawsIcon() {
  return (
    <StatIcon>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 10h8M8 14h8" />
    </StatIcon>
  );
}

function LossesIcon() {
  return (
    <StatIcon>
      <circle cx="12" cy="12" r="8" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </StatIcon>
  );
}

function PointsIcon() {
  return (
    <StatIcon>
      <path d="m12 3 2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L12 15.6 7 18.1l1.2-5.5L4 8.8l5.6-.6L12 3Z" />
    </StatIcon>
  );
}

function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.2A10.6 10.6 0 0 1 12 6c5.5 0 9.2 4.2 10 6-.3.7-1 1.8-2 2.9" />
          <path d="M6.1 6.7C4 8.1 2.6 10.2 2 12c.8 1.8 4.5 6 10 6 1.5 0 2.9-.3 4.1-.9" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function RevealAllButton({
  revealed,
  revealLabel,
  hideLabel,
  onClick,
}: {
  revealed: boolean;
  revealLabel: string;
  hideLabel: string;
  onClick: () => void;
}) {
  const label = revealed ? hideLabel : revealLabel;
  return (
    <div className="group/eye relative shrink-0">
      <button
        type="button"
        aria-pressed={revealed}
        aria-label={label}
        onClick={onClick}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border transition",
          revealed
            ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
            : "border-white/10 text-zinc-400 hover:border-amber-400/40 hover:text-amber-100",
        )}
      >
        <EyeIcon off={!revealed} />
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-30 mt-2 whitespace-nowrap rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-2.5 py-1.5 text-xs text-zinc-200 opacity-0 shadow-xl shadow-black/40 transition duration-150 group-hover/eye:opacity-100 group-focus-within/eye:opacity-100"
      >
        {label}
      </div>
    </div>
  );
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  );
}

function PreviewLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="group/preview relative shrink-0">
      <Link
        to={href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:border-amber-400/40 hover:text-amber-100"
      >
        <MonitorIcon />
      </Link>
      <div
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-30 mt-2 whitespace-nowrap rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-2.5 py-1.5 text-xs text-zinc-200 opacity-0 shadow-xl shadow-black/40 transition duration-150 group-hover/preview:opacity-100 group-focus-within/preview:opacity-100"
      >
        {label}
      </div>
    </div>
  );
}

const PreviewStage = forwardRef<
  HTMLElement,
  {
    camp: ChampionshipDetail;
    tabLabel: string;
    backTo: string;
    backLabel: string;
    reveal: ReactNode;
  }
>(function PreviewStage({ camp, tabLabel, backTo, backLabel, reveal }, ref) {
  const { t } = useTranslation();
  const frame = "calc(12rem - var(--compact) * 7.25rem)";
  return (
    <header ref={ref} className="preview-stage relative z-30 shrink-0 px-1 pb-2">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -top-8 -bottom-28"
        style={{
          background:
            "radial-gradient(ellipse 78% 68% at 50% 34%, rgba(7,8,12,0.94) 0%, rgba(7,8,12,0.62) 42%, rgba(7,8,12,0.22) 64%, rgba(7,8,12,0) 78%)",
        }}
      />
      <div className="relative flex items-center justify-between gap-3">
        <Link to={backTo} className="text-xs text-zinc-500 hover:text-amber-100">
          {backLabel}
        </Link>
        {reveal ? <div className="shrink-0">{reveal}</div> : <span />}
      </div>
      <div className="flex flex-col items-center text-center" style={{ marginTop: "calc(0.85rem - var(--compact) * 0.55rem)" }}>
        {camp.logoUrl ? (
          <ChampionshipEmblem
            src={camp.logoUrl}
            burst={1.82}
            style={{ width: frame, height: frame, marginTop: `calc(${frame} * 0.34)`, marginBottom: `calc(${frame} * 0.22)` }}
          />
        ) : null}
        <div
          className="uppercase text-amber-200/75"
          style={{
            marginTop: "calc(0.35rem - var(--compact) * 0.15rem)",
            fontSize: "calc(0.75rem - var(--compact) * 0.125rem)",
            letterSpacing: "0.28em",
          }}
        >
          {t(PHASE_KEY[camp.phase])}
          {camp.devMode ? " · Modo Dev" : ""}
        </div>
        <h1
          className="max-w-4xl font-[family-name:var(--font-display)] leading-none text-amber-50"
          style={{
            marginTop: "calc(0.7rem - var(--compact) * 0.4rem)",
            fontSize: "clamp(1.55rem, calc(3.4rem - var(--compact) * 1.85rem), 3.4rem)",
          }}
        >
          {camp.name}
        </h1>
        <p
          className="uppercase text-zinc-400"
          style={{
            marginTop: "calc(0.65rem - var(--compact) * 0.35rem)",
            fontSize: "calc(0.8rem - var(--compact) * 0.15rem)",
            letterSpacing: "0.22em",
          }}
        >
          {tabLabel}
        </p>
      </div>
    </header>
  );
});

function RevealThisButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100 transition hover:bg-amber-400/20"
    >
      {label}
    </button>
  );
}

function FixtureCard({
  camp,
  fixture,
  revealed,
  onReveal,
  layout = "row",
}: {
  camp: ChampionshipDetail;
  fixture: ChampionshipFixture;
  revealed: boolean;
  onReveal: () => void;
  layout?: "row" | "stack";
}) {
  const { t, locale } = useTranslation();
  const dateLocale = dateLocaleOf(locale);
  const when = fixture.scheduledAt ? new Date(fixture.scheduledAt) : null;
  const hasResult = fixtureHasResult(fixture);
  const visible = revealed && hasResult;
  const whenLabel =
    !when || Number.isNaN(when.getTime())
      ? ""
      : when.toLocaleString(dateLocale, {
          day: "2-digit",
          month: "short",
          ...(layout === "stack" ? {} : { year: "numeric" as const }),
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

  return (
    <div className={cn("grid min-w-0", compact ? "gap-2" : "gap-3")}>
      {games.map((game, index) => (
        <EpicMatchCard
          key={game?.id ?? fixture.id}
          locale={locale}
          campLogoUrl={camp.logoUrl}
          playerA={{ name: playerA.name, logoUrl: playerA.logoUrl }}
          playerB={{ name: playerB.name, logoUrl: playerB.logoUrl }}
          scoreA={visible ? fixture.scoreA : null}
          scoreB={visible ? fixture.scoreB : null}
          mapName={game?.mapName ?? ""}
          godA={game?.godA ?? ""}
          godB={game?.godB ?? ""}
          winner={visible ? (game ? game.winnerSide : fixture.scoreA === fixture.scoreB ? null : fixture.scoreA > fixture.scoreB ? "A" : "B") : null}
          whenLabel={whenLabel}
          roundLabel={
            fixture.seriesLength === 5
              ? `${fixture.roundLabel} · MD5`
              : fixture.seriesLength === 7
                ? `${fixture.roundLabel} · MD7`
                : fixture.seriesLength === 3
                  ? `${fixture.roundLabel} · MD3`
                  : fixture.roundLabel
          }
          links={visible ? fixture.links : []}
          revealed={visible}
          compact={compact}
          revealLabel={t("pages.championship.revealThis")}
          victoryLabel={(name) => t("pages.championship.victory", { name })}
          watchLabel={t("pages.championship.watch")}
          onReveal={index === 0 && hasResult && !revealed ? onReveal : undefined}
        />
      ))}
    </div>
  );
}

function BracketList({
  camp,
  revealedAll,
  revealedIds,
  onReveal,
}: {
  camp: ChampionshipDetail;
  revealedAll: boolean;
  revealedIds: string[];
  onReveal: (fixtureId: string) => void;
}) {
  const listFixtures = camp.fixtures.filter((fixture) => !fixture.isBye && !fixture.isHidden);
  const rounds = [...new Set(listFixtures.map((fixture) => fixture.roundLabel))];
  if (rounds.length === 0) return <p className="text-sm text-zinc-500">—</p>;
  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <section key={round}>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-amber-100">{round}</h2>
          <div className="grid gap-3">
            {listFixtures
              .filter((fixture) => fixture.roundLabel === round)
              .map((fixture) => (
                <FixtureCard
                  key={fixture.id}
                  camp={camp}
                  fixture={fixture}
                  revealed={revealedAll || revealedIds.includes(fixture.id)}
                  onReveal={() => onReveal(fixture.id)}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function weekdayInitials(dateLocale: string) {
  const sunday = new Date(2026, 0, 4, 12);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return date.toLocaleDateString(dateLocale, { weekday: "narrow" });
  });
}

function formatWeekLabel(start: Date, dateLocale: string) {
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

function CalendarViewToggle({ view, onChange }: { view: CalendarView; onChange: (view: CalendarView) => void }) {
  const { t } = useTranslation();
  const options: { id: CalendarView; label: string }[] = [
    { id: "week", label: t("pages.championship.calendarWeek") },
    { id: "month", label: t("pages.championship.calendarMonth") },
  ];
  return (
    <div role="group" aria-label={t("pages.championship.calendarView")} className="inline-flex rounded-lg border border-white/10 bg-zinc-900/50 p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={view === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition",
            view === option.id ? "bg-amber-500/20 text-amber-100" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CrossedSwords({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="currentColor" d="M3.2 18.9 12.6 9.5l1.6 1.6-9.4 9.4c-.45.45-1.15.45-1.6 0s-.45-1.15 0-1.6Z" />
      <path fill="currentColor" d="M13.7 6.8 17.4 3.1c.35-.35.9-.35 1.25 0l1.25 1.25c.35.35.35.9 0 1.25L16.2 9.2 13.7 6.8Z" />
      <path fill="currentColor" d="M20.8 18.9 11.4 9.5 9.8 11.1l9.4 9.4c.45.45 1.15.45 1.6 0s.45-1.15 0-1.6Z" />
      <path fill="currentColor" d="M10.3 6.8 6.6 3.1c-.35-.35-.9-.35-1.25 0L4.1 4.35c-.35.35-.35.9 0 1.25L7.8 9.2l2.5-2.4Z" />
      <circle cx="12" cy="13.4" r="1.15" fill="currentColor" />
    </svg>
  );
}

function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path d="m6 12.5 4 4 8-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FixtureMonthCalendar({
  markedDays,
  finishedDays,
  selectedKey,
  onSelect,
}: {
  markedDays: Set<string>;
  finishedDays: Set<string>;
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const { t, locale } = useTranslation();
  const dateLocale = dateLocaleOf(locale);
  const todayKey = dayKeyFromDate(new Date());
  const [cursor, setCursor] = useState(() => {
    const base = parseDayKey(selectedKey) ?? new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  useEffect(() => {
    const base = parseDayKey(selectedKey);
    if (!base) return;
    setCursor({ year: base.getFullYear(), month: base.getMonth() });
  }, [selectedKey]);

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
  const title = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function shift(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-amber-500/25 bg-zinc-950 p-5 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-display)] text-lg tracking-wide text-amber-100">{title}</h3>
        <div className="flex gap-2">
          <button type="button" aria-label={t("pages.championship.prevMonth")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-zinc-900 text-lg text-amber-100 hover:border-amber-400 hover:bg-zinc-800" onClick={() => shift(-1)}>
            ‹
          </button>
          <button type="button" aria-label={t("pages.championship.nextMonth")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-zinc-900 text-lg text-amber-100 hover:border-amber-400 hover:bg-zinc-800" onClick={() => shift(1)}>
            ›
          </button>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 text-center text-xs font-medium tracking-wide text-zinc-500">
        {weekdayInitials(dateLocale).map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-7 justify-items-center gap-y-2">
        {cells.map((day, index) => {
          if (day == null) return <span key={`empty-${index}`} className="h-10 w-10" />;
          const key = dayKeyFromDate(new Date(cursor.year, cursor.month, day));
          const selected = key === selectedKey;
          const today = key === todayKey;
          const marked = markedDays.has(key);
          const finished = finishedDays.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition",
                selected
                  ? "bg-amber-400 text-zinc-950"
                  : finished
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : marked
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "bg-amber-300/15 text-amber-100/75 hover:bg-amber-300/25",
                !selected && today && "ring-2 ring-amber-300/80",
              )}
            >
              <span className={cn("leading-none", marked && "-translate-y-1")}>{day}</span>
              {finished ? (
                <CheckMark className={cn("absolute bottom-0.5 h-3 w-3", selected ? "text-zinc-900" : "text-emerald-50")} />
              ) : marked ? (
                <CrossedSwords className={cn("absolute bottom-0.5 h-3 w-3", selected ? "text-zinc-900" : "text-sky-100")} />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/40" />
          {t("pages.championship.legendOpen")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-sky-100">
            <CrossedSwords className="h-3 w-3" />
          </span>
          {t("pages.championship.legendMatch")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-emerald-50">
            <CheckMark className="h-3 w-3" />
          </span>
          {t("pages.championship.legendFinished")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          {t("pages.championship.legendSelected")}
        </span>
      </div>
    </div>
  );
}

function Calendar({
  camp,
  revealedAll,
  revealedIds,
  onReveal,
}: {
  camp: ChampionshipDetail;
  revealedAll: boolean;
  revealedIds: string[];
  onReveal: (fixtureId: string) => void;
}) {
  const { t, locale } = useTranslation();
  const dateLocale = dateLocaleOf(locale);
  const [view, setView] = useState<CalendarView>("week");
  const [campId, setCampId] = useState(camp.id);
  const [selectedKey, setSelectedKey] = useState(() => initialDayKey(camp.fixtures));
  if (campId !== camp.id) {
    setCampId(camp.id);
    setSelectedKey(initialDayKey(camp.fixtures));
    setView("week");
  }

  const markedDays = useMemo(
    () =>
      new Set(
        camp.fixtures
          .filter((fixture) => !fixture.isBye && !fixture.isHidden)
          .map((fixture) => dayKeyFromIso(fixture.scheduledAt))
          .filter(Boolean),
      ),
    [camp.fixtures],
  );
  const finishedDays = useMemo(() => {
    return new Set(
      [...markedDays].filter((key) => {
        const dayFixtures = camp.fixtures.filter((fixture) => dayKeyFromIso(fixture.scheduledAt) === key && fixture.status !== "cancelled");
        return dayFixtures.length > 0 && dayFixtures.every((fixture) => fixture.status === "finished");
      }),
    );
  }, [camp.fixtures, markedDays]);
  const selectedDate = parseDayKey(selectedKey) ?? new Date();
  const weekStart = startOfWeek(selectedDate);
  const todayKey = dayKeyFromDate(new Date());
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  function shiftWeek(delta: number) {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + delta * 7);
    setSelectedKey(dayKeyFromDate(next));
  }

  function revealed(fixtureId: string) {
    return revealedAll || revealedIds.includes(fixtureId);
  }

  const dayFixtures = camp.fixtures.filter((fixture) => dayKeyFromIso(fixture.scheduledAt) === selectedKey);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <CalendarViewToggle view={view} onChange={setView} />
      </div>
      {camp.fixtures.length === 0 ? <p className="mb-4 text-sm text-zinc-500">{t("pages.championship.noFixtures")}</p> : null}
      {view === "week" ? (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" aria-label={t("pages.championship.prevWeek")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-zinc-900 text-lg text-amber-100 hover:border-amber-400 hover:bg-zinc-800" onClick={() => shiftWeek(-1)}>
              ‹
            </button>
            <h3 className="text-center font-[family-name:var(--font-display)] text-lg tracking-wide text-amber-100">{formatWeekLabel(weekStart, dateLocale)}</h3>
            <button type="button" aria-label={t("pages.championship.nextWeek")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-zinc-900 text-lg text-amber-100 hover:border-amber-400 hover:bg-zinc-800" onClick={() => shiftWeek(1)}>
              ›
            </button>
          </div>
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 xl:grid xl:grid-cols-7 xl:overflow-visible">
            {weekDays.map((date) => {
              const key = dayKeyFromDate(date);
              const fixtures = camp.fixtures.filter((fixture) => dayKeyFromIso(fixture.scheduledAt) === key);
              const isToday = key === todayKey;
              const weekday = date.toLocaleDateString(dateLocale, { weekday: "short" });
              return (
                <section
                  key={key}
                  className={cn(
                    "flex min-h-48 w-[11.5rem] min-w-0 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-black/30 xl:w-auto",
                    isToday ? "border-amber-400/40" : "border-white/10",
                  )}
                >
                  <div className={cn("border-b border-white/10 px-3 py-2", isToday && "bg-amber-400/10")}>
                    <div className="text-[11px] uppercase tracking-wide text-zinc-500">{weekday}</div>
                    <div className={cn("font-[family-name:var(--font-display)] text-lg", isToday ? "text-amber-100" : "text-zinc-200")}>{date.getDate()}</div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-1.5">
                    {fixtures.map((fixture) => (
                      <FixtureCard
                        key={fixture.id}
                        camp={camp}
                        fixture={fixture}
                        layout="stack"
                        revealed={revealed(fixture.id)}
                        onReveal={() => onReveal(fixture.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <FixtureMonthCalendar markedDays={markedDays} finishedDays={finishedDays} selectedKey={selectedKey} onSelect={setSelectedKey} />
          <div className="mt-6 grid gap-3">
            {dayFixtures.length > 0 ? (
              dayFixtures.map((fixture) => (
                <FixtureCard
                  key={fixture.id}
                  camp={camp}
                  fixture={fixture}
                  revealed={revealed(fixture.id)}
                  onReveal={() => onReveal(fixture.id)}
                />
              ))
            ) : (
              <p className="text-sm text-zinc-500">{t("pages.championship.noFixtureDay")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Roster({
  camp,
  entryStatus,
  entryMessage,
  pending,
  loggedIn,
  loginTo,
  onSubmit,
}: {
  camp: ChampionshipDetail;
  entryStatus: string | null;
  entryMessage: string | null;
  pending: boolean;
  loggedIn: boolean;
  loginTo: string;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"list" | "show">("list");
  const [stats, setStats] = useState<AomRacePlayer[]>([]);
  const profileKey = camp.players.map((player) => player.profileId).join("|");

  useEffect(() => {
    let cancelled = false;
    void fetchAomRacePlayersByIds(profileKey.split("|")).then((rows) => {
      if (!cancelled) setStats(rows);
    }).catch(() => {
      if (!cancelled) setStats([]);
    });
    return () => {
      cancelled = true;
    };
  }, [profileKey]);

  return (
    <div>
      {camp.players.length > 0 ? (
        <div className="mb-4 flex justify-end">
          <div role="group" aria-label={t("pages.championship.rosterView")} className="inline-flex rounded-lg border border-white/10 bg-zinc-900/50 p-0.5">
            {(["list", "show"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition",
                  mode === option ? "bg-amber-500/20 text-amber-100" : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                {option === "list" ? t("pages.championship.rosterList") : t("pages.championship.rosterShow")}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {mode === "show" ? (
        <RosterPresentation players={camp.players} stats={stats} />
      ) : (
        <RosterList players={camp.players} stats={stats} />
      )}
      {camp.registrationEnabled ? (
        <div className="mt-6 rounded-2xl border border-amber-900/40 bg-black/40 p-4">
          <h2 className="font-[family-name:var(--font-display)] text-amber-100">{t("pages.championship.signup")}</h2>
          {entryStatus === "approved" ? <p className="mt-2 text-sm text-zinc-300">{t("pages.championship.entryApproved")}</p> : null}
          {entryStatus === "pending" ? <p className="mt-2 text-sm text-zinc-300">{t("pages.championship.entryPending")}</p> : null}
          {entryStatus === "rejected" ? <p className="mt-2 text-sm text-zinc-300">{t("pages.championship.entryRejected")}</p> : null}
          {!entryStatus && loggedIn ? (
            <button type="button" disabled={pending} onClick={onSubmit} className="mt-3 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60">
              {t("pages.championship.signupCta")}
            </button>
          ) : null}
          {!loggedIn ? (
            <Link to={loginTo} className="mt-3 inline-block text-sm text-amber-200 hover:underline">
              {t("pages.championship.loginToJoin")}
            </Link>
          ) : null}
          {entryMessage ? <p className="mt-2 text-sm text-zinc-300">{entryMessage}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
