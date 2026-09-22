import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { ContentSyncManagerImpl } from '@/lib/content/ContentSyncManager';
import type { ContentCacheStore } from '@/types/sync';
import type { ApiResponse, ContentCache } from '@/types/content';
import { validApiResponseArb } from '@/tests/generators/catalog';
import { PBT_NUM_RUNS } from '@/tests/pbt';

interface InstrumentedCacheStore extends ContentCacheStore {
  writeCount: number;
  cleanupCount: number;
}

function createCacheStore(currentCache: ContentCache): InstrumentedCacheStore {
  const store: InstrumentedCacheStore = {
    writeCount: 0,
    cleanupCount: 0,
    read: async () => currentCache,
    writeAtomically: async () => {
      store.writeCount += 1;
    },
    removePreviousAfterCommit: async () => {
      store.cleanupCount += 1;
    },
  };
  return store;
}

function withContentVersion(response: ApiResponse, contentVersion: string): ApiResponse {
  return { ...response, contentVersion };
}

/**
 * Feature: curriculum-quiz-app, Property 3: 同一バージョンは再保存・再切替しない
 *
 * **Validates: Requirements 1.17、9.21**
 */
describe('Property 3: 同一 contentVersion の再保存・再切替回避', () => {
  it('同一API_VersionとcontentVersionではcache write、旧Catalog切替、メモリ参照を変化させない', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          apiVersion: fc.stringMatching(/^v[1-9][0-9]{0,2}$/),
          currentResponse: validApiResponseArb(),
          incomingResponse: validApiResponseArb(),
        }),
        async ({ apiVersion, currentResponse, incomingResponse }) => {
          const currentCache: ContentCache = {
            response: currentResponse,
            apiVersion,
            cachedAt: '2025-01-01T00:00:00.000Z',
          };
          const sameVersionResponse = withContentVersion(
            incomingResponse,
            currentResponse.contentVersion,
          );
          const cacheStore = createCacheStore(currentCache);
          const apiClient = {
            fetchCatalog: async () => sameVersionResponse,
          };
          const manager = new ContentSyncManagerImpl({
            apiClient,
            cacheStore,
            apiVersion,
            now: () => '2025-01-02T00:00:00.000Z',
          });

          await manager.initialize();
          const catalogBeforeRefresh = manager.getCatalog();
          const contentVersionBeforeRefresh = currentCache.response.contentVersion;

          await manager.refresh('manual');

          expect(cacheStore.writeCount).toBe(0);
          expect(cacheStore.cleanupCount).toBe(0);
          expect(currentCache.response.contentVersion).toBe(contentVersionBeforeRefresh);
          expect(manager.getCatalog()).toBe(catalogBeforeRefresh);
          expect(manager.getCatalog()).toBe(currentCache.response.catalog);
          expect(manager.getCatalog()).not.toBe(sameVersionResponse.catalog);
        },
      ),
      { numRuns: PBT_NUM_RUNS },
    );
  });
});
