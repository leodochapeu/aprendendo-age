import { createSupabaseClient } from "@/lib/supabase/client";

import { PAGE_COMMENT_PAGE_SIZE, PAGE_COMMENT_SYSTEM, commentErrorCode, type CommentErrorCode, type CommentReport, type PageComment } from "@/lib/pageComments";

const COLUMNS =
  "id, system, page_kind, page_key, page_title, body, reply_to, reply_excerpt, reply_author_name, author_name, author_logo, created_by, created_at, updated_at";

type CommentRow = {
  id: string;
  system: string;
  page_kind: string;
  page_key: string;
  page_title: string;
  body: string;
  reply_to: string | null;
  reply_excerpt: string | null;
  reply_author_name: string | null;
  author_name: string;
  author_logo: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
};

type ReportRow = {
  id: string;
  comment_id: string;
  reporter_name: string;
  created_at: string;
  page_comments:
    | {
        body: string;
        author_name: string;
        page_kind: string;
        page_key: string;
        page_title: string;
        created_at: string;
      }
    | {
        body: string;
        author_name: string;
        page_kind: string;
        page_key: string;
        page_title: string;
        created_at: string;
      }[]
    | null;
};

export type CommentWriteResult = { ok: true } | { ok: false; reason: "unconfigured" | "save" | CommentErrorCode };

export type CommentReadResult<T> = { ok: true; data: T } | { ok: false; reason: "unconfigured" | "load" };

export type CommentPage = {
  items: PageComment[];
  total: number;
};

export type MentionHit = {
  id: string;
  label: string;
};

function mapComment(row: CommentRow, likeCount: number, likedByMe: boolean, reportedByMe: boolean): PageComment {
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

function writeError(message: string | undefined): CommentWriteResult {
  const code = commentErrorCode(message);
  if (code) return { ok: false, reason: code };
  return { ok: false, reason: "save" };
}

export async function fetchPageComments(
  pageKind: string,
  pageKey: string,
  page: number,
  userId: string | null,
): Promise<CommentReadResult<CommentPage>> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  const from = page * PAGE_COMMENT_PAGE_SIZE;
  const to = from + PAGE_COMMENT_PAGE_SIZE - 1;
  const { data, error, count } = await supabase
    .from("page_comments")
    .select(COLUMNS, { count: "exact" })
    .eq("page_kind", pageKind)
    .eq("page_key", pageKey)
    .order("created_at", { ascending: true })
    .range(from, to);
  if (error) return { ok: false, reason: "load" };
  const rows = (data as CommentRow[] | null) ?? [];
  const ids = rows.map((row) => row.id);
  const likeCounts = new Map<string, number>();
  const liked = new Set<string>();
  const reported = new Set<string>();
  if (ids.length > 0) {
    const counts = await supabase.from("page_comment_like_counts").select("comment_id, like_count").in("comment_id", ids);
    if (!counts.error) {
      for (const row of (counts.data as { comment_id: string; like_count: number }[] | null) ?? []) {
        likeCounts.set(row.comment_id, row.like_count);
      }
    }
    if (userId) {
      const mine = await supabase.from("page_comment_likes").select("comment_id").eq("created_by", userId).in("comment_id", ids);
      if (!mine.error) {
        for (const row of (mine.data as { comment_id: string }[] | null) ?? []) liked.add(row.comment_id);
      }
      const reports = await supabase.from("page_comment_reports").select("comment_id").eq("created_by", userId).in("comment_id", ids);
      if (!reports.error) {
        for (const row of (reports.data as { comment_id: string }[] | null) ?? []) reported.add(row.comment_id);
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

export async function fetchMyCommentActivity(
  commentIds: string[],
  userId: string,
): Promise<{ liked: string[]; reported: string[] } | null> {
  const supabase = createSupabaseClient();
  if (!supabase || commentIds.length === 0) return { liked: [], reported: [] };
  const [mine, reports] = await Promise.all([
    supabase.from("page_comment_likes").select("comment_id").eq("created_by", userId).in("comment_id", commentIds),
    supabase.from("page_comment_reports").select("comment_id").eq("created_by", userId).in("comment_id", commentIds),
  ]);
  if (mine.error || reports.error) return null;
  return {
    liked: ((mine.data as { comment_id: string }[] | null) ?? []).map((row) => row.comment_id),
    reported: ((reports.data as { comment_id: string }[] | null) ?? []).map((row) => row.comment_id),
  };
}

export async function createPageComment(input: {
  pageKind: string;
  pageKey: string;
  pageTitle: string;
  body: string;
  replyTo: string | null;
  createdBy: string;
}): Promise<CommentWriteResult> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  const { error } = await supabase.from("page_comments").insert({
    system: PAGE_COMMENT_SYSTEM,
    page_kind: input.pageKind,
    page_key: input.pageKey,
    page_title: input.pageTitle.trim().slice(0, 160),
    body: input.body.trim().slice(0, 4000),
    reply_to: input.replyTo,
    created_by: input.createdBy,
  });
  if (error) return writeError(error.message);
  return { ok: true };
}

export async function updatePageComment(id: string, body: string): Promise<CommentWriteResult> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  const { error } = await supabase.from("page_comments").update({ body: body.trim().slice(0, 4000) }).eq("id", id);
  if (error) return writeError(error.message);
  return { ok: true };
}

export async function deletePageComment(id: string): Promise<CommentWriteResult> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  const { error } = await supabase.from("page_comments").delete().eq("id", id);
  if (error) return { ok: false, reason: "save" };
  return { ok: true };
}

export async function togglePageCommentLike(commentId: string, userId: string, liked: boolean): Promise<CommentWriteResult> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  if (liked) {
    const { error } = await supabase.from("page_comment_likes").delete().eq("comment_id", commentId).eq("created_by", userId);
    if (error) return { ok: false, reason: "save" };
    return { ok: true };
  }
  const { error } = await supabase.from("page_comment_likes").insert({ comment_id: commentId, created_by: userId });
  if (error && error.code !== "23505") return { ok: false, reason: "save" };
  return { ok: true };
}

export async function reportPageComment(commentId: string, userId: string, reporterName: string): Promise<CommentWriteResult> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  const { error } = await supabase.from("page_comment_reports").insert({
    comment_id: commentId,
    created_by: userId,
    reporter_name: reporterName.trim().slice(0, 80) || "Usuário",
  });
  if (error && error.code !== "23505") return { ok: false, reason: "save" };
  return { ok: true };
}

export async function searchCommentMentions(query: string): Promise<MentionHit[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("search_comment_mentions", { query });
  if (error) return [];
  return ((data as { profile_id: string; label: string }[] | null) ?? []).flatMap((row) => {
    const label = row.label?.trim();
    if (!label) return [];
    return [{ id: row.profile_id, label }];
  });
}

export async function fetchCommentReports(): Promise<CommentReadResult<CommentReport[]>> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  const { data, error } = await supabase
    .from("page_comment_reports")
    .select("id, comment_id, reporter_name, created_at, page_comments(body, author_name, page_kind, page_key, page_title, created_at)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { ok: false, reason: "load" };
  const items = ((data as ReportRow[] | null) ?? []).flatMap((row) => {
    const comment = Array.isArray(row.page_comments) ? row.page_comments[0] : row.page_comments;
    if (!comment) return [];
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

export async function commentPageForId(pageKind: string, pageKey: string, commentId: string): Promise<number | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;
  const row = await supabase.from("page_comments").select("created_at").eq("id", commentId).eq("page_kind", pageKind).eq("page_key", pageKey).maybeSingle();
  if (row.error || !row.data) return null;
  const createdAt = (row.data as { created_at: string }).created_at;
  const older = await supabase
    .from("page_comments")
    .select("id", { count: "exact", head: true })
    .eq("page_kind", pageKind)
    .eq("page_key", pageKey)
    .lt("created_at", createdAt);
  if (older.error) return null;
  return Math.floor((older.count ?? 0) / PAGE_COMMENT_PAGE_SIZE);
}

export async function dismissCommentReport(id: string): Promise<CommentWriteResult> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  const { error } = await supabase.from("page_comment_reports").delete().eq("id", id);
  if (error) return { ok: false, reason: "save" };
  return { ok: true };
}
