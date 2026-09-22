import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameActionButton } from '@/components/game/GameActionButton';
import { GameChoice } from '@/components/game/GameChoice';
import { MissionBubble } from '@/components/game/MissionBubble';
import { Mascot, type MascotMood } from '@/components/game/Mascot';
import { ProgressHeader } from '@/components/learning-loop/ProgressHeader';
import { FreeTextAnswer } from '@/components/quiz/FreeTextAnswer';
import { QuizCodeBlock } from '@/components/quiz/QuizCodeBlock';
import { TerminalTokenActivity } from '@/components/quiz/TerminalTokenActivity';
import { GameColors, Radii, Space } from '@/constants/game-theme';
import { useContent } from '@/contexts/ContentContext';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import { judgeAnswer } from '@/lib/quiz/answerJudge';
import { isInteractiveQuestionPayload, resolveTerminalStage } from '@/lib/quiz/terminalToken';
import { readSessionId } from '@/lib/navigation/routes';
import type { ChoiceOption, QuestionItem } from '@/types/content';

const FORMAT_LABELS: Record<QuestionItem['format'], string> = {
  singleChoice: '4択ミッション',
  trueFalse: '正誤ミッション',
  bugDiagnosis: 'バグ診断ミッション',
  fillBlank: '穴埋めミッション',
  interactive: '操作ミッション',
};

export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = readSessionId(params);
  const { catalog } = useContent();
  const {
    currentSession,
    draftAnswers,
    getSession,
    setDraftAnswer,
    submitAnswer,
    clearSession,
  } = useQuizSession();
  const [notice, setNotice] = useState<string | null>(null);

  const session = sessionId ? getSession(sessionId) : null;
  const question = session?.questions[session.currentIndex] ?? null;
  const draft = question ? draftAnswers[question.id] : undefined;
  const recordedAnswer = question && session ? session.answers[question.id] : undefined;
  const isAnswered = recordedAnswer !== undefined;
  const selectedOptionId = draft?.selectedOptionId ?? recordedAnswer?.selectedOptionId;
  const freeText = draft?.freeText ?? recordedAnswer?.freeText ?? '';
  const activityCompleted = draft?.activityCompleted ?? recordedAnswer?.activityCompleted ?? false;
  const isCurrentSession = currentSession?.id === session?.id;

  const judgement = useMemo(() => {
    if (!question) return null;
    return judgeAnswer(question, {
      ...(selectedOptionId === undefined ? {} : { optionId: selectedOptionId }),
      ...(question.format === 'fillBlank' && isFreeTextPayload(question.payload)
        ? { freeText }
        : {}),
      ...(question.format === 'interactive' ? { activityCompleted } : {}),
    });
  }, [activityCompleted, freeText, question, selectedOptionId]);

  const resolvedActivity = useMemo(() => {
    if (!question || question.format !== 'interactive' || !isInteractiveQuestionPayload(question.payload)) return null;
    return resolveTerminalStage(catalog, question.payload);
  }, [catalog, question]);

  const orderedOptions = useMemo(() => {
    if (!question || !('options' in question.payload)) return [];
    const optionById = new Map(question.payload.options.map((option) => [option.id, option]));
    const order = session?.optionOrders[question.id] ?? question.payload.options.map((option) => option.id);
    return order
      .map((optionId) => optionById.get(optionId))
      .filter((option): option is ChoiceOption => option !== undefined);
  }, [question, session]);

  const handleOptionPress = (optionId: string) => {
    if (!question || isAnswered) return;
    setNotice(null);
    setDraftAnswer(question.id, { selectedOptionId: optionId });
  };

  const handleFreeTextChange = (value: string) => {
    if (!question || isAnswered) return;
    setNotice(null);
    setDraftAnswer(question.id, { freeText: value });
  };

  const handleActivityComplete = () => {
    if (!question || question.format !== 'interactive' || isAnswered) return;
    setNotice(null);
    setDraftAnswer(question.id, { activityCompleted: true });
  };

  const handleSubmit = () => {
    if (!question || !session || !judgement || !judgement.canSubmit || isAnswered) return;
    if (!isCurrentSession) {
      setNotice('このクイズセッションは現在利用できません。範囲選択からやり直してください。');
      return;
    }

    const answer = submitAnswer({
      ...(selectedOptionId === undefined ? {} : { selectedOptionId }),
      ...(isFreeTextPayload(question.payload) ? { freeText } : {}),
      ...(question.format === 'interactive' ? { activityCompleted } : {}),
      isCorrect: judgement.isCorrect,
      answeredAt: new Date().toISOString(),
    });
    if (!answer) {
      setNotice('解答を確定できませんでした。もう一度お試しください。');
      return;
    }

    router.push({ pathname: '/feedback/[sessionId]', params: { sessionId: session.id } } as never);
  };

  const handleExit = () => {
    const title = 'クイズを中断しますか？';
    const message = '確定済みの解答は保存されます。未解答の問題は記録されません。';
    const confirmExit = () => {
      clearSession();
      router.replace('/scope');
    };

    if (Platform.OS === 'web') {
      if (typeof globalThis.confirm === 'function' && globalThis.confirm(`${title}\n\n${message}`)) {
        confirmExit();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: '続ける', style: 'cancel' },
      { text: '中断する', style: 'destructive', onPress: confirmExit },
    ]);
  };

  if (!sessionId || !session || !question) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Mascot mood="gentle" size={96} />
        <Text style={styles.centerTitle}>クイズ</Text>
        <Text style={styles.centerText}>
          クイズセッションが見つかりません。出題範囲から開始してください。
        </Text>
        <GameActionButton
          label="出題範囲へ戻る"
          onPress={() => router.replace('/scope')}
          style={styles.centerButton}
        />
      </View>
    );
  }

  const isInteractive = question.format === 'interactive';
  const isFreeText = isFreeTextPayload(question.payload);
  const hasDraft = isInteractive
    ? activityCompleted
    : isFreeText
      ? freeText.trim().length > 0
      : selectedOptionId !== undefined;
  const submitDisabled = isAnswered || !judgement?.canSubmit || !isCurrentSession;
  const formatLabel = FORMAT_LABELS[question.format];
  const mood: MascotMood = isAnswered ? 'gentle' : hasDraft ? 'fun' : 'focus';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Space.sm }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerArea}>
        <ProgressHeader
          currentIndex={session.currentIndex + 1}
          total={session.questions.length}
          onExit={handleExit}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MissionBubble label={formatLabel} prompt={question.prompt} mood={mood}>
          {question.format === 'bugDiagnosis' && isBugDiagnosisPayload(question.payload) ? (
            <QuizCodeBlock code={question.payload.code} label="バグ診断コード" />
          ) : null}

          {question.format === 'fillBlank' && isFillBlankPayload(question.payload) ? (
            <QuizCodeBlock
              code={question.payload.content.replace(question.payload.blankToken, '＿＿＿＿')}
              label="穴埋めコード"
            />
          ) : null}
        </MissionBubble>

        {isInteractive ? (
          resolvedActivity ? (
            <TerminalTokenActivity
              key={`${resolvedActivity.activity.id}:${resolvedActivity.stage.id}`}
              completed={activityCompleted || isAnswered}
              onComplete={handleActivityComplete}
              rootName={resolvedActivity.activity.root.name}
              stage={resolvedActivity.stage}
            />
          ) : (
            <View style={styles.activityError}>
              <Text style={styles.errorText}>操作ミッションのデータを読み込めませんでした。教材を更新してやり直してください。</Text>
            </View>
          )
        ) : isFreeText ? (
          <View style={styles.answerSection}>
            <Text style={styles.answerLabel}>空欄に入る語句を入力</Text>
            <FreeTextAnswer
              disabled={isAnswered}
              onChangeText={handleFreeTextChange}
              value={freeText}
            />
            <Text style={styles.inputHint}>64文字以内。英字の大文字小文字は区別されます。</Text>
          </View>
        ) : (
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={`${formatLabel}の選択肢`}
            style={styles.options}
          >
            {orderedOptions.map((option, index) => (
              <GameChoice
                key={option.id}
                disabled={isAnswered}
                index={index}
                onPress={() => handleOptionPress(option.id)}
                text={option.text}
                selected={selectedOptionId === option.id}
              />
            ))}
          </View>
        )}

        {isAnswered ? (
          <Text style={styles.answeredText}>この問題は解答済みです。Feedbackを確認してください。</Text>
        ) : null}
        {notice ? <Text style={styles.errorText}>{notice}</Text> : null}
        {!judgement?.canSubmit && !isAnswered ? (
          <Text style={styles.hintText} accessibilityLiveRegion="polite">
            {isInteractive
              ? '操作ミッションを達成すると解答を確定できます。'
              : isFreeText
                ? '答えを入力すると確定できます。'
                : '選択肢を1つ選ぶと確定できます。'}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Space.md }]}>
        <GameActionButton
          label="解答を確定"
          accessibilityHint="選択した答えを確定します"
          disabled={submitDisabled}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

function isFreeTextPayload(
  payload: QuestionItem['payload'],
): payload is Extract<QuestionItem['payload'], { mode: 'freeText' }> {
  return 'mode' in payload && payload.mode === 'freeText' && typeof payload.correctText === 'string';
}

function isBugDiagnosisPayload(
  payload: QuestionItem['payload'],
): payload is Extract<QuestionItem['payload'], { kind: 'bugDiagnosis' }> {
  return payload.kind === 'bugDiagnosis' && typeof payload.code === 'string';
}

function isFillBlankPayload(
  payload: QuestionItem['payload'],
): payload is Extract<QuestionItem['payload'], { kind: 'fillBlank' }> {
  return payload.kind === 'fillBlank'
    && typeof payload.content === 'string'
    && typeof payload.blankToken === 'string';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GameColors.bg },
  headerArea: { paddingHorizontal: Space.xl, paddingBottom: Space.md },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Space.xl, paddingBottom: Space.xl, gap: Space.lg },
  answerSection: { gap: Space.sm },
  answerLabel: { fontSize: 15, fontWeight: '800', color: GameColors.text },
  inputHint: { color: GameColors.subText, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  options: { gap: Space.md },
  answeredText: { color: GameColors.primary, fontWeight: '700', lineHeight: 22 },
  errorText: { color: GameColors.danger, fontWeight: '700', lineHeight: 22 },
  hintText: { color: GameColors.subText, fontWeight: '600', lineHeight: 22 },
  activityError: {
    backgroundColor: GameColors.dangerSoft,
    borderRadius: Radii.chip,
    padding: Space.lg,
  },
  footer: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.md,
    backgroundColor: GameColors.card,
    borderTopLeftRadius: Radii.card,
    borderTopRightRadius: Radii.card,
    borderTopWidth: 2,
    borderColor: GameColors.border,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: Space.lg,
    justifyContent: 'center',
    padding: Space.xxl,
    backgroundColor: GameColors.bg,
  },
  centerTitle: { fontSize: 24, fontWeight: '800', color: GameColors.text },
  centerText: {
    textAlign: 'center',
    color: GameColors.subText,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  centerButton: { alignSelf: 'stretch' },
});
