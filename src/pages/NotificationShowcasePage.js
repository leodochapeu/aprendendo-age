import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { localeToHtmlLang } from "@/lib/locale";
import { fetchNotificationPage } from "@/lib/siteNotificationsApi";
import { formatNotificationTime, NOTIFICATION_HISTORY_PAGE_SIZE, resolveNotificationLink } from "@/lib/siteNotifications";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const SHOWCASE_LIMIT = 5;
const ARCHIVE_PAGE_SIZE = 10;
const SLIDE_MS = 8000;
function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const apply = () => setReduced(media.matches);
        apply();
        media.addEventListener("change", apply);
        return () => media.removeEventListener("change", apply);
    }, []);
    return reduced;
}
function QuietLink({ linkUrl }) {
    const { t } = useTranslation();
    const link = resolveNotificationLink(linkUrl);
    if (!link)
        return null;
    const className = "text-xs text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline";
    if (link.kind === "internal") {
        return (_jsx(Link, { to: link.href, className: className, children: t("notifications.openLink") }));
    }
    return (_jsx("a", { href: link.href, target: "_blank", rel: "noopener noreferrer", className: className, children: t("notifications.openLink") }));
}
function ReadingModal({ item, localeTag, onClose, }) {
    const { t } = useTranslation();
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (event) => {
            if (event.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-[80] flex items-center justify-center p-4", children: [_jsx("button", { type: "button", className: "absolute inset-0 bg-black/75", "aria-label": t("notifications.close"), onClick: onClose }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "notification-reading-title", className: "relative flex max-h-[min(88vh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 text-white shadow-2xl shadow-black/50", children: [_jsx("div", { className: "flex shrink-0 justify-end px-4 py-3", children: _jsx("button", { type: "button", onClick: onClose, className: "rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-white/10", children: t("notifications.close") }) }), _jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto px-6 pb-8 sm:px-8", children: [item.imageUrl ? (_jsx("img", { src: item.imageUrl, alt: "", className: "mx-auto max-h-[46vh] w-auto max-w-full rounded-2xl object-contain" })) : null, _jsx("p", { className: "mt-6 text-sm text-zinc-500", children: formatNotificationTime(item.startsAt, localeTag) }), _jsx("h2", { id: "notification-reading-title", className: "mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl", children: item.title }), _jsx("p", { className: "mt-6 whitespace-pre-wrap text-base leading-relaxed text-zinc-300", children: item.description }), _jsx("div", { className: "mt-8", children: _jsx(ShowcaseLink, { linkUrl: item.linkUrl }) })] })] })] }), document.body);
}
function ShowcaseLink({ linkUrl }) {
    const { t } = useTranslation();
    const link = resolveNotificationLink(linkUrl);
    if (!link)
        return null;
    const className = "inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/70";
    const label = (_jsxs(_Fragment, { children: [t("notifications.openLink"), _jsx("span", { "aria-hidden": true, children: "\u2192" })] }));
    if (link.kind === "internal") {
        return (_jsx(Link, { to: link.href, className: className, children: label }));
    }
    return (_jsx("a", { href: link.href, target: "_blank", rel: "noopener noreferrer", className: className, children: label }));
}
export function NotificationNewsCarousel({ archive = false }) {
    const { t, locale } = useTranslation();
    const configured = isSupabaseConfigured();
    const localeTag = localeToHtmlLang(locale);
    const reducedMotion = useReducedMotion();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(configured);
    const [error, setError] = useState(false);
    const [index, setIndex] = useState(0);
    const [hovered, setHovered] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [reading, setReading] = useState(null);
    const [archivePage, setArchivePage] = useState(0);
    const archiveRef = useRef(null);
    const closeReading = useCallback(() => setReading(null), []);
    const indexRef = useRef(0);
    const progressRef = useRef(0);
    const barRefs = useRef([]);
    useEffect(() => {
        if (!configured)
            return;
        let cancel = false;
        void (async () => {
            const collected = [];
            let offset = 0;
            for (;;) {
                const result = await fetchNotificationPage(offset);
                if (cancel)
                    return;
                if (!result.ok) {
                    setLoading(false);
                    setError(true);
                    return;
                }
                collected.push(...result.items);
                if (result.items.length < NOTIFICATION_HISTORY_PAGE_SIZE)
                    break;
                offset += result.items.length;
                if (offset >= 200)
                    break;
            }
            if (cancel)
                return;
            setItems(collected);
            setLoading(false);
        })();
        return () => {
            cancel = true;
        };
    }, [configured]);
    const featured = items.slice(0, SHOWCASE_LIMIT);
    const archiveItems = items.slice(SHOWCASE_LIMIT);
    const archivePageCount = Math.ceil(archiveItems.length / ARCHIVE_PAGE_SIZE);
    const safeArchivePage = archivePageCount === 0 ? 0 : Math.min(archivePage, archivePageCount - 1);
    const visibleArchive = archiveItems.slice(safeArchivePage * ARCHIVE_PAGE_SIZE, (safeArchivePage + 1) * ARCHIVE_PAGE_SIZE);
    const count = featured.length;
    const safeIndex = count === 0 ? 0 : index % count;
    const item = featured[safeIndex];
    const playing = count > 1 && !hovered && !hidden && !reducedMotion && !reading;
    const playingRef = useRef(playing);
    playingRef.current = playing;
    const imageKey = featured.map((slide) => slide.imageUrl ?? "").join("|");
    useEffect(() => {
        for (const url of imageKey.split("|")) {
            if (!url)
                continue;
            const preload = new Image();
            preload.src = url;
        }
    }, [imageKey]);
    useEffect(() => {
        let frame = 0;
        let last = performance.now();
        const tick = (now) => {
            const elapsed = now - last;
            last = now;
            if (playingRef.current && count > 1) {
                progressRef.current += elapsed / SLIDE_MS;
                if (progressRef.current >= 1) {
                    progressRef.current = 0;
                    const next = (indexRef.current + 1) % count;
                    indexRef.current = next;
                    setIndex(next);
                }
            }
            const active = count === 0 ? 0 : indexRef.current % count;
            const ratio = reducedMotion ? 1 : Math.min(1, progressRef.current);
            for (let slideIndex = 0; slideIndex < count; slideIndex += 1) {
                const bar = barRefs.current[slideIndex];
                if (!bar)
                    continue;
                const width = slideIndex < active ? 1 : slideIndex === active ? ratio : 0;
                bar.style.transform = `scaleX(${width})`;
            }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [count, reducedMotion]);
    useEffect(() => {
        const onHide = () => setHidden(document.visibilityState === "hidden");
        document.addEventListener("visibilitychange", onHide);
        return () => document.removeEventListener("visibilitychange", onHide);
    }, []);
    function goTo(next) {
        if (count === 0)
            return;
        const resolved = (next + count) % count;
        indexRef.current = resolved;
        progressRef.current = 0;
        setIndex(resolved);
    }
    if (!archive && (!configured || loading || error || featured.length === 0))
        return null;
    return (_jsxs("div", { className: archive ? "mx-auto max-w-6xl" : undefined, children: [_jsx("style", { children: `@keyframes showcase-in { from { opacity: 0; } to { opacity: 1; } }` }), _jsxs("section", { className: "relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-black px-6 py-8 text-white shadow-2xl shadow-black/40 sm:px-10 sm:py-12", "aria-roledescription": "carousel", "aria-label": t("notifications.showcaseEyebrow"), tabIndex: 0, onKeyDown: (event) => {
                    if (reading)
                        return;
                    if (event.key === "ArrowRight") {
                        event.preventDefault();
                        goTo(safeIndex + 1);
                    }
                    if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        goTo(safeIndex - 1);
                    }
                }, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), onFocus: () => setHovered(true), onBlur: (event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                        setHovered(false);
                }, children: [_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute -z-10 inset-0 bg-[radial-gradient(ellipse_42%_55%_at_76%_46%,rgba(245,158,11,0.14),transparent_70%)]" }), _jsx("p", { className: "text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500", children: t("notifications.showcaseEyebrow") }), loading ? _jsx("p", { className: "mt-16 text-sm text-zinc-500", children: t("notifications.loading") }) : null, !configured ? _jsx("p", { className: "mt-16 text-sm text-zinc-500", children: t("notifications.errors.unconfigured") }) : null, !loading && error ? _jsx("p", { className: "mt-16 text-sm text-red-200", children: t("notifications.loadError") }) : null, !loading && !error && configured && !item ? (_jsx("p", { className: "mt-16 font-[family-name:var(--font-display)] text-3xl tracking-tight text-zinc-300 sm:text-5xl", children: t("notifications.showcaseEmpty") })) : null, item ? (_jsxs("div", { className: "mt-8 grid items-center gap-8 lg:grid-cols-2 [animation:showcase-in_0.45s_ease]", children: [_jsx("div", { className: "order-1 flex h-[min(46vh,24rem)] w-full min-w-0 items-center justify-center lg:order-2", children: item.imageUrl ? (_jsx("img", { src: item.imageUrl, alt: "", className: "max-h-full w-auto max-w-full rounded-[1.75rem] object-contain" })) : (_jsx("div", { className: "flex h-full w-full items-end rounded-[1.75rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_58%)] p-8", children: _jsx("span", { className: "font-[family-name:var(--font-display)] text-7xl text-white/15", children: String(safeIndex + 1).padStart(2, "0") }) })) }), _jsxs("div", { className: "order-2 min-w-0 lg:order-1", children: [_jsxs("p", { className: "text-xs tabular-nums tracking-[0.22em] text-zinc-500", children: [String(safeIndex + 1).padStart(2, "0"), _jsx("span", { className: "mx-2 text-zinc-700", children: "/" }), String(count).padStart(2, "0")] }), _jsx("p", { className: "mt-4 text-sm text-zinc-400", children: formatNotificationTime(item.startsAt, localeTag) }), _jsx("h1", { className: "mt-4 max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-white line-clamp-3 sm:text-5xl", children: item.title }), _jsx("p", { className: "mt-6 max-w-xl whitespace-pre-wrap text-base leading-relaxed text-zinc-400 line-clamp-4 sm:text-lg sm:leading-relaxed", children: item.description }), _jsxs("div", { className: "mt-8 flex flex-wrap items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => setReading(item), className: "inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40", children: t("notifications.showcaseRead") }), _jsx(ShowcaseLink, { linkUrl: item.linkUrl })] })] })] }, item.id)) : null, count > 1 ? (_jsxs("div", { className: "mt-10 flex items-center gap-4", children: [_jsx("div", { className: "flex min-w-0 flex-1 gap-2", role: "tablist", "aria-label": t("notifications.showcaseEyebrow"), children: featured.map((slide, slideIndex) => (_jsx("button", { type: "button", role: "tab", "aria-selected": slideIndex === safeIndex, "aria-label": t("notifications.showcaseSlide", { current: slideIndex + 1, total: count }), onClick: () => goTo(slideIndex), className: "h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15", children: _jsx("span", { ref: (node) => {
                                            barRefs.current[slideIndex] = node;
                                        }, className: "block h-full origin-left bg-white" }) }, slide.id))) }), _jsxs("div", { className: "flex shrink-0 gap-2", children: [_jsx("button", { type: "button", onClick: () => goTo(safeIndex - 1), "aria-label": t("notifications.showcasePrevious"), className: "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10", children: "\u2039" }), _jsx("button", { type: "button", onClick: () => goTo(safeIndex + 1), "aria-label": t("notifications.showcaseNext"), className: "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10", children: "\u203A" })] })] })) : null, _jsx("p", { className: "sr-only", "aria-live": "polite", children: item ? t("notifications.showcaseSlide", { current: safeIndex + 1, total: count }) : "" })] }), archive && archiveItems.length > 0 ? (_jsxs("section", { ref: archiveRef, className: "mx-auto mt-14 max-w-3xl scroll-mt-24", "aria-label": t("notifications.showcaseArchive"), children: [_jsx("h2", { className: "text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500", children: t("notifications.showcaseArchive") }), _jsx("ul", { className: "mt-4 divide-y divide-white/10", children: visibleArchive.map((entry) => (_jsxs("li", { className: "flex items-start gap-4 py-4", children: [entry.imageUrl ? (_jsx("img", { src: entry.imageUrl, alt: "", className: "h-14 w-14 shrink-0 rounded-lg object-cover opacity-80" })) : (_jsx("span", { className: "h-14 w-14 shrink-0 rounded-lg bg-zinc-900/80" })), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-xs text-zinc-500", children: formatNotificationTime(entry.startsAt, localeTag) }), _jsx("h3", { className: "mt-1 text-sm font-medium leading-snug text-zinc-300", children: entry.title }), _jsx("p", { className: "mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500", children: entry.description }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => setReading(entry), className: "text-xs text-zinc-400 underline-offset-4 transition hover:text-zinc-200 hover:underline", children: t("notifications.showcaseRead") }), _jsx(QuietLink, { linkUrl: entry.linkUrl })] })] })] }, entry.id))) }), archivePageCount > 1 ? (_jsxs("div", { className: "mt-6 flex items-center justify-between gap-4", children: [_jsx("button", { type: "button", onClick: () => {
                                    setArchivePage(safeArchivePage - 1);
                                    archiveRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
                                }, disabled: safeArchivePage === 0, className: "rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40", children: t("notifications.showcasePrevious") }), _jsx("p", { className: "text-xs tabular-nums tracking-[0.14em] text-zinc-500", children: t("notifications.showcasePage", { current: safeArchivePage + 1, total: archivePageCount }) }), _jsx("button", { type: "button", onClick: () => {
                                    setArchivePage(safeArchivePage + 1);
                                    archiveRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
                                }, disabled: safeArchivePage >= archivePageCount - 1, className: "rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40", children: t("notifications.showcaseNext") })] })) : null] })) : null, reading ? _jsx(ReadingModal, { item: reading, localeTag: localeTag, onClose: closeReading }) : null] }));
}
export function NotificationShowcasePage() {
    return _jsx(NotificationNewsCarousel, { archive: true });
}
