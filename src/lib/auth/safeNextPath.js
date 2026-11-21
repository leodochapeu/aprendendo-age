/** Evita open redirect no parâmetro `next`. */
export function safeNextPath(next, fallback = "/") {
    const raw = (next ?? fallback).trim();
    if (!raw.startsWith("/") || raw.startsWith("//"))
        return fallback;
    return raw;
}
