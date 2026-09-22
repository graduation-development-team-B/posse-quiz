import { afterEach, describe, expect, it } from 'vitest';
import type { Server } from 'http';
import { createMockApiServer } from '@/mock-api/server';

interface RunningServer {
  server: Server;
  baseUrl: string;
}

const runningServers: Server[] = [];

async function startServer(options: Parameters<typeof createMockApiServer>[0] = {}): Promise<RunningServer> {
  const server = createMockApiServer(options);
  runningServers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('テストサーバーのアドレスを取得できません');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

afterEach(async () => {
  await Promise.all(
    runningServers.splice(0).map(
      (server) => new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
    ),
  );
});

describe('Content_API HTTP contract', () => {
  it('returns the catalog without authentication for the configured GET endpoint', async () => {
    const { baseUrl } = await startServer();
    const response = await fetch(`${baseUrl}/api/v1/content/catalog`, {
      headers: { Accept: 'application/json' },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(body).toEqual(expect.objectContaining({
      schemaVersion: expect.any(Number),
      contentVersion: expect.any(String),
      updatedAt: expect.any(String),
      catalog: expect.any(Object),
    }));
    expect(response.headers.get('www-authenticate')).toBeNull();
  });

  it('supports an API version supplied to the mock server', async () => {
    const responseBody = JSON.stringify({
      schemaVersion: 1,
      contentVersion: 'test.1',
      updatedAt: '2025-01-01T00:00:00.000Z',
      catalog: { weekUnits: [], questions: [], terms: [] },
    });
    const { baseUrl } = await startServer({ apiVersion: 'v2', catalogJson: responseBody });

    const response = await fetch(`${baseUrl}/api/v2/content/catalog`, {
      headers: { Accept: 'application/json' },
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(responseBody);
    expect((await fetch(`${baseUrl}/api/v1/content/catalog`)).status).toBe(404);
  });

  it('returns 304 with cache identity for explicit and conditional update checks', async () => {
    const { baseUrl } = await startServer();
    const firstResponse = await fetch(`${baseUrl}/api/v1/content/catalog`, {
      headers: { Accept: 'application/json' },
    });
    const etag = firstResponse.headers.get('etag');
    expect(etag).toBeTruthy();

    const explicitResponse = await fetch(`${baseUrl}/api/v1/content/catalog?scenario=304`, {
      headers: { Accept: 'application/json' },
    });
    const conditionalResponse = await fetch(`${baseUrl}/api/v1/content/catalog`, {
      headers: { Accept: 'application/json', 'If-None-Match': etag ?? '' },
    });

    expect(explicitResponse.status).toBe(304);
    expect(explicitResponse.headers.get('etag')).toBe(etag);
    expect(explicitResponse.headers.get('cache-control')).toBe('no-cache');
    expect(await explicitResponse.text()).toBe('');
    expect(conditionalResponse.status).toBe(304);
    expect(await conditionalResponse.text()).toBe('');
  });

  it.each([
    ['400', 400],
    ['404', 404],
    ['408', 408],
    ['504', 504],
    ['429', 429],
    ['500', 500],
    ['502', 502],
  ])('reproduces the HTTP error scenario %s without a long delay', async (scenario, expectedStatus) => {
    const { baseUrl } = await startServer();
    const startedAt = Date.now();
    const response = await fetch(`${baseUrl}/api/v1/content/catalog?scenario=${scenario}`, {
      headers: { Accept: 'application/json' },
    });

    expect(response.status).toBe(expectedStatus);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect((await response.json()).error).toEqual(expect.any(String));
    expect(Date.now() - startedAt).toBeLessThan(1000);
    if (expectedStatus === 429) expect(response.headers.get('retry-after')).toBe('1');
  });

  it('reproduces invalid JSON and Content-Type mismatch responses', async () => {
    const { baseUrl } = await startServer();
    const invalidJson = await fetch(`${baseUrl}/api/v1/content/catalog?scenario=invalid-json`, {
      headers: { Accept: 'application/json' },
    });
    const wrongContentType = await fetch(`${baseUrl}/api/v1/content/catalog?scenario=wrong-content-type`, {
      headers: { Accept: 'application/json' },
    });

    expect(invalidJson.status).toBe(200);
    expect(invalidJson.headers.get('content-type')).toBe('application/json');
    await expect(invalidJson.json()).rejects.toThrow();
    expect(wrongContentType.status).toBe(200);
    expect(wrongContentType.headers.get('content-type')).toBe('text/plain');
    expect(await wrongContentType.text()).toBe('plain text response');
  });

  it('negotiates application/json and rejects an unsupported representation', async () => {
    const { baseUrl } = await startServer();
    const accepted = await fetch(`${baseUrl}/api/v1/content/catalog`);
    const rejected = await fetch(`${baseUrl}/api/v1/content/catalog`, {
      headers: { Accept: 'text/html' },
    });

    expect(accepted.status).toBe(200);
    expect(rejected.status).toBe(406);
    expect((await rejected.json()).supported).toEqual(['application/json']);
  });

  it.each(['POST', 'PUT'])('does not expose a %s data-receiving endpoint', async (method) => {
    const { baseUrl } = await startServer();
    const response = await fetch(`${baseUrl}/api/v1/content/catalog`, {
      method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: { questionId: 'should-not-be-accepted' } }),
    });

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toContain('GET');
    expect(response.headers.get('allow')).toContain('OPTIONS');
  });
});
