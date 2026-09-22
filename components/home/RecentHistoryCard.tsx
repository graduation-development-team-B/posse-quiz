import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { RecentHistoryEntry } from '@/lib/progress/roadmap';

interface RecentHistoryCardProps {
  entries: readonly RecentHistoryEntry[];
  onReview: (entry: RecentHistoryEntry) => void;
}

/** 直近に解いた教材の正答率と、そこからすぐ復習へ戻る導線。 */
export function RecentHistoryCard({ entries, onReview }: RecentHistoryCardProps) {
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const badgeColor = useThemeColor({}, 'achievementSurface');

  return (
    <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
      <ThemedText type="defaultSemiBold" style={styles.title}>最近の学習履歴</ThemedText>
      {entries.length === 0 ? (
        <ThemedText style={styles.empty}>
          まだ学習履歴はありません。今日のミッションから1問はじめてみましょう。
        </ThemedText>
      ) : (
        entries.map((entry) => (
          <HistoryRow
            key={entry.weekKey}
            entry={entry}
            badgeColor={badgeColor}
            borderColor={borderColor}
            primaryColor={primaryColor}
            onReview={onReview}
          />
        ))
      )}
    </View>
  );
}

function HistoryRow({
  entry,
  badgeColor,
  borderColor,
  primaryColor,
  onReview,
}: {
  entry: RecentHistoryEntry;
  badgeColor: string;
  borderColor: string;
  primaryColor: string;
  onReview: (entry: RecentHistoryEntry) => void;
}) {
  const focus = useAccessibilityFocus();

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <ThemedText style={styles.badgeIcon}>🔥</ThemedText>
      </View>
      <View style={styles.copy}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>{entry.label}</ThemedText>
        <ThemedText style={styles.stats}>
          正答率 {entry.accuracy === null ? '未学習' : `${entry.accuracy}%`}（{entry.correctCount}/{entry.answeredCount}問）
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${entry.label}を復習する`}
        accessibilityHint="この教材の出題範囲を選ぶ画面へ進みます"
        onBlur={focus.onBlur}
        onFocus={focus.onFocus}
        onPress={() => onReview(entry)}
        style={({ pressed }) => [
          styles.reviewButton,
          { borderColor },
          focus.focusStyle,
          pressed && styles.pressed,
        ]}
      >
        <ThemedText type="defaultSemiBold" style={[styles.reviewLabel, { color: primaryColor }]}>
          復習する
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.75,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  badgeIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  stats: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.78,
  },
  reviewButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  reviewLabel: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.75,
  },
});
