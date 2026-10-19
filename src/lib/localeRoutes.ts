import type { Locale } from "@/i18n/types";

/** Seções de catálogo com listagem + detalhe por slug. */
export type LocaleSection =
  | "panteoes"
  | "deuses"
  | "eras"
  | "poderes"
  | "construcoes"
  | "unidades"
  | "aldeoes"
  | "mapas"
  | "reliquias"
  | "tecnologias"
  | "starts";

export type AuthSection = "login" | "register" | "profile";

export type PlayersSection = "jogadores";

const PLAYER_PROFILE_SEGMENT: Record<Locale, string> = {
  pt: "jogador",
  en: "player",
};

const PLAYERS_SEGMENT: Record<Locale, string> = {
  pt: "jogadores-aom",
  en: "aom-players",
};

const SECTION_SEGMENT: Record<Locale, Record<LocaleSection, string>> = {
  pt: {
    panteoes: "panteoes",
    deuses: "deuses",
    eras: "eras",
    poderes: "poderes",
    construcoes: "construcoes",
    unidades: "unidades",
    aldeoes: "aldeoes",
    mapas: "mapas",
    reliquias: "reliquias",
    tecnologias: "tecnologias",
    starts: "starts",
  },
  en: {
    panteoes: "pantheons",
    deuses: "gods",
    eras: "ages",
    poderes: "god-powers",
    construcoes: "buildings",
    unidades: "units",
    aldeoes: "villagers",
    mapas: "maps",
    reliquias: "relics",
    tecnologias: "technologies",
    starts: "starts",
  },
};

const NOTIFICATION_LIST_SEGMENT: Record<Locale, string> = {
  pt: "notificacoes",
  en: "notifications",
};

const NOTIFICATION_COMPOSE_SEGMENT: Record<Locale, string> = {
  pt: "enviar",
  en: "send",
};

const AUTH_SEGMENT: Record<Locale, Record<AuthSection, string>> = {
  pt: {
    login: "entrar",
    register: "cadastro",
    profile: "perfil",
  },
  en: {
    login: "login",
    register: "register",
    profile: "profile",
  },
};

const SEGMENT_TO_SECTION = new Map<string, LocaleSection>(
  (["pt", "en"] as Locale[]).flatMap((locale) =>
    (Object.entries(SECTION_SEGMENT[locale]) as [LocaleSection, string][]).map(([section, segment]) => [
      segment,
      section,
    ]),
  ),
);

const SEGMENT_TO_AUTH = new Map<string, AuthSection>(
  (["pt", "en"] as Locale[]).flatMap((locale) =>
    (Object.entries(AUTH_SEGMENT[locale]) as [AuthSection, string][]).map(([section, segment]) => [
      segment,
      section,
    ]),
  ),
);

export function localeSectionSegment(locale: Locale, section: LocaleSection): string {
  return SECTION_SEGMENT[locale][section];
}

export function localePlayersPath(locale: Locale): string {
  return `/${PLAYERS_SEGMENT[locale]}`;
}

export function playersSectionFromPathSegment(segment: string): PlayersSection | undefined {
  if (segment === PLAYERS_SEGMENT.pt || segment === PLAYERS_SEGMENT.en) return "jogadores";
  return undefined;
}

export function localeAuthSegment(locale: Locale, section: AuthSection): string {
  return AUTH_SEGMENT[locale][section];
}

/** Path de listagem ou detalhe (`/tecnologias` ou `/technologies/labirinto-de-minos`). Slugs permanecem PT-canônicos. */
export function localeSectionPath(locale: Locale, section: LocaleSection, slug?: string | number): string {
  const base = `/${localeSectionSegment(locale, section)}`;
  if (slug == null || slug === "") return base;
  return `${base}/${slug}`;
}

export function localeAuthPath(locale: Locale, section: AuthSection): string {
  return `/${localeAuthSegment(locale, section)}`;
}

export function localeNotificationsPath(locale: Locale): string {
  return `/${NOTIFICATION_LIST_SEGMENT[locale]}`;
}

export function localeNotificationComposePath(locale: Locale): string {
  return `${localeNotificationsPath(locale)}/${NOTIFICATION_COMPOSE_SEGMENT[locale]}`;
}

export function allSectionPathSegments(section: LocaleSection): string[] {
  return [SECTION_SEGMENT.pt[section], SECTION_SEGMENT.en[section]];
}

export function allAuthPathSegments(section: AuthSection): string[] {
  return [AUTH_SEGMENT.pt[section], AUTH_SEGMENT.en[section]];
}

export function sectionFromPathSegment(segment: string): LocaleSection | undefined {
  return SEGMENT_TO_SECTION.get(segment);
}

export function authSectionFromPathSegment(segment: string): AuthSection | undefined {
  return SEGMENT_TO_AUTH.get(segment);
}

/** Converte path entre PT/EN preservando slug e query (ex.: `/technologies/foo` → `/tecnologias/foo`). */
export function swapLocaleInPath(pathname: string, toLocale: Locale): string {
  const q = pathname.indexOf("?");
  const pathOnly = q === -1 ? pathname : pathname.slice(0, q);
  const search = q === -1 ? "" : pathname.slice(q);
  const parts = pathOnly.split("/").filter(Boolean);
  if (parts.length === 0) return `/${search}`;

  const playersSection = playersSectionFromPathSegment(parts[0]!);
  if (playersSection) {
    const fromLocale: Locale = toLocale === "pt" ? "en" : "pt";
    if (parts[0] === PLAYERS_SEGMENT[fromLocale]) {
      parts[0] = PLAYERS_SEGMENT[toLocale];
      return `/${parts.join("/")}${search}`;
    }
    return `${pathname}`;
  }

  const fromLocaleProfile: Locale = toLocale === "pt" ? "en" : "pt";
  if (parts[0] === PLAYER_PROFILE_SEGMENT[fromLocaleProfile]) {
    parts[0] = PLAYER_PROFILE_SEGMENT[toLocale];
    return `/${parts.join("/")}${search}`;
  }

  const authSection = authSectionFromPathSegment(parts[0]!);
  if (authSection) {
    const fromLocale: Locale = toLocale === "pt" ? "en" : "pt";
    if (parts[0] === AUTH_SEGMENT[fromLocale][authSection]) {
      parts[0] = AUTH_SEGMENT[toLocale][authSection];
      return `/${parts.join("/")}${search}`;
    }
    return `${pathname}`;
  }

  const notificationLocale = (["pt", "en"] as const).find((item) => parts[0] === NOTIFICATION_LIST_SEGMENT[item]);
  if (notificationLocale) {
    if (notificationLocale !== toLocale) {
      parts[0] = NOTIFICATION_LIST_SEGMENT[toLocale];
      if (parts[1] === NOTIFICATION_COMPOSE_SEGMENT[notificationLocale]) {
        parts[1] = NOTIFICATION_COMPOSE_SEGMENT[toLocale];
      }
    }
    return `/${parts.join("/")}${search}`;
  }

  const section = sectionFromPathSegment(parts[0]!);
  if (!section) return `${pathname}`;

  const fromLocale: Locale = toLocale === "pt" ? "en" : "pt";
  if (parts[0] !== SECTION_SEGMENT[fromLocale][section]) return `${pathname}`;

  parts[0] = SECTION_SEGMENT[toLocale][section];
  return `/${parts.join("/")}${search}`;
}
