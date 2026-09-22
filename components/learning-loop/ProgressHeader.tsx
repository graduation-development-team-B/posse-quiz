import { StyleSheet, View } from 'react-native';

import { AccessibleButton } from '@/components/AccessibleButton';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ProgressHeaderProps {
  currentIndex: number;
  total: number;
  onExit: () => void;
}

/**
 * Immersive quiz header: the only actions are interruption and progress.
 * The current question is kept visible for both sighted users and screen
 * readers without exposing extra navigation while a session is in progress.
 */
export function ProgressHeader({ currentIndex, total, onExit }: ProgressHeaderProps) {
  const primaryColor = useThemeColor({}, 'progressOrange');
  const trackColor = useThemeColor({}, 'disabledBackground');
  const safeTotal = Math.max(0, total);
  const safeCurrent = safeTotal > 0 ? Math.min(Math.max(currentIndex, 1), safeTotal) : 0;
  const progress = safeTotal > 0 ? safeCurrent / safeTotal : 0;

  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={`クイズ、問題${safeCurrent} / ${safeTotal}`}
      style={styles.container}
    >
      <AccessibleButton
        label="×"
        accessibilityLabel="クイズを中断"
        accessibilityHint="確認後にクイズを終了して出題範囲へ戻ります"
        onPress={onExit}
        variant="ghost"
        style={styles.exitButton}
      />
      <View style={styles.progressArea}>
        <ThemedText type="defaultSemiBold" style={styles.count}>
          {safeCurrent} / {safeTotal}
        </ThemedText>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="クイズの進捗"
          accessibilityValue={{ min: 0, max: safeTotal, now: safeCurrent }}
          style={[styles.track, { backgroundColor: trackColor }]}
        >
          <View style={[styles.fill, { backgroundColor: primaryColor, width: `${progress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    minHeight: 56,
    width: '100%',
  },
  exitButton: {
    borderRadius: 999,
    marginVertical: 0,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  progressArea: {
    flex: 1,
    gap: 8,
  },
  count: {
    textAlign: 'center',
  },
  track: {
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
});
