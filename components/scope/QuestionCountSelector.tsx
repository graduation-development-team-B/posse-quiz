import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ALLOWED_QUESTION_COUNTS, type AllowedQuestionCount } from '@/lib/constants';

interface QuestionCountSelectorProps {
  value: AllowedQuestionCount;
  onChange: (value: AllowedQuestionCount) => void;
}

export function QuestionCountSelector({ value, onChange }: QuestionCountSelectorProps) {
  const tint = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');
  const selectedTextColor = useThemeColor({}, 'primaryText');
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="問題数設定" style={styles.group}>
      {ALLOWED_QUESTION_COUNTS.map((count) => (
        <QuestionCountOption
          key={count}
          count={count}
          selected={count === value}
          tint={tint}
          borderColor={borderColor}
          selectedTextColor={selectedTextColor}
          onPress={() => onChange(count)}
        />
      ))}
    </View>
  );
}

function QuestionCountOption({
  count,
  selected,
  tint,
  borderColor,
  selectedTextColor,
  onPress,
}: {
  count: AllowedQuestionCount;
  selected: boolean;
  tint: string;
  borderColor: string;
  selectedTextColor: string;
  onPress: () => void;
}) {
  const focus = useAccessibilityFocus();

  return (
    <Pressable
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      accessibilityRole="radio"
      accessibilityLabel={`${count}問`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, focus.focusStyle, pressed && styles.pressed]}
    >
      <ThemedView
        style={[
          styles.option,
          { borderColor },
          selected && { backgroundColor: tint, borderColor: tint },
        ]}
      >
        <ThemedText style={selected ? { color: selectedTextColor, fontWeight: '700' } : undefined}>
          {count}問
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: 10,
  },
  pressable: {
    flex: 1,
    minHeight: 48,
  },
  pressed: {
    opacity: 0.78,
  },
  option: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
  },
});
