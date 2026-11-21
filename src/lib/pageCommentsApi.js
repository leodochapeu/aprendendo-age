import { createSupabaseClient } from "@/lib/supabase/client";
import { PAGE_COMMENT_PAGE_SIZE, PAGE_COMMENT_SYSTEM, commentErrorCode } from "@/lib/pageComments";
const COLUMNS = "id, system, page_kind, page_key, page_title, body, reply_to, reply_excerpt, reply_author_name, author_name, author_logo, created_by, created_at, updated_at";
function mapComment(row, likeCount, likedByMe, reportedByMe) {
    return {
        id: row.id,
        system: row.system,
        pageKind: row.page_kind,
        pageKey: row.page_key,
        pageTitle: row.page_title,
        body: row.body,
        replyTo: row.reply_to,
        replyExcerpt: row.reply_excerpt,
        replyAuthorName: row.reply_author_name,
        authorName: row.author_name,
        authorLogo: row.author_logo,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        likeCount,
        likedByMe,
        reportedByMe,
    };
}
function writeError(message) {
    const code = commentErrorCode(message);
    if (code)
        return { ok: false, reason: code };
    return { ok: false, reason: "save" };
}
export async function fetchPageComments(pageKind, pageKey, page, userId) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const from = page * PAGE_COMMENT_PAGE_SIZE;
    const to = from + PAGE_COMMENT_PAGE_SIZE - 1;
    const { data, error, count } = await supabase
        .from("page_comments")
        .select(COLUMNS, { count: "exact" })
        .eq("page_kind", pageKind)
        .eq("page_key", pageKey)
        .order("created_at", { ascending: true })
        .range(from, to);
    if (error)
        return { ok: false, reason: "load" };
    const rows = data ?? [];
    const ids = rows.map((row) => row.id);
    const likeCounts = new Map();
    const liked = new Set();
    const reported = new Set();
    if (ids.length > 0) {
        const counts = await supabase.from("page_comment_like_counts").select("comment_id, like_count").in("comment_id", ids);
        if (!counts.error) {
            for (const row of counts.data ?? []) {
                likeCounts.set(row.comment_id, row.like_count);
            }
        }
        if (userId) {
            const mine = await supabase.from("page_comment_likes").select("comment_id").eq("created_by", userId).in("comment_id", ids);
            if (!mine.error) {
                for (const row of mine.data ?? [])
                    liked.add(row.comment_id);
            }
            const reports = await supabase.from("page_comment_reports").select("comment_id").eq("created_by", userId).in("comment_id", ids);
            if (!reports.error) {
                for (const row of reports.data ?? [])
                    reported.add(row.comment_id);
            }
        }
    }
    return {
        ok: true,
        data: {
            total: count ?? rows.length,
            items: rows.map((row) => mapComment(row, likeCounts.get(row.id) ?? 0, liked.has(row.id), reported.has(row.id))),
        },
    };
}
export async function fetchMyCommentActivity(commentIds, userId) {
    const supabase = createSupabaseClient();
    if (!supabase || commentIds.length === 0)
        return { liked: [], reported: [] };
    const [mine, reports] = await Promise.all([
        supabase.from("page_comment_likes").select("comment_id").eq("created_by", userId).in("comment_id", commentIds),
        supabase.from("page_comment_reports").select("comment_id").eq("created_by", userId).in("comment_id", commentIds),
    ]);
    if (mine.error || reports.error)
        return null;
    return {
        liked: (mine.data ?? []).map((row) => row.comment_id),
        reported: (reports.data ?? []).map((row) => row.comment_id),
    };
}
export async function createPageComment(input) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("page_comments").insert({
        system: PAGE_COMMENT_SYSTEM,
        page_kind: input.pageKind,
        page_key: input.pageKey,
        page_title: input.pageTitle.trim().slice(0, 160),
        body: input.body.trim().slice(0, 4000),
        reply_to: input.replyTo,
        created_by: input.createdBy,
    });
    if (error)
        return writeError(error.message);
    return { ok: true };
}
export async function updatePageComment(id, body) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("page_comments").update({ body: body.trim().slice(0, 4000) }).eq("id", id);
    if (error)
        return writeError(error.message);
    return { ok: true };
}
export async function deletePageComment(id) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("page_comments").delete().eq("id", id);
    if (error)
        return { ok: false, reason: "save" };
    return { ok: true };
}
export async function togglePageCommentLike(commentId, userId, liked) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    if (liked) {
        const { error } = await supabase.from("page_comment_likes").delete().eq("comment_id", commentId).eq("created_by", userId);
        if (error)
            return { ok: false, reason: "save" };
        return { ok: true };
    }
    const { error } = await supabase.from("page_comment_likes").insert({ comment_id: commentId, created_by: userId });
    if (error && error.code !== "23505")
        return { ok: false, reason: "save" };
    return { ok: true };
}
export async function reportPageComment(commentId, userId, reporterName) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("page_comment_reports").insert({
        comment_id: commentId,
        created_by: userId,
        reporter_name: reporterName.trim().slice(0, 80) || "Usuário",
    });
    if (error && error.code !== "23505")
        return { ok: false, reason: "save" };
    return { ok: true };
}
export async function searchCommentMentions(query) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return [];
    const { data, error } = await supabase.rpc("search_comment_mentions", { query });
    if (error)
        return [];
    return (data ?? []).flatMap((row) => {
        const label = row.label?.trim();
        if (!label)
            return [];
        return [{ id: row.profile_id, label }];
    });
}
export async function fetchCommentReports() {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { data, error } = await supabase
        .from("page_comment_reports")
        .select("id, comment_id, reporter_name, created_at, page_comments(body, author_name, page_kind, page_key, page_title, created_at)")
        .order("created_at", { ascending: false })
        .limit(200);
    if (error)
        return { ok: false, reason: "load" };
    const items = (data ?? []).flatMap((row) => {
        const comment = Array.isArray(row.page_comments) ? row.page_comments[0] : row.page_comments;
        if (!comment)
            return [];
        return [
            {
                id: row.id,
                commentId: row.comment_id,
                reporterName: row.reporter_name,
                createdAt: row.created_at,
                body: comment.body,
                authorName: comment.author_name,
                pageKind: comment.page_kind,
                pageKey: comment.page_key,
                pageTitle: comment.page_title,
                commentCreatedAt: comment.created_at,
            },
        ];
    });
    return { ok: true, data: items };
}
export async function commentPageForId(pageKind, pageKey, commentId) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return null;
    const row = await supabase.from("page_comments").select("created_at").eq("id", commentId).eq("page_kind", pageKind).eq("page_key", pageKey).maybeSingle();
    if (row.error || !row.data)
        return null;
    const createdAt = row.data.created_at;
    const older = await supabase
        .from("page_comments")
        .select("id", { count: "exact", head: true })
        .eq("page_kind", pageKind)
        .eq("page_key", pageKey)
        .lt("created_at", createdAt);
    if (older.error)
        return null;
    return Math.floor((older.count ?? 0) / PAGE_COMMENT_PAGE_SIZE);
}
export async function dismissCommentReport(id) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("page_comment_reports").delete().eq("id", id);
    if (error)
        return { ok: false, reason: "save" };
    return { ok: true };
}
