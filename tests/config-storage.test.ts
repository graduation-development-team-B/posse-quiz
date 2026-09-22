import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryStorageAdapter, AsyncStorageAdapter } from '@/lib/storage/nativeStorage';
import { WebStorageAdapter } from '@/lib/storage/webStorage';

const importConfig = async () => {
  vi.resetModules();
  return import('@/lib/config');
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Content API configuration', () => {
  it('reads public API settings and builds the versioned catalog URL', async () => {
    vi.stubEnv('EXPO_PUBLIC_CONTENT_API_BASE_URL', 'https://staging.example.test/');
    vi.stubEnv('EXPO_PUBLIC_CONTENT_API_VERSION', 'v2');
    vi.stubEnv('EXPO_PUBLIC_CONTENT_API_TIMEOUT_MS', '12000');

    const config = await importConfig();

    expect(config.CONTENT_API_CONFIG).toEqual({
      baseUrl: 'https://staging.example.test',
      apiVersion: 'v2',
      timeoutMs: 12000,
    });
    expect(config.buildCatalogUrl()).toBe(
      'https://staging.example.test/api/v2/content/catalog',
    );
  });

  it('rejects credentials in a public API URL', async () => {
    vi.stubEnv(
      'EXPO_PUBLIC_CONTENT_API_BASE_URL',
      'https://user:secret@example.test',
    );

    await expect(importConfig()).rejects.toThrow('認証情報');
  });

  it('uses the safe timeout default for invalid public timeout values', async () => {
    vi.stubEnv('EXPO_PUBLIC_CONTENT_API_TIMEOUT_MS', 'not-a-number');

    const config = await importConfig();

    expect(config.CONTENT_API_TIMEOUT_MS).toBe(8000);
  });
});

describe('storage adapters', () => {
  it('uses localStorage through the platform-neutral adapter', async () => {
    const adapter = new WebStorageAdapter();

    await adapter.setItem('content-cache:current', '{"version":1}');
    await adapter.setItem('progress:snapshot', '{"streakCount":0}');

    expect(await adapter.getItem('content-cache:current')).toBe('{"version":1}');
    expect(await adapter.getAllKeys()).toEqual([
      'content-cache:current',
      'progress:snapshot',
    ]);

    await adapter.removeItem('content-cache:current');
    expect(await adapter.getItem('content-cache:current')).toBeNull();
  });

  it('keeps the native key-value implementation behind StorageAdapter', async () => {
    const nativeStore = new InMemoryStorageAdapter();
    const adapter = new AsyncStorageAdapter(nativeStore);

    await adapter.setItem('progress:snapshot', '{"streakCount":2}');

    expect(await adapter.getItem('progress:snapshot')).toBe('{"streakCount":2}');
    expect(await adapter.getAllKeys()).toEqual(['progress:snapshot']);
  });
});
