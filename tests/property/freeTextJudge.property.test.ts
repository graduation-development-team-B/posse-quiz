import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { FREE_TEXT_MAX_LENGTH } from '@/lib/constants';
import { judgeAnswer } from '@/lib/quiz/answerJudge';
import { normalizeFreeText } from '@/lib/quiz/normalizeFreeText';
import type { FillBlankFreeTextPayload, QuestionItem } from '@/types/content';
import { assertProperty } from '../pbt';

const TRIMMABLE_EDGE_CHARS = [' ', '\u3000', '\t', '\n', '\r'] as const;
const UNICODE_TEXT_CHARS = [
  '漢',
  '字',
  'あ',
  'い',
  'é',
  'ß',
  'Ω',
  '🙂',
  'A',
  'b',
  '1',
  '-',
  '_',
] as const;
const NON_WHITESPACE_DIFFERENCES = ['!', '?', '.', 'X', '漢', '🙂'] as const;

const edgeWhitespaceArb = fc.array(fc.constantFrom(...TRIMMABLE_EDGE_CHARS), { maxLength: 8 }).map((chars) => chars.join(''));

const answerTextArb = fc
  .array(fc.constantFrom(...UNICODE_TEXT_CHARS), { minLength: 1, maxLength: 24 })
  .map((chars) => chars.join(''));

const casePairArb = fc.constantFrom(
  ['A', 'a'] as const,
  ['B', 'b'] as const,
  ['Z', 'z'] as const,
  ['Ä', 'ä'] as const,
  ['Ω', 'ω'] as const,
);

function freeTextQuestion(correctText: string): QuestionItem {
  const payload: FillBlankFreeTextPayload = {
    kind: 'fillBlank',
    content: 'const answer = __BLANK__;',
    blankToken: '__BLANK__',
    mode: 'freeText',
    correctText,
    maxInputLength: FREE_TEXT_MAX_LENGTH,
  };

  return {
    id: 'property-free-text-question',
    weekUnitId: 'week-unit-week6',
    format: 'fillBlank',
    prompt: '空欄に入る文字列を入力してください。',
    payload,
    explanation: '自由入力の判定では、許可された前後空白だけを除去して完全一致を確認します。',
    sourceReference: { weekKey: 'week6', sectionHeading: '4. 関数' },
    published: true,
    deleted: false,
  };
}

describe('Property 10: 自由入力判定のtrim後大文字小文字区別完全一致', () => {
  it('半角空白・全角空白・タブ・改行だけを前後から除去して一致させる', () => {
    // Feature: curriculum-quiz-app, Property 10: 自由入力判定はtrim後の大文字小文字区別完全一致である
    // **Validates: Requirements 4.6、4.9、4.12**
    assertProperty(
      fc.property(answerTextArb, edgeWhitespaceArb, edgeWhitespaceArb, (correctText, leading, trailing) => {
        const normalizedInput = normalizeFreeText(`${leading}${correctText}${trailing}`);

        expect(normalizedInput).toBe(correctText);
        expect(judgeAnswer(freeTextQuestion(correctText), { freeText: `${leading}${correctText}${trailing}` }).isCorrect).toBe(true);
      }),
    );
  });

  it('英字またはUnicode文字の大小文字変更を正解にしない', () => {
    // Feature: curriculum-quiz-app, Property 10: 自由入力判定はtrim後の大文字小文字区別完全一致である
    // **Validates: Requirements 4.6、4.9**
    assertProperty(
      fc.property(casePairArb, answerTextArb, edgeWhitespaceArb, (pair, suffix, edgeWhitespace) => {
        const correctText = `${pair[0]}${suffix}`;
        const changedCaseText = `${pair[1]}${suffix}`;
        const input = `${edgeWhitespace}${changedCaseText}${edgeWhitespace}`;

        expect(normalizeFreeText(input)).toBe(changedCaseText);
        expect(judgeAnswer(freeTextQuestion(correctText), { freeText: input }).isCorrect).toBe(false);
      }),
    );
  });

  it('空白以外の差分を正解にしない', () => {
    // Feature: curriculum-quiz-app, Property 10: 自由入力判定はtrim後の大文字小文字区別完全一致である
    // **Validates: Requirements 4.6**
    assertProperty(
      fc.property(answerTextArb, edgeWhitespaceArb, fc.constantFrom(...NON_WHITESPACE_DIFFERENCES), (correctText, edgeWhitespace, difference) => {
        const changedText = `${correctText}${difference}`;
        const input = `${edgeWhitespace}${changedText}${edgeWhitespace}`;

        expect(normalizeFreeText(input)).toBe(changedText);
        expect(judgeAnswer(freeTextQuestion(correctText), { freeText: input }).isCorrect).toBe(false);
      }),
    );
  });

  it('64文字を超える入力は、trim後に正解文字列と一致しても確定不可にする', () => {
    // Feature: curriculum-quiz-app, Property 10: 自由入力判定はtrim後の大文字小文字区別完全一致である
    // **Validates: Requirements 4.9、4.12**
    assertProperty(
      fc.property(answerTextArb, (correctText) => {
        const leadingWhitespace = '\u3000'.repeat(FREE_TEXT_MAX_LENGTH + 1);
        const input = `${leadingWhitespace}${correctText}`;

        expect(input.length).toBeGreaterThan(FREE_TEXT_MAX_LENGTH);
        expect(normalizeFreeText(input)).toBe(correctText);
        expect(judgeAnswer(freeTextQuestion(correctText), { freeText: input }).isCorrect).toBe(false);
      }),
    );
  });
});
