import { describe, expect, it } from 'vitest';

import {
  deserializeProgressSnapshot,
  ProgressSerializationError,
  serializeProgressSnapshot,
} from '@/lib/progress/progressSerialization';
import { PROGRESS_SCHEMA_VERSION, PROGRESS_SCHEMA_VERSION_LEGACY_TOPIC } from '@/lib/constants';
import type { ProgressSnapshot } from '@/types/progress';

function createSnapshot(): ProgressSnapshot {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    weekProgress: [
      { weekKey: 'week3', questionCount: 3, correctCount: 2, lastAnsweredAt: '2025-01-01T00:00:00.000Z' },
      { weekKey: 'week4', questionCount: 0, correctCount: 0, lastAnsweredAt: null },
      { weekKey: 'week5', questionCount: 99_999, correctCount: 99_999, lastAnsweredAt: '2025-01-02T00:00:00.000Z' },
      { weekKey: 'week6', questionCount: 1, correctCount: 0, lastAnsweredAt: null },
      { weekKey: 'git_github_level1', questionCount: 0, correctCount: 0, lastAnsweredAt: null },
      { weekKey: 'week1', questionCount: 0, correctCount: 0, lastAnsweredAt: null },
    ],
    reviewQueue: [
      {
        questionId: 'question-first',
        weekKey: 'week3',
        wrongCount: 99,
        consecutiveCorrect: 2,
        lastWrongAt: '2025-01-03T00:00:00.000Z',
      },
      {
        questionId: 'question-second',
        weekKey: 'week6',
        wrongCount: 1,
        consecutiveCorrect: 0,
        lastWrongAt: '2025-01-04T00:00:00.000Z',
      },
    ],
    streakCount: 9_999,
  };
}

describe('progress serialization', () => {
  it('全フィールドを決定的な形でシリアライズする', () => {
    const snapshot = createSnapshot();
    const expected = JSON.stringify({
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      weekProgress: snapshot.weekProgress,
      reviewQueue: snapshot.reviewQueue,
      streakCount: 9_999,
    });

    expect(serializeProgressSnapshot(snapshot)).toBe(expected);
    expect(serializeProgressSnapshot({ ...snapshot, weekProgress: [...snapshot.weekProgress] })).toBe(expected);
  });

  it('round-trips values and preserves Review Queue order', () => {
    const snapshot = createSnapshot();
    const json = serializeProgressSnapshot(snapshot);

    expect(deserializeProgressSnapshot(json)).toEqual(snapshot);
    expect(serializeProgressSnapshot(deserializeProgressSnapshot(json))).toBe(json);
  });

  it('旧4週形式にはGit/GitHub教材の未学習レコードを補完する', () => {
    const snapshot = createSnapshot();
    const legacyJson = JSON.stringify({
      ...snapshot,
      weekProgress: snapshot.weekProgress.slice(0, 4),
    });

    expect(deserializeProgressSnapshot(legacyJson).weekProgress.at(-1)).toEqual({
      weekKey: 'git_github_level1',
      questionCount: 0,
      correctCount: 0,
      lastAnsweredAt: null,
    });
  });

  it('v1（Topicあり）の保存データはTopic情報だけを捨ててv2へ移行する', () => {
    const snapshot = createSnapshot();
    const legacyV1Json = JSON.stringify({
      schemaVersion: PROGRESS_SCHEMA_VERSION_LEGACY_TOPIC,
      weekProgress: snapshot.weekProgress,
      topicProgress: [
        { topicId: 'topic-b', questionCount: 2, correctCount: 1 },
        { topicId: 'topic-a', questionCount: 1, correctCount: 1 },
      ],
      reviewQueue: snapshot.reviewQueue.map((entry) => ({
        questionId: entry.questionId,
        weekKey: entry.weekKey,
        topicId: 'topic-a',
        wrongCount: entry.wrongCount,
        consecutiveCorrect: entry.consecutiveCorrect,
        lastWrongAt: entry.lastWrongAt,
      })),
      streakCount: snapshot.streakCount,
    });

    const migrated = deserializeProgressSnapshot(legacyV1Json);

    // 週別成績・復習キューの順序・Streakは保持し、Topic情報だけが消える。
    expect(migrated).toEqual(snapshot);
    expect(migrated.schemaVersion).toBe(PROGRESS_SCHEMA_VERSION);
    expect(migrated.reviewQueue.map((entry) => entry.questionId)).toEqual([
      'question-first',
      'question-second',
    ]);
    expect('topicProgress' in migrated).toBe(false);
  });

  it.each([
    ['not-json', '学習記録の解析に失敗しました。'],
    [JSON.stringify({}), '学習記録の形式が不正です。'],
    [JSON.stringify({ ...createSnapshot(), schemaVersion: PROGRESS_SCHEMA_VERSION + 1 }), '学習記録のバージョンが一致しません'],
    [JSON.stringify({ ...createSnapshot(), streakCount: 10_000 }), 'ストリークカウントの値が不正です。'],
    [JSON.stringify({ ...createSnapshot(), weekProgress: createSnapshot().weekProgress.slice(0, 3) }), '教材別学習記録は6件分必要です。'],
    [JSON.stringify({ ...createSnapshot(), extra: true }), '学習記録の形式が不正です。'],
  ])('rejects invalid JSON or snapshot structure: %s', (json, message) => {
    expect(() => deserializeProgressSnapshot(json)).toThrow(message);
  });

  it('rejects invalid snapshots before saving them', () => {
    const invalid = { ...createSnapshot(), streakCount: -1 } as ProgressSnapshot;

    expect(() => serializeProgressSnapshot(invalid)).toThrow(ProgressSerializationError);
  });
});
