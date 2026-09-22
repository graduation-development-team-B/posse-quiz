/**
 * ProgressSnapshot の fast-check アービトラリ（ジェネレーター）
 */

import * as fc from 'fast-check';
import type { ProgressSnapshot, WeekProgress, ReviewEntry } from '@/types/progress';
import { PROGRESS_SCHEMA_VERSION, SUPPORTED_WEEK_KEYS } from '@/lib/constants';

const PROGRESS_COUNT_MAX = 99_999;
const STREAK_STORAGE_MAX = 9_999;
const REVIEW_QUEUE_STORAGE_MAX = 500;
const TIMESTAMP_MIN = new Date('2020-01-01T00:00:00.000Z');
const TIMESTAMP_MAX = new Date('2030-01-01T00:00:00.000Z');

/** 保存フォーマットの境界値を含む整数を生成する。 */
function storageCountArb(): fc.Arbitrary<number> {
  return fc.oneof(
    fc.constant(0),
    fc.constant(PROGRESS_COUNT_MAX),
    fc.integer({ min: 1, max: PROGRESS_COUNT_MAX - 1 }),
  );
}

/** 出題数と、出題数以下の正解数を生成する。 */
function countStatsArb(): fc.Arbitrary<{ questionCount: number; correctCount: number }> {
  return storageCountArb().chain((questionCount) =>
    fc.oneof(
      fc.constant(0),
      fc.constant(questionCount),
      fc.integer({ min: 0, max: questionCount }),
    ).map((correctCount) => ({ questionCount, correctCount })),
  );
}

function timestampArb(): fc.Arbitrary<string> {
  return fc.date({ min: TIMESTAMP_MIN, max: TIMESTAMP_MAX }).map((date) => date.toISOString());
}

function nonBlankIdArb(prefix: string): fc.Arbitrary<string> {
  return fc.uuid().map((id) => `${prefix}-${id}`);
}

/** WeekProgress のアービトラリ */
function weekProgressArb(weekKey: typeof SUPPORTED_WEEK_KEYS[number]): fc.Arbitrary<WeekProgress> {
  return countStatsArb().chain(({ questionCount, correctCount }) =>
    (questionCount === 0 ? fc.constant<string | null>(null) : timestampArb()).map((lastAnsweredAt) => ({
      weekKey,
      questionCount,
      correctCount,
      lastAnsweredAt,
    })),
  );
}

/** ReviewEntry のアービトラリ */
function reviewEntryArb(): fc.Arbitrary<ReviewEntry> {
  return fc.record({
    questionId: nonBlankIdArb('question'),
    weekKey: fc.constantFrom(...SUPPORTED_WEEK_KEYS),
    wrongCount: fc.integer({ min: 1, max: 99 }),
    consecutiveCorrect: fc.integer({ min: 0, max: 2 }),
    lastWrongAt: timestampArb(),
  });
}

function boundedArrayArb<T>(itemArb: fc.Arbitrary<T>, maxLength: number): fc.Arbitrary<T[]> {
  return fc.integer({ min: 0, max: maxLength }).chain((length) =>
    fc.array(itemArb, { minLength: length, maxLength: length }),
  );
}

/**
 * 有効な ProgressSnapshot のアービトラリ
 * Requirement 9.7 の検証範囲: streak 0〜9999, Review 0〜500, 成績0〜99999
 */
export function validProgressSnapshotArb(): fc.Arbitrary<ProgressSnapshot> {
  return fc.record({
    wp1: weekProgressArb('week1'),
    wp3: weekProgressArb('week3'),
    wp4: weekProgressArb('week4'),
    wp5: weekProgressArb('week5'),
    wp6: weekProgressArb('week6'),
    gitGithubLevel1: weekProgressArb('git_github_level1'),
    reviewQueue: boundedArrayArb(reviewEntryArb(), REVIEW_QUEUE_STORAGE_MAX),
    streakCount: fc.oneof(
      fc.constant(0),
      fc.constant(STREAK_STORAGE_MAX),
      fc.integer({ min: 1, max: STREAK_STORAGE_MAX - 1 }),
    ),
  }).map(({ wp1, wp3, wp4, wp5, wp6, gitGithubLevel1, reviewQueue, streakCount }) => ({
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    weekProgress: [wp1, wp3, wp4, wp5, wp6, gitGithubLevel1],
    reviewQueue,
    streakCount,
  }));
}

/** 実行時の有効な ProgressSnapshot（streak 0〜999） */
export function runtimeProgressSnapshotArb(): fc.Arbitrary<ProgressSnapshot> {
  return fc.record({
    wp1: weekProgressArb('week1'),
    wp3: weekProgressArb('week3'),
    wp4: weekProgressArb('week4'),
    wp5: weekProgressArb('week5'),
    wp6: weekProgressArb('week6'),
    gitGithubLevel1: weekProgressArb('git_github_level1'),
    reviewQueue: boundedArrayArb(reviewEntryArb(), 200),
    streakCount: fc.integer({ min: 0, max: 999 }),
  }).map(({ wp1, wp3, wp4, wp5, wp6, gitGithubLevel1, reviewQueue, streakCount }) => ({
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    weekProgress: [wp1, wp3, wp4, wp5, wp6, gitGithubLevel1],
    reviewQueue,
    streakCount,
  }));
}
