import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ResponsiveScrollView } from '@/components/layout';
import { PhaseSelector, PHASE_WEEK_KEYS, type CurriculumPhase } from '@/components/home/PhaseSelector';
import { WeekSummaryCard } from '@/components/home/WeekSummaryCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useContentSync } from '@/hooks/useContentSync';
import { useProgress } from '@/contexts/ProgressContext';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import { SUPPORTED_WEEK_KEYS } from '@/lib/constants';
import { percentage } from '@/lib/progress/metrics';
import { isActiveEntity } from '@/lib/quiz/scope';
import type { WeekKey } from '@/types/content';

interface WeekSummary {
  key: WeekKey;
  title: string;
  questionCount: number;
  accuracy: number | null;
  available: boolean;
}

/** 学習タブ。PHを選び、教材（Week）単位で出題範囲へ進む。階層は PH → Week の2段。 */
export default function LearnScreen() {
  const router = useRouter();
  const { catalog } = useContentSync();
  const { snapshot, isLoading: isProgressLoading } = useProgress();
  const { scopeSelection, setScopeSelection } = useQuizSession();
  const [selectedPhase, setSelectedPhase] = useState<CurriculumPhase>('ph1');
  const pageColor = useThemeColor({}, 'pageSurface');
  const surfaceColor = useThemeColor({}, 'surfaceWhite');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const weekSummaries = useMemo<WeekSummary[]>(() => SUPPORTED_WEEK_KEYS.map((key) => {
    const week = catalog?.weekUnits.find((candidate) => candidate.key === key && isActiveEntity(candidate));
    const questionCount = week
      ? catalog?.questions.filter((question) => question.weekUnitId === week.id && isActiveEntity(question)).length ?? 0
      : 0;
    const progress = snapshot?.weekProgress.find((item) => item.weekKey === key);
    return {
      key,
      title: week?.title ?? `Week ${key.replace('week', '')}`,
      questionCount,
      accuracy: percentage(progress?.correctCount ?? 0, progress?.questionCount ?? 0),
      available: week !== undefined && questionCount > 0,
    };
  }), [catalog, snapshot]);

  const visibleWeekSummaries = useMemo(
    () => weekSummaries.filter((week) => PHASE_WEEK_KEYS[selectedPhase].includes(week.key)),
    [selectedPhase, weekSummaries],
  );

  const openScope = useCallback((weekKey: WeekKey) => {
    setScopeSelection({ ...scopeSelection, weekKeys: [weekKey] });
    router.push('/scope');
  }, [router, scopeSelection, setScopeSelection]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: pageColor }]}>
      <ResponsiveScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <View>
            <ThemedText style={[styles.sectionEyebrow, { color: primaryColor }]}>RECOMMENDED CURRICULUM</ThemedText>
            <ThemedText type="subtitle">学習するPHを選ぶ</ThemedText>
          </View>
          {isProgressLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" />
              <ThemedText style={styles.cardHint}>進捗を復元中</ThemedText>
            </View>
          ) : null}
        </View>
        <PhaseSelector selectedPhase={selectedPhase} onSelect={setSelectedPhase} />
        <ThemedText style={styles.phaseHint}>
          {selectedPhase === 'ph1'
            ? 'PH1にはWeek01のミニドリル、Week03〜Week06とGit/GitHub Level 1の教材が入っています。'
            : `${selectedPhase.toUpperCase()}の教材は現在準備中です。`}
        </ThemedText>
        {catalog && visibleWeekSummaries.length > 0 ? (
          <View style={styles.weekList}>
            {visibleWeekSummaries.map((week) => (
              <WeekSummaryCard
                key={week.key}
                weekKey={week.key}
                questionCount={week.questionCount}
                accuracy={week.accuracy}
                disabled={!week.available}
                onPress={() => openScope(week.key)}
              />
            ))}
          </View>
        ) : (
          <ThemedView style={[styles.emptyState, { backgroundColor: surfaceColor, borderColor }]}>
            <ThemedText type="defaultSemiBold">{selectedPhase.toUpperCase()}の教材は準備中です</ThemedText>
            <ThemedText style={styles.cardHint}>
              教材が準備でき次第、このPHのWeekを選んで学習できます。
            </ThemedText>
          </ThemedView>
        )}
      </ResponsiveScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { gap: 18, paddingBottom: 112 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingTop: 20 },
  sectionEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  loading: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  cardHint: { fontSize: 13, lineHeight: 19, opacity: 0.72 },
  phaseHint: { fontSize: 13, lineHeight: 19, opacity: 0.72 },
  weekList: { gap: 12 },
  emptyState: { borderRadius: 12, borderWidth: 1, gap: 8, padding: 20 },
});
