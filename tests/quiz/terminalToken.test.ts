import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { judgeAnswer } from '@/lib/quiz/answerJudge';
import {
  createTerminalStageState,
  resolveTerminalStage,
  runTerminalStageCommand,
} from '@/lib/quiz/terminalToken';
import type {
  ApiResponse,
  InteractiveQuestionPayload,
  QuestionItem,
  TerminalStage,
} from '@/types/content';

function fixture(): ApiResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'mock-api/catalog.json'), 'utf8'),
  ) as ApiResponse;
}

function stage(id: string): TerminalStage {
  const target = fixture().catalog.activities[0]!.stages.find((candidate) => candidate.id === id);
  if (!target) throw new Error(`stage not found: ${id}`);
  return target;
}

describe('terminalToken engine', () => {
  it('誤った組み合わせは履歴エラーだけを追加し、goal進捗や正誤を確定しない', () => {
    const target = stage('git-level1-stage-003-clone');
    const initial = createTerminalStageState(target);

    const next = runTerminalStageCommand(target, initial, ['git', 'pull']);

    expect(next.completedCommandCount).toBe(0);
    expect(next.isComplete).toBe(false);
    expect(next.history.at(-1)).toMatchObject({ isError: true, command: 'git pull' });
  });

  it('2つのgit addを教材順に実行したときだけstageを完了する', () => {
    const target = stage('git-level1-stage-006-add-files');
    const initial = createTerminalStageState(target);
    const afterFirst = runTerminalStageCommand(target, initial, ['git', 'add', 'index.html']);
    const completed = runTerminalStageCommand(
      target,
      afterFirst,
      ['git', 'add', 'assets/img/me.png'],
    );

    expect(afterFirst).toMatchObject({ completedCommandCount: 1, isComplete: false });
    expect(completed).toMatchObject({ completedCommandCount: 2, isComplete: true });
  });

  it('pull stageではcheckout前のpullを進捗にせず、正しい順番で完了する', () => {
    const target = stage('git-level1-stage-010-pull');
    const initial = createTerminalStageState(target);
    const outOfOrder = runTerminalStageCommand(
      target,
      initial,
      ['git', 'pull', 'origin', 'main_0.0_name'],
    );
    const checkedOut = runTerminalStageCommand(
      target,
      outOfOrder,
      ['git', 'checkout', 'main_0.0_name'],
    );
    const completed = runTerminalStageCommand(
      target,
      checkedOut,
      ['git', 'pull', 'origin', 'main_0.0_name'],
    );

    expect(outOfOrder.completedCommandCount).toBe(0);
    expect(outOfOrder.history.at(-1)?.isError).toBe(true);
    expect(completed.isComplete).toBe(true);
  });

  it('Question payloadからstageを解決し、goal達成時だけ回答確定できる', () => {
    const response = fixture();
    const question = response.catalog.questions.find((candidate) => candidate.format === 'interactive') as QuestionItem;
    const payload = question.payload as InteractiveQuestionPayload;

    expect(resolveTerminalStage(response.catalog, payload)?.stage.id).toBe(payload.stageId);
    expect(judgeAnswer(question, { activityCompleted: false })).toMatchObject({
      canSubmit: false,
      isCorrect: false,
    });
    expect(judgeAnswer(question, { activityCompleted: true })).toEqual({
      canSubmit: true,
      correctText: '操作ミッション完了',
      isCorrect: true,
    });
  });
});
