import type { ReactNode } from 'react';
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

type MetricCardTone = 'progress' | 'review' | 'growth' | 'support';

export type MetricCardProps = Omit<ViewProps, 'accessibilityState' | 'children' | 'style'> & {
  label: string;
  value: ReactNode;
  unit?: string;
  caption?: string;
  primary?: boolean;
  tone?: MetricCardTone;
  accessibilityState?: AccessibilityState;
  selected?: boolean;
  disabled?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  registered?: boolean;
  state?: LearningStatus;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Result/progress metric card with a consistent label, value, and state hierarchy. */
export function MetricCard({
  label,
  value,
  unit,
  caption,
  primary = false,
  tone = 'growth',
  accessibilityState,
  accessibilityLabel,
  selected = false,
  disabled = false,
  correct = false,
  incorrect = false,
  registered = false,
  state,
  children,
  style,
  ...rest
}: MetricCardProps) {
  const toneColorName = {
    progress: 'progressOrange',
    review: 'reviewBlue',
    growth: 'growthGreen',
    support: 'supportGray',
  }[tone] as 'progressOrange' | 'reviewBlue' | 'growthGreen' | 'supportGray';
  const accentColor = useThemeColor({}, toneColorName);
  const backgroundColor = useThemeColor({}, 'surfaceWhite');
  const valueColor = useThemeColor({}, disabled ? 'supportGray' : toneColorName);
  const status = getLearningStatus(state, { selected, disabled, correct, incorrect, registered });
  const statusLabel = getLearningStatusLabel(status);
  const labelText = [label, value, unit, caption, statusLabel].filter(Boolean).join(' ');

  return (
    <View
      {...rest}
      accessible
      accessibilityLabel={accessibilityLabel ?? labelText}
      accessibilityRole="summary"
      accessibilityState={{
        ...accessibilityState,
        disabled: disabled || accessibilityState?.disabled,
        selected: selected || accessibilityState?.selected,
      }}
      style={[styles.card, { backgroundColor, borderColor: accentColor }, primary ? styles.primary : undefined, style]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.valueRow}>
        <ThemedText style={[styles.value, primary ? styles.primaryValue : undefined, { color: valueColor }]}>
          {value}
        </ThemedText>
        {unit ? <ThemedText style={styles.unit}>{unit}</ThemedText> : null}
      </View>
      {caption ? <ThemedText style={styles.caption}>{caption}</ThemedText> : null}
      {statusLabel ? <ThemedText type="defaultSemiBold">{statusLabel}</ThemedText> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: LearningRadii.card,
    borderWidth: 1,
    gap: LearningSpacing.adjacent,
    minWidth: 0,
    padding: LearningSpacing.card,
  },
  caption: {
    lineHeight: 20,
    opacity: 0.78,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
  },
  primary: {
    paddingVertical: 24,
  },
  primaryValue: {
    fontSize: 40,
    lineHeight: 48,
  },
  unit: {
    fontSize: 14,
    lineHeight: 20,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  valueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LearningSpacing.adjacent,
  },
});
