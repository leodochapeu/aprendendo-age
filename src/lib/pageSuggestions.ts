export const PAGE_SUGGESTION_SYSTEM = "aprendendo-age";

export const PAGE_SUGGESTION_TAGS = ["bug", "improvement", "adjustment", "suggestion"] as const;
export type PageSuggestionTag = (typeof PAGE_SUGGESTION_TAGS)[number];

export type PageSuggestion = {
  id: string;
  system: string;
  pagePath: string;
  pageTitle: string | null;
  section: string | null;
  body: string;
  tag: PageSuggestionTag;
  authorName: string;
  createdBy: string;
  createdAt: string;
};

export function isPageSuggestionTag(value: string): value is PageSuggestionTag {
  return (PAGE_SUGGESTION_TAGS as readonly string[]).includes(value);
}
