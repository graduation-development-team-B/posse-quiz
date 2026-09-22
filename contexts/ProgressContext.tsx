/**
 * ProgressContext: 学習進捗の共有状態
 * ProgressStore をラップし、全画面で利用可能にする。
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { ProgressSnapshot, RestoreResult, ReviewEntry } from '@/types/progress';
import type { WeekKey } from '@/types/content';
import type { AnswerRecord } from '@/types/session';
import {
  ProgressStore,
  type ProgressNotice,
} from '@/lib/progress/ProgressStore';
import { getProgressStorageAdapter } from '@/lib/storage';

interface ProgressContextValue {
  snapshot: ProgressSnapshot | null;
  restoreResult: RestoreResult | null;
  /** 復元・保存・初期化・削除の結果を画面へ伝える通知。 */
  notice: ProgressNotice | null;
  isLoading: boolean;
  recordAnswer: (input: AnswerRecord & { weekKey: WeekKey }) => Promise<void>;
  updateReviewQueue: (queue: readonly ReviewEntry[]) => Promise<void>;
  /** confirmed=false は削除確認の取消しで、StorageとSnapshotを変更しない。 */
  reset: (confirmed?: boolean) => Promise<void>;
  clearNotice: () => void;
  getStore: () => ProgressStore;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<ProgressStore | null>(null);
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [notice, setNotice] = useState<ProgressNotice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ProgressStoreはProviderインスタンスごとに1つだけ生成する。
  function getOrCreateStore(): ProgressStore {
    if (!storeRef.current) {
      const adapter = getProgressStorageAdapter();
      storeRef.current = new ProgressStore(adapter, {
        onNotice: setNotice,
      });
    }
    return storeRef.current;
  }

  useEffect(() => {
    let mounted = true;
    const store = getOrCreateStore();
    void store.restore().then((result) => {
      if (!mounted) return;
      setRestoreResult(result);
      setSnapshot(store.getSnapshot());
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const recordAnswer = useCallback(
    async (input: AnswerRecord & { weekKey: WeekKey }) => {
      const store = getOrCreateStore();
      await store.recordAnswer(input);
      setSnapshot(store.getSnapshot());
    },
      [],
  );

  const updateReviewQueue = useCallback(async (queue: readonly ReviewEntry[]) => {
    const store = getOrCreateStore();
    await store.updateReviewQueue(queue);
    setSnapshot(store.getSnapshot());
  }, []);

  const reset = useCallback(async (confirmed = true) => {
    const store = getOrCreateStore();
    await store.reset(confirmed);
    // 取消時はstoreのSnapshotが変化しないが、成功時は初期Snapshotを反映する。
    setSnapshot(store.getSnapshot());
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);
  const getStore = useCallback(() => getOrCreateStore(), []);

  return (
    <ProgressContext.Provider
      value={{
        snapshot,
        restoreResult,
        notice,
        isLoading,
        recordAnswer,
        updateReviewQueue,
        reset,
        clearNotice,
        getStore,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress は ProgressProvider の内側で使用してください');
  return ctx;
}
