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

type Step = "choose" | "auto" | "manual" | "review";

const inputClass =
  "mt-1 w-full rounded-lg border border-aom-border bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30";

const secondaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-aom-border px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900/80 disabled:cursor-not-allowed disabled:opacity-50";

const primaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60";

function LoadingMark() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" aria-hidden />;
}

export function CommunityVideoSubmitModal({ open, onClose, onSuccess, availableTags }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const prefix = "pages.communityVideos.submit";

  const [step, setStep] = useState<Step>("choose");
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
    setStep("choose");
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
      setStep("review");
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

    setSaving(true);
    let publishedAtValue = publishedAt;
    if (!publishedAtValue) {
      try {
        const meta = await fetchYouTubeVideoMetadata(videoUrl);
        publishedAtValue = meta.publishedAt;
      } catch {
        publishedAtValue = "";
      }
    }

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

  const descriptionKey =
    step === "auto" ? "autoDescription" : step === "manual" ? "manualDescription" : step === "review" ? "reviewDescription" : "chooseDescription";
  const showForm = step === "manual" || step === "review";
  const busy = saving || syncing;

  return (
    <ModalApp
      open={open}
      onClose={handleClose}
      title={t(`${prefix}.modalTitle`)}
      description={t(`${prefix}.${descriptionKey}`)}
      className="max-w-xl"
    >
      {step === "choose" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("auto");
            }}
            className="rounded-xl border border-aom-border bg-zinc-900/60 px-4 py-4 text-left transition hover:border-amber-500/45 hover:bg-amber-500/10"
          >
            <span className="block text-sm font-semibold text-amber-100">{t(`${prefix}.fillAutomatic`)}</span>
            <span className="mt-1 block text-sm text-zinc-400">{t(`${prefix}.fillAutomaticHint`)}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("manual");
            }}
            className="rounded-xl border border-aom-border bg-zinc-900/60 px-4 py-4 text-left transition hover:border-amber-500/45 hover:bg-amber-500/10"
          >
            <span className="block text-sm font-semibold text-amber-100">{t(`${prefix}.fillManual`)}</span>
            <span className="mt-1 block text-sm text-zinc-400">{t(`${prefix}.fillManualHint`)}</span>
          </button>
        </div>
      ) : null}

      {step === "auto" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSync();
          }}
          className="space-y-4"
        >
          <label className="block text-sm">
            <span className="text-zinc-400">{t(`${prefix}.videoUrl`)}</span>
            <input
              type="url"
              required
              value={videoUrl}
              disabled={syncing}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setPublishedAt("");
              }}
              className={cn(inputClass, "disabled:cursor-not-allowed disabled:opacity-60")}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </label>
          {error ? (
            <p className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" disabled={syncing} onClick={() => setStep("choose")} className={secondaryBtnClass}>
              {t(`${prefix}.back`)}
            </button>
            <button type="submit" disabled={syncing || !videoUrl.trim()} aria-busy={syncing} className={primaryBtnClass}>
              {syncing ? <LoadingMark /> : null}
              {syncing ? t(`${prefix}.syncing`) : t(`${prefix}.syncFromYoutube`)}
            </button>
          </div>
        </form>
      ) : null}

      {showForm ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <label className="block text-sm">
            <span className="text-zinc-400">{t(`${prefix}.videoUrl`)}</span>
            <input
              type="url"
              required
              readOnly={step === "review"}
              value={videoUrl}
              disabled={busy}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setPublishedAt("");
              }}
              className={cn(inputClass, step === "review" && "text-zinc-400", "disabled:cursor-not-allowed disabled:opacity-60")}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-400">{t(`${prefix}.title`)}</span>
            <input
              type="text"
              required
              value={title}
              disabled={busy}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(inputClass, "disabled:cursor-not-allowed disabled:opacity-60")}
            />
          </label>

          {tags.length ? (
            <CommunityVideoTagMultiselect
              tags={tags}
              selectedIds={selectedTagIds}
              onChange={setSelectedTagIds}
              disabled={busy}
              label={t(`${prefix}.tags`)}
            />
          ) : null}

          <label className="block text-sm">
            <span className="text-zinc-400">{t(`${prefix}.description`)}</span>
            <textarea
              value={description}
              disabled={busy}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={cn(inputClass, "resize-y disabled:cursor-not-allowed disabled:opacity-60")}
            />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-400">{t(`${prefix}.thumbnailUrl`)}</span>
            <input
              type="url"
              value={thumbnailUrl}
              disabled={busy}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className={cn(inputClass, "disabled:cursor-not-allowed disabled:opacity-60")}
            />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-400">{t(`${prefix}.channelName`)}</span>
            <input
              type="text"
              value={channelName}
              disabled={busy}
              onChange={(e) => setChannelName(e.target.value)}
              className={cn(inputClass, "disabled:cursor-not-allowed disabled:opacity-60")}
            />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-400">{t(`${prefix}.channelAvatarUrl`)}</span>
            <input
              type="url"
              value={channelAvatarUrl}
              disabled={busy}
              onChange={(e) => setChannelAvatarUrl(e.target.value)}
              className={cn(inputClass, "disabled:cursor-not-allowed disabled:opacity-60")}
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
              disabled={busy}
              onClick={() => {
                setError(null);
                if (step === "review") setStep("auto");
                else {
                  resetForm();
                }
              }}
              className={secondaryBtnClass}
            >
              {t(`${prefix}.back`)}
            </button>
            <button type="button" disabled={busy} onClick={handleClose} className={secondaryBtnClass}>
              {t(`${prefix}.cancel`)}
            </button>
            <button type="submit" disabled={busy} aria-busy={saving} className={primaryBtnClass}>
              {saving ? <LoadingMark /> : null}
              {saving ? t(`${prefix}.saving`) : t(`${prefix}.save`)}
            </button>
          </div>
        </form>
      ) : null}
    </ModalApp>
  );
}
