import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AccessibleButton } from '@/components/AccessibleButton';
import { DrillList } from '@/components/drill/DrillList';
import { isConsoleQuestion } from '@/lib/quiz/consoleDrill';
import { LearningCta } from '@/components/learning-loop';
import { QuestionCountSelector } from '@/components/scope/QuestionCountSelector';
import { ScopeSheet } from '@/components/scope/ScopeSheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useContent } from '@/contexts/ContentContext';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import { SUPPORTED_WEEK_KEYS, type AllowedQuestionCount } from '@/lib/constants';
import { useThemeColor } from '@/hooks/use-theme-color';
import { countQuestionsInScope, isActiveEntity } from '@/lib/quiz/scope';
import { formatCurriculumUnitLabel } from '@/lib/content/curriculumLabels';
import type { WeekKey } from '@/types/content';

const formatWeekLabel = formatCurriculumUnitLabel;

export default function ScopeSelectionScreen() {
  const router = useRouter();
  const handleDismiss = useCallback(() => router.back(), [router]);
  const { catalog, state: syncState, retry } = useContent();
  const { scopeSelection, setScopeSelection, startSessionForScope } = useQuizSession();
  const errorColor = useThemeColor({}, 'error');
  const [notice, setNotice] = useState<string | null>(null);
  const hasInitializedDefault = useRef(false);

  const activeWeeks = useMemo(() => {
    if (!catalog) return [];
    const supported = new Set<string>(SUPPORTED_WEEK_KEYS);
    return catalog.weekUnits
      .filter((week) => supported.has(week.key) && isActiveEntity(week))
      .sort((a, b) => a.order - b.order);
  }, [catalog]);

  const activeWeekByKey = useMemo(
    () => new Map(activeWeeks.map((week) => [week.key, week])),
    [activeWeeks],
  );

  const selectedWeekKeys = useMemo(
    () => scopeSelection.weekKeys.filter((key) => activeWeekByKey.has(key)),
    [activeWeekByKey, scopeSelection.weekKeys],
  );

  const selectedWeekKey = selectedWeekKeys[0];

  // The modal always keeps at most one valid Week. 階層は PH → Week の2段。
  useEffect(() => {
    const weeksChanged = scopeSelection.weekKeys.length !== (selectedWeekKey ? 1 : 0)
      || scopeSelection.weekKeys[0] !== selectedWeekKey;
    if (weeksChanged) {
      setScopeSelection({
        ...scopeSelection,
        weekKeys: selectedWeekKey ? [selectedWeekKey] : [],
      });
    }
  }, [scopeSelection, selectedWeekKey, setScopeSelection]);

  const questionCountByWeek = useMemo(() => {
    const counts = new Map<string, number>();
    if (!catalog) return counts;
    for (const question of catalog.questions) {
      if (!isActiveEntity(question)) continue;
      const week = catalog.weekUnits.find(
        (candidate) => candidate.id === question.weekUnitId && isActiveEntity(candidate),
      );
      if (!week || !SUPPORTED_WEEK_KEYS.includes(week.key as WeekKey)) continue;
      counts.set(week.key, (counts.get(week.key) ?? 0) + 1);
    }
    return counts;
  }, [catalog]);

  // A direct visit starts with the first usable week; later user changes are preserved.
  useEffect(() => {
    if (hasInitializedDefault.current || activeWeeks.length === 0) return;
    hasInitializedDefault.current = true;
    if (selectedWeekKeys.length > 0) return;

    const firstAvailableWeek = activeWeeks.find((week) => (questionCountByWeek.get(week.key) ?? 0) > 0);
    if (firstAvailableWeek) {
      setScopeSelection({ ...scopeSelection, weekKeys: [firstAvailableWeek.key] });
    }
  }, [activeWeeks, hasInitializedDefault, questionCountByWeek, selectedWeekKeys.length, scopeSelection, setScopeSelection]);

  const questionCount = useMemo(() => {
    if (!catalog || !selectedWeekKey) return 0;
    return countQuestionsInScope(catalog, {
      weekKeys: [selectedWeekKey],
    });
  }, [catalog, selectedWeekKey]);

  const updateSelection = useCallback((changes: Partial<typeof scopeSelection>) => {
    setNotice(null);
    setScopeSelection({ ...scopeSelection, ...changes });
  }, [scopeSelection, setScopeSelection]);

  const handleStart = useCallback(() => {
    if (!catalog) {
      setNotice('教材を読み込むまで開始できません。');
      return;
    }
    if (!selectedWeekKey) {
      setNotice('学習するWeekが選択されていません。');
      return;
    }
    if (questionCount === 0) {
      setNotice('このWeekに出題可能な問題がありません。Weekを選び直してください。');
      return;
    }

    const session = startSessionForScope(
      catalog,
      { weekKeys: [selectedWeekKey] },
      scopeSelection.questionCount,
    );
    if (!session) {
      setNotice('セッションを作成できませんでした。Weekを選び直してください。');
      return;
    }

    // CatalogやSession本体はContextに保持し、URLには許可されたIDだけを渡す。
    router.push({ pathname: '/quiz/[sessionId]', params: { sessionId: session.id } } as never);
  }, [catalog, questionCount, router, scopeSelection.questionCount, selectedWeekKey, startSessionForScope]);

  if (!catalog) {
    return (
      <ThemedView style={styles.centered}>
        {syncState === 'loading' || syncState === 'uninitialized' ? <ActivityIndicator /> : null}
        <ThemedText type="title">出題範囲</ThemedText>
        <ThemedText style={styles.centerText}>
          {syncState === 'error' ? '教材を取得できませんでした。再試行してください。' : '教材を準備しています。'}
        </ThemedText>
        {syncState === 'error' ? (
          <AccessibleButton label="教材を再試行" onPress={() => void retry()} style={styles.retryButton} />
        ) : null}
      </ThemedView>
    );
  }

  if (selectedWeekKey === 'week1') return <DrillList questions={catalog.questions} />;

  const rangeValidationMessage = !selectedWeekKey
    ? '学習するWeekが選択されていません。'
    : questionCount === 0
      ? 'このWeekに出題可能な問題がありません。'
      : null;
  const startDisabled = !selectedWeekKey || questionCount === 0;

  return (
    <ScopeSheet
      onDismiss={handleDismiss}
      footer={(
        <View style={styles.footerContent}>
          {notice || rangeValidationMessage ? (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>{notice ?? rangeValidationMessage}</ThemedText>
          ) : null}
          <LearningCta
            accessibilityHint={startDisabled ? rangeValidationMessage ?? '有効な範囲を選択してください。' : '選択した範囲で学習を開始します。'}
            disabled={startDisabled}
            label={!selectedWeekKey ? 'Weekを確認して始めよう' : `問題を始めよう！`}
            onPress={handleStart}
          />
        </View>
      )}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <AccessibleButton
              accessibilityLabel="学習設定を閉じる"
              accessibilityHint="前の画面へ戻ります"
              label="×"
              onPress={handleDismiss}
              variant="ghost"
              style={styles.closeButton}
            />
          </View>
          <ThemedText type="subtitle" style={styles.centeredTitle}>問題数を選ぶ</ThemedText>
          <ThemedText style={styles.description}>
            {selectedWeekKey ? `選択中の${formatWeekLabel(selectedWeekKey)}から出題します。問題数を選んでください。` : '学習するWeekを確認して、問題数を選んでください。'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          {selectedWeekKey === 'week6' && <View style={styles.section}>
            <ThemedText type="subtitle">コード＋コンソールのミニドリル</ThemedText>
            <ThemedText style={styles.hint}>計算処理をステップごとに組み立てて実行します。既存のクイズは下の問題数を選んで開始できます。</ThemedText>
            {catalog.questions.filter(isConsoleQuestion).filter(q => isActiveEntity(q) && q.sourceReference.weekKey === 'week6' && q.console.step === 1).map(q => (
              <AccessibleButton key={q.console.drillId} label={`${q.console.title}（${q.console.total}ステップ）`} variant="secondary" onPress={() => router.push({ pathname: '/console-drill/[drillId]', params: { drillId: q.console.drillId } } as never)} />
            ))}
          </View>}
          <View style={styles.sectionHeading}>
            <ThemedText type="subtitle">{selectedWeekKey === 'week6' ? '既存クイズの問題数' : '問題数'}</ThemedText>
            <ThemedText style={styles.selectionLabel}>既定 5問</ThemedText>
          </View>
          <QuestionCountSelector
            value={scopeSelection.questionCount}
            onChange={(value: AllowedQuestionCount) => updateSelection({ questionCount: value })}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <ThemedText type="subtitle">選択中のWeek</ThemedText>
            <ThemedText style={styles.selectionLabel}>{selectedWeekKey ? '1週選択中' : '未選択'}</ThemedText>
          </View>
          <ThemedView variant="surface" style={styles.weekSummary}>
            <ThemedText type="subtitle">
              {selectedWeekKey ? formatWeekLabel(selectedWeekKey) : 'Week未選択'}
            </ThemedText>
            <ThemedText style={styles.hint}>
              {selectedWeekKey ? `${questionCount}問を出題できます。` : '学習カードからWeekを選択してください。'}
            </ThemedText>
          </ThemedView>
        </View>

      </View>
    </ScopeSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
  header: {
    gap: 10,
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  centeredTitle: {
    textAlign: 'center',
  },
  closeButton: {
    borderRadius: 999,
    marginVertical: 0,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  progressSummary: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  progressRing: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 4,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  progressCopy: {
    gap: 2,
  },
  helpCard: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  helpCopy: {
    flex: 1,
    gap: 4,
  },
  helpCloseButton: {
    borderRadius: 999,
    marginVertical: 0,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  description: {
    lineHeight: 24,
  },
  section: {
    gap: 10,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  selectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.75,
  },
  hint: {
    lineHeight: 22,
    opacity: 0.76,
  },
  chipRow: {
    gap: 10,
    paddingVertical: 4,
  },
  weekSummary: {
    borderRadius: 18,
    gap: 4,
    padding: 16,
  },
  selectionSummary: {
    borderRadius: 20,
    gap: 10,
    padding: 18,
  },
  availableCount: {
    fontSize: 20,
    fontWeight: '800',
  },
  footerContent: {
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '600',
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 999,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    textAlign: 'center',
  },
});
