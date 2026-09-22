import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { DEFAULT_QUESTION_COUNT } from '@/lib/constants';
import { createSeededRandom } from '@/lib/quiz/random';
import {
  createReviewSession,
  normalizeQuestionCount,
} from '@/lib/quiz/sessionManager';
import { assertProperty } from '@/tests/pbt';
import type { QuestionItem, WeekKey } from '@/types/content';
import type { ReviewEntry } from '@/types/progress';

const BASE_TIMESTAMP = Date.parse('2025-01-01T00:00:00.000Z');
const weekKeyArb: fc.Arbitrary<WeekKey> = fc.constantFrom('week3', 'week4', 'week5', 'week6');

function timestampFromOffset(offset: number): string {
  return new Date(BASE_TIMESTAMP + offset).toISOString();
}

const reviewQueueArb: fc.Arbitrary<ReviewEntry[]> = fc
  .uniqueArray(fc.uuid(), { minLength: 1, maxLength: 30 })
  .chain((ids) =>
    fc
      .array(
        fc.record({
          weekKey: weekKeyArb,
          wrongCount: fc.integer({ min: 1, max: 99 }),
          consecutiveCorrect: fc.integer({ min: 0, max: 2 }),
          lastWrongAt: fc.integer({ min: 0, max: 1_000_000_000 }).map(timestampFromOffset),
        }),
        { minLength: ids.length, maxLength: ids.length },
      )
      .map((entries) =>
        entries.map((entry, index) => ({
          questionId: `question-${ids[index]!}`,
          ...entry,
        })),
      ),
  );

const requestedCountArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  fc.constantFrom(3, 5, 10),
  fc.integer({ min: -100, max: 100 }),
  fc.string({ maxLength: 4 }),
);

function questionForEntry(entry: ReviewEntry): QuestionItem {
  const options = [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
    { id: 'd', text: 'D' },
  ];

  return {
    id: entry.questionId,
    weekUnitId: `week-unit-${entry.weekKey}`,
    format: 'singleChoice',
    prompt: entry.questionId,
    payload: { kind: 'choice', options, correctOptionId: 'a' },
    explanation: '復習対象の問題について教材に基づく十分な解説を表示します。',
    sourceReference: { weekKey: entry.weekKey, sectionHeading: '基本' },
    published: true,
    deleted: false,
  };
}

function expectedPriority(queue: readonly ReviewEntry[]): ReviewEntry[] {
  return queue
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const wrongCountOrder = right.entry.wrongCount - left.entry.wrongCount;
      if (wrongCountOrder !== 0) return wrongCountOrder;

      const timestampOrder =
        Date.parse(right.entry.lastWrongAt) - Date.parse(left.entry.lastWrongAt);
      return timestampOrder !== 0 ? timestampOrder : left.index - right.index;
    })
    .map(({ entry }) => entry);
}

/**
 * Feature: curriculum-quiz-app, Property 15: 復習Sessionは優先順と設定数を守る
 *
 * **Validates: Requirements 7.4**
 */
describe('Property 15: 復習Sessionの優先順と設定数', () => {
  it('誤答回数・最終誤答日時の優先順と正規化された設定数上限を守る', () => {
    assertProperty(
      fc.property(reviewQueueArb, requestedCountArb, (queue, requestedCount) => {
        const questions = queue.map(questionForEntry);
        const session = createReviewSession(
          queue,
          questions,
          requestedCount,
          createSeededRandom('review-session-property'),
        );
        const prioritized = expectedPriority(queue);
        const expectedCount = Math.min(
          normalizeQuestionCount(requestedCount),
          queue.length,
        );

        expect(session).not.toBeNull();
        expect(session?.mode).toBe('review');
        expect(session?.questionIds).toEqual(
          prioritized.slice(0, expectedCount).map((entry) => entry.questionId),
        );
        expect(session?.questionIds).toHaveLength(expectedCount);
        expect(session?.questionIds.length).toBeLessThanOrEqual(
          normalizeQuestionCount(requestedCount),
        );
        expect(new Set(session?.questionIds).size).toBe(session?.questionIds.length);
        expect(session?.questionIds.length).toBeLessThanOrEqual(queue.length);
        expect(normalizeQuestionCount(undefined)).toBe(DEFAULT_QUESTION_COUNT);
      }),
    );
  });
});
