import { StyleSheet, View } from 'react-native';
import type { QuestionItem } from '@/types/content';

import { LearningCard, MetricCard } from '@/components/learning-loop';
import { ThemedText } from '@/components/themed-text';

export interface ResultMetricsProps {
  correctCount: number;
  totalCount: number;
  elapsedSeconds: number;
  incorrectQuestions: readonly QuestionItem[];
  reviewCount: number;
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
}

/** Displays the score as the primary metric and supporting next-step metrics below it. */
export function ResultMetrics({
  correctCount,
  totalCount,
  elapsedSeconds,
  incorrectQuestions,
  reviewCount,
}: ResultMetricsProps) {
  return (
    <View accessibilityLabel="学習結果の指標" accessibilityRole="summary" style={styles.container}>
      <MetricCard
        accessibilityLabel={`正解数 ${correctCount} / ${totalCount}問`}
        label="正解数"
        primary
        tone="progress"
        unit="問"
        value={`${correctCount} / ${totalCount}`}
      />
      <View style={styles.supportingMetrics}>
        <MetricCard
          label="解答時間"
          tone="support"
          unit=""
          value={formatDuration(elapsedSeconds)}
        />
        <MetricCard
          accessibilityLabel={`復習対象 ${reviewCount}件`}
          label="復習対象"
          tone="review"
          unit="件"
          value={reviewCount}
        />
      </View>
      {incorrectQuestions.length > 0 ? (
        <LearningCard accessibilityLabel={`間違えた問題 ${incorrectQuestions.length}件`} style={styles.questionCard}>
          <ThemedText type="subtitle">もう一度確認する問題</ThemedText>
          <View style={styles.questionList} accessibilityRole="list">
            {incorrectQuestions.map((question, index) => (
              <View key={question.id} style={styles.questionRow}>
                <ThemedText type="defaultSemiBold" colorName="reviewBlue">{index + 1}</ThemedText>
                <ThemedText style={styles.questionText}>{question.prompt}</ThemedText>
              </View>
            ))}
          </View>
        </LearningCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  supportingMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  questionCard: {
    marginTop: 4,
  },
  questionList: {
    gap: 10,
  },
  questionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  questionText: {
    flex: 1,
    lineHeight: 22,
  },
});
