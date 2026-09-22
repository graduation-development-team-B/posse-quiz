import { describe, expect, it } from 'vitest';
import type { ContentApiConfig } from '@/lib/config';
import {
  ContentApiClient,
  ContentApiContentTypeError,
  ContentApiHttpError,
  ContentApiJsonParseError,
  ContentApiNetworkError,
  ContentApiTimeoutError,
} from '@/lib/content/ContentApiClient';
import type { ApiResponse } from '@/types/content';

const config: ContentApiConfig = {
  baseUrl: 'https://content.example.test',
  apiVersion: 'v2',
  timeoutMs: 8_000,
};

const apiResponse: ApiResponse = {
  schemaVersion: 1,
  contentVersion: 'test.1',
  updatedAt: '2025-01-01T00:00:00.000Z',
  catalog: { weekUnits: [], questions: [], terms: [], activities: [] },
};

function response(
  body: string | unknown,
  status = 200,
  contentType: string | null = 'application/json',
): Response {
  return {
    status,
    statusText: status === 200 ? 'OK' : 'Bad Request',
    headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? contentType : null },
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
  } as Response;
}

describe('ContentApiClient', () => {
  it('builds the versioned endpoint and sends only an unauthenticated GET request', async () => {
    let requestInit: RequestInit | undefined;
    const fetchImpl = async (url: string, init?: RequestInit) => {
      expect(url).toBe('https://content.example.test/api/v2/content/catalog');
      requestInit = init;
      return response(apiResponse);
    };

    const result = await new ContentApiClient({ config, fetchImpl }).fetchCatalog();

    expect(result).toEqual(apiResponse);
    expect(requestInit?.method).toBe('GET');
    expect(requestInit?.headers).toEqual({ Accept: 'application/json' });
    expect(requestInit?.credentials).toBe('omit');
    expect(requestInit?.body).toBeUndefined();
  });

  it('distinguishes HTTP failures before reading the body', async () => {
    let bodyRead = false;
    const fetchImpl = async () => ({
      ...response('not json', 500),
      text: async () => {
        bodyRead = true;
        return 'not json';
      },
    } as Response);

    await expect(new ContentApiClient({ config, fetchImpl }).fetchCatalog())
      .rejects.toMatchObject({
        code: 'http',
        status: 500,
      } satisfies Partial<ContentApiHttpError>);
    expect(bodyRead).toBe(false);
  });

  it('rejects a non-JSON Content-Type before parsing the body', async () => {
    let bodyRead = false;
    const fetchImpl = async () => ({
      ...response('{"not":"used"}', 200, 'text/plain'),
      text: async () => {
        bodyRead = true;
        return '{"not":"used"}';
      },
    } as Response);

    await expect(new ContentApiClient({ config, fetchImpl }).fetchCatalog())
      .rejects.toBeInstanceOf(ContentApiContentTypeError);
    expect(bodyRead).toBe(false);
  });

  it('distinguishes invalid JSON after accepting application/json', async () => {
    const fetchImpl = async () => response('{ invalid json', 200, 'application/json; charset=utf-8');

    await expect(new ContentApiClient({ config, fetchImpl }).fetchCatalog())
      .rejects.toBeInstanceOf(ContentApiJsonParseError);
  });

  it('aborts a request at the configured timeout', async () => {
    const fetchImpl = async (_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
    const shortTimeoutConfig = { ...config, timeoutMs: 10 };

    await expect(new ContentApiClient({ config: shortTimeoutConfig, fetchImpl }).fetchCatalog())
      .rejects.toBeInstanceOf(ContentApiTimeoutError);
  });

  it('wraps transport failures separately from response failures', async () => {
    const networkFailure = new Error('offline');
    const fetchImpl = async () => {
      throw networkFailure;
    };

    await expect(new ContentApiClient({ config, fetchImpl }).fetchCatalog())
      .rejects.toMatchObject({
        code: 'network',
        cause: networkFailure,
      } satisfies Partial<ContentApiNetworkError>);
  });
});
