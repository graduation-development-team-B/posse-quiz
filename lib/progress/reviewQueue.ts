/**
 * Review_Queue を更新・優先順に整列する純粋なドメイン関数。
 *
 * このモジュールは ProgressStore や Local_Storage に依存しないため、
 * 回答確定時・復習セッション生成時から同じ規則を利用できる。
 */

import type { QuestionItem, WeekKey } from '@/types/content';
import type { ReviewEntry } from '@/types/progress';
import {
  REVIEW_GRADUATION_COUNT,
  REVIEW_QUEUE_MAX,
  WRONG_COUNT_MAX,
} from '@/lib/constants';

/** QuestionItemを使わない呼び出し側が渡せる復習対象の識別情報。 */
export interface ReviewQuestion {
  questionId: string;
  weekKey: WeekKey;
}

type ReviewQuestionInput =
  | ReviewQuestion
  | QuestionItem
  | (Pick<QuestionItem, 'id' | 'weekUnitId'> & { weekKey?: WeekKey });

/**
 * 通常セッションで誤答した問題をキューへ追加、または既存エントリを更新する。
 * 既存エントリの誤答回数は99で飽和し、復習連続正解数は0へ戻る。
 */
export function addReviewOnWrongAnswer(
  queue: ReviewEntry[],
  question: ReviewQuestionInput,
  now: string,
): ReviewEntry[] {
  const identity = toReviewIdentity(question);
  const existingIndex = queue.findIndex((entry) => entry.questionId === identity.questionId);

  if (existingIndex >= 0) {
    return queue.map((entry, index) => {
      if (index !== existingIndex) return entry;
      return {
        ...entry,
        wrongCount: saturateWrongCount(entry.wrongCount + 1),
        consecutiveCorrect: 0,
        lastWrongAt: now,
      };
    });
  }

  return appendWithOperationalLimit(queue, {
    ...identity,
    wrongCount: 1,
    consecutiveCorrect: 0,
    lastWrongAt: now,
  });
}

/**
 * 復習セッションでの回答結果を反映する。
 * - 誤答: 連続正解を0、最終誤答日時を更新（誤答回数は変更しない）
 * - 正解: 連続正解を1増加し、2回でキューから除外
 * 未登録の問題に対してはキューを変更しない。
 */
export function applyReviewAnswer(
  queue: ReviewEntry[],
  questionId: string,
  isCorrect: boolean,
  now: string,
): ReviewEntry[] {
  const existing = queue.find((entry) => entry.questionId === questionId);
  if (!existing) return [...queue];

  if (!isCorrect) {
    return queue.map((entry) =>
      entry.questionId === questionId
        ? { ...entry, consecutiveCorrect: 0, lastWrongAt: now }
        : entry,
    );
  }

  const nextConsecutiveCorrect = Math.min(
    existing.consecutiveCorrect + 1,
    REVIEW_GRADUATION_COUNT,
  );
  if (nextConsecutiveCorrect >= REVIEW_GRADUATION_COUNT) {
    return queue.filter((entry) => entry.questionId !== questionId);
  }

  return queue.map((entry) =>
    entry.questionId === questionId
      ? { ...entry, consecutiveCorrect: nextConsecutiveCorrect }
      : entry,
  );
}

/**
 * 復習セッションの優先順に並べた新しい配列を返す。
 * 誤答回数の降順、同数なら最終誤答日時の新しい順とする。
 * 同値の場合は入力配列の順序を保持する。
 */
export function sortReviewQueue(queue: ReviewEntry[]): ReviewEntry[] {
  return queue
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const wrongCountOrder = right.entry.wrongCount - left.entry.wrongCount;
      if (wrongCountOrder !== 0) return wrongCountOrder;

      const timestampOrder = compareTimestamp(right.entry.lastWrongAt, left.entry.lastWrongAt);
      return timestampOrder !== 0 ? timestampOrder : left.index - right.index;
    })
    .map(({ entry }) => entry);
}

/** 後続のSession Managerが使いやすい別名。入力配列は変更しない。 */
export const prioritizeReviewQueue = sortReviewQueue;

/** ReviewEntryをドメイン上の上限へ収める。 */
function saturateWrongCount(value: number): number {
  return Math.min(Math.max(value, 1), WRONG_COUNT_MAX);
}

function appendWithOperationalLimit(queue: ReviewEntry[], entry: ReviewEntry): ReviewEntry[] {
  const next = [...queue];
  if (next.length >= REVIEW_QUEUE_MAX) {
    const oldestIndex = findOldestEntryIndex(next);
    next.splice(oldestIndex, 1);
  }
  next.push(entry);
  return next;
}

function findOldestEntryIndex(queue: ReviewEntry[]): number {
  let oldestIndex = 0;
  for (let index = 1; index < queue.length; index += 1) {
    if (compareTimestamp(queue[index]!.lastWrongAt, queue[oldestIndex]!.lastWrongAt) < 0) {
      oldestIndex = index;
    }
  }
  return oldestIndex;
}

function compareTimestamp(left: string, right: string): number {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return leftTime - rightTime;
  return left.localeCompare(right);
}

function toReviewIdentity(question: ReviewQuestionInput): ReviewQuestion {
  if ('questionId' in question) {
    return {
      questionId: question.questionId,
      weekKey: question.weekKey,
    };
  }

  const suppliedWeekKey = 'weekKey' in question ? question.weekKey : undefined;
  const weekKey = suppliedWeekKey ?? inferWeekKey(question.weekUnitId);
  if (!weekKey) {
    throw new Error(`QuestionItemの所属週を判定できません: ${question.id}`);
  }
  return {
    questionId: question.id,
    weekKey,
  };
}

function inferWeekKey(weekUnitId: string): WeekKey | null {
  const match = weekUnitId.match(/(?:^|-)week(?:-unit-)?([3-6])(?:-|$)/i);
  if (!match) return null;
  return `week${match[1]}` as WeekKey;
}
