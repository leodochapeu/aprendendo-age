import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { CommunityVideoCard } from "@/components/community/CommunityVideoCard";
import { CommunityVideoSubmitModal } from "@/components/community/CommunityVideoSubmitModal";
import { CommunityVideoTagBadge } from "@/components/community/CommunityVideoTagBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { canRequestCommunityVideo } from "@/lib/auth/constants";
import { fetchApprovedCommunityVideos, fetchCommunityVideoTags, } from "@/lib/communityVideosApi";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { truncateToTwoParagraphs } from "@/lib/truncateToTwoParagraphs";
import { cn } from "@/lib/cn";
import { hexToRgba } from "@/lib/tagColorUtils";
const requestBtnClass = cn("inline-flex items-center justify-center rounded-xl border border-amber-500/45 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 transition", "hover:border-amber-400/55 hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/35");
function matchesVideo(v, query, tagId) {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q ||
        v.title.toLowerCase().includes(q) ||
        (v.description ?? "").toLowerCase().includes(q) ||
        v.tags.some((t) => t.name.toLowerCase().includes(q));
    const matchesTag = !tagId || v.tags.some((t) => t.id === tagId);
    return matchesQuery && matchesTag;
}
export function CommunityVideosPage() {
    const { t } = useTranslation();
    const { status, profile, profileLoadState } = useAuth();
    const { pathname, search } = useLocation();
    const linkState = listIndexLinkStateFromLocation(pathname, search);
    const supabaseConfigured = isSupabaseConfigured();
    const [videos, setVideos] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(supabaseConfigured);
    const [error, setError] = useState(null);
    const [submitOpen, setSubmitOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTagId, setFilterTagId] = useState(null);
    const loadVideos = useCallback(async () => {
        if (!supabaseConfigured) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [data, tags] = await Promise.all([fetchApprovedCommunityVideos(), fetchCommunityVideoTags()]);
            setVideos(data);
            setAllTags(tags);
        }
        catch {
            setError(t("pages.communityVideos.loadError"));
        }
        finally {
            setLoading(false);
        }
    }, [supabaseConfigured, t]);
    useEffect(() => {
        void loadVideos();
    }, [loadVideos]);
    const filtered = useMemo(() => videos.filter((v) => matchesVideo(v, searchQuery, filterTagId)), [videos, searchQuery, filterTagId]);
    const canRequestVideo = status === "authenticated" && profileLoadState === "ready" && canRequestCommunityVideo(profile?.role);
    const hasActiveFilter = Boolean(searchQuery.trim() || filterTagId);
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: t("pages.communityVideos.title"), description: t("pages.communityVideos.description"), className: "mb-4" }), canRequestVideo ? (_jsx("div", { className: "mb-4", children: _jsx("button", { type: "button", onClick: () => setSubmitOpen(true), className: requestBtnClass, children: t("pages.communityVideos.requestVideo") }) })) : null, !loading && supabaseConfigured && !error ? (_jsxs("div", { className: "mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3", children: [_jsx(SearchField, { id: "community-videos-search", value: searchQuery, onChange: setSearchQuery, placeholder: t("pages.communityVideos.filterSearchPlaceholder"), className: "relative w-full shrink-0 sm:min-w-[20rem] sm:max-w-[24rem]" }), _jsxs("div", { className: "flex min-w-0 flex-wrap items-center gap-2", children: [_jsx("span", { className: "sr-only", children: t("pages.communityVideos.filterTagLabel") }), _jsx("button", { type: "button", onClick: () => setFilterTagId(null), className: cn("cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition", filterTagId === null
                                    ? "border-amber-500/50 bg-amber-500/15 text-amber-100"
                                    : "border-aom-border bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"), children: t("pages.communityVideos.filterTagAll") }), allTags.map((tag) => {
                                const active = filterTagId === tag.id;
                                return (_jsx("button", { type: "button", onClick: () => setFilterTagId(active ? null : tag.id), className: cn("cursor-pointer rounded-full transition focus:outline-none focus:ring-2 focus:ring-amber-500/35", active && "ring-2 ring-offset-1 ring-offset-zinc-950"), style: active ? { boxShadow: `0 0 0 2px ${hexToRgba(tag.colorHex, 0.55)}` } : undefined, "aria-pressed": active, "aria-label": tag.name, children: _jsx(CommunityVideoTagBadge, { tag: tag, size: "sm" }) }, tag.id));
                            })] })] })) : null, loading ? (_jsx("p", { className: "text-sm text-zinc-500", children: t("pages.communityVideos.loading") })) : !supabaseConfigured ? (_jsx("p", { className: "text-sm text-zinc-500", children: t("pages.communityVideos.unconfigured") })) : error ? (_jsx("p", { className: "rounded-xl border border-red-900/45 bg-red-950/35 px-4 py-3 text-sm text-red-200", role: "alert", children: error })) : videos.length === 0 ? (_jsx("p", { className: "text-sm text-zinc-500", children: t("pages.communityVideos.empty") })) : filtered.length === 0 ? (_jsx("p", { className: "text-sm text-zinc-500", children: hasActiveFilter ? t("pages.communityVideos.filterEmpty") : t("pages.communityVideos.empty") })) : (_jsx("ul", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: filtered.map((v) => (_jsx("li", { className: "min-w-0", children: _jsx(CommunityVideoCard, { to: `/videos-comunidade/${v.id}`, linkState: linkState, title: v.title, description: truncateToTwoParagraphs(v.description), thumbnailUrl: v.thumbnailUrl, channelAvatarUrl: v.channelAvatarUrl, tags: v.tags }) }, v.id))) })), _jsx(CommunityVideoSubmitModal, { open: submitOpen, onClose: () => setSubmitOpen(false), onSuccess: () => void loadVideos(), availableTags: allTags })] }));
}
