import { describe, expect, it } from 'vitest';

import { getFeedbackAnnouncement } from '@/lib/accessibility/feedbackAnnouncement';

describe('feedback accessibility announcements', () => {
  it('includes a non-color result label and the correct answer', () => {
    expect(getFeedbackAnnouncement({ isCorrect: true, correctText: 'justify-content' })).toBe(
      '✓ 正解。正解: justify-content',
    );
    expect(getFeedbackAnnouncement({ isCorrect: false, correctText: 'align-items' })).toBe(
      '× 誤り。正解: align-items',
    );
  });
});
