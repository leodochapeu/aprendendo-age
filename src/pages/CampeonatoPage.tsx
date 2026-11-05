import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ParticleField } from "@/components/campeonato/ParticleField";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { localeAuthPath } from "@/lib/localeRoutes";
import {
  fetchChampionshipBySlug,
  fetchMyChampionshipEntry,
  submitChampionshipEntry,
  type ChampionshipDetail,
  type ChampionshipFixture,
  type ChampionshipPhase,
} from "@/lib/championshipsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Tab = "about" | "brackets" | "roster" | "table" | "calendar";

const PHASE_KEY: Record<ChampionshipPhase, string> = {
  registration: "pages.championship.phase.registration",
  ongoing: "pages.championship.phase.ongoing",
  finished: "pages.championship.phase.finished",
};

const SPOILER_KEY = "campeonato-show-results";

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function playerName(camp: ChampionshipDetail, id: string) {
  return camp.players.find((player) => player.id === id)?.name || "—";
}

export function CampeonatoPage() {
  const { slug = "" } = useParams();
  const { t, locale } = useTranslation();
  const { user, profile, status } = useAuth();
  const [camp, setCamp] = useState<ChampionshipDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("about");
  const [showResults, setShowResults] = useState(false);
  const [entryStatus, setEntryStatus] = useState<string | null>(null);
  const [entryMessage, setEntryMessage] = useState<string | null>(null);
  const [entryPending, setEntryPending] = useState(false);

  useEffect(() => {
    setShowResults(window.localStorage.getItem(SPOILER_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setError(t("pages.championship.unconfigured"));
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchChampionshipBySlug(slug)
      .then((row) => {
        if (cancelled) return;
        setCamp(row);
        if (!row) setError(t("pages.championship.notFound"));
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
  }, [slug]);

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

  function toggleResults() {
    setShowResults((current) => {
      const next = !current;
      window.localStorage.setItem(SPOILER_KEY, next ? "1" : "0");
      return next;
    });
  }

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
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between text-sm">
          <Link to="/" className="font-[family-name:var(--font-display)] tracking-wide text-amber-100/90">
            Aprendendo AGE
          </Link>
          <Link to="/campeonato" className="text-zinc-400 hover:text-amber-100">
            {t("pages.championship.backToIndex")}
          </Link>
        </div>

        {loading ? <p className="text-zinc-400">{t("pages.championship.loading")}</p> : null}
        {error ? <p className="text-red-200">{error}</p> : null}
        {camp ? (
          <>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {camp.logoUrl ? (
                <img src={camp.logoUrl} alt="" className="h-20 w-20 rounded-2xl border border-amber-900/50 bg-black/40 object-contain p-2" />
              ) : null}
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">{t(PHASE_KEY[camp.phase])}</div>
                <h1 className="font-[family-name:var(--font-display)] text-4xl text-amber-50">{camp.name}</h1>
                {camp.description ? <p className="mt-2 max-w-2xl text-zinc-300">{camp.description}</p> : null}
              </div>
            </header>

            <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-3">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`rounded-full px-3 py-1 text-sm ${tab === item.id ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40" : "text-zinc-400 hover:text-zinc-100"}`}
                >
                  {item.label}
                </button>
              ))}
              <button type="button" onClick={toggleResults} className="ml-auto text-sm text-zinc-400 hover:text-amber-100">
                {showResults ? t("pages.championship.hideResults") : t("pages.championship.showResults")}
              </button>
            </div>

            <div className="mt-6">
              {tab === "about" ? (
                <div className="space-y-6">
                  {camp.rules ? (
                    <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <h2 className="font-[family-name:var(--font-display)] text-amber-100">{t("pages.championship.rules")}</h2>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{camp.rules}</p>
                    </section>
                  ) : null}
                  {camp.prizeEnabled ? <PrizeBlock camp={camp} /> : null}
                </div>
              ) : null}
              {tab === "brackets" ? <BracketList camp={camp} showResults={showResults} /> : null}
              {tab === "roster" ? (
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
              {tab === "table" ? (
                <div className="relative overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-left text-sm">
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
                  {!showResults ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-zinc-200 backdrop-blur-sm">
                      {t("pages.championship.tableHidden")}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {tab === "calendar" ? <Calendar camp={camp} showResults={showResults} /> : null}
            </div>
          </>
        ) : null}
      </div>
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
    <section className="rounded-2xl border border-amber-900/40 bg-black/45 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-amber-200">
            {camp.prizeMode === "donations" ? t("pages.championship.prizeDonations") : t("pages.championship.prizeFixed")}
          </h2>
          {camp.prizeNote ? <p className="mt-2 max-w-xl text-sm text-zinc-400">{camp.prizeNote}</p> : null}
        </div>
        {camp.prizeMode === "donations" ? (
          <div className="text-right">
            <div className="text-xs uppercase text-zinc-500">{t("pages.championship.raised")}</div>
            <div className="text-2xl text-amber-50">{formatBrl(raised)}</div>
            {goal > 0 ? <div className="text-xs text-zinc-500">{t("pages.championship.goal")} {formatBrl(goal)}</div> : null}
          </div>
        ) : null}
      </div>
      {camp.prizeMode === "donations" && goal > 0 ? (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-amber-300" style={{ width: `${ratio * 100}%` }} />
          </div>
          <div className="mt-1 text-xs text-zinc-500">{Math.round(ratio * 1000) / 10}% {t("pages.championship.ofGoal")}</div>
        </div>
      ) : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
              className={`rounded-xl border p-4 ${highlight ? "border-amber-400/50 bg-amber-950/30" : "border-white/10"}`}
            >
              <div className="text-xs text-zinc-400">
                {place.label || `${place.place}º`}
                {camp.prizeMode === "donations" && place.sharePercent != null ? ` (${place.sharePercent.toFixed(2)}%)` : ""}
              </div>
              <div className="mt-1 text-xl text-amber-50">{amount != null ? formatBrl(amount) : "—"}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FixtureCard({
  camp,
  fixture,
  showResults,
}: {
  camp: ChampionshipDetail;
  fixture: ChampionshipFixture;
  showResults: boolean;
}) {
  const when = new Date(fixture.scheduledAt);
  const aWins = showResults && fixture.games.length > 0 && fixture.scoreA > fixture.scoreB;
  const bWins = showResults && fixture.games.length > 0 && fixture.scoreB > fixture.scoreA;
  return (
    <article className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {fixture.roundLabel}
        {Number.isNaN(when.getTime()) ? "" : ` · ${when.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className={aWins ? "text-amber-100" : "text-zinc-100"}>{playerName(camp, fixture.playerAId)}</div>
        <div className="text-sm text-zinc-400">
          {showResults && fixture.games.length > 0 ? `${fixture.scoreA} × ${fixture.scoreB}` : "vs"}
        </div>
        <div className={`text-right ${bWins ? "text-amber-100" : "text-zinc-100"}`}>{playerName(camp, fixture.playerBId)}</div>
      </div>
      {showResults
        ? fixture.games.map((game) => (
            <div key={game.id} className="mt-2 text-xs text-zinc-400">
              {game.mapName} · {game.godA} × {game.godB}
              {game.winnerSide === "A" ? ` · ${playerName(camp, fixture.playerAId)}` : ` · ${playerName(camp, fixture.playerBId)}`}
            </div>
          ))
        : null}
      {fixture.links.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {fixture.links.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="text-xs text-amber-200 underline-offset-2 hover:underline">
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function BracketList({ camp, showResults }: { camp: ChampionshipDetail; showResults: boolean }) {
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
                <FixtureCard key={fixture.id} camp={camp} fixture={fixture} showResults={showResults} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Calendar({ camp, showResults }: { camp: ChampionshipDetail; showResults: boolean }) {
  const groups = new Map<string, ChampionshipFixture[]>();
  for (const fixture of camp.fixtures) {
    const date = new Date(fixture.scheduledAt);
    const key = Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    groups.set(key, [...(groups.get(key) ?? []), fixture]);
  }
  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([day, fixtures]) => (
        <section key={day}>
          <h2 className="mb-3 capitalize text-amber-100">{day}</h2>
          <div className="grid gap-3">
            {fixtures.map((fixture) => (
              <FixtureCard key={fixture.id} camp={camp} fixture={fixture} showResults={showResults} />
            ))}
          </div>
        </section>
      ))}
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
  return (
    <div>
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
