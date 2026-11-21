import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ChannelCategoryIcon, getChannelCategoryStyle } from "@/lib/channelCategory";
import { channelImageUrl } from "@/lib/channelsApi";
import { cn } from "@/lib/cn";
export function LiveStreamCard({ channel, preview }) {
    const { t, locale } = useTranslation();
    const style = getChannelCategoryStyle(channel.category);
    const portraitSrc = channelImageUrl(channel) ?? preview.portraitUrl ?? undefined;
    const [thumbFailed, setThumbFailed] = useState(false);
    const [portraitFailed, setPortraitFailed] = useState(false);
    useEffect(() => {
        setThumbFailed(false);
    }, [preview.thumbnailUrl]);
    useEffect(() => {
        setPortraitFailed(false);
    }, [portraitSrc]);
    const showThumb = Boolean(preview.thumbnailUrl) && !thumbFailed;
    const showPortrait = Boolean(portraitSrc) && !portraitFailed;
    const title = preview.title?.trim() || t("pages.streamerLinks.liveTitleFallback");
    const viewers = preview.viewerCount == null
        ? null
        : new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en").format(preview.viewerCount);
    return (_jsxs("a", { href: channel.urlLink, target: "_blank", rel: "noopener noreferrer", className: cn("group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-800/45 bg-[#120e0a] shadow-lg shadow-black/50 transition duration-300", "hover:-translate-y-0.5 hover:border-amber-600/55 hover:shadow-xl hover:shadow-black/60", "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"), title: t("pages.channels.openLink", { name: channel.name }), children: [_jsxs("div", { className: "relative aspect-video overflow-hidden bg-black", children: [showThumb ? (_jsx("img", { src: preview.thumbnailUrl ?? undefined, alt: t("pages.streamerLinks.livePreviewAlt", { name: channel.name }), className: "size-full object-cover transition duration-500 group-hover:scale-[1.02]", onError: () => setThumbFailed(true) })) : (_jsx(PortraitWindow, { portraitSrc: showPortrait ? portraitSrc : undefined, channel: channel, glow: style.glow })), _jsx("div", { className: "pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/40", "aria-hidden": true }), _jsxs("span", { className: cn("absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-black/40", channel.category === "youtube" ? "bg-red-600" : "bg-[#9146FF]"), children: [_jsx("span", { className: "size-1.5 rounded-full bg-white", "aria-hidden": true }), t("pages.streamerLinks.liveBadge")] }), viewers != null ? (_jsxs("span", { className: "absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-white", "aria-label": t("pages.streamerLinks.liveViewersAria", { count: viewers }), children: [_jsx(EyeIcon, {}), viewers] })) : null] }), _jsxs("div", { className: "flex min-w-0 items-center gap-3 border-t border-amber-900/40 bg-[#16110c] px-3 py-3", children: [_jsx("div", { className: "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-700/55 bg-zinc-950", style: { boxShadow: `0 0 16px ${style.glow}` }, children: showPortrait ? (_jsx("img", { src: portraitSrc, alt: "", className: "size-full object-cover", onError: () => setPortraitFailed(true) })) : (_jsx("span", { className: cn("text-zinc-100", style.accentText), children: _jsx(ChannelCategoryIcon, { category: channel.category }) })) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-aom-gold", children: channel.name }), _jsx("p", { className: "mt-0.5 truncate text-sm text-zinc-300", children: title })] })] })] }));
}
function PortraitWindow({ portraitSrc, channel, glow, }) {
    const style = getChannelCategoryStyle(channel.category);
    return (_jsx("div", { className: "flex size-full items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-950", style: { backgroundImage: `radial-gradient(circle at 50% 45%, ${glow}, transparent 58%)` }, children: _jsx("div", { className: "flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-2 border-amber-700/50 bg-zinc-950 shadow-2xl shadow-black/60", children: portraitSrc ? (_jsx("img", { src: portraitSrc, alt: "", className: "size-full object-cover" })) : (_jsx("span", { className: cn("scale-150 text-zinc-100", style.accentText), children: _jsx(ChannelCategoryIcon, { category: channel.category }) })) }) }));
}
function EyeIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", className: "h-3.5 w-3.5", fill: "none", stroke: "currentColor", strokeWidth: "1.75", "aria-hidden": true, children: [_jsx("path", { d: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: "12", cy: "12", r: "2.5" })] }));
}
