import { useEffect, useState } from "react";

import { CommunityVideoTagBadge } from "@/components/community/CommunityVideoTagBadge";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  approveCommunityVideo,
  fetchPendingCommunityVideos,
  rejectCommunityVideo,
  type CommunityVideoRequest,
} from "@/lib/communityVideosApi";
import { localeToHtmlLang } from "@/lib/locale";
import { truncateToTwoParagraphs } from "@/lib/truncateToTwoParagraphs";

export function CommunityVideoRequestsPanel() {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const localeTag = localeToHtmlLang(locale);
  const prefix = "pages.communityVideos.moderation";
  const [items, setItems] = useState<CommunityVideoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    void fetchPendingCommunityVideos().then((result) => {
      if (cancel) return;
      if (!result.ok) setError(true);
      else setItems(result.data);
      setLoading(false);
    });
    return () => {
      cancel = true;
    };
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    const result = await approveCommunityVideo(id);
    setBusyId(null);
    if (!result.ok) {
      showToast(t(`${prefix}.saveError`), "error");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
    showToast(t(`${prefix}.approved`));
  }

  async function reject(id: string) {
    setBusyId(id);
    const result = await rejectCommunityVideo(id);
    setBusyId(null);
    if (!result.ok) {
      showToast(t(`${prefix}.saveError`), "error");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
    showToast(t(`${prefix}.rejected`));
  }

  if (loading) return <p className="text-sm text-zinc-400">{t("notifications.loading")}</p>;
  if (error) return <p className="text-sm text-red-200">{t(`${prefix}.loadError`)}</p>;
  if (items.length === 0) return <p className="text-sm text-zinc-400">{t(`${prefix}.empty`)}</p>;

  return (
    <ul className="divide-y divide-white/10">
      {items.map((item) => {
        const when = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.updatedAt));
        const busy = busyId === item.id;
        return (
          <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row">
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt="" className="h-24 w-full rounded-lg object-cover sm:w-40" />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>{when}</span>
                <span>{t(`${prefix}.by`, { name: item.submitterName || t(`${prefix}.unknownAuthor`) })}</span>
                {item.channelName ? <span>{item.channelName}</span> : null}
              </div>
              <h2 className="mt-1 text-sm font-semibold text-zinc-100">{item.title}</h2>
              {item.tags.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <CommunityVideoTagBadge key={tag.id} tag={tag} size="sm" />
                  ))}
                </div>
              ) : null}
              {item.description ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{truncateToTwoParagraphs(item.description)}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-amber-100 hover:border-amber-400/40"
                >
                  {t(`${prefix}.openVideo`)}
                </a>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 disabled:opacity-50"
                  onClick={() => void approve(item.id)}
                >
                  {t(`${prefix}.approve`)}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-200 disabled:opacity-50"
                  onClick={() => void reject(item.id)}
                >
                  {t(`${prefix}.reject`)}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
