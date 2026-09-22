import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  ContentSyncManager,
  type ContentSyncManagerOptions,
} from '@/lib/content/ContentSyncManager';
import type { ApiResponse, ContentCache } from '@/types/content';
import type { RestoreResult } from '@/types/progress';
import { createInitialProgressSnapshot } from '@/lib/progress/progressDefaults';
import type { ContentApiClient, ContentCacheStore } from '@/types/sync';

function fixture(): ApiResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
}

function makeCache(contentVersion: string, apiVersion = 'v1'): ContentCache {
  return {
    response: { ...fixture(), contentVersion },
    cachedAt: '2025-01-01T00:00:00.000Z',
    apiVersion,
  };
}

function createHarness(
  currentCache: ContentCache | null,
  apiResponse: ApiResponse | Error,
  progressStore?: ContentSyncManagerOptions['progressStore'],
) {
  let cache = currentCache;
  const apiClient: ContentApiClient = {
    fetchCatalog: vi.fn(async () => {
      if (apiResponse instanceof Error) throw apiResponse;
      return apiResponse;
    }),
  };
  const cacheStore: ContentCacheStore = {
    read: vi.fn(async () => cache),
    writeAtomically: vi.fn(async (next) => {
      cache = next;
    }),
    removePreviousAfterCommit: vi.fn(async () => undefined),
  };
  const manager = new ContentSyncManager({
    apiClient,
    cacheStore,
    progressStore,
    now: () => '2025-01-02T00:00:00.000Z',
  });
  return { manager, apiClient, cacheStore };
}

describe('ContentSyncManager', () => {
  it('starts Progress restore and cache read together, then exposes cache before API finishes', async () => {
    let resolveApi!: (response: ApiResponse) => void;
    const apiPromise = new Promise<ApiResponse>((resolve) => {
      resolveApi = resolve;
    });
    let resolveProgress!: () => void;
    const progressRestore = vi.fn(() => new Promise<RestoreResult>((resolve) => {
      resolveProgress = () => resolve({
        status: 'empty',
        snapshot: createInitialProgressSnapshot(),
      });
    }));
    const cached = makeCache('2025-01-01.1');
    const apiClient: ContentApiClient = {
      fetchCatalog: vi.fn(() => apiPromise),
    };
    const cacheStore: ContentCacheStore = {
      read: vi.fn(async () => cached),
      writeAtomically: vi.fn(async () => undefined),
      removePreviousAfterCommit: vi.fn(async () => undefined),
    };
    const manager = new ContentSyncManager({
      apiClient,
      cacheStore,
      progressStore: { restore: progressRestore },
    });

    const initialized = manager.initialize();
    expect(progressRestore).toHaveBeenCalledTimes(1);
    expect(cacheStore.read).toHaveBeenCalledTimes(1);

    await initialized;
    expect(manager.getCatalog()).toBe(cached.response.catalog);
    expect(manager.getState()).toBe('using-cache');
    expect(apiClient.fetchCatalog).toHaveBeenCalledTimes(1);

    resolveProgress();
    resolveApi({ ...fixture(), contentVersion: '2025-01-02.1' });
    await manager.refresh('manual');
  });

  it('does not save or switch memory for the same API version and content version', async () => {
    const cached = makeCache('2025-01-01.1');
    const { manager, cacheStore } = createHarness(cached, { ...fixture(), contentVersion: cached.response.contentVersion });
    await manager.initialize();
    const originalCatalog = manager.getCatalog();
    await manager.refresh('manual');

    expect(cacheStore.writeAtomically).not.toHaveBeenCalled();
    expect(cacheStore.removePreviousAfterCommit).not.toHaveBeenCalled();
    expect(manager.getCatalog()).toBe(originalCatalog);
    expect(manager.getState()).toBe('ready');
  });

  it('switches memory only after a successful atomic cache commit', async () => {
    const cached = makeCache('2025-01-01.1');
    const nextResponse = { ...fixture(), contentVersion: '2025-01-02.1' };
    const { manager, cacheStore } = createHarness(cached, nextResponse);

    await manager.initialize();
    await manager.refresh('manual');

    expect(cacheStore.writeAtomically).toHaveBeenCalledTimes(1);
    expect(cacheStore.removePreviousAfterCommit).toHaveBeenCalledWith('2025-01-02.1');
    expect(manager.getCatalog()).toEqual(nextResponse.catalog);
    expect(manager.getState()).toBe('updated');
  });

  it('keeps cache on API failure and exposes a retryable error without cache', async () => {
    const cachedHarness = createHarness(makeCache('2025-01-01.1'), new Error('offline'));
    await cachedHarness.manager.initialize();
    await cachedHarness.manager.refresh('manual');
    expect(cachedHarness.manager.getState()).toBe('using-cache');
    expect(cachedHarness.manager.getCatalog()).not.toBeNull();

    const apiResponse = fixture();
    const apiClient: ContentApiClient = {
      fetchCatalog: vi.fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce(apiResponse),
    };
    const cacheStore: ContentCacheStore = {
      read: vi.fn(async () => null),
      writeAtomically: vi.fn(async () => undefined),
      removePreviousAfterCommit: vi.fn(async () => undefined),
    };
    const manager = new ContentSyncManager({ apiClient, cacheStore });

    await manager.initialize();
    await manager.refresh('manual');
    expect(manager.getState()).toBe('error');
    expect(manager.getCatalog()).toBeNull();

    await manager.retry();
    expect(manager.getState()).toBe('ready');
    expect(manager.getCatalog()).toEqual(apiResponse.catalog);
  });
});
