import { extractYouTubeVideoId } from "@/lib/youtubeEmbed";

export type YouTubeVideoMetadata = {
  title: string;
  description: string;
  thumbnailUrl: string;
  channelAvatarUrl: string;
  channelName: string;
  /** ISO 8601, data em que o vídeo foi publicado no YouTube. */
  publishedAt: string;
};

export type YouTubeChannelMetadata = {
  name: string;
  urlLink: string;
  imagePath: string;
};

type ThumbnailSet = {
  maxres?: { url?: string };
  high?: { url?: string };
  medium?: { url?: string };
  default?: { url?: string };
};

function getYouTubeApiKey(): string | null {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
  return key?.trim() || null;
}

function pickThumbnail(thumbnails: ThumbnailSet | undefined): string {
  if (!thumbnails) return "";
  return (
    thumbnails.maxres?.url ??
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    ""
  );
}

function parseYouTubeChannelHandle(channelUrl: string): string | null {
  const trimmed = channelUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "youtube.com" && host !== "m.youtube.com") return null;

    const handleMatch = url.pathname.match(/^\/@([^/]+)/i);
    if (handleMatch?.[1]) return handleMatch[1];

    const legacyMatch = url.pathname.match(/^\/(?:c|user|channel)\/([^/]+)/i);
    return legacyMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

export class YouTubeApiNotConfiguredError extends Error {
  constructor() {
    super("YOUTUBE_API_NOT_CONFIGURED");
    this.name = "YouTubeApiNotConfiguredError";
  }
}

export class YouTubeVideoNotFoundError extends Error {
  constructor() {
    super("YOUTUBE_VIDEO_NOT_FOUND");
    this.name = "YouTubeVideoNotFoundError";
  }
}

export class YouTubeChannelNotFoundError extends Error {
  constructor() {
    super("YOUTUBE_CHANNEL_NOT_FOUND");
    this.name = "YouTubeChannelNotFoundError";
  }
}

/** Metadados públicos de um canal YouTube (handle `@…` ou URL do canal). */
export async function fetchYouTubeChannelMetadata(channelUrlOrHandle: string): Promise<YouTubeChannelMetadata> {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) throw new YouTubeApiNotConfiguredError();

  const handle = parseYouTubeChannelHandle(
    channelUrlOrHandle.startsWith("@") ? `https://www.youtube.com/${channelUrlOrHandle}` : channelUrlOrHandle,
  );
  if (!handle) throw new YouTubeChannelNotFoundError();

  const channelsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(handle)}&key=${encodeURIComponent(apiKey)}`,
  );
  if (!channelsRes.ok) {
    throw new Error(`YOUTUBE_API_ERROR:${channelsRes.status}`);
  }

  const channelsJson = (await channelsRes.json()) as {
    items?: Array<{ snippet?: { title?: string; customUrl?: string; thumbnails?: ThumbnailSet } }>;
  };

  const snippet = channelsJson.items?.[0]?.snippet;
  if (!snippet?.title?.trim()) throw new YouTubeChannelNotFoundError();

  const customHandle = snippet.customUrl?.replace(/^@/, "").trim() || handle;
  const urlLink = `https://www.youtube.com/@${customHandle}`;

  return {
    name: snippet.title.trim(),
    urlLink,
    imagePath: pickThumbnail(snippet.thumbnails),
  };
}

export async function fetchYouTubeVideoMetadata(videoUrl: string): Promise<YouTubeVideoMetadata> {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) throw new YouTubeApiNotConfiguredError();

  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) throw new YouTubeVideoNotFoundError();

  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`,
  );
  if (!videosRes.ok) {
    throw new Error(`YOUTUBE_API_ERROR:${videosRes.status}`);
  }

  const videosJson = (await videosRes.json()) as {
    items?: Array<{
      snippet?: {
        title?: string;
        description?: string;
        publishedAt?: string;
        channelId?: string;
        channelTitle?: string;
        thumbnails?: ThumbnailSet;
      };
    }>;
  };

  const snippet = videosJson.items?.[0]?.snippet;
  if (!snippet?.title) throw new YouTubeVideoNotFoundError();

  const channelId = snippet.channelId?.trim();
  let channelAvatarUrl = "";
  let channelName = (snippet.channelTitle ?? "").trim();

  if (channelId) {
    const channelsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`,
    );
    if (channelsRes.ok) {
      const channelsJson = (await channelsRes.json()) as {
        items?: Array<{ snippet?: { title?: string; thumbnails?: ThumbnailSet } }>;
      };
      const channelSnippet = channelsJson.items?.[0]?.snippet;
      channelAvatarUrl = pickThumbnail(channelSnippet?.thumbnails);
      if (channelSnippet?.title?.trim()) {
        channelName = channelSnippet.title.trim();
      }
    }
  }

  return {
    title: snippet.title.trim(),
    description: (snippet.description ?? "").trim(),
    thumbnailUrl: pickThumbnail(snippet.thumbnails),
    channelAvatarUrl,
    channelName,
    publishedAt: snippet.publishedAt?.trim() ?? "",
  };
}
