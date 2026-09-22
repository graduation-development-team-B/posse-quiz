import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import type { QuestionFormat, QuestionItem } from '@/types/content';
import { createOptionOrder, getOptionOrder, getQuestionOptionIds } from '@/lib/quiz/optionOrder';
import { createSeededRandom } from '@/lib/quiz/random';
import { createQuizSession } from '@/lib/quiz/sessionManager';
import { assertProperty } from '@/tests/pbt';

const randomizedFormatArb: fc.Arbitrary<Exclude<QuestionFormat, 'trueFalse'>> = fc.constantFrom(
  'singleChoice',
  'bugDiagnosis',
  'fillBlank',
);

function choiceQuestion(format: Exclude<QuestionFormat, 'trueFalse'>): QuestionItem {
  const options = [
    { id: 'a', text: '選択肢A' },
    { id: 'b', text: '選択肢B' },
    { id: 'c', text: '選択肢C' },
    { id: 'd', text: '選択肢D' },
  ];

  const payload: QuestionItem['payload'] = format === 'singleChoice'
    ? { kind: 'choice', options, correctOptionId: 'a' }
    : format === 'bugDiagnosis'
      ? { kind: 'bugDiagnosis', code: 'const value = 1;', options, correctOptionId: 'a' }
      : {
          kind: 'fillBlank',
          content: 'const value = __BLANK__;',
          blankToken: '__BLANK__',
          mode: 'choice',
          options,
          correctOptionId: 'a',
        };

  return {
    id: 'question-option-order-property',
    weekUnitId: 'week-unit-week3',
    format,
    prompt: '選択肢順を検証する問題',
    payload,
    explanation: '選択肢順のSession内安定性を確認するための十分な解説文章です。',
    sourceReference: { weekKey: 'week3', sectionHeading: '基本' },
    published: true,
    deleted: false,
  };
}

/**
 * Feature: curriculum-quiz-app, Property 9: 選択肢順序はSession内で安定する
 *
 * **Validates: Requirements 4.8**
 */
describe('Property 9: 選択肢順序のSession内安定性', () => {
  it('同一Sessionの再表示では保存順を再利用し、別Sessionではseedから再計算できる', () => {
    assertProperty(
      fc.property(randomizedFormatArb, fc.integer(), (format, seed) => {
        const question = choiceQuestion(format);
        const firstSession = createQuizSession(
          [question],
          3,
          'normal',
          createSeededRandom(seed),
        );
        const secondSession = createQuizSession(
          [question],
          3,
          'normal',
          createSeededRandom(seed + 1),
        );

        expect(firstSession).not.toBeNull();
        expect(secondSession).not.toBeNull();
        if (!firstSession || !secondSession) return;

        const firstQuestion = firstSession.questions[0]!;
        const secondQuestion = secondSession.questions[0]!;
        const firstOrder = firstSession.optionOrders[firstQuestion.id]!;
        const firstRedisplay = getOptionOrder(firstSession, firstQuestion);
        const secondInitialOrder = getOptionOrder(secondSession, secondQuestion);
        const secondRecomputedOrder = createOptionOrder(
          secondSession.id,
          secondQuestion.id,
          getQuestionOptionIds(secondQuestion),
          secondQuestion.format,
        );

        expect(firstRedisplay).toBe(firstOrder);
        expect(firstRedisplay).toEqual(firstOrder);
        expect(firstRedisplay).toEqual(
          createOptionOrder(
            firstSession.id,
            firstQuestion.id,
            getQuestionOptionIds(firstQuestion),
            firstQuestion.format,
          ),
        );
        expect(secondInitialOrder).toEqual(secondRecomputedOrder);
        expect(new Set(secondInitialOrder)).toEqual(new Set(getQuestionOptionIds(secondQuestion)));
      }),
    );
  });

  it('正誤判定の選択肢はSessionが変わっても「正しい」「誤り」の固定順を保つ', () => {
    assertProperty(
      fc.property(fc.integer(), (seed) => {
        const question: QuestionItem = {
          ...choiceQuestion('singleChoice'),
          id: 'true-false-option-order-property',
          format: 'trueFalse',
          payload: {
            kind: 'trueFalse',
            options: [
              { id: 'true', text: '正しい' },
              { id: 'false', text: '誤り' },
            ],
            correctOptionId: 'true',
          },
        };
        const session = createQuizSession([question], 3, 'normal', createSeededRandom(seed));

        expect(session).not.toBeNull();
        if (!session) return;

        expect(getOptionOrder(session, session.questions[0]!)).toEqual(['true', 'false']);
      }),
    );
  });
});
