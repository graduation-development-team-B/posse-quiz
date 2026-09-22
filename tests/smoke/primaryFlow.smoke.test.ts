import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';

import { createMockApiServer } from '@/mock-api/server';
import { ContentApiClient } from '@/lib/content/ContentApiClient';
import { ContentCacheStore } from '@/lib/content/ContentCacheStore';
import { ContentSyncManager } from '@/lib/content/ContentSyncManager';
import { validateApiResponse } from '@/lib/content/validateApiResponse';
import { createTermRoute, createQuizRoute, createResultRoute } from '@/lib/navigation/routes';
import { addReviewOnWrongAnswer } from '@/lib/progress/reviewQueue';
import { judgeAnswer } from '@/lib/quiz/answerJudge';
import { createSeededRandom } from '@/lib/quiz/random';
import { createQuizSession, createReviewSession, createSessionForScope } from '@/lib/quiz/sessionManager';
import { selectQuestionPool } from '@/lib/quiz/scope';
import { buildFeedback } from '@/lib/quiz/feedback';
import { createTestStorage } from '@/tests/test-doubles';
import type { ContentCatalog, QuestionItem } from '@/types/content';
import type { AnswerRecord } from '@/types/session';

interface RunningServer {
  server: Server;
  baseUrl: string;
}

let runningServer: RunningServer;
let catalog: ContentCatalog;

beforeAll(async () => {
  const server = createMockApiServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('テスト用Content_APIのアドレスを取得できません');
  runningServer = { server, baseUrl: `http://127.0.0.1:${address.port}` };

  const calls: RequestInit[] = [];
  const client = new ContentApiClient({
    config: { baseUrl: runningServer.baseUrl, apiVersion: 'v1', timeoutMs: 1000 },
    fetchImpl: async (input, init) => {
      calls.push(init ?? {});
      return fetch(input, init);
    },
  });
  const response = await client.fetchCatalog();
  const validation = validateApiResponse(response);
  if (!validation.ok) throw new Error(validation.issues.map((issue) => issue.message).join('\n'));
  catalog = validation.response.catalog;

  const manager = new ContentSyncManager({
    apiClient: client,
    cacheStore: new ContentCacheStore(createTestStorage()),
    apiVersion: 'v1',
    now: () => '2025-01-01T00:00:00.000Z',
  });
  await manager.refresh('startup');

  expect(calls[0]).toMatchObject({
    method: 'GET',
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  });
  expect(calls[0]?.body).toBeUndefined();
  expect((calls[0]?.headers as Record<string, string>)?.Authorization).toBeUndefined();
  expect(manager.getState()).toBe('ready');
  expect(manager.getCatalog()).toEqual(catalog);
});

afterAll(async () => {
  if (!runningServer) return;
  await new Promise<void>((resolve, reject) => {
    runningServer.server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('primary learning flow smoke', () => {
  it('starts unauthenticated, exposes the four supported weeks, and creates a scoped session', () => {
    expect(catalog.weekUnits.filter((week) => week.published && !week.deleted).map((week) => week.key))
      .toEqual(['week1', 'week3', 'week4', 'week5', 'week6', 'git_github_level1']);

    const week3 = catalog.weekUnits.find((week) => week.key === 'week3');
    expect(week3).toBeDefined();
    const scopedPool = selectQuestionPool(catalog, {
      weekKeys: ['week3'],
    });
    expect(scopedPool.length).toBeGreaterThan(0);
    expect(scopedPool.every((question) => question.weekUnitId === week3!.id)).toBe(true);

    const session = createSessionForScope(
      catalog,
      { weekKeys: ['week3'] },
      5,
      createSeededRandom('primary-flow'),
    );
    expect(session).not.toBeNull();
    expect(session!.questions.length).toBeLessThanOrEqual(5);
    expect(new Set(session!.questionIds).size).toBe(session!.questionIds.length);
    expect(createQuizRoute(session!.id)).toEqual({
      pathname: '/quiz/[sessionId]',
      params: { sessionId: session!.id },
    });
  });

  it('judges every question format and builds the immediate feedback model used by the route', () => {
    const questionsByFormat = new Map<QuestionItem['format'], QuestionItem>();
    for (const question of catalog.questions) {
      if (!questionsByFormat.has(question.format)) questionsByFormat.set(question.format, question);
    }
    expect([...questionsByFormat.keys()].sort()).toEqual(
      ['bugDiagnosis', 'fillBlank', 'interactive', 'singleChoice', 'trueFalse'].sort(),
    );

    for (const question of questionsByFormat.values()) {
      let answer: AnswerRecord;
      if (question.format === 'interactive' && question.payload.kind === 'activityRef') {
        const judgement = judgeAnswer(question, { activityCompleted: true });
        expect(judgement.canSubmit).toBe(true);
        expect(judgement.isCorrect).toBe(true);
        answer = {
          questionId: question.id,
          activityCompleted: true,
          isCorrect: true,
          answeredAt: '2025-01-01T00:00:00.000Z',
        };
      } else if (
        question.format === 'fillBlank'
        && question.payload.kind === 'fillBlank'
        && question.payload.mode === 'freeText'
      ) {
        const judgement = judgeAnswer(question, { freeText: `  ${question.payload.correctText}\n` });
        expect(judgement.canSubmit).toBe(true);
        expect(judgement.isCorrect).toBe(true);
        answer = {
          questionId: question.id,
          freeText: question.payload.correctText,
          isCorrect: true,
          answeredAt: '2025-01-01T00:00:00.000Z',
        };
      } else if ('options' in question.payload) {
        const correctOptionId = question.payload.correctOptionId;
        const judgement = judgeAnswer(question, { optionId: correctOptionId });
        expect(judgement.canSubmit).toBe(true);
        expect(judgement.isCorrect).toBe(true);
        answer = {
          questionId: question.id,
          selectedOptionId: correctOptionId,
          isCorrect: true,
          answeredAt: '2025-01-01T00:00:00.000Z',
        };
      } else {
        throw new Error(`対応する解答形式のpayloadがありません: ${question.id}`);
      }

      const feedback = buildFeedback(question, answer, catalog);
      expect(feedback).toMatchObject({
        questionId: question.id,
        isCorrect: true,
        explanation: question.explanation,
        sourceReference: question.sourceReference,
      });
      expect(feedback.correctText.length).toBeGreaterThan(0);
    }
  });

  it('covers wrong-answer review, feedback/result/home routes, retry, and term return', () => {
    const question = catalog.questions.find((candidate) => candidate.format === 'singleChoice');
    expect(question).toBeDefined();
    expect(question!.payload.kind).toBe('choice');
    const payload = question!.payload;
    if (payload.kind !== 'choice') return;

    const wrongOption = payload.options.find(
      (option) => option.id !== payload.correctOptionId,
    );
    expect(wrongOption).toBeDefined();
    const wrongAnswer: AnswerRecord = {
      questionId: question!.id,
      selectedOptionId: wrongOption!.id,
      isCorrect: false,
      answeredAt: '2025-01-01T00:00:00.000Z',
    };
    const feedback = buildFeedback(question!, wrongAnswer, catalog);
    expect(feedback.isCorrect).toBe(false);

    const reviewQueue = addReviewOnWrongAnswer([], question!, wrongAnswer.answeredAt);
    expect(reviewQueue).toHaveLength(1);
    expect(createReviewSession([], catalog.questions, 5, createSeededRandom(1))).toBeNull();
    expect(createReviewSession(reviewQueue, catalog.questions, 5, createSeededRandom(1))).not.toBeNull();

    const retrySession = createSessionForScope(
      catalog,
      { weekKeys: [question!.sourceReference.weekKey] },
      3,
      createSeededRandom('retry'),
    );
    expect(retrySession).not.toBeNull();
    expect(retrySession!.questions.every((candidate) => candidate.sourceReference.weekKey === question!.sourceReference.weekKey)).toBe(true);

    const session = createQuizSession([question!], 3, 'normal', createSeededRandom(2));
    expect(session).not.toBeNull();
    expect(createResultRoute(session!.id)).toEqual({
      pathname: '/result/[sessionId]',
      params: { sessionId: session!.id },
    });
    expect(createTermRoute(catalog.terms[0]!.id)).toEqual({
      pathname: '/term/[termId]',
      params: { termId: catalog.terms[0]!.id },
    });
    expect(createQuizRoute(session!.id).params.sessionId).toBe(session!.id);
  });
});
