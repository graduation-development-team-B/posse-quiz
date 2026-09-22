import type { ContentCatalog, QuestionItem } from '@/types/content';
import type { SessionScope } from '@/types/session';
import { SUPPORTED_WEEK_KEYS } from '@/lib/constants';

/** 出題範囲に含められる週の上限。weekKeysが空、または5週以上なら範囲なしとする。 */
const MAX_SCOPE_WEEKS = SUPPORTED_WEEK_KEYS.length;

/** 公開中かつ削除されていないエンティティかどうかを判定する。 */
export function isActiveEntity(entity: { published: boolean; deleted: boolean }): boolean {
  return entity.published && !entity.deleted;
}

/** Question_Itemが出題可能なactive状態かどうかを判定する。 */
export function isActiveQuestion(question: QuestionItem): boolean {
  return isActiveEntity(question);
}

/**
 * 選択された週だけから出題可能な問題を抽出する。
 *
 * 階層は PH → Week の2段なので、週の所属関係だけを確認する。壊れた参照や
 * 指定範囲外の問題は混入しない。同じQuestion IDがカタログに複数存在しても、
 * 最初の1件だけを残す。
 */
export function selectQuestionPool(
  catalog: ContentCatalog,
  scope: SessionScope,
): QuestionItem[] {
  const selectedWeekKeys = uniqueStrings(scope.weekKeys);
  if (
    selectedWeekKeys.length === 0 ||
    selectedWeekKeys.length > MAX_SCOPE_WEEKS
  ) {
    return [];
  }

  const selectedWeekSet = new Set(selectedWeekKeys);
  const activeWeeks = catalog.weekUnits.filter(
    (week) => isActiveEntity(week) && selectedWeekSet.has(week.key),
  );
  const weekKeyById = new Map(activeWeeks.map((week) => [week.id, week.key]));
  if (weekKeyById.size === 0) return [];

  const seenQuestionIds = new Set<string>();
  return catalog.questions.filter((question) => {
    if (!isActiveQuestion(question) || seenQuestionIds.has(question.id)) return false;

    const questionWeekKey = weekKeyById.get(question.weekUnitId);
    if (questionWeekKey === undefined || !selectedWeekSet.has(questionWeekKey)) return false;

    seenQuestionIds.add(question.id);
    return true;
  });
}

/** 選択範囲に含まれる、出題可能な問題数を返す。 */
export function countQuestionsInScope(
  catalog: ContentCatalog,
  scope: SessionScope,
): number {
  return selectQuestionPool(catalog, scope).filter(question => !question.preview && !question.console).length;
}

/** UIや呼び出し側で扱いやすい別名。 */
export const getQuestionPool = selectQuestionPool;

function uniqueStrings(values: readonly string[] | undefined): string[] {
  if (!values) return [];
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}
