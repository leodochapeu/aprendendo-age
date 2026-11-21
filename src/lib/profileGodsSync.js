import { AOM_MAJOR_GOD_BY_SLUG, normalizeGodSlugFromApiName } from "@/data/aomGods";
function parseElo(elo) {
    const n = typeof elo === "number" ? elo : Number.parseInt(String(elo ?? "").replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}
function parseGames(games) {
    const n = typeof games === "number" ? games : Number.parseInt(String(games ?? ""), 10);
    return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}
export function buildProfileGodRows(profileId, gods, snapshotAt = new Date().toISOString()) {
    const rows = [];
    const seen = new Set();
    for (const row of gods) {
        const slug = normalizeGodSlugFromApiName(row.god);
        if (!slug || seen.has(slug))
            continue;
        seen.add(slug);
        const canonical = AOM_MAJOR_GOD_BY_SLUG[slug];
        rows.push({
            profile_id: profileId,
            god_slug: slug,
            god_name: row.god?.trim() || canonical?.label || slug,
            elo: parseElo(row.elo),
            games: parseGames(row.games),
            win_rate: String(row.winRate ?? "0%").trim() || "0%",
            play_rate: String(row.playRate ?? "0%").trim() || "0%",
            snapshot_at: snapshotAt,
        });
    }
    return rows;
}
export async function upsertProfileGodsFromApi(supabase, profileId, gods) {
    const rows = buildProfileGodRows(profileId, gods);
    const { error: deleteError } = await supabase.from("profile_gods").delete().eq("profile_id", profileId);
    if (deleteError)
        return { ok: false, message: deleteError.message };
    if (rows.length === 0)
        return { ok: true };
    const { error: insertError } = await supabase.from("profile_gods").insert(rows);
    if (insertError)
        return { ok: false, message: insertError.message };
    return { ok: true };
}
export async function deleteProfileGods(supabase, profileId) {
    const { error } = await supabase.from("profile_gods").delete().eq("profile_id", profileId);
    if (error)
        return { ok: false, message: error.message };
    return { ok: true };
}
