export function getSupabaseEnv() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url?.trim() || !anonKey?.trim())
        return null;
    try {
        const parsed = new URL(url.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
            return null;
    }
    catch {
        return null;
    }
    return { url: url.trim(), anonKey: anonKey.trim() };
}
export function isSupabaseConfigured() {
    return getSupabaseEnv() != null;
}
