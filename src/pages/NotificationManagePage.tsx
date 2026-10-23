import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { canSendSiteNotification } from "@/lib/auth/constants";
import { cn } from "@/lib/cn";
import { localeToHtmlLang } from "@/lib/locale";
import { localeNotificationComposePath } from "@/lib/localeRoutes";
import { notificationImageStoragePath, notificationPhase, type NotificationPhase, type SiteNotification } from "@/lib/siteNotifications";
import {
  deleteSiteNotification,
  fetchManagedNotifications,
  publishSiteNotificationNow,
  removeNotificationImage,
} from "@/lib/siteNotificationsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const actionClass = "text-xs font-medium text-amber-200/90 underline-offset-2 hover:text-amber-100 hover:underline disabled:opacity-50";

function formatAbsolute(iso: string, localeTag: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(date);
}

function phaseRank(phase: NotificationPhase): number {
  if (phase === "scheduled") return 0;
  if (phase === "active") return 1;
  return 2;
}

export function NotificationManagePage() {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const { refresh } = useSiteNotifications();
  const { status, profile, profileLoadState } = useAuth();
  const configured = isSupabaseConfigured();
  const localeTag = localeToHtmlLang(locale);
  const canManage =
    configured && status === "authenticated" && profileLoadState === "ready" && canSendSiteNotification(profile?.role);

  const [items, setItems] = useState<SiteNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const result = await fetchManagedNotifications();
    setLoading(false);
    if (!result.ok) {
      setError(true);
      setItems([]);
      return;
    }
    const now = Date.now();
    setItems(
      [...result.items].sort((a, b) => {
        const rank = phaseRank(notificationPhase(a.startsAt, a.expiresAt, now)) - phaseRank(notificationPhase(b.startsAt, b.expiresAt, now));
        if (rank !== 0) return rank;
        return b.startsAt.localeCompare(a.startsAt);
      }),
    );
  }, []);

  useEffect(() => {
    if (!canManage) return;
    void load();
  }, [canManage, load]);

  async function publishNow(item: SiteNotification) {
    setBusyId(item.id);
    const result = await publishSiteNotificationNow(item.id);
    setBusyId(null);
    if (!result.ok) {
      showToast(t("notifications.errors.publish"));
      return;
    }
    showToast(t("notifications.published"));
    void refresh();
    await load();
  }

  async function remove(item: SiteNotification) {
    setBusyId(item.id);
    const result = await deleteSiteNotification(item.id);
    setBusyId(null);
    if (!result.ok) {
      showToast(t("notifications.errors.delete"));
      return;
    }
    const path = notificationImageStoragePath(item.imageUrl);
    if (path) await removeNotificationImage(path);
    setConfirmDeleteId(null);
    showToast(t("notifications.deleted"));
    void refresh();
    await load();
  }

  const phaseLabel: Record<NotificationPhase, string> = {
    scheduled: t("notifications.phaseScheduled"),
    active: t("notifications.phaseActive"),
    expired: t("notifications.phaseExpired"),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("notifications.manageTitle")}
        description={t("notifications.manageDescription")}
        actions={
          canManage ? (
            <Link
              to={localeNotificationComposePath(locale)}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
            >
              {t("notifications.composeMenu")}
            </Link>
          ) : null
        }
      />

      {!configured ? <p className="text-sm text-zinc-400">{t("notifications.errors.unconfigured")}</p> : null}
      {configured && (status === "loading" || (status === "authenticated" && profileLoadState !== "ready")) ? (
        <p className="text-sm text-zinc-400">{t("notifications.loading")}</p>
      ) : null}
      {configured && status !== "loading" && profileLoadState !== "loading" && !canManage ? (
        <p className="text-sm text-zinc-400">{t("notifications.forbidden")}</p>
      ) : null}

      {canManage && loading ? <p className="text-sm text-zinc-400">{t("notifications.loading")}</p> : null}
      {canManage && !loading && error ? <p className="text-sm text-red-200">{t("notifications.loadError")}</p> : null}
      {canManage && !loading && !error && items.length === 0 ? (
        <p className="text-sm text-zinc-400">{t("notifications.manageEmpty")}</p>
      ) : null}

      {canManage && !loading && !error && items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const phase = notificationPhase(item.startsAt, item.expiresAt);
            const busy = busyId === item.id;
            return (
              <li key={item.id} className="rounded-xl border border-aom-border bg-zinc-950/60 p-3">
                <div className="flex gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="h-14 w-14 shrink-0 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-amber-50">{item.title}</h2>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          phase === "scheduled" && "bg-amber-500/15 text-amber-200",
                          phase === "active" && "bg-emerald-500/15 text-emerald-200",
                          phase === "expired" && "bg-zinc-800 text-zinc-400",
                        )}
                      >
                        {phaseLabel[phase]}
                      </span>
                      {item.highlighted ? (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100/80">
                          {t("notifications.highlightedBadge")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">{item.description}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {t("notifications.startsAt")} {formatAbsolute(item.startsAt, localeTag)}
                      {" · "}
                      {t("notifications.expiresAt")} {formatAbsolute(item.expiresAt, localeTag)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Link to={localeNotificationComposePath(locale, item.id)} className={actionClass}>
                        {t("notifications.edit")}
                      </Link>
                      {phase === "scheduled" ? (
                        <button type="button" className={actionClass} disabled={busy} onClick={() => void publishNow(item)}>
                          {t("notifications.publishNow")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs font-medium text-red-300/90 underline-offset-2 hover:text-red-200 hover:underline disabled:opacity-50"
                        disabled={busy}
                        onClick={() => setConfirmDeleteId(item.id)}
                      >
                        {t("notifications.delete")}
                      </button>
                    </div>
                  </div>
                </div>
                {confirmDeleteId === item.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                    <p className="text-sm text-red-100">{t("notifications.deleteConfirm")}</p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(item)}
                      className="rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-red-400 disabled:opacity-50"
                    >
                      {t("notifications.delete")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-zinc-300 hover:text-white"
                    >
                      {t("notifications.cancel")}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
