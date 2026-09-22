import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { validateApiResponse } from '@/lib/content/validateApiResponse';
import type { ApiResponse } from '@/types/content';

function readFixture(): ApiResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
}

function cloneFixture(): ApiResponse {
  return JSON.parse(JSON.stringify(readFixture())) as ApiResponse;
}

describe('validateApiResponse', () => {
  it('Week01ミニドリルの3題をカタログへ収録している', () => {
    const response = cloneFixture();
    const week1Questions = response.catalog.questions.filter((question) => question.weekUnitId === 'week-unit-week1');

    expect(week1Questions).toHaveLength(18);
    expect(week1Questions.map((question) => question.id)).toEqual(expect.arrayContaining([
      'question-week1-preview-movie-1',
      'question-week1-preview-artist-1',
      'question-week1-preview-event-1',
    ]));
    expect(week1Questions.every(question => question.format === 'fillBlank' && question.preview)).toBe(true);
  });

  it('accepts the demo catalog and returns only active entities', () => {
    const response = cloneFixture();
    const retiredQuestion = {
      id: 'retired-question',
      published: false,
      deleted: false,
    };
    response.catalog.questions.push(
      retiredQuestion as (typeof response.catalog.questions)[number],
    );

    const result = validateApiResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.catalog.weekUnits).toHaveLength(6);
      expect(result.response.catalog.questions).toHaveLength(106);
      expect(result.response.catalog.questions.some((question) => question.id === 'retired-question')).toBe(false);
      expect(result.response).not.toBe(response);
    }
  });

  it('rejects the entire response and identifies an invalid question', () => {
    const response = cloneFixture();
    response.catalog.questions[0]!.explanation = '短い';

    const result = validateApiResponse(response);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'question.explanation.length',
            entityType: 'question',
            entityId: response.catalog.questions[0]!.id,
          }),
        ]),
      );
      expect('response' in result).toBe(false);
    }
  });

  it('rejects invalid format payload cardinality with the question ID', () => {
    const response = cloneFixture();
    const question = response.catalog.questions.find((candidate) => candidate.format === 'singleChoice')!;
    (question.payload as { options: unknown[] }).options = (question.payload as { options: unknown[] }).options.slice(0, 3);

    const result = validateApiResponse(response);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'payload.options.count',
            entityType: 'question',
            entityId: question.id,
          }),
        ]),
      );
    }
  });

  it('rejects duplicate IDs across entity collections', () => {
    const response = cloneFixture();
    response.catalog.terms[0]!.id = response.catalog.weekUnits[0]!.id;

    const result = validateApiResponse(response);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'entity.id.duplicate',
            entityId: response.catalog.weekUnits[0]!.id,
          }),
        ]),
      );
    }
  });
});
