import { describe, expect, it } from 'vitest';
import type { ContentCatalog, QuestionItem } from '@/types/content';
import type { ReviewEntry } from '@/types/progress';
import { createSeededRandom } from '@/lib/quiz/random';
import { countQuestionsInScope, selectQuestionPool } from '@/lib/quiz/scope';
import {
  createQuizSession,
  createReviewSession,
  createSessionForScope,
  normalizeQuestionCount,
} from '@/lib/quiz/sessionManager';

function question(id: string, format: QuestionItem['format'] = 'singleChoice'): QuestionItem {
  const options = [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
    { id: 'd', text: 'D' },
  ];
  return {
    id,
    weekUnitId: 'week-unit-week3',
    format,
    prompt: id,
    payload: format === 'trueFalse'
      ? { kind: 'trueFalse', options: [{ id: 'true', text: '正しい' }, { id: 'false', text: '誤り' }], correctOptionId: 'true' }
      : format === 'bugDiagnosis'
        ? { kind: 'bugDiagnosis', code: 'const value = 1;', options, correctOptionId: 'a' }
        : { kind: 'choice', options, correctOptionId: 'a' },
    explanation: 'この問題の解説は教材の内容と理由を確認できる十分な文章です。',
    sourceReference: { weekKey: 'week3', sectionHeading: '基本' },
    published: true,
    deleted: false,
  } as QuestionItem;
}

function catalog(): ContentCatalog {
  const weeks = [
    { id: 'week-unit-week3', key: 'week3', order: 3, title: 'Week3', published: true, deleted: false },
    { id: 'week-unit-week4', key: 'week4', order: 4, title: 'Week4', published: true, deleted: false },
  ];
  const questions = [question('q-a1'), question('q-b1', 'bugDiagnosis'), question('q-c1')];
  questions[2]!.weekUnitId = 'week-unit-week4';
  questions[2]!.sourceReference.weekKey = 'week4';
  return { weekUnits: weeks, questions, terms: [], activities: [] };
}

describe('quiz scope and session manager', () => {
  it('選択したWeekの問題だけを返し、非公開や他Weekの問題を除外する', () => {
    const source = catalog();
    source.questions.push({ ...source.questions[0]!, id: 'inactive', published: false });
    source.questions.push({ ...source.questions[0]!, id: 'wrong-week', weekUnitId: 'week-unit-week4' });

    const pool = selectQuestionPool(source, { weekKeys: ['week3'] });
    expect(pool.map((item) => item.id)).toEqual(['q-a1', 'q-b1']);
    expect(countQuestionsInScope(source, { weekKeys: ['week3'] })).toBe(2);
    expect(countQuestionsInScope(source, { weekKeys: ['week4'] })).toBe(2);
  });

  it('supports cross-week selection and never returns duplicate IDs', () => {
    const source = catalog();
    source.questions.push({ ...source.questions[0]!, id: 'q-a1' });
    const pool = selectQuestionPool(source, { weekKeys: ['week3', 'week4'] });
    expect(pool.map((item) => item.id)).toEqual(['q-a1', 'q-b1', 'q-c1']);
  });

  it.each([
    [undefined, 5], [0, 5], [4, 5], [3, 3], [5, 5], [10, 10], [11, 5],
  ])('normalizes question count %s to %s', (input, expected) => {
    expect(normalizeQuestionCount(input)).toBe(expected);
  });

  it('uses all available questions when the pool is smaller than the requested count', () => {
    const session = createQuizSession([question('q1'), question('q2')], 10, 'normal', createSeededRandom(1));
    expect(session?.questionIds).toHaveLength(2);
    expect(new Set(session?.questionIds).size).toBe(2);
  });

  it('represents a one-question session at its final question boundary', () => {
    const session = createQuizSession([question('final-question')], 5, 'normal', createSeededRandom(1));

    expect(session).not.toBeNull();
    expect(session?.questionIds).toEqual(['final-question']);
    expect(session?.questions).toHaveLength(1);
    expect(session?.currentIndex).toBe(0);
    expect(session ? session.currentIndex + 1 : undefined).toBe(session?.questions.length);
    expect(session?.answeredCount).toBe(0);
    expect(session?.correctCount).toBe(0);
  });

  it('does not create a review session when Review Queue is empty', () => {
    const questions = [question('review-question')];

    expect(createReviewSession([], questions, 5, createSeededRandom(1))).toBeNull();
  });

  it('includes a non-single-choice question in sessions of at least five when available', () => {
    const pool = [
      question('q1'), question('q2'), question('q3'),
      question('q4'), question('q5'), question('q6', 'bugDiagnosis'),
    ];
    const session = createQuizSession(pool, 5, 'normal', createSeededRandom(4));
    expect(session?.questions.some((item) => item.format !== 'singleChoice')).toBe(true);
  });

  it('keeps a deep immutable question and option-order snapshot', () => {
    const sourceQuestion = question('q1');
    const session = createQuizSession([sourceQuestion], 3, 'normal', createSeededRandom(1));
    sourceQuestion.prompt = 'updated catalog prompt';
    if ('options' in sourceQuestion.payload) {
      sourceQuestion.payload.options[0]!.text = 'updated option';
    }

    expect(session?.questions[0]?.prompt).toBe('q1');
    expect(session?.questions[0]?.payload).not.toBe(sourceQuestion.payload);
    expect(Object.isFrozen(session?.questions[0])).toBe(true);
    expect(Object.isFrozen(session?.optionOrders.q1)).toBe(true);
  });

  it('creates review sessions in wrong-count and latest-wrong-first order', () => {
    const questions = [question('q1'), question('q2'), question('q3')];
    const queue: ReviewEntry[] = [
      { questionId: 'q1', weekKey: 'week3', wrongCount: 2, consecutiveCorrect: 0, lastWrongAt: '2025-01-01T00:00:00.000Z' },
      { questionId: 'q2', weekKey: 'week3', wrongCount: 3, consecutiveCorrect: 0, lastWrongAt: '2024-01-01T00:00:00.000Z' },
      { questionId: 'q3', weekKey: 'week3', wrongCount: 3, consecutiveCorrect: 0, lastWrongAt: '2025-01-02T00:00:00.000Z' },
    ];
    const session = createReviewSession(queue, questions, 5, createSeededRandom(2));
    expect(session?.questionIds).toEqual(['q3', 'q2', 'q1']);
  });

  it('does not create a session for an empty scope', () => {
    expect(createSessionForScope(catalog(), { weekKeys: ['week6'] }, 5)).toBeNull();
    expect(createQuizSession([], 5)).toBeNull();
  });
});
