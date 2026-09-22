/**
 * コンテンツ同期の型定義
 */

import type { ApiResponse, ContentCache, ContentCatalog } from './content';

/** 教材カタログの取得・更新状態 */
export type SyncState =
  | 'uninitialized'
  | 'loading'
  | 'ready'
  | 'updated'
  | 'using-cache'
  | 'error';

/** 同期イベント */
export interface SyncEvent {
  state: SyncState;
  message?: string;
  error?: Error;
}

/** 同期リフレッシュの理由 */
export type RefreshReason = 'startup' | 'manual' | 'background';

/** Content_API クライアントの境界 */
export interface ContentApiClient {
  fetchCatalog(signal?: AbortSignal): Promise<ApiResponse>;
}

/** Content_Cache の永続化境界 */
export interface ContentCacheStore {
  read(): Promise<ContentCache | null>;
  writeAtomically(cache: ContentCache): Promise<void>;
  removePreviousAfterCommit(contentVersion: string): Promise<void>;
}

/** 教材カタログ同期マネージャーの境界 */
export interface ContentSyncManager {
  initialize(): Promise<void>;
  refresh(reason: RefreshReason): Promise<void>;
  getCatalog(): ContentCatalog | null;
  getState(): SyncState;
}
