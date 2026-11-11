import { steamAvatarLogoPath, upgradeSteamStaticAvatarUrl } from "@/lib/steamAvatarUrl";
import { createSupabaseClient, createSupabasePublicClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type ChampionshipPhase = "registration" | "ongoing" | "finished";

function entryAlias(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  const cleaned = raw.replace(/<color\b[^>]*>/gi, "").replace(/<\/color>/gi, "").trim();
  return cleaned || "Jogador";
}

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

export type ChampionshipStageFormat = "groups" | "single_elim" | "double_elim";
export type ChampionshipFixtureSection = "group" | "winners" | "losers" | "grand_final";

export type ChampionshipStage = {
  id: string;
  position: number;
  name: string;
  format: ChampionshipStageFormat;
  seriesLength: 3 | 5 | 7;
  groupSize: number | null;
  advanceCount: number | null;
};

export type ChampionshipFixture = {
  id: string;
  roundLabel: string;
  scheduledAt: string | null;
  status: "scheduled" | "finished" | "cancelled";
  playerAId: string | null;
  playerBId: string | null;
  scoreA: number;
  scoreB: number;
  links: ChampionshipLink[];
  games: ChampionshipGame[];
  stageId: string | null;
  section: ChampionshipFixtureSection | null;
  roundIndex: number | null;
  slotIndex: number | null;
  groupIndex: number | null;
  seriesLength: number | null;
  feederA: string | null;
  feederB: string | null;
  isBye: boolean;
  isHidden: boolean;
};

export type PrizePlace = {
  place: number;
  label: string;
  amountCents: number | null;
  sharePercent: number | null;
};

export type ChampionshipDetail = ChampionshipCard & {
  subtitle: string;
  rules: string;
  registrationEnabled: boolean;
  prizeEnabled: boolean;
  prizeMode: "fixed" | "donations";
  prizeNote: string;
  prizeGoalCents: number | null;
  prizeRaisedCents: number | null;
  prizeUpdatedAt: string | null;
  showTabs: {
    about: boolean;
    brackets: boolean;
    roster: boolean;
    table: boolean;
    calendar: boolean;
  };
  showPreviews: {
    about: boolean;
    brackets: boolean;
    roster: boolean;
    table: boolean;
    calendar: boolean;
  };
  players: ChampionshipPlayer[];
  fixtures: ChampionshipFixture[];
  stages: ChampionshipStage[];
  places: PrizePlace[];
};

const CHAMP_SELECT =
  "id, slug, name, subtitle, description, rules, logo_path, phase, public_page, dev_mode, registration_enabled, show_tab_about, show_tab_brackets, show_tab_roster, show_tab_table, show_tab_calendar, show_preview_about, show_preview_brackets, show_preview_roster, show_preview_table, show_preview_calendar, prize_enabled, prize_mode, prize_note, prize_goal_cents, prize_raised_cents, prize_updated_at";

const CHAMP_SELECT_LEGACY =
  "id, slug, name, description, rules, logo_path, phase, public_page, dev_mode, registration_enabled, show_tab_about, show_tab_brackets, show_tab_roster, show_tab_table, show_tab_calendar, prize_enabled, prize_mode, prize_note, prize_goal_cents, prize_raised_cents, prize_updated_at";

export function championshipAssetUrl(path: string | null | undefined) {
  const value = path?.trim() ?? "";
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return upgradeSteamStaticAvatarUrl(value);
  const env = getSupabaseEnv();
  if (!env) return value;
  return `${env.url.replace(/\/$/, "")}/storage/v1/object/public/${value.replace(/^\//, "")}`;
}

function phaseOf(value: unknown): ChampionshipPhase {
  if (value === "registration" || value === "finished") return value;
  return "ongoing";
}

/** Linha de `championship_fixtures`, inclusive o select curto usado quando as colunas de chaveamento ainda não existem. */
type ChampionshipFixtureRow = {
  id: unknown;
  round_label: unknown;
  scheduled_at: unknown;
  status: unknown;
  player_a_entry_id: unknown;
  player_b_entry_id: unknown;
  score_a: unknown;
  score_b: unknown;
  stage_id?: unknown;
  section?: unknown;
  round_index?: unknown;
  slot_index?: unknown;
  group_index?: unknown;
  series_length?: unknown;
  feeder_a?: unknown;
  feeder_b?: unknown;
  is_bye?: unknown;
  is_hidden?: unknown;
};

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
  const first = await query.maybeSingle();
  let row = first.data;
  if (first.error) {
    let legacy = supabase.from("championships").select(CHAMP_SELECT_LEGACY).eq("slug", slug).eq("status", "approved").neq("phase", "draft");
    legacy = includeDev
      ? legacy.or("and(public_page.eq.true,dev_mode.eq.false),dev_mode.eq.true")
      : legacy.eq("public_page", true).eq("dev_mode", false);
    const fallback = await legacy.maybeSingle();
    if (fallback.error) throw new Error(fallback.error.message);
    row = fallback.data as typeof first.data;
  }
  if (!row?.slug || !listedOnAprendendoAge(row, includeDev)) return null;

  const id = row.id as string;
  const fixturesFull = await supabase
    .from("championship_fixtures")
    .select(
      "id, round_label, scheduled_at, status, player_a_entry_id, player_b_entry_id, score_a, score_b, stage_id, section, round_index, slot_index, group_index, series_length, feeder_a, feeder_b, is_bye, is_hidden",
    )
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
  const fixtures = (fixturesQuery.data ?? []) as ChampionshipFixtureRow[];
  const stages = stagesResult.error ? [] : (stagesResult.data ?? []);

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
    subtitle: typeof (row as { subtitle?: unknown }).subtitle === "string" ? ((row as { subtitle: string }).subtitle ?? "") : "",
    description: (row.description as string) ?? "",
    rules: (row.rules as string) ?? "",
    logoUrl: championshipAssetUrl(row.logo_path as string | null),
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
      about: (row as { show_preview_about?: unknown }).show_preview_about !== false,
      brackets: (row as { show_preview_brackets?: unknown }).show_preview_brackets !== false,
      roster: (row as { show_preview_roster?: unknown }).show_preview_roster !== false,
      table: (row as { show_preview_table?: unknown }).show_preview_table !== false,
      calendar: (row as { show_preview_calendar?: unknown }).show_preview_calendar !== false,
    },
    prizeEnabled: Boolean(row.prize_enabled),
    prizeMode: row.prize_mode === "donations" ? "donations" : "fixed",
    prizeNote: (row.prize_note as string) ?? "",
    prizeGoalCents: typeof row.prize_goal_cents === "number" ? row.prize_goal_cents : null,
    prizeRaisedCents: typeof row.prize_raised_cents === "number" ? row.prize_raised_cents : null,
    prizeUpdatedAt: (row.prize_updated_at as string | null) ?? null,
    players: (entries ?? []).map((entry) => ({
      id: entry.id as string,
      profileId: (entry.profile_id as string) || "",
      name: entryAlias(entry.display_name),
      logoUrl: championshipAssetUrl(entry.logo_path as string | null),
    })),
    fixtures: (fixtures ?? []).map((fixture) => ({
      id: fixture.id as string,
      roundLabel: fixture.round_label as string,
      scheduledAt: (fixture.scheduled_at as string | null) ?? null,
      status: fixture.status === "finished" || fixture.status === "cancelled" ? fixture.status : "scheduled",
      playerAId: (fixture.player_a_entry_id as string | null) ?? null,
      playerBId: (fixture.player_b_entry_id as string | null) ?? null,
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
      stageId: (fixture.stage_id as string | null) ?? null,
      section:
        fixture.section === "group" ||
        fixture.section === "winners" ||
        fixture.section === "losers" ||
        fixture.section === "grand_final"
          ? fixture.section
          : null,
      roundIndex: typeof fixture.round_index === "number" ? fixture.round_index : null,
      slotIndex: typeof fixture.slot_index === "number" ? fixture.slot_index : null,
      groupIndex: typeof fixture.group_index === "number" ? fixture.group_index : null,
      seriesLength: typeof fixture.series_length === "number" ? fixture.series_length : null,
      feederA: (fixture.feeder_a as string | null) ?? null,
      feederB: (fixture.feeder_b as string | null) ?? null,
      isBye: Boolean(fixture.is_bye),
      isHidden: Boolean(fixture.is_hidden),
    })),
    stages: stages.map((stage) => ({
      id: stage.id as string,
      position: stage.position as number,
      name: (stage.name as string) || "Fase",
      format:
        stage.format === "groups" || stage.format === "double_elim"
          ? (stage.format as ChampionshipStageFormat)
          : "single_elim",
      seriesLength: (stage.series_length === 5 || stage.series_length === 7 ? stage.series_length : 3) as 3 | 5 | 7,
      groupSize: typeof stage.group_size === "number" ? stage.group_size : null,
      advanceCount: typeof stage.advance_count === "number" ? stage.advance_count : null,
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
    logo_path: steamAvatarLogoPath(input.logoPath),
  });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const };
}
