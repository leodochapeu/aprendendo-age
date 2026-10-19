import { useEffect, useState } from "react";

import { CommunityVideoTagMultiselect } from "@/components/community/CommunityVideoTagMultiselect";
import { ModalApp } from "@/components/ui/ModalApp";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  fetchCommunityVideoTags,
  submitCommunityVideo,
  type CommunityVideoTag,
} from "@/lib/communityVideosApi";
import { extractYouTubeVideoId } from "@/lib/youtubeEmbed";
import {
  fetchYouTubeVideoMetadata,
  YouTubeApiNotConfiguredError,
  YouTubeVideoNotFoundError,
} from "@/lib/youtubeVideoMetadata";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableTags?: CommunityVideoTag[];
};

const inputClass =
  "mt-1 w-full rounded-lg border border-aom-border bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30";

export function CommunityVideoSubmitModal({ open, onClose, onSuccess, availableTags }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const prefix = "pages.communityVideos.submit";

  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [channelAvatarUrl, setChannelAvatarUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tags, setTags] = useState<CommunityVideoTag[]>(availableTags ?? []);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (availableTags?.length) {
      setTags(availableTags);
      return;
    }
    if (!open) return;
    void fetchCommunityVideoTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, [availableTags, open]);

  function resetForm() {
    setVideoUrl("");
    setTitle("");
    setDescription("");
    setThumbnailUrl("");
    setChannelAvatarUrl("");
    setChannelName("");
    setPublishedAt("");
    setSelectedTagIds([]);
    setError(null);
  }

  function handleClose() {
    if (saving || syncing) return;
    resetForm();
    onClose();
  }

  async function handleSync() {
    setError(null);
    if (!extractYouTubeVideoId(videoUrl)) {
      setError(t(`${prefix}.invalidUrl`));
      return;
    }
    setSyncing(true);
    try {
      const meta = await fetchYouTubeVideoMetadata(videoUrl);
      setTitle(meta.title);
      setDescription(meta.description);
      setThumbnailUrl(meta.thumbnailUrl);
      setChannelAvatarUrl(meta.channelAvatarUrl);
      setChannelName(meta.channelName);
      setPublishedAt(meta.publishedAt);
    } catch (e) {
      if (e instanceof YouTubeApiNotConfiguredError) {
        setError(t(`${prefix}.youtubeNotConfigured`));
      } else if (e instanceof YouTubeVideoNotFoundError) {
        setError(t(`${prefix}.youtubeNotFound`));
      } else {
        setError(t(`${prefix}.youtubeApiError`));
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!extractYouTubeVideoId(videoUrl)) {
      setError(t(`${prefix}.invalidUrl`));
      return;
    }
    if (!title.trim()) {
      setError(t(`${prefix}.titleRequired`));
      return;
    }

    let publishedAtValue = publishedAt;
    if (!publishedAtValue) {
      try {
        const meta = await fetchYouTubeVideoMetadata(videoUrl);
        publishedAtValue = meta.publishedAt;
      } catch {
        publishedAtValue = "";
      }
    }

    setSaving(true);
    const res = await submitCommunityVideo({
      videoUrl,
      title,
      description,
      thumbnailUrl,
      channelAvatarUrl,
      channelName,
      tagIds: selectedTagIds,
      publishedAt: publishedAtValue || undefined,
    });
    setSaving(false);

    if (!res.ok) {
      const duplicateMessages: Record<string, string> = {
        DUPLICATE_URL: t(`${prefix}.duplicateUrl`),
        DUPLICATE_TITLE: t(`${prefix}.duplicateTitle`),
        DUPLICATE_BOTH: t(`${prefix}.duplicateBoth`),
      };
      if (res.message in duplicateMessages) {
        const msg = duplicateMessages[res.message]!;
        setError(msg);
        showToast(msg, "error");
        return;
      }
      if (res.message === "NOT_AUTHENTICATED") {
        setError(t(`${prefix}.notAuthenticated`));
      } else if (res.message === "SUPABASE_NOT_CONFIGURED") {
        setError(t("pages.communityVideos.unconfigured"));
      } else if (res.message === "TAGS_ERROR") {
        setError(t(`${prefix}.tagsError`));
      } else {
        setError(t(`${prefix}.submitError`));
      }
      return;
    }

    showToast(t("pages.communityVideos.toastSuccess"));
    resetForm();
    onClose();
    onSuccess();
  }

  return (
    <ModalApp
      open={open}
      onClose={handleClose}
      title={t(`${prefix}.modalTitle`)}
      description={t(`${prefix}.modalDescription`)}
      className="max-w-xl"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <label className="block text-sm">
          <span className="text-zinc-400">{t(`${prefix}.videoUrl`)}</span>
          <input
            type="url"
            required
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setPublishedAt("");
            }}
            className={inputClass}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={syncing || saving}
            onClick={() => void handleSync()}
            className={cn(
              "rounded-lg border border-aom-border bg-zinc-900/80 px-3 py-2 text-sm font-medium text-amber-100/90 transition",
              "hover:border-amber-500/40 hover:bg-zinc-800/90 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {syncing ? t(`${prefix}.syncing`) : t(`${prefix}.syncFromYoutube`)}
          </button>
        </div>

        <label className="block text-sm">
          <span className="text-zinc-400">{t(`${prefix}.title`)}</span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </label>

        {tags.length ? (
          <CommunityVideoTagMultiselect
            tags={tags}
            selectedIds={selectedTagIds}
            onChange={setSelectedTagIds}
            disabled={saving || syncing}
            label={t(`${prefix}.tags`)}
          />
        ) : null}

        <label className="block text-sm">
          <span className="text-zinc-400">{t(`${prefix}.description`)}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={cn(inputClass, "resize-y")}
          />
        </label>

        <label className="block text-sm">
          <span className="text-zinc-400">{t(`${prefix}.thumbnailUrl`)}</span>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className="text-zinc-400">{t(`${prefix}.channelName`)}</span>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className="text-zinc-400">{t(`${prefix}.channelAvatarUrl`)}</span>
          <input
            type="url"
            value={channelAvatarUrl}
            onChange={(e) => setChannelAvatarUrl(e.target.value)}
            className={inputClass}
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={saving || syncing}
            onClick={handleClose}
            className="rounded-lg border border-aom-border px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900/80 disabled:opacity-50"
          >
            {t(`${prefix}.cancel`)}
          </button>
          <button
            type="submit"
            disabled={saving || syncing}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t(`${prefix}.saving`) : t(`${prefix}.save`)}
          </button>
        </div>
      </form>
    </ModalApp>
  );
}
