import { DEFAULT_PLAYER_AVATAR_SRC, isSteamPlaceholderAvatar, steamAvatarLogoPath, upgradeSteamStaticAvatarUrl, } from "@/lib/steamAvatarUrl";
import { createSupabaseClient, createSupabasePublicClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";
function entryAlias(value) {
    const raw = typeof value === "string" ? value : "";
    const cleaned = raw.replace(/<color\b[^>]*>/gi, "").replace(/<\/color>/gi, "").trim();
    return cleaned || "Jogador";
}
const CHAMP_SELECT = "id, slug, name, subtitle, description, rules, logo_path, phase, public_page, dev_mode, registration_enabled, show_tab_about, show_tab_brackets, show_tab_roster, show_tab_table, show_tab_calendar, show_preview_about, show_preview_brackets, show_preview_roster, show_preview_table, show_preview_calendar, show_weighted_rr, prize_enabled, prize_mode, prize_note, prize_goal_cents, prize_raised_cents, prize_updated_at";
const CHAMP_SELECT_LEGACY = "id, slug, name, description, rules, logo_path, phase, public_page, dev_mode, registration_enabled, show_tab_about, show_tab_brackets, show_tab_roster, show_tab_table, show_tab_calendar, prize_enabled, prize_mode, prize_note, prize_goal_cents, prize_raised_cents, prize_updated_at";
export function championshipAssetUrl(path) {
    const value = path?.trim() ?? "";
    if (!value)
        return "";
    if (isSteamPlaceholderAvatar(value) || value.endsWith("/campeonatos/sem_avatar.png")) {
        return DEFAULT_PLAYER_AVATAR_SRC;
    }
    if (/^https?:\/\//i.test(value) || value.startsWith("data:"))
        return upgradeSteamStaticAvatarUrl(value);
    const env = getSupabaseEnv();
    if (!env)
        return value;
    return `${env.url.replace(/\/$/, "")}/storage/v1/object/public/${value.replace(/^\//, "")}`;
}
function phaseOf(value) {
    if (value === "registration" || value === "finished")
        return value;
    return "ongoing";
}
function listedOnAprendendoAge(row, includeDev) {
    if (row.phase === "draft")
        return false;
    if (row.dev_mode === true)
        return includeDev;
    return row.public_page === true;
}
const PUBLIC_LIST_SELECT = "id, slug, name, subtitle, description, logo_path, phase, public_page, dev_mode";
const PUBLIC_LIST_SELECT_LEGACY = "id, slug, name, description, logo_path, phase, public_page, dev_mode";
export async function fetchPublicChampionships(includeDev = false) {
    const supabase = includeDev ? createSupabaseClient() : createSupabasePublicClient();
    if (!supabase)
        return [];
    const listed = () => {
        const query = supabase.from("championships").select(PUBLIC_LIST_SELECT).eq("status", "approved").neq("phase", "draft").order("name");
        return includeDev
            ? query.or("and(public_page.eq.true,dev_mode.eq.false),dev_mode.eq.true")
            : query.eq("public_page", true).eq("dev_mode", false);
    };
    const first = await listed();
    // O select legado não tem `subtitle`. Os dois resultados não são atribuíveis entre si.
    let raw = first.data;
    if (first.error) {
        let legacy = supabase.from("championships").select(PUBLIC_LIST_SELECT_LEGACY).eq("status", "approved").neq("phase", "draft").order("name");
        legacy = includeDev
            ? legacy.or("and(public_page.eq.true,dev_mode.eq.false),dev_mode.eq.true")
            : legacy.eq("public_page", true).eq("dev_mode", false);
        const fallback = await legacy;
        if (fallback.error)
            throw new Error(fallback.error.message);
        raw = fallback.data;
    }
    const data = (Array.isArray(raw) ? raw : []);
    return data
        .filter((row) => listedOnAprendendoAge(row, includeDev) && typeof row.slug === "string" && row.slug)
        .map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        subtitle: typeof row.subtitle === "string" ? row.subtitle : "",
        description: row.description ?? "",
        logoUrl: championshipAssetUrl(row.logo_path),
        phase: phaseOf(row.phase),
        devMode: row.dev_mode === true,
    }));
}
export async function fetchChampionshipBySlug(slug, includeDev = false) {
    const supabase = includeDev ? createSupabaseClient() : createSupabasePublicClient();
    if (!supabase)
        return null;
    let query = supabase.from("championships").select(CHAMP_SELECT).eq("slug", slug).eq("status", "approved").neq("phase", "draft");
    query = includeDev ? query.or("and(public_page.eq.true,dev_mode.eq.false),dev_mode.eq.true") : query.eq("public_page", true).eq("dev_mode", false);
    const first = await query.maybeSingle();
    let row = first.data;
    if (first.error) {
        let legacy = supabase.from("championships").select(CHAMP_SELECT_LEGACY).eq("slug", slug).eq("status", "approved").neq("phase", "draft");
        legacy = includeDev
            ? legacy.or("and(public_page.eq.true,dev_mode.eq.false),dev_mode.eq.true")
            : legacy.eq("public_page", true).eq("dev_mode", false);
        const fallback = await legacy.maybeSingle();
        if (fallback.error)
            throw new Error(fallback.error.message);
        row = fallback.data;
    }
    if (!row?.slug || !listedOnAprendendoAge(row, includeDev))
        return null;
    const id = row.id;
    const fixturesFull = await supabase
        .from("championship_fixtures")
        .select("id, round_label, scheduled_at, status, player_a_entry_id, player_b_entry_id, score_a, score_b, stage_id, section, round_index, slot_index, group_index, series_length, feeder_a, feeder_b, is_bye, is_hidden")
        .eq("championship_id", id)
        .order("scheduled_at", { ascending: true });
    const fixturesQuery = fixturesFull.error
        ? await supabase
            .from("championship_fixtures")
            .select("id, round_label, scheduled_at, status, player_a_entry_id, player_b_entry_id, score_a, score_b")
            .eq("championship_id", id)
            .order("scheduled_at", { ascending: true })
        : fixturesFull;
    const [{ data: entries }, { data: places }, stagesResult] = await Promise.all([
        supabase
            .from("championship_entries")
            .select("id, profile_id, display_name, logo_path")
            .eq("championship_id", id)
            .eq("status", "approved")
            .order("display_name"),
        row.prize_enabled
            ? supabase
                .from("championship_prize_places")
                .select("place, label, amount_cents, share_percent")
                .eq("championship_id", id)
                .order("place")
            : Promise.resolve({ data: [] }),
        supabase
            .from("championship_stages")
            .select("id, position, name, format, series_length, group_size, advance_count")
            .eq("championship_id", id)
            .order("position", { ascending: true }),
    ]);
    const fixtures = (fixturesQuery.data ?? []);
    const stages = stagesResult.error ? [] : (stagesResult.data ?? []);
    const stageIds = stages.map((stage) => stage.id);
    const fixtureIds = (fixtures ?? []).map((fixture) => fixture.id);
    const [{ data: links }, { data: games }, flowNodesResult, flowEdgesResult] = await Promise.all([
        fixtureIds.length
            ? supabase.from("championship_fixture_links").select("id, fixture_id, label, url").in("fixture_id", fixtureIds)
            : Promise.resolve({ data: [] }),
        fixtureIds.length
            ? supabase
                .from("championship_fixture_games")
                .select("id, fixture_id, winner_side, map_name, god_a, god_b, played_at")
                .in("fixture_id", fixtureIds)
                .order("played_at", { ascending: true })
            : Promise.resolve({ data: [] }),
        stageIds.length
            ? supabase
                .from("championship_flow_nodes")
                .select("id, stage_id, node_type, fixture_id, entry_id, label, pos_x, pos_y, sort_index")
                .eq("championship_id", id)
                .in("stage_id", stageIds)
                .order("sort_index", { ascending: true })
            : Promise.resolve({ data: [], error: null }),
        stageIds.length
            ? supabase
                .from("championship_flow_edges")
                .select("id, stage_id, from_node_id, to_node_id, to_slot")
                .eq("championship_id", id)
                .in("stage_id", stageIds)
            : Promise.resolve({ data: [], error: null }),
    ]);
    const flowNodes = flowNodesResult.error ? [] : (flowNodesResult.data ?? []);
    const flowEdges = flowEdgesResult.error ? [] : (flowEdgesResult.data ?? []);
    return {
        id,
        slug: row.slug,
        name: row.name,
        subtitle: typeof row.subtitle === "string" ? (row.subtitle ?? "") : "",
        description: row.description ?? "",
        rules: row.rules ?? "",
        logoUrl: championshipAssetUrl(row.logo_path),
        phase: phaseOf(row.phase),
        devMode: row.dev_mode === true,
        registrationEnabled: Boolean(row.registration_enabled),
        showTabs: {
            about: row.show_tab_about !== false,
            brackets: row.show_tab_brackets !== false,
            roster: row.show_tab_roster !== false,
            table: row.show_tab_table !== false,
            calendar: row.show_tab_calendar !== false,
        },
        showPreviews: {
            about: row.show_preview_about !== false,
            brackets: row.show_preview_brackets !== false,
            roster: row.show_preview_roster !== false,
            table: row.show_preview_table !== false,
            calendar: row.show_preview_calendar !== false,
        },
        showWeightedRr: row.show_weighted_rr === true,
        prizeEnabled: Boolean(row.prize_enabled),
        prizeMode: row.prize_mode === "donations" ? "donations" : "fixed",
        prizeNote: row.prize_note ?? "",
        prizeGoalCents: typeof row.prize_goal_cents === "number" ? row.prize_goal_cents : null,
        prizeRaisedCents: typeof row.prize_raised_cents === "number" ? row.prize_raised_cents : null,
        prizeUpdatedAt: row.prize_updated_at ?? null,
        players: (entries ?? []).map((entry) => ({
            id: entry.id,
            profileId: entry.profile_id || "",
            name: entryAlias(entry.display_name),
            logoUrl: championshipAssetUrl(entry.logo_path),
        })),
        fixtures: (fixtures ?? []).map((fixture) => ({
            id: fixture.id,
            roundLabel: fixture.round_label,
            scheduledAt: fixture.scheduled_at ?? null,
            status: fixture.status === "finished" || fixture.status === "cancelled" ? fixture.status : "scheduled",
            playerAId: fixture.player_a_entry_id ?? null,
            playerBId: fixture.player_b_entry_id ?? null,
            scoreA: fixture.score_a,
            scoreB: fixture.score_b,
            links: (links ?? [])
                .filter((link) => link.fixture_id === fixture.id)
                .map((link) => ({ id: link.id, label: link.label || "Live", url: link.url })),
            games: (games ?? [])
                .filter((game) => game.fixture_id === fixture.id)
                .map((game) => ({
                id: game.id,
                winnerSide: game.winner_side === "B" ? "B" : "A",
                mapName: game.map_name || "",
                godA: game.god_a || "",
                godB: game.god_b || "",
            })),
            stageId: fixture.stage_id ?? null,
            section: fixture.section === "group" ||
                fixture.section === "winners" ||
                fixture.section === "losers" ||
                fixture.section === "grand_final"
                ? fixture.section
                : null,
            roundIndex: typeof fixture.round_index === "number" ? fixture.round_index : null,
            slotIndex: typeof fixture.slot_index === "number" ? fixture.slot_index : null,
            groupIndex: typeof fixture.group_index === "number" ? fixture.group_index : null,
            seriesLength: typeof fixture.series_length === "number" ? fixture.series_length : null,
            feederA: fixture.feeder_a ?? null,
            feederB: fixture.feeder_b ?? null,
            isBye: Boolean(fixture.is_bye),
            isHidden: Boolean(fixture.is_hidden),
        })),
        stages: stages.map((stage) => {
            const format = stage.format === "groups" || stage.format === "double_elim" || stage.format === "custom"
                ? stage.format
                : "single_elim";
            return {
                id: stage.id,
                position: stage.position,
                name: stage.name || "Fase",
                format,
                seriesLength: (stage.series_length === 1 || stage.series_length === 5 || stage.series_length === 7
                    ? stage.series_length
                    : 3),
                groupSize: typeof stage.group_size === "number" ? stage.group_size : null,
                advanceCount: typeof stage.advance_count === "number" ? stage.advance_count : null,
                flowNodes: flowNodes
                    .filter((node) => node.stage_id === stage.id)
                    .map((node) => ({
                    id: node.id,
                    type: node.node_type === "initializer" || node.node_type === "finalizer" || node.node_type === "match"
                        ? node.node_type
                        : "match",
                    fixtureId: node.fixture_id ?? null,
                    entryId: node.entry_id ?? null,
                    label: node.label || "",
                    x: Number(node.pos_x) || 0,
                    y: Number(node.pos_y) || 0,
                    sortIndex: typeof node.sort_index === "number" ? node.sort_index : 0,
                })),
                flowEdges: flowEdges
                    .filter((edge) => edge.stage_id === stage.id)
                    .map((edge) => ({
                    id: edge.id,
                    fromNodeId: edge.from_node_id,
                    toNodeId: edge.to_node_id,
                    toSlot: edge.to_slot === "A" || edge.to_slot === "B" ? edge.to_slot : null,
                })),
            };
        }),
        places: (places ?? []).map((place) => ({
            place: place.place,
            label: place.label || `${place.place}º`,
            amountCents: typeof place.amount_cents === "number" ? place.amount_cents : null,
            sharePercent: place.share_percent != null ? Number(place.share_percent) : null,
        })),
    };
}
export async function fetchMyChampionshipEntry(championshipId, profileId) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return null;
    const { data } = await supabase
        .from("championship_entries")
        .select("status")
        .eq("championship_id", championshipId)
        .eq("profile_id", profileId)
        .maybeSingle();
    if (data?.status === "pending" || data?.status === "approved" || data?.status === "rejected")
        return data.status;
    return null;
}
export async function submitChampionshipEntry(input) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, message: "Supabase não configurado." };
    const { error } = await supabase.from("championship_entries").insert({
        championship_id: input.championshipId,
        profile_id: input.profileId,
        status: "pending",
        display_name: input.displayName || "Jogador",
        logo_path: steamAvatarLogoPath(input.logoPath),
    });
    if (error)
        return { ok: false, message: error.message };
    return { ok: true };
}
