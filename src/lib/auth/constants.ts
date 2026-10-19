export const MIN_PASSWORD_LENGTH = 6;
export const SIGNUP_APP = "aprendendo-age";

export const USER_ROLES = ["admin", "streamer", "guest", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function parseUserRole(value: string | null | undefined): UserRole {
  if (value === "admin" || value === "streamer" || value === "guest" || value === "user") {
    return value;
  }
  return "guest";
}

/** Quem pode enviar solicitação de vídeo da comunidade. */
export function canRequestCommunityVideo(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "streamer";
}

/** Quem pode disparar um aviso para todo mundo que acessa o site. */
export function canSendSiteNotification(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "streamer";
}

/** Quem pode cadastrar canais em Links (admin). */
export function canManageChannels(role: UserRole | null | undefined): boolean {
  return role === "admin";
}
