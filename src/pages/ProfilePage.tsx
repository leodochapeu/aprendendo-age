import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AomStatsSyncModal } from "@/components/aomstats/AomStatsSyncModal";
import { ProfileGodsSection } from "@/components/rank/ProfileGodsSection";
import { RankProfileHero } from "@/components/rank/rankProfileUi";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { buildRankHeroFromProfile } from "@/lib/aomstatsProfileSync";
import { buildPlayerGods, fetchProfileGods, type PlayerGodAggregate } from "@/lib/clanGodsApi";
import { cn } from "@/lib/cn";
import { getRankClassification } from "@/lib/rankClassification";
import { localeAuthPath } from "@/lib/localeRoutes";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function formatMemberSince(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
      dateStyle: "long",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatSnapshotDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ProfilePage() {
  const { t, locale } = useTranslation();
  const { status, profile, profileLoadState, signOut, syncAomStats, unsyncAomStats } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [profileGods, setProfileGods] = useState<PlayerGodAggregate[]>([]);
  const [godsLoading, setGodsLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
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
        if (!cancelled) setProfileGods(buildPlayerGods(rows));
      } catch {
        if (!cancelled) setProfileGods(buildPlayerGods([]));
      } finally {
        if (!cancelled) setGodsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?.aomstatsId, profile?.aomstatsSnapshotAt]);

  const rankHero = useMemo(() => (profile ? buildRankHeroFromProfile(profile) : null), [profile]);
  const classification = rankHero ? getRankClassification(rankHero.rr, locale) : null;

  if (status === "loading" || status === "unauthenticated" || status === "unconfigured") {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-aom-border bg-zinc-950/80 p-6">
        <p className="text-sm text-zinc-400">{t("auth.redirecting")}</p>
      </div>
    );
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
    if (res.ok === false) setActionError(res.message);
  }

  return (
    <div className="mx-auto w-full max-w-[min(100%,88rem)] space-y-8 pb-10">
      <div className="rounded-2xl border border-aom-border bg-zinc-950/80 p-5 sm:p-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-amber-200">
          {t("auth.profileTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{t("auth.profileSubtitle")}</p>

        {loadingProfile ? (
          <p className="mt-4 text-sm text-zinc-400">{t("auth.loadingProfile")}</p>
        ) : (
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">{t("auth.email")}</dt>
              <dd className="mt-0.5 font-medium text-zinc-100">{email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("auth.memberSince")}</dt>
              <dd className="mt-0.5 font-medium text-zinc-100">{memberSince}</dd>
            </div>
          </dl>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => setSyncModalOpen(true)}
            className={cn(
              "rounded-lg border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-semibold text-amber-200/95",
              "transition hover:border-amber-500/45 hover:bg-zinc-800/90 disabled:opacity-50",
            )}
          >
            {t("auth.aomstatsSyncButton")}
          </button>
          {hasAomstats ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void handleUnsync()}
              className={cn(
                "rounded-lg border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-300",
                "transition hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-100 disabled:opacity-50",
              )}
            >
              {t("auth.aomstatsUnsync")}
            </button>
          ) : null}
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => void signOut().then(() => navigate("/"))}
            className={cn(
              "rounded-lg border border-aom-border bg-zinc-900/80 px-4 py-2.5 text-sm font-medium text-zinc-300",
              "transition hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-100 disabled:opacity-50",
            )}
          >
            {t("auth.signOut")}
          </button>
        </div>

        {actionError ? (
          <p className="mt-3 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
            {actionError}
          </p>
        ) : null}
      </div>

      {rankHero && classification ? (
        <div className="space-y-10">
          <section aria-labelledby="profile-rank-heading">
            <h2 id="profile-rank-heading" className="sr-only">
              {t("pages.rank.resultHeading", { name: rankHero.player.profileName })}
            </h2>
            {profile?.aomstatsSnapshotAt ? (
              <p className="mb-4 text-center text-xs text-zinc-500">
                {t("auth.aomstatsSnapshotNote", {
                  date: formatSnapshotDate(profile.aomstatsSnapshotAt, locale),
                })}
              </p>
            ) : null}
            <RankProfileHero
              player={rankHero.player}
              row1v1={rankHero.row1v1}
              rr={rankHero.rr}
              classification={classification}
            />
          </section>

          <ProfileGodsSection gods={profileGods} loading={godsLoading} />
        </div>
      ) : (
        <p className="rounded-2xl border border-aom-border/60 bg-zinc-950/50 px-4 py-8 text-center text-sm text-zinc-500">
          {t("auth.aomstatsNotLinked")}
        </p>
      )}

      <AomStatsSyncModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        initialSearchText={profile?.displayName?.trim() ?? profile?.aomstatsAlias?.trim() ?? ""}
        onConfirm={async (payload) => {
          setActionBusy(true);
          setActionError(null);
          const res = await syncAomStats(payload);
          setActionBusy(false);
          if (res.ok === false) return { error: res.message };
        }}
      />
    </div>
  );
}
