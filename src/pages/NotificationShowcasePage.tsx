import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import { useTranslation } from "@/hooks/useTranslation";
import { localeToHtmlLang } from "@/lib/locale";
import { fetchNotificationPage } from "@/lib/siteNotificationsApi";
import { formatNotificationTime, NOTIFICATION_HISTORY_PAGE_SIZE, resolveNotificationLink, type SiteNotification } from "@/lib/siteNotifications";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const SHOWCASE_LIMIT = 5;
const ARCHIVE_PAGE_SIZE = 10;
const SLIDE_MS = 8000;

function useReducedMotion(): boolean {
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

function QuietLink({ linkUrl }: { linkUrl: string | null }) {
  const { t } = useTranslation();
  const link = resolveNotificationLink(linkUrl);
  if (!link) return null;
  const className = "text-xs text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline";
  if (link.kind === "internal") {
    return (
      <Link to={link.href} className={className}>
        {t("notifications.openLink")}
      </Link>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {t("notifications.openLink")}
    </a>
  );
}

function ReadingModal({
  item,
  localeTag,
  onClose,
}: {
  item: SiteNotification;
  localeTag: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/75" aria-label={t("notifications.close")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-reading-title"
        className="relative flex max-h-[min(88vh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 text-white shadow-2xl shadow-black/50"
      >
        <div className="flex shrink-0 justify-end px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            {t("notifications.close")}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 sm:px-8">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="mx-auto max-h-[46vh] w-auto max-w-full rounded-2xl object-contain" />
          ) : null}
          <p className="mt-6 text-sm text-zinc-500">{formatNotificationTime(item.startsAt, localeTag)}</p>
          <h2 id="notification-reading-title" className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {item.title}
          </h2>
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-zinc-300">{item.description}</p>
          <div className="mt-8">
            <ShowcaseLink linkUrl={item.linkUrl} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ShowcaseLink({ linkUrl }: { linkUrl: string | null }) {
  const { t } = useTranslation();
  const link = resolveNotificationLink(linkUrl);
  if (!link) return null;
  const className =
    "inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/70";
  const label = (
    <>
      {t("notifications.openLink")}
      <span aria-hidden>→</span>
    </>
  );
  if (link.kind === "internal") {
    return (
      <Link to={link.href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  );
}

export function NotificationNewsCarousel({ archive = false }: { archive?: boolean }) {
  const { t, locale } = useTranslation();
  const configured = isSupabaseConfigured();
  const localeTag = localeToHtmlLang(locale);
  const reducedMotion = useReducedMotion();
  const [items, setItems] = useState<SiteNotification[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reading, setReading] = useState<SiteNotification | null>(null);
  const [archivePage, setArchivePage] = useState(0);
  const archiveRef = useRef<HTMLElement>(null);
  const closeReading = useCallback(() => setReading(null), []);
  const indexRef = useRef(0);
  const progressRef = useRef(0);
  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (!configured) return;
    let cancel = false;
    void (async () => {
      const collected: SiteNotification[] = [];
      let offset = 0;
      for (;;) {
        const result = await fetchNotificationPage(offset);
        if (cancel) return;
        if (!result.ok) {
          setLoading(false);
          setError(true);
          return;
        }
        collected.push(...result.items);
        if (result.items.length < NOTIFICATION_HISTORY_PAGE_SIZE) break;
        offset += result.items.length;
        if (offset >= 200) break;
      }
      if (cancel) return;
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
      if (!url) continue;
      const preload = new Image();
      preload.src = url;
    }
  }, [imageKey]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
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
        if (!bar) continue;
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

  function goTo(next: number) {
    if (count === 0) return;
    const resolved = (next + count) % count;
    indexRef.current = resolved;
    progressRef.current = 0;
    setIndex(resolved);
  }

  if (!archive && (!configured || loading || error || featured.length === 0)) return null;

  return (
    <div className={archive ? "mx-auto max-w-6xl" : undefined}>
      <style>{`@keyframes showcase-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <section
        className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-black px-6 py-8 text-white shadow-2xl shadow-black/40 sm:px-10 sm:py-12"
        aria-roledescription="carousel"
        aria-label={t("notifications.showcaseEyebrow")}
        tabIndex={0}
        onKeyDown={(event) => {
          if (reading) return;
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(safeIndex + 1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(safeIndex - 1);
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false);
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -z-10 inset-0 bg-[radial-gradient(ellipse_42%_55%_at_76%_46%,rgba(245,158,11,0.14),transparent_70%)]"
        />
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">{t("notifications.showcaseEyebrow")}</p>

        {loading ? <p className="mt-16 text-sm text-zinc-500">{t("notifications.loading")}</p> : null}
        {!configured ? <p className="mt-16 text-sm text-zinc-500">{t("notifications.errors.unconfigured")}</p> : null}
        {!loading && error ? <p className="mt-16 text-sm text-red-200">{t("notifications.loadError")}</p> : null}
        {!loading && !error && configured && !item ? (
          <p className="mt-16 font-[family-name:var(--font-display)] text-3xl tracking-tight text-zinc-300 sm:text-5xl">
            {t("notifications.showcaseEmpty")}
          </p>
        ) : null}

        {item ? (
          <div key={item.id} className="mt-8 grid items-center gap-8 lg:grid-cols-2 [animation:showcase-in_0.45s_ease]">
            <div className="order-1 flex h-[min(46vh,24rem)] w-full min-w-0 items-center justify-center lg:order-2">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="max-h-full w-auto max-w-full rounded-[1.75rem] object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-end rounded-[1.75rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_58%)] p-8">
                  <span className="font-[family-name:var(--font-display)] text-7xl text-white/15">{String(safeIndex + 1).padStart(2, "0")}</span>
                </div>
              )}
            </div>
            <div className="order-2 min-w-0 lg:order-1">
              <p className="text-xs tabular-nums tracking-[0.22em] text-zinc-500">
                {String(safeIndex + 1).padStart(2, "0")}
                <span className="mx-2 text-zinc-700">/</span>
                {String(count).padStart(2, "0")}
              </p>
              <p className="mt-4 text-sm text-zinc-400">{formatNotificationTime(item.startsAt, localeTag)}</p>
              <h1 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-white line-clamp-3 sm:text-5xl">
                {item.title}
              </h1>
              <p className="mt-6 max-w-xl whitespace-pre-wrap text-base leading-relaxed text-zinc-400 line-clamp-4 sm:text-lg sm:leading-relaxed">
                {item.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setReading(item)}
                  className="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  {t("notifications.showcaseRead")}
                </button>
                <ShowcaseLink linkUrl={item.linkUrl} />
              </div>
            </div>
          </div>
        ) : null}

        {count > 1 ? (
          <div className="mt-10 flex items-center gap-4">
            <div className="flex min-w-0 flex-1 gap-2" role="tablist" aria-label={t("notifications.showcaseEyebrow")}>
              {featured.map((slide, slideIndex) => (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={slideIndex === safeIndex}
                    aria-label={t("notifications.showcaseSlide", { current: slideIndex + 1, total: count })}
                    onClick={() => goTo(slideIndex)}
                    className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15"
                  >
                    <span
                      ref={(node) => {
                        barRefs.current[slideIndex] = node;
                      }}
                      className="block h-full origin-left bg-white"
                    />
                  </button>
                ))}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => goTo(safeIndex - 1)}
                aria-label={t("notifications.showcasePrevious")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => goTo(safeIndex + 1)}
                aria-label={t("notifications.showcaseNext")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10"
              >
                ›
              </button>
            </div>
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {item ? t("notifications.showcaseSlide", { current: safeIndex + 1, total: count }) : ""}
        </p>
      </section>

      {archive && archiveItems.length > 0 ? (
        <section ref={archiveRef} className="mx-auto mt-14 max-w-3xl scroll-mt-24" aria-label={t("notifications.showcaseArchive")}>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">{t("notifications.showcaseArchive")}</h2>
          <ul className="mt-4 divide-y divide-white/10">
            {visibleArchive.map((entry) => (
              <li key={entry.id} className="flex items-start gap-4 py-4">
                {entry.imageUrl ? (
                  <img src={entry.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover opacity-80" />
                ) : (
                  <span className="h-14 w-14 shrink-0 rounded-lg bg-zinc-900/80" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">{formatNotificationTime(entry.startsAt, localeTag)}</p>
                  <h3 className="mt-1 text-sm font-medium leading-snug text-zinc-300">{entry.title}</h3>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500">{entry.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => setReading(entry)} className="text-xs text-zinc-400 underline-offset-4 transition hover:text-zinc-200 hover:underline">
                      {t("notifications.showcaseRead")}
                    </button>
                    <QuietLink linkUrl={entry.linkUrl} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {archivePageCount > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setArchivePage(safeArchivePage - 1);
                  archiveRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
                }}
                disabled={safeArchivePage === 0}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("notifications.showcasePrevious")}
              </button>
              <p className="text-xs tabular-nums tracking-[0.14em] text-zinc-500">
                {t("notifications.showcasePage", { current: safeArchivePage + 1, total: archivePageCount })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setArchivePage(safeArchivePage + 1);
                  archiveRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
                }}
                disabled={safeArchivePage >= archivePageCount - 1}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("notifications.showcaseNext")}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
      {reading ? <ReadingModal item={reading} localeTag={localeTag} onClose={closeReading} /> : null}
    </div>
  );
}

export function NotificationShowcasePage() {
  return <NotificationNewsCarousel archive />;
}
