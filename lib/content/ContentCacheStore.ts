/**
 * Content_Cache専用の版管理ストア。
 *
 * 進捗の `progress:*` キーには触れず、教材キャッシュだけを
 * `content-cache:*` キー領域で管理する。新版は版別キーへ保存・再読込検証した後に
 * current pointer を切り替えるため、保存途中のデータを現行教材として読み込まない。
 */

import type { ContentCache } from '@/types/content';
import type { ContentCacheStore as ContentCacheStoreContract } from '@/types/sync';
import type { StorageAdapter } from '@/lib/storage/StorageAdapter';
import {
  buildContentCacheStagingKey,
  buildContentCacheVersionKey,
  CONTENT_CACHE_CURRENT_KEY,
  CONTENT_CACHE_VERSION_PREFIX,
} from '@/lib/storage/cacheKeys';
import { validateApiResponse } from './validateApiResponse';

interface ContentCacheRecord {
  response: unknown;
  cachedAt: unknown;
  apiVersion: unknown;
}

let stagingSequence = 0;

/** Content_Cacheの保存・読込に失敗した場合のエラー。 */
export class ContentCacheStoreError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ContentCacheStoreError';
  }
}

/**
 * `content-cache:current` には contentVersion の文字列を保存し、
 * `content-cache:version:{contentVersion}` から対応する ContentCache を読み込む。
 */
export class ContentCacheStore implements ContentCacheStoreContract {
  constructor(private readonly adapter: StorageAdapter) {}

  /** current pointer が指す正常なキャッシュだけを返す。不正・欠落時はnullにする。 */
  async read(): Promise<ContentCache | null> {
    const contentVersion = await this.adapter.getItem(CONTENT_CACHE_CURRENT_KEY);
    if (contentVersion === null || contentVersion.length === 0) return null;

    const raw = await this.adapter.getItem(buildContentCacheVersionKey(contentVersion));
    if (raw === null) return null;

    try {
      return parseContentCache(raw, contentVersion);
    } catch {
      // 破損したキャッシュは教材として利用せず、同期側にfallback/errorを選ばせる。
      return null;
    }
  }

  /**
   * 新版を staging key へ保存し、再読込検証、版別キー保存、current pointer切替を行う。
   * pointerの切替に失敗した場合は、旧pointerを可能な限り復元して旧版を現行のままにする。
   */
  async writeAtomically(cache: ContentCache): Promise<void> {
    const validatedCache = validateContentCache(cache);
    const serialized = JSON.stringify(validatedCache);
    const contentVersion = validatedCache.response.contentVersion;
    const stagingKey = buildContentCacheStagingKey(contentVersion, nextStagingToken());
    const previousPointer = await this.adapter.getItem(CONTENT_CACHE_CURRENT_KEY);

    try {
      // 1. 一時キーへ保存する。ここではcurrent pointerを変更しない。
      await this.adapter.setItem(stagingKey, serialized);

      // 2. 一時キーから再読込し、レスポンス全体と版情報を検証する。
      const staged = await this.adapter.getItem(stagingKey);
      if (staged === null) {
        throw new ContentCacheStoreError('教材キャッシュの保存結果を読み込めませんでした。');
      }
      const reloaded = parseContentCache(staged, contentVersion);
      if (JSON.stringify(reloaded) !== JSON.stringify(validatedCache)) {
        throw new ContentCacheStoreError('教材キャッシュの再読込結果が保存内容と一致しません。');
      }

      // 3. 検証済みデータを版別の正式キーへ置き、正式キーも再読込して検証する。
      const versionKey = buildContentCacheVersionKey(contentVersion);
      await this.adapter.setItem(versionKey, staged);
      const persisted = await this.adapter.getItem(versionKey);
      if (persisted === null) {
        throw new ContentCacheStoreError('教材キャッシュの版別データを読み込めませんでした。');
      }
      const persistedCache = parseContentCache(persisted, contentVersion);
      if (JSON.stringify(persistedCache) !== JSON.stringify(validatedCache)) {
        throw new ContentCacheStoreError('教材キャッシュの版別データ検証結果が一致しません。');
      }

      // 4. すべての検証が完了した最後にpointerだけを切り替える。
      try {
        await this.adapter.setItem(CONTENT_CACHE_CURRENT_KEY, contentVersion);
      } catch (error) {
        await this.restorePointer(previousPointer);
        throw new ContentCacheStoreError(
          '教材キャッシュの現行版切替に失敗しました。旧版を維持します。',
          { cause: error },
        );
      }
    } catch (error) {
      // 失敗時は旧pointer・旧版・Progress_Snapshotを変更しない。
      await this.removeQuietly(stagingKey);
      if (error instanceof ContentCacheStoreError) throw error;
      throw new ContentCacheStoreError('教材キャッシュの原子的保存に失敗しました。', { cause: error });
    }

    // staging keyはpointer切替後に不要になる。削除失敗でもコミット済みデータは有効。
    await this.removeQuietly(stagingKey);
  }

  /**
   * commit後に、current pointer以外の版別キャッシュを削除する。
   * cleanupの失敗で新しいcurrentを巻き戻したり、Progress_Snapshotを削除したりしない。
   */
  async removePreviousAfterCommit(contentVersion: string): Promise<void> {
    const currentPointer = await this.adapter.getItem(CONTENT_CACHE_CURRENT_KEY);
    if (currentPointer !== contentVersion) return;

    let keys: string[];
    try {
      keys = await this.adapter.getAllKeys();
    } catch (error) {
      console.warn('旧教材キャッシュの一覧取得に失敗しました。新しい教材は利用可能です。', error);
      return;
    }

    const currentKey = buildContentCacheVersionKey(contentVersion);
    const previousKeys = keys.filter(
      (key) => key.startsWith(CONTENT_CACHE_VERSION_PREFIX) && key !== currentKey,
    );
    for (const key of previousKeys) {
      try {
        await this.adapter.removeItem(key);
      } catch (error) {
        // 旧版の掃除はbest effort。現行pointerと新版本体は保持する。
        console.warn(`旧教材キャッシュの削除に失敗しました: ${key}`, error);
      }
    }
  }

  private async restorePointer(previousPointer: string | null): Promise<void> {
    try {
      if (previousPointer === null) {
        await this.adapter.removeItem(CONTENT_CACHE_CURRENT_KEY);
      } else {
        await this.adapter.setItem(CONTENT_CACHE_CURRENT_KEY, previousPointer);
      }
    } catch (restoreError) {
      console.warn('教材キャッシュの現行版を旧版へ戻せませんでした。', restoreError);
    }
  }

  private async removeQuietly(key: string): Promise<void> {
    try {
      await this.adapter.removeItem(key);
    } catch (error) {
      console.warn(`教材キャッシュの一時キー削除に失敗しました: ${key}`, error);
    }
  }
}

function validateContentCache(cache: ContentCache): ContentCache {
  if (!isRecord(cache)) {
    throw new ContentCacheStoreError('教材キャッシュの形式が不正です。');
  }
  if (typeof cache.cachedAt !== 'string' || !isValidTimestamp(cache.cachedAt)) {
    throw new ContentCacheStoreError('教材キャッシュの保存日時が不正です。');
  }
  if (typeof cache.apiVersion !== 'string' || cache.apiVersion.trim().length === 0) {
    throw new ContentCacheStoreError('教材キャッシュのAPIバージョンが不正です。');
  }

  const validation = validateApiResponse(cache.response);
  if (!validation.ok) {
    throw new ContentCacheStoreError('教材キャッシュのAPIレスポンス検証に失敗しました。');
  }

  return {
    response: validation.response,
    cachedAt: cache.cachedAt,
    apiVersion: cache.apiVersion,
  };
}

function parseContentCache(raw: string, expectedContentVersion: string): ContentCache {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ContentCacheStoreError('教材キャッシュのJSON解析に失敗しました。', { cause: error });
  }

  const cache = validateContentCache(parsed as ContentCache);
  if (cache.response.contentVersion !== expectedContentVersion) {
    throw new ContentCacheStoreError('教材キャッシュの版情報とcurrent pointerが一致しません。');
  }
  return cache;
}

function isRecord(value: unknown): value is ContentCacheRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidTimestamp(value: string): boolean {
  return value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function nextStagingToken(): string {
  stagingSequence += 1;
  return `${Date.now()}-${stagingSequence}`;
}
