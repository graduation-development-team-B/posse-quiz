/**
 * テストで差し替え可能な外部境界の実装。
 * 時刻・乱数・HTTP・ストレージを実環境から切り離し、Vitest と PBT の
 * どちらからも同じ決定的なテストダブルを利用できるようにする。
 */

import { vi } from 'vitest';
import type { StorageAdapter } from '@/lib/storage/StorageAdapter';

export interface TestClock {
  now(): Date;
  nowIso(): string;
  advance(milliseconds: number): void;
  set(value: Date | string | number): void;
}

export function createTestClock(initial: Date | string | number = '2025-01-01T00:00:00.000Z'): TestClock {
  let current = toMilliseconds(initial);

  return {
    now: () => new Date(current),
    nowIso: () => new Date(current).toISOString(),
    advance: (milliseconds) => {
      if (!Number.isFinite(milliseconds)) {
        throw new Error('テスト時刻の進行幅は有限数で指定してください');
      }
      current += milliseconds;
    },
    set: (value) => {
      current = toMilliseconds(value);
    },
  };
}

export function installTestClock(clock: TestClock): void {
  vi.useFakeTimers();
  vi.setSystemTime(clock.now());

  const advance = clock.advance.bind(clock);
  const set = clock.set.bind(clock);
  clock.advance = (milliseconds) => {
    advance(milliseconds);
    vi.setSystemTime(clock.now());
  };
  clock.set = (value) => {
    set(value);
    vi.setSystemTime(clock.now());
  };
}

export interface TestRandomSource {
  next(): number;
  values(): readonly number[];
  reset(): void;
}

/** 乱数列を循環させる決定的な RandomSource。 */
export function createTestRandom(values: readonly number[] = [0.5]): TestRandomSource {
  if (values.length === 0 || values.some((value) => value < 0 || value >= 1 || !Number.isFinite(value))) {
    throw new Error('テスト乱数は0以上1未満の有限数を1件以上指定してください');
  }

  let index = 0;
  return {
    next: () => {
      const value = values[index % values.length];
      index += 1;
      return value;
    },
    values: () => values,
    reset: () => {
      index = 0;
    },
  };
}

export interface TestApiResponseOptions {
  status?: number;
  body?: unknown;
  contentType?: string;
  delayMs?: number;
  error?: Error;
}

export interface TestApiCall {
  input: unknown;
  init?: unknown;
}

export interface TestApiDouble {
  fetch: (input: unknown, init?: unknown) => Promise<Response>;
  calls: readonly TestApiCall[];
  respond(options: TestApiResponseOptions): void;
  fail(error: Error): void;
  install(): void;
}

/**
 * Content_API 用の fetch ダブル。
 * 呼び出し履歴、HTTPステータス、Content-Type、不正JSON、遅延、通信例外を
 * テストごとに設定できる。
 */
export function createTestApiDouble(
  initial: TestApiResponseOptions = { status: 200, body: {} },
): TestApiDouble {
  let response = normalizeApiResponse(initial);
  const calls: TestApiCall[] = [];
  const fetch = async (input: unknown, init?: unknown): Promise<Response> => {
    calls.push({ input, init });
    if (response.delayMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, response.delayMs));
    }
    if (response.error) throw response.error;

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-type' ? response.contentType : null,
      },
      json: async () => response.body,
      text: async () => (typeof response.body === 'string' ? response.body : JSON.stringify(response.body)),
    } as Response;
  };

  return {
    fetch,
    calls,
    respond: (options) => {
      response = normalizeApiResponse(options);
    },
    fail: (error) => {
      response = normalizeApiResponse({ error });
    },
    install: () => {
      vi.stubGlobal('fetch', fetch as typeof globalThis.fetch);
    },
  };
}

export function createTestStorage(
  initial: Record<string, string> = {},
): StorageAdapter & { failWrites(error?: Error): void; clearFailure(): void } {
  const store = new Map(Object.entries(initial));
  let writeError: Error | null = null;

  return {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => {
      if (writeError) throw writeError;
      store.set(key, value);
    },
    removeItem: async (key) => {
      store.delete(key);
    },
    getAllKeys: async () => [...store.keys()],
    failWrites: (error = new Error('テスト用ストレージ書き込み失敗')) => {
      writeError = error;
    },
    clearFailure: () => {
      writeError = null;
    },
  };
}

function toMilliseconds(value: Date | string | number): number {
  const milliseconds = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) throw new Error('有効な日時を指定してください');
  return milliseconds;
}

function normalizeApiResponse(options: TestApiResponseOptions): Required<TestApiResponseOptions> {
  return {
    status: options.status ?? 200,
    body: options.body ?? {},
    contentType: options.contentType ?? 'application/json',
    delayMs: options.delayMs ?? 0,
    error: options.error ?? null,
  } as Required<TestApiResponseOptions>;
}
