import { describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';

import {
  ContentApiHttpError,
  ContentApiJsonParseError,
  ContentApiTimeoutError,
} from '@/lib/content/ContentApiClient';
import { ContentSyncManager } from '@/lib/content/ContentSyncManager';
import type { ApiResponse, ContentCache } from '@/types/content';
import { assertProperty } from '../pbt';
import { validApiResponseArb } from '../generators/catalog';

type InvalidResponseCase = {
  kind: 'invalid-response';
  response: ApiResponse;
  questionId: string;
};

type TransportFailureCase = {
  kind: 'transport-failure';
  error: Error;
};

type FailureCase = InvalidResponseCase | TransportFailureCase;

const invalidResponseArb: fc.Arbitrary<InvalidResponseCase> = validApiResponseArb().chain((input) =>
  fc.constantFrom('missing-source', 'invalid-options').map((violation) => {
    const response = JSON.parse(JSON.stringify(input)) as ApiResponse;
    const question = response.catalog.questions[0]!;

    if (violation === 'missing-source') {
      delete (question as unknown as { sourceReference?: unknown }).sourceReference;
    } else {
      const payload = question.payload as Extract<ApiResponse['catalog']['questions'][number]['payload'], { kind: 'choice' }>;
      if (payload.kind === 'choice') {
        payload.options = payload.options.slice(0, 3);
      }
    }

    return {
      kind: 'invalid-response' as const,
      response,
      questionId: question.id,
    };
  }),
);

const transportFailureArb: fc.Arbitrary<TransportFailureCase> = fc.oneof(
  fc.integer({ min: 1, max: 8_000 }).map((timeoutMs) => ({
    kind: 'transport-failure' as const,
    error: new ContentApiTimeoutError(timeoutMs),
  })),
  fc.constantFrom(400, 408, 429, 500, 504).map((status) => ({
    kind: 'transport-failure' as const,
    error: new ContentApiHttpError(status, 'generated failure'),
  })),
  fc.string({ minLength: 1, maxLength: 20 }).map((cause) => ({
    kind: 'transport-failure' as const,
    error: new ContentApiJsonParseError(new SyntaxError(cause)),
  })),
);

const failureCaseArb: fc.Arbitrary<FailureCase> = fc.oneof(
  invalidResponseArb,
  transportFailureArb,
);

function makeCache(response: ApiResponse): ContentCache {
  return {
    response,
    apiVersion: 'v1',
    cachedAt: '2025-01-01T00:00:00.000Z',
  };
}

describe('Property 2: 不正レスポンスの全体拒否とfallback', () => {
  it('契約違反・timeout・HTTP/JSON失敗を部分採用せずcache/errorへ安全に分岐する', async () => {
    // Feature: curriculum-quiz-app, Property 2: 不正レスポンスは全体拒否し、安全なfallbackへ分岐する
    // **Validates: Requirements 1.11, 1.12, 1.15, 1.16, 9.19, 9.20, 12.5**
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await assertProperty(
      fc.asyncProperty(
        validApiResponseArb(),
        fc.boolean(),
        failureCaseArb,
        async (fallbackResponse, hasCache, failure) => {
          const fallbackCache = hasCache ? makeCache(fallbackResponse) : null;
          let persistedCache = fallbackCache;
          const writeAtomically = vi.fn(async (next: ContentCache) => {
            persistedCache = next;
          });
          const apiClient = {
            fetchCatalog: vi.fn(async () => {
              if (failure.kind === 'invalid-response') return failure.response;
              throw failure.error;
            }),
          };
          const cacheStore = {
            read: vi.fn(async () => persistedCache),
            writeAtomically,
            removePreviousAfterCommit: vi.fn(async () => undefined),
          };
          const manager = new ContentSyncManager({
            apiClient,
            cacheStore,
            apiVersion: 'v1',
            now: () => '2025-01-02T00:00:00.000Z',
          });

          await manager.initialize();
          await manager.refresh('manual');

          // API失敗時は新版をcommitせず、部分的なカタログもmemory/cacheへ入れない。
          expect(writeAtomically).not.toHaveBeenCalled();
          expect(persistedCache).toBe(fallbackCache);

          if (hasCache) {
            expect(manager.getCatalog()).toBe(fallbackResponse.catalog);
            expect(manager.getState()).toBe('using-cache');
          } else {
            expect(manager.getCatalog()).toBeNull();
            expect(manager.getState()).toBe('error');
            expect(manager.getMessage()).toContain('再試行');
          }

          if (failure.kind === 'invalid-response') {
            const loggedCalls = JSON.stringify(warn.mock.calls);
            expect(loggedCalls).toContain(failure.questionId);
          }

          // retry()が利用可能で、失敗後も同じ安全な状態を維持する。
          await manager.retry();
          expect(manager.getState()).toBe(hasCache ? 'using-cache' : 'error');
          expect(manager.getCatalog()).toBe(hasCache ? fallbackResponse.catalog : null);
        },
      ),
    );
  });
});
