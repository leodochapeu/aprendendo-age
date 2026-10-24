import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useTranslation } from "@/hooks/useTranslation";
import { localeToHtmlLang } from "@/lib/locale";
import { fetchNotificationPage } from "@/lib/siteNotificationsApi";
import { formatNotificationTime, resolveNotificationLink, type SiteNotification } from "@/lib/siteNotifications";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const SHOWCASE_LIMIT = 8;
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

export function NotificationShowcasePage() {
  const { t, locale } = useTranslation();
  const configured = isSupabaseConfigured();
  const localeTag = localeToHtmlLang(locale);
  const reducedMotion = useReducedMotion();
  const [items, setItems] = useState<SiteNotification[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);

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
      setItems(result.items.slice(0, SHOWCASE_LIMIT));
    });
    return () => {
      cancel = true;
    };
  }, [configured]);

  const count = items.length;
  const safeIndex = count === 0 ? 0 : index % count;
  const item = items[safeIndex];
  const playing = count > 1 && !hovered && !hidden && !reducedMotion;

  useEffect(() => {
    if (!playing) return;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - started) / SLIDE_MS);
      setProgress(ratio);
      if (ratio >= 1) {
        setProgress(0);
        setIndex((current) => (current + 1) % count);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, safeIndex, count]);

  useEffect(() => {
    const onHide = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  function goTo(next: number) {
    if (count === 0) return;
    setIndex((next + count) % count);
    setProgress(0);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <style>{`@keyframes showcase-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }`}</style>
      <section
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black px-6 py-8 text-white shadow-2xl shadow-black/40 sm:px-10 sm:py-12"
        aria-roledescription="carousel"
        aria-label={t("notifications.showcaseEyebrow")}
        tabIndex={0}
        onKeyDown={(event) => {
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
          <div key={item.id} className="mt-8 grid items-center gap-8 lg:grid-cols-2 [animation:showcase-in_0.7s_ease]">
            <div className="relative order-1 aspect-[16/10] w-full min-w-0 overflow-hidden rounded-[1.75rem] bg-zinc-950 lg:order-2">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-end bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_58%)] p-8">
                  <span className="font-[family-name:var(--font-display)] text-7xl text-white/15">{String(safeIndex + 1).padStart(2, "0")}</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
            </div>
            <div className="order-2 min-w-0 lg:order-1">
              <p className="text-xs tabular-nums tracking-[0.22em] text-zinc-500">
                {String(safeIndex + 1).padStart(2, "0")}
                <span className="mx-2 text-zinc-700">/</span>
                {String(count).padStart(2, "0")}
              </p>
              <p className="mt-4 text-sm text-zinc-400">{formatNotificationTime(item.startsAt, localeTag)}</p>
              <h1 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
                {item.title}
              </h1>
              <p className="mt-6 max-w-xl whitespace-pre-wrap text-base leading-relaxed text-zinc-400 sm:text-lg sm:leading-relaxed line-clamp-6">
                {item.description}
              </p>
              <div className="mt-8">
                <ShowcaseLink linkUrl={item.linkUrl} />
              </div>
            </div>
          </div>
        ) : null}

        {count > 1 ? (
          <div className="mt-10 flex items-center gap-4">
            <div className="flex min-w-0 flex-1 gap-2" role="tablist" aria-label={t("notifications.showcaseEyebrow")}>
              {items.map((slide, slideIndex) => {
                const active = slideIndex === safeIndex;
                const width = slideIndex < safeIndex ? "100%" : active ? `${Math.round((reducedMotion ? 1 : progress) * 100)}%` : "0%";
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={t("notifications.showcaseSlide", { current: slideIndex + 1, total: count })}
                    onClick={() => goTo(slideIndex)}
                    className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15"
                  >
                    <span className="block h-full bg-white" style={{ width }} />
                  </button>
                );
              })}
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
    </div>
  );
}
