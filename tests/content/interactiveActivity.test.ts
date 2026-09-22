import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { validateApiResponse } from '@/lib/content/validateApiResponse';
import type { ApiResponse, InteractiveQuestionPayload } from '@/types/content';

function fixture(): ApiResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
}

function cloneFixture(): ApiResponse {
  return JSON.parse(JSON.stringify(fixture())) as ApiResponse;
}

describe('Git/GitHub Level 1 interactive activity', () => {
  it('10問が共有Activity内の異なる10 stageを参照する', () => {
    const result = validateApiResponse(fixture());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const questions = result.response.catalog.questions.filter((question) =>
      question.sourceReference.weekKey === 'git_github_level1',
    );
    const activity = result.response.catalog.activities.find((candidate) =>
      candidate.id === 'activity-git-github-level1-terminal',
    );

    expect(questions).toHaveLength(10);
    expect(questions.every((question) => question.format === 'interactive')).toBe(true);
    expect(activity?.stages).toHaveLength(10);

    const references = questions.map((question) => {
      const payload = question.payload as InteractiveQuestionPayload;
      return `${payload.activityId}:${payload.stageId}`;
    });
    expect(new Set(references).size).toBe(10);
    expect(references).toEqual(activity?.stages.map((stage) => `${activity.id}:${stage.id}`));
  });

  it.each([
    ['question.activity.reference', (response: ApiResponse) => {
      const question = response.catalog.questions.find((candidate) => candidate.format === 'interactive')!;
      (question.payload as InteractiveQuestionPayload).activityId = 'missing-activity';
    }],
    ['question.activity.stage.reference', (response: ApiResponse) => {
      const question = response.catalog.questions.find((candidate) => candidate.format === 'interactive')!;
      (question.payload as InteractiveQuestionPayload).stageId = 'missing-stage';
    }],
    ['activity.stage.tokens.unique', (response: ApiResponse) => {
      const tokens = response.catalog.activities[0]!.stages[0]!.tokens;
      tokens[1]!.id = tokens[0]!.id;
    }],
    ['activity.goal.command.invalid', (response: ApiResponse) => {
      response.catalog.activities[0]!.stages[0]!.goal.commandSequence = [['git', 'missing']];
    }],
  ] as const)('不正データを全体拒否する: %s', (expectedCode, mutate) => {
    const response = cloneFixture();
    mutate(response);

    const result = validateApiResponse(response);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: expectedCode }),
      ]));
    }
  });
});
