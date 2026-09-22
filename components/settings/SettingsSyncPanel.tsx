import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AccessibleButton } from '@/components/AccessibleButton';
import { ThemedText } from '@/components/themed-text';
import type { SyncState } from '@/types/sync';

const STATE_LABELS: Record<SyncState, string> = {
  uninitialized: '教材を準備しています',
  loading: '教材を取得しています',
  ready: '教材は最新です',
  updated: '教材を更新しました',
  'using-cache': '前回の教材を利用中です',
  error: '教材を取得できません',
};

export function SettingsSyncPanel({
  state,
  message,
  hasCatalog,
  isRetrying,
  onRetry,
}: {
  state: SyncState;
  message?: string;
  hasCatalog: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const isBusy = isRetrying || state === 'loading' || state === 'uninitialized';
  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        {isBusy ? <ActivityIndicator size="small" /> : <View style={styles.dot} />}
        <ThemedText type="defaultSemiBold">{STATE_LABELS[state]}</ThemedText>
      </View>
      <ThemedText style={styles.message}>
        {message ?? (hasCatalog ? '教材を利用できます。' : '教材が利用できるまで再試行してください。')}
      </ThemedText>
      <AccessibleButton
        label={isRetrying ? '教材を再試行中' : '教材を再試行'}
        accessibilityHint="同じタイムアウトと検証規則で教材APIを再取得します"
        disabled={isBusy}
        onPress={onRetry}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    backgroundColor: '#2f855a',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  message: {
    lineHeight: 22,
  },
});
