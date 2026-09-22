import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { ContentApiClient, type FetchImplementation } from '@/lib/content/ContentApiClient';
import { ContentCacheStore } from '@/lib/content/ContentCacheStore';
import { ContentSyncManager } from '@/lib/content/ContentSyncManager';
import { PROGRESS_SNAPSHOT_KEY } from '@/lib/storage/cacheKeys';
import { ProgressStore } from '@/lib/progress/ProgressStore';
import type { ApiResponse } from '@/types/content';
import type { SyncState } from '@/types/sync';
import { validApiResponseArb } from '@/tests/generators/catalog';
import { PBT_NUM_RUNS } from '@/tests/pbt';
import { createTestStorage } from '@/tests/test-doubles';


type SyncOutcome = 'success' | 'timeout' | 'http' | 'validation';
type SyncOperation = 'startup' | 'manual';

type SyncScenario = {
  operation: SyncOperation;
  hasCache: boolean;
  outcome: SyncOutcome;
  initialResponse: ApiResponse;
  updateResponse: ApiResponse;
};

const syncScenarioArb: fc.Arbitrary<SyncScenario> = fc
  .record({
    operation: fc.constantFrom<SyncOperation>('startup', 'manual'),
    hasCache: fc.boolean(),
    outcome: fc.constantFrom<SyncOutcome>('success', 'timeout', 'http', 'validation'),
    initialResponse: validApiResponseArb(),
    updateResponse: validApiResponseArb(),
  })
  .filter(({ operation, hasCache }) => operation === 'startup' || hasCache)
  .map(({ operation, hasCache, outcome, initialResponse, updateResponse }) => {
    const nextContentVersion = `${updateResponse.contentVersion}-next-${initialResponse.contentVersion}`;
    const nextResponse = {
      ...updateResponse,
      contentVersion: nextContentVersion,
    };

    return {
      operation,
      hasCache: operation === 'manual' ? true : hasCache,
      outcome,
      initialResponse,
      updateResponse: nextResponse,
    };
  });

interface MutableApi {
  readonly client: ContentApiClient;
  setOutcome(outcome: SyncOutcome): void;
  setResponse(response: ApiResponse): void;
  readonly calls: { outcome: SyncOutcome; response: ApiResponse }[];
}

function createMutableApi(initialResponse: ApiResponse, initialOutcome: SyncOutcome): MutableApi {
  let outcome = initialOutcome;
  let response = initialResponse;
  const calls: { outcome: SyncOutcome; response: ApiResponse }[] = [];

  const fetchImpl: FetchImplementation = async (_input, init) => {
    calls.push({ outcome, response });

    if (outcome === 'timeout') {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('request aborted')));
      });
    }

    if (outcome === 'http') {
      return {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: { get: () => 'application/json' },
        text: async () => '{}',
      } as unknown as Response;
    }

    const body = outcome === 'validation'
      ? { ...response, schemaVersion: 999 }
      : response;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify(body),
    } as unknown as Response;
  };

  return {
    client: new ContentApiClient({
      config: {
        baseUrl: 'http://content.test',
        apiVersion: 'v1',
        // 小さい timeout で、PBT中も実際のtimeout分岐を高速に通過させる。
        timeoutMs: 2,
      },
      fetchImpl,
    }),
    setOutcome: (nextOutcome) => {
      outcome = nextOutcome;
    },
    setResponse: (nextResponse) => {
      response = nextResponse;
    },
    calls,
  };
}

async function seedProgress(storage: ReturnType<typeof createTestStorage>): Promise<ProgressStore> {
  const progressStore = new ProgressStore(storage);
  await progressStore.recordAnswer({
    questionId: 'progress-question',
    selectedOptionId: 'a',
    isCorrect: true,
    answeredAt: '2025-01-01T00:00:00.000Z',
    weekKey: 'week3',
  });
  return progressStore;
}

async function seedCache(
  cacheStore: ContentCacheStore,
  response: ApiResponse,
): Promise<void> {
  await cacheStore.writeAtomically({
    response,
    apiVersion: 'v1',
    cachedAt: '2025-01-01T00:00:00.000Z',
  });
}

async function runRefreshScenario(scenario: SyncScenario): Promise<{
  manager: ContentSyncManager;
  storage: ReturnType<typeof createTestStorage>;
  progressStore: ProgressStore;
  cacheStore: ContentCacheStore;
  api: MutableApi;
  states: SyncState[];
  initialCache: Awaited<ReturnType<ContentCacheStore['read']>>;
  expectedProgressJson: string;
}> {
  const storage = createTestStorage();
  const progressStore = await seedProgress(storage);
  const expectedProgressJson = progressStore.serialize(progressStore.getSnapshot());
  const cacheStore = new ContentCacheStore(storage);
  const api = createMutableApi(
    scenario.operation === 'manual' ? scenario.initialResponse : scenario.updateResponse,
    scenario.operation === 'manual' ? 'success' : scenario.outcome,
  );

  if (scenario.hasCache) {
    await seedCache(cacheStore, scenario.initialResponse);
  }
  const initialCache = await cacheStore.read();
  const states: SyncState[] = [];
  const manager = new ContentSyncManager({
    apiClient: api.client,
    cacheStore,
    progressStore,
    apiVersion: 'v1',
    now: () => '2025-01-01T00:00:00.000Z',
  });
  manager.subscribe(({ state }) => states.push(state));

  await manager.initialize();
  await manager.refresh('startup');

  if (scenario.operation === 'manual') {
    api.setResponse(scenario.updateResponse);
    api.setOutcome(scenario.outcome);
    await manager.retry();
  }

  return {
    manager,
    storage,
    progressStore,
    cacheStore,
    api,
    states,
    initialCache,
    expectedProgressJson,
  };
}

/**
 * Feature: curriculum-quiz-app, Property 17: Version更新とSyncStateの遷移は失敗時もデータを失わない
 *
 * **Validates: Requirements 9.17、9.19、9.26、9.27**
 */
describe('Property 17: version更新とSyncStateの遷移は失敗時もデータを失わない', () => {
  it('startup/manualの成功・timeout・HTTP失敗・検証失敗で状態、cache、Progressを保持する', async () => {
    await fc.assert(
      fc.asyncProperty(syncScenarioArb, async (scenario) => {
        const result = await runRefreshScenario(scenario);
        const { manager, storage, progressStore, cacheStore, api, states, initialCache, expectedProgressJson } = result;
        const isSuccess = scenario.outcome === 'success';
        const expectedState: SyncState = isSuccess
          ? scenario.operation === 'manual' || scenario.hasCache ? 'updated' : 'ready'
          : scenario.hasCache ? 'using-cache' : 'error';

        expect(manager.getState()).toBe(expectedState);
        expect(states.at(-1)).toBe(expectedState);
        expect(api.calls.length).toBe(scenario.operation === 'manual' ? 2 : 1);

        const currentCache = await cacheStore.read();
        if (isSuccess) {
          expect(currentCache?.response.contentVersion).toBe(scenario.updateResponse.contentVersion);
          expect(manager.getCatalog()).toEqual(currentCache?.response.catalog);
        } else if (scenario.hasCache) {
          expect(currentCache).toEqual(initialCache);
          expect(manager.getCatalog()).toEqual(initialCache?.response.catalog);
        } else {
          expect(currentCache).toBeNull();
          expect(manager.getCatalog()).toBeNull();
        }

        expect(progressStore.getSnapshot()).toEqual(progressStore.deserialize(expectedProgressJson));
        expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe(expectedProgressJson);
      }),
      { numRuns: PBT_NUM_RUNS },
    );
  });
});
