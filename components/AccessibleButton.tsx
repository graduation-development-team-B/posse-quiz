import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';

export type AccessibleButtonProps = Omit<
  PressableProps,
  'accessibilityLabel' | 'accessibilityRole' | 'accessibilityState' | 'children' | 'style'
> & {
  /** A Japanese label is required so every button has an announced purpose. */
  label: string;
  accessibilityLabel?: string;
  selected?: boolean;
  expanded?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared button primitive with a consistent 44pt hit target and accessible
 * state announcements for native screen readers and react-native-web.
 */
export function AccessibleButton({
  label,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  selected,
  expanded,
  variant = 'primary',
  children,
  style,
  ...rest
}: AccessibleButtonProps) {
  const isDisabled = disabled ?? false;
  const primaryColor = useThemeColor({}, 'primary');
  const primaryTextColor = useThemeColor({}, 'primaryText');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const disabledBackground = useThemeColor({}, 'disabledBackground');
  const disabledText = useThemeColor({}, 'disabledText');

  const backgroundColor = isDisabled
    ? disabledBackground
    : variant === 'primary'
      ? primaryColor
      : variant === 'secondary'
        ? surfaceColor
        : 'transparent';
  const foregroundColor = isDisabled
    ? disabledText
    : variant === 'primary'
      ? primaryTextColor
      : textColor;

  const focus = useAccessibilityFocus();

  return (
    <Pressable
      {...rest}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, selected, expanded }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: variant === 'primary' && !isDisabled ? primaryColor : borderColor,
        },
        style,
        focus.focusStyle,
        pressed && !isDisabled ? { opacity: 0.8 } : undefined,
        isDisabled ? styles.disabled : undefined,
      ]}
    >
      {children ?? (
        <ThemedText type="defaultSemiBold" style={{ color: foregroundColor }}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  disabled: {
    opacity: 1,
  },
});
