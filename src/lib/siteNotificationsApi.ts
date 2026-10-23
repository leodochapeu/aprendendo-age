import { createSupabaseClient, createSupabasePublicClient } from "@/lib/supabase/client";

import {
  notificationImageExtension,
  NOTIFICATION_HISTORY_PAGE_SIZE,
  NOTIFICATION_PREVIEW_LIMIT,
  type SiteNotification,
} from "@/lib/siteNotifications";

const BUCKET = "site-notifications";

const FEED_COLUMNS = "id, title, description, link_url, image_url, starts_at, expires_at, created_at, highlighted";
const FEED_COLUMNS_LEGACY = "id, title, description, link_url, image_url, starts_at, expires_at, created_at";

function isMissingHighlightedColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || (error.message ?? "").includes("highlighted");
}

type SiteNotificationRow = {
  id: string;
  title: string;
  description: string;
  link_url: string | null;
  image_url: string | null;
  starts_at: string;
  expires_at: string;
  created_at: string;
  highlighted: boolean | null;
};

export type NotificationPreview =
  | { ok: true; preview: SiteNotification[]; total: number; activeIds: string[] }
  | { ok: false; reason: "unconfigured" | "load" };

export type NotificationPage =
  | { ok: true; items: SiteNotification[] }
  | { ok: false; reason: "unconfigured" | "load" };

export type SendSiteNotificationInput = {
  title: string;
  description: string;
  linkUrl: string | null;
  imageUrl: string | null;
  startsAt: Date;
  expiresAt: Date;
  highlighted: boolean;
};

export type SendSiteNotificationResult =
  | { ok: true }
  | { ok: false; message: "SUPABASE_NOT_CONFIGURED" | "NOT_AUTHENTICATED" | "SAVE" };

export type UploadNotificationImageResult =
  | { ok: true; url: string; path: string }
  | { ok: false; message: "SUPABASE_NOT_CONFIGURED" | "UPLOAD" };

function mapNotification(row: SiteNotificationRow): SiteNotification {
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
export async function fetchNotificationPreview(): Promise<NotificationPreview> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };

  const listQuery = (columns: string) =>
    supabase
      .from("site_notifications")
      .select(columns, { count: "exact" })
      .order("starts_at", { ascending: false })
      .order("id", { ascending: false })
      .range(0, NOTIFICATION_PREVIEW_LIMIT - 1);

  let listResult = await listQuery(FEED_COLUMNS);
  if (isMissingHighlightedColumn(listResult.error)) listResult = await listQuery(FEED_COLUMNS_LEGACY);

  const idsResult = await supabase
    .from("site_notifications")
    .select("id")
    .order("starts_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1000);

  if (listResult.error || idsResult.error) return { ok: false, reason: "load" };

  const rows = (listResult.data ?? []) as unknown as SiteNotificationRow[];
  const ids = (idsResult.data ?? []) as { id: string }[];
  return {
    ok: true,
    preview: rows.map(mapNotification),
    total: listResult.count ?? rows.length,
    activeIds: ids.map((row) => row.id),
  };
}

export async function fetchNotificationPage(offset: number): Promise<NotificationPage> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };

  const pageQuery = (columns: string) =>
    supabase
      .from("site_notifications")
      .select(columns)
      .order("starts_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + NOTIFICATION_HISTORY_PAGE_SIZE - 1);

  let result = await pageQuery(FEED_COLUMNS);
  if (isMissingHighlightedColumn(result.error)) result = await pageQuery(FEED_COLUMNS_LEGACY);
  if (result.error) return { ok: false, reason: "load" };
  return { ok: true, items: ((result.data ?? []) as unknown as SiteNotificationRow[]).map(mapNotification) };
}

export async function uploadNotificationImage(userId: string, file: File): Promise<UploadNotificationImageResult> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };
  const extension = notificationImageExtension(file.type);
  if (!extension) return { ok: false, message: "UPLOAD" };

  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { ok: false, message: "UPLOAD" };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

export async function removeNotificationImage(path: string): Promise<void> {
  const supabase = createSupabaseClient();
  if (!supabase) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function sendSiteNotification(input: SendSiteNotificationInput): Promise<SendSiteNotificationResult> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, message: "SUPABASE_NOT_CONFIGURED" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "NOT_AUTHENTICATED" };

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

  if (error) return { ok: false, message: "SAVE" };
  return { ok: true };
}

export type ManageNotificationsResult =
  | { ok: true; items: SiteNotification[] }
  | { ok: false; message: "SUPABASE_NOT_CONFIGURED" | "NOT_AUTHENTICATED" | "LOAD" };

export type ManagedNotificationResult =
  | { ok: true; item: SiteNotification }
  | { ok: false; message: "SUPABASE_NOT_CONFIGURED" | "NOT_AUTHENTICATED" | "NOT_FOUND" | "LOAD" };

export type UpdateSiteNotificationInput = SendSiteNotificationInput & { id: string };

export type NotificationMutationResult =
  | { ok: true }
  | { ok: false; message: "SUPABASE_NOT_CONFIGURED" | "NOT_AUTHENTICATED" | "SAVE" };

async function authenticatedNotifications() {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false as const, message: "SUPABASE_NOT_CONFIGURED" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "NOT_AUTHENTICATED" as const };
  return { ok: true as const, supabase };
}

export async function fetchManagedNotifications(): Promise<ManageNotificationsResult> {
  const session = await authenticatedNotifications();
  if (!session.ok) return session;

  const listQuery = (columns: string) =>
    session.supabase
      .from("site_notifications")
      .select(columns)
      .order("starts_at", { ascending: false })
      .limit(500);

  let result = await listQuery(FEED_COLUMNS);
  if (isMissingHighlightedColumn(result.error)) result = await listQuery(FEED_COLUMNS_LEGACY);
  if (result.error) return { ok: false, message: "LOAD" };
  return { ok: true, items: ((result.data ?? []) as unknown as SiteNotificationRow[]).map(mapNotification) };
}

export async function fetchManagedNotification(id: string): Promise<ManagedNotificationResult> {
  const session = await authenticatedNotifications();
  if (!session.ok) return session;

  const oneQuery = (columns: string) =>
    session.supabase.from("site_notifications").select(columns).eq("id", id).maybeSingle();

  let result = await oneQuery(FEED_COLUMNS);
  if (isMissingHighlightedColumn(result.error)) result = await oneQuery(FEED_COLUMNS_LEGACY);
  if (result.error) return { ok: false, message: "LOAD" };
  if (!result.data) return { ok: false, message: "NOT_FOUND" };
  return { ok: true, item: mapNotification(result.data as unknown as SiteNotificationRow) };
}

export async function updateSiteNotification(input: UpdateSiteNotificationInput): Promise<NotificationMutationResult> {
  const session = await authenticatedNotifications();
  if (!session.ok) return session;

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

  if (error || !data) return { ok: false, message: "SAVE" };
  return { ok: true };
}

export async function publishSiteNotificationNow(id: string): Promise<NotificationMutationResult> {
  const session = await authenticatedNotifications();
  if (!session.ok) return session;

  const { data, error } = await session.supabase
    .from("site_notifications")
    .update({ starts_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, message: "SAVE" };
  return { ok: true };
}

export async function deleteSiteNotification(id: string): Promise<NotificationMutationResult> {
  const session = await authenticatedNotifications();
  if (!session.ok) return session;

  const { data, error } = await session.supabase.from("site_notifications").delete().eq("id", id).select("id");
  if (error || !data?.length) return { ok: false, message: "SAVE" };
  return { ok: true };
}
