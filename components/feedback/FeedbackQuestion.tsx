import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { QuizCodeBlock } from '@/components/quiz/QuizCodeBlock';
import { QuizOption } from '@/components/quiz/QuizOption';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import type { QuestionItem } from '@/types/content';
import type { AnswerRecord } from '@/types/session';

const FORMAT_LABELS: Record<QuestionItem['format'], string> = {
  singleChoice: '4択',
  trueFalse: '正誤判定',
  bugDiagnosis: 'バグ診断',
  fillBlank: '穴埋め',
  interactive: '操作ミッション',
};

interface FeedbackQuestionProps {
  question: QuestionItem;
  answer: AnswerRecord;
  optionOrder: readonly string[];
}

export function FeedbackQuestion({ question, answer, optionOrder }: FeedbackQuestionProps) {
  const { isCompact } = useResponsiveLayout();
  const orderedOptions = useMemo(() => {
    if (!('options' in question.payload)) return [];
    const optionsById = new Map(question.payload.options.map((option) => [option.id, option]));
    return optionOrder
      .map((optionId) => optionsById.get(optionId))
      .filter((option): option is (typeof question.payload.options)[number] => option !== undefined);
  }, [optionOrder, question]);

  const freeTextPayload = question.format === 'fillBlank'
    && 'mode' in question.payload
    && question.payload.mode === 'freeText';
  const selectedOptionId = answer.selectedOptionId;

  return (
    <ThemedView variant="surface" style={styles.card}>
      <ThemedText type="defaultSemiBold" style={styles.formatLabel}>
        {FORMAT_LABELS[question.format]}
      </ThemedText>
      <ThemedText type="subtitle" accessibilityRole="header">
        {question.prompt}
      </ThemedText>

      {question.format === 'bugDiagnosis' && question.payload.kind === 'bugDiagnosis' ? (
        <QuizCodeBlock code={question.payload.code} label="バグ診断コード" />
      ) : null}

      {question.format === 'fillBlank' && 'content' in question.payload ? (
        <QuizCodeBlock
          code={question.payload.content.replace(question.payload.blankToken, '＿＿＿＿')}
          label="穴埋めコード"
        />
      ) : null}

      {question.format === 'interactive' ? (
        <ThemedView variant="elevated" style={styles.answerBox}>
          <ThemedText type="defaultSemiBold">実行した回答</ThemedText>
          <ThemedText>{answer.activityCompleted ? '操作ミッションを達成' : '（未完了）'}</ThemedText>
        </ThemedView>
      ) : freeTextPayload ? (
        <ThemedView variant="elevated" style={styles.answerBox}>
          <ThemedText type="defaultSemiBold">入力した回答</ThemedText>
          <ThemedText>{answer.freeText?.trim() || '（入力なし）'}</ThemedText>
        </ThemedView>
      ) : (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="確定済みの選択肢"
          style={[styles.options, !isCompact && styles.optionsGrid]}
        >
          {orderedOptions.map((option) => (
            <QuizOption
              key={option.id}
              disabled
              onPress={() => undefined}
              option={option}
              selected={selectedOptionId === option.id}
            />
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    gap: 14,
    padding: 20,
  },
  formatLabel: {
    color: '#075985',
  },
  options: {
    gap: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  answerBox: {
    borderRadius: 10,
    gap: 6,
    padding: 14,
  },
});
