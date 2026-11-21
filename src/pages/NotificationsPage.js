import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { NotificationLinkAction } from "@/components/notifications/NotificationLinkAction";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { localeToHtmlLang } from "@/lib/locale";
import { fetchNotificationPage } from "@/lib/siteNotificationsApi";
import { formatNotificationTime, NOTIFICATION_HISTORY_PAGE_SIZE } from "@/lib/siteNotifications";
import { isSupabaseConfigured } from "@/lib/supabase/env";
export function NotificationsPage() {
    const { t, locale } = useTranslation();
    const { markRead } = useSiteNotifications();
    const configured = isSupabaseConfigured();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(configured);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const localeTag = localeToHtmlLang(locale);
    useEffect(() => {
        if (!configured)
            return;
        let cancel = false;
        void fetchNotificationPage(0).then((result) => {
            if (cancel)
                return;
            setLoading(false);
            if (!result.ok) {
                setError(true);
                return;
            }
            setItems(result.items);
            setHasMore(result.items.length === NOTIFICATION_HISTORY_PAGE_SIZE);
        });
        return () => {
            cancel = true;
        };
    }, [configured]);
    useEffect(() => {
        if (items.length > 0)
            markRead(items.map((item) => item.id));
    }, [items, markRead]);
    async function loadOlder() {
        setLoadingMore(true);
        const result = await fetchNotificationPage(items.length);
        setLoadingMore(false);
        if (!result.ok) {
            setError(true);
            return;
        }
        setItems((current) => {
            const seen = new Set(current.map((item) => item.id));
            return [...current, ...result.items.filter((item) => !seen.has(item.id))];
        });
        setHasMore(result.items.length === NOTIFICATION_HISTORY_PAGE_SIZE);
    }
    return (_jsxs("div", { className: "mx-auto max-w-2xl", children: [_jsx(PageHeader, { title: t("notifications.historyTitle"), description: t("notifications.historyDescription"), className: "mb-6" }), !configured ? _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.errors.unconfigured") }) : null, loading ? _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.loading") }) : null, !loading && error ? _jsx("p", { className: "text-sm text-red-200", children: t("notifications.loadError") }) : null, !loading && !error && configured && items.length === 0 ? (_jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.empty") })) : null, _jsx("div", { className: "flex flex-col gap-3", children: items.map((item) => (_jsxs("article", { className: "rounded-xl border border-aom-border bg-zinc-950/70 p-4", children: [_jsx("h2", { className: "break-words font-[family-name:var(--font-display)] text-lg font-semibold text-amber-100", children: item.title }), _jsx("p", { className: "mt-1 text-xs text-zinc-500", children: formatNotificationTime(item.startsAt, localeTag) }), _jsx("p", { className: "mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300", children: item.description }), item.imageUrl ? (_jsx("img", { src: item.imageUrl, alt: "", className: "mt-3 max-h-64 w-full rounded-lg object-cover" })) : null, _jsx(NotificationLinkAction, { linkUrl: item.linkUrl, className: "mt-3" })] }, item.id))) }), hasMore ? (_jsx("button", { type: "button", onClick: () => void loadOlder(), disabled: loadingMore, className: "mt-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50", children: loadingMore ? t("notifications.loading") : t("notifications.loadOlder") })) : null, !loading && !error && items.length > 0 && !hasMore ? (_jsx("p", { className: "mt-4 text-center text-xs text-zinc-500", children: t("notifications.end") })) : null] }));
}
