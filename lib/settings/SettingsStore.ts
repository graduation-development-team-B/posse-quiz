/**
 * User settings persistence boundary.
 * Settings use their own storage key and never share the progress or content cache keys.
 */

import type { AllowedQuestionCount } from '@/lib/constants';
import { DEFAULT_QUESTION_COUNT } from '@/lib/constants';
import { USER_SETTINGS_KEY } from '@/lib/storage/cacheKeys';
import type { StorageAdapter } from '@/lib/storage/StorageAdapter';

export interface UserSettings {
  questionCount: AllowedQuestionCount;
}

export type SettingsNotice =
  | { kind: 'initialized'; message: string }
  | { kind: 'saved'; message?: string }
  | { kind: 'save-failed'; message: string };

export interface SettingsStoreOptions {
  onNotice?: (notice: SettingsNotice) => void;
}

const DEFAULT_SETTINGS: UserSettings = Object.freeze({
  questionCount: DEFAULT_QUESTION_COUNT,
});

export class SettingsStore {
  private settings: UserSettings = { ...DEFAULT_SETTINGS };
  private readonly adapter: StorageAdapter;
  private readonly onNotice?: (notice: SettingsNotice) => void;

  constructor(adapter: StorageAdapter, options: SettingsStoreOptions = {}) {
    this.adapter = adapter;
    this.onNotice = options.onNotice;
  }

  async restore(): Promise<UserSettings> {
    const raw = await this.adapter.getItem(USER_SETTINGS_KEY);
    if (raw === null) {
      this.settings = { ...DEFAULT_SETTINGS };
      return this.getSettings();
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isUserSettings(parsed)) throw new Error('設定の形式が不正です。');
      this.settings = parsed;
      return this.getSettings();
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
      const saved = await this.save();
      if (saved) {
        this.emit({ kind: 'initialized', message: '設定を初期化しました。' });
      }
      return this.getSettings();
    }
  }

  getSettings(): UserSettings {
    return { ...this.settings };
  }

  async setQuestionCount(questionCount: AllowedQuestionCount): Promise<boolean> {
    this.settings = { questionCount };
    return this.save();
  }

  private async save(): Promise<boolean> {
    try {
      await this.adapter.setItem(USER_SETTINGS_KEY, JSON.stringify(this.settings));
      this.emit({ kind: 'saved' });
      return true;
    } catch (error) {
      console.warn('設定の保存に失敗しました。現在のセッションでは設定を利用します。', error);
      this.emit({
        kind: 'save-failed',
        message: '設定を保存できませんでした。現在のセッションでは設定を利用します。',
      });
      return false;
    }
  }

  private emit(notice: SettingsNotice): void {
    this.onNotice?.(notice);
  }
}

function isUserSettings(value: unknown): value is UserSettings {
  if (typeof value !== 'object' || value === null) return false;
  const questionCount = (value as { questionCount?: unknown }).questionCount;
  return questionCount === 3 || questionCount === 5 || questionCount === 10;
}
