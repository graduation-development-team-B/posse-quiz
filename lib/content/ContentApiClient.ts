/**
 * 認証なしContent_APIの教材カタログクライアント。
 * APIレスポンス全体の契約検証は validateApiResponse（タスク3.2）に委譲し、
 * このクラスは接続設定とHTTPレスポンスの安全な取得だけを担当する。
 */

import { buildCatalogUrl, CONTENT_API_CONFIG, type ContentApiConfig } from '@/lib/config';
import type { ApiResponse } from '@/types/content';
import type { ContentApiClient as ContentApiClientContract } from '@/types/sync';
import { requestJson, type FetchImplementation } from './http';

export interface ContentApiClientOptions {
  readonly config?: ContentApiConfig;
  readonly fetchImpl?: FetchImplementation;
}

export class ContentApiClient implements ContentApiClientContract {
  readonly config: ContentApiConfig;

  private readonly fetchImpl?: FetchImplementation;

  constructor(options: ContentApiClientOptions = {}) {
    this.config = options.config ?? CONTENT_API_CONFIG;
    this.fetchImpl = options.fetchImpl;
  }

  /** 設定済みBase URLとAPI_Versionから教材カタログのエンドポイントを組み立てる。 */
  get endpoint(): string {
    return buildCatalogUrl(this.config);
  }

  /**
   * 認証なしで教材カタログを取得する。
   * body、認証ヘッダー、Cookieを送らず、学習進捗をContent_APIへ送信しない。
   */
  fetchCatalog(signal?: AbortSignal): Promise<ApiResponse> {
    return requestJson<ApiResponse>(this.endpoint, {
      timeoutMs: this.config.timeoutMs,
      signal,
      fetchImpl: this.fetchImpl,
    });
  }
}

export type {
  ContentApiErrorCode,
  FetchImplementation,
  JsonRequestOptions,
} from './http';
export {
  ContentApiAbortError,
  ContentApiContentTypeError,
  ContentApiError,
  ContentApiHttpError,
  ContentApiJsonParseError,
  ContentApiNetworkError,
  ContentApiTimeoutError,
  requestJson,
} from './http';
