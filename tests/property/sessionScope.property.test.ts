import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { SUPPORTED_WEEK_KEYS } from '@/lib/constants';
import { createSeededRandom } from '@/lib/quiz/random';
import { createSessionForScope } from '@/lib/quiz/sessionManager';
import { selectQuestionPool } from '@/lib/quiz/scope';
import type { ContentCatalog, QuestionFormat, QuestionItem, WeekUnit } from '@/types/content';
import type { SessionScope } from '@/types/session';
import { assertProperty } from '@/tests/pbt';

/** 各週の問題の公開状態だけを持つ計画。階層は PH → Week の2段なのでTopicは存在しない。 */
type WeekPlan = {
  activeQuestionIndices: number[];
};

type SessionScenario = {
  catalog: ContentCatalog;
  scope: SessionScope;
  selectedWeekKeys: string[];
  activeQuestionIds: Set<string>;
};

const questionCountPerWeek = 12;
const supportedWeekIndicesArb = fc.uniqueArray(fc.integer({ min: 0, max: SUPPORTED_WEEK_KEYS.length - 1 }), {
  minLength: 2,
  maxLength: SUPPORTED_WEEK_KEYS.length,
});

const weekPlanArb: fc.Arbitrary<WeekPlan> = fc.record({
  activeQuestionIndices: fc.uniqueArray(fc.integer({ min: 0, max: questionCountPerWeek - 1 }), {
    minLength: 1,
    maxLength: questionCountPerWeek,
  }),
});

function createQuestion(weekIndex: number, questionIndex: number, active: boolean): QuestionItem {
  const id = `question-${weekIndex}-${questionIndex}`;
  const format: QuestionFormat = (['singleChoice', 'trueFalse', 'bugDiagnosis', 'fillBlank'] as const)[
    questionIndex % 4
  ]!;
  const choiceOptions = [
    { id: 'a', text: `${id}-A` },
    { id: 'b', text: `${id}-B` },
    { id: 'c', text: `${id}-C` },
    { id: 'd', text: `${id}-D` },
  ];

  const payload: QuestionItem['payload'] = format === 'singleChoice'
    ? { kind: 'choice', options: choiceOptions, correctOptionId: 'a' }
    : format === 'trueFalse'
      ? {
          kind: 'trueFalse',
          options: [
            { id: 'true', text: '正しい' },
            { id: 'false', text: '誤り' },
          ],
          correctOptionId: 'true',
        }
      : format === 'bugDiagnosis'
        ? { kind: 'bugDiagnosis', code: `const value = ${questionIndex};`, options: choiceOptions, correctOptionId: 'a' }
        : {
            kind: 'fillBlank',
            content: `const value = __BLANK__; // ${id}`,
            blankToken: '__BLANK__',
            mode: 'choice',
            options: choiceOptions,
            correctOptionId: 'a',
          };

  return {
    id,
    weekUnitId: `week-unit-${weekIndex}`,
    format,
    prompt: `問題 ${id}`,
    payload,
    explanation: 'この問題は出題範囲とセッションの一意性を確認するための解説です。',
    sourceReference: { weekKey: SUPPORTED_WEEK_KEYS[weekIndex]!, sectionHeading: 'テスト' },
    published: active,
    deleted: false,
  };
}

function createScenario(
  weekPlans: WeekPlan[],
  activeWeekIndices: number[],
  selectedWeekIndices: number[],
): SessionScenario {
  const weekUnits: WeekUnit[] = SUPPORTED_WEEK_KEYS.map((weekKey, weekIndex) => ({
    id: `week-unit-${weekIndex}`,
    key: weekKey,
    order: weekIndex + 1,
    title: weekKey,
    published: activeWeekIndices.includes(weekIndex),
    deleted: false,
  }));
  const questions: QuestionItem[] = [];
  const activeQuestionIds = new Set<string>();

  for (let weekIndex = 0; weekIndex < SUPPORTED_WEEK_KEYS.length; weekIndex += 1) {
    const plan = weekPlans[weekIndex]!;
    for (let questionIndex = 0; questionIndex < questionCountPerWeek; questionIndex += 1) {
      const question = createQuestion(
        weekIndex,
        questionIndex,
        plan.activeQuestionIndices.includes(questionIndex),
      );
      questions.push(question);
      if (question.published && !question.deleted) activeQuestionIds.add(question.id);
    }
  }

  return {
    catalog: { weekUnits, questions, terms: [], activities: [] },
    scope: {
      weekKeys: selectedWeekIndices.map((weekIndex) => SUPPORTED_WEEK_KEYS[weekIndex]!),
    },
    selectedWeekKeys: selectedWeekIndices.map((weekIndex) => SUPPORTED_WEEK_KEYS[weekIndex]!),
    activeQuestionIds,
  };
}

function sessionScenarioArb(minSelectedWeeks: number): fc.Arbitrary<SessionScenario> {
  return supportedWeekIndicesArb.chain((activeWeekIndices) =>
    fc.array(weekPlanArb, { minLength: SUPPORTED_WEEK_KEYS.length, maxLength: SUPPORTED_WEEK_KEYS.length }).chain((weekPlans) =>
      fc.subarray(activeWeekIndices, {
        minLength: minSelectedWeeks,
        maxLength: activeWeekIndices.length,
      }).map((selectedWeekIndices) =>
        createScenario(weekPlans, activeWeekIndices, selectedWeekIndices),
      ),
    ),
  );
}

function expectedQuestionPool(scenario: SessionScenario): QuestionItem[] {
  const selectedWeeks = new Set(scenario.selectedWeekKeys);

  return scenario.catalog.questions.filter((question) =>
    question.published &&
    !question.deleted &&
    selectedWeeks.has(question.sourceReference.weekKey),
  );
}

function assertSessionWithinScope(scenario: SessionScenario): void {
  const expectedPool = expectedQuestionPool(scenario);
  const session = createSessionForScope(
    scenario.catalog,
    scenario.scope,
    5,
    createSeededRandom(42),
  );

  expect(session).not.toBeNull();
  if (!session) return;

  const expectedIds = new Set(expectedPool.map((question) => question.id));
  const sessionIds = session.questionIds;
  expect(new Set(sessionIds).size).toBe(sessionIds.length);
  expect(session.questions.map((question) => question.id)).toEqual(sessionIds);
  expect(session.questions.every((question) => expectedIds.has(question.id))).toBe(true);
  expect(session.questions.every((question) => scenario.activeQuestionIds.has(question.id))).toBe(true);
  expect(session.questions.length).toBe(Math.min(5, expectedPool.length));

  if (session.questions.length >= 5 && expectedPool.some((question) => question.format !== 'singleChoice')) {
    expect(session.questions.some((question) => question.format !== 'singleChoice')).toBe(true);
  }
}

describe('Property 6: 出題範囲とセッションの一意性', () => {
  it('選択したWeekだけを対象にし、active問題を重複なくセッション化する', () => {
    // Feature: curriculum-quiz-app, Property 6: 出題範囲は選択条件だけを含み問題を重複させない
    // **Validates: Requirements 2.3、2.4、3.4、4.10**
    assertProperty(fc.property(sessionScenarioArb(1), assertSessionWithinScope));
  });

  it('2〜5教材横断の選択は指定教材だけを対象にし、問題IDを重複させない', () => {
    // Feature: curriculum-quiz-app, Property 6: 出題範囲は選択条件だけを含み問題を重複させない
    // **Validates: Requirements 2.5、3.4、4.10**
    assertProperty(
      fc.property(sessionScenarioArb(2), (scenario) => {
        expect(scenario.scope.weekKeys.length).toBeGreaterThanOrEqual(2);
        expect(scenario.scope.weekKeys.length).toBeLessThanOrEqual(SUPPORTED_WEEK_KEYS.length);
        assertSessionWithinScope(scenario);
      }),
    );
  });

  it('selectQuestionPoolも選択Week外・非activeの問題を返さない', () => {
    assertProperty(
      fc.property(sessionScenarioArb(1), (scenario) => {
        const pool = selectQuestionPool(scenario.catalog, scenario.scope);
        const expectedIds = new Set(expectedQuestionPool(scenario).map((question) => question.id));

        expect(new Set(pool.map((question) => question.id)).size).toBe(pool.length);
        expect(pool.every((question) => expectedIds.has(question.id))).toBe(true);
        expect(pool.every((question) => question.published && !question.deleted)).toBe(true);
      }),
    );
  });
});
