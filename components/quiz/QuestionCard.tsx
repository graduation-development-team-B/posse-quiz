import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface QuestionCardProps extends PropsWithChildren {
  formatLabel: string;
  prompt: string;
}

/** The single white surface used for one question and its answer controls. */
export function QuestionCard({ formatLabel, prompt, children }: QuestionCardProps) {
  return (
    <ThemedView variant="surface" style={styles.card}>
      <View style={styles.metaRow}>
        <ThemedText type="defaultSemiBold" colorName="supportGray">
          {formatLabel}
        </ThemedText>
        <ThemedText colorName="supportGray">1問に集中</ThemedText>
      </View>
      <ThemedText type="subtitle" accessibilityRole="header" style={styles.prompt}>
        {prompt}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    gap: 18,
    padding: 22,
    width: '100%',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  prompt: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 32,
  },
});
