/**
 * Progress_Snapshot の初期値と初期化ユーティリティ
 */

import type { ProgressSnapshot, WeekProgress } from '@/types/progress';
import {
  PROGRESS_SCHEMA_VERSION,
  SUPPORTED_WEEK_KEYS,
} from '@/lib/constants';

/** 各週の初期進捗を生成する。呼び出しごとに新しい配列を返す。 */
export function createInitialWeekProgress(): WeekProgress[] {
  return SUPPORTED_WEEK_KEYS.map((key) => ({
    weekKey: key,
    questionCount: 0,
    correctCount: 0,
    lastAnsweredAt: null,
  }));
}

/** 初期の ProgressSnapshot を生成する */
export function createInitialProgressSnapshot(): ProgressSnapshot {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    weekProgress: createInitialWeekProgress(),
    reviewQueue: [],
    streakCount: 0,
  };
}
