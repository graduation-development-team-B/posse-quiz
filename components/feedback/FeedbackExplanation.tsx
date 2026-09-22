import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import type { TermLinkSegment } from '@/lib/glossary/termLinker';

interface FeedbackExplanationProps {
  segments: readonly TermLinkSegment[];
  onTermPress: (termId: string) => void;
}

export function FeedbackExplanation({ segments, onTermPress }: FeedbackExplanationProps) {
  return (
    <ThemedText
      accessibilityRole="text"
      style={styles.explanation}
    >
      {segments.map((segment, index) => segment.termId ? (
        <FeedbackTermLink
          key={`${segment.termId}-${index}`}
          onPress={() => onTermPress(segment.termId!)}
          segment={segment}
        />
      ) : (
        <ThemedText key={`text-${index}`}>{segment.text}</ThemedText>
      ))}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  explanation: {
    lineHeight: 26,
  },
  termLink: {
    textDecorationLine: 'underline',
  },
});

function FeedbackTermLink({
  segment,
  onPress,
}: {
  segment: TermLinkSegment;
  onPress: () => void;
}) {
  const focus = useAccessibilityFocus();

  return (
    <Pressable
      accessibilityLabel={`${segment.text}の用語詳細を表示`}
      accessibilityRole="link"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={focus.focusStyle}
    >
      <ThemedText style={styles.termLink}>{segment.text}</ThemedText>
    </Pressable>
  );
}
