import { getClanLogoUrl } from "@/lib/clanAssetUrl";
import { DEFAULT_PLAYER_AVATAR_SRC, isSteamPlaceholderAvatar, upgradeSteamStaticAvatarUrl, } from "@/lib/steamAvatarUrl";
import { clanSlugFromTag } from "@/lib/clanSlug";
import { createSupabasePublicClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const STREAM_EMBED = "youtube_channel:channels!profiles_youtube_channel_id_fkey(url_link,category),twitch_channel:channels!profiles_twitch_channel_id_fkey(url_link,category)";
const PUBLIC_PLAYER_SELECT = `id, display_name, aomstats_alias, logo_path, aomstats_id, aomstats_clan, aomstats_rr, aomstats_rr_best, aomstats_wins, aomstats_losses, aomstats_win_rate, aomstats_rank, aomstats_snapshot_at, country, clans(logo_path, tag), ${STREAM_EMBED}`;
const PUBLIC_PLAYER_SELECT_LEGACY = "id, display_name, aomstats_alias, logo_path, aomstats_id, aomstats_clan, aomstats_rr, aomstats_wins, aomstats_losses, aomstats_win_rate, aomstats_rank, aomstats_snapshot_at, country, clans(logo_path, tag)";
async function selectPublicPlayers(run) {
    const first = await run(PUBLIC_PLAYER_SELECT);
    if (!first.error)
        return first.data ?? [];
    if (/youtube_channel|twitch_channel|profiles_youtube_channel_id_fkey|profiles_twitch_channel_id_fkey/i.test(first.error.message)) {
        const withoutStreams = await run(PUBLIC_PLAYER_SELECT.replace(`, ${STREAM_EMBED}`, ""));
        if (withoutStreams.error)
            throw new Error(withoutStreams.error.message);
        return withoutStreams.data ?? [];
    }
    if (/aomstats_rr_best/i.test(first.error.message)) {
        const legacy = await run(PUBLIC_PLAYER_SELECT_LEGACY);
        if (legacy.error)
            throw new Error(legacy.error.message);
        return legacy.data ?? [];
    }
    throw new Error(first.error.message);
}
function playerLogoSrc(path) {
    const raw = path?.trim() ?? "";
    if (!raw)
        return null;
    if (isSteamPlaceholderAvatar(raw))
        return DEFAULT_PLAYER_AVATAR_SRC;
    return upgradeSteamStaticAvatarUrl(raw);
}
function mapRow(row) {
    if (row.aomstats_rr == null || !row.aomstats_id)
        return null;
    const clanRow = Array.isArray(row.clans) ? (row.clans[0] ?? null) : row.clans;
    const rrBestRaw = row.aomstats_rr_best;
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
        rrBest: typeof rrBestRaw === "number" && Number.isFinite(rrBestRaw) && rrBestRaw > 0 ? Math.trunc(rrBestRaw) : null,
        wins: row.aomstats_wins,
        losses: row.aomstats_losses,
        winRate: row.aomstats_win_rate,
        rank: row.aomstats_rank,
        snapshotAt: row.aomstats_snapshot_at,
        country: row.country?.trim() || null,
        streams: {
            youtube: streamUrl(row.youtube_channel, "youtube"),
            twitch: streamUrl(row.twitch_channel, "twitch"),
        },
    };
}
function streamUrl(value, category) {
    const row = Array.isArray(value) ? value[0] : value;
    if (!row || row.category !== category)
        return null;
    const url = row.url_link?.trim() ?? "";
    return /^https?:\/\//i.test(url) ? url : null;
}
function stripGameColorTags(value) {
    return value
        .replace(/<\/?color\b[^>]*>/gi, "")
        .replace(/<[^>]*color[^>]*>/gi, "")
        .trim();
}
/** Alias do perfil (`display_name`). Sem alias, usa o nick do AoM Stats, já sem tag de cor. */
export function playerDisplayLabel(player) {
    const alias = stripGameColorTags(player.displayName ?? "");
    const nick = stripGameColorTags(player.aomstatsAlias ?? "");
    return alias || nick || "?";
}
export function playerClanLogoUrl(player) {
    return getClanLogoUrl({ logoPath: player.clanLogoPath });
}
/** Sigla do clã para exibição (inclui sigla do AoM Stats mesmo sem cadastro local). */
export function playerClanTag(player) {
    return player.clanLinkedTag ?? player.aomstatsClan;
}
/** Rota da página do clã — só quando o jogador está vinculado a um clã em `public.clans`. */
export function playerClanPagePath(player) {
    const tag = player.clanLinkedTag;
    if (!tag)
        return null;
    return `/clans/${clanSlugFromTag(tag)}`;
}
/** Rota pública do perfil do jogador (UUID em `profiles.id`). */
export function playerProfilePagePath(profileId, locale = "pt") {
    return locale === "en" ? `/player/${profileId}` : `/jogador/${profileId}`;
}
/** Jogadores sincronizados vinculados a um clã (`profiles.clan_id`). */
export async function fetchClanPlayers(clanId) {
    if (!isSupabaseConfigured())
        return [];
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return [];
    const data = await selectPublicPlayers((columns) => supabase
        .from("profiles")
        .select(columns)
        .eq("clan_id", clanId)
        .not("aomstats_rr", "is", null)
        .not("aomstats_id", "is", null)
        .order("aomstats_rr", { ascending: false }));
    return data
        .map((row) => mapRow(row))
        .filter((p) => p != null);
}
/** Snapshots da Corrida AoM para os perfis informados. Quem não tem RR fica de fora. */
export async function fetchAomRacePlayersByIds(ids) {
    const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (!isSupabaseConfigured() || unique.length === 0)
        return [];
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return [];
    const data = await selectPublicPlayers((columns) => supabase.from("profiles").select(columns).in("id", unique));
    return data
        .map((row) => mapRow(row))
        .filter((player) => player != null);
}
/** Lista jogadores com snapshot AoM Stats para a Corrida AoM. */
export async function fetchAomRacePlayers() {
    if (!isSupabaseConfigured())
        return [];
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return [];
    const data = await selectPublicPlayers((columns) => supabase
        .from("profiles")
        .select(columns)
        .not("aomstats_rr", "is", null)
        .not("aomstats_id", "is", null)
        .order("aomstats_rr", { ascending: false }));
    return data
        .map((row) => mapRow(row))
        .filter((p) => p != null);
}
/** Perfil público de um jogador sincronizado ao AoM Stats. */
export async function fetchAomRacePlayerById(profileId) {
    if (!isSupabaseConfigured())
        return null;
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return null;
    const rows = await selectPublicPlayers(async (columns) => {
        const res = await supabase
            .from("profiles")
            .select(columns)
            .eq("id", profileId)
            .not("aomstats_rr", "is", null)
            .not("aomstats_id", "is", null)
            .maybeSingle();
        return { data: res.data ? [res.data] : [], error: res.error };
    });
    const data = rows[0];
    if (!data)
        return null;
    return mapRow(data);
}
