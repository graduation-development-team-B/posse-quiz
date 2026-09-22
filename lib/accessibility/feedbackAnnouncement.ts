export interface FeedbackAnnouncementInput {
  isCorrect: boolean;
  correctText: string;
}

/** Builds the single sentence announced when feedback becomes available. */
export function getFeedbackAnnouncement({
  isCorrect,
  correctText,
}: FeedbackAnnouncementInput): string {
  return `${isCorrect ? '✓ 正解' : '× 誤り'}。正解: ${correctText}`;
}
