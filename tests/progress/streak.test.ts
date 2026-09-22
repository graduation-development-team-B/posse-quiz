import { describe, expect, it } from 'vitest';

import { STREAK_MAX } from '@/lib/constants';
import { updateStreak } from '@/lib/progress/streak';

describe('updateStreak', () => {
  it('正解で1増加する', () => {
    expect(updateStreak(0, true)).toBe(1);
    expect(updateStreak(7, true)).toBe(8);
  });

  it('999を超えずに飽和する', () => {
    expect(updateStreak(STREAK_MAX - 1, true)).toBe(STREAK_MAX);
    expect(updateStreak(STREAK_MAX, true)).toBe(STREAK_MAX);
  });

  it('誤答で0に戻る', () => {
    expect(updateStreak(0, false)).toBe(0);
    expect(updateStreak(STREAK_MAX, false)).toBe(0);
  });

  it('セッション境界を表す操作がなく、回答結果だけで値が遷移する', () => {
    const afterSessionStart = updateStreak(4, true);
    const afterSessionEnd = updateStreak(afterSessionStart, true);

    expect(afterSessionStart).toBe(5);
    expect(afterSessionEnd).toBe(6);
  });
});
