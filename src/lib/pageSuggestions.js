export const PAGE_SUGGESTION_SYSTEM = "aprendendo-age";
export const PAGE_SUGGESTION_TAGS = ["bug", "improvement", "adjustment", "suggestion"];
export function isPageSuggestionTag(value) {
    return PAGE_SUGGESTION_TAGS.includes(value);
}
