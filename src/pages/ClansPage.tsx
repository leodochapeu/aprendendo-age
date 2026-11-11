import { useEffect, useState } from "react";

import { ClanListGrid } from "@/components/clans/ClanListCard";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Clan } from "@/data/clans";
import { useTranslation } from "@/hooks/useTranslation";
import { fetchClans } from "@/lib/clansApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function ClansPage() {
  const { t } = useTranslation();
  const supabaseConfigured = isSupabaseConfigured();
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      setClans([]);
      setError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setError(t("pages.clans.loadTimeout"));
        setLoading(false);
      }
    }, 20_000);

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchClans({ origin: "br" });
        if (cancelled) return;
        window.clearTimeout(timeoutId);
        setClans(list);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        window.clearTimeout(timeoutId);
        setError(err instanceof Error ? err.message : t("pages.clans.loadError"));
        setClans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [supabaseConfigured, t]);

  return (
    <div className="space-y-8 pb-16">
      <PageHeader title={t("pages.clans.title")} description={t("pages.clans.description")} />

      <div className="overflow-hidden rounded-2xl border border-aom-border/60 bg-[#141414] shadow-lg shadow-black/40">
        <div className="border-b border-zinc-800/90 px-4 py-3 sm:px-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{t("common.community")}</p>
          <p className="mt-1 text-sm text-zinc-400">{t("pages.clans.sectionDesc")}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center px-4 py-16">
            <span
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-500/25 border-t-amber-500"
              aria-hidden
            />
            <p className="mt-4 text-sm text-zinc-500">{t("pages.clans.loading")}</p>
          </div>
        ) : !supabaseConfigured ? (
          <p
            className="m-4 rounded-xl border border-amber-900/45 bg-amber-950/35 px-4 py-3 text-sm text-amber-100/90"
            role="status"
          >
            {t("pages.clans.unconfigured")}
          </p>
        ) : error ? (
          <p
            className="m-4 rounded-xl border border-red-900/45 bg-red-950/35 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : clans.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-zinc-500">{t("pages.clans.empty")}</p>
        ) : (
          <ClanListGrid clans={clans} />
        )}
      </div>
    </div>
  );
}
