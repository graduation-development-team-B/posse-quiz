import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AccessibleButton } from '@/components/AccessibleButton';
import { ResponsiveScrollView } from '@/components/layout';
import { ResultSummary } from '@/components/result/ResultSummary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useProgress } from '@/contexts/ProgressContext';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import { createQuizRoute, readSessionId } from '@/lib/navigation/routes';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = readSessionId(params);
  const { snapshot, getStore } = useProgress();
  const { getSession, startSessionFromPool } = useQuizSession();
  const session = sessionId ? getSession(sessionId) : null;

  // 結果画面を表示してから保存を開始し、Progress保存を画面遷移の待ち時間にしない。
  useEffect(() => {
    if (!session) return;
    void getStore().save();
  }, [getStore, session]);

  const incorrectQuestions = useMemo(() => {
    if (!session) return [];
    return session.questions.filter((question) => session.answers[question.id]?.isCorrect === false);
  }, [session]);
  const elapsedSeconds = useMemo(() => {
    if (!session) return 0;
    const answerTimes = Object.values(session.answers)
      .map((answer) => Date.parse(answer.answeredAt))
      .filter(Number.isFinite);
    const end = answerTimes.length > 0 ? Math.max(...answerTimes) : Date.parse(session.startedAt);
    const start = Date.parse(session.startedAt);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
    return Math.max(0, Math.round((end - start) / 1000));
  }, [session]);


  if (!session) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText type="title">結果</ThemedText>
        <ThemedText>結果を表示できるクイズセッションが見つかりません。</ThemedText>
        <AccessibleButton label="ホームへ戻る" onPress={() => router.replace('/')} />
      </ThemedView>
    );
  }

  const handleRetry = () => {
    // The completed session is the authoritative snapshot of its realized scope.
    // Reusing it keeps retry range and question count stable even if scope UI state changed.
    const nextSession = startSessionFromPool(session.questions, session.questions.length, session.mode);
    if (nextSession) router.replace(createQuizRoute(nextSession.id));
  };

  return (
    <ThemedView colorName="pageSurface" style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ResponsiveScrollView contentContainerStyle={styles.content}>
        <ResultSummary
          allCorrect={session.questions.length > 0 && session.correctCount === session.questions.length}
          correctCount={session.correctCount}
          elapsedSeconds={elapsedSeconds}
          incorrectQuestions={incorrectQuestions}
          onHome={() => router.replace('/')}
          onRetry={handleRetry}
          onReview={() => router.push('/review')}
          reviewCount={snapshot?.reviewQueue.length ?? 0}
          totalCount={session.questions.length}
        />
      </ResponsiveScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
});
