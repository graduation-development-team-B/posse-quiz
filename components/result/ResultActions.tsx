import { StyleSheet, View } from 'react-native';

import { LearningCta } from '@/components/learning-loop';

export interface ResultActionsProps {
  reviewCount: number;
  onRetry: () => void;
  onReview: () => void;
  onHome: () => void;
}

/** Keeps the result choices in a single, predictable action hierarchy. */
export function ResultActions({ reviewCount, onRetry, onReview, onHome }: ResultActionsProps) {
  const reviewDisabled = reviewCount === 0;

  return (
    <View accessibilityLabel="結果画面の次の行動" style={styles.container}>
      <LearningCta
        accessibilityHint="直前と同じ範囲と問題数でもう一度学習します。"
        label="もう一度挑戦"
        onPress={onRetry}
      />
      <LearningCta
        accessibilityHint={reviewDisabled ? '復習待ちの問題がありません。' : '間違えた問題の復習を始めます。'}
        disabled={reviewDisabled}
        label={reviewDisabled ? '間違いを復習（復習待ちなし）' : `間違いを復習（${reviewCount}件）`}
        onPress={onReview}
        tone="review"
        variant="secondary"
      />
      <LearningCta
        accessibilityHint="ホーム画面へ戻ります。"
        label="ホームへ"
        onPress={onHome}
        variant="ghost"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingBottom: 24,
  },
});
