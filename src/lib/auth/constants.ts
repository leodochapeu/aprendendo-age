export const MIN_PASSWORD_LENGTH = 6;
export const SIGNUP_APP = "aprendendo-age";

export const USER_ROLES = ["admin", "streamer", "moderator", "guest", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function parseUserRole(value: string | null | undefined): UserRole {
  if (value === "admin" || value === "streamer" || value === "moderator" || value === "guest" || value === "user") {
    return value;
  }
  return "guest";
}

/** Quem pode enviar solicitação de vídeo da comunidade. */
export function canRequestCommunityVideo(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "streamer";
}

/** Quem pode disparar, editar e excluir um aviso do site. */
export function canSendSiteNotification(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "streamer" || role === "moderator";
}

/** Quem configura a sincronização do Instagram. Moderador fica de fora. */
export function canSyncInstagram(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "streamer";
}

/** Quem pode sugerir alteração de texto nas páginas. */
export function canSuggestPageChange(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "moderator";
}

/** Quem pode cadastrar canais em Links (admin). */
export function canManageChannels(role: UserRole | null | undefined): boolean {
  return role === "admin";
}
