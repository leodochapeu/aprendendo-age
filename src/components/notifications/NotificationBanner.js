import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { NotificationLinkAction } from "@/components/notifications/NotificationLinkAction";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
export function NotificationBanner() {
    const { preview, readIds, markRead, setBannerOffset } = useSiteNotifications();
    const { t } = useTranslation();
    const featured = preview.find((item) => item.highlighted && !readIds.includes(item.id)) ?? null;
    const [shown, setShown] = useState(null);
    const frameRef = useRef(null);
    useEffect(() => {
        if (shown || !featured)
            return;
        setShown(featured);
    }, [featured, shown]);
    useEffect(() => {
        if (!shown)
            return;
        const id = shown.id;
        const timer = window.setTimeout(() => markRead([id]), 500);
        return () => window.clearTimeout(timer);
    }, [shown, markRead]);
    useEffect(() => {
        if (!shown)
            return;
        if (preview.some((item) => item.id === shown.id))
            return;
        setShown(null);
    }, [preview, shown]);
    const shownRef = useRef(shown);
    shownRef.current = shown;
    useEffect(() => {
        const onOpened = () => {
            const current = shownRef.current;
            if (current)
                markRead([current.id]);
            setShown(null);
        };
        window.addEventListener("shell:notifications-opened", onOpened);
        return () => window.removeEventListener("shell:notifications-opened", onOpened);
    }, [markRead]);
    useEffect(() => {
        const node = frameRef.current;
        if (!shown || !node) {
            setBannerOffset(0);
            return;
        }
        const publish = () => setBannerOffset(node.getBoundingClientRect().height);
        publish();
        const observer = new ResizeObserver(publish);
        observer.observe(node);
        return () => {
            observer.disconnect();
            setBannerOffset(0);
        };
    }, [shown, setBannerOffset]);
    if (!shown)
        return null;
    return (_jsx("div", { ref: frameRef, className: "fixed inset-x-0 top-0 z-40 border-b border-amber-500/40 bg-zinc-950/95 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md", role: "region", "aria-label": shown.title, children: _jsxs("div", { className: "flex items-start gap-3 px-4 py-3 md:px-8 md:py-4", children: [shown.imageUrl ? (_jsx("img", { src: shown.imageUrl, alt: "", className: "h-16 w-16 shrink-0 rounded-lg border border-aom-border object-cover md:h-20 md:w-20" })) : null, _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-amber-100 md:text-lg", children: shown.title }), _jsx("p", { className: "mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200", children: shown.description }), _jsx(NotificationLinkAction, { linkUrl: shown.linkUrl, className: "mt-3", onClick: () => markRead([shown.id]) })] }), _jsx("button", { type: "button", onClick: () => {
                        markRead([shown.id]);
                        setShown(null);
                    }, className: cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-aom-border", "text-zinc-300 transition hover:border-amber-500/40 hover:bg-zinc-900 hover:text-white", "focus:outline-none focus:ring-2 focus:ring-amber-500/35"), "aria-label": t("notifications.close"), children: _jsx("span", { "aria-hidden": true, className: "text-lg leading-none", children: "\u00D7" }) })] }) }));
}
