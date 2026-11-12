import { getClanLogoUrl } from "@/lib/clanAssetUrl";
import {
  DEFAULT_PLAYER_AVATAR_SRC,
  isSteamPlaceholderAvatar,
  upgradeSteamStaticAvatarUrl,
} from "@/lib/steamAvatarUrl";
import { clanSlugFromTag } from "@/lib/clanSlug";
import { createSupabasePublicClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AomRacePlayer = {
  id: string;
  displayName: string | null;
  aomstatsAlias: string | null;
  logoPath: string | null;
  aomstatsId: string | null;
  aomstatsClan: string | null;
  clanLinkedTag: string | null;
  clanLogoPath: string | null;
  rr: number;
  wins: number | null;
  losses: number | null;
  winRate: string | null;
  rank: string | null;
  snapshotAt: string | null;
  country: string | null;
};

const PUBLIC_PLAYER_SELECT =
  "id, display_name, aomstats_alias, logo_path, aomstats_id, aomstats_clan, aomstats_rr, aomstats_wins, aomstats_losses, aomstats_win_rate, aomstats_rank, aomstats_snapshot_at, country, clans(logo_path, tag)";

function playerLogoSrc(path: string | null | undefined): string | null {
  const raw = path?.trim() ?? "";
  if (!raw) return null;
  if (isSteamPlaceholderAvatar(raw)) return DEFAULT_PLAYER_AVATAR_SRC;
  return upgradeSteamStaticAvatarUrl(raw);
}

function mapRow(row: {
  id: string;
  display_name: string | null;
  aomstats_alias: string | null;
  logo_path: string | null;
  aomstats_id: string | null;
  aomstats_clan: string | null;
  aomstats_rr: number | null;
  aomstats_wins: number | null;
  aomstats_losses: number | null;
  aomstats_win_rate: string | null;
  aomstats_rank: string | null;
  aomstats_snapshot_at: string | null;
  country?: string | null;
  clans: { logo_path: string | null; tag: string | null } | { logo_path: string | null; tag: string | null }[] | null;
}): AomRacePlayer | null {
  if (row.aomstats_rr == null || !row.aomstats_id) return null;

  const clanRow = Array.isArray(row.clans) ? (row.clans[0] ?? null) : row.clans;

  return {
    id: row.id,
    displayName: row.display_name,
    aomstatsAlias: row.aomstats_alias,
    logoPath: playerLogoSrc(row.logo_path),
    aomstatsId: row.aomstats_id,
    aomstatsClan: row.aomstats_clan?.trim() || null,
    clanLinkedTag: clanRow?.tag?.trim() || null,
    clanLogoPath: clanRow?.logo_path?.trim() || null,
    rr: row.aomstats_rr,
    wins: row.aomstats_wins,
    losses: row.aomstats_losses,
    winRate: row.aomstats_win_rate,
    rank: row.aomstats_rank,
    snapshotAt: row.aomstats_snapshot_at,
    country: row.country?.trim() || null,
  };
}

function stripGameColorTags(value: string): string {
  return value.replace(/<color\b[^>]*>/gi, "").replace(/<\/color>/gi, "").trim();
}

/** Alias do perfil (`display_name`); o nome do AoM Stats só entra quando não há alias. */
export function playerDisplayLabel(player: AomRacePlayer): string {
  const alias = stripGameColorTags(player.displayName ?? "");
  const aomstatsName = stripGameColorTags(player.aomstatsAlias ?? "");
  return alias || aomstatsName || "?";
}

export function playerClanLogoUrl(player: AomRacePlayer): string | undefined {
  return getClanLogoUrl({ logoPath: player.clanLogoPath });
}

/** Sigla do clã para exibição (inclui sigla do AoM Stats mesmo sem cadastro local). */
export function playerClanTag(player: AomRacePlayer): string | null {
  return player.clanLinkedTag ?? player.aomstatsClan;
}

/** Rota da página do clã — só quando o jogador está vinculado a um clã em `public.clans`. */
export function playerClanPagePath(player: AomRacePlayer): string | null {
  const tag = player.clanLinkedTag;
  if (!tag) return null;
  return `/clans/${clanSlugFromTag(tag)}`;
}

/** Rota pública do perfil do jogador (UUID em `profiles.id`). */
export function playerProfilePagePath(profileId: string, locale: "pt" | "en" = "pt"): string {
  return locale === "en" ? `/player/${profileId}` : `/jogador/${profileId}`;
}

/** Jogadores sincronizados vinculados a um clã (`profiles.clan_id`). */
export async function fetchClanPlayers(clanId: string): Promise<AomRacePlayer[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabasePublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PLAYER_SELECT)
    .eq("clan_id", clanId)
    .not("aomstats_rr", "is", null)
    .not("aomstats_id", "is", null)
    .order("aomstats_rr", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => mapRow(row as Parameters<typeof mapRow>[0]))
    .filter((p): p is AomRacePlayer => p != null);
}

/** Snapshots da Corrida AoM para os perfis informados. Quem não tem RR fica de fora. */
export async function fetchAomRacePlayersByIds(ids: string[]): Promise<AomRacePlayer[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (!isSupabaseConfigured() || unique.length === 0) return [];

  const supabase = createSupabasePublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("profiles").select(PUBLIC_PLAYER_SELECT).in("id", unique);
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => mapRow(row as Parameters<typeof mapRow>[0]))
    .filter((player): player is AomRacePlayer => player != null);
}

/** Lista jogadores com snapshot AoM Stats para a Corrida AoM. */
export async function fetchAomRacePlayers(): Promise<AomRacePlayer[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabasePublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PLAYER_SELECT)
    .not("aomstats_rr", "is", null)
    .not("aomstats_id", "is", null)
    .order("aomstats_rr", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => mapRow(row as Parameters<typeof mapRow>[0]))
    .filter((p): p is AomRacePlayer => p != null);
}

/** Perfil público de um jogador sincronizado ao AoM Stats. */
export async function fetchAomRacePlayerById(profileId: string): Promise<AomRacePlayer | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabasePublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PLAYER_SELECT)
    .eq("id", profileId)
    .not("aomstats_rr", "is", null)
    .not("aomstats_id", "is", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapRow(data as Parameters<typeof mapRow>[0]);
}
