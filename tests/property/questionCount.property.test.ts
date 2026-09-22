import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { DEFAULT_QUESTION_COUNT } from '@/lib/constants';
import { createSeededRandom } from '@/lib/quiz/random';
import { createQuizSession, normalizeQuestionCount } from '@/lib/quiz/sessionManager';
import type { QuestionItem } from '@/types/content';
import { assertProperty } from '@/tests/pbt';

const POOL_SIZES = [0, 1, 2, 3, 5, 10] as const;
const VALID_COUNTS = [3, 5, 10] as const;

const invalidQuestionCountArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  fc.integer().filter((value) => !VALID_COUNTS.includes(value as (typeof VALID_COUNTS)[number])),
  fc.string(),
  fc.boolean(),
  fc.constantFrom({}, []),
);

const requestedCountArb: fc.Arbitrary<unknown> = fc.oneof(
  invalidQuestionCountArb,
  fc.constantFrom(...VALID_COUNTS),
);

const poolSizeArb: fc.Arbitrary<number> = fc.constantFrom(...POOL_SIZES);

function question(id: string): QuestionItem {
  return {
    id,
    weekUnitId: 'week-unit-week3',
    format: 'singleChoice',
    prompt: `問題 ${id}`,
    payload: {
      kind: 'choice',
      options: [
        { id: 'a', text: '選択肢A' },
        { id: 'b', text: '選択肢B' },
        { id: 'c', text: '選択肢C' },
        { id: 'd', text: '選択肢D' },
      ],
      correctOptionId: 'a',
    },
    explanation: 'この問題の解説は、教材の要点と正しい理由を確認できる文章です。',
    sourceReference: { weekKey: 'week3', sectionHeading: '基本' },
    published: true,
    deleted: false,
  };
}

function questionPool(size: number): QuestionItem[] {
  return Array.from({ length: size }, (_, index) => question(`question-${index}`));
}

/**
 * Feature: curriculum-quiz-app, Property 7: 問題数設定は3/5/10へ正規化され不足時は全件を使う
 *
 * **Validates: Requirements 3.1〜3.3、3.10、7.4**
 */
describe('Property 7: question count normalization and pool fallback', () => {
  it('未設定・不正値は既定5、3/5/10はそのまま正規化する', () => {
    assertProperty(
      fc.property(requestedCountArb, (requestedCount) => {
        const normalized = normalizeQuestionCount(requestedCount);
        const isAllowedCount = VALID_COUNTS.includes(
          requestedCount as (typeof VALID_COUNTS)[number],
        );

        expect(normalized).toBe(isAllowedCount ? requestedCount : DEFAULT_QUESTION_COUNT);
        expect(VALID_COUNTS).toContain(normalized);
      }),
    );
  });

  it('プール0/1/2/3/5/10件に対して目標数を上限とし、不足時は全件を採用する', () => {
    assertProperty(
      fc.property(
        fc.record({
          requestedCount: requestedCountArb,
          poolSize: poolSizeArb,
          seed: fc.integer(),
        }),
        ({ requestedCount, poolSize, seed }) => {
          const pool = questionPool(poolSize);
          const normalized = normalizeQuestionCount(requestedCount);
          const session = createQuizSession(
            pool,
            requestedCount,
            'normal',
            createSeededRandom(seed),
          );

          if (poolSize === 0) {
            expect(session).toBeNull();
            return;
          }

          const expectedQuestionCount = Math.min(normalized, poolSize);
          expect(session).not.toBeNull();
          expect(session?.questions).toHaveLength(expectedQuestionCount);
          expect(session?.questionIds).toHaveLength(expectedQuestionCount);
          expect(session?.questions.length).toBeGreaterThanOrEqual(1);
          expect(session?.questions.length).toBeLessThanOrEqual(poolSize);
          expect(new Set(session?.questionIds).size).toBe(expectedQuestionCount);
          expect(session?.questionIds.every((id) => pool.some((item) => item.id === id))).toBe(true);
        },
      ),
    );
  });
});
