import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { NotificationLinkAction } from "@/components/notifications/NotificationLinkAction";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { localeToHtmlLang } from "@/lib/locale";
import { localeNotificationShowcasePath, localeNotificationsPath } from "@/lib/localeRoutes";
import { formatNotificationTime, type SiteNotification } from "@/lib/siteNotifications";

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NotificationPreviewItem({
  item,
  unread,
  localeTag,
  onNavigate,
}: {
  item: SiteNotification;
  unread: boolean;
  localeTag: string;
  onNavigate: () => void;
}) {
  return (
    <article className="px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {unread ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden /> : null}
            <h3 className="min-w-0 flex-1 break-words text-sm font-semibold text-zinc-100">{item.title}</h3>
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">{formatNotificationTime(item.startsAt, localeTag)}</p>
          <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-400">
            {item.description}
          </p>
          <NotificationLinkAction linkUrl={item.linkUrl} className="mt-2 px-2.5 py-1 text-xs" onClick={onNavigate} />
        </div>
      </div>
    </article>
  );
}

export function NotificationBell() {
  const { t, locale } = useTranslation();
  const { pathname } = useLocation();
  const { preview, unreadCount, hasMore, loading, error, bellSeenIds, markRead, acknowledgeBell, bannerOffset } =
    useSiteNotifications();
  const [open, setOpen] = useState(false);
  const [unreadSnapshot, setUnreadSnapshot] = useState<ReadonlySet<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const localeTag = localeToHtmlLang(locale);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClose = () => setOpen(false);
    window.addEventListener("shell:close-notifications", onClose);
    return () => window.removeEventListener("shell:close-notifications", onClose);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    acknowledgeBell();
    markRead(preview.map((item) => item.id));
  }, [open, preview, acknowledgeBell, markRead]);

  const badge = unreadCount > 9 ? "9+" : String(unreadCount);
  const label =
    unreadCount > 0
      ? `${t("notifications.open")} (${t("notifications.badgeLabel", { count: unreadCount })})`
      : t("notifications.open");

  function toggle() {
    setOpen((current) => {
      const next = !current;
      if (next) {
        window.dispatchEvent(new Event("shell:close-settings"));
        window.dispatchEvent(new Event("shell:notifications-opened"));
        const seen = new Set(bellSeenIds);
        setUnreadSnapshot(new Set(preview.filter((item) => !seen.has(item.id)).map((item) => item.id)));
        acknowledgeBell();
        markRead(preview.map((item) => item.id));
      }
      return next;
    });
  }

  return (
    <div ref={rootRef} className="relative z-10">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        title={t("notifications.title")}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full border border-aom-border",
          "bg-zinc-950/90 text-amber-200/95 shadow-lg shadow-black/30 backdrop-blur-sm",
          "transition hover:border-amber-500/45 hover:bg-zinc-900",
          "focus:outline-none focus:ring-2 focus:ring-amber-500/35",
        )}
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-none text-zinc-950">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("notifications.title")}
          className={cn(
            "fixed right-4 z-[70] flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden",
            "rounded-xl border border-aom-border bg-zinc-950/95 shadow-xl shadow-black/40 backdrop-blur-sm",
          )}
          style={{ top: `calc(${bannerOffset}px + max(1rem, env(safe-area-inset-top, 0px)) + 3rem)` }}
        >
          <div className="border-b border-aom-border/80 px-3 py-2 text-sm font-semibold text-amber-100">
            {t("notifications.title")}
          </div>
          <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
            {loading ? <p className="px-3 py-4 text-sm text-zinc-400">{t("notifications.loading")}</p> : null}
            {!loading && error ? <p className="px-3 py-4 text-sm text-red-200">{t("notifications.loadError")}</p> : null}
            {!loading && !error && preview.length === 0 ? (
              <p className="px-3 py-4 text-sm text-zinc-400">{t("notifications.empty")}</p>
            ) : null}
            {!loading && !error
              ? preview.map((item) => (
                  <div key={item.id} className="border-b border-aom-border/60 last:border-b-0">
                    <NotificationPreviewItem
                      item={item}
                      unread={unreadSnapshot.has(item.id)}
                      localeTag={localeTag}
                      onNavigate={() => setOpen(false)}
                    />
                  </div>
                ))
              : null}
          </div>
          <div className="border-t border-aom-border/80">
            <Link
              to={localeNotificationShowcasePath(locale)}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-center text-sm font-medium text-amber-200 transition hover:bg-zinc-900/80"
            >
              {t("notifications.showcaseMenu")}
            </Link>
            {hasMore ? (
              <Link
                to={localeNotificationsPath(locale)}
                onClick={() => setOpen(false)}
                className="block border-t border-aom-border/60 px-3 py-2.5 text-center text-sm font-medium text-amber-200/80 transition hover:bg-zinc-900/80"
              >
                {t("notifications.loadMore")}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
