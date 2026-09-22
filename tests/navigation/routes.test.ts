import { describe, expect, it } from 'vitest';
import {
  createImmediateReviewRoute,
  createQuizRoute,
  createResultRoute,
  createTermRoute,
  readSessionId,
  readTermId,
} from '@/lib/navigation/routes';

describe('navigation route boundaries', () => {
  it('creates quiz, result, and term routes with IDs only', () => {
    expect(createQuizRoute('session-123')).toEqual({
      pathname: '/quiz/[sessionId]',
      params: { sessionId: 'session-123' },
    });
    expect(createResultRoute('session-123')).toEqual({
      pathname: '/result/[sessionId]',
      params: { sessionId: 'session-123' },
    });
    expect(createImmediateReviewRoute('session-123')).toEqual({
      pathname: '/immediate-review/[sessionId]',
      params: { sessionId: 'session-123' },
    });
    expect(createTermRoute('term-flexbox')).toEqual({
      pathname: '/term/[termId]',
      params: { termId: 'term-flexbox' },
    });
  });

  it('rejects empty route IDs and ignores non-string URL parameters', () => {
    expect(() => createQuizRoute('')).toThrow('sessionId');
    expect(() => createTermRoute('   ')).toThrow('termId');
    expect(readSessionId({ sessionId: 'session-123', questions: ['not-in-url'] })).toBe('session-123');
    expect(readTermId({ termId: 42 })).toBeNull();
    expect(readSessionId(null)).toBeNull();
  });
});
