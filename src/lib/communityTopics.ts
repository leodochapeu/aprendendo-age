import { COMMENT_ERROR_CODES, commentErrorCode, type CommentErrorCode } from "@/lib/pageComments";

export const TOPIC_CATEGORIES = ["game", "bug", "matches", "mods", "news", "championships", "other"] as const;
export const TOPIC_PAGE_SIZE = 10;
export const TOPIC_POST_PAGE_SIZE = 10;

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];
export type TopicStatus = "open" | "locked" | "archived";

const TOPIC_ERROR_CODES = [...COMMENT_ERROR_CODES, "topic_closed", "topic_title_short", "topic_invalid_category"] as const;
export type TopicErrorCode = (typeof TOPIC_ERROR_CODES)[number] | CommentErrorCode;

export type CommunityTopic = {
  id: string;
  title: string;
  slug: string;
  category: TopicCategory;
  status: TopicStatus;
  statusReason: string | null;
  postCount: number;
  authorName: string;
  authorLogo: string | null;
  createdBy: string;
  createdAt: string;
  lastPostAt: string;
};

export type SimilarTopic = {
  id: string;
  title: string;
  slug: string;
  category: TopicCategory;
  status: TopicStatus;
};

export type TopicPost = {
  id: string;
  topicId: string;
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

export function isTopicCategory(value: string): value is TopicCategory {
  return (TOPIC_CATEGORIES as readonly string[]).includes(value);
}

export function isTopicStatus(value: string): value is TopicStatus {
  return value === "open" || value === "locked" || value === "archived";
}

export function topicErrorCode(message: string | undefined): TopicErrorCode | null {
  if (!message) return null;
  const topic = TOPIC_ERROR_CODES.find((code) => message.includes(code));
  return topic ?? commentErrorCode(message);
}
