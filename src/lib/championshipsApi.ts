import { createSupabaseClient, createSupabasePublicClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type ChampionshipPhase = "registration" | "ongoing" | "finished";

export type ChampionshipCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string;
  phase: ChampionshipPhase;
  devMode: boolean;
};

export type ChampionshipPlayer = {
  id: string;
  profileId: string;
  name: string;
  logoUrl: string;
};

export type ChampionshipGame = {
  id: string;
  winnerSide: "A" | "B";
  mapName: string;
  godA: string;
  godB: string;
};

export type ChampionshipLink = {
  id: string;
  label: string;
  url: string;
};

export type ChampionshipFixture = {
  id: string;
  roundLabel: string;
  scheduledAt: string;
  status: "scheduled" | "finished" | "cancelled";
  playerAId: string;
  playerBId: string;
  scoreA: number;
  scoreB: number;
  links: ChampionshipLink[];
  games: ChampionshipGame[];
};

export type PrizePlace = {
  place: number;
  label: string;
  amountCents: number | null;
  sharePercent: number | null;
};

export type ChampionshipDetail = ChampionshipCard & {
  rules: string;
  registrationEnabled: boolean;
  prizeEnabled: boolean;
  prizeMode: "fixed" | "donations";
  prizeNote: string;
  prizeGoalCents: number | null;
  prizeRaisedCents: number | null;
  prizeUpdatedAt: string | null;
  players: ChampionshipPlayer[];
  fixtures: ChampionshipFixture[];
  places: PrizePlace[];
};

const CHAMP_SELECT =
  "id, slug, name, description, rules, logo_path, phase, public_page, dev_mode, registration_enabled, prize_enabled, prize_mode, prize_note, prize_goal_cents, prize_raised_cents, prize_updated_at";

export function championshipAssetUrl(path: string | null | undefined) {
  const value = path?.trim() ?? "";
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  const env = getSupabaseEnv();
  if (!env) return value;
  return `${env.url.replace(/\/$/, "")}/storage/v1/object/public/${value.replace(/^\//, "")}`;
}

function phaseOf(value: unknown): ChampionshipPhase {
  if (value === "registration" || value === "finished") return value;
  return "ongoing";
}

function listedOnAprendendoAge(row: { phase?: unknown; public_page?: unknown; dev_mode?: unknown }, includeDev: boolean) {
  if (row.phase === "draft") return false;
  if (row.dev_mode === true) return includeDev;
  return row.public_page === true;
}

export async function fetchPublicChampionships(includeDev = false): Promise<ChampionshipCard[]> {
  const supabase = includeDev ? createSupabaseClient() : createSupabasePublicClient();
  if (!supabase) return [];
  let query = supabase
    .from("championships")
    .select("id, slug, name, description, logo_path, phase, public_page, dev_mode")
    .eq("status", "approved")
    .neq("phase", "draft")
    .order("name");
  query = includeDev
    ? query.or("and(public_page.eq.true,dev_mode.eq.false),dev_mode.eq.true")
    : query.eq("public_page", true).eq("dev_mode", false);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((row) => listedOnAprendendoAge(row, includeDev) && typeof row.slug === "string" && row.slug)
    .map((row) => ({
      id: row.id as string,
      slug: row.slug as string,
      name: row.name as string,
      description: (row.description as string) ?? "",
      logoUrl: championshipAssetUrl(row.logo_path as string | null),
      phase: phaseOf(row.phase),
      devMode: row.dev_mode === true,
    }));
}

export async function fetchChampionshipBySlug(slug: string, includeDev = false): Promise<ChampionshipDetail | null> {
  const supabase = includeDev ? createSupabaseClient() : createSupabasePublicClient();
  if (!supabase) return null;
  let query = supabase.from("championships").select(CHAMP_SELECT).eq("slug", slug).eq("status", "approved").neq("phase", "draft");
  query = includeDev ? query.or("and(public_page.eq.true,dev_mode.eq.false),dev_mode.eq.true") : query.eq("public_page", true).eq("dev_mode", false);
  const { data: row, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!row?.slug || !listedOnAprendendoAge(row, includeDev)) return null;

  const id = row.id as string;
  const [{ data: entries }, { data: fixtures }, { data: places }] = await Promise.all([
    supabase
      .from("championship_entries")
      .select("id, profile_id, display_name, logo_path")
      .eq("championship_id", id)
      .eq("status", "approved")
      .order("display_name"),
    supabase
      .from("championship_fixtures")
      .select("id, round_label, scheduled_at, status, player_a_entry_id, player_b_entry_id, score_a, score_b")
      .eq("championship_id", id)
      .order("scheduled_at", { ascending: true }),
    row.prize_enabled
      ? supabase
          .from("championship_prize_places")
          .select("place, label, amount_cents, share_percent")
          .eq("championship_id", id)
          .order("place")
      : Promise.resolve({ data: [] }),
  ]);

  const fixtureIds = (fixtures ?? []).map((fixture) => fixture.id as string);
  const [{ data: links }, { data: games }] = fixtureIds.length
    ? await Promise.all([
        supabase.from("championship_fixture_links").select("id, fixture_id, label, url").in("fixture_id", fixtureIds),
        supabase
          .from("championship_fixture_games")
          .select("id, fixture_id, winner_side, map_name, god_a, god_b, played_at")
          .in("fixture_id", fixtureIds)
          .order("played_at", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

  return {
    id,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    rules: (row.rules as string) ?? "",
    logoUrl: championshipAssetUrl(row.logo_path as string | null),
    phase: phaseOf(row.phase),
    devMode: row.dev_mode === true,
    registrationEnabled: Boolean(row.registration_enabled),
    prizeEnabled: Boolean(row.prize_enabled),
    prizeMode: row.prize_mode === "donations" ? "donations" : "fixed",
    prizeNote: (row.prize_note as string) ?? "",
    prizeGoalCents: typeof row.prize_goal_cents === "number" ? row.prize_goal_cents : null,
    prizeRaisedCents: typeof row.prize_raised_cents === "number" ? row.prize_raised_cents : null,
    prizeUpdatedAt: (row.prize_updated_at as string | null) ?? null,
    players: (entries ?? []).map((entry) => ({
      id: entry.id as string,
      profileId: (entry.profile_id as string) || "",
      name: (entry.display_name as string) || "Jogador",
      logoUrl: championshipAssetUrl(entry.logo_path as string | null),
    })),
    fixtures: (fixtures ?? []).map((fixture) => ({
      id: fixture.id as string,
      roundLabel: fixture.round_label as string,
      scheduledAt: fixture.scheduled_at as string,
      status: fixture.status === "finished" ? "finished" : "scheduled",
      playerAId: fixture.player_a_entry_id as string,
      playerBId: fixture.player_b_entry_id as string,
      scoreA: fixture.score_a as number,
      scoreB: fixture.score_b as number,
      links: (links ?? [])
        .filter((link) => link.fixture_id === fixture.id)
        .map((link) => ({ id: link.id as string, label: (link.label as string) || "Live", url: link.url as string })),
      games: (games ?? [])
        .filter((game) => game.fixture_id === fixture.id)
        .map((game) => ({
          id: game.id as string,
          winnerSide: game.winner_side === "B" ? "B" : "A",
          mapName: (game.map_name as string) || "",
          godA: (game.god_a as string) || "",
          godB: (game.god_b as string) || "",
        })),
    })),
    places: (places ?? []).map((place) => ({
      place: place.place as number,
      label: (place.label as string) || `${place.place}º`,
      amountCents: typeof place.amount_cents === "number" ? place.amount_cents : null,
      sharePercent: place.share_percent != null ? Number(place.share_percent) : null,
    })),
  };
}

export async function fetchMyChampionshipEntry(championshipId: string, profileId: string) {
  const supabase = createSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("championship_entries")
    .select("status")
    .eq("championship_id", championshipId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (data?.status === "pending" || data?.status === "approved" || data?.status === "rejected") return data.status;
  return null;
}

export async function submitChampionshipEntry(input: {
  championshipId: string;
  profileId: string;
  displayName: string;
  logoPath: string | null;
}) {
  const supabase = createSupabaseClient();
  if (!supabase) return { ok: false as const, message: "Supabase não configurado." };
  const { error } = await supabase.from("championship_entries").insert({
    championship_id: input.championshipId,
    profile_id: input.profileId,
    status: "pending",
    display_name: input.displayName || "Jogador",
    logo_path: input.logoPath,
  });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const };
}
