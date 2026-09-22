/**
 * 学習進捗のドメイン型定義
 * design.md Section 3.1: 進捗モデル に基づく
 */

import type { WeekKey } from './content';

/** 出題数・正解数の集計 */
export interface CountStats {
  questionCount: number;
  correctCount: number;
}

/** 週別進捗 */
export interface WeekProgress extends CountStats {
  weekKey: WeekKey;
  lastAnsweredAt: string | null;
}

/** 復習キューエントリ */
export interface ReviewEntry {
  questionId: string;
  weekKey: WeekKey;
  /** 誤答回数: 1〜99 */
  wrongCount: number;
  /** 連続正解数: 0〜2 */
  consecutiveCorrect: number;
  /** 最終誤答日時（ISO 8601） */
  lastWrongAt: string;
}

/**
 * 進捗スナップショット（永続化データ構造）
 * - weekProgress: 対応教材ごとに必ず1件
 * - reviewQueue: 保存フォーマット上は0〜500件
 * - streakCount: 実行時0〜999。互換JSON入力は0〜9999を検証範囲とする
 */
export interface ProgressSnapshot {
  schemaVersion: number;
  weekProgress: WeekProgress[];
  reviewQueue: ReviewEntry[];
  streakCount: number;
}

/** Progress復元結果 */
export type RestoreResult =
  | { status: 'ok'; snapshot: ProgressSnapshot }
  | { status: 'reset'; snapshot: ProgressSnapshot; reason: string }
  | { status: 'empty'; snapshot: ProgressSnapshot };
