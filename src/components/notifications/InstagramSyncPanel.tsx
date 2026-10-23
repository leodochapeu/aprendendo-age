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
  const [draftChannels, setDraftChannels] = useState<InstagramSyncChannel[]>([]);
  const [showChannelInput, setShowChannelInput] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(false);

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
    if (!ok) {
      showToast(t("notifications.loadError"));
      return;
    }
    showToast(t("notifications.instagramSaved"));
    setScheduleOpen(false);
  }

  function openChannels() {
    setDraftChannels(channels);
    setChannelDraft("");
    setShowChannelInput(false);
    setPendingRemoveId(null);
    setChannelsOpen(true);
  }

  function cancelChannelInput() {
    setChannelDraft("");
    setShowChannelInput(false);
  }

  function stageChannel() {
    const username = parseInstagramUsername(channelDraft);
    if (!username) {
      showToast(t("notifications.instagramInvalidChannel"));
      return;
    }
    if (draftChannels.some((channel) => channel.username === username)) {
      setChannelDraft("");
      setShowChannelInput(false);
      return;
    }
    setDraftChannels((current) => [...current, { id: `new:${username}`, username }]);
    setChannelDraft("");
    setShowChannelInput(false);
  }

  async function saveChannels() {
    const pending = channelDraft.trim() ? parseInstagramUsername(channelDraft) : null;
    if (channelDraft.trim() && !pending) {
      showToast(t("notifications.instagramInvalidChannel"));
      return;
    }
    const next = pending && !draftChannels.some((channel) => channel.username === pending)
      ? [...draftChannels, { id: `new:${pending}`, username: pending }]
      : draftChannels;
    setSaving(true);
    const removed = channels.filter((channel) => !next.some((item) => item.id === channel.id));
    const added = next.filter((channel) => channel.id.startsWith("new:"));
    const results = await Promise.all([
      ...removed.map((channel) => removeInstagramSyncChannel(channel.id)),
      ...added.map((channel) => addInstagramSyncChannel(channel.username)),
    ]);
    const fresh = await fetchInstagramSyncChannels();
    setChannels(fresh);
    setSaving(false);
    if (results.some((ok) => !ok)) {
      showToast(t("notifications.loadError"));
      setDraftChannels(fresh);
      return;
    }
    showToast(t("notifications.instagramSaved"));
    setChannelsOpen(false);
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

  const pendingRemove = draftChannels.find((channel) => channel.id === pendingRemoveId) ?? null;
  const freshCount = posts?.filter((post) => !post.alreadyImported).length ?? 0;
  const allFreshSelected = freshCount > 0 && posts?.every((post) => post.alreadyImported || selected.has(post.externalId));

  const outlineButton =
    "rounded-lg border border-amber-500/45 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25";

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
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openModal} className={outlineButton}>
            {t("notifications.instagramSyncNow")}
          </button>
          <button type="button" onClick={() => setScheduleOpen(true)} className={outlineButton}>
            {t("notifications.instagramSchedule")}
          </button>
          <button type="button" onClick={openChannels} className={outlineButton}>
            {t("notifications.instagramTargetChannels")}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">{lastRun}</p>

      <ModalApp open={scheduleOpen} onClose={() => setScheduleOpen(false)} title={t("notifications.instagramSchedule")}>
        <label className="flex items-center gap-2 text-sm text-zinc-200">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="accent-amber-400" />
          {t("notifications.instagramEnabled")}
        </label>
        <label className="block max-w-xs text-sm">
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
      </ModalApp>

      <ModalApp open={channelsOpen} onClose={() => setChannelsOpen(false)} title={t("notifications.instagramTargetChannels")}>
        <ul className="flex flex-wrap gap-2">
          {draftChannels.map((channel) => (
            <li key={channel.id} className="flex items-center gap-2 rounded-full border border-aom-border bg-zinc-900/80 px-3 py-1 text-sm text-zinc-100">
              @{channel.username}
              <button
                type="button"
                onClick={() => setPendingRemoveId(channel.id)}
                className="text-zinc-400 hover:text-red-200"
                aria-label={t("notifications.delete")}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        {pendingRemove ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
            <p className="text-sm text-red-100">
              {t("notifications.instagramRemoveConfirm", { username: pendingRemove.username })}
            </p>
            <button
              type="button"
              onClick={() => {
                setDraftChannels((current) => current.filter((item) => item.id !== pendingRemove.id));
                setPendingRemoveId(null);
              }}
              className="rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-red-400"
            >
              {t("notifications.delete")}
            </button>
            <button
              type="button"
              onClick={() => setPendingRemoveId(null)}
              className="text-xs text-zinc-300 hover:text-white"
            >
              {t("notifications.cancel")}
            </button>
          </div>
        ) : null}
        {showChannelInput ? (
          <input
            value={channelDraft}
            onChange={(event) => setChannelDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                stageChannel();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                cancelChannelInput();
              }
            }}
            placeholder={t("notifications.instagramChannelPlaceholder")}
            className={fieldClass}
            autoFocus
          />
        ) : null}
        <div className="flex flex-wrap gap-3">
          {showChannelInput ? (
            <button type="button" onClick={cancelChannelInput} className={outlineButton}>
              {t("notifications.cancel")}
            </button>
          ) : (
            <button type="button" onClick={() => setShowChannelInput(true)} className={outlineButton}>
              {t("notifications.instagramAddChannel")}
            </button>
          )}
          <button
            type="button"
            onClick={() => void saveChannels()}
            disabled={saving}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? t("notifications.instagramSaving") : t("notifications.instagramSave")}
          </button>
        </div>
      </ModalApp>

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
