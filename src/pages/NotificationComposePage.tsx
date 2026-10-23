import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { canSendSiteNotification } from "@/lib/auth/constants";
import { cn } from "@/lib/cn";
import {
  notificationImageError,
  notificationTextError,
  NOTIFICATION_DESCRIPTION_MAX,
  NOTIFICATION_LINK_MAX,
  NOTIFICATION_TITLE_MAX,
  notificationImageStoragePath,
  resolveNotificationLink,
  resolveNotificationWindow,
  toDatetimeLocalValue,
} from "@/lib/siteNotifications";
import { localeNotificationManagePath } from "@/lib/localeRoutes";
import {
  fetchManagedNotification,
  removeNotificationImage,
  sendSiteNotification,
  updateSiteNotification,
  uploadNotificationImage,
} from "@/lib/siteNotificationsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const inputClass =
  "mt-1 w-full rounded-lg border border-aom-border bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30";

function defaultExpiresLocal(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return toDatetimeLocalValue(date);
}

export function NotificationComposePage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const { refresh } = useSiteNotifications();
  const { status, user, profile, profileLoadState } = useAuth();
  const configured = isSupabaseConfigured();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [expiresAtLocal, setExpiresAtLocal] = useState(defaultExpiresLocal);
  const [image, setImage] = useState<File | null>(null);
  const [imageKey, setImageKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [originalStartsAt, setOriginalStartsAt] = useState<string | null>(null);
  const [itemReady, setItemReady] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend =
    configured && status === "authenticated" && profileLoadState === "ready" && canSendSiteNotification(profile?.role);

  useEffect(() => {
    if (!editing || !id || !canSend) return;
    let cancel = false;
    setItemReady(false);
    void fetchManagedNotification(id).then((result) => {
      if (cancel) return;
      if (!result.ok) {
        setError(t(result.message === "NOT_FOUND" ? "notifications.errors.notFound" : "notifications.loadError"));
        return;
      }
      const item = result.item;
      const starts = new Date(item.startsAt);
      setTitle(item.title);
      setDescription(item.description);
      setLink(item.linkUrl ?? "");
      setHighlighted(item.highlighted);
      setExistingImageUrl(item.imageUrl);
      setImageRemoved(false);
      setOriginalStartsAt(item.startsAt);
      setExpiresAtLocal(toDatetimeLocalValue(new Date(item.expiresAt)));
      if (starts.getTime() > Date.now()) {
        setMode("schedule");
        setStartsAtLocal(toDatetimeLocalValue(starts));
      } else {
        setMode("now");
        setStartsAtLocal("");
      }
      setItemReady(true);
    });
    return () => {
      cancel = true;
    };
  }, [canSend, editing, id, t]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const textError = notificationTextError(title, description, link);
    if (textError) {
      setError(t(`notifications.errors.${textError}`));
      return;
    }
    const keptStart =
      editing && mode === "now" && originalStartsAt && new Date(originalStartsAt).getTime() <= Date.now()
        ? new Date(originalStartsAt)
        : null;
    const windowResult = resolveNotificationWindow({ mode, startsAtLocal, expiresAtLocal, keepStartsAt: keptStart });
    if (!windowResult.ok) {
      setError(t(`notifications.errors.${windowResult.error}`));
      return;
    }
    if (image) {
      const imageError = notificationImageError(image);
      if (imageError) {
        setError(t(`notifications.errors.${imageError}`));
        return;
      }
    }
    if (!user) {
      setError(t("notifications.errors.save"));
      return;
    }

    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      let imageUrl: string | null = imageRemoved ? null : existingImageUrl;
      if (image) {
        const uploaded = await uploadNotificationImage(user.id, image);
        if (!uploaded.ok) {
          setError(t(uploaded.message === "SUPABASE_NOT_CONFIGURED" ? "notifications.errors.unconfigured" : "notifications.errors.upload"));
          return;
        }
        imageUrl = uploaded.url;
        uploadedPath = uploaded.path;
      }

      const resolvedLink = resolveNotificationLink(link);
      const payload = {
        title,
        description,
        linkUrl: resolvedLink?.href ?? null,
        imageUrl,
        startsAt: windowResult.startsAt,
        expiresAt: windowResult.expiresAt,
        highlighted,
      };
      const sent = editing && id ? await updateSiteNotification({ ...payload, id }) : await sendSiteNotification(payload);
      if (!sent.ok) {
        if (uploadedPath) await removeNotificationImage(uploadedPath);
        setError(
          t(
            sent.message === "SUPABASE_NOT_CONFIGURED"
              ? "notifications.errors.unconfigured"
              : editing
                ? "notifications.errors.update"
                : "notifications.errors.save",
          ),
        );
        return;
      }

      const previousPath = notificationImageStoragePath(existingImageUrl);
      if (previousPath && imageUrl !== existingImageUrl) await removeNotificationImage(previousPath);

      if (editing) {
        showToast(t("notifications.updated"));
        void refresh();
        navigate(localeNotificationManagePath(locale));
        return;
      }

      setTitle("");
      setDescription("");
      setLink("");
      setMode("now");
      setStartsAtLocal("");
      setExpiresAtLocal(defaultExpiresLocal());
      setImage(null);
      setImageKey((current) => current + 1);
      setHighlighted(false);
      showToast(t("notifications.sent"));
      void refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={t(editing ? "notifications.editTitle" : "notifications.composeTitle")}
        description={t(editing ? "notifications.editDescription" : "notifications.composeDescription")}
        className="mb-4"
      />
      <Link
        to={localeNotificationManagePath(locale)}
        className="mb-6 inline-block text-sm text-zinc-400 underline-offset-2 hover:text-amber-100 hover:underline"
      >
        {t("notifications.manageMenu")}
      </Link>

      {!configured ? <p className="text-sm text-zinc-400">{t("notifications.errors.unconfigured")}</p> : null}
      {configured && (status === "loading" || (status === "authenticated" && profileLoadState !== "ready")) ? (
        <p className="text-sm text-zinc-400">{t("notifications.loading")}</p>
      ) : null}
      {configured && status !== "loading" && profileLoadState !== "loading" && !canSend ? (
        <p className="text-sm text-zinc-400">{t("notifications.forbidden")}</p>
      ) : null}

      {canSend && editing && !itemReady && !error ? <p className="text-sm text-zinc-400">{t("notifications.loading")}</p> : null}

      {canSend && itemReady ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
          <label className="block text-sm">
            <span className="text-zinc-400">{t("notifications.fieldTitle")}</span>
            <input
              type="text"
              required
              maxLength={NOTIFICATION_TITLE_MAX}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-400">{t("notifications.fieldDescription")}</span>
            <textarea
              required
              rows={5}
              maxLength={NOTIFICATION_DESCRIPTION_MAX}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={cn(inputClass, "resize-y")}
            />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-400">{t("notifications.fieldLink")}</span>
            <input
              type="text"
              maxLength={NOTIFICATION_LINK_MAX}
              value={link}
              placeholder={t("notifications.fieldLinkHint")}
              onChange={(event) => setLink(event.target.value)}
              className={inputClass}
            />
          </label>

          <div className="text-sm">
            <span className="text-zinc-400">{t("notifications.fieldImage")}</span>
            <p className="mt-0.5 text-xs text-zinc-500">{t("notifications.fieldImageHint")}</p>
            <input
              key={imageKey}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              className={cn(inputClass, "file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-xs file:text-zinc-200")}
            />
            {previewUrl || (!imageRemoved && existingImageUrl) ? (
              <div className="mt-2">
                <img
                  src={previewUrl ?? existingImageUrl ?? ""}
                  alt=""
                  className="max-h-40 rounded-lg border border-aom-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImageRemoved(true);
                    setImageKey((current) => current + 1);
                  }}
                  className="mt-2 text-xs text-zinc-400 underline-offset-2 hover:text-amber-100 hover:underline"
                >
                  {t("notifications.removeImage")}
                </button>
              </div>
            ) : null}
          </div>

          <label className="flex items-start gap-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={highlighted}
              onChange={(event) => setHighlighted(event.target.checked)}
              className="mt-0.5 accent-amber-400"
            />
            <span>
              <span className="font-medium">{t("notifications.highlight")}</span>
              <span className="mt-0.5 block text-xs text-zinc-500">{t("notifications.highlightHint")}</span>
            </span>
          </label>

          <fieldset className="text-sm">
            <legend className="text-zinc-400">{t("notifications.when")}</legend>
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-zinc-200">
                <input
                  type="radio"
                  name="notification-when"
                  checked={mode === "now"}
                  onChange={() => setMode("now")}
                  className="accent-amber-400"
                />
                {t("notifications.immediately")}
              </label>
              <label className="flex items-center gap-2 text-zinc-200">
                <input
                  type="radio"
                  name="notification-when"
                  checked={mode === "schedule"}
                  onChange={() => setMode("schedule")}
                  className="accent-amber-400"
                />
                {t("notifications.schedule")}
              </label>
            </div>
          </fieldset>

          {mode === "schedule" ? (
            <label className="block text-sm">
              <span className="text-zinc-400">{t("notifications.startsAt")}</span>
              <input
                type="datetime-local"
                required
                value={startsAtLocal}
                onChange={(event) => setStartsAtLocal(event.target.value)}
                className={inputClass}
              />
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="text-zinc-400">{t("notifications.expiresAt")}</span>
            <input
              type="datetime-local"
              required
              value={expiresAtLocal}
              onChange={(event) => setExpiresAtLocal(event.target.value)}
              className={inputClass}
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t(editing ? "notifications.saving" : "notifications.sending") : t(editing ? "notifications.save" : "notifications.send")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
