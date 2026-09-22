/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      // React Native / Expo モジュールのスタブ
      'react-native': resolve(__dirname, 'tests/__mocks__/react-native.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Property-Based Testing: tests/pbt.ts の assertProperty が各プロパティを100回実行する
    // PBT は tests/**/*.property.test.ts に分離し、test:pbt で単発実行できる。
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['lib/**/*.ts', 'types/**/*.ts'],
      exclude: ['lib/storage/index.ts'],
    },
    // タイムアウト（8秒タイムアウト + バッファ）
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
