import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { LiveStreamCard } from "@/components/channels/LiveStreamCard";
import type { Channel } from "@/data/channels";
import { useChannelLiveStatus } from "@/hooks/useChannelLiveStatus";
import { useTranslation } from "@/hooks/useTranslation";
import { fetchStreamerChannels } from "@/lib/channelsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function HomeLiveStreamers() {
  const { t } = useTranslation();
  const supabaseConfigured = isSupabaseConfigured();
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    if (!supabaseConfigured) return;

    let cancelled = false;
    void fetchStreamerChannels()
      .then((list) => {
        if (!cancelled) setChannels(list);
      })
      .catch(() => {
        if (!cancelled) setChannels([]);
      });

    return () => {
      cancelled = true;
    };
  }, [supabaseConfigured]);

  const { liveById } = useChannelLiveStatus(channels);
  const liveChannels = useMemo(
    () => channels.filter((channel) => liveById.has(channel.id)),
    [channels, liveById],
  );

  if (!supabaseConfigured) return null;

  return (
    <section className="space-y-5" aria-labelledby="home-streamers-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 h-1 w-12 rounded-full bg-gradient-to-r from-amber-500/80 to-amber-400/20" aria-hidden />
          <h2
            id="home-streamers-heading"
            className="font-[family-name:var(--font-display)] text-xl font-semibold text-amber-100 sm:text-2xl"
          >
            {t("pages.home.streamersTitle")}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {t("pages.home.streamersDesc")}
          </p>
        </div>
        <Link
          to="/links-streamers"
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-amber-500/45 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-400/55 hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/35"
        >
          {t("pages.home.streamersCta")}
        </Link>
      </div>

      {liveChannels.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2" aria-label={t("pages.streamerLinks.liveListAria")}>
          {liveChannels.map((channel) => {
            const preview = liveById.get(channel.id);
            if (!preview) return null;
            return (
              <li key={channel.id} className="min-w-0">
                <LiveStreamCard channel={channel} preview={preview} />
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
