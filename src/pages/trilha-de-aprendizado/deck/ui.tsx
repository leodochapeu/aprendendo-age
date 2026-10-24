import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/cn";
import { useTranslation } from "@/hooks/useTranslation";
import { getTokenAssetUrl } from "@/lib/notionTokenAssets";

export const trilhaSectionClass = "scroll-mt-[calc(var(--trilha-stick,0px)+7.5rem)]";

export function LessonSection({
  id,
  kicker,
  title,
  lede,
  children,
  center = false,
  slide = false,
}: {
  id: string;
  kicker?: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  center?: boolean;
  slide?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        trilhaSectionClass,
        "relative border-t border-white/10 px-5 py-16 md:px-12 md:py-24",
        slide && "flex min-h-[calc(100svh-var(--trilha-stick,0px)-7.5rem)] items-center",
      )}
    >
      <div className={cn("relative mx-auto w-full max-w-6xl", center && "text-center")}>
        {kicker ? (
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300/90">{kicker}</p>
        ) : null}
        <h2
          className={cn(
            "mt-4 max-w-4xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-50 md:text-5xl lg:text-6xl",
            center && "mx-auto",
          )}
        >
          {title}
        </h2>
        {lede ? (
          <p
            className={cn(
              "mt-6 max-w-3xl text-lg leading-relaxed text-zinc-100 md:text-xl",
              center && "mx-auto",
            )}
          >
            {lede}
          </p>
        ) : null}
        {children ? <div className={cn("mt-10", center && "mx-auto")}>{children}</div> : null}
      </div>
    </section>
  );
}

export function Keycap({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-zinc-400/70 bg-gradient-to-b from-zinc-500 to-zinc-900 px-3 py-2 font-sans text-lg font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_2px_0_#09090b]">
      {children}
    </kbd>
  );
}

export function KeyPlus() {
  return (
    <span className="px-1 text-xl font-medium text-zinc-400" aria-hidden>
      +
    </span>
  );
}

export function ShortcutCard({ title, keys, hint }: { title: ReactNode; keys: ReactNode; hint?: ReactNode }) {
  return (
    <article className="flex min-h-40 flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.045] p-6 md:p-7">
      <h3 className="text-lg font-medium leading-snug text-zinc-50 md:text-xl">{title}</h3>
      <div>
        <div className="flex flex-wrap items-center gap-2">{keys}</div>
        {hint ? <p className="mt-3 text-base leading-relaxed text-zinc-300">{hint}</p> : null}
      </div>
    </article>
  );
}

export function Shot({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      aria-label={alt ? undefined : t("pages.trilha.deck.enlargeImage")}
      className={cn("block", className)}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-auto w-full rounded-2xl border border-white/10 bg-zinc-900 object-contain shadow-2xl shadow-black/40"
      />
    </a>
  );
}

export function BigToken({ name, className }: { name: string; className?: string }) {
  const src = getTokenAssetUrl(name);
  if (!src) return null;
  return <img src={src} alt="" className={cn("h-16 w-16 object-contain", className)} />;
}

export function InlineToken({ name }: { name: string }) {
  const src = getTokenAssetUrl(name);
  if (!src) return null;
  return <img src={src} alt="" className="inline h-[1.2em] w-[1.2em] align-[-0.2em] object-contain" />;
}

export function PillLink({
  to,
  children,
  external = false,
}: {
  to: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className =
    "group inline-flex items-center gap-3 rounded-full bg-zinc-50 px-7 py-3.5 text-base font-semibold text-zinc-950 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 md:text-lg";
  const inner = (
    <>
      {children}
      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </>
  );
  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {inner}
    </Link>
  );
}

const quoteTone = {
  teal: "border-teal-300/25 bg-teal-950/45",
  orange: "border-orange-300/35 bg-orange-950/45",
  amber: "border-amber-300/25 bg-amber-950/35",
} as const;

export function PullQuote({
  children,
  icon,
  tone = "teal",
}: {
  children: ReactNode;
  icon?: ReactNode;
  tone?: keyof typeof quoteTone;
}) {
  return (
    <blockquote className={cn("flex gap-4 rounded-3xl border p-6 text-lg leading-relaxed text-zinc-50 md:p-8 md:text-xl", quoteTone[tone])}>
      {icon ? <div className="shrink-0">{icon}</div> : null}
      <div className="min-w-0 space-y-3">{children}</div>
    </blockquote>
  );
}

export function VideoFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/40">
      <iframe
        title={title}
        src={src}
        className="h-full w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
