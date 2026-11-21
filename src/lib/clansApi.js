import { createSupabasePublicClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
const CLAN_SELECT = "id, name, tag, logo_path, origin";
const CLAN_SELECT_LEGACY = "id, name, tag, logo_path";
function mapRow(row) {
    return {
        id: row.id,
        name: row.name,
        tag: row.tag,
        logoPath: row.logo_path,
        origin: row.origin?.trim().toLowerCase() || null,
    };
}
/** Busca um clã pela sigla na rota (`caok` → tag `CaOK`). */
export async function fetchClanBySlug(slug) {
    if (!isSupabaseConfigured())
        return null;
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return null;
    const normalized = slug.trim();
    if (!normalized)
        return null;
    const first = await supabase.from("clans").select(CLAN_SELECT).ilike("tag", normalized).maybeSingle();
    const missingOrigin = first.error && /origin/i.test(first.error.message);
    const result = missingOrigin
        ? await supabase.from("clans").select(CLAN_SELECT_LEGACY).ilike("tag", normalized).maybeSingle()
        : first;
    if (result.error)
        throw new Error(result.error.message);
    if (!result.data)
        return null;
    return mapRow(result.data);
}
async function selectClans(supabase, columns, origin) {
    let query = supabase.from("clans").select(columns).order("name", { ascending: true });
    if (origin)
        query = query.eq("origin", origin);
    return query;
}
/**
 * Lista clãs cadastrados no Supabase.
 * `origin` filtra pelo país salvo (ex.: `"br"` no menu público).
 * Sem filtro, devolve todos — o vínculo por sigla precisa enxergar clãs de fora.
 */
export async function fetchClans(options) {
    if (!isSupabaseConfigured())
        return [];
    const supabase = createSupabasePublicClient();
    if (!supabase)
        return [];
    const filtered = await selectClans(supabase, CLAN_SELECT, options?.origin);
    if (!filtered.error) {
        return (filtered.data ?? []).map((row) => mapRow(row));
    }
    const missingOrigin = /origin/i.test(filtered.error.message);
    if (!missingOrigin)
        throw new Error(filtered.error.message);
    const legacy = await selectClans(supabase, CLAN_SELECT_LEGACY);
    if (legacy.error)
        throw new Error(legacy.error.message);
    return (legacy.data ?? []).map((row) => mapRow(row));
}
export function matchClanIdByAomstatsTag(clans, tag) {
    const normalized = tag?.trim().toUpperCase();
    if (!normalized)
        return null;
    return clans.find((clan) => clan.tag.trim().toUpperCase() === normalized)?.id ?? null;
}
/** Resolve `clan_id` comparando a sigla do AoM Stats com `public.clans.tag`. */
export async function resolveClanIdByAomstatsTag(tag) {
    const normalized = tag?.trim();
    if (!normalized)
        return null;
    const clans = await fetchClans();
    return matchClanIdByAomstatsTag(clans, normalized);
}
