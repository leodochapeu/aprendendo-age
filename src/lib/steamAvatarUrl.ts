const STEAM_AVATARS_PREFIX = "https://avatars.steamstatic.com/";

/**
 * Hash do avatar padrão da Steam (a interrogação "?"), que o AoM Stats devolve
 * quando o jogador não tem foto. Vale para `_medium`, `_full` e outros CDNs.
 */
const STEAM_PLACEHOLDER_AVATAR_HASH = "fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb";

export const DEFAULT_PLAYER_AVATAR_SRC = "/assets/campeonatos/sem_avatar.png";

/** Disco atrás do ícone padrão quando não há rank. O PNG é transparente. */
export const DEFAULT_PLAYER_AVATAR_DISC =
  "radial-gradient(circle at 38% 32%, #6b5344 0%, #2a1c12 62%, #120e0b 100%)";

export function isSteamPlaceholderAvatar(url: string | null | undefined): boolean {
  return (url?.trim().toLowerCase() ?? "").includes(STEAM_PLACEHOLDER_AVATAR_HASH);
}

/** Vazio, interrogação da Steam, ou o próprio ícone padrão. */
export function isDefaultPlayerAvatarSrc(url: string | null | undefined): boolean {
  const t = url?.trim() ?? "";
  if (!t || isSteamPlaceholderAvatar(t)) return true;
  return t === DEFAULT_PLAYER_AVATAR_SRC || t.endsWith("/campeonatos/sem_avatar.png");
}

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

/** Avatar para `<img>`: vazio ou interrogação da Steam viram o ícone padrão. */
export function resolvePlayerAvatarSrc(url: string | null | undefined): string {
  const t = url?.trim() ?? "";
  if (!t || isSteamPlaceholderAvatar(t)) return DEFAULT_PLAYER_AVATAR_SRC;
  return upgradeSteamStaticAvatarUrl(t);
}

/**
 * Valor para gravar em `logo_path`: Steam `_medium` vira `_full`.
 * Vazio e a interrogação padrão não são persistidos.
 */
export function steamAvatarLogoPath(url: string | null | undefined): string | null {
  const trimmed = url?.trim() ?? "";
  if (!trimmed || isDefaultPlayerAvatarSrc(trimmed)) return null;
  return upgradeSteamStaticAvatarUrl(trimmed);
}
