import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { validateApiResponse } from '@/lib/content/validateApiResponse';
import {
  ALLOWED_QUESTION_FORMATS,
  BUG_DIAGNOSIS_MAX_LINES,
  CHOICE_OPTIONS_COUNT,
  EXPLANATION_MAX_LENGTH,
  EXPLANATION_MIN_LENGTH,
  MAX_QUESTIONS_PER_WEEK,
  MIN_COMMON_MISTAKE_QUESTIONS_PER_WEEK,
  MIN_QUESTIONS_PER_WEEK,
  MIN_TERMS_PER_WEEK,
  MIN_TOTAL_TERMS,
  SUPPORTED_WEEK_KEYS,
  TERM_DEFINITION_MAX_LENGTH,
  TERM_DEFINITION_MIN_LENGTH,
  TERM_NAME_MAX_LENGTH,
  TERM_NAME_MIN_LENGTH,
  TERM_RELATED_NAMES_MAX,
  TERM_USAGE_EXAMPLE_MAX,
  TRUE_FALSE_OPTIONS_COUNT,
} from '@/lib/constants';
import type { ChoiceOption, QuestionItem, QuestionPayload } from '@/types/content';
import { assertProperty } from '../pbt';
import { SOURCE_HEADINGS, validApiResponseArb } from '../generators/catalog';

function compactLength(value: string): number {
  return value.replace(/\s/g, '').length;
}

function assertUniqueNonBlankOptions(options: ChoiceOption[], expectedCount: number): void {
  expect(options).toHaveLength(expectedCount);
  expect(options.every((option) => option.id.trim().length > 0)).toBe(true);
  expect(options.every((option) => option.text.trim().length > 0)).toBe(true);
  expect(new Set(options.map((option) => option.id)).size).toBe(expectedCount);
  expect(new Set(options.map((option) => option.text)).size).toBe(expectedCount);
}

function assertQuestionPayload(question: QuestionItem): void {
  const payload = question.payload as QuestionPayload;
  expect(ALLOWED_QUESTION_FORMATS).toContain(question.format);

  if (question.format === 'singleChoice') {
    expect(payload.kind).toBe('choice');
    const choicePayload = payload as Extract<QuestionPayload, { kind: 'choice' }>;
    assertUniqueNonBlankOptions(choicePayload.options, CHOICE_OPTIONS_COUNT);
    expect(choicePayload.options.filter((option) => option.id === choicePayload.correctOptionId)).toHaveLength(1);
    return;
  }

  if (question.format === 'trueFalse') {
    expect(payload.kind).toBe('trueFalse');
    const trueFalsePayload = payload as Extract<QuestionPayload, { kind: 'trueFalse' }>;
    expect(trueFalsePayload.options).toEqual([
      { id: 'true', text: '正しい' },
      { id: 'false', text: '誤り' },
    ]);
    expect(trueFalsePayload.options).toHaveLength(TRUE_FALSE_OPTIONS_COUNT);
    expect(trueFalsePayload.options.filter((option) => option.id === trueFalsePayload.correctOptionId)).toHaveLength(1);
    return;
  }

  if (question.format === 'bugDiagnosis') {
    expect(payload.kind).toBe('bugDiagnosis');
    const bugPayload = payload as Extract<QuestionPayload, { kind: 'bugDiagnosis' }>;
    assertUniqueNonBlankOptions(bugPayload.options, CHOICE_OPTIONS_COUNT);
    expect(bugPayload.options.filter((option) => option.id === bugPayload.correctOptionId)).toHaveLength(1);
    expect(bugPayload.code.split('\n').length).toBeGreaterThanOrEqual(1);
    expect(bugPayload.code.split('\n').length).toBeLessThanOrEqual(BUG_DIAGNOSIS_MAX_LINES);
    return;
  }

  if (question.format === 'interactive') {
    expect(payload.kind).toBe('activityRef');
    const activityPayload = payload as Extract<QuestionPayload, { kind: 'activityRef' }>;
    expect(activityPayload.activityType).toBe('terminalToken');
    expect(activityPayload.activityId.trim().length).toBeGreaterThan(0);
    expect(activityPayload.stageId.trim().length).toBeGreaterThan(0);
    return;
  }

  expect(payload.kind).toBe('fillBlank');
  const fillPayload = payload as Extract<QuestionPayload, { kind: 'fillBlank' }>;
  expect(fillPayload.content.split(fillPayload.blankToken)).toHaveLength(2);
  if (fillPayload.mode === 'choice') {
    assertUniqueNonBlankOptions(fillPayload.options, CHOICE_OPTIONS_COUNT);
    expect(fillPayload.options.filter((option) => option.id === fillPayload.correctOptionId)).toHaveLength(1);
  } else {
    expect(fillPayload.correctText.trim().length).toBeGreaterThan(0);
    expect([...fillPayload.correctText].length).toBeLessThanOrEqual(64);
    expect(fillPayload.maxInputLength).toBe(64);
  }
}

/**
 * Feature: curriculum-quiz-app, Property 1: 受理カタログは全契約制約を満たす
 * **Validates: Requirements 1.3, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.13, 1.14, 1.15, 4.7, 8.1, 8.2**
 */
describe('Property 1: 受理カタログは全契約制約を満たす', () => {
  it('受理された全カタログがactiveデータの契約不変条件を満たす', () => {
    assertProperty(
      fc.property(validApiResponseArb(), (input) => {
        const result = validateApiResponse(input);
        expect(result.ok).toBe(true);
        if (!result.ok) return;

        const { catalog } = result.response;
        const allEntities = [
          ...catalog.weekUnits,
          ...catalog.questions,
          ...catalog.terms,
          ...catalog.activities,
        ];
        expect(new Set(allEntities.map((entity) => entity.id)).size).toBe(allEntities.length);
        expect(allEntities.every((entity) => entity.published && !entity.deleted)).toBe(true);
        expect(catalog.weekUnits.map((week) => week.key)).toEqual([...SUPPORTED_WEEK_KEYS]);

        for (const week of catalog.weekUnits) {
          const questions = catalog.questions.filter((question) => question.weekUnitId === week.id);
          const terms = catalog.terms.filter((term) => term.weekUnitId === week.id);

          expect(questions.length).toBeGreaterThanOrEqual(MIN_QUESTIONS_PER_WEEK);
          expect(questions.length).toBeLessThanOrEqual(MAX_QUESTIONS_PER_WEEK);
          expect(terms.length).toBeGreaterThanOrEqual(MIN_TERMS_PER_WEEK);

          const bugQuestions = questions.filter((question) => question.format === 'bugDiagnosis');
          const fillBlankQuestions = questions.filter((question) => question.format === 'fillBlank');
          expect(bugQuestions.length).toBeGreaterThanOrEqual(1);
          expect(fillBlankQuestions.length).toBeGreaterThanOrEqual(1);
          const headings = SOURCE_HEADINGS[week.key as keyof typeof SOURCE_HEADINGS];
          expect(headings).toBeDefined();
          expect(
            questions.every((question) =>
              question.sourceReference.weekKey === week.key &&
              headings.includes(question.sourceReference.sectionHeading),
            ),
          ).toBe(true);
          const commonMistakeQuestions = questions.filter((question) =>
            question.sourceReference.sectionHeading.includes('よくある間違い'),
          );
          const hasCommonMistakeSection = headings.some((heading) => heading.includes('よくある間違い'));
          expect(
            hasCommonMistakeSection
              ? commonMistakeQuestions.length
              : bugQuestions.length,
          ).toBeGreaterThanOrEqual(MIN_COMMON_MISTAKE_QUESTIONS_PER_WEEK);

          for (const term of terms) {
            expect(term.weekUnitId).toBe(week.id);
            expect([...term.name].length).toBeGreaterThanOrEqual(TERM_NAME_MIN_LENGTH);
            expect([...term.name].length).toBeLessThanOrEqual(TERM_NAME_MAX_LENGTH);
            expect(compactLength(term.definition)).toBeGreaterThanOrEqual(TERM_DEFINITION_MIN_LENGTH);
            expect(compactLength(term.definition)).toBeLessThanOrEqual(TERM_DEFINITION_MAX_LENGTH);
            expect(term.usageExamples.length).toBeGreaterThanOrEqual(1);
            expect(term.usageExamples.length).toBeLessThanOrEqual(TERM_USAGE_EXAMPLE_MAX);
            expect(term.usageExamples.every((example) => example.trim().length > 0)).toBe(true);
            expect(term.sourceReference.weekKey).toBe(week.key);
            expect(headings).toContain(term.sourceReference.sectionHeading);
            expect(term.relatedTermNames.length).toBeLessThanOrEqual(TERM_RELATED_NAMES_MAX);
          }
        }

        expect(catalog.terms.length).toBeGreaterThanOrEqual(MIN_TOTAL_TERMS);

        for (const question of catalog.questions) {
          const week = catalog.weekUnits.find((candidate) => candidate.id === question.weekUnitId);
          expect(week).toBeDefined();
          expect(question.prompt.trim().length).toBeGreaterThan(0);
          expect(compactLength(question.explanation)).toBeGreaterThanOrEqual(EXPLANATION_MIN_LENGTH);
          expect(compactLength(question.explanation)).toBeLessThanOrEqual(EXPLANATION_MAX_LENGTH);
          expect(question.sourceReference.weekKey).toBe(week?.key);
          assertQuestionPayload(question);
        }
      }),
    );
  });
});
