/**
 * ストレージキー定数
 * Content_Cache と Progress_Snapshot を別キー領域で管理する
 * - content-cache:* → Content_Cache 専用
 * - progress:*      → Progress_Snapshot 専用
 */

/** Content_Cache の現行ポインターキー */
export const CONTENT_CACHE_CURRENT_KEY = 'content-cache:current';

/** Content_Cache の版別データキープレフィックス */
export const CONTENT_CACHE_VERSION_PREFIX = 'content-cache:version:';

/** Content_Cache の書き込み中データキープレフィックス */
export const CONTENT_CACHE_STAGING_PREFIX = 'content-cache:staging:';

/** 版別データキーを生成する */
export function buildContentCacheVersionKey(contentVersion: string): string {
  return `${CONTENT_CACHE_VERSION_PREFIX}${contentVersion}`;
}

/** 書き込み中の一時キーを生成する */
export function buildContentCacheStagingKey(contentVersion: string, token: string): string {
  return `${CONTENT_CACHE_STAGING_PREFIX}${contentVersion}:${token}`;
}

/** Progress_Snapshot のキー */
export const PROGRESS_SNAPSHOT_KEY = 'progress:snapshot';

/** ユーザー設定のキー（問題数など） */
export const USER_SETTINGS_KEY = 'settings:user';

/** Content_Cache のキーかどうかを判定する */
export function isContentCacheKey(key: string): boolean {
  return key.startsWith('content-cache:');
}

/** Progress キーかどうかを判定する */
export function isProgressKey(key: string): boolean {
  return key.startsWith('progress:');
}
