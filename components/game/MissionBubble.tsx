import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Mascot, type MascotMood } from '@/components/game/Mascot';
import { GameColors, Radii, Space } from '@/constants/game-theme';

type Props = {
  label: string;
  prompt: string;
  children?: ReactNode;
  celebrateKey?: number;
  mood?: MascotMood;
};

export function MissionBubble({ label, prompt, children, celebrateKey = 0, mood = 'focus' }: Props) {
  const jump = useSharedValue(0);

  useEffect(() => {
    if (celebrateKey === 0) return;
    jump.value = withSequence(
      withTiming(-16, { duration: 160 }),
      withSpring(0, { damping: 6, stiffness: 220 }),
    );
  }, [celebrateKey, jump]);

  const mascotStyle = useAnimatedStyle(() => ({ transform: [{ translateY: jump.value }] }));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Animated.View style={mascotStyle}>
          <Mascot mood={mood} size={64} />
        </Animated.View>
        <View style={styles.bubble}>
          <View style={styles.tail} />
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.prompt} accessibilityRole="header">{prompt}</Text>
        </View>
      </View>
      {children ? <View style={styles.extra}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Space.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  bubble: {
    flex: 1,
    backgroundColor: GameColors.card,
    borderRadius: Radii.card,
    borderWidth: 2,
    borderColor: GameColors.border,
    paddingVertical: Space.md,
    paddingHorizontal: Space.lg,
    gap: 6,
  },
  tail: {
    position: 'absolute',
    left: -7,
    top: 24,
    width: 12,
    height: 12,
    backgroundColor: GameColors.card,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: GameColors.border,
    transform: [{ rotate: '45deg' }],
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: GameColors.primary,
    textTransform: 'uppercase',
  },
  prompt: {
    fontSize: 20,
    lineHeight: 29,
    fontWeight: '700',
    color: GameColors.text,
  },
  extra: { gap: Space.md },
});
