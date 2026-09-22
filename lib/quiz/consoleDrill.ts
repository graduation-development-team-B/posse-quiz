import type { ConsoleStep, QuestionItem } from '@/types/content';
import { canSubmit, type CodeQuestion, type DrillAttempt } from './previewDrill';
import type { ConsoleResult } from './consoleExecution';

export type ConsoleQuestion = CodeQuestion & { console: ConsoleStep };
export function isConsoleQuestion(q: QuestionItem): q is ConsoleQuestion {
  return !!q.console && q.payload.kind === 'fillBlank' && q.payload.mode === 'choice';
}
export function getConsoleSteps(questions: QuestionItem[], id: string): ConsoleQuestion[] {
  return questions.filter(isConsoleQuestion).filter(q => q.published && !q.deleted && q.console.drillId === id)
    .sort((a, b) => a.console.step - b.console.step);
}
export function judgeConsoleStep(question: ConsoleQuestion, attempt: DrillAttempt, result: ConsoleResult | null): boolean {
  return canSubmit(attempt) && attempt.selected === question.payload.correctOptionId && result?.status === 'success'
    && result.lines.length === question.console.expectedOutput.length
    && result.lines.every((line, index) => line === question.console.expectedOutput[index]);
}
