import { StyleSheet, View } from 'react-native';

import { AccessibleButton } from '@/components/AccessibleButton';
import { ThemedText } from '@/components/themed-text';

export function ProgressResetPanel({
  confirming,
  isResetting,
  onRequest,
  onCancel,
  onConfirm,
}: {
  confirming: boolean;
  isResetting: boolean;
  onRequest: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.description}>
        教材ごとの成績、復習待ち、連続正解数を端末から削除します。この操作は元に戻せません。
      </ThemedText>
      {!confirming ? (
        <AccessibleButton
          label="学習記録を削除"
          accessibilityHint="削除の確認を表示します"
          onPress={onRequest}
          variant="secondary"
        />
      ) : (
        <View style={styles.confirmation}>
          <ThemedText type="defaultSemiBold">学習記録を削除しますか？</ThemedText>
          <View style={styles.actions}>
            <AccessibleButton
              label="削除を取り消す"
              onPress={onCancel}
              disabled={isResetting}
              variant="ghost"
            />
            <AccessibleButton
              label={isResetting ? '削除中' : '削除を確認'}
              onPress={onConfirm}
              disabled={isResetting}
              variant="primary"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  description: {
    lineHeight: 22,
  },
  confirmation: {
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
