/**
 * プラットフォームに応じたStorageAdapterを提供する。
 * WebはlocalStorage、ネイティブはAsyncStorageを利用する。
 */

import { Platform } from 'react-native';
import { AsyncStorageAdapter } from './nativeStorage';
import type { StorageAdapter } from './StorageAdapter';
import { WebStorageAdapter } from './webStorage';

let contentAdapter: StorageAdapter | null = null;
let progressAdapter: StorageAdapter | null = null;
let settingsAdapter: StorageAdapter | null = null;

function createPlatformStorageAdapter(): StorageAdapter {
  return Platform.OS === 'web'
    ? new WebStorageAdapter()
    : new AsyncStorageAdapter();
}

/** Content_Cache専用アダプター。進捗とはキー領域を分けて利用する。 */
export function getContentStorageAdapter(): StorageAdapter {
  contentAdapter ??= createPlatformStorageAdapter();
  return contentAdapter;
}

/** Progress_Snapshot専用アダプター。教材キャッシュとはキー領域を分けて利用する。 */
export function getProgressStorageAdapter(): StorageAdapter {
  progressAdapter ??= createPlatformStorageAdapter();
  return progressAdapter;
}

/** ユーザー設定専用アダプター。進捗とはキー・アダプター境界を分けて利用する。 */
export function getSettingsStorageAdapter(): StorageAdapter {
  settingsAdapter ??= createPlatformStorageAdapter();
  return settingsAdapter;
}

/** テスト用にアダプターの遅延生成キャッシュを破棄する。 */
export function resetStorageAdapters(): void {
  contentAdapter = null;
  progressAdapter = null;
  settingsAdapter = null;
}

export type { StorageAdapter } from './StorageAdapter';
