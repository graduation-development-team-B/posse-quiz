import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';

interface WeekSummaryCardProps {
  weekKey: string;
  questionCount: number;
  accuracy: number | null;
  disabled?: boolean;
  onPress: () => void;
}

export function WeekSummaryCard({
  weekKey,
  questionCount,
  accuracy,
  disabled = false,
  onPress,
}: WeekSummaryCardProps) {
  const cardColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const badgeColor = useThemeColor({}, 'primary');
  const badgeTextColor = useThemeColor({}, 'primaryText');
  const progressTrackColor = useThemeColor({}, 'disabledBackground');
  const progressColor = useThemeColor({}, 'primary');
  const isGitGitHubLevel1 = weekKey === 'git_github_level1';
  const number = isGitGitHubLevel1 ? 'Git' : weekKey.replace('week', '');
  const displayTitle = isGitGitHubLevel1 ? 'Git/GitHub Level 1' : `Week${number.padStart(2, '0')}`;
  const focus = useAccessibilityFocus();

  return (
    <ThemedView style={[styles.card, { backgroundColor: cardColor, borderColor }, disabled && styles.disabled]}>
      <Pressable
        onFocus={focus.onFocus}
        onBlur={focus.onBlur}
        accessibilityRole="button"
        accessibilityLabel={`${displayTitle}を選択。問題${questionCount}問、正答率${accuracy === null ? '未学習' : `${accuracy}%`}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, focus.focusStyle, pressed && styles.pressed]}
      >
        <View style={styles.headingRow}>
          <View style={[styles.weekBadge, { backgroundColor: badgeColor }]}>
            <ThemedText style={[styles.weekBadgeText, { color: badgeTextColor }]}>{number}</ThemedText>
          </View>
          <View style={styles.headingText}>
            <ThemedText type="subtitle" numberOfLines={1}>{displayTitle}</ThemedText>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <ThemedText style={styles.statLabel}>問題数</ThemedText>
            <ThemedText type="defaultSemiBold">{questionCount}問</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText style={styles.statLabel}>正答率</ThemedText>
            <ThemedText type="defaultSemiBold">{accuracy === null ? '未学習' : `${accuracy}%`}</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText style={styles.statLabel}>進み具合</ThemedText>
            <ThemedText style={styles.actionHint}>{disabled ? '教材を準備中です' : '範囲を選択'}</ThemedText>
          </View>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`${displayTitle}の正答率 ${accuracy === null ? '未学習' : `${accuracy}%`}`}
          style={[styles.progressTrack, { backgroundColor: progressTrackColor }]}
        >
          <View style={[styles.progressFill, { backgroundColor: progressColor, width: `${accuracy === null ? 0 : Math.max(4, accuracy)}%` }]} />
        </View>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16,
    paddingBottom: 10,
  },
  pressable: {
    minHeight: 44,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  weekBadge: {
    alignItems: 'center',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  weekBadgeText: {
    fontSize: 22,
    fontWeight: '800',
  },
  headingText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 4,
  },
  stat: {
    gap: 2,
  },
  statLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  progressTrack: {
    borderRadius: 999,
    height: 7,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  actionHint: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.55,
  },
});
