import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ChoiceOption } from '@/types/content';

interface QuizOptionProps {
  option: ChoiceOption;
  index?: number;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function QuizOption({ option, index, selected, disabled = false, onPress }: QuizOptionProps) {
  const selectedBackground = useThemeColor({}, 'selectedBackground');
  const selectedBorder = useThemeColor({ light: '#0369A1', dark: '#67E8F9' }, 'selectedBorder');
  const border = useThemeColor({ light: '#CBD5E1', dark: '#475569' }, 'border');

  const focus = useAccessibilityFocus();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${index === undefined ? '' : `${index + 1}番、`}${option.text}${selected ? '、選択中' : ''}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, focus.focusStyle, pressed && !disabled && styles.pressed]}
    >
      <ThemedView
        variant="surface"
        style={[
          styles.option,
          { borderColor: selected ? selectedBorder : border },
          selected && { backgroundColor: selectedBackground },
          disabled && styles.disabled,
        ]}
      >
        <ThemedText style={styles.optionIndex}>{index === undefined ? '•' : index + 1}</ThemedText>
        <ThemedText style={styles.optionText}>{option.text}</ThemedText>
        {selected ? <ThemedText style={styles.selectedMark} aria-hidden>✓</ThemedText> : null}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: 52,
    width: '100%',
  },
  option: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionIndex: {
    alignItems: 'center',
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 12,
    minWidth: 22,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
  },
  selectedMark: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 12,
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.78,
  },
});
