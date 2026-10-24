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
] as const;

export type CommentErrorCode = (typeof COMMENT_ERROR_CODES)[number];

export type PageComment = {
  id: string;
  system: string;
  pageKind: string;
  pageKey: string;
  pageTitle: string;
  body: string;
  replyTo: string | null;
  replyExcerpt: string | null;
  replyAuthorName: string | null;
  authorName: string;
  authorLogo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  likeCount: number;
  likedByMe: boolean;
  reportedByMe: boolean;
};

export type CommentReport = {
  id: string;
  commentId: string;
  reporterName: string;
  createdAt: string;
  body: string;
  authorName: string;
  pageKind: string;
  pageKey: string;
  pageTitle: string;
  commentCreatedAt: string;
};

export function commentErrorCode(message: string | undefined): CommentErrorCode | null {
  if (!message) return null;
  return COMMENT_ERROR_CODES.find((code) => message.includes(code)) ?? null;
}
