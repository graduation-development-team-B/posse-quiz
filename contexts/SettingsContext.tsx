import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { getSettingsStorageAdapter } from '@/lib/storage';
import {
  SettingsStore,
  type SettingsNotice,
  type UserSettings,
} from '@/lib/settings/SettingsStore';
import type { AllowedQuestionCount } from '@/lib/constants';

interface SettingsContextValue {
  questionCount: AllowedQuestionCount;
  isLoading: boolean;
  notice: SettingsNotice | null;
  setQuestionCount: (questionCount: AllowedQuestionCount) => Promise<boolean>;
  clearNotice: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<SettingsStore | null>(null);
  const [settings, setSettings] = useState<UserSettings>({ questionCount: 5 });
  const [notice, setNotice] = useState<SettingsNotice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function getOrCreateStore(): SettingsStore {
    if (!storeRef.current) {
      storeRef.current = new SettingsStore(getSettingsStorageAdapter(), {
        onNotice: setNotice,
      });
    }
    return storeRef.current;
  }

  useEffect(() => {
    let mounted = true;
    void getOrCreateStore().restore().then((restored) => {
      if (!mounted) return;
      setSettings(restored);
      setIsLoading(false);
    }).catch((error: unknown) => {
      console.warn('設定の復元に失敗しました。既定値を利用します。', error);
      if (mounted) setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setQuestionCount = useCallback(async (questionCount: AllowedQuestionCount) => {
    const store = getOrCreateStore();
    setSettings((current) => ({ ...current, questionCount }));
    return store.setQuestionCount(questionCount);
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  return (
    <SettingsContext.Provider
      value={{
        questionCount: settings.questionCount,
        isLoading,
        notice,
        setQuestionCount,
        clearNotice,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings は SettingsProvider の内側で使用してください');
  return context;
}
