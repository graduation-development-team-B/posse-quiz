import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { registerServiceWorker } from '@/lib/pwa/registerServiceWorker';

import { Colors } from '@/constants/theme';
import { AppProviders } from '@/contexts/AppProviders';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  // Navigatorの既定背景もテーマ側のページ背景に合わせ、全画面で同じ色にする。
  const navigationTheme = useMemo(() => {
    const isDark = colorScheme === 'dark';
    const base = isDark ? DarkTheme : DefaultTheme;
    const palette = Colors[isDark ? 'dark' : 'light'];
    return {
      ...base,
      colors: { ...base.colors, background: palette.background, card: palette.surfaceElevated },
    };
  }, [colorScheme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <AppProviders>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="roadmap" options={{ headerShown: false }} />
          <Stack.Screen name="scope/index" options={{ headerShown: false }} />
          <Stack.Screen name="drill/[drillId]" options={{ headerShown: false }} />
          <Stack.Screen name="console-drill/[drillId]" options={{ headerShown: false }} />
          <Stack.Screen name="content/[weekKey]" options={{ headerShown: false }} />
          <Stack.Screen name="quiz/[sessionId]" options={{ headerShown: false }} />
          <Stack.Screen name="feedback/[sessionId]" options={{ headerShown: false }} />
          <Stack.Screen name="result/[sessionId]" options={{ headerShown: false }} />
          <Stack.Screen name="immediate-review/[sessionId]" options={{ headerShown: false }} />
          <Stack.Screen name="term/[termId]" options={{ title: '用語詳細' }} />
          <Stack.Screen name="review" options={{ title: '復習' }} />
          <Stack.Screen name="settings" options={{ title: '設定' }} />
        </Stack>
      </AppProviders>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
