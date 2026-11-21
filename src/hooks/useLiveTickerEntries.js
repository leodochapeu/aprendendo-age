import { useEffect, useState } from "react";
import { fetchChannelLiveStatus } from "@/lib/channelLiveStatus";
import { fetchStreamerChannels } from "@/lib/channelsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const POLL_MS = 3 * 60 * 1000;
let entries = [];
const listeners = new Set();
let pollStarted = false;
function publish(next) {
    entries = next;
    for (const listener of listeners)
        listener();
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
    }
    catch {
        /* mantém quem já estava na faixa */
    }
}
function toSlides(channels, liveById) {
    const slides = [];
    for (const channel of channels) {
        const preview = liveById.get(channel.id);
        if (preview)
            slides.push({ kind: "live", channel, preview });
    }
    return slides;
}
function ensureLiveTickerPoll() {
    if (pollStarted || typeof window === "undefined")
        return;
    pollStarted = true;
    void refreshLiveTicker();
    window.setInterval(() => {
        void refreshLiveTicker();
    }, POLL_MS);
}
/** Streamers ao vivo para a faixa do topo. Uma consulta compartilhada entre os componentes. */
export function useLiveTickerEntries() {
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
