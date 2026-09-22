import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FeedbackStatusProps {
  isCorrect: boolean;
}

export function FeedbackStatus({ isCorrect }: FeedbackStatusProps) {
  const successColor = useThemeColor({}, 'success');
  const reviewColor = useThemeColor({}, 'review');
  const color = isCorrect ? successColor : reviewColor;
  const backgroundColor = useThemeColor({}, isCorrect ? 'successBackground' : 'reviewBackground');
  const label = isCorrect ? '正解' : '誤り';

  return (
    <ThemedView
      accessibilityRole="summary"
      accessibilityLabel={`判定結果: ${label}`}
      variant="surface"
      style={[styles.container, { backgroundColor, borderColor: color }]}
    >
      <ThemedText style={[styles.symbol, { color }]} aria-hidden>
        {isCorrect ? '✓' : '×'}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color }}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  symbol: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
});
