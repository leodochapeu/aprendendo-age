import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Channel } from "@/data/channels";
import { fetchChannelLiveStatus, type ChannelLiveSnapshot } from "@/lib/channelLiveStatus";

const POLL_INTERVAL_MS = 3 * 60 * 1000;

export function useChannelLiveStatus(channels: Channel[]) {
  const [liveById, setLiveById] = useState<Map<string, ChannelLiveSnapshot>>(() => new Map());
  const [checking, setChecking] = useState(false);
  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  const runCheck = useCallback(async () => {
    const list = channelsRef.current;
    const streamable = list.filter((c) => c.category === "youtube" || c.category === "twitch");
    if (streamable.length === 0) {
      setLiveById(new Map());
      return;
    }

    setChecking(true);
    try {
      const next = await fetchChannelLiveStatus(list);
      setLiveById(next);
    } catch {
      /* fail-open: mantém estado anterior */
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const streamable = channels.filter((c) => c.category === "youtube" || c.category === "twitch");
    if (streamable.length === 0) {
      setLiveById(new Map());
      return;
    }

    let cancelled = false;

    void (async () => {
      setChecking(true);
      try {
        const next = await fetchChannelLiveStatus(channels);
        if (!cancelled) setLiveById(next);
      } catch {
        /* fail-open */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    const intervalId = window.setInterval(() => {
      void runCheck();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [channels, runCheck]);

  const liveIds = useMemo(() => new Set(liveById.keys()), [liveById]);

  return { liveIds, liveById, checking, refreshLiveStatus: runCheck };
}
