import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { InstagramSyncPanel } from "@/components/notifications/InstagramSyncPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { useAuth } from "@/context/AuthContext";
import { useSiteNotifications } from "@/context/SiteNotificationsContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/hooks/useTranslation";
import { canSendSiteNotification, canSyncInstagram } from "@/lib/auth/constants";
import { cn } from "@/lib/cn";
import { localeToHtmlLang } from "@/lib/locale";
import { localeNotificationComposePath } from "@/lib/localeRoutes";
import { notificationImageStoragePath, notificationPhase } from "@/lib/siteNotifications";
import { deleteSiteNotification, fetchManagedNotifications, publishSiteNotificationNow, removeNotificationImage, } from "@/lib/siteNotificationsApi";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const dateInputClass = "mt-1 w-full rounded-xl border border-aom-border bg-aom-card px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25";
function formatAbsolute(iso, localeTag) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime()))
        return "";
    return new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" }).format(date);
}
function phaseRank(phase) {
    if (phase === "scheduled")
        return 0;
    if (phase === "active")
        return 1;
    return 2;
}
function coversLocalDay(startsAt, expiresAt, day) {
    const [year, month, date] = day.split("-").map(Number);
    if (!year || !month || !date)
        return true;
    const dayStart = new Date(year, month - 1, date).getTime();
    const dayEnd = new Date(year, month - 1, date + 1).getTime();
    const starts = new Date(startsAt).getTime();
    const expires = new Date(expiresAt).getTime();
    return starts < dayEnd && expires > dayStart;
}
function PencilIcon() {
    return (_jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: [_jsx("path", { d: "M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }), _jsx("path", { d: "m13.5 6.5 3 3", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })] }));
}
function TrashIcon() {
    return (_jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: [_jsx("path", { d: "M5 7h14", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), _jsx("path", { d: "M9 7V5h6v2", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }), _jsx("path", { d: "M8 7l1 12h6l1-12", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" })] }));
}
function SendIcon() {
    return (_jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: [_jsx("path", { d: "M4 12h11", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), _jsx("path", { d: "m12 6 6 6-6 6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })] }));
}
export function NotificationManagePage() {
    const { t, locale } = useTranslation();
    const { showToast } = useToast();
    const { refresh } = useSiteNotifications();
    const { status, profile, profileLoadState } = useAuth();
    const configured = isSupabaseConfigured();
    const localeTag = localeToHtmlLang(locale);
    const canManage = configured && status === "authenticated" && profileLoadState === "ready" && canSendSiteNotification(profile?.role);
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [titleQuery, setTitleQuery] = useState("");
    const [dateQuery, setDateQuery] = useState("");
    const menuRef = useRef(null);
    const requestId = useRef(0);
    const load = useCallback(async () => {
        const id = ++requestId.current;
        setRefreshing(true);
        setError(false);
        const result = await fetchManagedNotifications();
        if (id !== requestId.current)
            return;
        setRefreshing(false);
        setLoaded(true);
        if (!result.ok) {
            setError(true);
            return;
        }
        const now = Date.now();
        setItems([...result.items].sort((a, b) => {
            const rank = phaseRank(notificationPhase(a.startsAt, a.expiresAt, now)) - phaseRank(notificationPhase(b.startsAt, b.expiresAt, now));
            if (rank !== 0)
                return rank;
            return b.startsAt.localeCompare(a.startsAt);
        }));
    }, []);
    const didLoad = useRef(false);
    useEffect(() => {
        if (!canManage || didLoad.current)
            return;
        didLoad.current = true;
        void load();
    }, [canManage, load]);
    useEffect(() => {
        if (!openMenuId)
            return;
        const onKey = (event) => {
            if (event.key === "Escape")
                setOpenMenuId(null);
        };
        const onPointerDown = (event) => {
            const target = event.target;
            if (menuRef.current && !menuRef.current.contains(target))
                setOpenMenuId(null);
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
            if (query && !item.title.toLowerCase().includes(query))
                return false;
            if (dateQuery && !coversLocalDay(item.startsAt, item.expiresAt, dateQuery))
                return false;
            return true;
        });
    }, [dateQuery, items, titleQuery]);
    async function publishNow(item) {
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
    async function remove(item) {
        setBusyId(item.id);
        const result = await deleteSiteNotification(item.id);
        setBusyId(null);
        if (!result.ok) {
            showToast(t("notifications.errors.delete"));
            return;
        }
        const path = notificationImageStoragePath(item.imageUrl);
        if (path)
            await removeNotificationImage(path);
        setConfirmDeleteId(null);
        showToast(t("notifications.deleted"));
        void refresh();
        await load();
    }
    const phaseLabel = {
        scheduled: t("notifications.phaseScheduled"),
        active: t("notifications.phaseActive"),
        expired: t("notifications.phaseExpired"),
    };
    const menuItemClass = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50";
    return (_jsxs("div", { className: "mx-auto max-w-3xl", children: [_jsx(PageHeader, { title: t("notifications.manageTitle"), description: t("notifications.manageDescription"), actions: canManage ? (_jsx(Link, { to: localeNotificationComposePath(locale), className: "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400", children: t("notifications.composeMenu") })) : null }), canManage && canSyncInstagram(profile?.role) ? _jsx(InstagramSyncPanel, { onPublished: () => void load() }) : null, !configured ? _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.errors.unconfigured") }) : null, configured && (status === "loading" || (status === "authenticated" && profileLoadState !== "ready")) ? (_jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.loading") })) : null, configured && status !== "loading" && profileLoadState !== "loading" && !canManage ? (_jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.forbidden") })) : null, canManage ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-4 flex flex-col gap-3 sm:flex-row sm:items-end", children: [_jsx(SearchField, { id: "notification-title-filter", value: titleQuery, onChange: setTitleQuery, placeholder: t("notifications.filterTitle"), className: "relative min-w-0 flex-1" }), _jsxs("label", { className: "block text-sm sm:w-44", children: [_jsx("span", { className: "text-zinc-400", children: t("notifications.filterDate") }), _jsx("input", { type: "date", value: dateQuery, onChange: (event) => setDateQuery(event.target.value), className: dateInputClass })] }), _jsx("button", { type: "button", onClick: () => void load(), disabled: refreshing, className: "w-fit shrink-0 rounded-lg border border-amber-500/45 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25 disabled:opacity-50", children: refreshing ? t("notifications.refreshing") : t("notifications.refresh") })] }), !loaded && refreshing ? _jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.loading") }) : null, error ? _jsx("p", { className: "mb-3 text-sm text-red-200", children: t("notifications.loadError") }) : null, loaded && !error && items.length === 0 ? (_jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.manageEmpty") })) : null, items.length > 0 && filtered.length === 0 ? (_jsx("p", { className: "text-sm text-zinc-400", children: t("notifications.filterEmpty") })) : null, _jsx("ul", { className: "flex flex-col gap-3", children: filtered.map((item) => {
                            const phase = notificationPhase(item.startsAt, item.expiresAt);
                            const busy = busyId === item.id;
                            const menuOpen = openMenuId === item.id;
                            return (_jsxs("li", { className: "rounded-xl border border-aom-border bg-zinc-950/60 p-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [item.imageUrl ? (_jsx("img", { src: item.imageUrl, alt: "", className: "h-14 w-14 shrink-0 rounded-lg object-cover" })) : (_jsx("span", { className: "h-14 w-14 shrink-0 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70" })), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h2", { className: "font-[family-name:var(--font-display)] text-sm font-semibold text-amber-50", children: item.title }), _jsx("span", { className: cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", phase === "scheduled" && "bg-amber-500/15 text-amber-200", phase === "active" && "bg-emerald-500/15 text-emerald-200", phase === "expired" && "bg-zinc-800 text-zinc-400"), children: phaseLabel[phase] }), item.highlighted ? (_jsx("span", { className: "rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100/80", children: t("notifications.highlightedBadge") })) : null] }), _jsx("p", { className: "mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400", children: item.description }), _jsxs("p", { className: "mt-1 text-xs text-zinc-500", children: [t("notifications.startsAt"), " ", formatAbsolute(item.startsAt, localeTag), " · ", t("notifications.expiresAt"), " ", formatAbsolute(item.expiresAt, localeTag)] })] }), _jsxs("div", { className: "relative shrink-0", ref: menuOpen ? menuRef : undefined, children: [_jsx("button", { type: "button", "aria-haspopup": "menu", "aria-expanded": menuOpen, "aria-label": t("notifications.actions"), title: t("notifications.actions"), disabled: busy, onClick: () => setOpenMenuId(menuOpen ? null : item.id), className: "flex h-9 w-9 items-center justify-center rounded-full border border-aom-border text-zinc-300 transition hover:border-amber-500/40 hover:bg-zinc-900 hover:text-white disabled:opacity-50", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children: [_jsx("circle", { cx: "5", cy: "12", r: "1.6" }), _jsx("circle", { cx: "12", cy: "12", r: "1.6" }), _jsx("circle", { cx: "19", cy: "12", r: "1.6" })] }) }), menuOpen ? (_jsxs("div", { role: "menu", className: "absolute right-0 top-11 z-30 min-w-44 overflow-hidden rounded-xl border border-aom-border bg-zinc-950 py-1 shadow-xl shadow-black/40", children: [_jsxs(Link, { role: "menuitem", to: localeNotificationComposePath(locale, item.id), className: menuItemClass, onClick: () => setOpenMenuId(null), children: [_jsx(PencilIcon, {}), t("notifications.edit")] }), phase === "scheduled" ? (_jsxs("button", { type: "button", role: "menuitem", className: menuItemClass, disabled: busy, onClick: () => void publishNow(item), children: [_jsx(SendIcon, {}), t("notifications.publishNow")] })) : null, _jsxs("button", { type: "button", role: "menuitem", className: cn(menuItemClass, "text-red-300 hover:text-red-200"), disabled: busy, onClick: () => {
                                                                    setOpenMenuId(null);
                                                                    setConfirmDeleteId(item.id);
                                                                }, children: [_jsx(TrashIcon, {}), t("notifications.delete")] })] })) : null] })] }), confirmDeleteId === item.id ? (_jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2", children: [_jsx("p", { className: "text-sm text-red-100", children: t("notifications.deleteConfirm") }), _jsx("button", { type: "button", disabled: busy, onClick: () => void remove(item), className: "rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-red-400 disabled:opacity-50", children: t("notifications.delete") }), _jsx("button", { type: "button", disabled: busy, onClick: () => setConfirmDeleteId(null), className: "text-xs text-zinc-300 hover:text-white", children: t("notifications.cancel") })] })) : null] }, item.id));
                        }) })] })) : null] }));
}
