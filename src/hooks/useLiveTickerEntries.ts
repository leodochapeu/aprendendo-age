import { useEffect, useState } from "react";

import type { Channel } from "@/data/channels";
import { fetchChannelLiveStatus, type ChannelLiveSnapshot } from "@/lib/channelLiveStatus";
import { fetchStreamerChannels } from "@/lib/channelsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { TickerLiveSlide } from "@/lib/tickerSlides";

const POLL_MS = 3 * 60 * 1000;

let entries: TickerLiveSlide[] = [];
const listeners = new Set<() => void>();
let pollStarted = false;

function publish(next: TickerLiveSlide[]) {
  entries = next;
  for (const listener of listeners) listener();
}

async function refreshLiveTicker() {
  if (!isSupabaseConfigured()) {
    publish([]);
    return;
  }
  try {
    const channels = await fetchStreamerChannels();
    const liveById = await fetchChannelLiveStatus(channels);
    publish(toSlides(channels, liveById));
  } catch {
    /* mantém quem já estava na faixa */
  }
}

function toSlides(channels: Channel[], liveById: Map<string, ChannelLiveSnapshot>): TickerLiveSlide[] {
  const slides: TickerLiveSlide[] = [];
  for (const channel of channels) {
    const preview = liveById.get(channel.id);
    if (preview) slides.push({ kind: "live", channel, preview });
  }
  return slides;
}

function ensureLiveTickerPoll() {
  if (pollStarted || typeof window === "undefined") return;
  pollStarted = true;
  void refreshLiveTicker();
  window.setInterval(() => {
    void refreshLiveTicker();
  }, POLL_MS);
}

/** Streamers ao vivo para a faixa do topo. Uma consulta compartilhada entre os componentes. */
export function useLiveTickerEntries(): TickerLiveSlide[] {
  const [value, setValue] = useState(entries);

  useEffect(() => {
    ensureLiveTickerPoll();
    const listener = () => setValue(entries);
    listeners.add(listener);
    setValue(entries);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return value;
}
