import { StyleSheet, View } from 'react-native';

import { AccessibleButton } from '@/components/AccessibleButton';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { TermEntry } from '@/types/content';

export interface TermDetailProps {
  term: TermEntry;
  knownTerms: ReadonlyMap<string, TermEntry>;
  onSelectRelated: (term: TermEntry) => void;
}

/**
 * 用語の意味・教材上の使用例・出典と、解決可能な関連語への導線を表示する。
 * URLやナビゲーション状態は持たず、画面側がtermIdだけを渡して遷移を管理する。
 */
export function TermDetail({ term, knownTerms, onSelectRelated }: TermDetailProps) {
  return (
    <ThemedView
      accessibilityRole="summary"
      style={styles.card}
      variant="elevated"
    >
      <ThemedText accessibilityRole="header" type="title" style={styles.title}>
        {term.name}
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">意味</ThemedText>
        <ThemedText style={styles.definition}>{term.definition}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">教材上の使用例</ThemedText>
        {term.usageExamples.map((example, index) => (
          <ThemedText key={`${term.id}-example-${index}`} style={styles.example}>
            ・{example}
          </ThemedText>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">出典</ThemedText>
        <ThemedText>
          {term.sourceReference.weekKey} / {term.sourceReference.sectionHeading}
        </ThemedText>
      </View>

      {term.relatedTermNames.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">関連用語</ThemedText>
          <View style={styles.relatedList}>
            {term.relatedTermNames.map((name) => {
              const related = knownTerms.get(name.toLocaleLowerCase());
              if (!related) {
                return (
                  <ThemedText key={`${term.id}-related-${name}`} style={styles.unresolved}>
                    {name}（未登録）
                  </ThemedText>
                );
              }

              return (
                <RelatedTermLink
                  key={`${term.id}-related-${related.id}`}
                  term={related}
                  onPress={() => onSelectRelated(related)}
                />
              );
            })}
          </View>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    gap: 16,
    padding: 20,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
  },
  section: {
    gap: 8,
  },
  definition: {
    lineHeight: 26,
  },
  example: {
    lineHeight: 24,
  },
  relatedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
  },
  unresolved: {
    minHeight: 44,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.75,
  },
});

function RelatedTermLink({
  term,
  onPress,
}: {
  term: TermEntry;
  onPress: () => void;
}) {
  return (
    <AccessibleButton
      accessibilityLabel={`${term.name}の用語詳細を表示`}
      label={term.name}
      onPress={onPress}
      style={styles.relatedButton}
      variant="ghost"
    />
  );
}
