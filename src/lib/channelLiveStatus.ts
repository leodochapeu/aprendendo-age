import type { Channel } from "@/data/channels";
import { parseTwitchLogin, parseYouTubeChannelHandle, parseYouTubeChannelId } from "@/lib/channelPlatform";

const CACHE_TTL_MS = 3 * 60 * 1000;
const CONCURRENCY = 5;

type CacheEntry<T> = { value: T; expiresAt: number };

/** Dados da transmissão para o card com print da live. */
export type ChannelLiveSnapshot = {
  title: string | null;
  viewerCount: number | null;
  thumbnailUrl: string | null;
  portraitUrl: string | null;
};

type YouTubeChannelRef = {
  channelId: string;
  uploadsPlaylistId: string;
  portraitUrl: string | null;
};

const twitchSnapshotCache = new Map<string, CacheEntry<ChannelLiveSnapshot | null>>();
const youtubeChannelCache = new Map<string, CacheEntry<YouTubeChannelRef>>();

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = map.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    map.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCache<T>(map: Map<string, CacheEntry<T>>, key: string, value: T): void {
  map.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function getYouTubeApiKey(): string | null {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
  return key?.trim() || null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]!);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/** Resposta do decapi `/twitch/uptime/{login}` — ex.: "2 hours" ou "{login} is offline". */
export function parseTwitchUptimeResponse(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes("offline")) return false;
  return /\d+\s*(second|minute|hour|day)s?/.test(normalized);
}

/** Título da live. Decapi devolve a frase ou "{login} is offline". */
export function parseTwitchTitleResponse(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/is offline/i.test(trimmed)) return null;
  if (/^error\b/i.test(trimmed)) return null;
  return trimmed;
}

/** Contagem de espectadores. Decapi devolve um número ou texto de offline. */
export function parseTwitchViewerCount(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed || /offline/i.test(trimmed)) return null;
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  return Number.isFinite(value) ? value : null;
}

/** URL do avatar. Decapi devolve o link direto ou uma mensagem de erro. */
export function parseTwitchAvatarResponse(text: string): string | null {
  const trimmed = text.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

/** Print público da live na CDN da Twitch. `refreshedAt` troca o cache a cada minuto. */
export function twitchLivePreviewUrl(login: string, refreshedAt = Date.now()): string {
  const safe = login.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const bucket = Math.floor(refreshedAt / 60_000);
  return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${safe}-1280x720.jpg?t=${bucket}`;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function pickYouTubeThumbnail(
  thumbnails: Record<string, { url?: string } | undefined> | undefined,
): string | null {
  if (!thumbnails) return null;
  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    const url = thumbnails[key]?.url;
    if (url) return url;
  }
  return null;
}

async function fetchTwitchLiveSnapshot(channel: Channel): Promise<ChannelLiveSnapshot | null> {
  const login = parseTwitchLogin(channel.urlLink);
  if (!login) return null;

  const cached = getCached(twitchSnapshotCache, login);
  if (cached !== undefined) return cached;

  const uptimeText = await fetchText(`https://decapi.me/twitch/uptime/${encodeURIComponent(login)}`);
  const isLive = uptimeText != null && parseTwitchUptimeResponse(uptimeText);
  if (!isLive) {
    setCache(twitchSnapshotCache, login, null);
    return null;
  }

  const portraitFromChannel = channel.imagePath?.trim() || null;
  const [titleText, viewersText, avatarText] = await Promise.all([
    fetchText(`https://decapi.me/twitch/title/${encodeURIComponent(login)}`),
    fetchText(`https://decapi.me/twitch/viewercount/${encodeURIComponent(login)}`),
    portraitFromChannel
      ? Promise.resolve(null)
      : fetchText(`https://decapi.me/twitch/avatar/${encodeURIComponent(login)}`),
  ]);

  const snapshot: ChannelLiveSnapshot = {
    title: titleText ? parseTwitchTitleResponse(titleText) : null,
    viewerCount: viewersText ? parseTwitchViewerCount(viewersText) : null,
    thumbnailUrl: twitchLivePreviewUrl(login),
    portraitUrl: portraitFromChannel ?? (avatarText ? parseTwitchAvatarResponse(avatarText) : null),
  };
  setCache(twitchSnapshotCache, login, snapshot);
  return snapshot;
}

async function resolveYouTubeChannel(channel: Channel, apiKey: string): Promise<YouTubeChannelRef | null> {
  const cached = getCached(youtubeChannelCache, channel.id);
  if (cached) return cached;

  const directId = parseYouTubeChannelId(channel.urlLink);
  const query = directId
    ? `id=${encodeURIComponent(directId)}`
    : (() => {
        const handle = parseYouTubeChannelHandle(channel.urlLink);
        return handle ? `forHandle=${encodeURIComponent(handle)}` : null;
      })();
  if (!query) return null;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&${query}&key=${encodeURIComponent(apiKey)}`,
  );
  if (!res.ok) return null;

  const json = (await res.json()) as {
    items?: Array<{
      id?: string;
      snippet?: { thumbnails?: Record<string, { url?: string }> };
      contentDetails?: { relatedPlaylists?: { uploads?: string } };
    }>;
  };
  const item = json.items?.[0];
  const uploads = item?.contentDetails?.relatedPlaylists?.uploads;
  if (!item?.id || !uploads) return null;

  const value: YouTubeChannelRef = {
    channelId: item.id,
    uploadsPlaylistId: uploads,
    portraitUrl: pickYouTubeThumbnail(item.snippet?.thumbnails),
  };
  setCache(youtubeChannelCache, channel.id, value);
  return value;
}

async function fetchYouTubeLiveSnapshot(channel: Channel, apiKey: string): Promise<ChannelLiveSnapshot | null> {
  try {
    const resolved = await resolveYouTubeChannel(channel, apiKey);
    if (!resolved) return null;

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${encodeURIComponent(resolved.uploadsPlaylistId)}&maxResults=1&key=${encodeURIComponent(apiKey)}`,
    );
    if (!playlistRes.ok) return null;

    const playlistJson = (await playlistRes.json()) as {
      items?: Array<{ contentDetails?: { videoId?: string } }>;
    };
    const videoId = playlistJson.items?.[0]?.contentDetails?.videoId;
    if (!videoId) return null;

    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`,
    );
    if (!videoRes.ok) return null;

    const videoJson = (await videoRes.json()) as {
      items?: Array<{
        snippet?: {
          title?: string;
          liveBroadcastContent?: string;
          thumbnails?: Record<string, { url?: string }>;
        };
        liveStreamingDetails?: { concurrentViewers?: string };
      }>;
    };
    const item = videoJson.items?.[0];
    if (!item || item.snippet?.liveBroadcastContent !== "live") return null;

    const viewersRaw = item.liveStreamingDetails?.concurrentViewers;
    const viewerCount = viewersRaw != null ? Number.parseInt(String(viewersRaw), 10) : null;

    return {
      title: item.snippet?.title?.trim() || null,
      viewerCount: viewerCount != null && Number.isFinite(viewerCount) ? viewerCount : null,
      thumbnailUrl:
        pickYouTubeThumbnail(item.snippet?.thumbnails) ??
        `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`,
      portraitUrl: channel.imagePath?.trim() || resolved.portraitUrl,
    };
  } catch {
    return null;
  }
}

async function checkChannelLive(
  channel: Channel,
  youtubeApiKey: string | null,
): Promise<ChannelLiveSnapshot | null> {
  if (channel.category === "twitch") return fetchTwitchLiveSnapshot(channel);
  if (channel.category === "youtube") {
    if (!youtubeApiKey) return null;
    return fetchYouTubeLiveSnapshot(channel, youtubeApiKey);
  }
  return null;
}

/** Consulta quem está ao vivo e o print/título/retrato quando a plataforma expõe. */
export async function fetchChannelLiveStatus(channels: Channel[]): Promise<Map<string, ChannelLiveSnapshot>> {
  const streamChannels = channels.filter((c) => c.category === "youtube" || c.category === "twitch");
  if (streamChannels.length === 0) return new Map();

  const youtubeApiKey = getYouTubeApiKey();
  const snapshots = await mapWithConcurrency(streamChannels, CONCURRENCY, async (channel) => ({
    id: channel.id,
    snapshot: await checkChannelLive(channel, youtubeApiKey),
  }));

  const liveById = new Map<string, ChannelLiveSnapshot>();
  for (const { id, snapshot } of snapshots) {
    if (snapshot) liveById.set(id, snapshot);
  }
  return liveById;
}

/** Canais ao vivo primeiro; ordem relativa preservada dentro de cada grupo. */
export function sortChannelsLiveFirst(channels: Channel[], liveIds: Set<string>): Channel[] {
  if (liveIds.size === 0) return channels;

  const live: Channel[] = [];
  const offline: Channel[] = [];

  for (const channel of channels) {
    if (liveIds.has(channel.id)) live.push(channel);
    else offline.push(channel);
  }

  return [...live, ...offline];
}
