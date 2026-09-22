import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ThemedView variant="surface" style={styles.section}>
      <ThemedText type="subtitle">{title}</ThemedText>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 14,
    gap: 12,
    padding: 16,
  },
});
