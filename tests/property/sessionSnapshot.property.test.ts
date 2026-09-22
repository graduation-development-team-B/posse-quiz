import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { ContentSyncManagerImpl } from '@/lib/content/ContentSyncManager';
import { getOptionOrder } from '@/lib/quiz/optionOrder';
import { createSeededRandom } from '@/lib/quiz/random';
import { createSessionForScope } from '@/lib/quiz/sessionManager';
import { SUPPORTED_WEEK_KEYS } from '@/lib/constants';
import { validApiResponseArb } from '@/tests/generators/catalog';
import { PBT_NUM_RUNS } from '@/tests/pbt';
import type { ApiResponse, ContentCatalog, ContentCache, QuestionItem } from '@/types/content';
import type { ContentCacheStore } from '@/types/sync';

const API_VERSION = 'v1';
const SESSION_SCOPE = { weekKeys: [SUPPORTED_WEEK_KEYS[0]!] };

type Snapshot = {
  questions: QuestionItem[];
  optionOrders: Record<string, string[]>;
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createRevisedResponse(response: ApiResponse, revision: number): ApiResponse {
  const catalog = cloneJson(response.catalog);
  const revisionMarker = `新版-${revision}`;

  catalog.questions = catalog.questions.map((question, _questionIndex, questions) => {
    const alternateSource = question.sourceReference.weekKey === SUPPORTED_WEEK_KEYS[0]
      ? questions.find(
          (candidate) =>
            candidate.id !== question.id &&
            candidate.sourceReference.weekKey === question.sourceReference.weekKey &&
            candidate.sourceReference.sectionHeading !== question.sourceReference.sectionHeading,
        )
      : undefined;

    const payload = cloneJson(question.payload);
    if (question.format !== 'trueFalse' && 'options' in payload) {
      payload.options = payload.options.map((option) => ({
        ...option,
        text: `${option.text} ${revisionMarker}`,
      }));
    }

    return {
      ...question,
      prompt: `${question.prompt} ${revisionMarker}`,
      explanation: `${question.explanation} ${revisionMarker}`,
      sourceReference: alternateSource?.sourceReference ?? question.sourceReference,
      payload,
    };
  });

  return {
    ...response,
    contentVersion: `${response.contentVersion}-${revisionMarker}`,
    catalog,
  };
}

function createCacheStore(currentCache: ContentCache, writes: ContentCache[]): ContentCacheStore {
  return {
    read: async () => currentCache,
    writeAtomically: async (nextCache) => {
      writes.push(nextCache);
    },
    removePreviousAfterCommit: async () => undefined,
  };
}

function captureSessionSnapshot(session: NonNullable<ReturnType<typeof createSessionForScope>>): Snapshot {
  return {
    questions: cloneJson(session.questions),
    optionOrders: cloneJson(session.optionOrders),
  };
}

function assertSessionSnapshotUnchanged(
  session: NonNullable<ReturnType<typeof createSessionForScope>>,
  snapshot: Snapshot,
): void {
  expect(session.questions).toEqual(snapshot.questions);
  expect(session.optionOrders).toEqual(snapshot.optionOrders);

  for (const question of session.questions) {
    const expectedOrder = snapshot.optionOrders[question.id];
    expect(expectedOrder).toBeDefined();
    expect(getOptionOrder(session, question)).toEqual(expectedOrder);
  }
}

/**
 * Feature: curriculum-quiz-app, Property 5: 進行中Sessionは開始時の教材を保持する
 *
 * **Validates: Requirements 9.22**
 */
describe('Property 5: 進行中Sessionは開始時の教材を保持する', () => {
  it('API更新後も問題、Source_Reference、解説、選択肢順を開始時snapshotに固定し、新規sessionだけ新版を使う', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialResponse: validApiResponseArb(),
          revision: fc.integer({ min: 1, max: 1_000_000 }),
          sessionSeed: fc.integer(),
        }),
        async ({ initialResponse, revision, sessionSeed }) => {
          const revisedResponse = createRevisedResponse(initialResponse, revision);
          const currentCache: ContentCache = {
            response: initialResponse,
            cachedAt: '2025-01-01T00:00:00.000Z',
            apiVersion: API_VERSION,
          };
          const writes: ContentCache[] = [];
          let fetchCount = 0;
          const apiClient = {
            fetchCatalog: async () => {
              fetchCount += 1;
              return fetchCount === 1 ? initialResponse : revisedResponse;
            },
          };
          const manager = new ContentSyncManagerImpl({
            apiClient,
            cacheStore: createCacheStore(currentCache, writes),
            apiVersion: API_VERSION,
            now: () => '2025-01-02T00:00:00.000Z',
          });

          await manager.initialize();
          // initialize starts the background refresh; await it before starting the manual update.
          await manager.refresh('manual');
          expect(manager.getCatalog()).toBe(initialResponse.catalog);

          const session = createSessionForScope(
            manager.getCatalog()!,
            SESSION_SCOPE,
            5,
            createSeededRandom(sessionSeed),
          );
          expect(session).not.toBeNull();
          if (!session) return;
          const startedSnapshot = captureSessionSnapshot(session);

          await manager.refresh('manual');

          expect(fetchCount).toBe(2);
          expect(writes).toHaveLength(1);
          expect(manager.getCatalog()).toEqual(revisedResponse.catalog);
          assertSessionSnapshotUnchanged(session, startedSnapshot);

          const newSession = createSessionForScope(
            manager.getCatalog()!,
            SESSION_SCOPE,
            5,
            createSeededRandom(sessionSeed),
          );
          expect(newSession).not.toBeNull();
          if (!newSession) return;

          expect(
            newSession.questions.every((question) => {
              const revisedQuestion = revisedResponse.catalog.questions.find((item) => item.id === question.id);
              return revisedQuestion !== undefined && question.prompt === revisedQuestion.prompt;
            }),
          ).toBe(true);

          for (const question of session.questions) {
            const revisedQuestion = revisedResponse.catalog.questions.find((item) => item.id === question.id);
            expect(revisedQuestion).toBeDefined();
            expect(question.prompt).not.toContain(`新版-${revision}`);
            expect(question.explanation).not.toContain(`新版-${revision}`);
            expect(question.sourceReference).not.toEqual(revisedQuestion?.sourceReference);
          }
        },
      ),
      { numRuns: PBT_NUM_RUNS },
    );
  });
});
