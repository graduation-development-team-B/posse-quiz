import { ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ResponsiveScrollView } from '@/components/layout';

import { ReviewQueueSummary } from '@/components/review/ReviewQueueSummary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useContent } from '@/contexts/ContentContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import { createQuizRoute } from '@/lib/navigation/routes';
import type { ReviewEntry } from '@/types/progress';
import { useMemo } from 'react';

export default function ReviewScreen() {
  const router = useRouter();
  const { snapshot, isLoading: isProgressLoading } = useProgress();
  const { catalog, state: contentState, retry } = useContent();
  const { scopeSelection, startReviewSession } = useQuizSession();
  const reviewQueue = snapshot?.reviewQueue;

  const { availableEntries, skippedCount } = useMemo(() => {
    const queue = reviewQueue ?? [];
    if (!catalog) {
      return { availableEntries: queue, skippedCount: 0 };
    }

    const availableQuestionIds = new Set(
      catalog.questions
        .filter((question) => question.published && !question.deleted)
        .map((question) => question.id),
    );
    const available: ReviewEntry[] = [];
    let skipped = 0;

    for (const entry of queue) {
      if (availableQuestionIds.has(entry.questionId)) {
        available.push(entry);
      } else {
        skipped += 1;
      }
    }

    return { availableEntries: available, skippedCount: skipped };
  }, [catalog, reviewQueue]);

  const handleStart = () => {
    if (!catalog || availableEntries.length === 0) return;

    const session = startReviewSession(
      availableEntries,
      catalog.questions,
      scopeSelection.questionCount,
    );
    if (!session) return;

    // 問題本体はQuizSessionContextに保持し、URLには識別子だけを渡す。
    router.push(createQuizRoute(session.id));
  };

  const handleBack = () => {
    router.back();
  };

  if (isProgressLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator accessibilityLabel="学習記録を読み込み中" />
        <ThemedText>学習記録を読み込んでいます。</ThemedText>
      </ThemedView>
    );
  }

  if (contentState === 'error' && !catalog) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: '復習' }} />
        <ThemedText type="title" style={styles.errorTitle}>
          教材を利用できません
        </ThemedText>
        <ThemedText style={styles.errorMessage}>
          復習対象の問題を確認できませんでした。通信を確認して再試行してください。
        </ThemedText>
        <ThemedText
          accessibilityRole="button"
          accessibilityLabel="教材を再試行"
          onPress={() => void retry()}
          style={styles.retryButton}>
          再試行
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ResponsiveScrollView contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: '復習' }} />
      <ReviewQueueSummary
        entries={availableEntries}
        skippedCount={skippedCount}
        onStart={handleStart}
        onBack={handleBack}
        startDisabled={!catalog || availableEntries.length === 0}
        questionCount={scopeSelection.questionCount}
      />
    </ResponsiveScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
  },
  errorMessage: {
    maxWidth: 480,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 48,
    minWidth: 120,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
    fontWeight: '700',
    color: '#0A7EA4',
  },
});
