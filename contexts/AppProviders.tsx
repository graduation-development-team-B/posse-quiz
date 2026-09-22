/**
 * アプリ全体のContext境界。
 * Providerの順序を一箇所に固定し、RootLayout配下の全画面へ共有状態を公開する。
 */

import React from 'react';
import { ContentProvider } from './ContentContext';
import { ProgressProvider } from './ProgressContext';
import { QuizSessionProvider } from './QuizSessionContext';
import { SettingsProvider } from './SettingsContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <ContentProvider>
          <QuizSessionProvider>{children}</QuizSessionProvider>
        </ContentProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}
