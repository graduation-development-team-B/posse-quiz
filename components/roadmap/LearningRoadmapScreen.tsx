import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ResponsiveScrollView } from '@/components/layout';
import { StudyWeekCard } from '@/components/home/StudyWeekCard';
import { RoadmapPathConnector, RoadmapPathNode } from '@/components/roadmap';
import { ThemedText } from '@/components/themed-text';
import { useProgress } from '@/contexts/ProgressContext';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import { useContentSync } from '@/hooks/useContentSync';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ROADMAP_PHASE_TITLE } from '@/lib/constants';
import {
  buildRoadmapNodes,
  buildStudyWeek,
  countRoadmapProgress,
  countStudyDays,
  type RoadmapNode,
} from '@/lib/progress/roadmap';

/** 背景に置く飾り。道筋の外側へ散らして、地図らしい余白を作る。 */
const DECORATIONS: readonly { glyph: string; top: number; left: `${number}%` }[] = [
  { glyph: '🌳', top: 24, left: '78%' },
  { glyph: '🌲', top: 130, left: '8%' },
  { glyph: '🌳', top: 250, left: '84%' },
  { glyph: '🌲', top: 360, left: '6%' },
  { glyph: '🌳', top: 470, left: '80%' },
  { glyph: '🌲', top: 590, left: '12%' },
];

/** 学習マップ画面。PH1の教材を蛇行する道筋として並べ、現在地とロック状態を示す。 */
export default function RoadmapScreen() {
  const router = useRouter();
  const { catalog } = useContentSync();
  const { snapshot } = useProgress();
  const { scopeSelection, setScopeSelection } = useQuizSession();
  const [notice, setNotice] = useState<string | null>(null);
  const pageColor = useThemeColor({}, 'pageSurface');
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const nodes = useMemo(() => buildRoadmapNodes(catalog, snapshot), [catalog, snapshot]);
  const progress = useMemo(() => countRoadmapProgress(nodes), [nodes]);
  const studyWeek = useMemo(() => buildStudyWeek(snapshot), [snapshot]);
  const studiedDays = countStudyDays(studyWeek);

  const openNode = useCallback((node: RoadmapNode) => {
    setNotice(null);
    setScopeSelection({ ...scopeSelection, weekKeys: [node.weekKey] });
    router.push('/scope');
  }, [router, scopeSelection, setScopeSelection]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: pageColor }]}>
      <View style={[styles.header, { borderColor }]}>
        <ThemedText type="defaultSemiBold" accessibilityRole="header" style={styles.headerTitle}>
          {ROADMAP_PHASE_TITLE}
        </ThemedText>
      </View>

      <ResponsiveScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StudyWeekCard days={studyWeek} studiedDays={studiedDays} />

        <View style={[styles.summary, { backgroundColor: surfaceColor, borderColor }]}>
          <ThemedText style={styles.summaryLabel}>クリアした教材</ThemedText>
          <ThemedText type="defaultSemiBold" style={[styles.summaryValue, { color: primaryColor }]}>
            {progress.completed}/{progress.total}
          </ThemedText>
        </View>

        {notice ? (
          <ThemedText
            accessibilityLiveRegion="polite"
            style={[styles.notice, { backgroundColor: surfaceColor, borderColor }]}
          >
            {notice}
          </ThemedText>
        ) : null}

        <View style={styles.map}>
          <View pointerEvents="none" style={styles.decorationLayer}>
            {DECORATIONS.map((decoration, index) => (
              <ThemedText
                key={`${decoration.glyph}-${index}`}
                style={[styles.decoration, { left: decoration.left, top: decoration.top }]}
              >
                {decoration.glyph}
              </ThemedText>
            ))}
          </View>

          {nodes.map((node, index) => (
            <View key={node.weekKey} style={styles.step}>
              {index > 0 ? (
                <RoadmapPathConnector toward={index % 2 === 0 ? 'left' : 'right'} />
              ) : null}
              <RoadmapPathNode
                node={node}
                align={index % 2 === 0 ? 'left' : 'right'}
                onPress={openNode}
              />
            </View>
          ))}

          <View style={styles.goal}>
            <RoadmapPathConnector toward={nodes.length % 2 === 0 ? 'left' : 'right'} />
            <ThemedText
              accessibilityRole="text"
              accessibilityLabel={
                progress.total > 0 && progress.completed === progress.total
                  ? 'すべての教材をクリアしました'
                  : 'すべての教材をクリアするとごほうびが開きます'
              }
              style={[
                styles.chest,
                !(progress.total > 0 && progress.completed === progress.total) && styles.chestLocked,
              ]}
            >
              🧰
            </ThemedText>
            <ThemedText style={styles.goalLabel}>PH1クリア</ThemedText>
          </View>
        </View>
      </ResponsiveScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  content: {
    gap: 14,
    paddingBottom: 120,
    paddingTop: 16,
  },
  summary: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  map: {
    paddingVertical: 4,
    position: 'relative',
  },
  decorationLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  decoration: {
    fontSize: 26,
    opacity: 0.28,
    position: 'absolute',
  },
  step: {
    gap: 0,
  },
  goal: {
    alignItems: 'center',
  },
  chest: {
    fontSize: 42,
    lineHeight: 50,
  },
  chestLocked: {
    opacity: 0.45,
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    opacity: 0.8,
  },
});
