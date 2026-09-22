/**
 * ContentContext: 教材CatalogとContentSyncManagerの共有状態。
 * Cache利用時はcatalogを即時公開し、API更新はバックグラウンドで進める。
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ContentApiClient } from '@/lib/content/ContentApiClient';
import { ContentCacheStore } from '@/lib/content/ContentCacheStore';
import { ContentSyncManager, type ContentSyncManagerOptions } from '@/lib/content/ContentSyncManager';
import { getContentStorageAdapter } from '@/lib/storage';
import type { ContentCatalog } from '@/types/content';
import type { ContentApiClient as ContentApiClientContract, ContentCacheStore as ContentCacheStoreContract, SyncState } from '@/types/sync';
import type { IProgressStore } from '@/lib/progress/ProgressStore';

export interface ContentContextValue {
  catalog: ContentCatalog | null;
  state: SyncState;
  message: string | undefined;
  error: Error | undefined;
  isLoading: boolean;
  /** API更新を待たずにCache教材が利用可能か。 */
  isContentAvailable: boolean;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  getManager: () => ContentSyncManager;
}

export interface ContentProviderProps {
  children: React.ReactNode;
  /** テストまたはアプリ上位で共有するManager。未指定時は標準境界から生成する。 */
  manager?: ContentSyncManager;
  /** ProgressContextと同じProgressStoreを渡す場合の復元境界。 */
  progressStore?: Pick<IProgressStore, 'restore'>;
  apiClient?: ContentApiClientContract;
  cacheStore?: ContentCacheStoreContract;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({
  children,
  manager: suppliedManager,
  progressStore,
  apiClient,
  cacheStore,
}: ContentProviderProps) {
  const managerRef = useRef<ContentSyncManager | null>(suppliedManager ?? null);
  if (!managerRef.current) {
    const options: ContentSyncManagerOptions = {
      apiClient: apiClient ?? new ContentApiClient(),
      cacheStore: cacheStore ?? new ContentCacheStore(getContentStorageAdapter()),
      progressStore,
    };
    managerRef.current = new ContentSyncManager(options);
  }

  const manager = managerRef.current;
  const [catalog, setCatalog] = useState<ContentCatalog | null>(() => manager.getCatalog());
  const [state, setState] = useState<SyncState>(() => manager.getState());
  const [message, setMessage] = useState<string | undefined>(() => manager.getMessage());
  const [error, setError] = useState<Error | undefined>(() => manager.getError());

  useEffect(() => {
    const update = () => {
      setCatalog(manager.getCatalog());
      setState(manager.getState());
      setMessage(manager.getMessage());
      setError(manager.getError());
    };
    const unsubscribe = manager.subscribe(update);
    update();
    void manager.initialize().then(update);
    return unsubscribe;
  }, [manager]);

  const refresh = useCallback(() => manager.refresh('manual'), [manager]);
  const retry = useCallback(() => manager.retry(), [manager]);
  const getManager = useCallback(() => manager, [manager]);

  return (
    <ContentContext.Provider
      value={{
        catalog,
        state,
        message,
        error,
        isLoading: state === 'uninitialized' || state === 'loading',
        isContentAvailable: catalog !== null,
        refresh,
        retry,
        getManager,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent は ContentProvider の内側で使用してください');
  return context;
}
