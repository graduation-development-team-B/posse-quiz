import { describe, expect, it } from 'vitest';

import { SettingsStore } from '@/lib/settings/SettingsStore';
import { USER_SETTINGS_KEY } from '@/lib/storage/cacheKeys';
import { createTestStorage } from '../test-doubles';

describe('SettingsStore', () => {
  it('未保存時は既定の5問を使い、保存した問題数を復元する', async () => {
    const storage = createTestStorage();
    const store = new SettingsStore(storage);

    expect(await store.restore()).toEqual({ questionCount: 5 });
    expect(await store.setQuestionCount(10)).toBe(true);
    expect(await storage.getItem(USER_SETTINGS_KEY)).toBe('{"questionCount":10}');

    const restored = new SettingsStore(storage);
    expect(await restored.restore()).toEqual({ questionCount: 10 });
  });

  it('不正な設定は既定値へ初期化する', async () => {
    const storage = createTestStorage({ [USER_SETTINGS_KEY]: '{"questionCount":4}' });
    const notices: string[] = [];
    const store = new SettingsStore(storage, {
      onNotice: (notice) => {
        if (notice.message) notices.push(notice.message);
      },
    });

    expect(await store.restore()).toEqual({ questionCount: 5 });
    expect(await storage.getItem(USER_SETTINGS_KEY)).toBe('{"questionCount":5}');
    expect(notices).toContain('設定を初期化しました。');
  });

  it('保存失敗時は現在の設定を維持し、既存Storageを上書きしない', async () => {
    const storage = createTestStorage({ [USER_SETTINGS_KEY]: '{"questionCount":3}' });
    const notices: string[] = [];
    const store = new SettingsStore(storage, {
      onNotice: (notice) => {
        if (notice.message) notices.push(notice.message);
      },
    });
    await store.restore();
    storage.failWrites();

    expect(await store.setQuestionCount(10)).toBe(false);
    expect(store.getSettings()).toEqual({ questionCount: 10 });
    expect(await storage.getItem(USER_SETTINGS_KEY)).toBe('{"questionCount":3}');
    expect(notices.at(-1)).toBe('設定を保存できませんでした。現在のセッションでは設定を利用します。');
  });
});
