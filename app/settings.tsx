import { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ResponsiveScrollView } from '@/components/layout';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsSyncPanel } from '@/components/settings/SettingsSyncPanel';
import { ProgressResetPanel } from '@/components/settings/ProgressResetPanel';
import { QuestionCountSelector } from '@/components/scope/QuestionCountSelector';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useContent } from '@/contexts/ContentContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useSettings } from '@/contexts/SettingsContext';
import { type AllowedQuestionCount } from '@/lib/constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { state, message, isContentAvailable, retry } = useContent();
  const { reset, notice: progressNotice, clearNotice: clearProgressNotice } = useProgress();
  const {
    questionCount,
    isLoading: isSettingsLoading,
    notice: settingsNotice,
    setQuestionCount,
    clearNotice: clearSettingsNotice,
  } = useSettings();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await retry();
    } finally {
      setIsRetrying(false);
    }
  }, [retry]);

  const handleReset = useCallback(async () => {
    setIsResetting(true);
    try {
      await reset(true);
      setIsConfirmingReset(false);
    } finally {
      setIsResetting(false);
    }
  }, [reset]);

  const handleCancelReset = useCallback(async () => {
    await reset(false);
    setIsConfirmingReset(false);
  }, [reset]);

  const noticeMessage = progressNotice?.message ?? settingsNotice?.message;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ResponsiveScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">設定</ThemedText>
        <ThemedText style={styles.description}>
          次回のクイズと教材更新、端末に保存する学習記録を設定できます。
        </ThemedText>

        <SettingsSection title="1セッションの問題数">
          <ThemedText>
            設定値は次回のクイズセッションから使用されます。問題が不足する場合は全件を出題します。
          </ThemedText>
          {isSettingsLoading ? <ActivityIndicator accessibilityLabel="設定を読み込み中" /> : null}
          <QuestionCountSelector
            value={questionCount}
            onChange={(value: AllowedQuestionCount) => void setQuestionCount(value)}
          />
        </SettingsSection>

        <SettingsSection title="教材API">
          <SettingsSyncPanel
            state={state}
            message={message}
            hasCatalog={isContentAvailable}
            isRetrying={isRetrying}
            onRetry={() => void handleRetry()}
          />
        </SettingsSection>

        <SettingsSection title="学習記録">
          <ProgressResetPanel
            confirming={isConfirmingReset}
            isResetting={isResetting}
            onRequest={() => setIsConfirmingReset(true)}
            onCancel={() => void handleCancelReset()}
            onConfirm={() => void handleReset()}
          />
        </SettingsSection>

        {noticeMessage ? (
          <ThemedView variant="surface" style={styles.notice}>
            <ThemedText accessibilityRole="alert">{noticeMessage}</ThemedText>
            {progressNotice ? (
              <ThemedText
                type="link"
                accessibilityRole="button"
                onPress={clearProgressNotice}
              >
                通知を閉じる
              </ThemedText>
            ) : settingsNotice ? (
              <ThemedText
                type="link"
                accessibilityRole="button"
                onPress={clearSettingsNotice}
              >
                通知を閉じる
              </ThemedText>
            ) : null}
          </ThemedView>
        ) : null}

        <ThemedText
          type="link"
          accessibilityRole="button"
          onPress={() => router.back()}
        >
          前の画面へ戻る
        </ThemedText>
      </ResponsiveScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 40,
  },
  description: {
    lineHeight: 24,
  },
  notice: {
    borderRadius: 10,
    gap: 6,
    padding: 12,
  },
});
