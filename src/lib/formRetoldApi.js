const FORM_RETOLD_ORIGIN = import.meta.env.VITE_FORM_RETOLD_ORIGIN ?? "https://form-retold.vercel.app";
// Chave de API do app "aprendendo-age-web" registrada em
// `form-retold/backend/authorizedApps.json`. A protecao real nao vem da chave
// estar escondida (ela vai parar no bundle), mas sim do servidor validar o
// `Origin` da requisicao contra a lista permitida desse app. Para rotacionar:
// no repositorio `form-retold` rodar `npm run keys -- rotate aprendendo-age-web`
// e atualizar `VITE_FORM_RETOLD_API_KEY` no Vercel/`.env.local`.
const FORM_RETOLD_API_KEY = import.meta.env.VITE_FORM_RETOLD_API_KEY ??
    "aprendendoage_01eb7e465ba25afa7a9740082306ba9db82d5cd6529b4e59";
function buildHeaders(extra) {
    const headers = new Headers(extra);
    if (FORM_RETOLD_API_KEY)
        headers.set("X-API-Key", FORM_RETOLD_API_KEY);
    return headers;
}
function apiFetch(input, init) {
    return fetch(input, { ...init, headers: buildHeaders(init?.headers) });
}
export class AmbiguousPlayerError extends Error {
    profiles;
    constructor(profiles) {
        super("Vários jogadores encontrados para essa pesquisa.");
        this.name = "AmbiguousPlayerError";
        this.profiles = profiles;
    }
}
function statsUrl(playerName) {
    return `${FORM_RETOLD_ORIGIN}/api/stats/${encodeURIComponent(playerName.trim())}`;
}
function statsByIdUrl(profileId) {
    return `${FORM_RETOLD_ORIGIN}/api/stats-by-id/${profileId}`;
}
function searchPlayersUrl(playerName) {
    return `${FORM_RETOLD_ORIGIN}/api/search-players/${encodeURIComponent(playerName.trim())}`;
}
function godsUrl(profileId) {
    return `${FORM_RETOLD_ORIGIN}/api/gods/${profileId}`;
}
export async function searchPlayersByName(playerName) {
    const res = await apiFetch(searchPlayersUrl(playerName));
    const body = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : `Não foi possível pesquisar jogadores (${res.status}).`;
        throw new Error(msg);
    }
    if (body && typeof body === "object" && "profiles" in body && Array.isArray(body.profiles)) {
        return body.profiles;
    }
    return [];
}
export async function fetchPlayerStatsByProfileId(profileId) {
    const res = await apiFetch(statsByIdUrl(profileId));
    const body = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : `Não foi possível carregar o jogador (${res.status}).`;
        throw new Error(msg);
    }
    return body;
}
export async function fetchPlayerStats(playerName) {
    const res = await apiFetch(statsUrl(playerName));
    const body = await res.json().catch(() => null);
    if (res.status === 409 && body && typeof body === "object" && "profiles" in body) {
        const raw = body.profiles;
        if (Array.isArray(raw)) {
            throw new AmbiguousPlayerError(raw);
        }
    }
    if (!res.ok) {
        const msg = body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : `Não foi possível carregar o jogador (${res.status}).`;
        throw new Error(msg);
    }
    return body;
}
export async function fetchGodStats(profileId) {
    const res = await apiFetch(godsUrl(profileId));
    const body = await res.json().catch(() => null);
    if (!res.ok) {
        return [];
    }
    if (Array.isArray(body)) {
        return body;
    }
    if (body && typeof body === "object" && "majorGodsStats" in body && Array.isArray(body.majorGodsStats)) {
        return body.majorGodsStats;
    }
    return [];
}
/** Entrada de Sup 1v1 (mesma lógica do form-retold). */
export function pickSup1v1Row(stats) {
    if (!stats?.length)
        return undefined;
    return stats.find((s) => /sup\s*1v1/i.test(s.mode)) ?? stats[0];
}
export function parseElo(elo) {
    if (elo == null || elo === "")
        return undefined;
    const n = Number.parseInt(String(elo), 10);
    return Number.isFinite(n) ? n : undefined;
}
