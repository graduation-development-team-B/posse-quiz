import { describe, expect, it } from 'vitest';
import type { QuestionItem } from '@/types/content';
import { judgeAnswer } from '@/lib/quiz/answerJudge';
import { normalizeFreeText } from '@/lib/quiz/normalizeFreeText';

const options = [
  { id: 'a', text: '選択肢A' },
  { id: 'b', text: '選択肢B' },
  { id: 'c', text: '選択肢C' },
  { id: 'd', text: '選択肢D' },
];

function question(
  format: QuestionItem['format'],
  payload: QuestionItem['payload'],
): QuestionItem {
  return {
    id: `question-${format}`,
    weekUnitId: 'week-unit-week3',
    format,
    prompt: '問題文',
    payload,
    explanation: 'この問題の解説は判定結果の理由を確認できる十分な文章です。',
    sourceReference: { weekKey: 'week3', sectionHeading: '基本' },
    published: true,
    deleted: false,
  };
}

describe('normalizeFreeText', () => {
  it('removes only the supported boundary whitespace', () => {
    expect(normalizeFreeText(' \u3000\t\r\n答え\n\r\t\u3000 ')).toBe('答え');
    expect(normalizeFreeText('答\u00a0え')).toBe('答\u00a0え');
    expect(normalizeFreeText('答  え')).toBe('答  え');
  });
});

describe('judgeAnswer', () => {
  it.each([
    ['singleChoice', { kind: 'choice', options, correctOptionId: 'b', incorrectReasons: { a: 'Aは誤りです。' } }],
    ['bugDiagnosis', { kind: 'bugDiagnosis', code: 'const value = 1;', options, correctOptionId: 'b', incorrectReasons: { a: 'この箇所が誤りです。' } }],
  ] as const)('judges %s choices', (format, payload) => {
    const item = question(format, payload);
    expect(judgeAnswer(item, { optionId: 'b' })).toEqual({
      isCorrect: true,
      correctText: '選択肢B',
      canSubmit: true,
    });
    expect(judgeAnswer(item, { optionId: 'a' })).toEqual({
      isCorrect: false,
      correctText: '選択肢B',
      canSubmit: true,
      incorrectReason: format === 'singleChoice' ? 'Aは誤りです。' : 'この箇所が誤りです。',
    });
  });

  it('judges true/false using its fixed options', () => {
    const item = question('trueFalse', {
      kind: 'trueFalse',
      options: [{ id: 'true', text: '正しい' }, { id: 'false', text: '誤り' }],
      correctOptionId: 'false',
      incorrectReasons: { true: 'この説明は誤りです。' },
    });

    expect(judgeAnswer(item, { optionId: 'false' })).toEqual({
      isCorrect: true,
      correctText: '誤り',
      canSubmit: true,
    });
    expect(judgeAnswer(item, { optionId: 'true' })).toEqual({
      isCorrect: false,
      correctText: '誤り',
      canSubmit: true,
      incorrectReason: 'この説明は誤りです。',
    });
  });

  it('judges candidate-selection fill-in questions', () => {
    const item = question('fillBlank', {
      kind: 'fillBlank',
      content: 'const value = __BLANK__;',
      blankToken: '__BLANK__',
      mode: 'choice',
      options,
      correctOptionId: 'c',
      incorrectReasons: { a: 'この値ではありません。' },
    });

    expect(judgeAnswer(item, { optionId: 'c' }).isCorrect).toBe(true);
    expect(judgeAnswer(item, { optionId: 'a' }).incorrectReason).toBe('この値ではありません。');
  });

  it('does not expose a reason when the selected wrong option has none', () => {
    const item = question('singleChoice', {
      kind: 'choice',
      options,
      correctOptionId: 'a',
    });

    expect(judgeAnswer(item, { optionId: 'b' })).toEqual({
      isCorrect: false,
      correctText: '選択肢A',
      canSubmit: true,
    });
  });

  it('normalizes free text and keeps letter case significant', () => {
    const item = question('fillBlank', {
      kind: 'fillBlank',
      content: 'const result = __BLANK__;',
      blankToken: '__BLANK__',
      mode: 'freeText',
      correctText: 'toString',
      maxInputLength: 64,
    });

    expect(judgeAnswer(item, { freeText: ' \u3000\ttoString\n' })).toEqual({
      isCorrect: true,
      correctText: 'toString',
      canSubmit: true,
    });
    expect(judgeAnswer(item, { freeText: 'tostring' })).toEqual({
      isCorrect: false,
      correctText: 'toString',
      canSubmit: true,
    });
    expect(judgeAnswer(item, { freeText: 'toString!' }).isCorrect).toBe(false);
  });

  it('rejects empty, whitespace-only, and over-limit free text as unsubmitable', () => {
    const item = question('fillBlank', {
      kind: 'fillBlank',
      content: '__BLANK__',
      blankToken: '__BLANK__',
      mode: 'freeText',
      correctText: '答え',
      maxInputLength: 64,
    });

    for (const freeText of ['', ' \u3000\t\r\n', 'a'.repeat(65)]) {
      expect(judgeAnswer(item, { freeText })).toEqual({
        isCorrect: false,
        correctText: '答え',
        canSubmit: false,
      });
    }
    expect(judgeAnswer(item, {})).toEqual({
      isCorrect: false,
      correctText: '答え',
      canSubmit: false,
    });
  });

  it('rejects a choice answer when no option is selected', () => {
    const item = question('singleChoice', {
      kind: 'choice',
      options,
      correctOptionId: 'a',
    });

    expect(judgeAnswer(item, {})).toEqual({
      isCorrect: false,
      correctText: '選択肢A',
      canSubmit: false,
    });
  });

  it('rejects an answer for an option that is not displayed', () => {
    const item = question('singleChoice', {
      kind: 'choice',
      options,
      correctOptionId: 'a',
    });

    expect(judgeAnswer(item, { optionId: 'missing-option' })).toEqual({
      isCorrect: false,
      correctText: '選択肢A',
      canSubmit: false,
    });
  });
});
