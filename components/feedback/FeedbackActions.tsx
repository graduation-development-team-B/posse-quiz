import { StyleSheet, View } from 'react-native';

import { LearningCta } from '@/components/learning-loop/LearningCta';

interface FeedbackActionsProps {
  isCorrect: boolean;
  isLastQuestion: boolean;
  onImmediateReview: () => void;
  onNext: () => void;
}

export function FeedbackActions({
  isCorrect,
  isLastQuestion,
  onImmediateReview,
  onNext,
}: FeedbackActionsProps) {
  return (
    <View style={styles.container}>
      {!isCorrect && isLastQuestion ? (
        <LearningCta
          label="間違えた問題をすぐに復習"
          accessibilityHint="このセッションの誤答をまとめて確認します"
          onPress={onImmediateReview}
          tone="review"
          variant="secondary"
          style={styles.reviewButton}
        />
      ) : null}
      <LearningCta
        label={isLastQuestion ? '結果を見る' : '次の問題へ'}
        accessibilityHint={isLastQuestion ? 'クイズの結果を表示します' : '次の問題を表示します'}
        onPress={onNext}
        tone="progress"
        variant="primary"
        style={styles.nextButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingTop: 4,
  },
  reviewButton: {
    borderRadius: 999,
    marginHorizontal: 0,
  },
  nextButton: {
    borderRadius: 999,
    minHeight: 52,
    marginHorizontal: 0,
  },
});
