import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode, type UIEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { ChampionshipEmblem } from "@/components/campeonato/ChampionshipEmblem";
import { ChampionshipMarkdown } from "@/components/campeonato/ChampionshipMarkdown";
import { EpicMatchCard } from "@/components/campeonato/EpicMatchCard";
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

function previewHref(pathname: string, slug: string, tab: Tab) {
  const base = pathname.startsWith("/championship") ? "championship" : "campeonato";
  return `/${base}/${slug}/${PANEL_SEGMENT[tab][base]}`;
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

function dayKeyFromIso(iso: string) {
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

function playerName(camp: ChampionshipDetail, id: string) {
  return camp.players.find((player) => player.id === id)?.name || "—";
}

export function CampeonatoPage() {
  const { slug = "", panel } = useParams();
  const { pathname } = useLocation();
  const panelTab = tabFromPanel(panel);
  const preview = Boolean(panel);
  const { t, locale } = useTranslation();
  const { user, profile, profileLoadState, status } = useAuth();
  const includeDev = status === "authenticated" && profileLoadState === "ready" && profile?.role === "admin";
  const authReady = status !== "loading" && (status !== "authenticated" || profileLoadState === "ready");
  const [camp, setCamp] = useState<ChampionshipDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("about");
  const [spoilersSlug, setSpoilersSlug] = useState(slug);
  const [spoilers, setSpoilers] = useState<SpoilerState>(() => loadSpoilers(slug));
  const [entryStatus, setEntryStatus] = useState<string | null>(null);
  const [entryMessage, setEntryMessage] = useState<string | null>(null);
  const [entryPending, setEntryPending] = useState(false);

  if (spoilersSlug !== slug) {
    setSpoilersSlug(slug);
    setSpoilers(loadSpoilers(slug));
  }

  useEffect(() => {
    if (!slug || spoilersSlug !== slug) return;
    window.localStorage.setItem(spoilerKey(slug), JSON.stringify(spoilers));
  }, [slug, spoilers, spoilersSlug]);

  const activeTab = panelTab ?? tab;

  useEffect(() => {
    if (!authReady) return;
    if (panel && !panelTab) {
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
  }, [authReady, includeDev, panel, panelTab, slug, t]);

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
    const rows = new Map(camp.players.map((player) => [player.id, { name: player.name, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }]));
    for (const fixture of camp.fixtures) {
      if (fixture.status !== "finished") continue;
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
  const onPreviewScroll = (event: UIEvent<HTMLDivElement>) => {
    const compact = Math.min(1, Math.max(0, event.currentTarget.scrollTop / 160));
    previewHeaderRef.current?.style.setProperty("--compact", String(compact));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: t("pages.championship.tabs.about") },
    { id: "brackets", label: t("pages.championship.tabs.brackets") },
    { id: "roster", label: t("pages.championship.tabs.roster") },
    { id: "table", label: t("pages.championship.tabs.table") },
    { id: "calendar", label: t("pages.championship.tabs.calendar") },
  ];

  return (
    <div className="relative min-h-dvh bg-[#07080c] text-zinc-100">
      <ParticleField />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.72)_78%)]" />
      <div className={cn("relative mx-auto px-4 sm:px-6", activeTab === "calendar" ? "max-w-[90rem]" : "max-w-5xl", preview ? "flex h-dvh max-h-dvh flex-col overflow-hidden pt-3" : "py-8")}>
        {preview ? null : (
        <div className="mb-8 flex items-center justify-between text-sm">
          <Link to="/" className="font-[family-name:var(--font-display)] tracking-wide text-amber-100/90">
            Aprendendo AGE
          </Link>
          <Link to="/campeonato" className="text-zinc-400 hover:text-amber-100">
            {t("pages.championship.backToIndex")}
          </Link>
        </div>
        )}

        {loading ? <p className="text-zinc-400">{t("pages.championship.loading")}</p> : null}
        {error ? <p className="text-red-200">{error}</p> : null}
        {camp ? (
          <>
            {preview ? (
              <PreviewStage
                ref={previewHeaderRef}
                camp={camp}
                tabLabel={tabs.find((item) => item.id === activeTab)?.label ?? ""}
                backTo={pathname.startsWith("/championship") ? `/championship/${camp.slug}` : `/campeonato/${camp.slug}`}
                backLabel={t("pages.championship.backToChampionship")}
                reveal={
                  isSpoilerTab(activeTab) ? (
                    <RevealAllButton
                      revealed={isTabFullyRevealed(activeTab, camp.fixtures, spoilers[activeTab])}
                      revealLabel={t("pages.championship.revealAll")}
                      hideLabel={t("pages.championship.hideResults")}
                      onClick={() => toggleRevealAll(activeTab)}
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
                {camp.description ? <ChampionshipMarkdown source={camp.description} className="mt-2 max-w-2xl" /> : null}
              </div>
            </header>
            )}

            {preview ? null : (
            <div className="relative z-20 mt-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`rounded-full px-3 py-1 text-sm ${activeTab === item.id ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40" : "text-zinc-400 hover:text-zinc-100"}`}
                >
                  {item.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                {isSpoilerTab(activeTab) ? (
                  <RevealAllButton
                    revealed={isTabFullyRevealed(activeTab, camp.fixtures, spoilers[activeTab])}
                    revealLabel={t("pages.championship.revealAll")}
                    hideLabel={t("pages.championship.hideResults")}
                    onClick={() => toggleRevealAll(activeTab)}
                  />
                ) : null}
                <PreviewLink href={previewHref(pathname, camp.slug, activeTab)} label={t("pages.championship.openPreview")} />
              </div>
            </div>
            )}

            <div className={cn(preview ? "min-h-0 flex-1 overflow-y-auto pb-10" : "mt-6")} onScroll={preview ? onPreviewScroll : undefined}>
              {activeTab === "about" ? (
                <div className="space-y-6">
                  {camp.rules ? (
                    <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <h2 className="font-[family-name:var(--font-display)] text-amber-100">{t("pages.championship.rules")}</h2>
                      <ChampionshipMarkdown source={camp.rules} className="mt-3" />
                    </section>
                  ) : null}
                  {camp.prizeEnabled ? <PrizeBlock camp={camp} /> : null}
                </div>
              ) : null}
              {activeTab === "brackets" ? (
                <BracketList
                  camp={camp}
                  revealedAll={spoilers.brackets.all}
                  revealedIds={spoilers.brackets.ids}
                  onReveal={(fixtureId) => revealFixture("brackets", fixtureId)}
                />
              ) : null}
              {activeTab === "roster" ? (
                <Roster
                  camp={camp}
                  entryStatus={entryStatus}
                  entryMessage={entryMessage}
                  pending={entryPending}
                  loggedIn={status === "authenticated"}
                  loginTo={`${localeAuthPath(locale, "login")}?next=${encodeURIComponent(`/campeonato/${camp.slug}`)}`}
                  onSubmit={() => {
                    if (!user) return;
                    setEntryPending(true);
                    setEntryMessage(null);
                    void submitChampionshipEntry({
                      championshipId: camp.id,
                      profileId: user.id,
                      displayName: profile?.aomstatsAlias || profile?.displayName || "Jogador",
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
              {activeTab === "table" ? (
                <div className="relative overflow-hidden rounded-2xl border border-white/10">
                  <table className={cn("w-full text-left text-sm", !spoilers.table.all && "pointer-events-none select-none")}>
                    <thead className="bg-black/40 text-zinc-400">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">{t("pages.championship.player")}</th>
                        <th className="px-3 py-2">J</th>
                        <th className="px-3 py-2">V</th>
                        <th className="px-3 py-2">E</th>
                        <th className="px-3 py-2">D</th>
                        <th className="px-3 py-2">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row, index) => (
                        <tr key={row.name} className="border-t border-white/5">
                          <td className="px-3 py-2 text-zinc-500">{index + 1}</td>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.played}</td>
                          <td className="px-3 py-2">{row.wins}</td>
                          <td className="px-3 py-2">{row.draws}</td>
                          <td className="px-3 py-2">{row.losses}</td>
                          <td className="px-3 py-2 text-amber-100">{row.points}</td>
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
              <div className={activeTab === "calendar" ? "block" : "hidden"}>
                <Calendar
                  camp={camp}
                  revealedAll={spoilers.calendar.all}
                  revealedIds={spoilers.calendar.ids}
                  onReveal={(fixtureId) => revealFixture("calendar", fixtureId)}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
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
    <header
      ref={ref}
      className="z-30 shrink-0 bg-gradient-to-b from-[#07080c] via-[#07080c] to-transparent px-1 pb-2"
      style={{ ["--compact" as string]: 0 }}
    >
      <div className="flex items-center justify-between gap-3">
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
  const when = new Date(fixture.scheduledAt);
  const hasResult = fixtureHasResult(fixture);
  const visible = revealed && hasResult;
  const whenLabel = Number.isNaN(when.getTime())
    ? ""
    : when.toLocaleString(dateLocale, {
        day: "2-digit",
        month: "short",
        ...(layout === "stack" ? {} : { year: "numeric" as const }),
        hour: "2-digit",
        minute: "2-digit",
      });
  const playerA = camp.players.find((player) => player.id === fixture.playerAId) ?? { name: playerName(camp, fixture.playerAId), logoUrl: "" };
  const playerB = camp.players.find((player) => player.id === fixture.playerBId) ?? { name: playerName(camp, fixture.playerBId), logoUrl: "" };
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
          roundLabel={fixture.roundLabel}
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
  const rounds = [...new Set(camp.fixtures.map((fixture) => fixture.roundLabel))];
  if (rounds.length === 0) return <p className="text-sm text-zinc-500">—</p>;
  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <section key={round}>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-amber-100">{round}</h2>
          <div className="grid gap-3">
            {camp.fixtures
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

function FixtureMonthCalendar({
  markedDays,
  selectedKey,
  onSelect,
}: {
  markedDays: Set<string>;
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
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition",
                selected ? "bg-amber-400 text-zinc-950" : "bg-emerald-950/80 text-emerald-200 hover:bg-emerald-900",
                !selected && today && "ring-2 ring-amber-300/80",
              )}
            >
              {day}
              {marked ? <span className={cn("absolute bottom-1.5 h-1 w-1 rounded-full", selected ? "bg-zinc-950" : "bg-amber-300")} /> : null}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-800" />
          {t("pages.championship.legendOpen")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          {t("pages.championship.legendMatch")}
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
    () => new Set(camp.fixtures.map((fixture) => dayKeyFromIso(fixture.scheduledAt)).filter(Boolean)),
    [camp.fixtures],
  );
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
          <FixtureMonthCalendar markedDays={markedDays} selectedKey={selectedKey} onSelect={setSelectedKey} />
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {camp.players.map((player) => (
          <div key={player.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-900">
              {player.logoUrl ? <img src={player.logoUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="font-medium">{player.name}</div>
          </div>
        ))}
      </div>
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
