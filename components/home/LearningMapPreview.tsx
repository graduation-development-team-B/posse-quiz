import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { RoadmapNodeBadge } from '@/components/roadmap/RoadmapNodeBadge';
import { ThemedText } from '@/components/themed-text';
import { useAccessibilityFocus } from '@/hooks/use-accessibility-focus';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { RoadmapNode } from '@/lib/progress/roadmap';
import { formatWeekBadgeLabel } from '@/lib/progress/roadmap';

interface LearningMapPreviewProps {
  phaseTitle: string;
  nodes: readonly RoadmapNode[];
  onOpenMap: () => void;
  onSelectNode: (node: RoadmapNode) => void;
}

/** ホームに置く学習マップの要約。教材の並びと現在地を1行で見せる。 */
export function LearningMapPreview({
  phaseTitle,
  nodes,
  onOpenMap,
  onSelectNode,
}: LearningMapPreviewProps) {
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const selectedColor = useThemeColor({}, 'selectedBackground');
  const headerFocus = useAccessibilityFocus();
  const footerFocus = useAccessibilityFocus();

  return (
    <View style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="学習マップを開く"
        accessibilityHint="カリキュラム全体のロードマップを表示します"
        onBlur={headerFocus.onBlur}
        onFocus={headerFocus.onFocus}
        onPress={onOpenMap}
        style={({ pressed }) => [styles.header, headerFocus.focusStyle, pressed && styles.pressed]}
      >
        <View style={styles.headerCopy}>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>学習マップ</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{phaseTitle}</ThemedText>
        </View>
        <ThemedText style={[styles.chevron, { color: primaryColor }]}>〉</ThemedText>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        {nodes.map((node, index) => (
          <View key={node.weekKey} style={styles.trackItem}>
            {index > 0 ? (
              <ThemedText
                style={[
                  styles.connector,
                  { color: primaryColor },
                ]}
              >
                →
              </ThemedText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${node.label}${node.statusLabel ? `、${node.statusLabel}` : ''}`}
              accessibilityHint="この教材の出題範囲を選びます"
              onPress={() => onSelectNode(node)}
              style={({ pressed }) => [
                styles.node,
                node.status === 'in-progress' && { backgroundColor: selectedColor },
                pressed && styles.pressed,
              ]}
            >
              <RoadmapNodeBadge
                status={node.status}
                label={formatWeekBadgeLabel(node.weekKey)}
                size={46}
              />
              <ThemedText style={styles.nodeLabel}>{node.label}</ThemedText>
              {node.statusLabel ? (
                <ThemedText
                  style={[
                    styles.nodeStatus,
                    node.status === 'in-progress' && { color: primaryColor, fontWeight: '800' },
                  ]}
                >
                  {node.statusLabel}
                </ThemedText>
              ) : null}
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="すべてのカリキュラムを見る"
        accessibilityHint="学習マップ画面へ移動します"
        onBlur={footerFocus.onBlur}
        onFocus={footerFocus.onFocus}
        onPress={onOpenMap}
        style={({ pressed }) => [
          styles.footer,
          { borderColor },
          footerFocus.focusStyle,
          pressed && styles.pressed,
        ]}
      >
        <ThemedText type="defaultSemiBold" style={styles.footerLabel}>
          すべてのカリキュラムを見る 〉
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 44,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.72,
  },
  chevron: {
    fontSize: 16,
    fontWeight: '800',
  },
  track: {
    alignItems: 'flex-start',
    gap: 2,
    paddingVertical: 2,
  },
  trackItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  connector: {
    fontSize: 16,
    fontWeight: '800',
    paddingBottom: 22,
  },
  node: {
    alignItems: 'center',
    borderRadius: 18,
    gap: 3,
    minHeight: 44,
    minWidth: 74,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  nodeStatus: {
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  footerLabel: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
  },
});
