import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AccessibleButton } from '@/components/AccessibleButton';
import { LearningCta } from '@/components/learning-loop';
import { ResponsiveScrollView } from '@/components/layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import { createQuizRoute, createResultRoute, readSessionId } from '@/lib/navigation/routes';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ImmediateReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = readSessionId(params);
  const { getSession, startSessionFromPool } = useQuizSession();
  const { breakpoint } = useResponsiveLayout();
  const reviewSurface = useThemeColor({}, 'reviewSurface');
  const session = sessionId ? getSession(sessionId) : null;
  const wrongQuestions = useMemo(
    () => session?.questions.filter((question) => session.answers[question.id]?.isCorrect === false) ?? [],
    [session],
  );

  const startImmediateReview = () => {
    if (!session || wrongQuestions.length === 0) return;
    const reviewSession = startSessionFromPool(wrongQuestions, wrongQuestions.length, 'review');
    if (reviewSession) router.replace(createQuizRoute(reviewSession.id) as never);
  };

  if (!session || !sessionId) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText type="title">すぐに復習</ThemedText>
        <ThemedText style={styles.centerText}>このセッションの復習問題が見つかりません。</ThemedText>
        <AccessibleButton label="結果へ戻る" onPress={() => router.replace('/')} />
      </ThemedView>
    );
  }

  return (
    <ThemedView colorName="pageSurface" style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ResponsiveScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <AccessibleButton label="×" accessibilityLabel="結果へ戻る" onPress={() => router.replace(createResultRoute(session.id) as never)} variant="ghost" style={styles.closeButton} />
          <ThemedText colorName="reviewBlue" style={styles.contextLabel}>IMMEDIATE REVIEW</ThemedText>
        </View>
        <View style={styles.heading}>
          <ThemedText type="title">すぐに復習して定着させよう</ThemedText>
          <ThemedText style={styles.lead}>このセッションで間違えた問題を、記憶が新しいうちに確認できます。</ThemedText>
        </View>

        {wrongQuestions.length > 0 ? (
          <View style={[styles.questionGrid, breakpoint === 'compact' && styles.questionGridCompact]}>
            {wrongQuestions.map((question, index) => (
              <ThemedView key={question.id} variant="surface" style={styles.questionCard}>
                <View style={styles.questionHeader}><View style={[styles.number, { backgroundColor: reviewSurface }]}><ThemedText colorName="reviewBlue" style={styles.numberText}>{index + 1}</ThemedText></View><ThemedText colorName="supportGray">{question.sourceReference.weekKey}</ThemedText></View>
                <ThemedText type="defaultSemiBold" numberOfLines={3}>{question.prompt}</ThemedText>
                <ThemedText style={styles.sectionHeading}>{question.sourceReference.sectionHeading}</ThemedText>
              </ThemedView>
            ))}
          </View>
        ) : (
          <ThemedView variant="surface" style={styles.questionCard}><ThemedText type="subtitle">復習する問題はありません</ThemedText><ThemedText>全問正解のセッションでした。</ThemedText></ThemedView>
        )}

        <View style={styles.actions}>
          <LearningCta
            label={`間違えた問題を復習（${wrongQuestions.length}件）`}
            accessibilityHint="このセッションの誤答だけで復習セッションを開始します"
            disabled={wrongQuestions.length === 0}
            onPress={startImmediateReview}
            tone="review"
            style={styles.primaryAction}
          />
          <AccessibleButton label="結果画面へ" accessibilityHint="セッション結果を表示します" onPress={() => router.replace(createResultRoute(session.id) as never)} variant="ghost" style={styles.secondaryAction} />
        </View>
      </ResponsiveScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 20, paddingBottom: 40 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 },
  closeButton: { borderRadius: 999, marginVertical: 0, minHeight: 44, minWidth: 44 },
  contextLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heading: { gap: 8 },
  lead: { lineHeight: 23, opacity: 0.8 },
  questionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  questionGridCompact: { flexDirection: 'column' },
  questionCard: { borderRadius: 24, flexBasis: '48%', flexGrow: 1, gap: 12, minWidth: 260, padding: 18 },
  questionHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  number: { alignItems: 'center', backgroundColor: '#DBEAFE', borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
  numberText: { fontSize: 16, fontWeight: '800' },
  sectionHeading: { fontSize: 13, lineHeight: 19, opacity: 0.72 },
  actions: { gap: 8, paddingTop: 4 },
  primaryAction: { borderRadius: 999, minHeight: 56 },
  secondaryAction: { borderRadius: 999 },
  centered: { alignItems: 'center', flex: 1, gap: 16, justifyContent: 'center', padding: 24 },
  centerText: { textAlign: 'center' },
});
