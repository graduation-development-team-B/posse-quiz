import { Pressable, StyleSheet, View, type AccessibilityRole } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ScopeChipProps {
  label: string;
  count: number;
  selected: boolean;
  disabled?: boolean;
  role?: Extract<AccessibilityRole, 'button' | 'checkbox'>;
  onPress: () => void;
}

/** 出題数を併記する、Week選択用のコンパクトな範囲コントロール。 */
export function ScopeChip({
  label,
  count,
  selected,
  disabled = false,
  role = 'checkbox',
  onPress,
}: ScopeChipProps) {
  const progressColor = useThemeColor({}, 'progressOrange');
  const selectedTextColor = useThemeColor({}, 'primaryText');
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, selected ? 'progressOrange' : 'border');
  const textColor = useThemeColor({}, disabled ? 'supportGray' : 'text');
  const disabledBackground = useThemeColor({}, 'disabledBackground');
  const focus = useAccessibilityFocus();

  return (
    <Pressable
      accessibilityLabel={`${label}、${count}問。${disabled ? '選択できません' : selected ? '選択中' : '未選択'}`}
      accessibilityRole={role}
      accessibilityState={{
        checked: role === 'checkbox' ? selected : undefined,
        disabled,
        selected,
      }}
      disabled={disabled}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        focus.focusStyle,
        pressed && !disabled ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.chip,
          { backgroundColor: surfaceColor, borderColor },
          selected && { backgroundColor: progressColor, borderColor: progressColor },
          disabled && { backgroundColor: disabledBackground, borderColor: disabledBackground },
        ]}
      >
        <ThemedText
          type="defaultSemiBold"
          style={{ color: selected ? selectedTextColor : textColor }}
          numberOfLines={1}
        >
          {label}
        </ThemedText>
        <ThemedText style={[styles.count, { color: selected ? selectedTextColor : textColor }]}>
          {count}問
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: 48,
    minWidth: 44,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  count: {
    fontSize: 13,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.78,
  },
});
