import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ChannelCategoryIcon, getChannelCategoryStyle } from "@/lib/channelCategory";
import { channelImageUrl } from "@/lib/channelsApi";
import { cn } from "@/lib/cn";
export function ChannelCard({ channel, compact = false, className, isLive = false }) {
    const { t } = useTranslation();
    const style = getChannelCategoryStyle(channel.category);
    const imageSrc = channelImageUrl(channel);
    const [imageFailed, setImageFailed] = useState(false);
    const categoryLabel = t(`pages.channels.category.${channel.category}`);
    const showImage = Boolean(imageSrc) && !imageFailed;
    useEffect(() => {
        setImageFailed(false);
    }, [imageSrc, channel.id]);
    return (_jsxs("a", { href: channel.urlLink, target: "_blank", rel: "noopener noreferrer", className: cn("group relative isolate flex w-full max-w-full min-w-0 overflow-hidden rounded-2xl border bg-gradient-to-br shadow-lg shadow-black/40 transition duration-300", "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950", compact ? "h-[6.5rem]" : "h-[7.5rem] sm:h-[8rem]", style.cardGradient, style.border, isLive && "ring-1 ring-emerald-500/35", className), title: t("pages.channels.openLink", { name: channel.name }), children: [_jsx("div", { className: "pointer-events-none absolute -right-4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-55", style: { background: style.glow }, "aria-hidden": true }), _jsxs("div", { className: cn("relative flex h-full w-full min-w-0 items-center gap-3 sm:gap-4", compact ? "p-4" : "py-4 pl-4 pr-3 sm:py-5 sm:pl-6 sm:pr-5"), children: [_jsxs("div", { className: "relative shrink-0", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 scale-110 rounded-2xl blur-xl opacity-60", style: { background: style.glow }, "aria-hidden": true }), _jsx("div", { className: cn("relative flex items-center justify-center overflow-hidden rounded-2xl border-2 bg-zinc-950/80 shadow-lg", compact ? "h-12 w-12" : "h-14 w-14 sm:h-16 sm:w-16"), children: showImage ? (_jsx("img", { src: imageSrc, alt: "", className: "size-full object-cover", onError: () => setImageFailed(true) })) : (_jsx("span", { className: cn("text-zinc-100", style.accentText), children: _jsx(ChannelCategoryIcon, { category: channel.category }) })) }), isLive ? _jsx(LiveIndicator, {}) : null] }), _jsxs("div", { className: "min-w-0 flex-1 overflow-hidden", children: [_jsxs("span", { className: cn("inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest", style.badgeBg), children: [_jsx(ChannelCategoryIcon, { category: channel.category, className: "scale-75 shrink-0" }), _jsx("span", { className: "truncate", children: categoryLabel })] }), _jsx("p", { className: cn("mt-2 line-clamp-2 break-words font-[family-name:var(--font-display)] font-semibold leading-snug tracking-wide text-zinc-50", compact ? "text-sm" : "text-base sm:text-lg"), children: channel.name }), _jsxs("p", { className: cn("mt-1 hidden text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100 sm:block", style.accentText), children: [t("pages.channels.visitLink"), " \u2192"] })] }), _jsx(ExternalLinkIcon, { className: cn("hidden shrink-0 opacity-40 transition group-hover:opacity-80 sm:block", style.accentText) })] })] }));
}
function LiveIndicator() {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "group/live absolute -right-0.5 -top-0.5 z-10", "aria-label": t("pages.channels.liveTooltip"), children: [_jsxs("span", { className: "relative flex size-3.5", children: [_jsx("span", { className: "absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75", "aria-hidden": true }), _jsx("span", { className: "relative inline-flex size-3.5 rounded-full border-2 border-zinc-950 bg-emerald-400", "aria-hidden": true })] }), _jsx("div", { role: "tooltip", className: cn("pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-max -translate-x-1/2 rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-200 shadow-xl shadow-black/50 backdrop-blur-sm", "opacity-0 transition duration-150 group-hover/live:opacity-100 group-focus-within/live:opacity-100"), children: t("pages.channels.liveTooltip") })] }));
}
function ExternalLinkIcon({ className }) {
    return (_jsx("svg", { viewBox: "0 0 24 24", className: cn("h-5 w-5", className), fill: "none", stroke: "currentColor", strokeWidth: "1.75", "aria-hidden": true, children: _jsx("path", { d: "M14 5h5v5M10 14 19 5M19 14v5H5V5h5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
export function ChannelGrid({ channels, compact, liveChannelIds, }) {
    const { t } = useTranslation();
    return (_jsx("ul", { className: "grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3", "aria-label": t("pages.channels.listAria"), children: channels.map((channel) => (_jsx("li", { className: "min-w-0", children: _jsx(ChannelCard, { channel: channel, compact: compact, isLive: liveChannelIds?.has(channel.id) }) }, channel.id))) }));
}
