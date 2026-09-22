import { Platform, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { BUTTON_EDGE, GameColors, Radii, type GameTone } from '@/constants/game-theme';

type Props = {
  label: string;
  variant?: GameTone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  onPress: () => void;
};

const VARIANTS: Record<GameTone, { face: string; edge: string; label: string }> = {
  primary: { face: GameColors.primary, edge: GameColors.primaryEdge, label: GameColors.onPrimary },
  accent: { face: GameColors.accent, edge: GameColors.accentEdge, label: GameColors.text },
  success: { face: GameColors.success, edge: GameColors.successEdge, label: '#FFFFFF' },
  danger: { face: GameColors.danger, edge: GameColors.dangerEdge, label: '#FFFFFF' },
  ghost: { face: GameColors.card, edge: GameColors.neutralEdge, label: GameColors.subText },
};

export function GameActionButton({
  label,
  variant = 'primary',
  disabled = false,
  style,
  accessibilityHint,
  onPress,
}: Props) {
  const palette = disabled
    ? { face: GameColors.disabled, edge: GameColors.disabledEdge, label: GameColors.disabledText }
    : VARIANTS[variant];

  const handlePress = () => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.face, borderBottomColor: palette.edge },
        style,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: palette.label }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.chip,
    borderBottomWidth: BUTTON_EDGE,
    paddingHorizontal: 20,
  },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 1 },
  label: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});
