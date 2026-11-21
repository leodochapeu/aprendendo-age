import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useLiveTickerEntries } from "@/hooks/useLiveTickerEntries";
import { useTranslation } from "@/hooks/useTranslation";
import { channelImageUrl } from "@/lib/channelsApi";
import { cn } from "@/lib/cn";
import { NOTIFICATION_TICKER_LIMIT, resolveNotificationLink } from "@/lib/siteNotifications";
import { interleaveTickerSlides, tickerSlideKey } from "@/lib/tickerSlides";
const SLIDE_MS = 5000;
const SLIDE_TRANSITION_MS = 520;
function AlertIcon() {
    return (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: [_jsx("path", { d: "M12 3.5 2.8 20h18.4L12 3.5Z", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }), _jsx("path", { d: "M12 9.2v4.6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), _jsx("path", { d: "M12 16.8h.01", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round" })] }));
}
function NewsTickerSlide({ item, onActivate }) {
    const link = resolveNotificationLink(item.linkUrl);
    const body = (_jsxs("span", { className: "flex min-w-0 items-center gap-3", children: [item.imageUrl ? (_jsx("img", { src: item.imageUrl, alt: "", className: "h-9 w-9 shrink-0 rounded-md object-cover" })) : null, _jsx("span", { className: "truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-amber-50", children: item.title })] }));
    const className = "flex h-14 w-full items-center";
    if (!link)
        return _jsx("div", { className: className, children: body });
    if (link.kind === "internal") {
        return (_jsx(Link, { to: link.href, className: cn(className, "transition hover:text-amber-200"), onClick: onActivate, children: body }));
    }
    return (_jsx("a", { href: link.href, target: "_blank", rel: "noopener noreferrer", className: cn(className, "transition hover:text-amber-200"), onClick: onActivate, children: body }));
}
function LiveTickerSlide({ slide }) {
    const { t } = useTranslation();
    const { channel, preview } = slide;
    const portrait = channelImageUrl(channel) ?? preview.portraitUrl ?? undefined;
    const title = preview.title?.trim();
    const label = title
        ? `${t("pages.streamerLinks.liveBadge")} · ${channel.name} · ${title}`
        : `${t("pages.streamerLinks.liveBadge")} · ${channel.name}`;
    return (_jsx("a", { href: channel.urlLink, target: "_blank", rel: "noopener noreferrer", className: "flex h-14 w-full items-center transition hover:text-amber-200", "aria-label": label, children: _jsxs("span", { className: "flex min-w-0 items-center gap-3", children: [_jsxs("span", { className: "relative shrink-0", children: [portrait ? (_jsx("img", { src: portrait, alt: "", className: "h-9 w-9 rounded-full object-cover" })) : (_jsx("span", { className: "block h-9 w-9 rounded-full bg-zinc-800" })), _jsx("span", { className: "absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950", "aria-hidden": true })] }), _jsxs("span", { className: "truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-amber-50", children: [_jsx("span", { className: "mr-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300", children: t("pages.streamerLinks.liveBadge") }), channel.name, title ? _jsx("span", { className: "ml-2 font-medium text-zinc-300", children: title }) : null] })] }) }));
}
const clusterButtonClass = cn("hidden h-10 w-10 items-center justify-center rounded-full border border-aom-border md:flex", "bg-zinc-950/90 text-amber-200/95 shadow-lg shadow-black/30 backdrop-blur-sm", "transition hover:border-amber-500/45 hover:bg-zinc-900", "focus:outline-none focus:ring-2 focus:ring-amber-500/35");
export function NotificationTickerToggle() {
    const { t } = useTranslation();
    const { preview, bannerOffset, tickerCollapsed, setTickerCollapsed } = useSiteNotifications();
    const liveEntries = useLiveTickerEntries();
    const featuredOpen = bannerOffset > 0;
    if (preview.length === 0 && liveEntries.length === 0)
        return null;
    if (tickerCollapsed || featuredOpen) {
        return (_jsx("button", { type: "button", onClick: () => setTickerCollapsed(false), "aria-expanded": false, "aria-label": t("notifications.tickerShow"), title: t("notifications.tickerShow"), className: clusterButtonClass, children: _jsx(AlertIcon, {}) }));
    }
    return (_jsx("button", { type: "button", onClick: () => setTickerCollapsed(true), "aria-expanded": true, "aria-label": t("notifications.tickerHide"), title: t("notifications.tickerHide"), className: clusterButtonClass, children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: _jsx("path", { d: "m6 14 6-6 6 6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }) }));
}
export function NotificationTicker() {
    const { t } = useTranslation();
    const { preview, bannerOffset, tickerCollapsed, setTickerOffset, markRead } = useSiteNotifications();
    const liveEntries = useLiveTickerEntries();
    const items = interleaveTickerSlides(preview.slice(0, NOTIFICATION_TICKER_LIMIT), liveEntries.slice(0, NOTIFICATION_TICKER_LIMIT));
    const slideKey = items.map(tickerSlideKey).join("|");
    const slides = items.length > 1 ? [...items, items[0]] : items;
    const [index, setIndex] = useState(0);
    const [animate, setAnimate] = useState(true);
    const frameRef = useRef(null);
    const pausedRef = useRef(false);
    const visible = !tickerCollapsed && bannerOffset === 0 && items.length > 0;
    useEffect(() => {
        setIndex(0);
        setAnimate(false);
    }, [slideKey]);
    useEffect(() => {
        if (!visible || items.length < 2)
            return;
        const timer = window.setInterval(() => {
            if (pausedRef.current)
                return;
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            setAnimate(!reduce);
            setIndex((current) => current + 1);
        }, SLIDE_MS);
        return () => window.clearInterval(timer);
    }, [visible, items.length]);
    useEffect(() => {
        if (items.length < 2 || index < items.length)
            return;
        const timer = window.setTimeout(() => {
            setAnimate(false);
            setIndex(0);
        }, SLIDE_TRANSITION_MS);
        return () => window.clearTimeout(timer);
    }, [index, items.length]);
    useEffect(() => {
        const node = frameRef.current;
        if (!visible || !node) {
            setTickerOffset(0);
            return;
        }
        const publish = () => {
            const desktop = window.matchMedia("(min-width: 768px)").matches;
            setTickerOffset(desktop ? node.getBoundingClientRect().height : 0);
        };
        publish();
        const observer = new ResizeObserver(publish);
        observer.observe(node);
        const onResize = () => publish();
        window.addEventListener("resize", onResize);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", onResize);
            setTickerOffset(0);
        };
    }, [visible, setTickerOffset]);
    if (!visible)
        return null;
    const shift = slides.length === 0 ? 0 : (index * 100) / slides.length;
    return (_jsx("div", { ref: frameRef, className: "fixed inset-x-0 z-[19] hidden border-b border-amber-500/30 bg-zinc-950/95 md:block", style: { top: bannerOffset }, role: "region", "aria-label": t("notifications.tickerLabel"), onMouseEnter: () => {
            pausedRef.current = true;
        }, onMouseLeave: () => {
            pausedRef.current = false;
        }, children: _jsx("div", { className: "flex h-16 items-center pl-[calc(14rem+2.5rem)] pr-[17rem]", children: _jsx("div", { className: "min-w-0 flex-1 overflow-hidden", children: _jsx("div", { className: cn("flex", animate && "transition-transform duration-500 ease-out"), style: { width: `${slides.length * 100}%`, transform: `translateX(-${shift}%)` }, children: slides.map((item, slideIndex) => (_jsx("div", { className: "shrink-0", style: { width: `${100 / slides.length}%` }, children: item.kind === "news" ? (_jsx(NewsTickerSlide, { item: item.item, onActivate: () => markRead([item.item.id]) })) : (_jsx(LiveTickerSlide, { slide: item })) }, `${tickerSlideKey(item)}-${slideIndex}`))) }) }) }) }));
}
