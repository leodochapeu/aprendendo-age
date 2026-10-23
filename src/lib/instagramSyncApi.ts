import { createSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type InstagramSyncSettings = {
  enabled: boolean;
  runTime: string;
  lastRunAt: string | null;
  lastRunCount: number | null;
  lastRunMessage: string | null;
};

export type InstagramSyncChannel = {
  id: string;
  username: string;
};

export type InstagramSyncPost = {
  externalId: string;
  username: string;
  caption: string;
  permalink: string;
  imageUrl: string | null;
  timestamp: string;
  alreadyImported: boolean;
};

type SettingsRow = {
  enabled: boolean;
  run_time: string;
  last_run_at: string | null;
  last_run_count: number | null;
  last_run_message: string | null;
};

function mapSettings(row: SettingsRow): InstagramSyncSettings {
  return {
    enabled: row.enabled,
    runTime: row.run_time.slice(0, 5),
    lastRunAt: row.last_run_at,
    lastRunCount: row.last_run_count,
    lastRunMessage: row.last_run_message,
  };
}

export async function fetchInstagramSyncSettings(): Promise<InstagramSyncSettings | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("instagram_sync_settings").select("enabled, run_time, last_run_at, last_run_count, last_run_message").eq("id", 1).maybeSingle();
  if (error || !data) return null;
  return mapSettings(data as SettingsRow);
}

export async function saveInstagramSyncSettings(input: { enabled: boolean; runTime: string; userId: string }): Promise<boolean> {
  const supabase = createSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("instagram_sync_settings")
    .update({
      enabled: input.enabled,
      run_time: input.runTime.length === 5 ? `${input.runTime}:00` : input.runTime,
      updated_by: input.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  return !error;
}

export async function fetchInstagramSyncChannels(): Promise<InstagramSyncChannel[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("instagram_sync_channels").select("id, username").order("username");
  if (error || !data) return [];
  return data as InstagramSyncChannel[];
}

export async function addInstagramSyncChannel(username: string): Promise<boolean> {
  const supabase = createSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("instagram_sync_channels").insert({ username });
  return !error;
}

export async function removeInstagramSyncChannel(id: string): Promise<boolean> {
  const supabase = createSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("instagram_sync_channels").delete().eq("id", id);
  return !error;
}

async function callFunction(body: unknown): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false; message: string; reason?: string }> {
  const env = getSupabaseEnv();
  const supabase = createSupabaseClient();
  if (!env || !supabase) return { ok: false, message: "Supabase não configurado." };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, message: "Entre para sincronizar." };

  const response = await fetch(`${env.url}/functions/v1/instagram-notifications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: env.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !payload || payload.ok === false) {
    return {
      ok: false,
      message: typeof payload?.message === "string" ? payload.message : "Não foi possível falar com o Instagram.",
      reason: typeof payload?.reason === "string" ? payload.reason : undefined,
    };
  }
  return { ok: true, payload };
}

export async function previewInstagramPosts(from: string, to: string) {
  const result = await callFunction({ action: "preview", from, to });
  if (!result.ok) return result;
  const posts = Array.isArray(result.payload.posts) ? (result.payload.posts as InstagramSyncPost[]) : [];
  return { ok: true as const, found: posts.length, posts };
}

export async function publishInstagramPosts(from: string, to: string, externalIds: string[]) {
  const result = await callFunction({ action: "publish", from, to, externalIds });
  if (!result.ok) return result;
  return { ok: true as const, published: Number(result.payload.published ?? 0) };
}
