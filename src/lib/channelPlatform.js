/** Login Twitch a partir de URL `twitch.tv/{login}`. */
export function parseTwitchLogin(url) {
    try {
        const parsed = new URL(url.trim());
        if (parsed.hostname.replace(/^www\./, "") !== "twitch.tv")
            return null;
        return parsed.pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? null;
    }
    catch {
        return null;
    }
}
/** Handle `@…` ou segmento legacy (`/channel/UC…`, `/c/…`, etc.) a partir da URL YouTube. */
export function parseYouTubeChannelHandle(channelUrl) {
    const trimmed = channelUrl.trim();
    if (!trimmed)
        return null;
    try {
        const url = new URL(trimmed);
        const host = url.hostname.replace(/^www\./, "");
        if (host !== "youtube.com" && host !== "m.youtube.com")
            return null;
        const handleMatch = url.pathname.match(/^\/@([^/]+)/i);
        if (handleMatch?.[1])
            return handleMatch[1];
        const legacyMatch = url.pathname.match(/^\/(?:c|user|channel)\/([^/]+)/i);
        return legacyMatch?.[1] ?? null;
    }
    catch {
        return null;
    }
}
/** `UC…` quando a URL é `/channel/UC…`. */
export function parseYouTubeChannelId(channelUrl) {
    const handle = parseYouTubeChannelHandle(channelUrl);
    if (handle?.startsWith("UC") && handle.length >= 10)
        return handle;
    return null;
}
