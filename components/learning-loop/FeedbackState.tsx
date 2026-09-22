import { StyleSheet, View } from 'react-native';

import { LearningCard } from '@/components/learning-loop/LearningCard';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface FeedbackStateProps {
  isCorrect: boolean;
  correctText: string;
}

/** Displays the immutable result state and correct answer without relying on color alone. */
export function FeedbackState({ isCorrect, correctText }: FeedbackStateProps) {
  const accentColor = useThemeColor({}, isCorrect ? 'growthGreen' : 'reviewBlue');
  const backgroundColor = useThemeColor({}, isCorrect ? 'successBackground' : 'reviewBackground');
  const label = isCorrect ? '正解' : '誤り';
  const symbol = isCorrect ? '✓' : '!';

  return (
    <LearningCard
      accessibilityLabel={`判定結果: ${label}。正解: ${correctText}`}
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor, borderColor: accentColor }]}
    >
      <View style={styles.content}>
        <ThemedText aria-hidden style={[styles.symbol, { color: accentColor }]}>
          {symbol}
        </ThemedText>
        <View style={styles.copy}>
          <ThemedText type="subtitle" style={{ color: accentColor }}>
            {label}
          </ThemedText>
          <ThemedText style={styles.answer}>
            正解: {correctText}
          </ThemedText>
        </View>
      </View>
    </LearningCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    padding: 16,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  symbol: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  answer: {
    lineHeight: 22,
  },
});
