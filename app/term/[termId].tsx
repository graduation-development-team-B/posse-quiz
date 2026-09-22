import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ResponsiveScrollView } from '@/components/layout';
import { AccessibleButton } from '@/components/AccessibleButton';
import { TermDetail } from '@/components/glossary/TermDetail';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useContent } from '@/contexts/ContentContext';
import { createTermRoute, readTermId } from '@/lib/navigation/routes';
import { SUPPORTED_WEEK_KEYS } from '@/lib/constants';

export default function TermDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ termId?: string | string[] }>();
  const termId = readTermId(params);
  const { catalog, state } = useContent();

  const activeTerms = useMemo(() => {
    if (!catalog) return [];
    const supportedWeekIds = new Set(
      catalog.weekUnits
        .filter((week) => SUPPORTED_WEEK_KEYS.some((key) => key === week.key) && week.published && !week.deleted)
        .map((week) => week.id),
    );
    return catalog.terms.filter(
      (term) => term.published && !term.deleted && supportedWeekIds.has(term.weekUnitId),
    );
  }, [catalog]);
  const term = activeTerms.find((candidate) => candidate.id === termId) ?? null;
  const knownTerms = useMemo(
    () => new Map(activeTerms.map((candidate) => [candidate.name.toLocaleLowerCase(), candidate])),
    [activeTerms],
  );

  if (!catalog && (state === 'loading' || state === 'uninitialized')) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator accessibilityLabel="用語詳細を読み込み中" />
        <ThemedText>用語詳細を読み込んでいます。</ThemedText>
      </ThemedView>
    );
  }

  if (!term) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: '用語詳細' }} />
        <ThemedText type="title">用語詳細</ThemedText>
        <ThemedText style={styles.centerText}>指定された用語は見つかりません。</ThemedText>
        <AccessibleButton label="Feedbackへ戻る" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: term.name }} />
      <ResponsiveScrollView contentContainerStyle={styles.content}>
        <TermDetail
          term={term}
          knownTerms={knownTerms}
          onSelectRelated={(related) => router.push(createTermRoute(related.id) as never)}
        />
        <AccessibleButton label="戻る" variant="secondary" onPress={() => router.back()} />
      </ResponsiveScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    textAlign: 'center',
  },
});
