import { StyleSheet, View } from 'react-native';

import { Mascot, type MascotMood } from '@/components/game/Mascot';
import { AccessibleButton } from '@/components/AccessibleButton';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface DailyMissionCardProps {
  /** 例: Week03の問題に挑戦しよう！ */
  title: string;
  answeredCount: number;
  totalCount: number;
  ctaLabel: string;
  /** マスコットの吹き出しに出す応援メッセージ。 */
  encouragement: string;
  mood?: MascotMood;
  disabled?: boolean;
  onPress: () => void;
}

/** 今日取り組む1件の教材と進捗、開始ボタンをまとめたホームの主役カード。 */
export function DailyMissionCard({
  title,
  answeredCount,
  totalCount,
  ctaLabel,
  encouragement,
  mood = 'focus',
  disabled = false,
  onPress,
}: DailyMissionCardProps) {
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const trackColor = useThemeColor({}, 'disabledBackground');
  const ratio = totalCount > 0 ? Math.min(1, answeredCount / totalCount) : 0;

  return (
    <View style={styles.row}>
      <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
        <ThemedText style={[styles.eyebrow, { color: primaryColor }]}>今日のミッション</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.title}>{title}</ThemedText>
        <View style={styles.countRow}>
          <ThemedText style={[styles.answered, { color: primaryColor }]}>{answeredCount}</ThemedText>
          <ThemedText style={styles.total}>/{totalCount} 問</ThemedText>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`ミッションの進捗 ${totalCount}問中${answeredCount}問`}
          style={[styles.track, { backgroundColor: trackColor }]}
        >
          <View
            style={[styles.fill, { backgroundColor: primaryColor, width: `${Math.round(ratio * 100)}%` }]}
          />
        </View>
        <AccessibleButton
          label={ctaLabel}
          accessibilityHint="出題範囲を選ぶ画面へ進みます"
          disabled={disabled}
          onPress={onPress}
          style={styles.cta}
        />
      </View>
      <View style={styles.mascotColumn}>
        <View style={[styles.bubble, { backgroundColor: surfaceColor, borderColor }]}>
          <ThemedText style={styles.bubbleText}>{encouragement}</ThemedText>
        </View>
        <Mascot mood={mood} size={92} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minWidth: 0,
    padding: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 17,
    lineHeight: 25,
  },
  countRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
  },
  answered: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  total: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.75,
  },
  track: {
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
  cta: {
    borderRadius: 999,
    marginHorizontal: 0,
    marginTop: 6,
  },
  mascotColumn: {
    alignItems: 'center',
    gap: 4,
    width: 116,
  },
  bubble: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
