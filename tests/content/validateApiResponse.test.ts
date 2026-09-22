import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  CONTENT_VALIDATION_ERROR_MESSAGE,
  getContentValidationErrorMessage,
  logValidationIssues,
} from '@/lib/content/logger';
import { validateApiResponse } from '@/lib/content/validateApiResponse';
import type { ApiResponse, QuestionItem } from '@/types/content';

function readFixture(): ApiResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
}

function cloneFixture(): ApiResponse {
  return JSON.parse(JSON.stringify(readFixture())) as ApiResponse;
}

function firstQuestion(response: ApiResponse): QuestionItem {
  return response.catalog.questions[0]!;
}

function firstChoiceQuestion(response: ApiResponse): QuestionItem {
  return response.catalog.questions.find((question) => question.format === 'singleChoice')!;
}

function expectRejected(response: ApiResponse, code: string, entityId?: string): void {
  const result = validateApiResponse(response);

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect('response' in result).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code,
          ...(entityId ? { entityId } : {}),
        }),
      ]),
    );
  }
}

describe('validateApiResponse', () => {
  it('accepts the demo catalog and filters inactive entities from the normalized catalog', () => {
    const response = cloneFixture();
    response.catalog.weekUnits.push({
      id: 'retired-week',
      key: 'week7',
      order: 7,
      title: '非公開週',
      published: false,
      deleted: false,
    });
    response.catalog.questions.push({
      ...firstQuestion(response),
      id: 'retired-question',
      published: false,
      deleted: false,
    });
    response.catalog.terms.push({
      ...response.catalog.terms[0]!,
      id: 'retired-term',
      published: true,
      deleted: true,
    });

    const result = validateApiResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.catalog.weekUnits.some((week) => week.id === 'retired-week')).toBe(false);
      expect(result.response.catalog.questions.some((question) => question.id === 'retired-question')).toBe(false);
      expect(result.response.catalog.terms.some((term) => term.id === 'retired-term')).toBe(false);
    }
  });

  it.each([
    [19, false],
    [20, true],
    [400, true],
    [401, false],
  ])('enforces explanation length after whitespace removal at %i characters', (length, accepted) => {
    const response = cloneFixture();
    const question = firstQuestion(response);
    question.explanation = 'あ'.repeat(length);

    const result = validateApiResponse(response);

    expect(result.ok).toBe(accepted);
    if (!accepted && !result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'question.explanation.length',
            entityId: question.id,
          }),
        ]),
      );
    }
  });

  it('rejects a question with a missing Source_Reference and includes its ID', () => {
    const response = cloneFixture();
    const question = firstQuestion(response) as Omit<QuestionItem, 'sourceReference'> & { sourceReference?: unknown };
    delete question.sourceReference;

    expectRejected(response, 'sourceReference.required', question.id);
  });

  it('存在しないWeek_Unitを参照する問題はカタログ全体を拒否する', () => {
    const response = cloneFixture();
    const question = firstQuestion(response);
    question.weekUnitId = 'unknown-week-unit-id';

    const result = validateApiResponse(response);

    expect(result.ok).toBe(false);
    expect('response' in result).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'question.week.reference',
            entityType: 'question',
            entityId: question.id,
          }),
        ]),
      );
    }
  });

  it('rejects a Question_Format outside the four allowed formats', () => {
    const response = cloneFixture();
    const question = firstQuestion(response) as Omit<QuestionItem, 'format'> & { format: string };
    question.format = 'unsupported';

    expectRejected(response, 'question.format.unsupported', question.id);
  });

  it.each([
    [3, false],
    [4, true],
    [5, false],
  ])('enforces format-specific option cardinality at %i options', (count, accepted) => {
    const response = cloneFixture();
    const question = firstChoiceQuestion(response);
    const payload = question.payload as Extract<QuestionItem['payload'], { kind: 'choice' }>;
    const originalOptions = payload.options;
    payload.options = originalOptions.slice(0, count);
    if (count === 5) {
      payload.options.push({ id: 'extra', text: '追加の選択肢' });
    }

    const result = validateApiResponse(response);

    expect(result.ok).toBe(accepted);
    if (!accepted && !result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'payload.options.count',
            entityId: question.id,
          }),
        ]),
      );
    }
  });

  it.each([
    ['zero', 'missing-correct-option', false],
    ['one', '__original__', true],
    ['two', '__original__', false],
  ])('requires exactly one correct option (%s)', (caseName, correctOptionId, accepted) => {
    const response = cloneFixture();
    const question = firstChoiceQuestion(response);
    const payload = question.payload as Extract<QuestionItem['payload'], { kind: 'choice' }>;
    const originalCorrectOptionId = payload.correctOptionId;
    payload.correctOptionId = correctOptionId === '__original__' ? originalCorrectOptionId : correctOptionId;
    if (caseName === 'two') {
      payload.options[1]!.id = payload.options[0]!.id;
    }

    const result = validateApiResponse(response);

    expect(result.ok).toBe(accepted);
    if (!accepted && !result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'payload.correctOption.count',
            entityId: question.id,
          }),
        ]),
      );
    }
  });

  it('rejects stable ID reuse for a different entity instead of accepting a changed meaning', () => {
    const response = cloneFixture();
    const weekUnitId = response.catalog.weekUnits[0]!.id;
    response.catalog.terms[0]!.id = weekUnitId;

    expectRejected(response, 'entity.id.duplicate', weekUnitId);
  });

  it('logs validation details with the question ID while exposing only a generic user message', () => {
    const response = cloneFixture();
    const question = firstQuestion(response);
    question.explanation = '短い';
    const result = validateApiResponse(response);
    expect(result.ok).toBe(false);
    if (result.ok) return;

    const logger = { error: vi.fn() };
    logValidationIssues(result.issues, logger);

    expect(logger.error).toHaveBeenCalledTimes(result.issues.length);
    expect(logger.error.mock.calls.map(([message]) => message).join('\n')).toContain(question.id);
    expect(logger.error.mock.calls.map(([message]) => message).join('\n')).toContain('question.explanation.length');
    expect(getContentValidationErrorMessage()).toBe(CONTENT_VALIDATION_ERROR_MESSAGE);
    expect(getContentValidationErrorMessage()).not.toContain(question.id);
    expect(getContentValidationErrorMessage()).not.toContain('question.explanation.length');
    expect(getContentValidationErrorMessage()).not.toContain('短い');
  });
});
