import {
  StyleSheet,
  View,
  type AccessibilityState,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  getLearningStatus,
  getLearningStatusLabel,
  LearningRadii,
  LearningSpacing,
  type LearningStatus,
} from '@/styles/learning';

type CountBadgeTone = 'progress' | 'review' | 'growth' | 'support';

export type CountBadgeProps = Omit<ViewProps, 'accessibilityState' | 'style'> & {
  count?: number | string;
  value?: number | string;
  label?: string;
  accessibilityState?: AccessibilityState;
  selected?: boolean;
  disabled?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  registered?: boolean;
  state?: LearningStatus;
  tone?: CountBadgeTone;
  style?: StyleProp<ViewStyle>;
};

/** 教材と復習状態向けの、コンパクトな件数・状態ラベル。 */
export function CountBadge({
  count,
  value,
  label,
  accessibilityState,
  accessibilityLabel,
  selected = false,
  disabled = false,
  correct = false,
  incorrect = false,
  registered = false,
  state,
  tone = 'support',
  style,
  ...rest
}: CountBadgeProps) {
  const toneColorName = {
    progress: 'progressOrange',
    review: 'reviewBlue',
    growth: 'growthGreen',
    support: 'supportGray',
  }[tone] as 'progressOrange' | 'reviewBlue' | 'growthGreen' | 'supportGray';
  const color = useThemeColor({}, toneColorName);
  const backgroundColor = useThemeColor({}, 'surfaceWhite');
  const status = getLearningStatus(state, { selected, disabled, correct, incorrect, registered });
  const statusLabel = getLearningStatusLabel(status);
  const displayValue = value ?? count ?? '—';
  const visibleLabel = [statusLabel, label, displayValue].filter(Boolean).join(' ');

  return (
    <View
      {...rest}
      accessible
      accessibilityLabel={accessibilityLabel ?? visibleLabel}
      accessibilityRole="text"
      accessibilityState={{
        ...accessibilityState,
        disabled: disabled || accessibilityState?.disabled,
        selected: selected || accessibilityState?.selected,
      }}
      style={[styles.badge, { backgroundColor, borderColor: color }, style]}>
      <ThemedText type="defaultSemiBold" style={{ color }}>
        {statusLabel ? `${statusLabel} ` : ''}
        {displayValue}
        {label ? ` ${label}` : ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: LearningRadii.badge,
    borderWidth: 1,
    flexDirection: 'row',
    gap: LearningSpacing.adjacent,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
