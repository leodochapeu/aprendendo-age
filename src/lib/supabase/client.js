import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
let browserClient;
let publicClient;
export function createSupabaseClient() {
    const env = getSupabaseEnv();
    if (!env)
        return null;
    if (browserClient)
        return browserClient;
    browserClient = createClient(env.url, env.anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
    return browserClient;
}
/** Cliente sem sessão — leituras públicas (ex.: Corrida AoM) sem esperar auth. */
export function createSupabasePublicClient() {
    const env = getSupabaseEnv();
    if (!env)
        return null;
    if (publicClient)
        return publicClient;
    publicClient = createClient(env.url, env.anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            // Evita conflito com o cliente principal (mesmo storage key → warning GoTrueClient).
            storageKey: `aprendendo-age-public-${env.url.replace(/\W/g, "").slice(-32)}`,
        },
    });
    return publicClient;
}
