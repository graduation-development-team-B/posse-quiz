import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ResponsiveScrollView } from '@/components/layout';
import { AccessibilityAnnouncement } from '@/components/accessibility/AccessibilityAnnouncement';
import { AccessibleButton } from '@/components/AccessibleButton';
import { GameResultBanner } from '@/components/game/GameResultBanner';
import {
  FeedbackActions,
  FeedbackExplanation,
  FeedbackQuestion,
} from '@/components/feedback';
import {
  FeedbackState,
  LearningCard,
  SourceReferenceBlock,
} from '@/components/learning-loop';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useContent } from '@/contexts/ContentContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useProgress } from '@/contexts/ProgressContext';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import { SUPPORTED_WEEK_KEYS } from '@/lib/constants';
import { createImmediateReviewRoute, createQuizRoute, createResultRoute, createTermRoute, readSessionId } from '@/lib/navigation/routes';
import { addReviewOnWrongAnswer, applyReviewAnswer } from '@/lib/progress/reviewQueue';
import { getFeedbackAnnouncement } from '@/lib/accessibility/feedbackAnnouncement';
import { buildFeedback } from '@/lib/quiz/feedback';
import type { WeekKey } from '@/types/content';

// A route remount must not record the same submitted answer twice.
const persistedFeedbackKeys = new Set<string>();

export default function FeedbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = readSessionId(params);
  const { catalog } = useContent();
  const {
    snapshot,
    isLoading: isProgressLoading,
    recordAnswer,
    updateReviewQueue,
  } = useProgress();
  const { currentSession, getSession, goToNextQuestion } = useQuizSession();
  const [notice, setNotice] = useState<string | null>(null);

  const session = sessionId ? getSession(sessionId) : null;
  const question = session?.questions[session.currentIndex] ?? null;
  const answer = question && session ? session.answers[question.id] : undefined;
  const isCurrentSession = currentSession?.id === session?.id;
  const feedback = useMemo(() => {
    if (!question || !answer || !catalog) return null;
    return buildFeedback(question, answer, catalog);
  }, [answer, catalog, question]);
  // 正誤はGameResultBannerとFeedbackStateで示すため、背景は全画面共通色に揃える。
  const feedbackBackground = useThemeColor({}, 'pageSurface');
  const reasonAccent = useThemeColor({}, 'reviewBlue');

  const answerKey = session && question && answer
    ? `${session.id}:${question.id}:${answer.answeredAt}`
    : null;
  const isLastQuestion = session
    ? session.currentIndex >= session.questions.length - 1
    : false;
  const optionOrder = question && session
    ? session.optionOrders[question.id] ?? (
      'options' in question.payload ? question.payload.options.map((option) => option.id) : []
    )
    : [];

  useEffect(() => {
    if (!answerKey || !question || !answer || !session || !isCurrentSession || isProgressLoading) return;
    if (persistedFeedbackKeys.has(answerKey)) return;

    const weekKey = question.sourceReference.weekKey;
    if (!SUPPORTED_WEEK_KEYS.includes(weekKey as WeekKey)) {
      setNotice('この問題の所属週を確認できないため、学習記録を保存できません。');
      return;
    }

    persistedFeedbackKeys.add(answerKey);
    let cancelled = false;
    const persist = async () => {
      try {
        await recordAnswer({
          ...answer,
          weekKey: weekKey as WeekKey,
        });

        const currentQueue = snapshot?.reviewQueue ?? [];
        const nextQueue = session.mode === 'review'
          ? applyReviewAnswer(currentQueue, question.id, answer.isCorrect, answer.answeredAt)
          : answer.isCorrect
            ? currentQueue
            : addReviewOnWrongAnswer(currentQueue, question, answer.answeredAt);

        if (nextQueue !== currentQueue) {
          await updateReviewQueue(nextQueue);
        }
      } catch {
        persistedFeedbackKeys.delete(answerKey);
        if (!cancelled) setNotice('学習記録を保存できませんでした。学習は続けられます。');
      }
    };

    void persist();
    return () => {
      cancelled = true;
    };
  }, [answer, answerKey, isCurrentSession, isProgressLoading, question, recordAnswer, session, snapshot?.reviewQueue, updateReviewQueue]);

  const handleImmediateReview = useCallback(() => {
    if (!session) return;
    router.replace(createImmediateReviewRoute(session.id) as never);
  }, [router, session]);
  const handleNext = useCallback(() => {
    if (!session || !isCurrentSession) return;
    if (isLastQuestion) {
      router.replace(createResultRoute(session.id) as never);
      return;
    }
    goToNextQuestion();
    router.replace(createQuizRoute(session.id) as never);
  }, [goToNextQuestion, isCurrentSession, isLastQuestion, router, session]);

  if (!sessionId || !session || !question || !answer || !feedback || !isCurrentSession) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText type="title">解説</ThemedText>
        <ThemedText style={styles.centerText}>
          判定済みの問題が見つかりません。クイズから解答してください。
        </ThemedText>
        <AccessibleButton
          label="出題範囲へ戻る"
          onPress={() => router.replace('/scope')}
          style={styles.primaryButton}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: feedbackBackground }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ResponsiveScrollView contentContainerStyle={styles.content}>
        <GameResultBanner
          tone={feedback.isCorrect ? 'success' : 'retry'}
          title={feedback.isCorrect ? 'せいかい！' : 'おしい！ふくしゅうしよう'}
          detail={feedback.isCorrect ? 'できたね。その調子で次へ進もう。' : 'すぐに復習して定着させよう'}
        />
        <ThemedText style={styles.progressText}>
          問題 {session.currentIndex + 1} / {session.questions.length} ・ 正解数 {session.correctCount}問
        </ThemedText>

        {answerKey ? (
          <AccessibilityAnnouncement
            announcementKey={answerKey}
            message={getFeedbackAnnouncement(feedback)}
          />
        ) : null}

        <FeedbackState isCorrect={feedback.isCorrect} correctText={feedback.correctText} />
        <FeedbackQuestion question={question} answer={answer} optionOrder={optionOrder} />

        <LearningCard
          accessibilityLabel="解説全文と正解"
          title="解説全文"
          style={styles.explanationCard}
        >
          <View style={styles.correctAnswer}>
            <ThemedText type="defaultSemiBold">正解の内容</ThemedText>
            <ThemedText>{feedback.correctText}</ThemedText>
          </View>
          <FeedbackExplanation
            onTermPress={(termId) => router.push(createTermRoute(termId) as never)}
            segments={feedback.explanationSegments}
          />
        </LearningCard>

        <SourceReferenceBlock sourceReference={feedback.sourceReference} />

        {feedback.incorrectReason ? (
          <ThemedView
            accessibilityLabel="誤答の理由"
            accessibilityRole="summary"
            variant="surface"
            style={[styles.reasonCard, { borderColor: reasonAccent }]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: reasonAccent }}>
              なぜ違う？
            </ThemedText>
            <ThemedText>{feedback.incorrectReason}</ThemedText>
          </ThemedView>
        ) : null}

        {notice ? <ThemedText style={styles.notice}>{notice}</ThemedText> : null}
        <FeedbackActions
          isCorrect={feedback.isCorrect}
          isLastQuestion={isLastQuestion}
          onImmediateReview={handleImmediateReview}
          onNext={handleNext}
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
    gap: 16,
    paddingBottom: 40,
  },
  heading: {
    gap: 4,
  },
  headingCopy: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
  },
  progressText: {
    lineHeight: 24,
  },
  announcement: {
    minHeight: 1,
    width: 1,
  },
  explanationCard: {
    gap: 16,
  },
  correctAnswer: {
    gap: 4,
  },
  reasonCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  notice: {
    color: '#166534',
    fontWeight: '600',
    lineHeight: 22,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 52,
    paddingHorizontal: 18,
  },
});
