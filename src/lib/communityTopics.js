import { COMMENT_ERROR_CODES, commentErrorCode } from "@/lib/pageComments";
export const TOPIC_CATEGORIES = ["game", "bug", "matches", "mods", "news", "championships", "other"];
export const TOPIC_PAGE_SIZE = 10;
export const TOPIC_POST_PAGE_SIZE = 10;
const TOPIC_ERROR_CODES = [...COMMENT_ERROR_CODES, "topic_closed", "topic_title_short", "topic_invalid_category"];
export function isTopicCategory(value) {
    return TOPIC_CATEGORIES.includes(value);
}
export function isTopicStatus(value) {
    return value === "open" || value === "locked" || value === "archived";
}
export function topicErrorCode(message) {
    if (!message)
        return null;
    const topic = TOPIC_ERROR_CODES.find((code) => message.includes(code));
    return topic ?? commentErrorCode(message);
}
