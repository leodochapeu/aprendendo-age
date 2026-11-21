import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { CommunityVideoTagBadge } from "@/components/community/CommunityVideoTagBadge";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { approveCommunityVideo, fetchPendingCommunityVideos, rejectCommunityVideo, } from "@/lib/communityVideosApi";
import { localeToHtmlLang } from "@/lib/locale";
import { truncateToTwoParagraphs } from "@/lib/truncateToTwoParagraphs";
export function CommunityVideoRequestsPanel() {
    const { t, locale } = useTranslation();
    const { showToast } = useToast();
    const localeTag = localeToHtmlLang(locale);
    const prefix = "pages.communityVideos.moderation";
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [busyId, setBusyId] = useState(null);
    useEffect(() => {
        let cancel = false;
        void fetchPendingCommunityVideos().then((result) => {
            if (cancel)
                return;
            if (!result.ok)
                setError(true);
            else
                setItems(result.data);
            setLoading(false);
        });
        return () => {
            cancel = true;
        };
    }, []);
    async function approve(id) {
        setBusyId(id);
        const result = await approveCommunityVideo(id);
        setBusyId(null);
        if (!result.ok) {
            showToast(t(`${prefix}.saveError`), "error");
            return;
        }
        setItems((current) => current.filter((item) => item.id !== id));
        showToast(t(`${prefix}.approved`));
    }
    async function reject(id) {
        setBusyId(id);
        const result = await rejectCommunityVideo(id);
        setBusyId(null);
        if (!result.ok) {
            showToast(t(`${prefix}.saveError`), "error");
            return;
        }
        setItems((current) => current.filter((item) => item.id !== id));
        showToast(t(`${prefix}.rejected`));
    }
    if (loading)
        return _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.loading") });
    if (error)
        return _jsx("p", { className: "text-sm text-red-200", children: t(`${prefix}.loadError`) });
    if (items.length === 0)
        return _jsx("p", { className: "text-sm text-zinc-400", children: t(`${prefix}.empty`) });
    return (_jsx("ul", { className: "divide-y divide-white/10", children: items.map((item) => {
            const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.updatedAt));
            const busy = busyId === item.id;
            return (_jsxs("li", { className: "flex flex-col gap-3 py-4 sm:flex-row", children: [item.thumbnailUrl ? (_jsx("img", { src: item.thumbnailUrl, alt: "", className: "h-24 w-full rounded-lg object-cover sm:w-40" })) : null, _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-zinc-500", children: [_jsx("span", { children: when }), _jsx("span", { children: t(`${prefix}.by`, { name: item.submitterName || t(`${prefix}.unknownAuthor`) }) }), item.channelName ? _jsx("span", { children: item.channelName }) : null] }), _jsx("h2", { className: "mt-1 text-sm font-semibold text-zinc-100", children: item.title }), item.tags.length ? (_jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: item.tags.map((tag) => (_jsx(CommunityVideoTagBadge, { tag: tag, size: "sm" }, tag.id))) })) : null, item.description ? (_jsx("p", { className: "mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400", children: truncateToTwoParagraphs(item.description) })) : null, _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [_jsx("a", { href: item.videoUrl, target: "_blank", rel: "noreferrer", className: "rounded-full border border-white/15 px-3 py-1.5 text-xs text-amber-100 hover:border-amber-400/40", children: t(`${prefix}.openVideo`) }), _jsx("button", { type: "button", disabled: busy, className: "rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 disabled:opacity-50", onClick: () => void approve(item.id), children: t(`${prefix}.approve`) }), _jsx("button", { type: "button", disabled: busy, className: "rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-200 disabled:opacity-50", onClick: () => void reject(item.id), children: t(`${prefix}.reject`) })] })] })] }, item.id));
        }) }));
}
