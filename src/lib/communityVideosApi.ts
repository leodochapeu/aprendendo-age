import { createSupabaseClient, createSupabasePublicClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { extractYouTubeVideoId } from "@/lib/youtubeEmbed";

export type CommunityVideoTag = {
  id: string;
  slug: string;
  name: string;
  colorHex: string;
};

export type CommunityVideo = {
  id: string;
  videoUrl: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  channelAvatarUrl: string | null;
  channelName: string | null;
  status: "pending" | "approved";
  submittedBy: string;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  tags: CommunityVideoTag[];
};

export type CommunityVideoRequest = CommunityVideo & {
  submitterName: string | null;
};

export type CommunityVideoSubmitPayload = {
  videoUrl: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  channelAvatarUrl?: string;
  channelName?: string;
  tagIds?: string[];
  /** Data de publicação no YouTube. A lista pública ordena por ela. */
  publishedAt?: string;
};

export type CommunityVideoDuplicateCheck = {
  urlExists: boolean;
  titleExists: boolean;
};

export type CommunityVideoSubmitErrorCode =
  | "SUPABASE_NOT_CONFIGURED"
  | "NOT_AUTHENTICATED"
  | "DUPLICATE_URL"
  | "DUPLICATE_TITLE"
  | "DUPLICATE_BOTH"
  | "SUBMIT_ERROR"
  | "TAGS_ERROR";

const VIDEO_SELECT = `
  id,
  video_url,
  title,
  description,
  thumbnail_url,
  channel_avatar_url,
  channel_name,
  status,
  submitted_by,
  approved_by,
  created_at,
  updated_at,
  community_video_tag_links (
    community_video_tags (
      id,
      slug,
      name,
      color_hex
    )
  )
`;

type TagRow = {
  id: string;
  slug: string;
  name: string;
  color_hex: string;
};

type VideoRow = {
  id: string;
  video_url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  channel_avatar_url: string | null;
  channel_name: string | null;
  status: "pending" | "approved";
  submitted_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  community_video_tag_links?: Array<{ community_video_tags: TagRow | TagRow[] | null }> | null;
};

function mapTag(row: TagRow): CommunityVideoTag {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    colorHex: row.color_hex,
  };
}

function mapTagsFromLinks(links: VideoRow["community_video_tag_links"]): CommunityVideoTag[] {
  if (!links?.length) return [];
  const tags: CommunityVideoTag[] = [];
  for (const link of links) {
    const raw = link.community_video_tags;
    const row = Array.isArray(raw) ? raw[0] : raw;
    if (row) tags.push(mapTag(row));
  }
  return tags.sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

function mapVideoRow(row: VideoRow): CommunityVideo {
  return {
    id: row.id,
    videoUrl: row.video_url,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    channelAvatarUrl: row.channel_avatar_url,
    channelName: row.channel_name,
    status: row.status,
    submittedBy: row.submitted_by,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: mapTagsFromLinks(row.community_video_tag_links),
  };
}

/** Catálogo de tags disponíveis para seleção. */
export async function fetchCommunityVideoTags(): Promise<CommunityVideoTag[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabasePublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("community_video_tags")
    .select("id, slug, name, color_hex")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapTag(row as TagRow));
}

/** Lista vídeos aprovados, do publicado mais recente no YouTube para o mais antigo. */
export async function fetchApprovedCommunityVideos(): Promise<CommunityVideo[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabasePublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("community_videos")
    .select(VIDEO_SELECT)
    .eq("status", "approved")
    // created_at guarda a data de publicação no YouTube.
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapVideoRow(row as VideoRow));
}

/** Detalhe por id (RLS: aprovado, próprio pendente ou admin). */
export async function fetchCommunityVideoById(id: string): Promise<CommunityVideo | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabasePublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("community_videos").select(VIDEO_SELECT).eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapVideoRow(data as VideoRow);
}

/** Verifica duplicata por YouTube ID ou título (inclui pendentes de outros usuários). */
export async function checkCommunityVideoDuplicate(
  videoUrl: string,
  title: string,
): Promise<CommunityVideoDuplicateCheck | { ok: false; message: CommunityVideoSubmitErrorCode }> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, message: "NOT_AUTHENTICATED" };

  const youtubeVideoId = extractYouTubeVideoId(videoUrl);
  const { data, error } = await supabase.rpc("community_video_duplicate_check", {
    p_youtube_video_id: youtubeVideoId,
    p_title: title.trim(),
  });

  if (error) throw new Error(error.message);

  const row = data as { url_exists?: boolean; title_exists?: boolean } | null;
  return {
    urlExists: Boolean(row?.url_exists),
    titleExists: Boolean(row?.title_exists),
  };
}

function duplicateErrorCode(check: CommunityVideoDuplicateCheck): CommunityVideoSubmitErrorCode | null {
  if (check.urlExists && check.titleExists) return "DUPLICATE_BOTH";
  if (check.urlExists) return "DUPLICATE_URL";
  if (check.titleExists) return "DUPLICATE_TITLE";
  return null;
}

function isUniqueViolation(message: string): boolean {
  return message.includes("duplicate key") || message.includes("unique constraint");
}

async function linkVideoTags(videoId: string, tagIds: string[]): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!tagIds.length) return { ok: true };

  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };

  const uniqueIds = [...new Set(tagIds)];
  const { error } = await supabase.from("community_video_tag_links").insert(
    uniqueIds.map((tagId) => ({
      video_id: videoId,
      tag_id: tagId,
    })),
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/** Envia solicitação (status pending); requer sessão autenticada. */
export async function submitCommunityVideo(
  payload: CommunityVideoSubmitPayload,
): Promise<
  { ok: true; id: string } | { ok: false; message: CommunityVideoSubmitErrorCode | string }
> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) return { ok: false, message: userError.message };
  if (!user) return { ok: false, message: "NOT_AUTHENTICATED" };

  const youtubeVideoId = extractYouTubeVideoId(payload.videoUrl);
  if (!youtubeVideoId) return { ok: false, message: "SUBMIT_ERROR" };

  const publishedAtMs = payload.publishedAt ? Date.parse(payload.publishedAt) : Number.NaN;
  const publishedAt = Number.isNaN(publishedAtMs) ? null : new Date(publishedAtMs).toISOString();

  const duplicate = await checkCommunityVideoDuplicate(payload.videoUrl, payload.title);
  if ("ok" in duplicate) {
    return { ok: false, message: duplicate.message };
  }
  const dupCode = duplicateErrorCode(duplicate);
  if (dupCode) return { ok: false, message: dupCode };

  const { data, error } = await supabase
    .from("community_videos")
    .insert({
      video_url: payload.videoUrl.trim(),
      youtube_video_id: youtubeVideoId,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      thumbnail_url: payload.thumbnailUrl?.trim() || null,
      channel_avatar_url: payload.channelAvatarUrl?.trim() || null,
      channel_name: payload.channelName?.trim() || null,
      status: "pending",
      submitted_by: user.id,
      ...(publishedAt ? { created_at: publishedAt } : {}),
    })
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error.message)) return { ok: false, message: "DUPLICATE_BOTH" };
    return { ok: false, message: "SUBMIT_ERROR" };
  }

  const videoId = data.id as string;
  const tagLink = await linkVideoTags(videoId, payload.tagIds ?? []);
  if (!tagLink.ok) {
    await supabase.from("community_videos").delete().eq("id", videoId);
    return { ok: false, message: "TAGS_ERROR" };
  }

  return { ok: true, id: videoId };
}

const PENDING_SELECT = `
  ${VIDEO_SELECT},
  submitter:profiles!community_videos_submitted_by_fkey ( display_name )
`;

type PendingVideoRow = VideoRow & {
  submitter?: { display_name?: string | null } | { display_name?: string | null }[] | null;
};

function submitterNameFromRow(row: PendingVideoRow): string | null {
  const raw = row.submitter;
  const profile = Array.isArray(raw) ? raw[0] : raw;
  const name = profile?.display_name?.trim();
  return name || null;
}

/** Fila de solicitações pendentes. RLS: admin e, após a migration, moderador. */
export async function fetchPendingCommunityVideos(): Promise<
  { ok: true; data: CommunityVideoRequest[] } | { ok: false; message: string }
> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };

  const withSubmitter = await supabase
    .from("community_videos")
    .select(PENDING_SELECT)
    .eq("status", "pending")
    .order("updated_at", { ascending: false });

  if (!withSubmitter.error) {
    return {
      ok: true,
      data: (withSubmitter.data ?? []).map((row) => {
        const pending = row as PendingVideoRow;
        return { ...mapVideoRow(pending), submitterName: submitterNameFromRow(pending) };
      }),
    };
  }

  const fallback = await supabase
    .from("community_videos")
    .select(VIDEO_SELECT)
    .eq("status", "pending")
    .order("updated_at", { ascending: false });

  if (fallback.error) return { ok: false, message: fallback.error.message };
  return {
    ok: true,
    data: (fallback.data ?? []).map((row) => ({ ...mapVideoRow(row as VideoRow), submitterName: null })),
  };
}

export async function approveCommunityVideo(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) return { ok: false, message: userError.message };
  if (!user) return { ok: false, message: "NOT_AUTHENTICATED" };

  const { error } = await supabase
    .from("community_videos")
    .update({ status: "approved", approved_by: user.id })
    .eq("id", id)
    .eq("status", "pending");

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function rejectCommunityVideo(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };

  const { error } = await supabase.from("community_videos").delete().eq("id", id).eq("status", "pending");
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
