/**
 * Streak_Counter の純粋な状態遷移。
 */

import { STREAK_MAX } from '@/lib/constants';

/**
 * 回答結果をStreakへ反映する。
 * 正解は上限まで1増やし、誤答は0へ戻す。
 * セッションの開始・終了はこの関数を呼ばないため、値を初期化しない。
 */
export function updateStreak(current: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  return Math.min(current + 1, STREAK_MAX);
}
