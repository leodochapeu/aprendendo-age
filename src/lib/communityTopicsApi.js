import { createSupabaseClient } from "@/lib/supabase/client";
import { isTopicCategory, isTopicStatus, TOPIC_PAGE_SIZE, TOPIC_POST_PAGE_SIZE, topicErrorCode, } from "@/lib/communityTopics";
const TOPIC_COLUMNS = "id, title, slug, category, status, status_reason, post_count, author_name, author_logo, created_by, created_at, last_post_at";
const POST_COLUMNS = "id, topic_id, body, reply_to, reply_excerpt, reply_author_name, author_name, author_logo, created_by, created_at, updated_at";
function mapTopic(row) {
    if (!isTopicCategory(row.category) || !isTopicStatus(row.status))
        return null;
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category,
        status: row.status,
        statusReason: row.status_reason,
        postCount: row.post_count,
        authorName: row.author_name,
        authorLogo: row.author_logo,
        createdBy: row.created_by,
        createdAt: row.created_at,
        lastPostAt: row.last_post_at,
    };
}
function writeError(message) {
    const code = topicErrorCode(message);
    if (code)
        return { ok: false, reason: code };
    return { ok: false, reason: "save" };
}
export async function fetchCommunityTopics(input) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const from = input.page * TOPIC_PAGE_SIZE;
    const to = from + TOPIC_PAGE_SIZE - 1;
    let request = supabase
        .from("community_topics")
        .select(TOPIC_COLUMNS, { count: "exact" })
        .order("sort_rank", { ascending: true })
        .order("last_post_at", { ascending: false });
    const safeQuery = input.query.trim().replace(/[%_]/g, "");
    if (safeQuery)
        request = request.ilike("title", `%${safeQuery}%`);
    if (input.category !== "all")
        request = request.eq("category", input.category);
    const { data, error, count } = await request.range(from, to);
    if (error)
        return { ok: false, reason: "load" };
    const items = (data ?? []).flatMap((row) => {
        const mapped = mapTopic(row);
        return mapped ? [mapped] : [];
    });
    return { ok: true, data: { items, total: count ?? items.length } };
}
export async function fetchCommunityTopic(slug) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { data, error } = await supabase.from("community_topics").select(TOPIC_COLUMNS).eq("slug", slug).maybeSingle();
    if (error)
        return { ok: false, reason: "load" };
    if (!data)
        return { ok: true, data: null };
    return { ok: true, data: mapTopic(data) };
}
export async function findSimilarCommunityTopics(title) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return [];
    const { data, error } = await supabase.rpc("find_similar_community_topics", { raw_title: title });
    if (error)
        return [];
    return (data ?? []).flatMap((row) => {
        if (!isTopicCategory(row.category) || !isTopicStatus(row.status))
            return [];
        return [{ id: row.id, title: row.title, slug: row.slug, category: row.category, status: row.status }];
    });
}
export async function createCommunityTopic(input) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { data, error } = await supabase.rpc("create_community_topic", {
        topic_title: input.title.trim().slice(0, 120),
        topic_category: input.category,
        opening_body: input.body.trim().slice(0, 4000),
    });
    if (error)
        return writeError(error.message);
    const row = data?.[0];
    if (!row?.topic_slug)
        return { ok: false, reason: "save" };
    return { ok: true, slug: row.topic_slug };
}
export async function setCommunityTopicStatus(id, status, reason) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase
        .from("community_topics")
        .update({ status, status_reason: status === "open" ? null : reason.trim().slice(0, 280) || null })
        .eq("id", id);
    if (error)
        return writeError(error.message);
    return { ok: true };
}
export async function fetchTopicPosts(topicId, page, userId) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const from = page * TOPIC_POST_PAGE_SIZE;
    const to = from + TOPIC_POST_PAGE_SIZE - 1;
    const { data, error, count } = await supabase
        .from("community_topic_posts")
        .select(POST_COLUMNS, { count: "exact" })
        .eq("topic_id", topicId)
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
        const counts = await supabase.from("community_topic_post_like_counts").select("post_id, like_count").in("post_id", ids);
        if (!counts.error) {
            for (const row of counts.data ?? []) {
                likeCounts.set(row.post_id, row.like_count);
            }
        }
        if (userId) {
            const [mine, reports] = await Promise.all([
                supabase.from("community_topic_post_likes").select("post_id").eq("created_by", userId).in("post_id", ids),
                supabase.from("community_topic_post_reports").select("post_id").eq("created_by", userId).in("post_id", ids),
            ]);
            if (!mine.error) {
                for (const row of mine.data ?? [])
                    liked.add(row.post_id);
            }
            if (!reports.error) {
                for (const row of reports.data ?? [])
                    reported.add(row.post_id);
            }
        }
    }
    return {
        ok: true,
        data: {
            total: count ?? rows.length,
            items: rows.map((row) => ({
                id: row.id,
                topicId: row.topic_id,
                body: row.body,
                replyTo: row.reply_to,
                replyExcerpt: row.reply_excerpt,
                replyAuthorName: row.reply_author_name,
                authorName: row.author_name,
                authorLogo: row.author_logo,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                likeCount: likeCounts.get(row.id) ?? 0,
                likedByMe: liked.has(row.id),
                reportedByMe: reported.has(row.id),
            })),
        },
    };
}
export async function topicPostPageForId(topicId, postId) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return null;
    const row = await supabase.from("community_topic_posts").select("created_at").eq("id", postId).eq("topic_id", topicId).maybeSingle();
    if (row.error || !row.data)
        return null;
    const createdAt = row.data.created_at;
    const older = await supabase
        .from("community_topic_posts")
        .select("id", { count: "exact", head: true })
        .eq("topic_id", topicId)
        .lt("created_at", createdAt);
    if (older.error)
        return null;
    return Math.floor((older.count ?? 0) / TOPIC_POST_PAGE_SIZE);
}
export async function createTopicPost(input) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("community_topic_posts").insert({
        topic_id: input.topicId,
        body: input.body.trim().slice(0, 4000),
        reply_to: input.replyTo,
        created_by: input.createdBy,
    });
    if (error)
        return writeError(error.message);
    return { ok: true };
}
export async function updateTopicPost(id, body) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("community_topic_posts").update({ body: body.trim().slice(0, 4000) }).eq("id", id);
    if (error)
        return writeError(error.message);
    return { ok: true };
}
export async function deleteTopicPost(id) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("community_topic_posts").delete().eq("id", id);
    if (error)
        return { ok: false, reason: "save" };
    return { ok: true };
}
export async function toggleTopicPostLike(postId, userId, liked) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    if (liked) {
        const { error } = await supabase.from("community_topic_post_likes").delete().eq("post_id", postId).eq("created_by", userId);
        if (error)
            return { ok: false, reason: "save" };
        return { ok: true };
    }
    const { error } = await supabase.from("community_topic_post_likes").insert({ post_id: postId, created_by: userId });
    if (error && error.code !== "23505")
        return { ok: false, reason: "save" };
    return { ok: true };
}
export async function reportTopicPost(postId, userId, reporterName) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("community_topic_post_reports").insert({
        post_id: postId,
        created_by: userId,
        reporter_name: reporterName.trim().slice(0, 80) || "Usuário",
    });
    if (error && error.code !== "23505")
        return { ok: false, reason: "save" };
    return { ok: true };
}
export async function fetchTopicReports() {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { data, error } = await supabase
        .from("community_topic_post_reports")
        .select("id, post_id, reporter_name, created_at, community_topic_posts(body, author_name, community_topics(title, slug))")
        .order("created_at", { ascending: false })
        .limit(200);
    if (error)
        return { ok: false, reason: "load" };
    const items = (data ?? []).flatMap((row) => {
        const post = row.community_topic_posts;
        const postRow = Array.isArray(post) ? post[0] : post;
        if (!postRow)
            return [];
        const topic = Array.isArray(postRow.community_topics) ? postRow.community_topics[0] : postRow.community_topics;
        if (!topic)
            return [];
        return [
            {
                id: String(row.id),
                postId: String(row.post_id),
                reporterName: String(row.reporter_name),
                createdAt: String(row.created_at),
                body: postRow.body,
                authorName: postRow.author_name,
                topicTitle: topic.title,
                topicSlug: topic.slug,
            },
        ];
    });
    return { ok: true, data: items };
}
export async function dismissTopicReport(id) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { error } = await supabase.from("community_topic_post_reports").delete().eq("id", id);
    if (error)
        return { ok: false, reason: "save" };
    return { ok: true };
}
