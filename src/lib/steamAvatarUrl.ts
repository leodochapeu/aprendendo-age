const STEAM_AVATARS_PREFIX = "https://avatars.steamstatic.com/";

/**
 * URLs do Steam em `avatars.steamstatic.com` vêm frequentemente como `_medium`;
 * trocar por `_full` melhora a resolução. Só aplica quando o host e o sufixo batem.
 */
export function upgradeSteamStaticAvatarUrl(url: string): string {
  const t = url.trim();
  if (!t) return t;
  if (!t.toLowerCase().startsWith(STEAM_AVATARS_PREFIX)) return t;
  return t.replace(/_medium(\.[a-z0-9]+)$/i, "_full$1");
}

/** Valor para gravar em `logo_path`: Steam `_medium` vira `_full`; vazio vira null. */
export function steamAvatarLogoPath(url: string | null | undefined): string | null {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return null;
  return upgradeSteamStaticAvatarUrl(trimmed);
}
