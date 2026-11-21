import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChannelGrid } from "@/components/channels/ChannelCard";
import { LiveStreamCard } from "@/components/channels/LiveStreamCard";
import { ChannelSubmitModal } from "@/components/channels/ChannelSubmitModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useChannelLiveStatus } from "@/hooks/useChannelLiveStatus";
import { useTranslation } from "@/hooks/useTranslation";
import { canManageChannels } from "@/lib/auth/constants";
import { sortChannelsLiveFirst } from "@/lib/channelLiveStatus";
import { fetchStreamerChannels } from "@/lib/channelsApi";
import { cn } from "@/lib/cn";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const adminBtnClass = cn("inline-flex items-center justify-center rounded-xl border border-amber-500/45 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 transition", "hover:border-amber-400/55 hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/35");
export function LinksStreamersPage() {
    const { t } = useTranslation();
    const { status, profile, profileLoadState } = useAuth();
    const supabaseConfigured = isSupabaseConfigured();
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(supabaseConfigured);
    const [error, setError] = useState(null);
    const [submitOpen, setSubmitOpen] = useState(false);
    const loadChannels = useCallback(async () => {
        if (!supabaseConfigured) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const list = await fetchStreamerChannels();
            setChannels(list);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : t("pages.streamerLinks.loadError"));
            setChannels([]);
        }
        finally {
            setLoading(false);
        }
    }, [supabaseConfigured, t]);
    useEffect(() => {
        if (!supabaseConfigured) {
            setLoading(false);
            setChannels([]);
            setError(null);
            return;
        }
        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            if (!cancelled) {
                setError(t("pages.streamerLinks.loadTimeout"));
                setLoading(false);
            }
        }, 20_000);
        void (async () => {
            try {
                await loadChannels();
                if (!cancelled)
                    window.clearTimeout(timeoutId);
            }
            catch {
                if (!cancelled)
                    window.clearTimeout(timeoutId);
            }
        })();
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [loadChannels, supabaseConfigured, t]);
    const canAddChannel = status === "authenticated" && profileLoadState === "ready" && canManageChannels(profile?.role);
    const { liveIds, liveById, checking } = useChannelLiveStatus(channels);
    const displayChannels = useMemo(() => sortChannelsLiveFirst(channels, liveIds), [channels, liveIds]);
    const liveChannels = useMemo(() => displayChannels.filter((channel) => liveById.has(channel.id)), [displayChannels, liveById]);
    const otherChannels = useMemo(() => displayChannels.filter((channel) => !liveById.has(channel.id)), [displayChannels, liveById]);
    return (_jsxs("div", { className: "space-y-8 pb-16", children: [_jsx(PageHeader, { title: t("pages.streamerLinks.title"), description: t("pages.streamerLinks.description") }), canAddChannel ? (_jsx("div", { children: _jsx("button", { type: "button", onClick: () => setSubmitOpen(true), className: adminBtnClass, children: t("pages.streamerLinks.addChannel") }) })) : null, _jsxs("div", { className: "overflow-hidden rounded-2xl border border-aom-border/60 bg-[#141414] shadow-lg shadow-black/40", children: [_jsx("div", { className: "border-b border-zinc-800/90 px-4 py-3 sm:px-5", children: _jsxs("div", { className: "flex flex-wrap items-end justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.2em] text-zinc-500", children: t("common.community") }), _jsx("p", { className: "mt-1 text-sm text-zinc-400", children: t("pages.streamerLinks.sectionDesc") })] }), checking && channels.length > 0 ? (_jsx("p", { className: "text-[10px] font-medium uppercase tracking-wider text-emerald-500/70", children: t("pages.streamerLinks.liveChecking") })) : null] }) }), loading ? (_jsxs("div", { className: "flex flex-col items-center justify-center px-4 py-16", children: [_jsx("span", { className: "inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-500/25 border-t-amber-500", "aria-hidden": true }), _jsx("p", { className: "mt-4 text-sm text-zinc-500", children: t("pages.streamerLinks.loading") })] })) : !supabaseConfigured ? (_jsx("p", { className: "m-4 rounded-xl border border-amber-900/45 bg-amber-950/35 px-4 py-3 text-sm text-amber-100/90", role: "status", children: t("pages.streamerLinks.unconfigured") })) : error ? (_jsx("p", { className: "m-4 rounded-xl border border-red-900/45 bg-red-950/35 px-4 py-3 text-sm text-red-200", role: "alert", children: error })) : channels.length === 0 ? (_jsx("p", { className: "px-4 py-12 text-center text-sm text-zinc-500", children: t("pages.streamerLinks.empty") })) : (_jsxs("div", { className: "space-y-5 p-4 sm:p-5", children: [liveChannels.length > 0 ? (_jsx("ul", { className: "grid gap-4 sm:grid-cols-2", "aria-label": t("pages.streamerLinks.liveListAria"), children: liveChannels.map((channel) => {
                                    const preview = liveById.get(channel.id);
                                    if (!preview)
                                        return null;
                                    return (_jsx("li", { className: "min-w-0", children: _jsx(LiveStreamCard, { channel: channel, preview: preview }) }, channel.id));
                                }) })) : null, otherChannels.length > 0 ? _jsx(ChannelGrid, { channels: otherChannels }) : null] }))] }), _jsx(ChannelSubmitModal, { open: submitOpen, onClose: () => setSubmitOpen(false), onSuccess: () => void loadChannels(), channels: channels })] }));
}
