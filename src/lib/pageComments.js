export const PAGE_COMMENT_SYSTEM = "aprendendo-age";
export const PAGE_COMMENT_PAGE_SIZE = 5;
export const COMMENT_ERROR_CODES = [
    "comment_too_short",
    "comment_too_long",
    "comment_repeated",
    "comment_cooldown",
    "comment_duplicate",
    "comment_hourly_limit",
    "comment_invalid_quote",
];
export function commentErrorCode(message) {
    if (!message)
        return null;
    return COMMENT_ERROR_CODES.find((code) => message.includes(code)) ?? null;
}
