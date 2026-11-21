import { fetchYouTubeChannelMetadata, YouTubeApiNotConfiguredError, YouTubeChannelNotFoundError, } from "@/lib/youtubeVideoMetadata";
export class ChannelMetadataNotFoundError extends Error {
    constructor() {
        super("CHANNEL_METADATA_NOT_FOUND");
        this.name = "ChannelMetadataNotFoundError";
    }
}
function siteDomain(url) {
    try {
        return new URL(url.trim()).hostname.replace(/^www\./, "");
    }
    catch {
        return null;
    }
}
import { parseTwitchLogin as parseTwitchLoginFromUrl } from "@/lib/channelPlatform";
function parseDiscordInviteCode(url) {
    try {
        const parsed = new URL(url.trim());
        const host = parsed.hostname.replace(/^www\./, "");
        if (host === "discord.gg")
            return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
        if (host === "discord.com" && parsed.pathname.startsWith("/invite/")) {
            return parsed.pathname.split("/").filter(Boolean)[1] ?? null;
        }
        return null;
    }
    catch {
        return null;
    }
}
function parseInstagramUsername(url) {
    try {
        const parsed = new URL(url.trim());
        if (parsed.hostname.replace(/^www\./, "") !== "instagram.com")
            return null;
        const segment = parsed.pathname.split("/").filter(Boolean)[0];
        if (!segment || ["p", "reel", "stories"].includes(segment))
            return null;
        return segment.replace(/^@/, "");
    }
    catch {
        return null;
    }
}
function guildIconUrl(guildId, iconHash, size = 128) {
    const ext = iconHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${ext}?size=${size}`;
}
async function fetchUnavatarImage(service, identifier) {
    const res = await fetch(`https://unavatar.io/${service}/${encodeURIComponent(identifier)}?json`);
    if (!res.ok)
        throw new ChannelMetadataNotFoundError();
    const json = (await res.json());
    if (!json.url?.startsWith("http"))
        throw new ChannelMetadataNotFoundError();
    return json.url;
}
async function fetchTwitchMetadata(urlLink) {
    const login = parseTwitchLoginFromUrl(urlLink);
    if (!login)
        throw new ChannelMetadataNotFoundError();
    try {
        const decapi = await fetch(`https://decapi.me/twitch/avatar/${encodeURIComponent(login)}`);
        if (decapi.ok) {
            const text = (await decapi.text()).trim();
            if (text.startsWith("http")) {
                return { urlLink: `https://www.twitch.tv/${login}`, imagePath: text };
            }
        }
    }
    catch {
        /* fallback abaixo */
    }
    const imagePath = await fetchUnavatarImage("twitch", login);
    return { urlLink: `https://www.twitch.tv/${login}`, imagePath };
}
async function fetchDiscordMetadata(urlLink) {
    const code = parseDiscordInviteCode(urlLink);
    if (!code)
        throw new ChannelMetadataNotFoundError();
    const res = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=false`);
    if (!res.ok)
        throw new ChannelMetadataNotFoundError();
    const json = (await res.json());
    const guild = json.guild;
    if (!guild?.id)
        throw new ChannelMetadataNotFoundError();
    return {
        name: guild.name?.trim() || undefined,
        urlLink: `https://discord.gg/${code}`,
        imagePath: guild.icon ? guildIconUrl(guild.id, guild.icon) : "",
    };
}
async function fetchInstagramMetadata(urlLink) {
    const username = parseInstagramUsername(urlLink);
    if (!username)
        throw new ChannelMetadataNotFoundError();
    const imagePath = await fetchUnavatarImage("instagram", username);
    return {
        urlLink: `https://www.instagram.com/${username}`,
        imagePath,
    };
}
function fetchSiteMetadata(urlLink) {
    const domain = siteDomain(urlLink);
    if (!domain)
        throw new ChannelMetadataNotFoundError();
    return {
        imagePath: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
    };
}
async function fetchYoutubeMetadata(urlLink) {
    const meta = await fetchYouTubeChannelMetadata(urlLink);
    return {
        name: meta.name,
        urlLink: meta.urlLink,
        imagePath: meta.imagePath,
    };
}
/** Busca nome/url/imagem conforme a categoria e o link informado. */
export async function fetchChannelLinkMetadata(category, urlLink) {
    const trimmed = urlLink.trim();
    if (!trimmed)
        throw new ChannelMetadataNotFoundError();
    switch (category) {
        case "youtube":
            return fetchYoutubeMetadata(trimmed);
        case "twitch":
            return fetchTwitchMetadata(trimmed);
        case "discord":
            return fetchDiscordMetadata(trimmed);
        case "instagram":
            return fetchInstagramMetadata(trimmed);
        case "whatsapp":
            throw new ChannelMetadataNotFoundError();
        case "site":
            return fetchSiteMetadata(trimmed);
        default:
            throw new ChannelMetadataNotFoundError();
    }
}
export { YouTubeApiNotConfiguredError, YouTubeChannelNotFoundError, ChannelMetadataNotFoundError as ChannelMetadataFetchError, };
