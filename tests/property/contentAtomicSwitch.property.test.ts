import { describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';

import {
  ContentCacheStore,
} from '@/lib/content/ContentCacheStore';
import { ContentSyncManager } from '@/lib/content/ContentSyncManager';
import {
  buildContentCacheVersionKey,
  CONTENT_CACHE_CURRENT_KEY,
  CONTENT_CACHE_STAGING_PREFIX,
  PROGRESS_SNAPSHOT_KEY,
} from '@/lib/storage/cacheKeys';
import type { ApiResponse, ContentCache } from '@/types/content';
import type { ContentApiClient } from '@/types/sync';
import type { StorageAdapter } from '@/lib/storage/StorageAdapter';
import { validApiResponseArb } from '../generators/catalog';
import { createTestStorage } from '../test-doubles';

type AtomicScenario =
  | 'staging-write-failure'
  | 'staging-readback-failure'
  | 'version-readback-failure'
  | 'commit-success'
  | 'cleanup-failure';

const atomicScenarioArb = fc.constantFrom<AtomicScenario>(
  'staging-write-failure',
  'staging-readback-failure',
  'version-readback-failure',
  'commit-success',
  'cleanup-failure',
);

interface AtomicCase {
  readonly oldResponse: ApiResponse;
  readonly nextResponse: ApiResponse;
  readonly scenario: AtomicScenario;
}

const atomicCaseArb: fc.Arbitrary<AtomicCase> = fc.record({
  oldResponse: validApiResponseArb(),
  nextResponse: validApiResponseArb(),
  scenario: atomicScenarioArb,
}).map(({ oldResponse, nextResponse, scenario }) => ({
  oldResponse,
  // The content version is guaranteed to be newer/different while the
  // generated catalog still exercises the complete response validator.
  nextResponse: {
    ...nextResponse,
    contentVersion: `${nextResponse.contentVersion}-next`,
  },
  scenario,
}));

function makeCache(
  response: ApiResponse,
  cachedAt = '2025-01-01T00:00:00.000Z',
): ContentCache {
  return {
    response,
    cachedAt,
    apiVersion: 'v1',
  };
}

function createFaultyAdapter(
  oldCache: ContentCache,
  nextVersion: string,
  scenario: AtomicScenario,
): StorageAdapter & { readonly backing: StorageAdapter } {
  const oldVersionKey = buildContentCacheVersionKey(oldCache.response.contentVersion);
  const nextVersionKey = buildContentCacheVersionKey(nextVersion);
  const backing = createTestStorage({
    [CONTENT_CACHE_CURRENT_KEY]: oldCache.response.contentVersion,
    [oldVersionKey]: JSON.stringify(oldCache),
    [PROGRESS_SNAPSHOT_KEY]: 'progress-snapshot',
  });

  return {
    backing,
    getItem: async (key) => {
      if (scenario === 'staging-readback-failure' && key.startsWith(CONTENT_CACHE_STAGING_PREFIX)) {
        return '{invalid staging json';
      }
      if (scenario === 'version-readback-failure' && key === nextVersionKey) {
        return '{invalid version json';
      }
      return backing.getItem(key);
    },
    setItem: async (key, value) => {
      if (scenario === 'staging-write-failure' && key.startsWith(CONTENT_CACHE_STAGING_PREFIX)) {
        throw new Error('generated staging write failure');
      }
      return backing.setItem(key, value);
    },
    removeItem: async (key) => {
      if (scenario === 'cleanup-failure' && key === oldVersionKey) {
        throw new Error('generated old-version cleanup failure');
      }
      return backing.removeItem(key);
    },
    getAllKeys: backing.getAllKeys,
  };
}

function createBlockedAdapter(
  adapter: StorageAdapter,
  scenario: AtomicScenario,
): StorageAdapter & { readonly isBlocked: () => boolean; readonly release: () => void } {
  let blocked = false;
  let releaseBlockedWrite: (() => void) | undefined;
  const shouldBlockBeforeCommit = scenario !== 'staging-write-failure';
  const released = new Promise<void>((resolve) => {
    releaseBlockedWrite = resolve;
  });

  return {
    isBlocked: () => blocked,
    release: () => releaseBlockedWrite?.(),
    getItem: adapter.getItem,
    setItem: async (key, value) => {
      if (shouldBlockBeforeCommit && key.startsWith(CONTENT_CACHE_STAGING_PREFIX)) {
        blocked = true;
        await released;
      }
      return adapter.setItem(key, value);
    },
    removeItem: adapter.removeItem,
    getAllKeys: adapter.getAllKeys,
  };
}

async function flushAsyncWork(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/**
 * Feature: curriculum-quiz-app, Property 4: 新版切替は原子的である
 *
 * **Validates: Requirements 9.16, 9.18, 9.19**
 */
describe('Property 4: 新版の原子的切替', () => {
  it('保存途中・再読込失敗では旧版を維持し、commit後だけ新版へ切り替える', async () => {
    const cleanupWarning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await fc.assert(
      fc.asyncProperty(atomicCaseArb, async ({ oldResponse, nextResponse, scenario }) => {
        const oldCache = makeCache(oldResponse);
        const nextCache = makeCache(nextResponse, '2025-01-02T00:00:00.000Z');
        const faultyAdapter = createFaultyAdapter(oldCache, nextResponse.contentVersion, scenario);
        const adapter = createBlockedAdapter(faultyAdapter, scenario);
        const cacheStore = new ContentCacheStore(adapter);
        const apiClient: ContentApiClient = {
          fetchCatalog: vi.fn()
            // initialize() checks the current version and completes without a write.
            .mockResolvedValueOnce(oldResponse)
            .mockResolvedValueOnce(nextResponse),
        };
        const manager = new ContentSyncManager({
          apiClient,
          cacheStore,
          apiVersion: 'v1',
          now: () => '2025-01-02T00:00:00.000Z',
        });

        await manager.initialize();
        // initialize() starts the startup refresh in the background. Wait for it
        // to settle so the manual refresh below always consumes nextResponse.
        await flushAsyncWork();
        const oldCatalog = manager.getCatalog();
        expect(oldCatalog).not.toBeNull();
        expect(oldCatalog).toEqual(oldResponse.catalog);

        const refreshPromise = manager.refresh('manual');
        await flushAsyncWork();

        if (adapter.isBlocked()) {
          // writeAtomically has not returned, so neither pointer nor memory may move.
          expect(manager.getCatalog()).toBe(oldCatalog);
          expect(await cacheStore.read()).toEqual(oldCache);
          expect(await faultyAdapter.backing.getItem(CONTENT_CACHE_CURRENT_KEY))
            .toBe(oldResponse.contentVersion);
          adapter.release();
        }

        await refreshPromise;

        const persistedProgress = await faultyAdapter.backing.getItem(PROGRESS_SNAPSHOT_KEY);
        expect(persistedProgress).toBe('progress-snapshot');

        const committed = scenario === 'commit-success' || scenario === 'cleanup-failure';
        if (!committed) {
          expect(manager.getCatalog()).toBe(oldCatalog);
          expect(manager.getState()).toBe('using-cache');
          expect(await cacheStore.read()).toEqual(oldCache);
          expect(await faultyAdapter.backing.getItem(CONTENT_CACHE_CURRENT_KEY))
            .toBe(oldResponse.contentVersion);
          const nextPersisted = await faultyAdapter.backing.getItem(
            buildContentCacheVersionKey(nextResponse.contentVersion),
          );
          // A failed version readback may leave an unreferenced version body,
          // but the current pointer must continue to select the old cache.
          expect(nextPersisted === null).toBe(scenario !== 'version-readback-failure');
          return;
        }

        expect(manager.getCatalog()).toEqual(nextResponse.catalog);
        expect(manager.getCatalog()).not.toBe(oldCatalog);
        expect(manager.getState()).toBe('updated');
        expect(await cacheStore.read()).toEqual(nextCache);
        expect(await faultyAdapter.backing.getItem(CONTENT_CACHE_CURRENT_KEY))
          .toBe(nextResponse.contentVersion);

        const oldPersisted = await faultyAdapter.backing.getItem(
          buildContentCacheVersionKey(oldResponse.contentVersion),
        );
        expect(oldPersisted === null).toBe(scenario === 'commit-success');
        if (scenario === 'cleanup-failure') {
          expect(cleanupWarning).toHaveBeenCalled();
        }
      }),
      { numRuns: 100 },
    );

    cleanupWarning.mockRestore();
  });
});
