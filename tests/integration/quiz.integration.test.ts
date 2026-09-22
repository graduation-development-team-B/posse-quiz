import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { validateApiResponse } from '@/lib/content/validateApiResponse';
import { addReviewOnWrongAnswer } from '@/lib/progress/reviewQueue';
import { ProgressStore } from '@/lib/progress/ProgressStore';
import { buildFeedback } from '@/lib/quiz/feedback';
import { judgeAnswer } from '@/lib/quiz/answerJudge';
import { createSeededRandom } from '@/lib/quiz/random';
import { createSessionForScope } from '@/lib/quiz/sessionManager';
import { selectQuestionPool } from '@/lib/quiz/scope';
import type { ApiResponse, ContentCatalog } from '@/types/content';
import type { AnswerRecord } from '@/types/session';
import { createTestStorage } from '../test-doubles';

function catalog(): ContentCatalog {
  const raw = JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
  const result = validateApiResponse(raw);
  if (!result.ok) throw new Error(`fixture must be valid: ${result.issues.map((issue) => issue.code).join(', ')}`);
  return result.response.catalog;
}

describe('quiz integration', () => {
  it('creates a scoped session, judges an answer, persists progress, and builds feedback', async () => {
    const sourceCatalog = catalog();
    const pool = selectQuestionPool(sourceCatalog, { weekKeys: ['week3'] });
    const session = createSessionForScope(
      sourceCatalog,
      { weekKeys: ['week3'] },
      5,
      createSeededRandom(11),
    );

    expect(pool.length).toBeGreaterThanOrEqual(5);
    expect(session).not.toBeNull();
    expect(new Set(session?.questionIds).size).toBe(session?.questionIds.length);
    expect(session?.questions.some((question) => question.format !== 'singleChoice')).toBe(true);

    const question = sourceCatalog.questions.find((item) => item.id === 'question-week3-flex-001')!;
    const judgement = judgeAnswer(question, { optionId: 'a' });
    expect(judgement).toMatchObject({ isCorrect: false, canSubmit: true });

    const answer: AnswerRecord = {
      questionId: question.id,
      selectedOptionId: 'a',
      isCorrect: judgement.isCorrect,
      answeredAt: '2025-01-02T00:00:00.000Z',
    };
    const storage = createTestStorage();
    const progress = new ProgressStore(storage);
    await progress.restore();
    await progress.recordAnswer({
      ...answer,
      weekKey: 'week3',
    });
    await progress.updateReviewQueue(addReviewOnWrongAnswer(
      progress.getSnapshot().reviewQueue,
      question,
      answer.answeredAt,
    ));

    const feedback = buildFeedback(
      question,
      answer,
      sourceCatalog,
    );
    expect(feedback).toMatchObject({
      questionId: question.id,
      isCorrect: false,
      correctText: '横並びにしたい子要素を含む親要素',
      incorrectReason: expect.any(String),
    });
    expect(feedback.explanation).toBe(question.explanation);
    expect(feedback.sourceReference.weekKey).toBe('week3');
    expect(feedback.explanationSegments.some((segment) => segment.termId === 'term-week3-flexbox')).toBe(true);
    expect(progress.getSnapshot().weekProgress.find((item) => item.weekKey === 'week3')).toMatchObject({
      questionCount: 1,
      correctCount: 0,
    });
  });

  it('keeps the session question and option snapshots when the catalog is updated', () => {
    const sourceCatalog = catalog();
    const session = createSessionForScope(
      sourceCatalog,
      { weekKeys: ['week3'] },
      3,
      createSeededRandom(7),
    );
    expect(session).not.toBeNull();

    const questionId = session!.questionIds[0]!;
    const questionBeforeUpdate = session!.questions.find((item) => item.id === questionId)!;
    const orderBeforeUpdate = [...session!.optionOrders[questionId]!];
    const catalogQuestion = sourceCatalog.questions.find((item) => item.id === questionId)!;
    catalogQuestion.prompt = '新版教材の問題文';
    if ('options' in catalogQuestion.payload) {
      catalogQuestion.payload.options[0]!.text = '新版の選択肢';
    }

    expect(session!.questions.find((item) => item.id === questionId)).toEqual(questionBeforeUpdate);
    expect(session!.questions.find((item) => item.id === questionId)?.prompt).not.toBe('新版教材の問題文');
    expect(session!.optionOrders[questionId]).toEqual(orderBeforeUpdate);
  });
});
