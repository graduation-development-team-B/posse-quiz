/** Content_Catalog / API_Response の fast-check ジェネレーター。 */

import * as fc from 'fast-check';
import type {
  ApiResponse,
  ChoiceOption,
  ContentCatalog,
  QuestionItem,
  QuestionPayload,
  TermEntry,
  WeekUnit,
} from '@/types/content';
import { SUPPORTED_WEEK_KEYS } from '@/lib/constants';

const EXPLANATION = 'この説明は教材の要点と理由を説明し、関連する考え方も確認できる文章です。';
const SECTIONS = ['基本', 'よくある間違い', '応用'];

/** 設計書の契約を満たす、5教材・各20問・各8用語のカタログを生成する。 */
export function validContentCatalogArb(): fc.Arbitrary<ContentCatalog> {
  return fc.integer({ min: 0, max: 1_000_000 }).map((seed) => createValidCatalog(seed));
}

export function validApiResponseArb(): fc.Arbitrary<ApiResponse> {
  return fc.record({
    contentVersion: fc.integer({ min: 1, max: 1_000_000 }).map((value) => `content-${value}`),
    updatedAt: fc.date({ min: new Date('2020-01-01T00:00:00.000Z'), max: new Date('2030-01-01T00:00:00.000Z') }).map((value) => value.toISOString()),
  }).map(({ contentVersion, updatedAt }) => ({
    schemaVersion: 1,
    contentVersion,
    updatedAt,
    catalog: createValidCatalog(contentVersion.length + updatedAt.length),
  }));
}

export const supportedWeekKeyArb = fc.constantFrom(...SUPPORTED_WEEK_KEYS);
export const questionFormatArb = fc.constantFrom('singleChoice', 'trueFalse', 'bugDiagnosis', 'fillBlank', 'interactive' as const);
export const questionCountArb = fc.oneof(fc.integer({ min: -2, max: 20 }), fc.constant(undefined));

function createValidCatalog(seed: number): ContentCatalog {
  const weekUnits: WeekUnit[] = SUPPORTED_WEEK_KEYS.map((weekKey, weekIndex) => ({
    id: `week-unit-${weekKey}`,
    key: weekKey,
    order: weekIndex + 3,
    title: `Week${weekIndex + 3}｜教材`,
    published: true,
    deleted: false,
  }));
  const questions: QuestionItem[] = [];
  const terms: TermEntry[] = [];

  for (const [weekIndex, weekKey] of SUPPORTED_WEEK_KEYS.entries()) {
    const weekUnitId = `week-unit-${weekKey}`;
    for (let groupIndex = 0; groupIndex < 5; groupIndex += 1) {
      for (let questionIndex = 0; questionIndex < 4; questionIndex += 1) {
        const questionId = `question-${weekKey}-${groupIndex + 1}-${questionIndex + 1}-${seed}`;
        questions.push({
          id: questionId,
          weekUnitId,
          format: formatFor(questionIndex),
          prompt: `${weekKey} の問題 ${groupIndex + 1}-${questionIndex + 1} に答えてください。`,
          payload: payloadFor(questionIndex, weekIndex, groupIndex),
          explanation: EXPLANATION,
          sourceReference: {
            weekKey,
            sectionHeading: SECTIONS[(groupIndex + questionIndex) % SECTIONS.length],
          },
          published: true,
          deleted: false,
        });
      }
    }

    for (let termIndex = 0; termIndex < 8; termIndex += 1) {
      terms.push({
        id: `term-${weekKey}-${termIndex + 1}`,
        weekUnitId,
        name: `${weekKey}-term-${termIndex + 1}`,
        definition: '教材で使われる概念を学習のために説明する用語定義です。',
        usageExamples: [`${weekKey} の教材での使用例です。`],
        sourceReference: { weekKey, sectionHeading: '基本' },
        relatedTermNames: [],
        published: true,
        deleted: false,
      });
    }
  }

  return { weekUnits, questions, terms, activities: [] };
}

function formatFor(index: number): QuestionItem['format'] {
  return ['singleChoice', 'trueFalse', 'bugDiagnosis', 'fillBlank'][index] as QuestionItem['format'];
}

function payloadFor(index: number, weekIndex: number, groupIndex: number): QuestionPayload {
  const options: ChoiceOption[] = [
    { id: 'a', text: '正しい答え' },
    { id: 'b', text: '選択肢B' },
    { id: 'c', text: '選択肢C' },
    { id: 'd', text: '選択肢D' },
  ];
  const correctOptionId = index === 1 ? 'true' : 'a';
  if (index === 0) return { kind: 'choice', options, correctOptionId, incorrectReasons: {} };
  if (index === 1) {
    return {
      kind: 'trueFalse',
      options: [{ id: 'true', text: '正しい' }, { id: 'false', text: '誤り' }],
      correctOptionId: 'true',
      incorrectReasons: {},
    };
  }
  if (index === 2) {
    return { kind: 'bugDiagnosis', code: `const value = ${weekIndex + groupIndex};`, options, correctOptionId, incorrectReasons: {} };
  }
  return {
    kind: 'fillBlank',
    content: `const answer = __BLANK__${weekIndex + groupIndex};`,
    blankToken: '__BLANK__',
    mode: 'choice',
    options,
    correctOptionId,
    incorrectReasons: {},
  };
}
