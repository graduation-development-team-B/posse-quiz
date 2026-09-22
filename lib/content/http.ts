/**
 * Content_API 取得に共通するHTTP処理。
 * ステータス、Content-Type、JSON本文の検証順を固定し、呼び出し側が
 * timeout / HTTP / Content-Type / JSON解析の失敗を区別できるようにする。
 */

import { DEFAULT_API_TIMEOUT_MS } from '@/lib/constants';

export type FetchImplementation = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export interface JsonRequestOptions {
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly fetchImpl?: FetchImplementation;
  readonly headers?: Record<string, string>;
}

export type ContentApiErrorCode =
  | 'timeout'
  | 'http'
  | 'content-type'
  | 'json'
  | 'network'
  | 'aborted';

/** Content_API取得に関する基底エラー。 */
export class ContentApiError extends Error {
  readonly code: ContentApiErrorCode;

  constructor(code: ContentApiErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ContentApiError';
    this.code = code;
  }
}

/** 設定時間内にレスポンスを取得できなかった場合のエラー。 */
export class ContentApiTimeoutError extends ContentApiError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super('timeout', `Content API request timed out after ${timeoutMs}ms`);
    this.name = 'ContentApiTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/** HTTPステータスが2xxではない場合のエラー。 */
export class ContentApiHttpError extends ContentApiError {
  readonly status: number;
  readonly statusText: string;

  constructor(status: number, statusText = '') {
    super('http', `Content API request failed with HTTP ${status}${statusText ? ` ${statusText}` : ''}`);
    this.name = 'ContentApiHttpError';
    this.status = status;
    this.statusText = statusText;
  }
}

/** JSONレスポンスではないContent-Typeの場合のエラー。 */
export class ContentApiContentTypeError extends ContentApiError {
  readonly contentType: string | null;

  constructor(contentType: string | null) {
    super('content-type', `Content API response must be application/json (received ${contentType ?? 'missing'})`);
    this.name = 'ContentApiContentTypeError';
    this.contentType = contentType;
  }
}

/** レスポンス本文をJSONとして解析できない場合のエラー。 */
export class ContentApiJsonParseError extends ContentApiError {
  constructor(cause: unknown) {
    super('json', 'Content API response contains invalid JSON', {
      cause,
    });
    this.name = 'ContentApiJsonParseError';
  }
}

/** HTTP通信自体が失敗した場合のエラー。 */
export class ContentApiNetworkError extends ContentApiError {
  constructor(cause: unknown) {
    super('network', 'Content API request failed before receiving a response', {
      cause,
    });
    this.name = 'ContentApiNetworkError';
  }
}

/** 呼び出し側のAbortSignalで明示的に中断された場合のエラー。 */
export class ContentApiAbortError extends ContentApiError {
  constructor() {
    super('aborted', 'Content API request was aborted');
    this.name = 'ContentApiAbortError';
  }
}

function isContentApiError(error: unknown): error is ContentApiError {
  return error instanceof ContentApiError;
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase();
  return mediaType === 'application/json';
}

/**
 * GETレスポンスを、HTTPステータス→Content-Type→JSON解析の順で処理する。
 * Progress_Snapshot等の学習データを送らないため、bodyは常に持たず、
 * 認証情報も送信しない。
 */
export async function requestJson<T>(url: string, options: JsonRequestOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const abortFromCaller = () => controller.abort();
  if (options.signal?.aborted) {
    throw new ContentApiAbortError();
  }
  options.signal?.addEventListener('abort', abortFromCaller, { once: true });

  timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...options.headers,
        },
        credentials: 'omit',
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) throw new ContentApiTimeoutError(timeoutMs);
      if (options.signal?.aborted) throw new ContentApiAbortError();
      throw new ContentApiNetworkError(error);
    }

    // 304を含む2xx以外は、本文やContent-Typeを解釈せずHTTP失敗として返す。
    if (response.status < 200 || response.status >= 300) {
      throw new ContentApiHttpError(response.status, response.statusText);
    }

    const contentType = response.headers.get('content-type');
    if (!isJsonContentType(contentType)) {
      throw new ContentApiContentTypeError(contentType);
    }

    let body: string;
    try {
      body = await response.text();
    } catch (error) {
      throw new ContentApiJsonParseError(error);
    }

    try {
      return JSON.parse(body) as T;
    } catch (error) {
      throw new ContentApiJsonParseError(error);
    }
  } catch (error) {
    if (isContentApiError(error)) throw error;
    throw new ContentApiNetworkError(error);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}
