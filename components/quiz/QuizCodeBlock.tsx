import { ScrollView, StyleSheet, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface QuizCodeBlockProps {
  code: string;
  label?: string;
}

const EDITOR_COLORS = {
  background: '#1E1E1E',
  border: '#3E3E42',
  gutter: '#858585',
  header: '#252526',
  text: '#D4D4D4',
  windowClose: '#F14C4C',
  windowMinimize: '#CCA700',
  windowMaximize: '#23D18B',
};

export function QuizCodeBlock({ code, label = '問題のコード' }: QuizCodeBlockProps) {
  const lines = code.split(/\r?\n/);
  const lineNumberWidth = Math.max(36, String(lines.length).length * 10 + 22);

  return (
    <ThemedView
      accessibilityLabel={label}
      style={[styles.wrapper, { backgroundColor: EDITOR_COLORS.background, borderColor: EDITOR_COLORS.border }]}
    >
      <View
        accessibilityRole="header"
        accessibilityLabel={`${label}エディタ`}
        style={[styles.header, { backgroundColor: EDITOR_COLORS.header, borderBottomColor: EDITOR_COLORS.border }]}
      >
        <View style={styles.windowControls} accessibilityElementsHidden>
          <View style={[styles.windowButton, { backgroundColor: EDITOR_COLORS.windowClose }]} />
          <View style={[styles.windowButton, { backgroundColor: EDITOR_COLORS.windowMinimize }]} />
          <View style={[styles.windowButton, { backgroundColor: EDITOR_COLORS.windowMaximize }]} />
        </View>
        <ThemedText style={[styles.fileName, { color: EDITOR_COLORS.text }]}>{label}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        accessibilityLabel={label}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <View style={styles.codeRows}>
          {lines.map((line, index) => (
            <View key={`${index}-${line}`} style={styles.codeRow}>
              <ThemedText
                selectable
                style={[styles.lineNumber, { color: EDITOR_COLORS.gutter, width: lineNumberWidth }]}
              >
                {index + 1}
              </ThemedText>
              <ThemedText
                ellipsizeMode="clip"
                numberOfLines={1}
                selectable
                style={[styles.code, { color: EDITOR_COLORS.text }]}
              >
                {line || ' '}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 120,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: 12,
  },
  windowControls: {
    flexDirection: 'row',
    gap: 6,
    width: 58,
  },
  windowButton: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  fileName: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 58,
  },
  scroll: {
    maxWidth: '100%',
  },
  content: {
    minWidth: '100%',
    paddingBottom: 12,
    paddingLeft: 8,
    paddingRight: 16,
    paddingTop: 12,
  },
  codeRows: {
    minWidth: '100%',
  },
  codeRow: {
    flexDirection: 'row',
    minHeight: 22,
  },
  lineNumber: {
    flexShrink: 0,
    fontFamily: Fonts.mono,
    fontSize: 13,
    lineHeight: 22,
    paddingRight: 14,
    textAlign: 'right',
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    lineHeight: 22,
  },
});
