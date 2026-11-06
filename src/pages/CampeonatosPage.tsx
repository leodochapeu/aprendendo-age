import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ChampionshipEmblem } from "@/components/campeonato/ChampionshipEmblem";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { fetchPublicChampionships, type ChampionshipCard, type ChampionshipPhase } from "@/lib/championshipsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const PHASE_KEY: Record<ChampionshipPhase, string> = {
  registration: "pages.championship.phase.registration",
  ongoing: "pages.championship.phase.ongoing",
  finished: "pages.championship.phase.finished",
};

export function CampeonatosPage() {
  const { t } = useTranslation();
  const { status, profile, profileLoadState } = useAuth();
  const includeDev = status === "authenticated" && profileLoadState === "ready" && profile?.role === "admin";
  const authReady = status !== "loading" && (status !== "authenticated" || profileLoadState === "ready");
  const [rows, setRows] = useState<ChampionshipCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady) return;
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setError(t("pages.championship.unconfigured"));
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchPublicChampionships(includeDev)
      .then((list) => {
        if (!cancelled) setRows(list);
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
  }, [authReady, includeDev, t]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-amber-100">{t("pages.championship.indexTitle")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">{t("pages.championship.indexLead")}</p>
      {loading ? <p className="mt-8 text-sm text-zinc-500">{t("pages.championship.loading")}</p> : null}
      {error ? <p className="mt-8 text-sm text-red-200">{error}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows.map((camp) => (
          <Link
            key={camp.id}
            to={`/campeonato/${camp.slug}`}
            className="group rounded-2xl border border-amber-900/40 bg-zinc-950/80 p-5 shadow-lg shadow-black/30 transition hover:border-amber-500/40"
          >
            <div className="flex items-start gap-7">
              {camp.logoUrl ? (
                <ChampionshipEmblem src={camp.logoUrl} className="h-16 w-16" burst={1.62} />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-xl border border-white/10 bg-black/40" />
              )}
              <div className="min-w-0">
                <div className="font-[family-name:var(--font-display)] text-xl text-amber-50 group-hover:text-amber-200">{camp.name}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-amber-200/80">
                  {t(PHASE_KEY[camp.phase])}
                  {camp.devMode ? " · Modo Dev" : ""}
                </div>
                {camp.description ? <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{camp.description}</p> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!loading && !error && rows.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">{t("pages.championship.empty")}</p>
      ) : null}
    </div>
  );
}
