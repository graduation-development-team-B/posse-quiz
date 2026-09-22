import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from '../mock-api/catalog.json';
import type { ApiResponse } from '@/types/content';
import { validateApiResponse } from '@/lib/content/validateApiResponse';
import { getConsoleSteps, judgeConsoleStep } from '@/lib/quiz/consoleDrill';
import { codeForSelection, restoreAttempt } from '@/lib/quiz/previewDrill';
import { buildConsoleWorkerSource, CONSOLE_TIMEOUT_MS, runConsoleCode, type ConsoleResult } from '@/lib/quiz/consoleExecution';
import { createSessionForScope } from '@/lib/quiz/sessionManager';
import { countQuestionsInScope } from '@/lib/quiz/scope';

const response = fixture as ApiResponse;
function execute(code: string): ConsoleResult {
  let result: ConsoleResult | undefined;
  runInNewContext(buildConsoleWorkerSource(code), { self: { postMessage: (value: ConsoleResult) => { result = value; } } }, { timeout: 500 });
  return JSON.parse(JSON.stringify(result));
}
describe('Week06 console drills', () => {
  it('既存Week06の15問の内容と順序をそのまま保持する', () => {
    const original = response.catalog.questions.filter(q => q.weekUnitId === 'week-unit-week6' && !q.console);
    expect(original).toHaveLength(15);
    expect(createHash('sha256').update(JSON.stringify(original)).digest('hex')).toBe('4a5bcb3275ab38a349db61304187019ecd991cf1aa4dd66555ddecbe8b5c29f6');
    expect(countQuestionsInScope(response.catalog, { weekKeys: ['week6'] })).toBe(15);
    const session = createSessionForScope(response.catalog, { weekKeys: ['week6'] }, 10)!;
    expect(session.questions).toHaveLength(10);
    expect(session.questions.every(q => !q.console && !q.preview)).toBe(true);
  });
  for (const id of ['split', 'type-bug', 'snacks']) {
    it(`${id}: 全6ステップの全候補を実行でき、正答は期待した出力になる`, () => {
      const steps = getConsoleSteps(response.catalog.questions, `week6-${id}`);
      expect(steps).toHaveLength(6);
      steps.forEach((question, index) => {
        expect(question.console.step).toBe(index + 1);
        for (const option of question.payload.options) {
          const result = execute(codeForSelection(question, option.id));
          expect(judgeConsoleStep(question, { completed: index, selected: option.id, executed: option.id }, result)).toBe(option.id === question.payload.correctOptionId);
          if (option.id === question.payload.correctOptionId) {
            expect(result.status).toBe('success');
            expect(result.lines).toEqual(question.console.expectedOutput);
          }
        }
      });
      const last = steps.at(-1)!;
      expect(codeForSelection(last, last.payload.correctOptionId)).toBe(last.console.goalCode);
    });
  }
  it('完成した割り勘・修正課題・小計が通常値と境界値を満たす', () => {
    const finalOutput = (id: string) => execute(getConsoleSteps(response.catalog.questions, `week6-${id}`)[0].console.goalCode).lines;
    expect(finalOutput('split')).toEqual(['1人あたり: ¥334', '入力を確認してください', '入力を確認してください', '1人あたり: ¥1000']);
    expect(finalOutput('type-bug')).toEqual(['1667 円', '入力を確認してください', '入力を確認してください', '入力を確認してください']);
    expect(finalOutput('snacks')).toEqual(['450', '400', '入力を確認してください', '入力を確認してください', '入力を確認してください', '0']);
  });
  it('正答でも未実行・古い実行・出力不一致は採点を通さない', () => {
    const [q] = getConsoleSteps(response.catalog.questions, 'week6-split');
    const attempt = { completed: 0, selected: q.payload.correctOptionId, executed: null };
    const result = execute(codeForSelection(q, q.payload.correctOptionId));
    expect(judgeConsoleStep(q, attempt, result)).toBe(false);
    expect(judgeConsoleStep(q, { ...attempt, executed: 'option-2' }, result)).toBe(false);
    expect(judgeConsoleStep(q, { ...attempt, executed: attempt.selected }, { status: 'success', lines: ['wrong'] })).toBe(false);
  });
  it('保存した入力と完了数を復元できる', () => {
    const steps = getConsoleSteps(response.catalog.questions, 'week6-snacks');
    const attempt = { completed: 4, selected: 'option-2', executed: null };
    expect(restoreAttempt(JSON.stringify(attempt), steps)).toEqual(attempt);
    expect(restoreAttempt('{"completed":99}', steps).completed).toBe(0);
  });
  it('API境界で欠番・無効な期待出力・形式重複を拒否する', () => {
    expect(validateApiResponse(response).ok).toBe(true);
    const missing = structuredClone(response);
    missing.catalog.questions = missing.catalog.questions.filter(q => q.id !== 'question-week6-console-split-2');
    expect(validateApiResponse(missing).ok).toBe(false);
    const invalid = structuredClone(response);
    const q = invalid.catalog.questions.find(q => q.console)!;
    q.console!.expectedOutput = [];
    expect(validateApiResponse(invalid).ok).toBe(false);
    q.console!.expectedOutput = ['1000 number'];
    q.preview = { ...q.console! };
    expect(validateApiResponse(invalid).ok).toBe(false);
  });
  it('実行時エラー・NaN・出力制限を区別し、通信APIを公開しない', () => {
    expect(execute('console.log(Number("abc"));').lines).toEqual(['NaN']);
    expect(execute('console.log(missing);').status).toBe('runtimeError');
    expect(execute('for (let i = 0; i < 100; i++) console.log(i);').status).toBe('outputLimit');
    expect(execute('console.log(typeof self.fetch, typeof self.WebSocket);').lines).toEqual(['undefined undefined']);
  });
});

describe('console Worker lifecycle', () => {
  class FakeWorker {
    static latest: FakeWorker;
    onmessage: ((event: { data: ConsoleResult }) => void) | null = null;
    onerror: ((event: { message: string; preventDefault: () => void }) => void) | null = null;
    terminate = vi.fn();
    constructor() { FakeWorker.latest = this; }
  }
  function prepare() {
    vi.useFakeTimers();
    vi.stubGlobal('Worker', FakeWorker);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  }
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  it('時間切れでWorkerを終了しURLを解放する', async () => {
    prepare();
    const execution = runConsoleCode('while (true) {}');
    await vi.advanceTimersByTimeAsync(CONSOLE_TIMEOUT_MS);
    expect((await execution.result).status).toBe('timeout');
    expect(FakeWorker.latest.terminate).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
  it('中止後の遅い応答を無視し、リソースを二重解放しない', async () => {
    prepare();
    const execution = runConsoleCode('console.log(1)');
    execution.cancel();
    FakeWorker.latest.onmessage?.({ data: { status: 'success', lines: ['1'] } });
    expect((await execution.result).status).toBe('unavailable');
    expect(FakeWorker.latest.terminate).toHaveBeenCalledOnce();
  });
  it('構文エラーを返してWorkerを終了する', async () => {
    prepare();
    const execution = runConsoleCode('const = ;');
    FakeWorker.latest.onerror?.({ message: 'SyntaxError: Unexpected token', preventDefault: vi.fn() });
    expect((await execution.result).status).toBe('syntaxError');
    expect(FakeWorker.latest.terminate).toHaveBeenCalledOnce();
  });
});
