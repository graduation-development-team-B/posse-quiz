import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Mascot } from '@/components/game/Mascot';
import { GameColors, Radii, Space } from '@/constants/game-theme';

type Props = {
  tone: 'success' | 'retry';
  title: string;
  detail?: string;
};

export function GameResultBanner({ tone, title, detail }: Props) {
  const isSuccess = tone === 'success';
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      accessibilityRole="summary"
      style={[styles.panel, { backgroundColor: isSuccess ? GameColors.successSoft : GameColors.dangerSoft }]}
    >
      <Mascot mood={isSuccess ? 'cheer' : 'sad'} size={64} />
      <View style={styles.texts}>
        <Text style={[styles.title, { color: isSuccess ? GameColors.successEdge : GameColors.dangerEdge }]}>
          {isSuccess ? '✓ ' : '× '}{title}
        </Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    borderRadius: Radii.card,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
  },
  texts: { flex: 1, gap: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  detail: { fontSize: 14, fontWeight: '600', color: GameColors.subText, lineHeight: 20 },
});
