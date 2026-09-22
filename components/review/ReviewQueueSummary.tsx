import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { SUPPORTED_WEEK_KEYS } from '@/lib/constants';
import { prioritizeReviewQueue } from '@/lib/progress/reviewQueue';
import type { ReviewEntry } from '@/types/progress';
import type { WeekKey } from '@/types/content';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useColorScheme } from '@/hooks/use-color-scheme';

const WEEK_LABELS: Record<WeekKey, string> = {
  week1: '第1週',
  week3: '第3週',
  week4: '第4週',
  week5: '第5週',
  week6: '第6週',
  git_github_level1: 'Git/GitHub Level 1',
};

export interface ReviewQueueSummaryProps {
  entries: readonly ReviewEntry[];
  skippedCount?: number;
  onStart: () => void;
  onBack: () => void;
  startDisabled?: boolean;
  questionCount?: 3 | 5 | 10;
}

function formatLastWrongAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '日時不明';

  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReviewQueueSummary({
  entries,
  skippedCount = 0,
  onStart,
  onBack,
  startDisabled = false,
  questionCount = 5,
}: ReviewQueueSummaryProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const startFocus = useAccessibilityFocus();
  const backFocus = useAccessibilityFocus();
  const prioritizedEntries = prioritizeReviewQueue([...entries]);

  const countsByWeek = SUPPORTED_WEEK_KEYS.map((weekKey) => ({
    weekKey,
    count: entries.filter((entry) => entry.weekKey === weekKey).length,
  }));

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        復習
      </ThemedText>
      <ThemedText style={styles.description}>
        間違えた問題を、誤答回数が多い順にもう一度確認しましょう。
      </ThemedText>

      <View style={styles.totalCard} accessibilityRole="summary">
        <ThemedText style={styles.totalLabel}>復習待ち</ThemedText>
        <ThemedText type="title" style={styles.totalCount}>
          {entries.length}件
        </ThemedText>
      </View>

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        週別の件数
      </ThemedText>
      <View style={styles.weekGrid}>
        {countsByWeek.map(({ weekKey, count }) => (
          <View key={weekKey} style={[styles.weekCard, { borderColor: colors.icon }]}>
            <ThemedText type="defaultSemiBold">{WEEK_LABELS[weekKey]}</ThemedText>
            <ThemedText style={styles.weekCount}>{count}件</ThemedText>
          </View>
        ))}
      </View>

      {skippedCount > 0 ? (
        <View style={styles.notice} accessibilityRole="text">
          <ThemedText>
            利用できない問題を{skippedCount}件スキップしました。他の復習対象は続けて利用できます。
          </ThemedText>
        </View>
      ) : null}

      {entries.length === 0 ? (
        <View style={styles.emptyState} accessibilityRole="text">
          <ThemedText type="subtitle">復習待ちの問題はありません</ThemedText>
          <ThemedText style={styles.emptyDescription}>
            クイズで間違えた問題がここに追加されます。
          </ThemedText>
        </View>
      ) : (
        <>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            復習の優先順
          </ThemedText>
          <View style={styles.entryList}>
            {prioritizedEntries.map((entry, index) => (
              <View key={`${entry.questionId}-${index}`} style={styles.entryCard}>
                <ThemedText type="defaultSemiBold">
                  {index + 1}. 復習問題
                </ThemedText>
                <ThemedText>
                  {WEEK_LABELS[entry.weekKey]} ・ 誤答 {entry.wrongCount}回
                </ThemedText>
                <ThemedText style={styles.entryDate}>
                  最終誤答: {formatLastWrongAt(entry.lastWrongAt)}
                </ThemedText>
              </View>
            ))}
          </View>
        </>
      )}

      <Pressable
        onFocus={startFocus.onFocus}
        onBlur={startFocus.onBlur}
        accessibilityRole="button"
        accessibilityLabel="復習を開始"
        accessibilityState={{ disabled: startDisabled }}
        disabled={startDisabled}
        onPress={onStart}
        style={({ pressed }) => [
          styles.primaryButton,
          startFocus.focusStyle,
          { backgroundColor: colors.tint },
          startDisabled && styles.disabledButton,
          pressed && !startDisabled && styles.pressedButton,
        ]}>
        <ThemedText style={[styles.primaryButtonText, { color: colors.primaryText }]}>復習を開始（最大{questionCount}問）</ThemedText>
      </Pressable>
      <Pressable
        onFocus={backFocus.onFocus}
        onBlur={backFocus.onBlur}
        accessibilityRole="button"
        accessibilityLabel="範囲選択へ戻る"
        onPress={onBack}
        style={({ pressed }) => [styles.secondaryButton, backFocus.focusStyle, pressed && styles.pressedButton]}>
        <ThemedText type="defaultSemiBold">範囲選択へ戻る</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    marginTop: 8,
  },
  description: {
    marginBottom: 4,
  },
  totalCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(10, 126, 164, 0.12)',
    gap: 4,
  },
  totalLabel: {
    fontWeight: '600',
  },
  totalCount: {
    fontSize: 36,
    lineHeight: 42,
  },
  sectionTitle: {
    marginTop: 8,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  weekCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  notice: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'rgba(183, 121, 31, 0.16)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyDescription: {
    textAlign: 'center',
  },
  entryList: {
    gap: 8,
  },
  entryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D7DE',
    padding: 12,
    gap: 3,
  },
  entryDate: {
    opacity: 0.75,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#9BA1A6',
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressedButton: {
    opacity: 0.75,
  },
});
