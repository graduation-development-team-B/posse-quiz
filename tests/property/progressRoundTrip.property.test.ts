import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import {
  deserializeProgressSnapshot,
  serializeProgressSnapshot,
} from '@/lib/progress/progressSerialization';
import { validProgressSnapshotArb } from '@/tests/generators';
import { assertProperty } from '@/tests/pbt';

/**
 * Feature: curriculum-quiz-app, Property 16: ProgressSnapshotのJSONは完全なラウンドトリップになる
 *
 * **Validates: Requirements 9.5〜9.8**
 */
describe('Property 16: ProgressSnapshot JSON round-trip', () => {
  it('preserves every field, Review_Queue order, and deterministic JSON', () => {
    assertProperty(
      fc.property(validProgressSnapshotArb(), (snapshot) => {
        const serialized = serializeProgressSnapshot(snapshot);
        const restored = deserializeProgressSnapshot(serialized);
        const restoredSerialized = serializeProgressSnapshot(restored);

        expect(restored.schemaVersion).toBe(snapshot.schemaVersion);
        expect(restored.weekProgress).toEqual(snapshot.weekProgress);
        expect(restored.reviewQueue).toEqual(snapshot.reviewQueue);
        expect(restored.reviewQueue.map((entry) => entry.questionId)).toEqual(
          snapshot.reviewQueue.map((entry) => entry.questionId),
        );
        expect(restored.streakCount).toBe(snapshot.streakCount);
        expect(restoredSerialized).toBe(serialized);
      }),
    );
  });
});
