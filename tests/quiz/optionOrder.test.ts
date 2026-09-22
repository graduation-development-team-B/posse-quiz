import { describe, expect, it } from 'vitest';

import type { QuestionItem } from '@/types/content';
import { createSeededRandom } from '@/lib/quiz/random';
import {
  createOptionOrder,
  getOptionOrder,
  getQuestionOptionIds,
} from '@/lib/quiz/optionOrder';
import { createQuizSession } from '@/lib/quiz/sessionManager';

function choiceQuestion(format: QuestionItem['format'] = 'singleChoice'): QuestionItem {
  const options = [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
    { id: 'd', text: 'D' },
  ];

  return {
    id: 'question-1',
    weekUnitId: 'week-unit-week3',
    format,
    prompt: '問題',
    payload: format === 'trueFalse'
      ? {
          kind: 'trueFalse',
          options: [
            { id: 'true', text: '正しい' },
            { id: 'false', text: '誤り' },
          ],
          correctOptionId: 'true',
        }
      : { kind: 'choice', options, correctOptionId: 'a' },
    explanation: 'この問題の解説は選択肢順の固定を確認するための文章です。',
    sourceReference: { weekKey: 'week3', sectionHeading: 'テスト' },
    published: true,
    deleted: false,
  } as QuestionItem;
}

describe('option order', () => {
  it('同じ session と question の組では決定的に同じ順を作る', () => {
    const ids = ['a', 'b', 'c', 'd'];

    expect(createOptionOrder('session-1', 'question-1', ids, 'singleChoice')).toEqual(
      createOptionOrder('session-1', 'question-1', ids, 'singleChoice'),
    );
  });

  it('初回生成した順序を optionOrders に保存し、再表示で再利用する', () => {
    const question = choiceQuestion();
    const session: { id: string; optionOrders: Record<string, string[]> } = {
      id: 'session-1',
      optionOrders: {},
    };

    const first = getOptionOrder(session, question);
    const second = getOptionOrder(session, question);

    expect(session.optionOrders[question.id]).toBe(first);
    expect(second).toBe(first);
    expect(second).toEqual(createOptionOrder(session.id, question.id, getQuestionOptionIds(question), question.format));
  });

  it('別 session では各 session の seed から有効な順序を作る', () => {
    const question = choiceQuestion();
    const first = getOptionOrder({ id: 'session-1', optionOrders: {} }, question);
    const second = getOptionOrder({ id: 'session-2', optionOrders: {} }, question);
    const optionIds = getQuestionOptionIds(question);

    expect(new Set(first)).toEqual(new Set(optionIds));
    expect(new Set(second)).toEqual(new Set(optionIds));
    expect(first).toHaveLength(optionIds.length);
  });

  it('正誤判定は「正しい」「誤り」の固定順を維持する', () => {
    const question = choiceQuestion('trueFalse');
    const session: { id: string; optionOrders: Record<string, string[]> } = {
      id: 'session-1',
      optionOrders: {},
    };

    expect(getOptionOrder(session, question)).toEqual(['true', 'false']);
  });

  it('sessionManager が生成した optionOrders は session ID と question ID から再現できる', () => {
    const question = choiceQuestion();
    const session = createQuizSession([question], 3, 'normal', createSeededRandom(7));

    expect(session).not.toBeNull();
    if (!session) return;

    expect(session.optionOrders[question.id]).toEqual(
      createOptionOrder(session.id, question.id, getQuestionOptionIds(question), question.format),
    );
  });
});
