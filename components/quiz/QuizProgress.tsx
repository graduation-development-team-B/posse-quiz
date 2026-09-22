import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface QuizProgressProps {
  currentIndex: number;
  total: number;
  correctCount: number;
}

export function QuizProgress({ currentIndex, total, correctCount }: QuizProgressProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'textSecondary');
  const trackColor = useThemeColor({}, 'disabledBackground');
  const progress = total > 0 ? Math.min(1, Math.max(0, currentIndex / total)) : 0;
  const remaining = Math.max(0, total - currentIndex);

  return (
    <View accessibilityRole="header" accessibilityLabel={`問題${currentIndex}問目、全${total}問。残り${remaining}問`} style={styles.container}>
      <View style={styles.headingRow}>
        <ThemedText type="defaultSemiBold">問題 {currentIndex} / {total}</ThemedText>
        <ThemedText style={{ color: mutedColor }} accessibilityLabel={`正解数 ${correctCount}問`}>
          正解 {correctCount}問
        </ThemedText>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`クイズの進捗 ${currentIndex}/${total}`}
        style={[styles.track, { backgroundColor: trackColor }]}
      >
        <View style={[styles.fill, { backgroundColor: primaryColor, width: `${progress * 100}%` }]} />
      </View>
      <ThemedText style={[styles.remaining, { color: mutedColor }]}>
        {remaining === 0 ? '最後の問題です' : `あと${remaining}問。今日の一歩を続けよう`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  track: {
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
  remaining: {
    fontSize: 13,
    lineHeight: 18,
  },
});
