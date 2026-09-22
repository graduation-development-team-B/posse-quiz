import { describe, expect, it } from 'vitest';
import { TERM_CHECK_MIN_TERMS, TERM_CHECK_SESSION_COUNT } from '@/lib/constants';
import { linkFirstTermOccurrences } from '@/lib/glossary/termLinker';
import type { TermEntry } from '@/types/content';

function term(id: string, name: string): TermEntry {
  return {
    id,
    name,
    weekUnitId: 'week-unit-week3',
    definition: '用語の意味を確認するための十分な説明文です。',
    usageExamples: ['使用例です。'],
    sourceReference: { weekKey: 'week3', sectionHeading: '基本' },
    relatedTermNames: [],
    published: true,
    deleted: false,
  };
}

describe('linkFirstTermOccurrences', () => {
  it('英字大小文字を無視して各用語の最初の一致だけをリンク化する', () => {
    expect(linkFirstTermOccurrences(
      'Flexboxで配置します。flexboxは便利です。未登録語も残します。',
      [term('term-flexbox', 'Flexbox')],
    )).toEqual([
      { text: 'Flexbox', termId: 'term-flexbox' },
      { text: 'で配置します。flexboxは便利です。未登録語も残します。' },
    ]);
  });

  it('英数字の一部一致をリンク化しない', () => {
    expect(linkFirstTermOccurrences(
      'flex-directionとflexを使います。',
      [term('term-flex', 'flex')],
    )).toEqual([
      { text: 'flex-directionと' },
      { text: 'flex', termId: 'term-flex' },
      { text: 'を使います。' },
    ]);
  });

  it('用語が見つからない場合は全文を通常テキストで返す', () => {
    expect(linkFirstTermOccurrences('登録用語はありません。', [term('term-x', 'Flexbox')]))
      .toEqual([{ text: '登録用語はありません。' }]);
  });

  it('用語確認は4件未満では開始条件を満たさず、開始時の問題数は5件である', () => {
    expect(TERM_CHECK_MIN_TERMS).toBe(4);
    expect([0, 1, 2, 3].every((count) => count < TERM_CHECK_MIN_TERMS)).toBe(true);
    expect(4 >= TERM_CHECK_MIN_TERMS).toBe(true);
    expect(TERM_CHECK_SESSION_COUNT).toBe(5);
  });
});
