import { describe, expect, it } from 'vitest';

import {
  addReviewOnWrongAnswer,
  applyReviewAnswer,
  sortReviewQueue,
  type ReviewQuestion,
} from '@/lib/progress/reviewQueue';
import type { ReviewEntry } from '@/types/progress';

const question: ReviewQuestion = {
  questionId: 'question-1',
  weekKey: 'week3',
};

function entry(overrides: Partial<ReviewEntry> = {}): ReviewEntry {
  return {
    questionId: 'question-1',
    weekKey: 'week3',
    wrongCount: 1,
    consecutiveCorrect: 0,
    lastWrongAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('reviewQueue domain functions', () => {
  it('未登録の誤答を初期値で追加する', () => {
    expect(addReviewOnWrongAnswer([], question, '2025-01-02T00:00:00.000Z')).toEqual([
      entry({ lastWrongAt: '2025-01-02T00:00:00.000Z' }),
    ]);
  });

  it('既登録の誤答回数を増やし、99で飽和して連続正解をリセットする', () => {
    let queue = [entry({ wrongCount: 98, consecutiveCorrect: 1 })];
    queue = addReviewOnWrongAnswer(queue, question, '2025-01-02T00:00:00.000Z');
    expect(queue[0]).toEqual(entry({ wrongCount: 99, lastWrongAt: '2025-01-02T00:00:00.000Z' }));

    queue = addReviewOnWrongAnswer(queue, question, '2025-01-03T00:00:00.000Z');
    expect(queue[0]).toEqual(entry({ wrongCount: 99, lastWrongAt: '2025-01-03T00:00:00.000Z' }));
  });

  it('200件で新規追加すると最終誤答日時が最古の1件を置換する', () => {
    const queue = Array.from({ length: 200 }, (_, index) => entry({
      questionId: `question-${index}`,
      lastWrongAt: `2025-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
    }));
    const newQuestion: ReviewQuestion = { ...question, questionId: 'question-new' };
    const next = addReviewOnWrongAnswer(queue, newQuestion, '2025-03-01T00:00:00.000Z');

    expect(next).toHaveLength(200);
    expect(next.some((review) => review.questionId === newQuestion.questionId)).toBe(true);
    expect(next.some((review) => review.questionId === 'question-0')).toBe(false);
    expect(queue).toHaveLength(200);
  });

  it('復習誤答は連続正解を0にして最終誤答日時だけを更新する', () => {
    const queue = [entry({ wrongCount: 8, consecutiveCorrect: 1 })];
    expect(applyReviewAnswer(queue, question.questionId, false, '2025-02-01T00:00:00.000Z')).toEqual([
      entry({ wrongCount: 8, consecutiveCorrect: 0, lastWrongAt: '2025-02-01T00:00:00.000Z' }),
    ]);
  });

  it('復習正解は連続正解を増やし、2回目で除外する', () => {
    const once = applyReviewAnswer([entry()], question.questionId, true, '2025-02-01T00:00:00.000Z');
    expect(once).toEqual([entry({ consecutiveCorrect: 1 })]);
    expect(applyReviewAnswer(once, question.questionId, true, '2025-02-02T00:00:00.000Z')).toEqual([]);
  });

  it('復習対象が未登録ならキューを変更しない', () => {
    const queue = [entry()];
    expect(applyReviewAnswer(queue, 'missing-question', true, '2025-02-01T00:00:00.000Z')).toEqual(queue);
  });

  it('復習セッション用に誤答回数、日時の順で並べ、入力を変更しない', () => {
    const queue = [
      entry({ questionId: 'low', wrongCount: 1, lastWrongAt: '2025-03-01T00:00:00.000Z' }),
      entry({ questionId: 'high-old', wrongCount: 3, lastWrongAt: '2025-01-01T00:00:00.000Z' }),
      entry({ questionId: 'high-new', wrongCount: 3, lastWrongAt: '2025-02-01T00:00:00.000Z' }),
    ];
    const sorted = sortReviewQueue(queue);

    expect(sorted.map((review) => review.questionId)).toEqual(['high-new', 'high-old', 'low']);
    expect(queue.map((review) => review.questionId)).toEqual(['low', 'high-old', 'high-new']);
  });
});
