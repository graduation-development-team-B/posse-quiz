import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

import { linkFirstTermOccurrences } from '@/lib/glossary/termLinker';
import type { TermEntry } from '@/types/content';
import { assertProperty } from '../pbt';

const TERM_LETTERS = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
const EXPLANATION_NOISE = ['解説', '確認', '理由', '学習', 'します'] as const;

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

function swapCase(value: string): string {
  return value
    .split('')
    .map((character) => character === character.toUpperCase()
      ? character.toLowerCase()
      : character.toUpperCase())
    .join('');
}

const scenarioArb = fc.record({
  termIndices: fc.uniqueArray(fc.integer({ min: 0, max: TERM_LETTERS.length - 1 }), {
    minLength: 1,
    maxLength: 6,
  }),
  unknownIndices: fc.uniqueArray(fc.integer({ min: 0, max: 25 }), {
    minLength: 1,
    maxLength: 6,
  }),
  prefixNoise: fc.array(fc.constantFrom(...EXPLANATION_NOISE), { maxLength: 4 }),
  suffixNoise: fc.array(fc.constantFrom(...EXPLANATION_NOISE), { maxLength: 4 }),
}).map(({ termIndices, unknownIndices, prefixNoise, suffixNoise }) => {
  const terms = termIndices.map((index) => term(`term-${TERM_LETTERS[index]}`, `Term${TERM_LETTERS[index]}`));
  const firstOccurrences = terms.map((registeredTerm, index) =>
    index % 2 === 0 ? registeredTerm.name : swapCase(registeredTerm.name));
  const laterOccurrences = terms.map((registeredTerm, index) =>
    index % 2 === 0 ? swapCase(registeredTerm.name) : registeredTerm.name);
  const unknownWords = unknownIndices.map((index) => `Unknown${TERM_LETTERS[index]}`);
  const explanationTokens = [
    ...prefixNoise,
    ...unknownWords,
    ...firstOccurrences,
    ...laterOccurrences,
    ...suffixNoise,
  ];

  return {
    terms,
    explanation: explanationTokens.join('。'),
    firstOccurrences,
    unknownWords,
  };
});

describe('Property 11: Feedback用語リンクの最初の一致だけを検証する', () => {
  it('各用語の最初の完全一致だけをリンクし、未登録語は通常テキストにする', () => {
    // Feature: curriculum-quiz-app, Property 11: Feedbackの用語リンクは各用語の最初の一致だけをリンクする
    // **Validates: Requirements 5.7、5.8**
    assertProperty(
      fc.property(scenarioArb, ({ terms, explanation, firstOccurrences, unknownWords }) => {
        const segments = linkFirstTermOccurrences(explanation, terms);
        const registeredTermIds = new Set(terms.map((registeredTerm) => registeredTerm.id));

        for (const [index, registeredTerm] of terms.entries()) {
          const linkedSegments = segments.filter((segment) => segment.termId === registeredTerm.id);

          expect(linkedSegments).toHaveLength(1);
          expect(linkedSegments[0].text.toLocaleLowerCase()).toBe(
            firstOccurrences[index].toLocaleLowerCase(),
          );
          expect(linkedSegments[0].text.toLocaleLowerCase()).toBe(registeredTerm.name.toLocaleLowerCase());
        }

        for (const unknownWord of unknownWords) {
          const containingSegments = segments.filter((segment) => segment.text.includes(unknownWord));

          expect(containingSegments.length).toBeGreaterThan(0);
          expect(containingSegments.every((segment) => segment.termId === undefined)).toBe(true);
        }

        expect(segments.every((segment) =>
          segment.termId === undefined || registeredTermIds.has(segment.termId),
        )).toBe(true);
      }),
    );
  });
});
