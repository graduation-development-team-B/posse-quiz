import { StyleSheet, View } from 'react-native';
import type { QuestionItem } from '@/types/content';

import { CompletionHeader } from '@/components/result/CompletionHeader';
import { ResultActions } from '@/components/result/ResultActions';
import { ResultMetrics } from '@/components/result/ResultMetrics';

export interface ResultSummaryProps {
  correctCount: number;
  totalCount: number;
  elapsedSeconds: number;
  incorrectQuestions: readonly QuestionItem[];
  allCorrect: boolean;
  reviewCount: number;
  onRetry: () => void;
  onReview: () => void;
  onHome: () => void;
}

export { formatDuration } from '@/components/result/ResultMetrics';

export function ResultSummary({
  correctCount,
  totalCount,
  elapsedSeconds,
  incorrectQuestions,
  allCorrect,
  reviewCount,
  onRetry,
  onReview,
  onHome,
}: ResultSummaryProps) {
  return (
    <View style={styles.container}>
      <CompletionHeader allCorrect={allCorrect} />
      <ResultMetrics
        correctCount={correctCount}
        elapsedSeconds={elapsedSeconds}
        incorrectQuestions={incorrectQuestions}
        reviewCount={reviewCount}
        totalCount={totalCount}
      />
      <ResultActions
        onHome={onHome}
        onRetry={onRetry}
        onReview={onReview}
        reviewCount={reviewCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    gap: 18,
    maxWidth: 960,
    padding: 24,
    width: '100%',
  },
});
