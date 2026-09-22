import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import {
  addReviewOnWrongAnswer,
  applyReviewAnswer,
  type ReviewQuestion,
} from '@/lib/progress/reviewQueue';
import { REVIEW_QUEUE_MAX, WRONG_COUNT_MAX } from '@/lib/constants';
import type { ReviewEntry } from '@/types/progress';
import type { WeekKey } from '@/types/content';
import { assertProperty } from '@/tests/pbt';

const BASE_TIMESTAMP = Date.parse('2025-01-01T00:00:00.000Z');
const OPERATION_TIMESTAMP = '2030-01-01T00:00:00.000Z';

function timestampFromOffset(offset: number): string {
  return new Date(BASE_TIMESTAMP + offset).toISOString();
}

function questionForEntry(entry: ReviewEntry): ReviewQuestion {
  return {
    questionId: entry.questionId,
    weekKey: entry.weekKey,
  };
}

function newQuestion(id: string): ReviewQuestion {
  return {
    questionId: id,
    weekKey: 'week3',
  };
}

const weekKeyArb: fc.Arbitrary<WeekKey> = fc.constantFrom('week3', 'week4', 'week5', 'week6');

const queueArb = (minLength = 0, maxLength = REVIEW_QUEUE_MAX - 1): fc.Arbitrary<ReviewEntry[]> =>
  fc
    .uniqueArray(fc.uuid(), { minLength, maxLength })
    .chain((ids) =>
      fc
        .array(
          fc.record({
            weekKey: weekKeyArb,
            wrongCount: fc.integer({ min: 1, max: WRONG_COUNT_MAX }),
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

const queueAndTargetArb = queueArb().chain((queue) => {
  const existingTargetArb = queue.length === 0
    ? fc.constant(null)
    : fc.integer({ min: 0, max: queue.length - 1 }).map((index) => queue[index]!);
  const newTargetArb = fc.uuid().map((id) => newQuestion(`new-question-${id}`));

  return fc.oneof(
    existingTargetArb.map((entry) => ({
      queue,
      question: entry ? questionForEntry(entry) : newQuestion('new-question-empty'),
      wasRegistered: Boolean(entry),
    })),
    newTargetArb.map((question) => ({ queue, question, wasRegistered: false })),
  );
});

const queueWithTargetIndexArb = queueArb(1).chain((queue) =>
  fc.integer({ min: 0, max: queue.length - 1 }).map((targetIndex) => ({ queue, targetIndex })),
);

/**
 * Feature: curriculum-quiz-app, Property 14: Review Queue更新は冪等で上限を守る
 *
 * **Validates: Requirements 5.9、7.1〜7.3、7.5、7.8〜7.10、8.9**
 */
describe('Property 14: Review Queue更新の冪等性と上限', () => {
  it('通常誤答を再適用しても登録件数を増やさず、誤答回数を99で飽和する', () => {
    assertProperty(
      fc.property(queueAndTargetArb, ({ queue, question, wasRegistered }) => {
        const original = queue.map((entry) => ({ ...entry }));
        const initial = queue.find((entry) => entry.questionId === question.questionId);
        const once = addReviewOnWrongAnswer(queue, question, OPERATION_TIMESTAMP);
        const twice = addReviewOnWrongAnswer(once, question, OPERATION_TIMESTAMP);
        const expectedWrongCount = Math.min(
          WRONG_COUNT_MAX,
          (initial?.wrongCount ?? 0) + 2,
        );
        const updated = twice.find((entry) => entry.questionId === question.questionId);

        expect(queue).toEqual(original);
        expect(twice.length).toBe(once.length);
        expect(twice.length).toBe(wasRegistered ? queue.length : queue.length + 1);
        expect(updated?.wrongCount).toBe(expectedWrongCount);
        expect(updated?.consecutiveCorrect).toBe(0);
        expect(updated?.lastWrongAt).toBe(OPERATION_TIMESTAMP);
        expect(twice.length).toBeLessThanOrEqual(REVIEW_QUEUE_MAX);
      }),
    );
  });

  it('98回・99回の既存誤答は追加誤答後も99を超えない', () => {
    assertProperty(
      fc.property(
        fc.record({
          wrongCount: fc.constantFrom(98, 99),
          consecutiveCorrect: fc.integer({ min: 0, max: 2 }),
        }),
        ({ wrongCount, consecutiveCorrect }) => {
          const question = newQuestion('question-saturated');
          const queue: ReviewEntry[] = [{
            ...question,
            wrongCount,
            consecutiveCorrect,
            lastWrongAt: '2025-01-01T00:00:00.000Z',
          }];
          const next = addReviewOnWrongAnswer(queue, question, OPERATION_TIMESTAMP);
          const updated = next[0]!;

          expect(next).toHaveLength(1);
          expect(updated.wrongCount).toBe(99);
          expect(updated.consecutiveCorrect).toBe(0);
          expect(updated.lastWrongAt).toBe(OPERATION_TIMESTAMP);
        },
      ),
    );
  });

  it('復習誤答は登録件数と誤答回数を変えず、連続正解を0にする', () => {
    assertProperty(
      fc.property(queueWithTargetIndexArb, ({ queue, targetIndex }) => {
        const target = queue[targetIndex]!;
        const questionId = target.questionId;
        const next = applyReviewAnswer(queue, questionId, false, OPERATION_TIMESTAMP);
        const updated = next.find((entry) => entry.questionId === questionId)!;

        expect(next).toHaveLength(queue.length);
        expect(updated.wrongCount).toBe(target.wrongCount);
        expect(updated.consecutiveCorrect).toBe(0);
        expect(updated.lastWrongAt).toBe(OPERATION_TIMESTAMP);
        expect(next.filter((entry) => entry.questionId === questionId)).toHaveLength(1);
      }),
    );
  });

  it('復習正解は1回では残し、2回目で対象だけを除外する', () => {
    assertProperty(
      fc.property(queueWithTargetIndexArb, ({ queue, targetIndex }) => {
        const target = queue[targetIndex]!;
        const preparedQueue = queue.map((entry, index) =>
          index === targetIndex ? { ...entry, consecutiveCorrect: 0 } : entry,
        );
        const once = applyReviewAnswer(preparedQueue, target.questionId, true, OPERATION_TIMESTAMP);
        const twice = applyReviewAnswer(once, target.questionId, true, OPERATION_TIMESTAMP);

        expect(once).toHaveLength(preparedQueue.length);
        expect(once.find((entry) => entry.questionId === target.questionId)?.consecutiveCorrect).toBe(1);
        expect(twice).toHaveLength(preparedQueue.length - 1);
        expect(twice.some((entry) => entry.questionId === target.questionId)).toBe(false);
        expect(twice.map((entry) => entry.questionId)).toEqual(
          preparedQueue
            .filter((entry) => entry.questionId !== target.questionId)
            .map((entry) => entry.questionId),
        );
      }),
    );
  });

  it('キューが200件のとき新規誤答は最古の1件だけを置換する', () => {
    assertProperty(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: 1_000_000_000 }), {
          minLength: REVIEW_QUEUE_MAX,
          maxLength: REVIEW_QUEUE_MAX,
        }),
        (offsets) => {
          const queue: ReviewEntry[] = offsets.map((offset, index) => ({
            questionId: `question-${index}`,
            weekKey: 'week3',
            wrongCount: 1,
            consecutiveCorrect: 0,
            lastWrongAt: timestampFromOffset(offset),
          }));
          const oldestIndex = offsets.indexOf(Math.min(...offsets));
          const question = newQuestion('new-question-at-capacity');
          const next = addReviewOnWrongAnswer(queue, question, OPERATION_TIMESTAMP);

          expect(next).toHaveLength(REVIEW_QUEUE_MAX);
          expect(next.some((entry) => entry.questionId === question.questionId)).toBe(true);
          expect(next.some((entry) => entry.questionId === `question-${oldestIndex}`)).toBe(false);
          expect(next.filter((entry) => entry.questionId.startsWith('question-'))).toHaveLength(
            REVIEW_QUEUE_MAX - 1,
          );
          expect(queue).toHaveLength(REVIEW_QUEUE_MAX);
        },
      ),
    );
  });
});
