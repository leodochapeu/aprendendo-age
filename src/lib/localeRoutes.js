const PLAYER_PROFILE_SEGMENT = {
    pt: "jogador",
    en: "player",
};
const PLAYERS_SEGMENT = {
    pt: "jogadores-aom",
    en: "aom-players",
};
const SECTION_SEGMENT = {
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
const NOTIFICATION_LIST_SEGMENT = {
    pt: "notificacoes",
    en: "notifications",
};
const NOTIFICATION_COMPOSE_SEGMENT = {
    pt: "enviar",
    en: "send",
};
const NOTIFICATION_MANAGE_SEGMENT = {
    pt: "gerenciar",
    en: "manage",
};
const NOTIFICATION_SHOWCASE_SEGMENT = {
    pt: "apresentacao",
    en: "presentation",
};
const SUGGESTIONS_SEGMENT = {
    pt: "sugestoes",
    en: "suggestions",
};
const MODERATION_SEGMENT = {
    pt: "moderacao",
    en: "moderation",
};
const COMMUNITY_TOPICS_SEGMENT = {
    pt: "comunidade",
    en: "community",
};
const AUTH_SEGMENT = {
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
const SEGMENT_TO_SECTION = new Map(["pt", "en"].flatMap((locale) => Object.entries(SECTION_SEGMENT[locale]).map(([section, segment]) => [
    segment,
    section,
])));
const SEGMENT_TO_AUTH = new Map(["pt", "en"].flatMap((locale) => Object.entries(AUTH_SEGMENT[locale]).map(([section, segment]) => [
    segment,
    section,
])));
export function localeSectionSegment(locale, section) {
    return SECTION_SEGMENT[locale][section];
}
export function localePlayersPath(locale) {
    return `/${PLAYERS_SEGMENT[locale]}`;
}
export function playersSectionFromPathSegment(segment) {
    if (segment === PLAYERS_SEGMENT.pt || segment === PLAYERS_SEGMENT.en)
        return "jogadores";
    return undefined;
}
export function localeAuthSegment(locale, section) {
    return AUTH_SEGMENT[locale][section];
}
/** Path de listagem ou detalhe (`/tecnologias` ou `/technologies/labirinto-de-minos`). Slugs permanecem PT-canônicos. */
export function localeSectionPath(locale, section, slug) {
    const base = `/${localeSectionSegment(locale, section)}`;
    if (slug == null || slug === "")
        return base;
    return `${base}/${slug}`;
}
/** Índice de deuses, unidades e starts de um panteão (`/panteoes/astecas/indice`). */
export function localePantheonIndexPath(locale, slug) {
    return `${localeSectionPath(locale, "panteoes", slug)}/indice`;
}
export function localeAuthPath(locale, section) {
    return `/${localeAuthSegment(locale, section)}`;
}
export function localeNotificationsPath(locale) {
    return `/${NOTIFICATION_LIST_SEGMENT[locale]}`;
}
export function localeNotificationComposePath(locale, id) {
    const base = `${localeNotificationsPath(locale)}/${NOTIFICATION_COMPOSE_SEGMENT[locale]}`;
    return id ? `${base}/${id}` : base;
}
export function localeNotificationManagePath(locale) {
    return `${localeNotificationsPath(locale)}/${NOTIFICATION_MANAGE_SEGMENT[locale]}`;
}
export function localeNotificationShowcasePath(locale) {
    return `${localeNotificationsPath(locale)}/${NOTIFICATION_SHOWCASE_SEGMENT[locale]}`;
}
export function localeSuggestionsPath(locale) {
    return `/${SUGGESTIONS_SEGMENT[locale]}`;
}
export function localeModerationPath(locale, tab) {
    const base = `/${MODERATION_SEGMENT[locale]}`;
    return tab ? `${base}?tab=${tab}` : base;
}
export function localeCommunityTopicsPath(locale, slug) {
    const base = `/${COMMUNITY_TOPICS_SEGMENT[locale]}`;
    return slug ? `${base}/${slug}` : base;
}
export function allSectionPathSegments(section) {
    return [SECTION_SEGMENT.pt[section], SECTION_SEGMENT.en[section]];
}
export function allAuthPathSegments(section) {
    return [AUTH_SEGMENT.pt[section], AUTH_SEGMENT.en[section]];
}
export function sectionFromPathSegment(segment) {
    return SEGMENT_TO_SECTION.get(segment);
}
export function authSectionFromPathSegment(segment) {
    return SEGMENT_TO_AUTH.get(segment);
}
/** Converte path entre PT/EN preservando slug e query (ex.: `/technologies/foo` → `/tecnologias/foo`). */
export function swapLocaleInPath(pathname, toLocale) {
    const q = pathname.indexOf("?");
    const pathOnly = q === -1 ? pathname : pathname.slice(0, q);
    const search = q === -1 ? "" : pathname.slice(q);
    const parts = pathOnly.split("/").filter(Boolean);
    if (parts.length === 0)
        return `/${search}`;
    const playersSection = playersSectionFromPathSegment(parts[0]);
    if (playersSection) {
        const fromLocale = toLocale === "pt" ? "en" : "pt";
        if (parts[0] === PLAYERS_SEGMENT[fromLocale]) {
            parts[0] = PLAYERS_SEGMENT[toLocale];
            return `/${parts.join("/")}${search}`;
        }
        return `${pathname}`;
    }
    const fromLocaleProfile = toLocale === "pt" ? "en" : "pt";
    if (parts[0] === PLAYER_PROFILE_SEGMENT[fromLocaleProfile]) {
        parts[0] = PLAYER_PROFILE_SEGMENT[toLocale];
        return `/${parts.join("/")}${search}`;
    }
    const authSection = authSectionFromPathSegment(parts[0]);
    if (authSection) {
        const fromLocale = toLocale === "pt" ? "en" : "pt";
        if (parts[0] === AUTH_SEGMENT[fromLocale][authSection]) {
            parts[0] = AUTH_SEGMENT[toLocale][authSection];
            return `/${parts.join("/")}${search}`;
        }
        return `${pathname}`;
    }
    if (parts[0] === SUGGESTIONS_SEGMENT.pt || parts[0] === SUGGESTIONS_SEGMENT.en) {
        parts[0] = SUGGESTIONS_SEGMENT[toLocale];
        return `/${parts.join("/")}${search}`;
    }
    if (parts[0] === MODERATION_SEGMENT.pt || parts[0] === MODERATION_SEGMENT.en) {
        parts[0] = MODERATION_SEGMENT[toLocale];
        return `/${parts.join("/")}${search}`;
    }
    if (parts[0] === COMMUNITY_TOPICS_SEGMENT.pt || parts[0] === COMMUNITY_TOPICS_SEGMENT.en) {
        parts[0] = COMMUNITY_TOPICS_SEGMENT[toLocale];
        return `/${parts.join("/")}${search}`;
    }
    const notificationLocale = ["pt", "en"].find((item) => parts[0] === NOTIFICATION_LIST_SEGMENT[item]);
    if (notificationLocale) {
        if (notificationLocale !== toLocale) {
            parts[0] = NOTIFICATION_LIST_SEGMENT[toLocale];
            if (parts[1] === NOTIFICATION_COMPOSE_SEGMENT[notificationLocale]) {
                parts[1] = NOTIFICATION_COMPOSE_SEGMENT[toLocale];
            }
            else if (parts[1] === NOTIFICATION_MANAGE_SEGMENT[notificationLocale]) {
                parts[1] = NOTIFICATION_MANAGE_SEGMENT[toLocale];
            }
            else if (parts[1] === NOTIFICATION_SHOWCASE_SEGMENT[notificationLocale]) {
                parts[1] = NOTIFICATION_SHOWCASE_SEGMENT[toLocale];
            }
        }
        return `/${parts.join("/")}${search}`;
    }
    const section = sectionFromPathSegment(parts[0]);
    if (!section)
        return `${pathname}`;
    const fromLocale = toLocale === "pt" ? "en" : "pt";
    if (parts[0] !== SECTION_SEGMENT[fromLocale][section])
        return `${pathname}`;
    parts[0] = SECTION_SEGMENT[toLocale][section];
    return `/${parts.join("/")}${search}`;
}
