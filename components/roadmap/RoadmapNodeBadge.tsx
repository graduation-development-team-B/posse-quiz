import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { RoadmapStatus } from '@/lib/progress/roadmap';

interface RoadmapNodeBadgeProps {
  status: RoadmapStatus;
  label: string;
  size?: number;
}

/** 学習マップの教材状態とWeek数を表すバッジ。未着手でもロック表示はしない。 */
export function RoadmapNodeBadge({ status, label, size = 48 }: RoadmapNodeBadgeProps) {
  const successColor = useThemeColor({}, 'growthGreen');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryTextColor = useThemeColor({}, 'primaryText');
  const neutralColor = useThemeColor({}, 'disabledBackground');
  const neutralTextColor = useThemeColor({}, 'disabledText');
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in-progress';
  const backgroundColor = isCompleted ? successColor : isInProgress ? primaryColor : neutralColor;
  const textColor = isCompleted || isInProgress ? primaryTextColor : neutralTextColor;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${label}${isCompleted ? '、クリア' : isInProgress ? '、学習中' : ''}`}
      style={[
        styles.frame,
        styles.circle,
        {
          backgroundColor,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}
    >
      <ThemedText style={[styles.label, { color: textColor, fontSize: label === 'Git' ? size * 0.25 : size * 0.34 }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    overflow: 'hidden',
  },
  label: {
    fontWeight: '900',
    textAlign: 'center',
  },
});
