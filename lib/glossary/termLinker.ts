/**
 * 解説文中の教材用語を、辞書詳細へ遷移できるセグメントへ分割する。
 *
 * 用語の比較は英字の大小文字を区別せず、用語名の前後が英数字・アンダースコアに
 * 接している場合は部分一致として扱う。これにより、`flex` が `flex-direction` の
 * 一部として誤ってリンク化されることを防ぐ。入力配列と用語オブジェクトは変更しない。
 */
import type { TermEntry } from '@/types/content';

export interface TermLinkSegment {
  text: string;
  /** 辞書へ遷移できる場合だけ設定される。 */
  termId?: string;
}

interface TermOccurrence {
  start: number;
  end: number;
  termId: string;
  order: number;
}

/**
 * 解説内の各TermEntryについて、最初の完全一致だけをリンク化する。
 * 未登録の文字列と、同じ用語の2回目以降の出現は通常テキストとして返す。
 */
export function linkFirstTermOccurrences(
  explanation: string,
  terms: readonly TermEntry[],
): TermLinkSegment[] {
  if (explanation.length === 0) return [];

  const occurrences = terms
    .map((term, order) => {
      const start = findFirstOccurrence(explanation, term.name);
      return start === -1
        ? null
        : { start, end: start + term.name.length, termId: term.id, order };
    })
    .filter((occurrence): occurrence is TermOccurrence => occurrence !== null)
    .sort(compareOccurrences);

  const segments: TermLinkSegment[] = [];
  let cursor = 0;
  for (const occurrence of occurrences) {
    // Overlapping matches cannot both be represented by non-overlapping text
    // segments. Prefer the earlier match, then the longer match at one offset.
    if (occurrence.start < cursor) continue;

    if (occurrence.start > cursor) {
      segments.push({ text: explanation.slice(cursor, occurrence.start) });
    }
    segments.push({
      text: explanation.slice(occurrence.start, occurrence.end),
      termId: occurrence.termId,
    });
    cursor = occurrence.end;
  }

  if (cursor < explanation.length) {
    segments.push({ text: explanation.slice(cursor) });
  }

  return segments;
}

function findFirstOccurrence(text: string, termName: string): number {
  if (termName.length === 0) return -1;

  const normalizedText = text.toLocaleLowerCase();
  const normalizedTerm = termName.toLocaleLowerCase();
  let searchFrom = 0;

  while (searchFrom <= normalizedText.length - normalizedTerm.length) {
    const index = normalizedText.indexOf(normalizedTerm, searchFrom);
    if (index === -1) return -1;

    const end = index + normalizedTerm.length;
    if (isCompleteOccurrence(text, index, end)) return index;
    searchFrom = index + 1;
  }

  return -1;
}

function isCompleteOccurrence(text: string, start: number, end: number): boolean {
  return !isTermPartCharacter(text[start - 1]) && !isTermPartCharacter(text[end]);
}

function isTermPartCharacter(character: string | undefined): boolean {
  // ハイフンもCSS識別子の一部として扱い、`flex` in `flex-direction`を除外する。
  return character !== undefined && /[A-Za-z0-9_-]/.test(character);
}

function compareOccurrences(left: TermOccurrence, right: TermOccurrence): number {
  if (left.start !== right.start) return left.start - right.start;

  const leftLength = left.end - left.start;
  const rightLength = right.end - right.start;
  if (leftLength !== rightLength) return rightLength - leftLength;
  return left.order - right.order;
}
