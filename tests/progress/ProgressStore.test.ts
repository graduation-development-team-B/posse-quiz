import { describe, expect, it, vi } from 'vitest';

import { PROGRESS_SNAPSHOT_KEY } from '@/lib/storage/cacheKeys';
import { PROGRESS_SCHEMA_VERSION } from '@/lib/constants';
import { ProgressStore, type ProgressNotice } from '@/lib/progress/ProgressStore';
import { createInitialProgressSnapshot } from '@/lib/progress/progressDefaults';
import type { ProgressSnapshot } from '@/types/progress';
import { createTestStorage } from '../test-doubles';

function snapshotJson(snapshot: ProgressSnapshot): string {
  return JSON.stringify(snapshot);
}

describe('ProgressStore', () => {
  it('初期状態は6教材、空のReview、Streak 0、現行schemaVersionを持つ', async () => {
    const storage = createTestStorage();
    const notices: ProgressNotice[] = [];
    const store = new ProgressStore(storage, { onNotice: (notice) => notices.push(notice) });

    const result = await store.restore();

    expect(result.status).toBe('empty');
    expect(store.getSnapshot()).toEqual(createInitialProgressSnapshot());
    expect(store.getSnapshot().weekProgress.map((progress) => progress.weekKey)).toEqual([
      'week1',
      'git_github_level1',
      'week3',
      'week4',
      'week5',
      'week6',
    ]);
    expect(store.getSnapshot().reviewQueue).toEqual([]);
    expect(store.getSnapshot().streakCount).toBe(0);
    expect(store.getSnapshot().schemaVersion).toBe(PROGRESS_SCHEMA_VERSION);
    expect(notices).toEqual([{ kind: 'initialized' }]);
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBeNull();
  });

  it('保存済みSnapshotを復元し、型と範囲が不正なら初期化して保存する', async () => {
    const valid = createInitialProgressSnapshot();
    valid.weekProgress[valid.weekProgress.findIndex((progress) => progress.weekKey === 'week4')] = {
      weekKey: 'week4',
      questionCount: 2,
      correctCount: 1,
      lastAnsweredAt: '2025-01-01T00:00:00.000Z',
    };
    valid.reviewQueue = [{
      questionId: 'question-1',
      weekKey: 'week4',
      wrongCount: 1,
      consecutiveCorrect: 0,
      lastWrongAt: '2025-01-01T00:00:00.000Z',
    }];
    valid.streakCount = 4;
    const storage = createTestStorage({ [PROGRESS_SNAPSHOT_KEY]: snapshotJson(valid) });
    const store = new ProgressStore(storage);

    const restored = await store.restore();
    expect(restored.status).toBe('ok');
    expect(store.getSnapshot()).toEqual(valid);

    await storage.setItem(
      PROGRESS_SNAPSHOT_KEY,
      JSON.stringify({ ...valid, weekProgress: valid.weekProgress.slice(0, 3) }),
    );
    const reset = await store.restore();
    expect(reset.status).toBe('reset');
    if (reset.status === 'reset') {
      expect(reset.reason).toContain('学習記録を初期化しました');
    }
    expect(store.getSnapshot()).toEqual(createInitialProgressSnapshot());
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe(
      JSON.stringify(createInitialProgressSnapshot()),
    );
  });

  it('回答確定で週別成績とStreakを更新して保存する', async () => {
    const storage = createTestStorage();
    const store = new ProgressStore(storage);

    await store.restore();
    await store.recordAnswer({
      questionId: 'question-1',
      weekKey: 'week3',
      isCorrect: true,
      answeredAt: '2025-01-01T00:00:00.000Z',
    });
    await store.recordAnswer({
      questionId: 'question-2',
      weekKey: 'week3',
      isCorrect: false,
      answeredAt: '2025-01-01T00:01:00.000Z',
    });

    const snapshot = store.getSnapshot();
    expect(snapshot.weekProgress.find((progress) => progress.weekKey === 'week3')).toEqual({
      weekKey: 'week3',
      questionCount: 2,
      correctCount: 1,
      lastAnsweredAt: '2025-01-01T00:01:00.000Z',
    });
    expect(snapshot.streakCount).toBe(0);
    expect(JSON.parse((await storage.getItem(PROGRESS_SNAPSHOT_KEY))!)).toEqual(snapshot);
  });

  it('保存失敗時もメモリ状態と既存Storageを保持し、保存失敗通知を出す', async () => {
    const existing = JSON.stringify(createInitialProgressSnapshot());
    const storage = createTestStorage({ [PROGRESS_SNAPSHOT_KEY]: existing });
    const notices: ProgressNotice[] = [];
    const store = new ProgressStore(storage, { onNotice: (notice) => notices.push(notice) });

    await store.restore();
    storage.failWrites();
    await store.recordAnswer({
      questionId: 'question-1',
      weekKey: 'week3',
      isCorrect: true,
      answeredAt: '2025-01-01T00:00:00.000Z',
    });

    expect(store.getSnapshot().streakCount).toBe(1);
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe(existing);
    expect(notices.at(-1)).toEqual({
      kind: 'save-failed',
      message: '学習記録を保存できませんでした。学習は続けられます。',
    });
  });

  it('削除確認の取消しはStorageとメモリを変更せず、確認後は全進捗を初期化する', async () => {
    const initial = createInitialProgressSnapshot();
    initial.weekProgress[0].questionCount = 1;
    initial.weekProgress[0].correctCount = 1;
    initial.streakCount = 1;
    const serialized = snapshotJson(initial);
    const storage = createTestStorage({ [PROGRESS_SNAPSHOT_KEY]: serialized, 'progress:drill:week1-movie:v1': '{"completed":3}', 'content:unrelated': 'preserve' });
    const notices: ProgressNotice[] = [];
    const store = new ProgressStore(storage, { onNotice: (notice) => notices.push(notice) });
    await store.restore();

    await store.reset(false);
    expect(await storage.getItem('progress:drill:week1-movie:v1')).toBe('{"completed":3}');
    expect(store.getSnapshot()).toEqual(initial);
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe(serialized);
    expect(notices.at(-1)).toEqual({
      kind: 'reset-cancelled',
      message: '学習記録の削除を取り消しました。',
    });

    await store.reset(true);
    expect(await storage.getItem('progress:drill:week1-movie:v1')).toBeNull();
    expect(await storage.getItem('content:unrelated')).toBe('preserve');
    expect(store.getSnapshot()).toEqual(createInitialProgressSnapshot());
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe(
      JSON.stringify(createInitialProgressSnapshot()),
    );
    expect(notices.at(-1)).toEqual({
      kind: 'reset',
      message: '学習記録を削除して初期化しました。',
    });
  });

  it('保存が長時間完了しない場合も復元を2秒で終了する', async () => {
    vi.useFakeTimers();
    const storage = createTestStorage();
    vi.spyOn(storage, 'getItem').mockImplementation(() => new Promise(() => undefined));
    const store = new ProgressStore(storage);
    const restorePromise = store.restore();

    await vi.advanceTimersByTimeAsync(2000);
    const result = await restorePromise;
    expect(result.status).toBe('reset');
    if (result.status === 'reset') {
      expect(result.reason).toContain('学習記録を初期化しました');
    }
  });
});
