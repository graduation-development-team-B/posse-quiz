import { Pressable, StyleSheet, View } from 'react-native';

import { RoadmapNodeBadge } from '@/components/roadmap/RoadmapNodeBadge';
import { ThemedText } from '@/components/themed-text';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatWeekBadgeLabel } from '@/lib/progress/roadmap';
import type { RoadmapNode } from '@/lib/progress/roadmap';

interface RoadmapPathNodeProps {
  node: RoadmapNode;
  /** 蛇行レイアウトの寄せ方向。 */
  align: 'left' | 'right';
  onPress: (node: RoadmapNode) => void;
}

/** 学習マップ画面に置く1教材のカード。状態と進捗を1枚で示す。 */
export function RoadmapPathNode({ node, align, onPress }: RoadmapPathNodeProps) {
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'growthGreen');
  const isStarted = node.status === 'in-progress';
  const statusColor = node.status === 'completed'
    ? successColor
    : isStarted
      ? primaryColor
      : undefined;
  const focus = useAccessibilityFocus();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${node.label}${node.statusLabel ? `、${node.statusLabel}` : ''}${
        node.totalCount > 0 ? `、${node.totalCount}問中${node.answeredCount}問回答` : ''
      }`}
      accessibilityHint="この教材の出題範囲を選びます"
      accessibilityState={{ disabled: false }}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={() => onPress(node)}
      style={({ pressed }) => [
        styles.card,
        align === 'right' ? styles.alignRight : styles.alignLeft,
        { backgroundColor: surfaceColor, borderColor },
        node.status === 'in-progress' && { borderColor: primaryColor, borderWidth: 2 },
        focus.focusStyle,
        pressed && styles.pressed,
      ]}
    >
      <RoadmapNodeBadge status={node.status} label={formatWeekBadgeLabel(node.weekKey)} size={44} />
      <View style={styles.copy}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>{node.label}</ThemedText>
        {node.statusLabel ? (
          <ThemedText style={[styles.status, statusColor ? { color: statusColor } : undefined]}>
            {node.statusLabel}
          </ThemedText>
        ) : null}
        {node.totalCount > 0 ? (
          <ThemedText style={styles.detail}>{node.answeredCount}/{node.totalCount}問</ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

/** ノード間をつなぐ破線。次のノードが寄る方向へ傾けて道筋に見せる。 */
export function RoadmapPathConnector({ toward }: { toward: 'left' | 'right' }) {
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.connector}>
      <View
        style={[
          styles.connectorLine,
          { borderColor },
          toward === 'right' ? styles.leanRight : styles.leanLeft,
        ]}
      />
      <ThemedText style={[styles.connectorArrow, { color: borderColor }]}>▼</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    maxWidth: 260,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '74%',
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  copy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  status: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  detail: {
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.7,
  },
  connector: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 42,
    justifyContent: 'center',
    width: 120,
  },
  connectorLine: {
    borderStyle: 'dashed',
    borderTopWidth: 2,
    width: 96,
  },
  leanRight: {
    transform: [{ rotate: '24deg' }],
  },
  leanLeft: {
    transform: [{ rotate: '-24deg' }],
  },
  connectorArrow: {
    fontSize: 12,
    position: 'absolute',
  },
  pressed: {
    opacity: 0.75,
  },
});
