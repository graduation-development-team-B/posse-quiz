import { FREE_TEXT_MAX_LENGTH } from '@/lib/constants';
import { normalizeFreeText } from '@/lib/quiz/normalizeFreeText';
import type { QuestionItem, ChoiceOption } from '@/types/content';

export interface AnswerInput {
  optionId?: string;
  freeText?: string;
  activityCompleted?: boolean;
}

export interface AnswerJudgement {
  /** 確定された解答の正誤。未確定の入力ではfalseになる。 */
  isCorrect: boolean;
  /** 正解選択肢または正解文字列。 */
  correctText: string;
  /** 入力が確定可能か。自由入力の空文字・空白のみ・64文字超ではfalse。 */
  canSubmit: boolean;
  /** 選択した選択肢に対応する誤答理由。存在する場合だけ返す。 */
  incorrectReason?: string;
}

/**
 * Question_Itemの形式に応じて解答を判定する純粋関数。
 *
 * 選択式はoptionIdを、自由入力穴埋めはfreeTextを使う。自由入力では
 * 指定された境界文字だけを正規化し、英字の大小文字を区別した完全一致を行う。
 */
export function judgeAnswer(
  question: QuestionItem,
  answer: AnswerInput,
): AnswerJudgement {
  if (question.format === 'interactive') {
    const completed = answer.activityCompleted === true;
    return {
      isCorrect: completed,
      correctText: '操作ミッション完了',
      canSubmit: completed,
    };
  }

  if (question.format === 'fillBlank' && isFreeTextPayload(question.payload)) {
    return judgeFreeText(question.payload.correctText, answer.freeText);
  }

  if (!hasOptions(question.payload)) {
    return {
      isCorrect: false,
      correctText: '',
      canSubmit: false,
    };
  }

  return judgeOptionAnswer(
    question.payload.options,
    question.payload.correctOptionId,
    question.payload.incorrectReasons,
    answer.optionId,
  );
}

function judgeFreeText(correctText: string, input: string | undefined): AnswerJudgement {
  if (typeof input !== 'string') {
    return {
      isCorrect: false,
      correctText,
      canSubmit: false,
    };
  }

  const inputLength = [...input].length;
  const normalizedInput = normalizeFreeText(input);
  if (normalizedInput.length === 0 || inputLength > FREE_TEXT_MAX_LENGTH) {
    return {
      isCorrect: false,
      correctText,
      canSubmit: false,
    };
  }

  return {
    isCorrect: normalizedInput === correctText,
    correctText,
    canSubmit: true,
  };
}

function judgeOptionAnswer(
  options: readonly ChoiceOption[],
  correctOptionId: string,
  incorrectReasons: Record<string, string> | undefined,
  selectedOptionId: string | undefined,
): AnswerJudgement {
  const correctOption = options.find((option) => option.id === correctOptionId);
  const correctText = correctOption?.text ?? '';
  const canSubmit = typeof selectedOptionId === 'string' && selectedOptionId.length > 0;

  if (!canSubmit || !options.some((option) => option.id === selectedOptionId)) {
    return {
      isCorrect: false,
      correctText,
      canSubmit: false,
    };
  }

  if (selectedOptionId === correctOptionId) {
    return {
      isCorrect: true,
      correctText,
      canSubmit: true,
    };
  }

  const reason = incorrectReasons?.[selectedOptionId];
  return {
    isCorrect: false,
    correctText,
    canSubmit: true,
    ...(typeof reason === 'string' && reason.trim().length > 0
      ? { incorrectReason: reason }
      : {}),
  };
}

function isFreeTextPayload(
  payload: QuestionItem['payload'],
): payload is Extract<QuestionItem['payload'], { mode: 'freeText' }> {
  return 'mode' in payload && payload.mode === 'freeText' && typeof payload.correctText === 'string';
}

function hasOptions(
  payload: QuestionItem['payload'],
): payload is Extract<QuestionItem['payload'], { options: ChoiceOption[]; correctOptionId: string }> {
  return 'options' in payload && Array.isArray(payload.options) && typeof payload.correctOptionId === 'string';
}
