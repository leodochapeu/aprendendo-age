import {
  fetchPlayerStatsByProfileId,
  parseElo,
  pickSup1v1Row,
  type PlayerStatsResponse,
  type ProfileStatRow,
} from "@/lib/formRetoldApi";
import { resolveClanIdByAomstatsTag } from "@/lib/clansApi";
import { steamAvatarLogoPath, upgradeSteamStaticAvatarUrl } from "@/lib/steamAvatarUrl";

export type AomStatsSnapshotFields = {
  aomstatsId: string | null;
  aomstatsAlias: string | null;
  logoPath: string | null;
  logoPathLocked: boolean;
  aomstatsRr: number | null;
  aomstatsWins: number | null;
  aomstatsLosses: number | null;
  aomstatsWinRate: string | null;
  aomstatsRank: string | null;
  aomstatsSnapshotAt: string | null;
  aomstatsClan: string | null;
  clanId: string | null;
  displayName: string | null;
};

export type AomStatsProfileSyncPayload = {
  aomstatsId: string;
  aomstatsAlias: string;
  logoPath: string | null;
  aomstatsClan: string | null;
  rr: number;
  wins: number;
  losses: number;
  winRate: string;
  rank: string | null;
};

function normalizeAomstatsClanTag(tag: string | null | undefined): string | null {
  const trimmed = tag?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function extractAomstatsClan(stats: PlayerStatsResponse): string | null {
  const fromTag = stats.clanTag?.trim();
  if (fromTag) return fromTag;
  const fromFun = stats.funStats?.clan_name?.trim();
  return fromFun || null;
}

export function buildAomStatsSyncPayload(stats: PlayerStatsResponse): AomStatsProfileSyncPayload | null {
  const row1v1 = pickSup1v1Row(stats.profileStats);
  const rr = parseElo(row1v1?.elo);
  if (!row1v1 || rr == null) return null;

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

export async function fetchAomStatsSyncPayload(profileId: number): Promise<AomStatsProfileSyncPayload | null> {
  const stats = await fetchPlayerStatsByProfileId(profileId);
  return buildAomStatsSyncPayload(stats);
}

export function buildRankHeroFromProfile(profile: AomStatsSnapshotFields): {
  player: PlayerStatsResponse;
  row1v1: ProfileStatRow;
  rr: number;
} | null {
  if (!profile.aomstatsId || profile.aomstatsRr == null) return null;

  const row1v1: ProfileStatRow = {
    mode: "Sup 1v1",
    rank: profile.aomstatsRank ?? "",
    elo: String(profile.aomstatsRr),
    winRate: profile.aomstatsWinRate ?? "0%",
    wins: profile.aomstatsWins ?? 0,
    losses: profile.aomstatsLosses ?? 0,
  };

  const player: PlayerStatsResponse = {
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

export function buildRankHeroFromRacePlayer(player: {
  aomstatsId: string | null;
  aomstatsAlias: string | null;
  displayName: string | null;
  logoPath: string | null;
  aomstatsClan: string | null;
  rr: number;
  wins: number | null;
  losses: number | null;
  winRate: string | null;
  rank: string | null;
}) {
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

export function profileRowToAomStatsFields(row: {
  aomstats_id: string | null;
  logo_path: string | null;
  logo_path_locked?: boolean | null;
  aomstats_alias: string | null;
  aomstats_rr: number | null;
  aomstats_wins: number | null;
  aomstats_losses: number | null;
  aomstats_win_rate: string | null;
  aomstats_rank: string | null;
  aomstats_snapshot_at: string | null;
  aomstats_clan?: string | null;
  clan_id?: string | null;
}) {
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

export function aomStatsSyncPayloadToDbUpdate(
  payload: AomStatsProfileSyncPayload,
  options?: { skipLogoPath?: boolean },
) {
  const update: Record<string, unknown> = {
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

export async function buildAomStatsClanDbUpdate(
  payload: AomStatsProfileSyncPayload,
  previousAomstatsClan: string | null | undefined,
): Promise<{ aomstats_clan: string | null; clan_id: string | null } | null> {
  const previousNorm = normalizeAomstatsClanTag(previousAomstatsClan);
  const newNorm = normalizeAomstatsClanTag(payload.aomstatsClan);

  if (previousNorm === newNorm) return null;

  return {
    aomstats_clan: payload.aomstatsClan,
    clan_id: await resolveClanIdByAomstatsTag(payload.aomstatsClan),
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
} as const;
