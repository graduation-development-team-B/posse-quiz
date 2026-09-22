import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface CompletionHeaderProps {
  allCorrect: boolean;
}

/** A short, action-oriented completion message without score-based judgment. */
export function CompletionHeader({ allCorrect }: CompletionHeaderProps) {
  const accentColor = useThemeColor({}, 'progressOrange');
  const growthColor = useThemeColor({}, 'growthGreen');

  return (
    <View accessibilityRole="header" style={styles.container}>
      <ThemedText type="title">学習完了</ThemedText>
      <ThemedText type="subtitle" style={{ color: accentColor }}>
        今日の一歩を達成
      </ThemedText>
      <ThemedText style={styles.description}>
        正解数にかかわらず、最後まで学習したことが今日の成果です。
      </ThemedText>
      {allCorrect ? (
        <ThemedView
          accessibilityLabel="全問正解"
          accessibilityRole="text"
          variant="surface"
          style={[styles.perfectBadge, { borderColor: growthColor }]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: growthColor }}>
            ✓ 全問正解。すごい一歩です！
          </ThemedText>
        </ThemedView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  description: {
    lineHeight: 23,
    opacity: 0.82,
  },
  perfectBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
