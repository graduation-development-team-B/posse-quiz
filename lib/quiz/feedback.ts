import { judgeAnswer, type AnswerInput } from '@/lib/quiz/answerJudge';
import { linkFirstTermOccurrences, type TermLinkSegment } from '@/lib/glossary/termLinker';
import type { ContentCatalog, QuestionItem, SourceReference } from '@/types/content';
import type { AnswerRecord } from '@/types/session';

/** Feedback画面が直接表示できる、判定済み問題の表示モデル。 */
export interface FeedbackViewModel {
  questionId: string;
  isCorrect: boolean;
  /** 正解選択肢の内容、または自由入力問題の正解文字列。 */
  correctText: string;
  /** 省略・切り詰めを行わない解説全文。 */
  explanation: string;
  /** explanationを表示する際に使う、用語リンク付きのセグメント。 */
  explanationSegments: TermLinkSegment[];
  sourceReference: SourceReference;
  /** Content_Catalogに理由がない場合はundefinedで、表示領域を作らない。 */
  incorrectReason?: string;
}

/**
 * AnswerRecordと教材カタログをFeedback表示用の一つのモデルへまとめる。
 * 判定結果は確定済みAnswerRecordを正とし、正解内容・誤り理由は同じQuestion_Itemを
 * AnswerJudgeへ渡して解決する。
 */
export function buildFeedback(
  question: QuestionItem,
  answer: AnswerRecord,
  catalog: ContentCatalog,
): FeedbackViewModel {
  const judgement = judgeAnswer(question, toAnswerInput(answer));
  const activeTerms = catalog.terms.filter((term) => term.published && !term.deleted);
  const incorrectReason = !answer.isCorrect ? judgement.incorrectReason : undefined;

  return {
    questionId: question.id,
    isCorrect: answer.isCorrect,
    correctText: judgement.correctText,
    explanation: question.explanation,
    explanationSegments: linkFirstTermOccurrences(question.explanation, activeTerms),
    sourceReference: question.sourceReference,
    ...(incorrectReason !== undefined ? { incorrectReason } : {}),
  };
}

function toAnswerInput(answer: AnswerRecord): AnswerInput {
  return {
    ...(answer.selectedOptionId !== undefined
      ? { optionId: answer.selectedOptionId }
      : {}),
    ...(answer.freeText !== undefined ? { freeText: answer.freeText } : {}),
    ...(answer.activityCompleted !== undefined
      ? { activityCompleted: answer.activityCompleted }
      : {}),
  };
}
