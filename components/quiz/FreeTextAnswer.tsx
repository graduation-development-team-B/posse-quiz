import { StyleSheet, TextInput } from 'react-native';

import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FreeTextAnswerProps {
  value: string;
  disabled?: boolean;
  maxLength?: number;
  onChangeText: (value: string) => void;
}

export function FreeTextAnswer({
  value,
  disabled = false,
  maxLength = 64,
  onChangeText,
}: FreeTextAnswerProps) {
  const textColor = useThemeColor({ light: '#3B2314', dark: '#F8FAFC' }, 'text');
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E293B' }, 'surface');
  const borderColor = useThemeColor({ light: '#CBD5E1', dark: '#475569' }, 'border');
  const placeholderColor = useThemeColor({ light: '#64748B', dark: '#94A3B8' }, 'textSecondary');

  const focus = useAccessibilityFocus();

  return (
    <TextInput
      accessibilityLabel="空欄の答えを入力"
      accessibilityRole="text"
      accessibilityState={{ disabled }}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      autoCapitalize="none"
      autoCorrect={false}
      editable={!disabled}
      maxLength={maxLength}
      onChangeText={onChangeText}
      placeholder="答えを入力してください"
      placeholderTextColor={placeholderColor}
      style={[styles.input, focus.focusStyle, { backgroundColor, borderColor, color: textColor }, disabled && styles.disabled]}
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.7,
  },
});
