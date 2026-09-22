/**
 * ネイティブ（iOS/Android）向けStorageAdapter。
 * Expo SDK 54で推奨されるAsyncStorage 2.2.0をキー値ストアとして利用する。
 */

import type { StorageAdapter } from './StorageAdapter';

interface NativeKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

/** テストやSSRなど、ネイティブAPIがない環境で明示的に使うインメモリ実装。 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}

function loadAsyncStorage(): NativeKeyValueStorage {
  try {
    // Metroはネイティブ実行時にこの依存を解決する。Webでは呼び出されない。
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('@react-native-async-storage/async-storage') as {
      default?: NativeKeyValueStorage;
    } & NativeKeyValueStorage;
    return module.default ?? module;
  } catch (error) {
    throw new Error(
      'ネイティブストレージを初期化できません。' +
        '@react-native-async-storage/async-storage を確認してください。',
      { cause: error },
    );
  }
}

/** AsyncStorageをStorageAdapterへ閉じ込めるアダプター。 */
export class AsyncStorageAdapter implements StorageAdapter {
  private readonly storage: NativeKeyValueStorage;

  constructor(storage: NativeKeyValueStorage = loadAsyncStorage()) {
    this.storage = storage;
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return this.storage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return this.storage.removeItem(key);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(await this.storage.getAllKeys());
  }
}
