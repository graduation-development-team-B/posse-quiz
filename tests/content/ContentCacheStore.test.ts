import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  buildContentCacheVersionKey,
  CONTENT_CACHE_CURRENT_KEY,
  PROGRESS_SNAPSHOT_KEY,
} from '@/lib/storage/cacheKeys';
import { ContentCacheStore } from '@/lib/content/ContentCacheStore';
import type { ApiResponse, ContentCache } from '@/types/content';
import type { StorageAdapter } from '@/lib/storage/StorageAdapter';
import { createTestStorage } from '../test-doubles';

function readFixture(): ApiResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
}

function cache(version: string, apiVersion = 'v1'): ContentCache {
  return {
    response: { ...readFixture(), contentVersion: version },
    cachedAt: '2025-01-01T00:00:00.000Z',
    apiVersion,
  };
}

describe('ContentCacheStore', () => {
  it('reads the current version from the content-cache key space only', async () => {
    const current = cache('2025-01-01.1');
    const storage = createTestStorage({
      [CONTENT_CACHE_CURRENT_KEY]: current.response.contentVersion,
      [buildContentCacheVersionKey(current.response.contentVersion)]: JSON.stringify(current),
      [PROGRESS_SNAPSHOT_KEY]: '{"streakCount":3}',
    });
    const store = new ContentCacheStore(storage);

    await expect(store.read()).resolves.toEqual(current);
    await expect(storage.getItem(PROGRESS_SNAPSHOT_KEY)).resolves.toBe('{"streakCount":3}');
  });

  it('commits a new version only after staging and readback validation', async () => {
    const old = cache('2025-01-01.1');
    const next = cache('2025-01-02.1');
    const storage = createTestStorage({
      [CONTENT_CACHE_CURRENT_KEY]: old.response.contentVersion,
      [buildContentCacheVersionKey(old.response.contentVersion)]: JSON.stringify(old),
      [PROGRESS_SNAPSHOT_KEY]: 'progress',
    });
    const store = new ContentCacheStore(storage);

    await store.writeAtomically(next);

    expect(await store.read()).toEqual(next);
    expect(await storage.getItem(buildContentCacheVersionKey(old.response.contentVersion))).toBe(JSON.stringify(old));
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe('progress');

    await store.removePreviousAfterCommit(next.response.contentVersion);

    expect(await storage.getItem(buildContentCacheVersionKey(old.response.contentVersion))).toBeNull();
    expect(await storage.getItem(buildContentCacheVersionKey(next.response.contentVersion))).not.toBeNull();
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe('progress');
  });

  it('keeps the old pointer and version when the new version write fails', async () => {
    const old = cache('2025-01-01.1');
    const next = cache('2025-01-02.1');
    const base = createTestStorage({
      [CONTENT_CACHE_CURRENT_KEY]: old.response.contentVersion,
      [buildContentCacheVersionKey(old.response.contentVersion)]: JSON.stringify(old),
      [PROGRESS_SNAPSHOT_KEY]: 'progress',
    });
    const failingStorage: StorageAdapter = {
      getItem: base.getItem,
      getAllKeys: base.getAllKeys,
      removeItem: base.removeItem,
      setItem: async (key, value) => {
        if (key === buildContentCacheVersionKey(next.response.contentVersion)) {
          throw new Error('version write failed');
        }
        return base.setItem(key, value);
      },
    };
    const store = new ContentCacheStore(failingStorage);

    await expect(store.writeAtomically(next)).rejects.toThrow('原子的保存に失敗');
    expect(await store.read()).toEqual(old);
    expect(await base.getItem(PROGRESS_SNAPSHOT_KEY)).toBe('progress');
  });

  it('keeps the old pointer when the committed version cannot be read back', async () => {
    const old = cache('2025-01-01.1');
    const next = cache('2025-01-02.1');
    const base = createTestStorage({
      [CONTENT_CACHE_CURRENT_KEY]: old.response.contentVersion,
      [buildContentCacheVersionKey(old.response.contentVersion)]: JSON.stringify(old),
      [PROGRESS_SNAPSHOT_KEY]: 'progress',
    });
    const versionKey = buildContentCacheVersionKey(next.response.contentVersion);
    const storage: StorageAdapter = {
      getAllKeys: base.getAllKeys,
      removeItem: base.removeItem,
      setItem: base.setItem,
      getItem: async (key) => key === versionKey ? '{invalid json' : base.getItem(key),
    };

    await expect(new ContentCacheStore(storage).writeAtomically(next)).rejects.toThrow('JSON解析');
    expect(await base.getItem(CONTENT_CACHE_CURRENT_KEY)).toBe(old.response.contentVersion);
    expect(await base.getItem(PROGRESS_SNAPSHOT_KEY)).toBe('progress');
  });

  it('does not delete old versions or progress when cleanup cannot remove a key', async () => {
    const old = cache('2025-01-01.1');
    const next = cache('2025-01-02.1');
    const base = createTestStorage({
      [CONTENT_CACHE_CURRENT_KEY]: next.response.contentVersion,
      [buildContentCacheVersionKey(old.response.contentVersion)]: JSON.stringify(old),
      [buildContentCacheVersionKey(next.response.contentVersion)]: JSON.stringify(next),
      [PROGRESS_SNAPSHOT_KEY]: 'progress',
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storage: StorageAdapter = {
      getItem: base.getItem,
      getAllKeys: base.getAllKeys,
      setItem: base.setItem,
      removeItem: async (key) => {
        if (key === buildContentCacheVersionKey(old.response.contentVersion)) {
          throw new Error('cleanup failed');
        }
        return base.removeItem(key);
      },
    };

    await new ContentCacheStore(storage).removePreviousAfterCommit(next.response.contentVersion);

    expect(await base.getItem(buildContentCacheVersionKey(old.response.contentVersion))).toBe(JSON.stringify(old));
    expect(await base.getItem(PROGRESS_SNAPSHOT_KEY)).toBe('progress');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('rejects a corrupted current version without touching progress', async () => {
    const version = '2025-01-01.1';
    const storage = createTestStorage({
      [CONTENT_CACHE_CURRENT_KEY]: version,
      [buildContentCacheVersionKey(version)]: '{invalid json',
      [PROGRESS_SNAPSHOT_KEY]: 'progress',
    });

    await expect(new ContentCacheStore(storage).read()).resolves.toBeNull();
    expect(await storage.getItem(PROGRESS_SNAPSHOT_KEY)).toBe('progress');
  });
});
