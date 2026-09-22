import { describe, expect, it } from 'vitest';
import { buildFeedback } from '@/lib/quiz/feedback';
import type { ContentCatalog, QuestionItem, TermEntry } from '@/types/content';
import type { AnswerRecord } from '@/types/session';

const question: QuestionItem = {
  id: 'question-feedback',
  weekUnitId: 'week-unit-week3',
  format: 'singleChoice',
  prompt: '問題文',
  payload: {
    kind: 'choice',
    options: [
      { id: 'correct', text: '正解の内容' },
      { id: 'wrong', text: '誤った内容' },
      { id: 'other-1', text: '別の選択肢1' },
      { id: 'other-2', text: '別の選択肢2' },
    ],
    correctOptionId: 'correct',
    incorrectReasons: { wrong: '選択した内容では主軸を指定できません。' },
  },
  explanation: 'Flexboxは主軸を使って配置を決めます。Flexboxを確認します。',
  sourceReference: { weekKey: 'week3', sectionHeading: 'Flexboxの基本' },
  published: true,
  deleted: false,
};

const terms: TermEntry[] = [{
  id: 'term-flexbox',
  name: 'Flexbox',
  weekUnitId: 'week-unit-week3',
  definition: '親要素の子要素を一方向に並べるレイアウト方式です。',
  usageExamples: ['Flexboxを使います。'],
  sourceReference: { weekKey: 'week3', sectionHeading: 'Flexboxの基本' },
  relatedTermNames: [],
  published: true,
  deleted: false,
}];

const catalog: ContentCatalog = {
  weekUnits: [],
  questions: [question],
  terms,
  activities: [],
};

function answer(overrides: Partial<AnswerRecord> = {}): AnswerRecord {
  return {
    questionId: question.id,
    selectedOptionId: 'wrong',
    isCorrect: false,
    answeredAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildFeedback', () => {
  it('判定、正解、全文解説、出典、誤り理由、用語リンクをまとめる', () => {
    expect(buildFeedback(question, answer(), catalog)).toEqual({
      questionId: question.id,
      isCorrect: false,
      correctText: '正解の内容',
      explanation: question.explanation,
      explanationSegments: [
        { text: 'Flexbox', termId: 'term-flexbox' },
        { text: 'は主軸を使って配置を決めます。Flexboxを確認します。' },
      ],
      sourceReference: question.sourceReference,
      incorrectReason: '選択した内容では主軸を指定できません。',
    });
  });

  it('誤り理由がない場合は理由フィールドを持たない', () => {
    const noReasonQuestion = {
      ...question,
      payload: { ...question.payload, incorrectReasons: undefined },
    } as QuestionItem;

    expect(buildFeedback(noReasonQuestion, answer(), catalog)).not.toHaveProperty('incorrectReason');
  });

  it('正解時は誤り理由を表示しない', () => {
    const feedback = buildFeedback(question, answer({ selectedOptionId: 'correct', isCorrect: true }), catalog);
    expect(feedback.isCorrect).toBe(true);
    expect(feedback.correctText).toBe('正解の内容');
    expect(feedback).not.toHaveProperty('incorrectReason');
  });

  it('Feedbackモデルは再解答用の選択状態を保持せず、確定済み表示を変更しない', () => {
    const firstAnswer = answer();
    const feedbackWhileShown = buildFeedback(question, firstAnswer, catalog);
    const attemptedSecondAnswer = answer({ selectedOptionId: 'correct', isCorrect: true });
    const rebuiltFeedback = buildFeedback(question, attemptedSecondAnswer, catalog);

    expect(feedbackWhileShown.isCorrect).toBe(false);
    expect(feedbackWhileShown.correctText).toBe('正解の内容');
    expect(feedbackWhileShown).not.toHaveProperty('selectedOptionId');
    expect(feedbackWhileShown).not.toHaveProperty('canSubmit');
    expect(firstAnswer).toEqual(answer());
    expect(rebuiltFeedback.isCorrect).toBe(true);
  });
});
