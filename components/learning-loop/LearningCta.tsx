import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type AccessibilityState,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  getLearningStatus,
  getLearningStatusLabel,
  LearningRadii,
  LearningSpacing,
  LEARNING_TOUCH_TARGET,
  type LearningStatus,
} from '@/styles/learning';

type LearningCtaTone = 'progress' | 'review' | 'growth' | 'support';
type LearningCtaVariant = 'primary' | 'secondary' | 'ghost';

export type LearningCtaProps = Omit<
  PressableProps,
  'accessibilityLabel' | 'accessibilityRole' | 'accessibilityState' | 'children' | 'style'
> & {
  label: string;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  selected?: boolean;
  disabled?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  registered?: boolean;
  state?: LearningStatus;
  tone?: LearningCtaTone;
  variant?: LearningCtaVariant;
  /** Primary actions default to a full-width, thumb-friendly placement. */
  fullWidth?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Shared CTA with semantic state announcements, focus visibility, and 44pt hit target. */
export function LearningCta({
  label,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  selected = false,
  disabled = false,
  correct = false,
  incorrect = false,
  registered = false,
  state,
  tone = 'progress',
  variant = 'primary',
  fullWidth = variant === 'primary',
  children,
  style,
  ...rest
}: LearningCtaProps) {
  const isDisabled = disabled || accessibilityState?.disabled === true;
  const toneColorName = {
    progress: 'progressOrange',
    review: 'reviewBlue',
    growth: 'growthGreen',
    support: 'supportGray',
  }[tone] as 'progressOrange' | 'reviewBlue' | 'growthGreen' | 'supportGray';
  const toneColor = useThemeColor({}, toneColorName);
  const backgroundColor = useThemeColor({}, 'surfaceWhite');
  const disabledTextColor = useThemeColor({}, 'supportGray');
  const primaryTextColor = useThemeColor({}, 'primaryText');
  const textColor = useThemeColor({}, toneColorName);
  const disabledBackground = useThemeColor({}, 'disabledBackground');
  const defaultBorderColor = useThemeColor({}, 'border');
  const status = getLearningStatus(state, { selected, disabled: isDisabled, correct, incorrect, registered });
  const statusLabel = getLearningStatusLabel(status);
  const visibleLabel = [statusLabel, label].filter(Boolean).join(' ');
  const focus = useAccessibilityFocus();

  const foregroundColor = isDisabled
    ? disabledTextColor
    : variant === 'primary'
      ? primaryTextColor
      : textColor;
  const buttonBackground = isDisabled
    ? disabledBackground
    : variant === 'primary'
      ? toneColor
      : variant === 'secondary'
        ? backgroundColor
        : 'transparent';
  const borderColor = isDisabled || variant === 'ghost' ? defaultBorderColor : toneColor;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? visibleLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        ...accessibilityState,
        disabled: isDisabled,
        selected: selected || accessibilityState?.selected,
      }}
      disabled={isDisabled}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      style={({ pressed }) => [
        styles.button,
        fullWidth ? styles.fullWidth : undefined,
        { backgroundColor: buttonBackground, borderColor },
        focus.focusStyle,
        pressed && !isDisabled ? styles.pressed : undefined,
        style,
      ]}
    >
      {children ?? (
        <ThemedText type="defaultSemiBold" style={{ color: foregroundColor }}>
          {visibleLabel}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: LearningRadii.control,
    borderWidth: 1,
    justifyContent: 'center',
    margin: LearningSpacing.adjacent / 2,
    minHeight: LEARNING_TOUCH_TARGET,
    minWidth: LEARNING_TOUCH_TARGET,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  fullWidth: {
    alignSelf: 'stretch',
    marginHorizontal: 0,
    width: '100%',
  },
  pressed: {
    opacity: 0.8,
  },
});
