import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { GameColors, Radii, Space } from '@/constants/game-theme';

type Props = {
  text: string;
  index?: number;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function GameChoice({ text, index, selected, disabled = false, onPress }: Props) {
  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${index === undefined ? '' : `${index + 1}番、`}${text}${selected ? '、選択中' : ''}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={[styles.badge, selected ? styles.badgeSelected : styles.badgeIdle]}>
        <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
          {index === undefined ? '•' : index + 1}
        </Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      {selected ? <Text style={styles.check} accessibilityElementsHidden>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 60,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    borderRadius: Radii.chip,
    borderWidth: 2,
    borderBottomWidth: 4,
    backgroundColor: GameColors.card,
  },
  unselected: { borderColor: GameColors.border },
  selected: { backgroundColor: GameColors.primarySoft, borderColor: GameColors.primary },
  disabled: { opacity: 0.6 },
  pressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  badge: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badgeIdle: { backgroundColor: GameColors.neutral },
  badgeSelected: { backgroundColor: GameColors.primary },
  badgeText: { fontSize: 14, fontWeight: '800', color: GameColors.subText },
  badgeTextSelected: { color: GameColors.onPrimary },
  text: { flex: 1, fontSize: 16, lineHeight: 23, fontWeight: '700', color: GameColors.text },
  check: { fontSize: 20, fontWeight: '800', color: GameColors.primary },
});
