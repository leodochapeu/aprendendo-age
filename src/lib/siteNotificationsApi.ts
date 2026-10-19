import { createSupabaseClient, createSupabasePublicClient } from "@/lib/supabase/client";

import {
  notificationImageExtension,
  NOTIFICATION_HISTORY_PAGE_SIZE,
  NOTIFICATION_PREVIEW_LIMIT,
  type SiteNotification,
} from "@/lib/siteNotifications";

const BUCKET = "site-notifications";

const FEED_COLUMNS = "id, title, description, link_url, image_url, starts_at, expires_at, created_at";

type SiteNotificationRow = {
  id: string;
  title: string;
  description: string;
  link_url: string | null;
  image_url: string | null;
  starts_at: string;
  expires_at: string;
  created_at: string;
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
  };
}

/** Leitura anônima: a policy só devolve avisos já iniciados e ainda válidos. */
export async function fetchNotificationPreview(): Promise<NotificationPreview> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };

  const [listResult, idsResult] = await Promise.all([
    supabase
      .from("site_notifications")
      .select(FEED_COLUMNS, { count: "exact" })
      .order("starts_at", { ascending: false })
      .order("id", { ascending: false })
      .range(0, NOTIFICATION_PREVIEW_LIMIT - 1),
    supabase
      .from("site_notifications")
      .select("id")
      .order("starts_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1000),
  ]);

  if (listResult.error || idsResult.error) return { ok: false, reason: "load" };

  const rows = (listResult.data ?? []) as SiteNotificationRow[];
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

  const { data, error } = await supabase
    .from("site_notifications")
    .select(FEED_COLUMNS)
    .order("starts_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + NOTIFICATION_HISTORY_PAGE_SIZE - 1);

  if (error) return { ok: false, reason: "load" };
  return { ok: true, items: ((data ?? []) as SiteNotificationRow[]).map(mapNotification) };
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
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: "SAVE" };
  return { ok: true };
}
