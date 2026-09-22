/**
 * セッション内で表示する選択肢順を管理する純粋なドメインロジック。
 *
 * 選択肢順は Question ID だけではなく Session ID も seed に含めるため、
 * 同じセッションでの再表示は安定しつつ、別セッションでは別の順序を選べます。
 */

import type { QuestionFormat, QuestionItem } from '@/types/content';
import type { QuizSession } from '@/types/session';
import { createSeededRandom, shuffle } from '@/lib/quiz/random';

export type OptionOrderStore = Record<string, string[]>;

type SessionOptionOrder = Pick<QuizSession, 'id' | 'optionOrders'>;

/**
 * 選択肢IDからセッション固有の初回表示順を作る。
 * 正誤判定は要件で定められた「正しい」「誤り」の順を変更しない。
 */
export function createOptionOrder(
  sessionId: string,
  questionId: string,
  optionIds: readonly string[],
  format: QuestionFormat,
): string[] {
  const source = [...optionIds];
  if (format === 'trueFalse') return source;

  return shuffle(source, createSeededRandom(`${sessionId}:${questionId}`));
}

/**
 * 問題の選択肢IDを取得する。自由入力形式には選択肢順がないため空配列を返す。
 */
export function getQuestionOptionIds(question: QuestionItem): string[] {
  if ('options' in question.payload) return question.payload.options.map((option) => option.id);
  return [];
}

/**
 * セッションの選択肢順を取得する。
 * 未保存の場合だけ決定的に生成して optionOrders に保存する。
 */
export function getOrCreateOptionOrder(
  session: SessionOptionOrder,
  question: QuestionItem,
): string[] {
  const existing = session.optionOrders[question.id];
  if (existing) return existing;

  const order = createOptionOrder(
    session.id,
    question.id,
    getQuestionOptionIds(question),
    question.format,
  );
  session.optionOrders[question.id] = order;
  return order;
}

/**
 * セッション生成時に optionOrders へ初回順を保存する。
 * 既存値がある場合は上書きせず、その値を再利用する。
 */
export function ensureOptionOrder(
  sessionId: string,
  question: QuestionItem,
  optionOrders: OptionOrderStore,
): string[] {
  return getOrCreateOptionOrder({ id: sessionId, optionOrders }, question);
}

/**
 * 後続UIが session から選択肢順を取得するための API。
 */
export function getOptionOrder(session: SessionOptionOrder, question: QuestionItem): string[] {
  return getOrCreateOptionOrder(session, question);
}
