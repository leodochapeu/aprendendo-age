/** URL pública do logo do clã (`logo_path` no Supabase). */
export function getClanLogoUrl(clan) {
    const path = clan.logoPath?.trim();
    return path || undefined;
}
