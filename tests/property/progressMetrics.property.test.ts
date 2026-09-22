import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { percentage } from '@/lib/progress/metrics';
import { assertProperty } from '@/tests/pbt';

interface CountStats {
  questionCount: number;
  correctCount: number;
}

const countStatsArb: fc.Arbitrary<CountStats> = fc
  .integer({ min: 0, max: 10_000 })
  .chain((questionCount) =>
    fc.integer({ min: 0, max: questionCount }).map((correctCount) => ({
      questionCount,
      correctCount,
    })),
  );

const percentageBoundaryStatsArb: fc.Arbitrary<CountStats> = fc.oneof(
  fc.constant({ questionCount: 0, correctCount: 0 }),
  fc.constant({ questionCount: 1, correctCount: 0 }),
  fc.constant({ questionCount: 1, correctCount: 1 }),
  fc.constant({ questionCount: 3, correctCount: 1 }),
  fc.constant({ questionCount: 3, correctCount: 2 }),
  fc.constant({ questionCount: 100, correctCount: 59 }),
  countStatsArb,
);

/**
 * Feature: curriculum-quiz-app, Property 13: 進捗の正答率集計は境界を守る
 *
 * Topic概念の廃止により苦手Topic集計は仕様から削除したため、正答率の境界のみを検証する。
 */
describe('Property 13: progress metrics boundaries', () => {
  it('有効な正答率を常に0〜100の整数へ丸め、出題数0を未学習として扱う', () => {
    assertProperty(
      fc.property(percentageBoundaryStatsArb, ({ questionCount, correctCount }) => {
        const result = percentage(correctCount, questionCount);

        expect(correctCount).toBeLessThanOrEqual(questionCount);
        if (questionCount === 0) {
          expect(result).toBeNull();
          return;
        }

        expect(result).toBe(Math.round((correctCount / questionCount) * 100));
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
        expect(Number.isInteger(result)).toBe(true);
      }),
    );
  });
});
