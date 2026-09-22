/**
 * 公開実行環境設定。
 *
 * Expo は EXPO_PUBLIC_* の静的なドット記法だけをクライアントへインライン化する。
 * ここでは教材APIの接続先情報だけを扱い、認証情報や学習データを設定へ持ち込まない。
 */

import { DEFAULT_API_TIMEOUT_MS } from '@/lib/constants';

export interface ContentApiConfig {
  readonly baseUrl: string;
  readonly apiVersion: string;
  readonly timeoutMs: number;
}

// API Routesを使うデモ環境では、PWAと同じオリジンの相対URLを既定値にする。
const DEFAULT_CONTENT_API_BASE_URL = '';
const DEFAULT_CONTENT_API_VERSION = 'v1';

function readPublicValue(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function readTimeout(value: string | undefined): number {
  const normalized = value?.trim();
  if (!normalized || !/^\d+$/.test(normalized)) return DEFAULT_API_TIMEOUT_MS;

  const timeoutMs = Number(normalized);
  return Number.isSafeInteger(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : DEFAULT_API_TIMEOUT_MS;
}

function validateBaseUrl(value: string): string {
  if (value === '' || value === '/') return '';

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('EXPO_PUBLIC_CONTENT_API_BASE_URL は有効なURLで指定してください');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Content APIのURLはHTTPまたはHTTPSで指定してください');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Content APIのURLに認証情報を含めることはできません');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('Content APIのBase URLにクエリやフラグメントを含めることはできません');
  }

  return value.replace(/\/+$/, '');
}

function validateApiVersion(value: string): string {
  if (!/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new Error('EXPO_PUBLIC_CONTENT_API_VERSION はパス要素として安全な値で指定してください');
  }
  return value;
}

/** Content APIの公開接続設定。環境ごとにEXPO_PUBLIC_*で切り替える。 */
export const CONTENT_API_CONFIG: ContentApiConfig = Object.freeze({
  baseUrl: validateBaseUrl(
    readPublicValue(
      process.env.EXPO_PUBLIC_CONTENT_API_BASE_URL,
      DEFAULT_CONTENT_API_BASE_URL,
    ),
  ),
  apiVersion: validateApiVersion(
    readPublicValue(
      process.env.EXPO_PUBLIC_CONTENT_API_VERSION,
      DEFAULT_CONTENT_API_VERSION,
    ),
  ),
  timeoutMs: readTimeout(process.env.EXPO_PUBLIC_CONTENT_API_TIMEOUT_MS),
});

/** 既存利用箇所向けの設定値エイリアス。 */
export const CONTENT_API_BASE_URL = CONTENT_API_CONFIG.baseUrl;
export const CONTENT_API_VERSION = CONTENT_API_CONFIG.apiVersion;
export const CONTENT_API_TIMEOUT_MS = CONTENT_API_CONFIG.timeoutMs;

/** Content APIカタログエンドポイントのフルURLを組み立てる。 */
export function buildCatalogUrl(config: ContentApiConfig = CONTENT_API_CONFIG): string {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  return `${baseUrl}/api/${config.apiVersion}/content/catalog`;
}
