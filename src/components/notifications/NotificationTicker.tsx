import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { NOTIFICATION_TICKER_LIMIT, resolveNotificationLink, type SiteNotification } from "@/lib/siteNotifications";

const SLIDE_MS = 5000;
const SLIDE_TRANSITION_MS = 520;

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3.5 2.8 20h18.4L12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9.2v4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16.8h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function TickerSlide({ item, onActivate }: { item: SiteNotification; onActivate: () => void }) {
  const link = resolveNotificationLink(item.linkUrl);
  const body = (
    <span className="flex min-w-0 items-center gap-3">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
      ) : null}
      <span className="truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-amber-50">
        {item.title}
      </span>
    </span>
  );
  const className = "flex h-14 w-full items-center";
  if (!link) return <div className={className}>{body}</div>;
  if (link.kind === "internal") {
    return (
      <Link to={link.href} className={cn(className, "transition hover:text-amber-200")} onClick={onActivate}>
        {body}
      </Link>
    );
  }
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(className, "transition hover:text-amber-200")}
      onClick={onActivate}
    >
      {body}
    </a>
  );
}

const clusterButtonClass = cn(
  "hidden h-10 w-10 items-center justify-center rounded-full border border-aom-border md:flex",
  "bg-zinc-950/90 text-amber-200/95 shadow-lg shadow-black/30 backdrop-blur-sm",
  "transition hover:border-amber-500/45 hover:bg-zinc-900",
  "focus:outline-none focus:ring-2 focus:ring-amber-500/35",
);

export function NotificationTickerToggle() {
  const { t } = useTranslation();
  const { preview, bannerOffset, tickerCollapsed, setTickerCollapsed } = useSiteNotifications();
  const featuredOpen = bannerOffset > 0;
  if (preview.length === 0) return null;

  if (tickerCollapsed || featuredOpen) {
    return (
      <button
        type="button"
        onClick={() => setTickerCollapsed(false)}
        aria-expanded={false}
        aria-label={t("notifications.tickerShow")}
        title={t("notifications.tickerShow")}
        className={clusterButtonClass}
      >
        <AlertIcon />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTickerCollapsed(true)}
      aria-expanded
      aria-label={t("notifications.tickerHide")}
      title={t("notifications.tickerHide")}
      className={clusterButtonClass}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="m6 14 6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function NotificationTicker() {
  const { t } = useTranslation();
  const { preview, bannerOffset, tickerCollapsed, setTickerOffset, markRead } = useSiteNotifications();
  const items = preview.slice(0, NOTIFICATION_TICKER_LIMIT);
  const slideKey = items.map((item) => item.id).join("|");
  const slides = items.length > 1 ? [...items, items[0]!] : items;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const frameRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const visible = !tickerCollapsed && bannerOffset === 0 && items.length > 0;

  useEffect(() => {
    setIndex(0);
    setAnimate(false);
  }, [slideKey]);

  useEffect(() => {
    if (!visible || items.length < 2) return;
    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setAnimate(!reduce);
      setIndex((current) => current + 1);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [visible, items.length]);

  useEffect(() => {
    if (items.length < 2 || index < items.length) return;
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

  if (!visible) return null;

  const shift = slides.length === 0 ? 0 : (index * 100) / slides.length;

  return (
    <div
      ref={frameRef}
      className="fixed inset-x-0 z-[19] hidden border-b border-amber-500/30 bg-zinc-950/95 md:block"
      style={{ top: bannerOffset }}
      role="region"
      aria-label={t("notifications.tickerLabel")}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div className="flex h-16 items-center pl-[calc(14rem+2.5rem)] pr-[17rem]">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className={cn("flex", animate && "transition-transform duration-500 ease-out")}
            style={{ width: `${slides.length * 100}%`, transform: `translateX(-${shift}%)` }}
          >
            {slides.map((item, slideIndex) => (
              <div key={`${item.id}-${slideIndex}`} className="shrink-0" style={{ width: `${100 / slides.length}%` }}>
                <TickerSlide item={item} onActivate={() => markRead([item.id])} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
