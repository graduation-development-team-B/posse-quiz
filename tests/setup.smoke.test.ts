/**
 * テスト実行環境の動作確認
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SUPPORTED_WEEK_KEYS, DEFAULT_QUESTION_COUNT, ALLOWED_QUESTION_COUNTS } from '@/lib/constants';

describe('テスト環境', () => {
  it('定数が正しく定義されている', () => {
    expect(SUPPORTED_WEEK_KEYS).toEqual(['week1', 'git_github_level1', 'week3', 'week4', 'week5', 'week6']);
    expect(DEFAULT_QUESTION_COUNT).toBe(5);
    expect(ALLOWED_QUESTION_COUNTS).toContain(3);
    expect(ALLOWED_QUESTION_COUNTS).toContain(5);
    expect(ALLOWED_QUESTION_COUNTS).toContain(10);
  });

  it('fast-check が動作する', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (n) => {
        return n >= 0 && n <= 100;
      }),
      { numRuns: 100 },
    );
  });

  it('localStorage モックが動作する', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    localStorage.removeItem('test');
    expect(localStorage.getItem('test')).toBeNull();
  });
});
