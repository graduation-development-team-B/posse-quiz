import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PROGRESS_SNAPSHOT_KEY } from '@/lib/storage/cacheKeys';
import { ProgressStore } from '@/lib/progress/ProgressStore';
import { addReviewOnWrongAnswer } from '@/lib/progress/reviewQueue';
import { createInitialProgressSnapshot } from '@/lib/progress/progressDefaults';
import type { ApiResponse } from '@/types/content';
import { createTestStorage } from '../test-doubles';

function fixture(): ApiResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
}

describe('progress integration', () => {
  it('persists answer results and a review entry, then restores the complete snapshot', async () => {
    const storage = createTestStorage();
    const store = new ProgressStore(storage);
    const question = fixture().catalog.questions.find((item) => item.weekUnitId === 'week-unit-week3')!;

    await store.restore();
    await store.recordAnswer({
      questionId: question.id,
      weekKey: 'week3',
      isCorrect: false,
      answeredAt: '2025-01-02T00:00:00.000Z',
    });
    const queue = addReviewOnWrongAnswer(
      store.getSnapshot().reviewQueue,
      question,
      '2025-01-02T00:00:00.000Z',
    );
    await store.updateReviewQueue(queue);

    const persisted = await storage.getItem(PROGRESS_SNAPSHOT_KEY);
    expect(persisted).toBe(store.serialize(store.getSnapshot()));
    expect(store.getSnapshot()).toMatchObject({
      weekProgress: expect.arrayContaining([
        expect.objectContaining({ weekKey: 'week3', questionCount: 1, correctCount: 0 }),
      ]),
      reviewQueue: [expect.objectContaining({ questionId: question.id, wrongCount: 1 })],
      streakCount: 0,
    });

    const restoredStore = new ProgressStore(storage);
    const result = await restoredStore.restore();
    expect(result.status).toBe('ok');
    expect(restoredStore.getSnapshot()).toEqual(store.getSnapshot());
    expect(restoredStore.serialize(restoredStore.getSnapshot())).toBe(persisted);
  });

  it('keeps the in-memory result and old storage value when persistence fails', async () => {
    const initial = createInitialProgressSnapshot();
    const storage = createTestStorage({ [PROGRESS_SNAPSHOT_KEY]: JSON.stringify(initial) });
    const store = new ProgressStore(storage);
    await store.restore();
    storage.failWrites();

    await store.recordAnswer({
      questionId: 'question-save-failure',
      weekKey: 'week6',
      isCorrect: true,
      answeredAt: '2025-01-02T00:00:00.000Z',
    });

    expect(store.getSnapshot()).toMatchObject({
      streakCount: 1,
      weekProgress: expect.arrayContaining([
        expect.objectContaining({ weekKey: 'week6', questionCount: 1, correctCount: 1 }),
      ]),
    });
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe(JSON.stringify(initial));
  });

  it('keeps progress data independent from content cache keys', async () => {
    const storage = createTestStorage();
    const store = new ProgressStore(storage);
    await store.restore();
    await store.recordAnswer({
      questionId: 'question-isolation',
      weekKey: 'week3',
      isCorrect: true,
      answeredAt: '2025-01-02T00:00:00.000Z',
    });

    const progressJson = await storage.getItem(PROGRESS_SNAPSHOT_KEY);
    const keys = await storage.getAllKeys();
    expect(keys).toContain(PROGRESS_SNAPSHOT_KEY);
    expect(keys.filter((key) => key.startsWith('content-cache:'))).toEqual([]);
    expect(progressJson).toBe(store.serialize(store.getSnapshot()));
  });
});
