import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** 学習ロードマップを起点に、学習・マイページへ移動できる3タブ構成。 */
export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.supportGray,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: palette.surfaceElevated,
          borderColor: palette.border,
          borderRadius: 32,
          borderTopWidth: 1,
          bottom: 14,
          elevation: 8,
          height: 64,
          left: 16,
          paddingBottom: 7,
          paddingTop: 7,
          position: 'absolute',
          right: 16,
          shadowColor: palette.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 14,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ミニドリル',
          tabBarAccessibilityLabel: 'ミニドリル',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: '学習',
          tabBarAccessibilityLabel: '学習',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="books.vertical.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'マイページ',
          tabBarAccessibilityLabel: 'マイページ',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
