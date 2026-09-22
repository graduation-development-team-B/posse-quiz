import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { validateApiResponse } from '@/lib/content/validateApiResponse';
import type {
  ApiResponse,
  ChoiceOption,
  ChoicePayload,
  FillBlankChoicePayload,
  QuestionItem,
  TrueFalsePayload,
} from '@/types/content';
import { assertProperty } from '../pbt';

const OPTION_IDS = ['a', 'b', 'c', 'd'] as const;
const BLANK_TOKEN = '__BLANK__';

function readFixture(): ApiResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
}

function cloneFixture(): ApiResponse {
  return JSON.parse(JSON.stringify(readFixture())) as ApiResponse;
}

const nonBlankTextArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((text) => text.trim().length > 0);

const codeLineArb = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter((line) => line.trim().length > 0 && !line.includes('\n'));

const optionTextsArb = fc.uniqueArray(nonBlankTextArb, {
  minLength: OPTION_IDS.length,
  maxLength: OPTION_IDS.length,
});

function optionsFromTexts(texts: string[]): ChoiceOption[] {
  return OPTION_IDS.map((id, index) => ({ id, text: texts[index]! }));
}

const choicePayloadArb: fc.Arbitrary<ChoicePayload> = fc
  .tuple(optionTextsArb, fc.integer({ min: 0, max: OPTION_IDS.length - 1 }))
  .map(([texts, correctIndex]) => {
    const options = optionsFromTexts(texts);
    return {
      kind: 'choice' as const,
      options,
      correctOptionId: options[correctIndex]!.id,
    };
  });

const trueFalsePayloadArb: fc.Arbitrary<TrueFalsePayload> = fc
  .constantFrom('true' as const, 'false' as const)
  .map((correctOptionId) => ({
    kind: 'trueFalse' as const,
    options: [
      { id: 'true' as const, text: '正しい' as const },
      { id: 'false' as const, text: '誤り' as const },
    ],
    correctOptionId,
  }));

const bugDiagnosisPayloadArb = fc
  .tuple(
    fc.array(codeLineArb, { minLength: 1, maxLength: 20 }),
    optionTextsArb,
    fc.integer({ min: 0, max: OPTION_IDS.length - 1 }),
  )
  .map(([lines, texts, correctIndex]) => {
    const options = optionsFromTexts(texts);
    return {
      kind: 'bugDiagnosis' as const,
      code: lines.join('\n'),
      options,
      correctOptionId: options[correctIndex]!.id,
    };
  });

const fillBlankChoicePayloadArb: fc.Arbitrary<FillBlankChoicePayload> = fc
  .tuple(optionTextsArb, fc.integer({ min: 0, max: OPTION_IDS.length - 1 }))
  .map(([texts, correctIndex]) => {
    const options = optionsFromTexts(texts);
    return {
      kind: 'fillBlank' as const,
      content: `const answer = ${BLANK_TOKEN};`,
      blankToken: BLANK_TOKEN,
      mode: 'choice' as const,
      options,
      correctOptionId: options[correctIndex]!.id,
    };
  });

const validPayloadsArb = fc.record({
  singleChoice: choicePayloadArb,
  trueFalse: trueFalsePayloadArb,
  bugDiagnosis: bugDiagnosisPayloadArb,
  fillBlank: fillBlankChoicePayloadArb,
});

function invalidChoicePayloadArb(): fc.Arbitrary<unknown> {
  return choicePayloadArb.chain((payload) =>
    fc.oneof(
      fc.constant({ ...payload, options: payload.options.slice(0, 3) }),
      fc.constant({
        ...payload,
        options: [
          payload.options[0]!,
          { ...payload.options[1]!, text: payload.options[0]!.text },
          payload.options[2]!,
          payload.options[3]!,
        ],
      }),
      fc.constant({ ...payload, correctOptionId: 'missing-correct-option' }),
    ),
  );
}

function invalidTrueFalsePayloadArb(): fc.Arbitrary<unknown> {
  return trueFalsePayloadArb.chain((payload) =>
    fc.oneof(
      fc.constant({ ...payload, options: [payload.options[1], payload.options[0]] }),
      fc.constant({ ...payload, options: [payload.options[0]] }),
      fc.constant({ ...payload, correctOptionId: 'missing-correct-option' }),
    ),
  );
}

function invalidBugDiagnosisPayloadArb(): fc.Arbitrary<unknown> {
  return bugDiagnosisPayloadArb.chain((payload) =>
    fc.oneof(
      fc.constant({ ...payload, code: Array.from({ length: 21 }, () => 'const x = 1;').join('\n') }),
      fc.constant({ ...payload, options: payload.options.slice(0, 3) }),
      fc.constant({
        ...payload,
        options: [
          payload.options[0]!,
          { ...payload.options[1]!, text: payload.options[0]!.text },
          payload.options[2]!,
          payload.options[3]!,
        ],
      }),
      fc.constant({ ...payload, correctOptionId: 'missing-correct-option' }),
    ),
  );
}

function invalidFillBlankPayloadArb(): fc.Arbitrary<unknown> {
  return fillBlankChoicePayloadArb.chain((payload) =>
    fc.oneof(
      fc.constant({ ...payload, content: 'const answer = 1;' }),
      fc.constant({ ...payload, content: `const answer = ${BLANK_TOKEN} + ${BLANK_TOKEN};` }),
      fc.constant({ ...payload, options: payload.options.slice(0, 3) }),
      fc.constant({
        ...payload,
        options: [
          payload.options[0]!,
          { ...payload.options[1]!, text: payload.options[0]!.text },
          payload.options[2]!,
          payload.options[3]!,
        ],
      }),
      fc.constant({ ...payload, correctOptionId: 'missing-correct-option' }),
    ),
  );
}

const invalidPayloadsArb = fc.record({
  singleChoice: invalidChoicePayloadArb(),
  trueFalse: invalidTrueFalsePayloadArb(),
  bugDiagnosis: invalidBugDiagnosisPayloadArb(),
  fillBlank: invalidFillBlankPayloadArb(),
});

function replacePayload(
  response: ApiResponse,
  format: QuestionItem['format'],
  payload: unknown,
): void {
  const question = response.catalog.questions.find((candidate) => {
    if (candidate.format !== format) return false;
    return format !== 'fillBlank' || (candidate.payload.kind === 'fillBlank' && candidate.payload.mode === 'choice');
  });

  if (!question) {
    throw new Error(`fixtureに${format}形式の対象問題がありません`);
  }

  question.payload = payload as QuestionItem['payload'];
}

function getQuestion(response: ApiResponse, format: QuestionItem['format']): QuestionItem {
  const question = response.catalog.questions.find((candidate) => {
    if (candidate.format !== format) return false;
    return format !== 'fillBlank' || (candidate.payload.kind === 'fillBlank' && candidate.payload.mode === 'choice');
  });

  if (!question) {
    throw new Error(`fixtureに${format}形式の対象問題がありません`);
  }

  return question;
}

function assertChoicePayload(payload: { options: ChoiceOption[]; correctOptionId: string }): void {
  expect(payload.options).toHaveLength(4);
  expect(new Set(payload.options.map((option) => option.text)).size).toBe(4);
  expect(new Set(payload.options.map((option) => option.id)).size).toBe(4);
  expect(payload.options.filter((option) => option.id === payload.correctOptionId)).toHaveLength(1);
}

describe('Property 8: Question_Format payload の正解一意性', () => {
  it('受理された4形式のpayloadは件数・順序・重複なし・正解1件を満たす', () => {
    // Feature: curriculum-quiz-app, Property 8: 各Question_Formatのpayloadは一意な正解を持つ
    // **Validates: Requirements 4.2〜4.5、4.11**
    assertProperty(
      fc.property(validPayloadsArb, (payloads) => {
        const response = cloneFixture();
        replacePayload(response, 'singleChoice', payloads.singleChoice);
        replacePayload(response, 'trueFalse', payloads.trueFalse);
        replacePayload(response, 'bugDiagnosis', payloads.bugDiagnosis);
        replacePayload(response, 'fillBlank', payloads.fillBlank);

        const result = validateApiResponse(response);
        expect(result.ok).toBe(true);
        if (!result.ok) return;

        const choice = getQuestion(result.response, 'singleChoice').payload as ChoicePayload;
        assertChoicePayload(choice);

        const trueFalse = getQuestion(result.response, 'trueFalse').payload as TrueFalsePayload;
        expect(trueFalse.options).toEqual([
          { id: 'true', text: '正しい' },
          { id: 'false', text: '誤り' },
        ]);
        expect(trueFalse.options.filter((option) => option.id === trueFalse.correctOptionId)).toHaveLength(1);

        const bug = getQuestion(result.response, 'bugDiagnosis').payload as Extract<
          QuestionItem['payload'],
          { kind: 'bugDiagnosis' }
        >;
        assertChoicePayload(bug);
        expect(bug.code.split('\n').length).toBeGreaterThanOrEqual(1);
        expect(bug.code.split('\n').length).toBeLessThanOrEqual(20);

        const fillBlank = getQuestion(result.response, 'fillBlank').payload as FillBlankChoicePayload;
        assertChoicePayload(fillBlank);
        expect(fillBlank.content.split(fillBlank.blankToken)).toHaveLength(2);
      }),
    );
  });

  it('各形式の不正payloadは受理されず、カタログ全体を拒否する', () => {
    // Feature: curriculum-quiz-app, Property 8: 各Question_Formatのpayloadは一意な正解を持つ
    // **Validates: Requirements 4.2〜4.5、4.11**
    assertProperty(
      fc.property(invalidPayloadsArb, (payloads) => {
        for (const [format, payload] of [
          ['singleChoice', payloads.singleChoice],
          ['trueFalse', payloads.trueFalse],
          ['bugDiagnosis', payloads.bugDiagnosis],
          ['fillBlank', payloads.fillBlank],
        ] as const) {
          const response = cloneFixture();
          replacePayload(response, format, payload);

          const result = validateApiResponse(response);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.issues.length).toBeGreaterThan(0);
          }
        }
      }),
    );
  });
});
