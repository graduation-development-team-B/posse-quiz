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

export type LearningCardProps = Omit<ViewProps, 'accessibilityState' | 'children' | 'style'> & {
  children?: ReactNode;
  title?: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  registered?: boolean;
  state?: LearningStatus;
  accessibilityState?: AccessibilityState;
  style?: StyleProp<ViewStyle>;
};

/** Shared information card with semantic state text in addition to color. */
export function LearningCard({
  children,
  title,
  description,
  selected = false,
  disabled = false,
  correct = false,
  incorrect = false,
  registered = false,
  state,
  accessibilityState,
  accessibilityLabel,
  accessibilityRole = 'summary',
  style,
  ...rest
}: LearningCardProps) {
  const backgroundColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, selected ? 'progressOrange' : 'border');
  const textColor = useThemeColor({}, disabled ? 'supportGray' : 'text');
  const status = getLearningStatus(state, { selected, disabled, correct, incorrect, registered });
  const statusLabel = getLearningStatusLabel(status);
  const label = accessibilityLabel ?? ([title, description, statusLabel].filter(Boolean).join('、') || undefined);

  return (
    <View
      {...rest}
      accessibilityLabel={label}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        ...accessibilityState,
        disabled: disabled || accessibilityState?.disabled,
        selected: selected || accessibilityState?.selected,
      }}
      style={[
        styles.card,
        { backgroundColor, borderColor },
        disabled ? styles.disabled : undefined,
        style,
      ]}>
      {title ? <ThemedText type="subtitle" style={{ color: textColor }}>{title}</ThemedText> : null}
      {description ? <ThemedText style={styles.description}>{description}</ThemedText> : null}
      {statusLabel ? (
        <ThemedText type="defaultSemiBold" style={styles.status} accessibilityLabel={statusLabel}>
          {statusLabel}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: LearningRadii.card,
    borderWidth: 1,
    gap: LearningSpacing.control,
    minWidth: 0,
    padding: LearningSpacing.card,
  },
  description: {
    lineHeight: 22,
  },
  disabled: {
    opacity: 0.72,
  },
  status: {
    marginTop: LearningSpacing.adjacent,
  },
});
