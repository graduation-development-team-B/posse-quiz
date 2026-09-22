/**
 * Progress_Snapshot の決定的な JSON 変換と復元時検証。
 * Local_Storage に入る値をこのモジュールに集約し、ProgressStore と同じ契約を共有する。
 *
 * スキーマ v2 で Topic 概念を廃止した（topicProgress と ReviewEntry.topicId を削除）。
 * v1 の保存データは読み込み時に v2 へ移行し、既存の学習記録を失わせない。
 */

import type { WeekKey } from '@/types/content';
import type {
  ProgressSnapshot,
  ReviewEntry,
  WeekProgress,
} from '@/types/progress';
import {
  PROGRESS_SCHEMA_VERSION,
  PROGRESS_SCHEMA_VERSION_LEGACY_TOPIC,
  REVIEW_QUEUE_STORAGE_MAX,
  SUPPORTED_WEEK_KEYS,
} from '@/lib/constants';

const PROGRESS_COUNT_MAX = 99_999;
const STREAK_STORAGE_MAX = 9_999;
const REVIEW_WRONG_COUNT_MAX = 99;
const REVIEW_CONSECUTIVE_CORRECT_MAX = 2;
const SUPPORTED_WEEK_KEY_SET = new Set<WeekKey>(SUPPORTED_WEEK_KEYS);

const SNAPSHOT_KEYS = ['schemaVersion', 'weekProgress', 'reviewQueue', 'streakCount'];
const WEEK_PROGRESS_KEYS = ['weekKey', 'questionCount', 'correctCount', 'lastAnsweredAt'];
const REVIEW_ENTRY_KEYS = [
  'questionId',
  'weekKey',
  'wrongCount',
  'consecutiveCorrect',
  'lastWrongAt',
];

/** v1（Topicあり）の保存データを判別するためのキー集合。 */
const LEGACY_TOPIC_SNAPSHOT_KEYS = [
  'schemaVersion',
  'weekProgress',
  'topicProgress',
  'reviewQueue',
  'streakCount',
];
const LEGACY_TOPIC_REVIEW_ENTRY_KEYS = [
  'questionId',
  'weekKey',
  'topicId',
  'wrongCount',
  'consecutiveCorrect',
  'lastWrongAt',
];

/** 復元不能な保存データを表すエラー。messageはユーザー向け初期化理由に利用する。 */
export class ProgressSerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgressSerializationError';
  }
}

/**
 * ProgressSnapshotを検証して、フィールド順が固定されたJSON文字列へ変換する。
 * 入力値も実行時に検証するため、型アサーション経由の不正データを保存しない。
 */
export function serializeProgressSnapshot(snapshot: ProgressSnapshot): string {
  const validated = validateProgressSnapshot(snapshot);

  // オブジェクトリテラルと配列の順序を固定し、同じ値から同じJSONを生成する。
  return JSON.stringify({
    schemaVersion: validated.schemaVersion,
    weekProgress: validated.weekProgress.map((progress) => ({
      weekKey: progress.weekKey,
      questionCount: progress.questionCount,
      correctCount: progress.correctCount,
      lastAnsweredAt: progress.lastAnsweredAt,
    })),
    reviewQueue: validated.reviewQueue.map((entry) => ({
      questionId: entry.questionId,
      weekKey: entry.weekKey,
      wrongCount: entry.wrongCount,
      consecutiveCorrect: entry.consecutiveCorrect,
      lastWrongAt: entry.lastWrongAt,
    })),
    streakCount: validated.streakCount,
  });
}

/**
 * JSON文字列を解析し、現行schemaVersionと保存フォーマットの全制約を検証して復元する。
 * v1データは検証前にv2へ移行する。配列の順序は変更せず、特にReview Queueの順序をそのまま保持する。
 */
export function deserializeProgressSnapshot(json: string): ProgressSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ProgressSerializationError('学習記録の解析に失敗しました。');
  }

  return validateProgressSnapshot(migrateLegacyTopicSnapshot(parsed));
}

/**
 * v1（Topicあり）の保存データをv2へ移行する。
 *
 * Topic別成績とReviewEntry.topicIdだけを捨て、週別成績・復習キューの順序・Streakは保持する。
 * 移行できない形は入力のまま返し、後段の検証で通常のエラーとして扱う。
 */
function migrateLegacyTopicSnapshot(data: unknown): unknown {
  if (!isRecordWithExactKeys(data, LEGACY_TOPIC_SNAPSHOT_KEYS)) return data;
  if (data.schemaVersion !== PROGRESS_SCHEMA_VERSION_LEGACY_TOPIC) return data;

  const reviewQueue = Array.isArray(data.reviewQueue)
    ? data.reviewQueue.map((entry) => {
        if (!isRecordWithExactKeys(entry, LEGACY_TOPIC_REVIEW_ENTRY_KEYS)) return entry;
        return {
          questionId: entry.questionId,
          weekKey: entry.weekKey,
          wrongCount: entry.wrongCount,
          consecutiveCorrect: entry.consecutiveCorrect,
          lastWrongAt: entry.lastWrongAt,
        };
      })
    : data.reviewQueue;

  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    weekProgress: data.weekProgress,
    reviewQueue,
    streakCount: data.streakCount,
  };
}

function validateProgressSnapshot(data: unknown): ProgressSnapshot {
  if (!isRecordWithExactKeys(data, SNAPSHOT_KEYS)) {
    throw new ProgressSerializationError('学習記録の形式が不正です。');
  }

  if (data.schemaVersion !== PROGRESS_SCHEMA_VERSION) {
    throw new ProgressSerializationError(
      `学習記録のバージョンが一致しません（期待: ${PROGRESS_SCHEMA_VERSION}, 実際: ${String(data.schemaVersion)}）。`,
    );
  }

  const supportedCount = SUPPORTED_WEEK_KEYS.length;
  // Week01追加前の5週形式と、Git追加前の4週形式を受け入れる。
  const isLegacySnapshot = Array.isArray(data.weekProgress)
    && (data.weekProgress.length === supportedCount - 1 || data.weekProgress.length === supportedCount - 2);
  if (!Array.isArray(data.weekProgress) || (!isLegacySnapshot && data.weekProgress.length !== supportedCount)) {
    throw new ProgressSerializationError(`教材別学習記録は${supportedCount}件分必要です。`);
  }
  const weekProgress: WeekProgress[] = [];
  const seenWeekKeys = new Set<WeekKey>();
  for (const value of data.weekProgress) {
    weekProgress.push(validateWeekProgress(value, seenWeekKeys));
  }
  if (isLegacySnapshot) {
    const missingKeys = SUPPORTED_WEEK_KEYS.filter((key) => !seenWeekKeys.has(key));
    const expectedMissingKeys = data.weekProgress.length === supportedCount - 1
      ? ['week1']
      : ['week1', 'git_github_level1'];
    if (missingKeys.length !== expectedMissingKeys.length || expectedMissingKeys.some((key) => !missingKeys.includes(key as WeekKey))) {
      throw new ProgressSerializationError('旧形式の週別学習記録に必要な週がありません。');
    }
    for (const weekKey of expectedMissingKeys) {
      weekProgress.push({
        weekKey: weekKey as WeekKey,
        questionCount: 0,
        correctCount: 0,
        lastAnsweredAt: null,
      });
    }
  }

  if (!Array.isArray(data.reviewQueue) || data.reviewQueue.length > REVIEW_QUEUE_STORAGE_MAX) {
    throw new ProgressSerializationError('復習キューの件数が不正です。');
  }
  const reviewQueue: ReviewEntry[] = data.reviewQueue.map(validateReviewEntry);

  if (!isIntegerInRange(data.streakCount, 0, STREAK_STORAGE_MAX)) {
    throw new ProgressSerializationError('ストリークカウントの値が不正です。');
  }

  return {
    schemaVersion: data.schemaVersion,
    weekProgress,
    reviewQueue,
    streakCount: data.streakCount,
  };
}

function validateWeekProgress(value: unknown, seenWeekKeys: Set<WeekKey>): WeekProgress {
  if (!isRecordWithExactKeys(value, WEEK_PROGRESS_KEYS) || typeof value.weekKey !== 'string' || !SUPPORTED_WEEK_KEY_SET.has(value.weekKey as WeekKey)) {
    throw new ProgressSerializationError('週別学習記録の週キーが不正です。');
  }
  const weekKey = value.weekKey as WeekKey;
  if (seenWeekKeys.has(weekKey)) {
    throw new ProgressSerializationError('週別学習記録に重複した週があります。');
  }
  seenWeekKeys.add(weekKey);

  if (!isIntegerInRange(value.questionCount, 0, PROGRESS_COUNT_MAX)) {
    throw new ProgressSerializationError('出題数の値が不正です。');
  }
  if (!isIntegerInRange(value.correctCount, 0, PROGRESS_COUNT_MAX) || value.correctCount > value.questionCount) {
    throw new ProgressSerializationError('正解数の値が不正です。');
  }
  if (value.lastAnsweredAt !== null && !isValidTimestamp(value.lastAnsweredAt)) {
    throw new ProgressSerializationError('最終回答日時の値が不正です。');
  }

  return {
    weekKey,
    questionCount: value.questionCount,
    correctCount: value.correctCount,
    lastAnsweredAt: value.lastAnsweredAt,
  };
}

function validateReviewEntry(value: unknown): ReviewEntry {
  if (!isRecordWithExactKeys(value, REVIEW_ENTRY_KEYS)) {
    throw new ProgressSerializationError('復習キューのエントリが不正です。');
  }
  if (typeof value.questionId !== 'string' || value.questionId.trim().length === 0) {
    throw new ProgressSerializationError('復習問題IDの形式が不正です。');
  }
  if (typeof value.weekKey !== 'string' || !SUPPORTED_WEEK_KEY_SET.has(value.weekKey as WeekKey)) {
    throw new ProgressSerializationError('復習キューの週キーが不正です。');
  }
  if (!isIntegerInRange(value.wrongCount, 1, REVIEW_WRONG_COUNT_MAX)) {
    throw new ProgressSerializationError('誤答回数の値が不正です。');
  }
  if (!isIntegerInRange(value.consecutiveCorrect, 0, REVIEW_CONSECUTIVE_CORRECT_MAX)) {
    throw new ProgressSerializationError('復習連続正解数の値が不正です。');
  }
  if (!isValidTimestamp(value.lastWrongAt)) {
    throw new ProgressSerializationError('最終誤答日時の値が不正です。');
  }

  return {
    questionId: value.questionId,
    weekKey: value.weekKey as WeekKey,
    wrongCount: value.wrongCount,
    consecutiveCorrect: value.consecutiveCorrect,
    lastWrongAt: value.lastWrongAt,
  };
}

function isRecordWithExactKeys(value: unknown, expectedKeys: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && expectedKeys.every((key) => keys.includes(key));
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}
