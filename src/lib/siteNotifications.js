export const NOTIFICATION_READS_KEY = "aprendendo-age.notification-reads";
export const NOTIFICATION_BELL_SEEN_KEY = "aprendendo-age.notification-bell-seen";
export const NOTIFICATION_TICKER_COLLAPSED_KEY = "aprendendo-age.notification-ticker-collapsed";
export const NOTIFICATION_TICKER_LIMIT = 3;
export const NOTIFICATION_PREVIEW_LIMIT = 10;
export const NOTIFICATION_HISTORY_PAGE_SIZE = 15;
export const NOTIFICATION_TITLE_MAX = 120;
export const NOTIFICATION_DESCRIPTION_MAX = 2000;
export const NOTIFICATION_LINK_MAX = 500;
export const NOTIFICATION_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const MAX_STORED_READS = 400;
const SCHEDULE_GRACE_MS = 60_000;
const IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};
export function parseStoredReadIds(raw) {
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((id) => typeof id === "string" && id.length > 0).slice(-MAX_STORED_READS);
    }
    catch {
        return [];
    }
}
export function mergeReadIds(current, incoming) {
    if (incoming.length === 0)
        return current;
    const next = new Set(current);
    let changed = false;
    for (const id of incoming) {
        if (!id || next.has(id))
            continue;
        next.add(id);
        changed = true;
    }
    if (!changed)
        return current;
    return [...next].slice(-MAX_STORED_READS);
}
const SITE_HOSTS = new Set(["www.aprendendoage.com", "aprendendoage.com"]);
export function resolveNotificationLink(raw) {
    if (!raw)
        return null;
    const href = raw.trim();
    if (!href || href.length > NOTIFICATION_LINK_MAX || /[\s\\]/.test(href))
        return null;
    if (href.startsWith("/") && !href.startsWith("//"))
        return { href, kind: "internal" };
    try {
        const url = new URL(href);
        if (url.protocol !== "http:" && url.protocol !== "https:")
            return null;
        if (SITE_HOSTS.has(url.hostname)) {
            return { href: `${url.pathname}${url.search}${url.hash}`, kind: "internal" };
        }
        return { href, kind: "external" };
    }
    catch {
        return null;
    }
}
export function notificationTextError(title, description, link) {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLink = link.trim();
    if (!trimmedTitle || trimmedTitle.length > NOTIFICATION_TITLE_MAX)
        return "title";
    if (!trimmedDescription || trimmedDescription.length > NOTIFICATION_DESCRIPTION_MAX)
        return "description";
    if (trimmedLink && !resolveNotificationLink(trimmedLink))
        return "link";
    return null;
}
function parseDatetimeLocal(value) {
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed))
        return null;
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime()))
        return null;
    return date;
}
export function resolveNotificationWindow(input, now = new Date()) {
    const expiresAt = parseDatetimeLocal(input.expiresAtLocal);
    if (!expiresAt)
        return { ok: false, error: "expires" };
    let startsAt;
    if (input.mode === "now") {
        const kept = input.keepStartsAt;
        startsAt = kept && !Number.isNaN(kept.getTime()) ? kept : now;
    }
    else {
        const parsed = parseDatetimeLocal(input.startsAtLocal);
        if (!parsed)
            return { ok: false, error: "schedule" };
        if (parsed.getTime() < now.getTime() - SCHEDULE_GRACE_MS)
            return { ok: false, error: "schedulePast" };
        startsAt = parsed;
    }
    if (expiresAt.getTime() <= startsAt.getTime())
        return { ok: false, error: "expiresOrder" };
    return { ok: true, startsAt, expiresAt };
}
export function notificationImageError(file) {
    if (!IMAGE_TYPES[file.type])
        return "imageType";
    if (file.size > NOTIFICATION_IMAGE_MAX_BYTES)
        return "imageSize";
    return null;
}
export function notificationImageExtension(type) {
    return IMAGE_TYPES[type] ?? null;
}
export function notificationPhase(startsAt, expiresAt, now = Date.now()) {
    const starts = new Date(startsAt).getTime();
    const expires = new Date(expiresAt).getTime();
    if (Number.isNaN(starts) || Number.isNaN(expires))
        return "expired";
    if (starts > now)
        return "scheduled";
    if (expires > now)
        return "active";
    return "expired";
}
export function notificationImageStoragePath(url) {
    if (!url)
        return null;
    const marker = "/object/public/site-notifications/";
    const index = url.indexOf(marker);
    if (index === -1)
        return null;
    const path = (url.slice(index + marker.length).split("?")[0] ?? "").trim();
    if (!path || path.includes("..") || path.startsWith("/"))
        return null;
    try {
        return decodeURIComponent(path);
    }
    catch {
        return null;
    }
}
export function toDatetimeLocalValue(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function formatNotificationTime(iso, locale, now = Date.now()) {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then))
        return "";
    const diffSec = Math.round((then - now) / 1000);
    const abs = Math.abs(diffSec);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (abs < 60)
        return rtf.format(diffSec, "second");
    if (abs < 3600)
        return rtf.format(Math.round(diffSec / 60), "minute");
    if (abs < 86400)
        return rtf.format(Math.round(diffSec / 3600), "hour");
    if (abs < 86400 * 30)
        return rtf.format(Math.round(diffSec / 86400), "day");
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(then);
}
