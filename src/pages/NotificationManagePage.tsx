import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
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

const dateInputClass =
  "mt-1 w-full rounded-xl border border-aom-border bg-aom-card px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25";

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

function coversLocalDay(startsAt: string, expiresAt: string, day: string): boolean {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return true;
  const dayStart = new Date(year, month - 1, date).getTime();
  const dayEnd = new Date(year, month - 1, date + 1).getTime();
  const starts = new Date(startsAt).getTime();
  const expires = new Date(expiresAt).getTime();
  return starts < dayEnd && expires > dayStart;
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m13.5 6.5 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 7h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7V5h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 7l1 12h6l1-12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m12 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [titleQuery, setTitleQuery] = useState("");
  const [dateQuery, setDateQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!openMenuId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenuId(null);
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setOpenMenuId(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [openMenuId]);

  const filtered = useMemo(() => {
    const query = titleQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (query && !item.title.toLowerCase().includes(query)) return false;
      if (dateQuery && !coversLocalDay(item.startsAt, item.expiresAt, dateQuery)) return false;
      return true;
    });
  }, [dateQuery, items, titleQuery]);

  async function publishNow(item: SiteNotification) {
    setOpenMenuId(null);
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

  const menuItemClass =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50";

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
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <SearchField
              id="notification-title-filter"
              value={titleQuery}
              onChange={setTitleQuery}
              placeholder={t("notifications.filterTitle")}
              className="relative min-w-0 flex-1"
            />
            <label className="block text-sm sm:w-44">
              <span className="text-zinc-400">{t("notifications.filterDate")}</span>
              <input
                type="date"
                value={dateQuery}
                onChange={(event) => setDateQuery(event.target.value)}
                className={dateInputClass}
              />
            </label>
          </div>

          {filtered.length === 0 ? <p className="text-sm text-zinc-400">{t("notifications.filterEmpty")}</p> : null}

          <ul className="flex flex-col gap-3">
            {filtered.map((item) => {
              const phase = notificationPhase(item.startsAt, item.expiresAt);
              const busy = busyId === item.id;
              const menuOpen = openMenuId === item.id;
              return (
                <li key={item.id} className="rounded-xl border border-aom-border bg-zinc-950/60 p-3">
                  <div className="flex items-start gap-3">
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
                    </div>
                    <div className="relative shrink-0" ref={menuOpen ? menuRef : undefined}>
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-label={t("notifications.actions")}
                        title={t("notifications.actions")}
                        disabled={busy}
                        onClick={() => setOpenMenuId(menuOpen ? null : item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-aom-border text-zinc-300 transition hover:border-amber-500/40 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <circle cx="5" cy="12" r="1.6" />
                          <circle cx="12" cy="12" r="1.6" />
                          <circle cx="19" cy="12" r="1.6" />
                        </svg>
                      </button>
                      {menuOpen ? (
                        <div
                          role="menu"
                          className="absolute right-0 top-11 z-30 min-w-44 overflow-hidden rounded-xl border border-aom-border bg-zinc-950 py-1 shadow-xl shadow-black/40"
                        >
                          <Link
                            role="menuitem"
                            to={localeNotificationComposePath(locale, item.id)}
                            className={menuItemClass}
                            onClick={() => setOpenMenuId(null)}
                          >
                            <PencilIcon />
                            {t("notifications.edit")}
                          </Link>
                          {phase === "scheduled" ? (
                            <button
                              type="button"
                              role="menuitem"
                              className={menuItemClass}
                              disabled={busy}
                              onClick={() => void publishNow(item)}
                            >
                              <SendIcon />
                              {t("notifications.publishNow")}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            role="menuitem"
                            className={cn(menuItemClass, "text-red-300 hover:text-red-200")}
                            disabled={busy}
                            onClick={() => {
                              setOpenMenuId(null);
                              setConfirmDeleteId(item.id);
                            }}
                          >
                            <TrashIcon />
                            {t("notifications.delete")}
                          </button>
                        </div>
                      ) : null}
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
        </>
      ) : null}
    </div>
  );
}
