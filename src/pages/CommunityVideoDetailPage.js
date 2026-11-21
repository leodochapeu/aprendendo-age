import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { CommunityVideoTagBadge } from "@/components/community/CommunityVideoTagBadge";
import { StartVideosSection } from "@/components/starts/StartVideosSection";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { fetchCommunityVideoById } from "@/lib/communityVideosApi";
import { listIndexBackLinkLabel, listIndexReturnTo } from "@/lib/listIndexReturnState";
import { isSupabaseConfigured } from "@/lib/supabase/env";
export function CommunityVideoDetailPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const { state: navState } = useLocation();
    const backToList = listIndexReturnTo("/videos-comunidade", navState);
    const backLabel = listIndexBackLinkLabel(backToList, t("pages.communityVideos.backLink"));
    const [video, setVideo] = useState(undefined);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!id || !isSupabaseConfigured()) {
            setVideo(null);
            return;
        }
        let cancelled = false;
        void (async () => {
            setError(null);
            try {
                const data = await fetchCommunityVideoById(id);
                if (!cancelled)
                    setVideo(data);
            }
            catch {
                if (!cancelled) {
                    setError(t("pages.communityVideos.loadError"));
                    setVideo(null);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, t]);
    if (video === undefined) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx("p", { className: "text-sm text-zinc-500", children: t("pages.communityVideos.loading") })] }));
    }
    if (error || !video) {
        return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx("p", { className: "text-zinc-400", children: error ?? t("pages.communityVideos.notFound") })] }));
    }
    return (_jsxs("div", { children: [_jsx(BackLink, { to: backToList, children: backLabel }), _jsx(PageHeader, { title: video.title }), video.tags.length ? (_jsx("div", { className: "mb-4 flex flex-wrap gap-2", children: video.tags.map((tag) => (_jsx(CommunityVideoTagBadge, { tag: tag, size: "sm" }, tag.id))) })) : null, video.channelName || video.channelAvatarUrl ? (_jsxs("div", { className: "mb-4 flex items-center gap-2.5", children: [video.channelAvatarUrl ? (_jsx("img", { src: video.channelAvatarUrl, alt: "", className: "size-9 shrink-0 rounded-full border border-zinc-700/80 bg-zinc-900 object-cover" })) : null, video.channelName ? (_jsxs("p", { className: "text-sm font-medium text-zinc-300", children: [_jsxs("span", { className: "text-zinc-500", children: [t("pages.communityVideos.channelLabel"), ": "] }), video.channelName] })) : null] })) : null, video.description ? (_jsx("p", { className: "max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-zinc-400", children: video.description })) : null, _jsx(StartVideosSection, { title: video.title, urls: [video.videoUrl], sectionHeading: t("pages.communityVideos.videoSection") })] }));
}
