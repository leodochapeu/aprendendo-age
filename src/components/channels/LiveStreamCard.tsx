import { useEffect, useState } from "react";

import type { Channel } from "@/data/channels";
import { useTranslation } from "@/hooks/useTranslation";
import { ChannelCategoryIcon, getChannelCategoryStyle } from "@/lib/channelCategory";
import { channelImageUrl } from "@/lib/channelsApi";
import type { ChannelLiveSnapshot } from "@/lib/channelLiveStatus";
import { cn } from "@/lib/cn";

type LiveStreamCardProps = {
  channel: Channel;
  preview: ChannelLiveSnapshot;
};

export function LiveStreamCard({ channel, preview }: LiveStreamCardProps) {
  const { t, locale } = useTranslation();
  const style = getChannelCategoryStyle(channel.category);
  const portraitSrc = channelImageUrl(channel) ?? preview.portraitUrl ?? undefined;
  const [thumbFailed, setThumbFailed] = useState(false);
  const [portraitFailed, setPortraitFailed] = useState(false);

  useEffect(() => {
    setThumbFailed(false);
  }, [preview.thumbnailUrl]);

  useEffect(() => {
    setPortraitFailed(false);
  }, [portraitSrc]);

  const showThumb = Boolean(preview.thumbnailUrl) && !thumbFailed;
  const showPortrait = Boolean(portraitSrc) && !portraitFailed;
  const title = preview.title?.trim() || t("pages.streamerLinks.liveTitleFallback");
  const viewers =
    preview.viewerCount == null
      ? null
      : new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en").format(preview.viewerCount);

  return (
    <a
      href={channel.urlLink}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-800/45 bg-[#120e0a] shadow-lg shadow-black/50 transition duration-300",
        "hover:-translate-y-0.5 hover:border-amber-600/55 hover:shadow-xl hover:shadow-black/60",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
      )}
      title={t("pages.channels.openLink", { name: channel.name })}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {showThumb ? (
          <img
            src={preview.thumbnailUrl ?? undefined}
            alt={t("pages.streamerLinks.livePreviewAlt", { name: channel.name })}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.02]"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <PortraitWindow portraitSrc={showPortrait ? portraitSrc : undefined} channel={channel} glow={style.glow} />
        )}

        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/40" aria-hidden />

        <span
          className={cn(
            "absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-black/40",
            channel.category === "youtube" ? "bg-red-600" : "bg-[#9146FF]",
          )}
        >
          <span className="size-1.5 rounded-full bg-white" aria-hidden />
          {t("pages.streamerLinks.liveBadge")}
        </span>

        {viewers != null ? (
          <span
            className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-white"
            aria-label={t("pages.streamerLinks.liveViewersAria", { count: viewers })}
          >
            <EyeIcon />
            {viewers}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 items-center gap-3 border-t border-amber-900/40 bg-[#16110c] px-3 py-3">
        <div
          className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-700/55 bg-zinc-950"
          style={{ boxShadow: `0 0 16px ${style.glow}` }}
        >
          {showPortrait ? (
            <img src={portraitSrc} alt="" className="size-full object-cover" onError={() => setPortraitFailed(true)} />
          ) : (
            <span className={cn("text-zinc-100", style.accentText)}>
              <ChannelCategoryIcon category={channel.category} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-aom-gold">
            {channel.name}
          </p>
          <p className="mt-0.5 truncate text-sm text-zinc-300">{title}</p>
        </div>
      </div>
    </a>
  );
}

function PortraitWindow({
  portraitSrc,
  channel,
  glow,
}: {
  portraitSrc?: string;
  channel: Channel;
  glow: string;
}) {
  const style = getChannelCategoryStyle(channel.category);

  return (
    <div
      className="flex size-full items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-950"
      style={{ backgroundImage: `radial-gradient(circle at 50% 45%, ${glow}, transparent 58%)` }}
    >
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-2 border-amber-700/50 bg-zinc-950 shadow-2xl shadow-black/60">
        {portraitSrc ? (
          <img src={portraitSrc} alt="" className="size-full object-cover" />
        ) : (
          <span className={cn("scale-150 text-zinc-100", style.accentText)}>
            <ChannelCategoryIcon category={channel.category} />
          </span>
        )}
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
