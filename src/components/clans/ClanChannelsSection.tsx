import type { ReactNode } from "react";

import { ChannelGrid } from "@/components/channels/ChannelCard";
import { getClanAbout } from "@/data/clanAbout";
import type { Channel } from "@/data/channels";
import { useTranslation } from "@/hooks/useTranslation";
import type { ClanTheme } from "@/lib/clanTheme";
import { cn } from "@/lib/cn";

type ClanChannelsSectionProps = {
  channels: Channel[];
  theme: ClanTheme;
};

export function ClanChannelsSection({ channels, theme }: ClanChannelsSectionProps) {
  const { t } = useTranslation();

  if (channels.length === 0) return null;

  return (
    <section>
      <SectionHeading
        icon={<GlobeIcon className={theme.sectionIcon} />}
        title={t("pages.clans.detail.linksTitle")}
        subtitle={t("pages.clans.detail.linksSubtitle")}
      />
      <ChannelGrid channels={channels} compact />
    </section>
  );
}

function SectionHeading({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-aom-border/50 bg-zinc-950/80 shadow-inner">
        {icon}
      </div>
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-100 sm:text-xl">{title}</h2>
        <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function ClanAboutSection({ slug, theme }: { slug: string; theme: ClanTheme }) {
  const { t, locale } = useTranslation();
  const about = getClanAbout(slug, locale);

  return (
    <section>
      <SectionHeading
        icon={<AboutIcon className={theme.sectionIcon} />}
        title={t("pages.clans.detail.aboutTitle")}
        subtitle={t("pages.clans.detail.aboutSubtitle")}
      />
      {about ? (
        <article className={cn("overflow-hidden rounded-2xl border bg-zinc-950/55 shadow-inner", theme.accentBorder)}>
          <div className="divide-y divide-white/[0.06]">
            {about.blocks.map((block, index) => (
              <div key={block.title} className="px-5 py-7 sm:px-8 sm:py-9">
                <header>
                  <p className={cn("font-mono text-[11px] font-medium tracking-[0.34em]", theme.accentText)}>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3
                    className={cn(
                      "mt-2 font-[family-name:var(--font-display)] text-[1.65rem] font-semibold leading-tight tracking-wide sm:text-3xl",
                      theme.accentText,
                    )}
                  >
                    {block.title}
                  </h3>
                  <div className={cn("mt-4 h-px w-14 bg-current opacity-70", theme.accentText)} aria-hidden />
                </header>
                <div className="mt-5 max-w-3xl space-y-4">
                  {block.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-[15px] leading-8 text-zinc-300 sm:text-base sm:leading-8">
                      <EmphasisText text={paragraph} accentClass={theme.accentText} />
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <blockquote className="relative border-t border-white/[0.06] px-6 py-10 text-center sm:px-12 sm:py-12">
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-5 top-3 font-[family-name:var(--font-display)] text-6xl leading-none opacity-30 sm:left-8 sm:top-4 sm:text-7xl",
                theme.accentText,
              )}
            >
              “
            </span>
            <p className="relative mx-auto max-w-2xl font-[family-name:var(--font-display)] text-xl leading-snug tracking-wide text-zinc-50 sm:text-2xl">
              {about.motto}
            </p>
          </blockquote>
        </article>
      ) : (
        <div className={cn("overflow-hidden rounded-2xl border bg-zinc-950/50", theme.accentBorder)}>
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <span className="inline-flex items-center rounded-full border border-zinc-600/50 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {t("pages.clans.detail.comingSoon")}
            </span>
          </div>
          <div className="space-y-3 px-4 py-6 sm:px-5 sm:py-8">
            <div className="h-3 w-4/5 max-w-md rounded-full bg-zinc-800/80" aria-hidden />
            <div className="h-3 w-full rounded-full bg-zinc-800/60" aria-hidden />
            <div className="h-3 w-11/12 rounded-full bg-zinc-800/50" aria-hidden />
            <p className="pt-2 text-sm text-zinc-500">{t("pages.clans.detail.aboutPlaceholder")}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function EmphasisText({ text, accentClass }: { text: string; accentClass: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={index} className={cn("font-medium", accentClass)}>
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function AboutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 6.5v.01M12 10v7.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9" />
    </svg>
  );
}
