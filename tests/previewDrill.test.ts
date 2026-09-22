import { describe, expect, it } from 'vitest';
import fixture from '../mock-api/catalog.json';
import type { ApiResponse } from '@/types/content';
import { validateApiResponse } from '@/lib/content/validateApiResponse';
import { canSubmit, codeForSelection, emptyAttempt, getDrillSteps, judgeStep, restoreAttempt } from '@/lib/quiz/previewDrill';
import { buildPreviewDocument } from '@/lib/quiz/previewDocument';
import { createSessionForScope } from '@/lib/quiz/sessionManager';

const response = fixture as ApiResponse;
describe('Week01 preview drills', () => {
  for (const id of ['movie', 'artist', 'event']) {
    it(`${id}: 6ステップを順に解き、最後に完成コードになる`, () => {
      const steps = getDrillSteps(response.catalog.questions, `week1-${id}`);
      expect(steps).toHaveLength(6);
      let attempt = emptyAttempt();
      steps.forEach((question, index) => {
        expect(question.preview.step).toBe(index + 1);
        const selected = question.payload.correctOptionId;
        attempt = { ...attempt, selected };
        expect(canSubmit(attempt)).toBe(false);
        attempt = { ...attempt, executed: selected };
        expect(judgeStep(question, attempt)).toBe(true);
        const resolved = codeForSelection(question, selected);
        if (index === steps.length - 1) expect(resolved).toBe(question.preview.goalCode);
        else {
          // 次ステップには、このステップまでに入力した全クラスが保持される。
          const next = steps[index + 1];
          expect(codeForSelection(next, '')).toBe(resolved);
        }
        attempt = { completed: index + 1, selected: '', executed: null };
      });
      expect(restoreAttempt(JSON.stringify(attempt), steps).completed).toBe(6);
    });
  }
  it('不正解・編集後の古い実行結果ではクリアしない', () => {
    const [q] = getDrillSteps(response.catalog.questions, 'week1-movie');
    const wrong = q.payload.options.find(o => o.id !== q.payload.correctOptionId)!.id;
    expect(judgeStep(q, { completed: 0, selected: wrong, executed: wrong })).toBe(false);
    expect(judgeStep(q, { completed: 0, selected: q.payload.correctOptionId, executed: wrong })).toBe(false);
  });
  it('入力・実行状態を復元し、壊れた保存データは初期化する', () => {
    const steps = getDrillSteps(response.catalog.questions, 'week1-artist');
    const attempt = { completed: 2, selected: 'option-3', executed: 'option-2' };
    expect(restoreAttempt(JSON.stringify(attempt), steps)).toEqual(attempt);
    for (const raw of ['broken', '{"completed":100}', '{"completed":-1}']) expect(restoreAttempt(raw, steps)).toEqual(emptyAttempt());
  });
  it('ドリルを通常のランダムクイズへ混在させない', () => {
    expect(createSessionForScope(response.catalog, { weekKeys: ['week1'] }, 5)).toBeNull();
  });
  it('ステップの欠番と不正なメタデータをAPI境界で拒否する', () => {
    const missing = structuredClone(response);
    missing.catalog.questions.splice(0, 1);
    const result = validateApiResponse(missing);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some(i => i.code === 'question.preview.sequence')).toBe(true);
    const invalid = structuredClone(response);
    invalid.catalog.questions[0].preview!.step = 0;
    expect(validateApiResponse(invalid).ok).toBe(false);
  });
  it('プレビューはローカル画像とCSSのみを使いスクリプト・通信を許可しない', () => {
    const [q] = getDrillSteps(response.catalog.questions, 'week1-event');
    const doc = buildPreviewDocument(q.preview.goalCode);
    expect(doc).toContain("default-src 'none'");
    expect(doc).toContain('data:image/svg+xml,');
    expect(doc).toContain('.bg-orange-500{background-color:#f97316}');
    expect(doc).not.toContain('src="./images/');
    expect(doc).not.toContain('<script');
  });
});
