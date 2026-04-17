export function isIndegeneEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@indegene.com");
}

const VALID_COMMENT_TYPES = ["Question", "Suggestion", "Request"] as const;
export type CommentType = (typeof VALID_COMMENT_TYPES)[number];

export function isValidCommentType(type: string): type is CommentType {
  return VALID_COMMENT_TYPES.includes(type as CommentType);
}
