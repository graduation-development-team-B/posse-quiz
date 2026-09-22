import type { ContentCatalog, QuestionItem } from '@/types/content';
import type { QuizSession, SessionMode, SessionScope } from '@/types/session';
import type { ReviewEntry } from '@/types/progress';
import { DEFAULT_QUESTION_COUNT, NON_CHOICE_PRIORITY_SESSION_MIN } from '@/lib/constants';
import { prioritizeReviewQueue } from '@/lib/progress/reviewQueue';
import { selectQuestionPool } from '@/lib/quiz/scope';
import { nextRandom, shuffle, type RandomSource } from '@/lib/quiz/random';
import { ensureOptionOrder } from '@/lib/quiz/optionOrder';

/** 未設定・不正な問題数を既定値5へ正規化する。 */
export function normalizeQuestionCount(value: unknown): 3 | 5 | 10 {
  if (value === 3 || value === 5 || value === 10) return value;
  return DEFAULT_QUESTION_COUNT;
}

/**
 * 出題可能な問題プールからセッションを生成する。
 * 空のプールではnullを返し、セッションを生成しない。
 */
export function createQuizSession(
  pool: readonly QuestionItem[],
  requestedCount: unknown,
  mode: SessionMode = 'normal',
  random: RandomSource = Math.random,
): QuizSession | null {
  // 制作ドリルは専用画面で順番に解く。ランダム抽出で工程を分断しない。
  const candidates = uniqueActiveQuestions(pool).filter(question => !question.preview && !question.console);
  if (candidates.length === 0) return null;

  const targetCount = Math.min(normalizeQuestionCount(requestedCount), candidates.length);
  const selected = chooseQuestions(candidates, targetCount, mode, random);
  return buildSession(selected, mode, random);
}

/**
 * カタログと範囲選択から通常セッションを生成する便利な合成関数。
 * 選択範囲に問題がなければnullを返す。
 */
export function createSessionForScope(
  catalog: ContentCatalog,
  scope: SessionScope,
  requestedCount: unknown,
  random: RandomSource = Math.random,
): QuizSession | null {
  return createQuizSession(selectQuestionPool(catalog, scope), requestedCount, 'normal', random);
}

/** Review Queueの優先順を保った復習セッションを生成する。 */
export function createReviewSession(
  reviewQueue: readonly ReviewEntry[],
  questions: readonly QuestionItem[],
  requestedCount: unknown,
  random: RandomSource = Math.random,
): QuizSession | null {
  const questionById = new Map(
    uniqueActiveQuestions(questions).map((question) => [question.id, question]),
  );
  const prioritizedQuestions: QuestionItem[] = [];
  const seen = new Set<string>();

  for (const entry of prioritizeReviewQueue([...reviewQueue])) {
    const question = questionById.get(entry.questionId);
    if (!question || seen.has(question.id)) continue;
    seen.add(question.id);
    prioritizedQuestions.push(question);
  }

  return createQuizSession(prioritizedQuestions, requestedCount, 'review', random);
}

/** Review Queueを使うAPI名の別名。 */
export const createReviewQuizSession = createReviewSession;

function chooseQuestions(
  candidates: QuestionItem[],
  targetCount: number,
  mode: SessionMode,
  random: RandomSource,
): QuestionItem[] {
  if (mode === 'review') {
    return candidates.slice(0, targetCount);
  }

  const shuffled = shuffle(candidates, random);
  if (
    targetCount < NON_CHOICE_PRIORITY_SESSION_MIN ||
    !candidates.some((question) => question.format !== 'singleChoice')
  ) {
    return shuffled.slice(0, targetCount);
  }

  const nonChoiceQuestions = candidates.filter((question) => question.format !== 'singleChoice');
  const reserved = nonChoiceQuestions[Math.floor(nextRandom(random) * nonChoiceQuestions.length)]!;
  const remaining = shuffled.filter((question) => question.id !== reserved.id);
  return [reserved, ...remaining.slice(0, targetCount - 1)];
}

function buildSession(
  selectedQuestions: readonly QuestionItem[],
  mode: SessionMode,
  random: RandomSource,
): QuizSession {
  const questions = selectedQuestions.map(cloneAndFreezeQuestion);
  const questionIds = questions.map((question) => question.id);
  const sessionId = `session-${Date.now().toString(36)}-${Math.floor(nextRandom(random) * 0x100000000).toString(36)}`;
  const optionOrders: Record<string, string[]> = {};

  for (const question of questions) {
    optionOrders[question.id] = Object.freeze(
      ensureOptionOrder(sessionId, question, optionOrders),
    ) as unknown as string[];
  }

  return {
    id: sessionId,
    startedAt: new Date().toISOString(),
    questionIds: Object.freeze(questionIds) as unknown as string[],
    questions: Object.freeze(questions) as unknown as QuestionItem[],
    optionOrders: Object.freeze(optionOrders),
    currentIndex: 0,
    answeredCount: 0,
    correctCount: 0,
    answers: {},
    mode,
  };
}

function uniqueActiveQuestions(pool: readonly QuestionItem[]): QuestionItem[] {
  const seen = new Set<string>();
  return pool.filter((question) => {
    if (!question.published || question.deleted || seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function cloneAndFreezeQuestion(question: QuestionItem): QuestionItem {
  return deepFreeze(cloneValue(question));
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T;
  if (value !== null && typeof value === 'object') {
    const clone: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) clone[key] = cloneValue(item);
    return clone as T;
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
