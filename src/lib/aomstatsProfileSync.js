import { fetchPlayerStatsByProfileId, parseElo, pickSup1v1Row, } from "@/lib/formRetoldApi";
import { resolveClanIdByAomstatsTag } from "@/lib/clansApi";
import { steamAvatarLogoPath, upgradeSteamStaticAvatarUrl } from "@/lib/steamAvatarUrl";
function normalizeAomstatsClanTag(tag) {
    const trimmed = tag?.trim();
    return trimmed ? trimmed.toUpperCase() : null;
}
function extractAomstatsClan(stats) {
    const fromTag = stats.clanTag?.trim();
    if (fromTag)
        return fromTag;
    const fromFun = stats.funStats?.clan_name?.trim();
    return fromFun || null;
}
export function buildAomStatsSyncPayload(stats) {
    const row1v1 = pickSup1v1Row(stats.profileStats);
    const rr = parseElo(row1v1?.elo);
    if (!row1v1 || rr == null)
        return null;
    return {
        aomstatsId: String(stats.profileId),
        aomstatsAlias: stats.profileName.trim() || String(stats.profileId),
        logoPath: steamAvatarLogoPath(stats.playerAvatarUrl),
        aomstatsClan: extractAomstatsClan(stats),
        rr,
        wins: row1v1.wins,
        losses: row1v1.losses,
        winRate: row1v1.winRate,
        rank: row1v1.rank?.trim() || null,
    };
}
export async function fetchAomStatsSyncPayload(profileId) {
    const stats = await fetchPlayerStatsByProfileId(profileId);
    return buildAomStatsSyncPayload(stats);
}
export function buildRankHeroFromProfile(profile) {
    if (!profile.aomstatsId || profile.aomstatsRr == null)
        return null;
    const row1v1 = {
        mode: "Sup 1v1",
        rank: profile.aomstatsRank ?? "",
        elo: String(profile.aomstatsRr),
        winRate: profile.aomstatsWinRate ?? "0%",
        wins: profile.aomstatsWins ?? 0,
        losses: profile.aomstatsLosses ?? 0,
    };
    const player = {
        profileId: Number.parseInt(profile.aomstatsId, 10) || 0,
        profileName: profile.aomstatsAlias?.trim() || profile.displayName?.trim() || "Player",
        profileUrl: profile.aomstatsId
            ? `https://aomstats.io/profile/${encodeURIComponent(profile.aomstatsId)}`
            : "",
        country: "",
        playerAvatarUrl: profile.logoPath,
        clanTag: profile.aomstatsClan,
        profileStats: [row1v1],
    };
    return { player, row1v1, rr: profile.aomstatsRr };
}
export function buildRankHeroFromRacePlayer(player) {
    return buildRankHeroFromProfile({
        aomstatsId: player.aomstatsId,
        aomstatsAlias: player.aomstatsAlias,
        logoPath: player.logoPath,
        logoPathLocked: false,
        aomstatsRr: player.rr,
        aomstatsWins: player.wins,
        aomstatsLosses: player.losses,
        aomstatsWinRate: player.winRate,
        aomstatsRank: player.rank,
        aomstatsSnapshotAt: null,
        aomstatsClan: player.aomstatsClan,
        clanId: null,
        displayName: player.displayName,
    });
}
export function profileRowToAomStatsFields(row) {
    return {
        aomstatsId: row.aomstats_id?.trim() || null,
        logoPath: row.logo_path?.trim() ? upgradeSteamStaticAvatarUrl(row.logo_path.trim()) : null,
        logoPathLocked: row.logo_path_locked === true,
        aomstatsAlias: row.aomstats_alias?.trim() || null,
        aomstatsRr: row.aomstats_rr,
        aomstatsWins: row.aomstats_wins,
        aomstatsLosses: row.aomstats_losses,
        aomstatsWinRate: row.aomstats_win_rate,
        aomstatsRank: row.aomstats_rank,
        aomstatsSnapshotAt: row.aomstats_snapshot_at,
        aomstatsClan: row.aomstats_clan?.trim() || null,
        clanId: row.clan_id ?? null,
    };
}
export function aomStatsSyncPayloadToDbUpdate(payload, options) {
    const update = {
        aomstats_id: payload.aomstatsId,
        aomstats_alias: payload.aomstatsAlias,
        aomstats_rr: payload.rr,
        aomstats_wins: payload.wins,
        aomstats_losses: payload.losses,
        aomstats_win_rate: payload.winRate,
        aomstats_rank: payload.rank,
        aomstats_snapshot_at: new Date().toISOString(),
    };
    if (!options?.skipLogoPath) {
        update.logo_path = steamAvatarLogoPath(payload.logoPath);
    }
    return update;
}
export async function buildAomStatsClanDbUpdate(payload, previousAomstatsClan, previousClanId) {
    const previousNorm = normalizeAomstatsClanTag(previousAomstatsClan);
    const newNorm = normalizeAomstatsClanTag(payload.aomstatsClan);
    const resolvedClanId = await resolveClanIdByAomstatsTag(payload.aomstatsClan);
    if (previousNorm === newNorm) {
        if (newNorm && !previousClanId && resolvedClanId) {
            return {
                aomstats_clan: payload.aomstatsClan ?? previousAomstatsClan ?? null,
                clan_id: resolvedClanId,
            };
        }
        return null;
    }
    return {
        aomstats_clan: payload.aomstatsClan,
        clan_id: resolvedClanId,
    };
}
export const AOMSTATS_UNSYNC_DB_UPDATE = {
    aomstats_id: null,
    aomstats_alias: null,
    logo_path: null,
    aomstats_rr: null,
    aomstats_wins: null,
    aomstats_losses: null,
    aomstats_win_rate: null,
    aomstats_rank: null,
    aomstats_snapshot_at: null,
    aomstats_clan: null,
    clan_id: null,
};
