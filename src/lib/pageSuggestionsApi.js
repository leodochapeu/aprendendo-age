import { createSupabaseClient } from "@/lib/supabase/client";
import { isPageSuggestionTag, PAGE_SUGGESTION_SYSTEM, } from "@/lib/pageSuggestions";
const COLUMNS = "id, system, page_path, page_title, section, body, tag, author_name, created_by, created_at";
function mapRow(row) {
    if (!isPageSuggestionTag(row.tag))
        return null;
    return {
        id: row.id,
        system: row.system,
        pagePath: row.page_path,
        pageTitle: row.page_title,
        section: row.section,
        body: row.body,
        tag: row.tag,
        authorName: row.author_name,
        createdBy: row.created_by,
        createdAt: row.created_at,
    };
}
export async function createPageSuggestion(input) {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const section = input.section?.trim() || null;
    const { error } = await supabase.from("page_suggestions").insert({
        system: PAGE_SUGGESTION_SYSTEM,
        page_path: input.pagePath.slice(0, 500),
        page_title: input.pageTitle?.trim().slice(0, 200) || null,
        section: section ? section.slice(0, 200) : null,
        body: input.body.trim().slice(0, 4000),
        tag: input.tag,
        author_name: input.authorName.trim().slice(0, 80) || "Usuário",
        created_by: input.createdBy,
    });
    if (error)
        return { ok: false, reason: "save" };
    return { ok: true, data: null };
}
export async function fetchPageSuggestions() {
    const supabase = createSupabaseClient();
    if (!supabase)
        return { ok: false, reason: "unconfigured" };
    const { data, error } = await supabase.from("page_suggestions").select(COLUMNS).order("created_at", { ascending: false }).limit(200);
    if (error)
        return { ok: false, reason: "load" };
    const items = data?.flatMap((row) => {
        const mapped = mapRow(row);
        return mapped ? [mapped] : [];
    }) ?? [];
    return { ok: true, data: items };
}
