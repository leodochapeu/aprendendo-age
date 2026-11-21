import { createSupabaseClient, createSupabasePublicClient } from "@/lib/supabase/client";
import { notificationImageExtension, NOTIFICATION_HISTORY_PAGE_SIZE, NOTIFICATION_PREVIEW_LIMIT, } from "@/lib/siteNotifications";
const BUCKET = "site-notifications";
const FEED_COLUMNS = "id, title, description, link_url, image_url, starts_at, expires_at, created_at, highlighted";
const FEED_COLUMNS_LEGACY = "id, title, description, link_url, image_url, starts_at, expires_at, created_at";
function isMissingHighlightedColumn(error) {
    if (!error)
        return false;
    return error.code === "42703" || (error.message ?? "").includes("highlighted");
}
function mapNotification(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        linkUrl: row.link_url,
        imageUrl: row.image_url,
        startsAt: row.starts_at,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        highlighted: row.highlighted === true,
    };
}
/** Leitura anônima: a policy só devolve avisos já iniciados e ainda válidos. */
export async function fetchNotificationPreview() {
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const listQuery = (columns) => supabase
        .from("site_notifications")
        .select(columns)
        .order("starts_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(NOTIFICATION_PREVIEW_LIMIT + 1);
    let listResult = await listQuery(FEED_COLUMNS);
    if (isMissingHighlightedColumn(listResult.error))
        listResult = await listQuery(FEED_COLUMNS_LEGACY);
    if (listResult.error)
        return { ok: false, reason: "load" };
    const rows = (listResult.data ?? []).slice(0, NOTIFICATION_PREVIEW_LIMIT + 1);
    const page = rows.slice(0, NOTIFICATION_PREVIEW_LIMIT).map(mapNotification);
    return {
        ok: true,
        preview: page,
        total: rows.length > NOTIFICATION_PREVIEW_LIMIT ? page.length + 1 : page.length,
        activeIds: page.map((item) => item.id),
    };
}
export async function fetchNotificationPage(offset) {
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const pageQuery = (columns) => supabase
        .from("site_notifications")
        .select(columns)
        .order("starts_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + NOTIFICATION_HISTORY_PAGE_SIZE - 1);
    let result = await pageQuery(FEED_COLUMNS);
    if (isMissingHighlightedColumn(result.error))
        result = await pageQuery(FEED_COLUMNS_LEGACY);
    if (result.error)
        return { ok: false, reason: "load" };
    return { ok: true, items: (result.data ?? []).map(mapNotification) };
}
export async function uploadNotificationImage(userId, file) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
    const extension = notificationImageExtension(file.type);
    if (!extension)
        return { ok: false, message: "UPLOAD" };
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
    });
    if (error)
        return { ok: false, message: "UPLOAD" };
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { ok: true, url: data.publicUrl, path };
}
export async function removeNotificationImage(path) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return;
    await supabase.storage.from(BUCKET).remove([path]);
}
export async function sendSiteNotification(input) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        return { ok: false, message: "NOT_AUTHENTICATED" };
    const { error } = await supabase
        .from("site_notifications")
        .insert({
        title: input.title.trim(),
        description: input.description.trim(),
        link_url: input.linkUrl,
        image_url: input.imageUrl,
        starts_at: input.startsAt.toISOString(),
        expires_at: input.expiresAt.toISOString(),
        created_by: user.id,
        highlighted: input.highlighted,
    })
        .select("id")
        .single();
    if (error)
        return { ok: false, message: "SAVE" };
    return { ok: true };
}
async function authenticatedNotifications() {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user)
        return { ok: false, message: "NOT_AUTHENTICATED" };
    return { ok: true, supabase };
}
export async function fetchManagedNotifications() {
    const session = await authenticatedNotifications();
    if (!session.ok)
        return session;
    const listQuery = (columns) => session.supabase
        .from("site_notifications")
        .select(columns)
        .order("starts_at", { ascending: false })
        .limit(500);
    let result = await listQuery(FEED_COLUMNS);
    if (isMissingHighlightedColumn(result.error))
        result = await listQuery(FEED_COLUMNS_LEGACY);
    if (result.error)
        return { ok: false, message: "LOAD" };
    return { ok: true, items: (result.data ?? []).map(mapNotification) };
}
export async function fetchManagedNotification(id) {
    const session = await authenticatedNotifications();
    if (!session.ok)
        return session;
    const oneQuery = (columns) => session.supabase.from("site_notifications").select(columns).eq("id", id).maybeSingle();
    let result = await oneQuery(FEED_COLUMNS);
    if (isMissingHighlightedColumn(result.error))
        result = await oneQuery(FEED_COLUMNS_LEGACY);
    if (result.error)
        return { ok: false, message: "LOAD" };
    if (!result.data)
        return { ok: false, message: "NOT_FOUND" };
    return { ok: true, item: mapNotification(result.data) };
}
export async function updateSiteNotification(input) {
    const session = await authenticatedNotifications();
    if (!session.ok)
        return session;
    const { data, error } = await session.supabase
        .from("site_notifications")
        .update({
        title: input.title.trim(),
        description: input.description.trim(),
        link_url: input.linkUrl,
        image_url: input.imageUrl,
        starts_at: input.startsAt.toISOString(),
        expires_at: input.expiresAt.toISOString(),
        highlighted: input.highlighted,
    })
        .eq("id", input.id)
        .select("id")
        .maybeSingle();
    if (error || !data)
        return { ok: false, message: "SAVE" };
    return { ok: true };
}
export async function publishSiteNotificationNow(id) {
    const session = await authenticatedNotifications();
    if (!session.ok)
        return session;
    const { data, error } = await session.supabase
        .from("site_notifications")
        .update({ starts_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .maybeSingle();
    if (error || !data)
        return { ok: false, message: "SAVE" };
    return { ok: true };
}
export async function deleteSiteNotification(id) {
    const session = await authenticatedNotifications();
    if (!session.ok)
        return session;
    const { data, error } = await session.supabase.from("site_notifications").delete().eq("id", id).select("id");
    if (error || !data?.length)
        return { ok: false, message: "SAVE" };
    return { ok: true };
}
