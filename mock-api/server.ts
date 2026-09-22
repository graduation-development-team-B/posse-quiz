/**
 * デモ用 Content_API サーバー。
 * 認証なしで GET /api/{API_VERSION}/content/catalog に応答する REST/JSON API。
 *
 * 使用方法:
 *   npx tsx mock-api/server.ts
 *
 * `createMockApiServer` を使うと、実サーバーをテスト用の ephemeral port で起動できる。
 */

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const DEFAULT_PORT = 3001;
const DEFAULT_API_VERSION = 'v1';
const DEFAULT_CATALOG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'catalog.json');

type Logger = Pick<Console, 'error' | 'log'>;

export interface MockApiServerOptions {
  apiVersion?: string;
  catalogPath?: string;
  catalogJson?: string;
  logger?: Logger;
}

/** カタログ JSON を読み込む。テストでは catalogJson または catalogPath を差し替えられる。 */
export function loadCatalog(options: MockApiServerOptions = {}): string {
  if (options.catalogJson !== undefined) return options.catalogJson;
  return fs.readFileSync(options.catalogPath ?? DEFAULT_CATALOG_PATH, 'utf8');
}

function readApiVersion(value?: string): string {
  const apiVersion = value?.trim() || process.env.MOCK_API_VERSION?.trim() || DEFAULT_API_VERSION;
  if (!/^[A-Za-z0-9._-]+$/.test(apiVersion)) {
    throw new Error('MOCK_API_VERSION はパス要素として安全な値で指定してください');
  }
  return apiVersion;
}

function acceptsJson(accept: string | undefined): boolean {
  // Accept 省略時は HTTP の既定値（任意の形式）として JSON を返す。
  if (!accept || accept.trim() === '') return true;

  return accept.split(',').some((part) => {
    const mediaType = part.split(';', 1)[0].trim().toLowerCase();
    return mediaType === 'application/json' || mediaType === 'application/*' || mediaType === '*/*';
  });
}

function etagFor(catalogJson: string): string {
  return `"${createHash('sha256').update(catalogJson).digest('hex')}"`;
}

function ifNoneMatchIncludes(ifNoneMatch: string | undefined, etag: string): boolean {
  if (!ifNoneMatch) return false;
  return ifNoneMatch.split(',').some((candidate) => {
    const normalized = candidate.trim();
    return normalized === '*' || normalized.replace(/^W\//, '') === etag;
  });
}

function commonHeaders(): http.OutgoingHttpHeaders {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Accept, If-None-Match',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Accept',
  };
}

function sendJson(
  res: http.ServerResponse,
  statusCode: number,
  body: unknown,
  extraHeaders: http.OutgoingHttpHeaders = {},
): void {
  const bodyJson = JSON.stringify(body);
  res.writeHead(statusCode, {
    ...commonHeaders(),
    'Content-Type': 'application/json',
    ...extraHeaders,
  });
  res.end(bodyJson);
}

function sendText(
  res: http.ServerResponse,
  statusCode: number,
  body: string,
  contentType: string,
  extraHeaders: http.OutgoingHttpHeaders = {},
): void {
  res.writeHead(statusCode, {
    ...commonHeaders(),
    'Content-Type': contentType,
    ...extraHeaders,
  });
  res.end(body);
}

function sendNotModified(res: http.ServerResponse, etag: string): void {
  res.writeHead(304, {
    ...commonHeaders(),
    ETag: etag,
    'Cache-Control': 'no-cache',
  });
  res.end();
}

function scenarioStatus(scenario: string | null): number | null {
  if (!scenario || !/^[45]\d{2}$/.test(scenario)) return null;
  const status = Number(scenario);
  return status >= 400 && status <= 599 ? status : null;
}

/** Content_API の HTTP handler を生成する。 */
export function createMockApiHandler(options: MockApiServerOptions = {}): http.RequestListener {
  const apiVersion = readApiVersion(options.apiVersion);
  const catalogPath = `/api/${apiVersion}/content/catalog`;
  const logger = options.logger ?? console;

  return (req, res) => {
    const requestUrl = new URL(req.url ?? '/', 'http://localhost');
    const scenario = requestUrl.searchParams.get('scenario');

    // 学習データを受け取る API は提供しない。
    if (req.method === 'OPTIONS') {
      res.writeHead(204, commonHeaders());
      res.end();
      return;
    }
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method Not Allowed' }, { Allow: 'GET, OPTIONS' });
      return;
    }
    if (requestUrl.pathname !== catalogPath) {
      sendJson(res, 404, { error: 'Not Found' });
      return;
    }
    if (!acceptsJson(req.headers.accept)) {
      sendJson(res, 406, { error: 'Not Acceptable', supported: ['application/json'] });
      return;
    }

    if (scenario === 'invalid-json') {
      sendText(res, 200, '{ this is not valid json }}}', 'application/json');
      return;
    }
    if (scenario === 'wrong-content-type') {
      sendText(res, 200, 'plain text response', 'text/plain');
      return;
    }

    const forcedStatus = scenarioStatus(scenario);
    if (forcedStatus !== null) {
      const messages: Record<number, string> = {
        400: 'Bad Request',
        404: 'Not Found',
        408: 'Request Timeout',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        504: 'Gateway Timeout',
      };
      sendJson(
        res,
        forcedStatus,
        { error: messages[forcedStatus] ?? `Mock server error (${forcedStatus})` },
        forcedStatus === 429 ? { 'Retry-After': '1' } : {},
      );
      return;
    }

    let catalogJson: string;
    try {
      catalogJson = loadCatalog(options);
    } catch (error) {
      logger.error('カタログ読み込みエラー:', error);
      sendJson(res, 500, { error: 'Failed to load catalog' });
      return;
    }

    const etag = etagFor(catalogJson);
    if (scenario === '304' || ifNoneMatchIncludes(req.headers['if-none-match'], etag)) {
      sendNotModified(res, etag);
      return;
    }

    sendText(res, 200, catalogJson, 'application/json', {
      ETag: etag,
      'Cache-Control': 'no-cache',
    });
  };
}

/** テストや開発用 CLI から起動できる Node HTTP サーバーを生成する。 */
export function createMockApiServer(options: MockApiServerOptions = {}): http.Server {
  return http.createServer(createMockApiHandler(options));
}

function isMainModule(): boolean {
  const entryPoint = process.argv[1];
  return Boolean(entryPoint && import.meta.url === pathToFileURL(path.resolve(entryPoint)).href);
}

if (isMainModule()) {
  const portValue = process.env.MOCK_API_PORT?.trim();
  const port = portValue ? Number(portValue) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('MOCK_API_PORT は0〜65535の整数で指定してください');
  }

  const apiVersion = readApiVersion();
  const server = createMockApiServer({ apiVersion });
  server.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    console.log(`Mock Content API が起動しました: http://localhost:${actualPort}`);
    console.log(`カタログエンドポイント: GET http://localhost:${actualPort}/api/${apiVersion}/content/catalog`);
    console.log('テスト用シナリオ: ?scenario=304|400|404|408|429|500|504|invalid-json|wrong-content-type');
  });
}
