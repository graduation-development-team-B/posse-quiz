import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface StreakHeaderBarProps {
  /** Progress_Snapshot の streakCount。日数ではなく連続正解数（問）。 */
  streakCount: number;
  /** 正解数から導出した学習ポイント。 */
  points: number;
}

/** 画面上部に連続正解と学習ポイントを並べる、ゲーム風のステータスバー。 */
export function StreakHeaderBar({ streakCount, points }: StreakHeaderBarProps) {
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <View style={styles.bar}>
      <View
        accessibilityRole="text"
        accessibilityLabel={`連続正解${streakCount}問`}
        style={[styles.pill, styles.streakPill, { backgroundColor: surfaceColor, borderColor }]}
      >
        <ThemedText style={styles.icon}>🔥</ThemedText>
        <ThemedText type="defaultSemiBold" style={[styles.streakValue, { color: primaryColor }]}>
          {streakCount}
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.unit}>問連続正解！</ThemedText>
      </View>
      <View
        accessibilityRole="text"
        accessibilityLabel={`学習ポイント${points}`}
        style={[styles.pill, { backgroundColor: surfaceColor, borderColor }]}
      >
        <ThemedText style={styles.icon}>💎</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.points}>{points}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  pill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  streakPill: {
    flexShrink: 1,
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  unit: {
    fontSize: 14,
    lineHeight: 20,
  },
  points: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
});
