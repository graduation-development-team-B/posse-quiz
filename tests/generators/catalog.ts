/**
 * ContentCatalog の fast-check アービトラリ（ジェネレーター）。
 *
 * validator が受理する最小境界を中心に、seed ごとに stable ID と本文を変えた
 * カタログを生成する。固定の雛形を使うことで、PBT の失敗時にも契約違反の
 * 原因を追跡しやすくする。
 */

import * as fc from 'fast-check';
import type {
  ApiResponse,
  BugDiagnosisPayload,
  ChoiceOption,
  ChoicePayload,
  ContentCatalog,
  FillBlankChoicePayload,
  FillBlankFreeTextPayload,
  QuestionItem,
  QuestionPayload,
  TermEntry,
  TrueFalsePayload,
  WeekUnit,
} from '@/types/content';
import { SUPPORTED_WEEK_KEYS } from '@/lib/constants';

const EXPLANATION = 'この解説は教材の要点と理由を説明し、関連する考え方を確認できる文章です。';
const TERM_DEFINITION = '教材で使われる概念を学習のために説明する用語定義です。';
export const SOURCE_HEADINGS: Record<(typeof SUPPORTED_WEEK_KEYS)[number], readonly string[]> = {
  week1: [
    '1. Webページが表示されるまでの仕組み',
    '2. HTMLはページの構造を書く言語',
    '3. よく使うHTMLタグ',
    '4. 属性',
    '5. Tailwind CDN で見た目をつける',
    '6. Git・GitHub・GitHub Pages',
  ],
  week3: [
    '1. デフォルトでは要素は縦に積まれる',
    '2. Flexboxの基本：「親」に `flex` をつける',
    '3. justify-content：横方向の並び方を決める',
    '4. align-items：縦方向の揃え方を決める',
    '5. gap：要素と要素の間隔を決める',
    '6. flex-col：縦方向に並べる',
    '7. flex-wrap：はみ出した時に折り返す',
    '8. スマホ幅で縦並びにする（レスポンシブ対応）',
  ],
  week4: [
    '1. GridとFlexの役割の違い',
    '2. Gridの基本クラス',
    '3. col-span で幅を変える',
    '4. レスポンシブGridの書き方',
    '5. hover: で状態に応じたスタイル',
    '6. odd: / even: で行ごとに色を変える',
    '8. よくある間違いと確認ポイント',
  ],
  week5: [
    '1. なぜレスポンシブデザインが必要か',
    '2. Tailwindはモバイルファースト',
    '3. ブレイクポイント接頭辞',
    '4. よく使うレスポンシブパターン',
    '5. DevToolsでレスポンシブを確認する',
    '7. レスポンシブデザインでよくある間違い',
  ],
  week6: [
    '1. HTML・CSS・JavaScriptの役割分担',
    '2. console.log で確認する習慣',
    '3. 変数：値に名前をつける',
    '4. データ型：値の種類',
    '5. 条件分岐：if / else',
    '6. 関数：処理をまとめて名前をつける',
    '9. よくある間違いと確認ポイント',
  ],
  git_github_level1: [
    '2. ターミナルの基本',
    '4. Git、GitHub 基礎知識',
    '5. Git を使ってみよう',
    '6. GitHub で Pull Request (PR) を使ってコードを反映してみよう',
    '7. 反映されたか確認してみよう',
  ],
};

const COMMON_MISTAKE_HEADINGS: Partial<Record<(typeof SUPPORTED_WEEK_KEYS)[number], string>> = {
  week4: '8. よくある間違いと確認ポイント',
  week5: '7. レスポンシブデザインでよくある間違い',
  week6: '9. よくある間違いと確認ポイント',
};

const CHOICE_OPTIONS: readonly ChoiceOption[] = [
  { id: 'a', text: '正しい答え' },
  { id: 'b', text: '選択肢B' },
  { id: 'c', text: '選択肢C' },
  { id: 'd', text: '選択肢D' },
];

const TRUE_FALSE_OPTIONS: TrueFalsePayload['options'] = [
  { id: 'true', text: '正しい' },
  { id: 'false', text: '誤り' },
];

const cloneChoiceOptions = (): ChoiceOption[] => CHOICE_OPTIONS.map((option) => ({ ...option }));

function choicePayload(): ChoicePayload {
  return {
    kind: 'choice',
    options: cloneChoiceOptions(),
    correctOptionId: 'a',
  };
}

function trueFalsePayload(): TrueFalsePayload {
  return {
    kind: 'trueFalse',
    options: TRUE_FALSE_OPTIONS.map((option) => ({ ...option })) as TrueFalsePayload['options'],
    correctOptionId: 'true',
  };
}

function bugDiagnosisPayload(seed: number, weekIndex: number, groupIndex: number): BugDiagnosisPayload {
  return {
    kind: 'bugDiagnosis',
    code: `const value${seed} = ${weekIndex + groupIndex};\nconsole.log(value${seed});`,
    options: cloneChoiceOptions(),
    correctOptionId: 'a',
  };
}

function fillBlankChoicePayload(seed: number, weekIndex: number, groupIndex: number): FillBlankChoicePayload {
  return {
    kind: 'fillBlank',
    content: `const answer${weekIndex + groupIndex} = __BLANK__; // ${seed}`,
    blankToken: '__BLANK__',
    mode: 'choice',
    options: cloneChoiceOptions(),
    correctOptionId: 'a',
  };
}

function fillBlankFreeTextPayload(seed: number): FillBlankFreeTextPayload {
  return {
    kind: 'fillBlank',
    content: `const answer = __BLANK__; // ${seed}`,
    blankToken: '__BLANK__',
    mode: 'freeText',
    correctText: '正しい答え',
    maxInputLength: 64,
  };
}

function questionPayload(
  questionIndex: number,
  seed: number,
  weekIndex: number,
  groupIndex: number,
): { format: QuestionItem['format']; payload: QuestionPayload } {
  switch (questionIndex) {
    case 0:
      return { format: 'singleChoice', payload: choicePayload() };
    case 1:
      return { format: 'trueFalse', payload: trueFalsePayload() };
    case 2:
      return {
        format: 'bugDiagnosis',
        payload: bugDiagnosisPayload(seed, weekIndex, groupIndex),
      };
    default:
      return {
        format: 'fillBlank',
        payload: groupIndex % 2 === 0
          ? fillBlankChoicePayload(seed, weekIndex, groupIndex)
          : fillBlankFreeTextPayload(seed),
      };
  }
}

function createValidCatalog(seed: number): ContentCatalog {
  const weekUnits: WeekUnit[] = SUPPORTED_WEEK_KEYS.map((key, weekIndex) => ({
    id: `week-unit-${key}`,
    key,
    order: weekIndex + 3,
    title: `Week0${weekIndex + 3}｜教材 ${seed}`,
    published: true,
    deleted: false,
  }));
  const questions: QuestionItem[] = [];
  const terms: TermEntry[] = [];

  for (const [weekIndex, weekKey] of SUPPORTED_WEEK_KEYS.entries()) {
    const weekUnitId = weekUnits[weekIndex]!.id;
    const commonMistakeHeading = COMMON_MISTAKE_HEADINGS[weekKey];

    for (let groupIndex = 0; groupIndex < 5; groupIndex += 1) {
      for (let questionIndex = 0; questionIndex < 4; questionIndex += 1) {
        const { format, payload } = questionPayload(questionIndex, seed, weekIndex, groupIndex);
        const defaultHeading = SOURCE_HEADINGS[weekKey][(groupIndex + questionIndex) % SOURCE_HEADINGS[weekKey].length]!;
        const sectionHeading = questionIndex >= 2 && commonMistakeHeading
          ? commonMistakeHeading
          : defaultHeading;
        questions.push({
          id: `question-${weekKey}-${groupIndex + 1}-${questionIndex + 1}-${seed}`,
          weekUnitId,
          format,
          prompt: `${weekKey} の問題 ${groupIndex + 1}-${questionIndex + 1} に答えてください。`,
          payload,
          explanation: EXPLANATION,
          sourceReference: { weekKey, sectionHeading },
          published: true,
          deleted: false,
        });
      }
    }

    for (let termIndex = 0; termIndex < 8; termIndex += 1) {
      terms.push({
        id: `term-${weekKey}-${termIndex + 1}-${seed}`,
        weekUnitId,
        name: `${weekKey}-term-${termIndex + 1}-${seed}`,
        definition: TERM_DEFINITION,
        usageExamples: [`${weekKey} の教材での使用例です。`],
        sourceReference: {
          weekKey,
          sectionHeading: SOURCE_HEADINGS[weekKey][termIndex % SOURCE_HEADINGS[weekKey].length]!,
        },
        relatedTermNames: [],
        published: true,
        deleted: false,
      });
    }
  }

  return { weekUnits, questions, terms, activities: [] };
}

/** Property 1用の受理可能なContentCatalog。 */
export function validContentCatalogArb(): fc.Arbitrary<ContentCatalog> {
  return fc.integer({ min: 0, max: 1_000_000 }).map(createValidCatalog);
}

/** Property 1用の受理可能なApiResponse。 */
export function validApiResponseArb(): fc.Arbitrary<ApiResponse> {
  return fc.record({
    seed: fc.integer({ min: 0, max: 1_000_000 }),
    contentVersion: fc.integer({ min: 1, max: 1_000_000 }),
    updatedAt: fc.date({
      min: new Date('2020-01-01T00:00:00.000Z'),
      max: new Date('2030-01-01T00:00:00.000Z'),
    }),
  }).map(({ seed, contentVersion, updatedAt }) => ({
    schemaVersion: 1,
    contentVersion: `content-${contentVersion}`,
    updatedAt: updatedAt.toISOString(),
    catalog: createValidCatalog(seed),
  }));
}
