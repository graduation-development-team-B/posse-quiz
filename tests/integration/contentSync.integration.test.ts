import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { ContentApiClient } from '@/lib/content/ContentApiClient';
import {
  ContentApiContentTypeError,
  ContentApiHttpError,
  ContentApiJsonParseError,
  ContentApiTimeoutError,
} from '@/lib/content/http';
import { ContentCacheStore } from '@/lib/content/ContentCacheStore';
import { ContentSyncManager } from '@/lib/content/ContentSyncManager';
import {
  buildContentCacheVersionKey,
  CONTENT_CACHE_CURRENT_KEY,
  PROGRESS_SNAPSHOT_KEY,
} from '@/lib/storage/cacheKeys';
import type { StorageAdapter } from '@/lib/storage/StorageAdapter';
import type { ApiResponse, ContentCache } from '@/types/content';
import type { ContentApiConfig } from '@/lib/config';
import { createTestApiDouble, createTestStorage } from '../test-doubles';

function fixture(): ApiResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
}

function response(version = fixture().contentVersion): ApiResponse {
  return { ...fixture(), contentVersion: version };
}

function cache(version: string, apiVersion = 'v1'): ContentCache {
  return {
    response: response(version),
    cachedAt: '2025-01-01T00:00:00.000Z',
    apiVersion,
  };
}

function clientFor(
  api: ReturnType<typeof createTestApiDouble>,
  timeoutMs = 100,
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>,
): ContentApiClient {
  const config: ContentApiConfig = {
    baseUrl: 'https://content.example.test',
    apiVersion: 'v1',
    timeoutMs,
  };
  return new ContentApiClient({
    config,
    fetchImpl: fetchImpl ?? ((input, init) => api.fetch(input, init)),
  });
}

function abortAwareDelayedFetch(
  api: ReturnType<typeof createTestApiDouble>,
  delayMs: number,
): (input: string, init?: RequestInit) => Promise<Response> {
  return (input, init) => new Promise<Response>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      void api.fetch(input, init).then(resolve, reject);
    }, delayMs);
    const onAbort = () => {
      if (settled) return;
      clearTimeout(timer);
      settled = true;
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };
    init?.signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function seedCache(storage: StorageAdapter, version: string): Promise<void> {
  await new ContentCacheStore(storage).writeAtomically(cache(version));
}

async function runStartupAndRefresh(manager: ContentSyncManager): Promise<void> {
  await manager.initialize();
  // initialize starts the startup refresh without blocking cache publication;
  // refresh() joins that in-flight operation when it is still running.
  await manager.refresh('manual');
}

describe('content sync integration', () => {
  it.each([
    {
      name: 'HTTP failure',
      configure: (api: ReturnType<typeof createTestApiDouble>) => api.respond({ status: 503, body: { error: 'unavailable' } }),
      expectedError: ContentApiHttpError,
      expectedCode: 'http',
    },
    {
      name: 'JSON failure',
      configure: (api: ReturnType<typeof createTestApiDouble>) => api.respond({ status: 200, body: '{not-json' }),
      expectedError: ContentApiJsonParseError,
      expectedCode: 'json',
    },
    {
      name: 'Content-Type failure',
      configure: (api: ReturnType<typeof createTestApiDouble>) => api.respond({ status: 200, body: fixture(), contentType: 'text/plain' }),
      expectedError: ContentApiContentTypeError,
      expectedCode: 'content-type',
    },
    {
      name: 'timeout',
      configure: (api: ReturnType<typeof createTestApiDouble>) => api.respond({ status: 200, body: fixture(), delayMs: 25 }),
      expectedError: ContentApiTimeoutError,
      expectedCode: 'timeout',
    },
  ])('keeps the last valid cache on $name', async ({ configure, expectedError, expectedCode }) => {
    const storage = createTestStorage();
    await seedCache(storage, '2025-01-01.1');

    const api = createTestApiDouble({ status: 200, body: fixture() });
    configure(api);
    const manager = new ContentSyncManager({
      apiClient: clientFor(
        api,
        expectedCode === 'timeout' ? 5 : 100,
        expectedCode === 'timeout' ? abortAwareDelayedFetch(api, 25) : undefined,
      ),
      cacheStore: new ContentCacheStore(storage),
      now: () => '2025-01-02T00:00:00.000Z',
    });

    await runStartupAndRefresh(manager);

    expect(manager.getState()).toBe('using-cache');
    expect(manager.getCatalog()).toEqual(response('2025-01-01.1').catalog);
    expect(manager.getError()).toBeInstanceOf(expectedError);
    expect((manager.getError() as Error & { code?: string }).code).toBe(expectedCode);
  });

  it('shows a retryable error without cache and recovers through the same API path', async () => {
    const storage = createTestStorage();
    const api = createTestApiDouble({ status: 503, body: { error: 'offline' } });
    const manager = new ContentSyncManager({
      apiClient: clientFor(api),
      cacheStore: new ContentCacheStore(storage),
    });

    await runStartupAndRefresh(manager);
    expect(manager.getState()).toBe('error');
    expect(manager.getCatalog()).toBeNull();
    expect(manager.getMessage()).toContain('再試行');

    api.respond({ status: 200, body: response('2025-01-02.1') });
    await manager.retry();

    expect(manager.getState()).toBe('ready');
    expect(manager.getCatalog()?.questions.length).toBeGreaterThan(0);
    expect(await new ContentCacheStore(storage).read()).toEqual(
      expect.objectContaining({ response: expect.objectContaining({ contentVersion: '2025-01-02.1' }) }),
    );
  });

  it('does not write or switch memory for an identical API and content version', async () => {
    const storage = createTestStorage();
    await seedCache(storage, '2025-01-01.1');
    const api = createTestApiDouble({ status: 200, body: response('2025-01-01.1') });
    const cacheStore = new ContentCacheStore(storage);
    const writeSpy = vi.spyOn(cacheStore, 'writeAtomically');
    const manager = new ContentSyncManager({
      apiClient: clientFor(api),
      cacheStore,
    });

    await manager.initialize();
    const initialCatalog = manager.getCatalog();
    await manager.refresh('manual');

    expect(writeSpy).not.toHaveBeenCalled();
    expect(manager.getState()).toBe('ready');
    expect(manager.getCatalog()).toBe(initialCatalog);
  });

  it('switches to a new catalog only after the real cache store commits atomically', async () => {
    const storage = createTestStorage();
    await seedCache(storage, '2025-01-01.1');
    await storage.setItem(PROGRESS_SNAPSHOT_KEY, 'progress-snapshot');

    const nextVersion = '2025-01-02.1';
    const api = createTestApiDouble({ status: 200, body: response(nextVersion) });
    const manager = new ContentSyncManager({
      apiClient: clientFor(api),
      cacheStore: new ContentCacheStore(storage),
      now: () => '2025-01-02T00:00:00.000Z',
    });

    await runStartupAndRefresh(manager);

    expect(manager.getState()).toBe('updated');
    expect(manager.getCatalog()).toEqual(response(nextVersion).catalog);
    expect(await storage.getItem(CONTENT_CACHE_CURRENT_KEY)).toBe(nextVersion);
    expect(await storage.getItem(buildContentCacheVersionKey('2025-01-01.1'))).toBeNull();
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe('progress-snapshot');
  });

  it('keeps the old pointer and in-memory catalog when the atomic commit fails', async () => {
    const storage = createTestStorage();
    await seedCache(storage, '2025-01-01.1');
    await storage.setItem(PROGRESS_SNAPSHOT_KEY, 'progress-snapshot');

    const nextVersion = '2025-01-02.1';
    const nextVersionKey = buildContentCacheVersionKey(nextVersion);
    const failingStorage: StorageAdapter = {
      getItem: storage.getItem,
      getAllKeys: storage.getAllKeys,
      removeItem: storage.removeItem,
      setItem: async (key, value) => {
        if (key === nextVersionKey) throw new Error('version write failed');
        await storage.setItem(key, value);
      },
    };
    const api = createTestApiDouble({ status: 200, body: response(nextVersion) });
    const manager = new ContentSyncManager({
      apiClient: clientFor(api),
      cacheStore: new ContentCacheStore(failingStorage),
    });

    await runStartupAndRefresh(manager);

    expect(manager.getState()).toBe('using-cache');
    expect(manager.getCatalog()).toEqual(response('2025-01-01.1').catalog);
    expect(await storage.getItem(CONTENT_CACHE_CURRENT_KEY)).toBe('2025-01-01.1');
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe('progress-snapshot');
  });

  it('uses a GET-only request and never sends progress data to Content_API', async () => {
    const api = createTestApiDouble({ status: 200, body: fixture() });
    await clientFor(api).fetchCatalog();

    const request = api.calls[0]?.init as RequestInit;
    expect(api.calls).toHaveLength(1);
    expect(api.calls[0]?.input).toBe('https://content.example.test/api/v1/content/catalog');
    expect(request.method).toBe('GET');
    expect(request.body).toBeUndefined();
    expect(request.credentials).toBe('omit');
    expect(request.headers).toEqual(expect.objectContaining({ Accept: 'application/json' }));
    expect(JSON.stringify(request)).not.toContain('progress');
  });
});
