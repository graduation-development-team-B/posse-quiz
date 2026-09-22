/** Web向けStorageAdapter（localStorageを使用）。 */

import type { StorageAdapter } from './StorageAdapter';

export interface WebStorageLike {
  readonly length: number;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
}

function getDefaultWebStorage(): WebStorageLike {
  if (typeof globalThis.localStorage === 'undefined') {
    throw new Error('Web Storage APIが利用できません');
  }
  return globalThis.localStorage;
}

export class WebStorageAdapter implements StorageAdapter {
  private readonly storage: WebStorageLike;

  constructor(storage: WebStorageLike = getDefaultWebStorage()) {
    this.storage = storage;
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.removeItem(key);
  }

  async getAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    for (let index = 0; index < this.storage.length; index += 1) {
      const key = this.storage.key(index);
      if (key !== null) keys.push(key);
    }
    return keys;
  }
}
