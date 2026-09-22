/**
 * React Native のテスト用モック
 * Vitest（Node.js 環境）で React Native モジュールを使用するためのスタブ
 */

export const Platform = {
  OS: 'web' as 'web' | 'ios' | 'android',
  select: <T>(obj: Record<string, T> & { default?: T }): T | undefined => {
    return obj[Platform.OS] ?? obj.default;
  },
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: <T>(style: T): T => style,
};

export const Dimensions = {
  get: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
  addEventListener: () => ({ remove: () => undefined }),
};

export const useColorScheme = (): 'light' => 'light';
