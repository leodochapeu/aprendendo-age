import { useEffect, useMemo, useState } from "react";

import { ModalApp } from "@/components/ui/ModalApp";
import { useAuth } from "@/context/AuthContext";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { localeToHtmlLang } from "@/lib/locale";
import { parseInstagramUsername } from "@/lib/instagramSync";
import {
  addInstagramSyncChannel,
  fetchInstagramSyncChannels,
  fetchInstagramSyncSettings,
  previewInstagramPosts,
  publishInstagramPosts,
  removeInstagramSyncChannel,
  saveInstagramSyncSettings,
  type InstagramSyncChannel,
  type InstagramSyncPost,
} from "@/lib/instagramSyncApi";

const fieldClass =
  "mt-1 w-full rounded-xl border border-aom-border bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25";

function todayInputValue(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function InstagramSyncPanel({ onPublished }: { onPublished: () => void }) {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const { refresh } = useSiteNotifications();
  const { user } = useAuth();
  const localeTag = localeToHtmlLang(locale);
  const today = useMemo(todayInputValue, []);

  const [enabled, setEnabled] = useState(false);
  const [runTime, setRunTime] = useState("09:00");
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [lastRunCount, setLastRunCount] = useState<number | null>(null);
  const [lastRunMessage, setLastRunMessage] = useState<string | null>(null);
  const [channels, setChannels] = useState<InstagramSyncChannel[]>([]);
  const [channelDraft, setChannelDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [posts, setPosts] = useState<InstagramSyncPost[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    void Promise.all([fetchInstagramSyncSettings(), fetchInstagramSyncChannels()]).then(([settings, nextChannels]) => {
      if (cancel) return;
      if (settings) {
        setEnabled(settings.enabled);
        setRunTime(settings.runTime);
        setLastRunAt(settings.lastRunAt);
        setLastRunCount(settings.lastRunCount);
        setLastRunMessage(settings.lastRunMessage);
      }
      setChannels(nextChannels);
      setReady(true);
    });
    return () => {
      cancel = true;
    };
  }, []);

  async function save() {
    if (!user) return;
    setSaving(true);
    const ok = await saveInstagramSyncSettings({ enabled, runTime, userId: user.id });
    setSaving(false);
    showToast(ok ? t("notifications.instagramSaved") : t("notifications.loadError"));
  }

  async function addChannel() {
    const username = parseInstagramUsername(channelDraft);
    if (!username) {
      showToast(t("notifications.instagramInvalidChannel"));
      return;
    }
    const ok = await addInstagramSyncChannel(username);
    if (!ok) {
      showToast(t("notifications.loadError"));
      return;
    }
    setChannelDraft("");
    setChannels(await fetchInstagramSyncChannels());
    showToast(t("notifications.instagramChannelSaved"));
  }

  async function removeChannel(id: string) {
    const ok = await removeInstagramSyncChannel(id);
    if (!ok) {
      showToast(t("notifications.loadError"));
      return;
    }
    setChannels(await fetchInstagramSyncChannels());
    showToast(t("notifications.instagramChannelRemoved"));
  }

  function openModal() {
    setFrom(today);
    setTo(today);
    setPosts(null);
    setSelected(new Set());
    setModalError(null);
    setOpen(true);
  }

  async function search() {
    if (from > to) {
      setModalError(t("notifications.instagramInvalidRange"));
      return;
    }
    setSearching(true);
    setModalError(null);
    setPosts(null);
    const result = await previewInstagramPosts(from, to);
    setSearching(false);
    if (!result.ok) {
      setModalError(result.message);
      return;
    }
    setPosts(result.posts);
    setSelected(new Set(result.posts.filter((post) => !post.alreadyImported).map((post) => post.externalId)));
  }

  async function publish() {
    setPublishing(true);
    setModalError(null);
    const result = await publishInstagramPosts(from, to, [...selected]);
    setPublishing(false);
    if (!result.ok) {
      setModalError(result.message);
      return;
    }
    showToast(t("notifications.instagramPublished", { count: result.published }));
    setOpen(false);
    void refresh();
    onPublished();
    const settings = await fetchInstagramSyncSettings();
    if (settings) {
      setLastRunAt(settings.lastRunAt);
      setLastRunCount(settings.lastRunCount);
      setLastRunMessage(settings.lastRunMessage);
    }
  }

  const freshCount = posts?.filter((post) => !post.alreadyImported).length ?? 0;
  const allFreshSelected = freshCount > 0 && posts?.every((post) => post.alreadyImported || selected.has(post.externalId));

  const lastRun = lastRunAt
    ? t("notifications.instagramLastRun", {
        when: new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(lastRunAt)),
        count: lastRunCount ?? 0,
        message: lastRunMessage ?? "",
      })
    : t("notifications.instagramLastRunNever");

  return (
    <section className="mb-6 rounded-xl border border-aom-border bg-zinc-950/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-amber-100">
            {t("notifications.instagramTitle")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">{t("notifications.instagramDescription")}</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="rounded-lg border border-amber-500/45 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25"
        >
          {t("notifications.instagramSyncNow")}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="accent-amber-400"
          />
          {t("notifications.instagramEnabled")}
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">{t("notifications.instagramRunTime")}</span>
          <input type="time" value={runTime} onChange={(event) => setRunTime(event.target.value)} className={fieldClass} />
        </label>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!ready || saving || !user}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? t("notifications.instagramSaving") : t("notifications.instagramSave")}
        </button>
      </div>

      <div className="mt-4">
        <p className="text-sm text-zinc-400">{t("notifications.instagramChannels")}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {channels.map((channel) => (
            <li key={channel.id} className="flex items-center gap-2 rounded-full border border-aom-border bg-zinc-900/80 px-3 py-1 text-sm text-zinc-100">
              @{channel.username}
              <button type="button" onClick={() => void removeChannel(channel.id)} className="text-zinc-400 hover:text-red-200" aria-label={t("notifications.delete")}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={channelDraft}
            onChange={(event) => setChannelDraft(event.target.value)}
            placeholder={t("notifications.instagramChannelPlaceholder")}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => void addChannel()}
            className="rounded-lg border border-aom-border px-4 py-2 text-sm text-zinc-100 hover:border-amber-500/40"
          >
            {t("notifications.instagramAddChannel")}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">{lastRun}</p>

      <ModalApp open={open} onClose={() => setOpen(false)} title={t("notifications.instagramModalTitle")} description={t("notifications.instagramModalDescription")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm">
            <span className="text-zinc-400">{t("notifications.instagramFrom")}</span>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={fieldClass} />
          </label>
          <label className="block flex-1 text-sm">
            <span className="text-zinc-400">{t("notifications.instagramTo")}</span>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={fieldClass} />
          </label>
          <button
            type="button"
            onClick={() => void search()}
            disabled={searching}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {searching ? t("notifications.instagramSearching") : t("notifications.instagramSearch")}
          </button>
        </div>

        {modalError ? <p className="text-sm text-red-200">{modalError}</p> : null}

        {posts ? (
          <>
            <p className="text-sm text-zinc-300">{t("notifications.instagramFound", { count: posts.length })}</p>
            {posts.length === 0 ? <p className="text-sm text-zinc-400">{t("notifications.instagramNone")}</p> : null}
            {freshCount > 0 ? (
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={Boolean(allFreshSelected)}
                  onChange={(event) => {
                    setSelected(event.target.checked ? new Set(posts.filter((post) => !post.alreadyImported).map((post) => post.externalId)) : new Set());
                  }}
                  className="accent-amber-400"
                />
                {t("notifications.instagramSelectAll")}
              </label>
            ) : null}
            <ul className="flex flex-col gap-2">
              {posts.map((post) => (
                <li key={post.externalId} className="flex items-start gap-3 rounded-xl border border-aom-border bg-zinc-900/50 p-3">
                  <input
                    type="checkbox"
                    className="mt-1 accent-amber-400"
                    checked={selected.has(post.externalId)}
                    disabled={post.alreadyImported}
                    onChange={(event) => {
                      setSelected((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(post.externalId);
                        else next.delete(post.externalId);
                        return next;
                      });
                    }}
                  />
                  {post.imageUrl ? <img src={post.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-3 text-sm text-zinc-200">{post.caption || `@${post.username}`}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      @{post.username}
                      {" · "}
                      {new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(post.timestamp))}
                      {post.alreadyImported ? ` · ${t("notifications.instagramAlready")}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void publish()}
              disabled={publishing || selected.size === 0}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {publishing ? t("notifications.instagramPublishing") : t("notifications.instagramPublish")}
            </button>
          </>
        ) : null}
      </ModalApp>
    </section>
  );
}
