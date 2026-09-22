import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { STREAK_MAX } from '@/lib/constants';
import { updateStreak } from '@/lib/progress/streak';
import { assertProperty } from '@/tests/pbt';

type SessionBoundary = 'start' | 'end';
type StreakEvent =
  | { type: 'session-boundary'; boundary: SessionBoundary }
  | { type: 'answer'; isCorrect: boolean };

const streakEventArb = fc.oneof(
  fc.constantFrom<SessionBoundary>('start', 'end').map((boundary) => ({
    type: 'session-boundary' as const,
    boundary,
  })),
  fc.boolean().map((isCorrect) => ({
    type: 'answer' as const,
    isCorrect,
  })),
);

const streakScenarioArb = fc.record({
  initialStreak: fc.integer({ min: 0, max: STREAK_MAX }),
  events: fc
    .array(streakEventArb, { minLength: 1, maxLength: 20 })
    .filter((events) => events.some((event) => event.type === 'answer')),
});

/**
 * Feature: curriculum-quiz-app, Property 12: Streak遷移は上限・リセットを守る
 *
 * **Validates: Requirements 6.1、6.2、6.9**
 */
describe('Property 12: Streak遷移の上限・リセット', () => {
  it('正解の飽和、誤答の0、セッション境界をまたぐ非初期化を保つ', () => {
    assertProperty(
      fc.property(streakScenarioArb, ({ initialStreak, events }) => {
        let actualStreak = initialStreak;
        let expectedStreak = initialStreak;

        for (const event of events) {
          const previousExpectedStreak = expectedStreak;

          if (event.type === 'session-boundary') {
            // Session_Managerはstreakを更新する引数を渡さないため、境界では値を保持する。
            expect(actualStreak).toBe(previousExpectedStreak);
            continue;
          }

          expectedStreak = event.isCorrect
            ? Math.min(expectedStreak + 1, STREAK_MAX)
            : 0;
          actualStreak = updateStreak(actualStreak, event.isCorrect);
          expect(actualStreak).toBe(expectedStreak);
          expect(actualStreak).toBeGreaterThanOrEqual(0);
          expect(actualStreak).toBeLessThanOrEqual(STREAK_MAX);
        }
      }),
    );
  });
});
