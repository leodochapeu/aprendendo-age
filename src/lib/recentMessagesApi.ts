import { createSupabaseClient } from "@/lib/supabase/client";

export const RECENT_MESSAGE_PAGE_SIZE = 10;

export const RECENT_MESSAGE_AREAS = [
  "unidades",
  "mapas",
  "topicos",
  "starts",
  "tecnologias",
  "construcoes",
  "reliquias",
  "poderes",
  "eras",
  "panteoes",
  "aldeoes",
  "deuses",
] as const;

export type RecentMessageArea = (typeof RECENT_MESSAGE_AREAS)[number];

export type RecentMessage = {
  id: string;
  area: string;
  originKey: string;
  originTitle: string;
  body: string;
  authorName: string;
  createdAt: string;
};

type RecentRow = {
  id: string;
  area: string;
  origin_key: string;
  origin_title: string;
  body: string;
  author_name: string;
  created_at: string;
};

export function isRecentMessageArea(value: string): value is RecentMessageArea {
  return (RECENT_MESSAGE_AREAS as readonly string[]).includes(value);
}

export async function fetchRecentMessages(
  area: RecentMessageArea | "all",
  page: number,
): Promise<{ ok: true; items: RecentMessage[]; total: number } | { ok: false; reason: "unconfigured" | "load" }> {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false, reason: "unconfigured" };
  const from = page * RECENT_MESSAGE_PAGE_SIZE;
  const to = from + RECENT_MESSAGE_PAGE_SIZE - 1;
  let query = supabase
    .from("community_recent_messages")
    .select("id, area, origin_key, origin_title, body, author_name, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (area !== "all") query = query.eq("area", area);
  const { data, error, count } = await query.range(from, to);
  if (error) return { ok: false, reason: "load" };
  const rows = (data as RecentRow[] | null) ?? [];
  return {
    ok: true,
    total: count ?? rows.length,
    items: rows.map((row) => ({
      id: row.id,
      area: row.area,
      originKey: row.origin_key,
      originTitle: row.origin_title,
      body: row.body,
      authorName: row.author_name,
      createdAt: row.created_at,
    })),
  };
}
