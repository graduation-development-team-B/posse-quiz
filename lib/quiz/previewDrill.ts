import type { FillBlankChoicePayload, QuestionItem, PreviewStep } from '@/types/content';

export const DRILL_STORAGE_PREFIX = 'progress:drill:';

export type PreviewQuestion = QuestionItem & { preview: PreviewStep; payload: FillBlankChoicePayload };
export type CodeQuestion = QuestionItem & { payload: FillBlankChoicePayload };
export function isPreviewQuestion(question: QuestionItem): question is PreviewQuestion {
  return !!question.preview && question.payload.kind === 'fillBlank' && question.payload.mode === 'choice';
}
export function getDrillSteps(questions: QuestionItem[], id: string): PreviewQuestion[] {
  return questions.filter(isPreviewQuestion).filter(q => q.published && !q.deleted && q.preview.drillId === id)
    .sort((a, b) => a.preview.step - b.preview.step);
}
export function codeForSelection(question: CodeQuestion, selected: string): string {
  const token = question.payload.options.find(option => option.id === selected)?.text ?? '';
  return question.payload.content.replace(question.payload.blankToken, token);
}
export interface DrillAttempt {
  completed: number;
  selected: string;
  executed: string | null;
}
export const emptyAttempt = (): DrillAttempt => ({ completed: 0, selected: '', executed: null });
export function restoreAttempt(raw: string | null, steps: CodeQuestion[]): DrillAttempt {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || !Number.isInteger(value.completed) || value.completed < 0 || value.completed > steps.length) return emptyAttempt();
    const question = steps[value.completed];
    const validId = (id: unknown) => id === '' || (typeof id === 'string' && question?.payload.options.some(o => o.id === id));
    return { completed: value.completed, selected: validId(value.selected) ? value.selected : '', executed: validId(value.executed) ? value.executed : null };
  } catch { return emptyAttempt(); }
}
export function canSubmit(attempt: DrillAttempt): boolean {
  return !!attempt.selected && attempt.selected === attempt.executed;
}
export function judgeStep(question: CodeQuestion, attempt: DrillAttempt): boolean {
  return canSubmit(attempt) && attempt.selected === question.payload.correctOptionId;
}
