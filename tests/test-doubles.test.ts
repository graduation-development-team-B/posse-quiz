import { describe, expect, it } from 'vitest';
import {
  createTestApiDouble,
  createTestClock,
  createTestRandom,
  createTestStorage,
  installTestClock,
} from './test-doubles';

describe('テストダブル基盤', () => {
  it('時計を固定して進行させられる', () => {
    const clock = createTestClock('2025-01-01T00:00:00.000Z');
    installTestClock(clock);

    expect(Date.now()).toBe(new Date('2025-01-01T00:00:00.000Z').getTime());
    clock.advance(1_000);
    expect(Date.now()).toBe(new Date('2025-01-01T00:00:01.000Z').getTime());
    expect(clock.nowIso()).toBe('2025-01-01T00:00:01.000Z');
  });

  it('乱数列を決定的に差し替えられる', () => {
    const random = createTestRandom([0.1, 0.9]);
    expect([random.next(), random.next(), random.next()]).toEqual([0.1, 0.9, 0.1]);
    random.reset();
    expect(random.next()).toBe(0.1);
  });

  it('API応答と呼び出しをテストごとに制御できる', async () => {
    const api = createTestApiDouble({ status: 200, body: { contentVersion: 'v1' } });
    api.install();

    const response = await fetch('/api/catalog', { headers: { Accept: 'application/json' } });
    expect(await response.json()).toEqual({ contentVersion: 'v1' });
    expect(api.calls).toHaveLength(1);
    expect(api.calls[0].input).toBe('/api/catalog');

    api.respond({ status: 304, body: null });
    expect((await fetch('/api/catalog')).status).toBe(304);
  });

  it('ストレージの読み書きと書き込み失敗を差し替えられる', async () => {
    const storage = createTestStorage({ existing: 'value' });
    expect(await storage.getItem('existing')).toBe('value');
    await storage.setItem('new', 'item');
    expect(await storage.getAllKeys()).toEqual(['existing', 'new']);

    storage.failWrites();
    await expect(storage.setItem('new', 'updated')).rejects.toThrow('書き込み失敗');
    storage.clearFailure();
    await storage.removeItem('existing');
    expect(await storage.getItem('existing')).toBeNull();
  });
});
