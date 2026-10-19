import { useEffect, useState } from "react";

import { NotificationLinkAction } from "@/components/notifications/NotificationLinkAction";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { localeToHtmlLang } from "@/lib/locale";
import { fetchNotificationPage } from "@/lib/siteNotificationsApi";
import { formatNotificationTime, NOTIFICATION_HISTORY_PAGE_SIZE, type SiteNotification } from "@/lib/siteNotifications";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function NotificationsPage() {
  const { t, locale } = useTranslation();
  const { markRead } = useSiteNotifications();
  const configured = isSupabaseConfigured();
  const [items, setItems] = useState<SiteNotification[]>([]);
  const [loading, setLoading] = useState(configured);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const localeTag = localeToHtmlLang(locale);

  useEffect(() => {
    if (!configured) return;
    let cancel = false;
    void fetchNotificationPage(0).then((result) => {
      if (cancel) return;
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
    if (items.length > 0) markRead(items.map((item) => item.id));
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

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("notifications.historyTitle")} description={t("notifications.historyDescription")} className="mb-6" />

      {!configured ? <p className="text-sm text-zinc-400">{t("notifications.errors.unconfigured")}</p> : null}
      {loading ? <p className="text-sm text-zinc-400">{t("notifications.loading")}</p> : null}
      {!loading && error ? <p className="text-sm text-red-200">{t("notifications.loadError")}</p> : null}
      {!loading && !error && configured && items.length === 0 ? (
        <p className="text-sm text-zinc-400">{t("notifications.empty")}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-aom-border bg-zinc-950/70 p-4">
            <h2 className="break-words font-[family-name:var(--font-display)] text-lg font-semibold text-amber-100">
              {item.title}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">{formatNotificationTime(item.startsAt, localeTag)}</p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">{item.description}</p>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="mt-3 max-h-64 w-full rounded-lg object-cover" />
            ) : null}
            <NotificationLinkAction linkUrl={item.linkUrl} className="mt-3" />
          </article>
        ))}
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={() => void loadOlder()}
          disabled={loadingMore}
          className="mt-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50"
        >
          {loadingMore ? t("notifications.loading") : t("notifications.loadOlder")}
        </button>
      ) : null}
      {!loading && !error && items.length > 0 && !hasMore ? (
        <p className="mt-4 text-center text-xs text-zinc-500">{t("notifications.end")}</p>
      ) : null}
    </div>
  );
}
