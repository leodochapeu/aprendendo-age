import { createSupabaseClient, createSupabasePublicClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { extractYouTubeVideoId } from "@/lib/youtubeEmbed";
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
function mapTag(row) {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        colorHex: row.color_hex,
    };
}
function mapTagsFromLinks(links) {
    if (!links?.length)
        return [];
    const tags = [];
    for (const link of links) {
        const raw = link.community_video_tags;
        const row = Array.isArray(raw) ? raw[0] : raw;
        if (row)
            tags.push(mapTag(row));
    }
    return tags.sort((a, b) => a.name.localeCompare(b.name, "pt"));
}
function mapVideoRow(row) {
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
export async function fetchCommunityVideoTags() {
    if (!isSupabaseConfigured())
        return [];
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return [];
    const { data, error } = await supabase
        .from("community_video_tags")
        .select("id, slug, name, color_hex")
        .order("name", { ascending: true });
    if (error)
        throw new Error(error.message);
    return (data ?? []).map((row) => mapTag(row));
}
/** Lista vídeos aprovados, do publicado mais recente no YouTube para o mais antigo. */
export async function fetchApprovedCommunityVideos() {
    if (!isSupabaseConfigured())
        return [];
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return [];
    const { data, error } = await supabase
        .from("community_videos")
        .select(VIDEO_SELECT)
        .eq("status", "approved")
        // created_at guarda a data de publicação no YouTube.
        .order("created_at", { ascending: false });
    if (error)
        throw new Error(error.message);
    return (data ?? []).map((row) => mapVideoRow(row));
}
/** Detalhe por id (RLS: aprovado, próprio pendente ou admin). */
export async function fetchCommunityVideoById(id) {
    if (!isSupabaseConfigured())
        return null;
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return null;
    const { data, error } = await supabase.from("community_videos").select(VIDEO_SELECT).eq("id", id).maybeSingle();
    if (error)
        throw new Error(error.message);
    if (!data)
        return null;
    return mapVideoRow(data);
}
/** Verifica duplicata por YouTube ID ou título (inclui pendentes de outros usuários). */
export async function checkCommunityVideoDuplicate(videoUrl, title) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
    const { data: { user }, error: userError, } = await supabase.auth.getUser();
    if (userError || !user)
        return { ok: false, message: "NOT_AUTHENTICATED" };
    const youtubeVideoId = extractYouTubeVideoId(videoUrl);
    const { data, error } = await supabase.rpc("community_video_duplicate_check", {
        p_youtube_video_id: youtubeVideoId,
        p_title: title.trim(),
    });
    if (error)
        throw new Error(error.message);
    const row = data;
    return {
        urlExists: Boolean(row?.url_exists),
        titleExists: Boolean(row?.title_exists),
    };
}
function duplicateErrorCode(check) {
    if (check.urlExists && check.titleExists)
        return "DUPLICATE_BOTH";
    if (check.urlExists)
        return "DUPLICATE_URL";
    if (check.titleExists)
        return "DUPLICATE_TITLE";
    return null;
}
function isUniqueViolation(message) {
    return message.includes("duplicate key") || message.includes("unique constraint");
}
async function linkVideoTags(videoId, tagIds) {
    if (!tagIds.length)
        return { ok: true };
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
    const uniqueIds = [...new Set(tagIds)];
    const { error } = await supabase.from("community_video_tag_links").insert(uniqueIds.map((tagId) => ({
        video_id: videoId,
        tag_id: tagId,
    })));
    if (error)
        return { ok: false, message: error.message };
    return { ok: true };
}
/** Envia solicitação (status pending); requer sessão autenticada. */
export async function submitCommunityVideo(payload) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
    const { data: { user }, error: userError, } = await supabase.auth.getUser();
    if (userError)
        return { ok: false, message: userError.message };
    if (!user)
        return { ok: false, message: "NOT_AUTHENTICATED" };
    const youtubeVideoId = extractYouTubeVideoId(payload.videoUrl);
    if (!youtubeVideoId)
        return { ok: false, message: "SUBMIT_ERROR" };
    const publishedAtMs = payload.publishedAt ? Date.parse(payload.publishedAt) : Number.NaN;
    const publishedAt = Number.isNaN(publishedAtMs) ? null : new Date(publishedAtMs).toISOString();
    const duplicate = await checkCommunityVideoDuplicate(payload.videoUrl, payload.title);
    if ("ok" in duplicate) {
        return { ok: false, message: duplicate.message };
    }
    const dupCode = duplicateErrorCode(duplicate);
    if (dupCode)
        return { ok: false, message: dupCode };
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
        if (isUniqueViolation(error.message))
            return { ok: false, message: "DUPLICATE_BOTH" };
        return { ok: false, message: "SUBMIT_ERROR" };
    }
    const videoId = data.id;
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
function submitterNameFromRow(row) {
    const raw = row.submitter;
    const profile = Array.isArray(raw) ? raw[0] : raw;
    const name = profile?.display_name?.trim();
    return name || null;
}
/** Fila de solicitações pendentes. RLS: admin e, após a migration, moderador. */
export async function fetchPendingCommunityVideos() {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
    const withSubmitter = await supabase
        .from("community_videos")
        .select(PENDING_SELECT)
        .eq("status", "pending")
        .order("updated_at", { ascending: false });
    if (!withSubmitter.error) {
        return {
            ok: true,
            data: (withSubmitter.data ?? []).map((row) => {
                const pending = row;
                return { ...mapVideoRow(pending), submitterName: submitterNameFromRow(pending) };
            }),
        };
    }
    const fallback = await supabase
        .from("community_videos")
        .select(VIDEO_SELECT)
        .eq("status", "pending")
        .order("updated_at", { ascending: false });
    if (fallback.error)
        return { ok: false, message: fallback.error.message };
    return {
        ok: true,
        data: (fallback.data ?? []).map((row) => ({ ...mapVideoRow(row), submitterName: null })),
    };
}
export async function approveCommunityVideo(id) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
    const { data: { user }, error: userError, } = await supabase.auth.getUser();
    if (userError)
        return { ok: false, message: userError.message };
    if (!user)
        return { ok: false, message: "NOT_AUTHENTICATED" };
    const { error } = await supabase
        .from("community_videos")
        .update({ status: "approved", approved_by: user.id })
        .eq("id", id)
        .eq("status", "pending");
    if (error)
        return { ok: false, message: error.message };
    return { ok: true };
}
export async function rejectCommunityVideo(id) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
    const { error } = await supabase.from("community_videos").delete().eq("id", id).eq("status", "pending");
    if (error)
        return { ok: false, message: error.message };
    return { ok: true };
}
