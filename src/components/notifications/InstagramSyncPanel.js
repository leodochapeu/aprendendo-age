import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { ModalApp } from "@/components/ui/ModalApp";
import { useAuth } from "@/context/AuthContext";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { localeToHtmlLang } from "@/lib/locale";
import { parseInstagramUsername } from "@/lib/instagramSync";
import { addInstagramSyncChannel, fetchInstagramSyncChannels, fetchInstagramSyncSettings, previewInstagramPosts, publishInstagramPosts, removeInstagramSyncChannel, saveInstagramSyncSettings, } from "@/lib/instagramSyncApi";
const fieldClass = "mt-1 w-full rounded-xl border border-aom-border bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25";
function todayInputValue() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
export function InstagramSyncPanel({ onPublished }) {
    const { t, locale } = useTranslation();
    const { showToast } = useToast();
    const { refresh } = useSiteNotifications();
    const { user } = useAuth();
    const localeTag = localeToHtmlLang(locale);
    const today = useMemo(todayInputValue, []);
    const [enabled, setEnabled] = useState(false);
    const [runTime, setRunTime] = useState("09:00");
    const [lastRunAt, setLastRunAt] = useState(null);
    const [lastRunCount, setLastRunCount] = useState(null);
    const [lastRunMessage, setLastRunMessage] = useState(null);
    const [channels, setChannels] = useState([]);
    const [channelDraft, setChannelDraft] = useState("");
    const [draftChannels, setDraftChannels] = useState([]);
    const [showChannelInput, setShowChannelInput] = useState(false);
    const [pendingRemoveId, setPendingRemoveId] = useState(null);
    const [ready, setReady] = useState(false);
    const [saving, setSaving] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [channelsOpen, setChannelsOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [posts, setPosts] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [searching, setSearching] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [modalError, setModalError] = useState(null);
    useEffect(() => {
        let cancel = false;
        void Promise.all([fetchInstagramSyncSettings(), fetchInstagramSyncChannels()]).then(([settings, nextChannels]) => {
            if (cancel)
                return;
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
        if (!user)
            return;
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
    const outlineButton = "rounded-lg border border-amber-500/45 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25";
    const lastRun = lastRunAt
        ? t("notifications.instagramLastRun", {
            when: new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(lastRunAt)),
            count: lastRunCount ?? 0,
            message: lastRunMessage ?? "",
        })
        : t("notifications.instagramLastRunNever");
    return (_jsxs("section", { className: "mb-6 rounded-xl border border-aom-border bg-zinc-950/60 p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-amber-100", children: t("notifications.instagramTitle") }), _jsx("p", { className: "mt-1 max-w-2xl text-sm text-zinc-400", children: t("notifications.instagramDescription") })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: openModal, className: outlineButton, children: t("notifications.instagramSyncNow") }), _jsx("button", { type: "button", onClick: () => setScheduleOpen(true), className: outlineButton, children: t("notifications.instagramSchedule") }), _jsx("button", { type: "button", onClick: openChannels, className: outlineButton, children: t("notifications.instagramTargetChannels") })] })] }), _jsx("p", { className: "mt-3 text-xs text-zinc-500", children: lastRun }), _jsxs(ModalApp, { open: scheduleOpen, onClose: () => setScheduleOpen(false), title: t("notifications.instagramSchedule"), children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-zinc-200", children: [_jsx("input", { type: "checkbox", checked: enabled, onChange: (event) => setEnabled(event.target.checked), className: "accent-amber-400" }), t("notifications.instagramEnabled")] }), _jsxs("label", { className: "block max-w-xs text-sm", children: [_jsx("span", { className: "text-zinc-400", children: t("notifications.instagramRunTime") }), _jsx("input", { type: "time", value: runTime, onChange: (event) => setRunTime(event.target.value), className: fieldClass })] }), _jsx("button", { type: "button", onClick: () => void save(), disabled: !ready || saving || !user, className: "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50", children: saving ? t("notifications.instagramSaving") : t("notifications.instagramSave") })] }), _jsxs(ModalApp, { open: channelsOpen, onClose: () => setChannelsOpen(false), title: t("notifications.instagramTargetChannels"), children: [_jsx("ul", { className: "flex flex-wrap gap-2", children: draftChannels.map((channel) => (_jsxs("li", { className: "flex items-center gap-2 rounded-full border border-aom-border bg-zinc-900/80 px-3 py-1 text-sm text-zinc-100", children: ["@", channel.username, _jsx("button", { type: "button", onClick: () => setPendingRemoveId(channel.id), className: "text-zinc-400 hover:text-red-200", "aria-label": t("notifications.delete"), children: "\u00D7" })] }, channel.id))) }), pendingRemove ? (_jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2", children: [_jsx("p", { className: "text-sm text-red-100", children: t("notifications.instagramRemoveConfirm", { username: pendingRemove.username }) }), _jsx("button", { type: "button", onClick: () => {
                                    setDraftChannels((current) => current.filter((item) => item.id !== pendingRemove.id));
                                    setPendingRemoveId(null);
                                }, className: "rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-red-400", children: t("notifications.delete") }), _jsx("button", { type: "button", onClick: () => setPendingRemoveId(null), className: "text-xs text-zinc-300 hover:text-white", children: t("notifications.cancel") })] })) : null, showChannelInput ? (_jsx("input", { value: channelDraft, onChange: (event) => setChannelDraft(event.target.value), onKeyDown: (event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                stageChannel();
                            }
                            if (event.key === "Escape") {
                                event.preventDefault();
                                event.stopPropagation();
                                cancelChannelInput();
                            }
                        }, placeholder: t("notifications.instagramChannelPlaceholder"), className: fieldClass, autoFocus: true })) : null, _jsxs("div", { className: "flex flex-wrap gap-3", children: [showChannelInput ? (_jsx("button", { type: "button", onClick: cancelChannelInput, className: outlineButton, children: t("notifications.cancel") })) : (_jsx("button", { type: "button", onClick: () => setShowChannelInput(true), className: outlineButton, children: t("notifications.instagramAddChannel") })), _jsx("button", { type: "button", onClick: () => void saveChannels(), disabled: saving, className: "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50", children: saving ? t("notifications.instagramSaving") : t("notifications.instagramSave") })] })] }), _jsxs(ModalApp, { open: open, onClose: () => setOpen(false), title: t("notifications.instagramModalTitle"), description: t("notifications.instagramModalDescription"), children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end", children: [_jsxs("label", { className: "block flex-1 text-sm", children: [_jsx("span", { className: "text-zinc-400", children: t("notifications.instagramFrom") }), _jsx("input", { type: "date", value: from, onChange: (event) => setFrom(event.target.value), className: fieldClass })] }), _jsxs("label", { className: "block flex-1 text-sm", children: [_jsx("span", { className: "text-zinc-400", children: t("notifications.instagramTo") }), _jsx("input", { type: "date", value: to, onChange: (event) => setTo(event.target.value), className: fieldClass })] }), _jsx("button", { type: "button", onClick: () => void search(), disabled: searching, className: "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50", children: searching ? t("notifications.instagramSearching") : t("notifications.instagramSearch") })] }), modalError ? _jsx("p", { className: "text-sm text-red-200", children: modalError }) : null, posts ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm text-zinc-300", children: t("notifications.instagramFound", { count: posts.length }) }), posts.length === 0 ? _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.instagramNone") }) : null, freshCount > 0 ? (_jsxs("label", { className: "flex items-center gap-2 text-sm text-zinc-200", children: [_jsx("input", { type: "checkbox", checked: Boolean(allFreshSelected), onChange: (event) => {
                                            setSelected(event.target.checked ? new Set(posts.filter((post) => !post.alreadyImported).map((post) => post.externalId)) : new Set());
                                        }, className: "accent-amber-400" }), t("notifications.instagramSelectAll")] })) : null, _jsx("ul", { className: "flex flex-col gap-2", children: posts.map((post) => (_jsxs("li", { className: "flex items-start gap-3 rounded-xl border border-aom-border bg-zinc-900/50 p-3", children: [_jsx("input", { type: "checkbox", className: "mt-1 accent-amber-400", checked: selected.has(post.externalId), disabled: post.alreadyImported, onChange: (event) => {
                                                setSelected((current) => {
                                                    const next = new Set(current);
                                                    if (event.target.checked)
                                                        next.add(post.externalId);
                                                    else
                                                        next.delete(post.externalId);
                                                    return next;
                                                });
                                            } }), post.imageUrl ? _jsx("img", { src: post.imageUrl, alt: "", className: "h-14 w-14 shrink-0 rounded-lg object-cover" }) : null, _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "line-clamp-3 text-sm text-zinc-200", children: post.caption || `@${post.username}` }), _jsxs("p", { className: "mt-1 text-xs text-zinc-500", children: ["@", post.username, " · ", new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(new Date(post.timestamp)), post.alreadyImported ? ` · ${t("notifications.instagramAlready")}` : ""] })] })] }, post.externalId))) }), _jsx("button", { type: "button", onClick: () => void publish(), disabled: publishing || selected.size === 0, className: "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50", children: publishing ? t("notifications.instagramPublishing") : t("notifications.instagramPublish") })] })) : null] })] }));
}
