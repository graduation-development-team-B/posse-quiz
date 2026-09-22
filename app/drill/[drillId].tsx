import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AccessibleButton } from '@/components/AccessibleButton';
import CodePreview from '@/components/drill/CodePreview';
import { useContent } from '@/contexts/ContentContext';
import { useProgress } from '@/contexts/ProgressContext';
import { DRILL_STORAGE_PREFIX, canSubmit, codeForSelection, emptyAttempt, getDrillSteps, judgeStep, restoreAttempt, type DrillAttempt, type PreviewQuestion } from '@/lib/quiz/previewDrill';
import { useQuizSession } from '@/contexts/QuizSessionContext';

export default function DrillScreen() {
  const { drillId } = useLocalSearchParams<{ drillId: string }>();
  const { catalog, state, retry } = useContent();
  const router = useRouter();
  const steps = useMemo(() => getDrillSteps(catalog?.questions ?? [], drillId), [catalog, drillId]);
  if (!catalog) return <View style={styles.page}><ActivityIndicator /><Text style={styles.copy}>教材を読み込んでいます。</Text>{state === 'error' && <AccessibleButton label="再試行" onPress={() => void retry()} />}</View>;
  if (!steps.length) return <View style={styles.page}><Text style={styles.copy}>ドリルが見つかりません。</Text><AccessibleButton label="戻る" onPress={() => router.back()} /></View>;
  // 版が変わると旧版の作業領域を上書きせず、新しい作業領域に切り替える。
  return <DrillWorkspace key={`${drillId}:${steps[0].preview.version}`} steps={steps} />;
}

function DrillWorkspace({ steps }: { steps: PreviewQuestion[] }) {
  const router = useRouter();
  const { scopeSelection, setScopeSelection } = useQuizSession();
  const { recordAnswer, isLoading: progressLoading } = useProgress();
  const [attempt, setAttempt] = useState<DrillAttempt>(emptyAttempt);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [tab, setTab] = useState<'preview' | 'goal'>('preview');
  const [hint, setHint] = useState(false);
  const [showAllCode, setShowAllCode] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [feedback, setFeedback] = useState<PreviewQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const first = steps[0];
  const key = `${DRILL_STORAGE_PREFIX}${first.preview.drillId}:v${first.preview.version}`;
  useEffect(() => {
    try { setAttempt(restoreAttempt(globalThis.localStorage.getItem(key), steps)); }
    catch { setSaveError(true); }
    setLoaded(true);
  }, [key, steps]);
  useEffect(() => {
    if (!loaded) return;
    try { globalThis.localStorage.setItem(key, JSON.stringify(attempt)); setSaveError(false); }
    catch { setSaveError(true); }
  }, [attempt, key, loaded]);
  const complete = attempt.completed === steps.length;
  const question = steps[Math.min(attempt.completed, steps.length - 1)];
  const [before, after] = question.payload.content.split(question.payload.blankToken);
  const token = question.payload.options.find(option => option.id === attempt.selected)?.text;
  const stale = attempt.executed !== null && attempt.executed !== attempt.selected;
  const update = (change: Partial<DrillAttempt>) => { setAttempt(value => ({ ...value, ...change })); setWrong(false); };

  async function submit() {
    if (!canSubmit(attempt) || submitting.current || progressLoading || wrong) return;
    const isCorrect = judgeStep(question, attempt);
    submitting.current = true;
    setBusy(true);
    try {
      await recordAnswer({ questionId: question.id, selectedOptionId: attempt.selected, isCorrect, answeredAt: new Date().toISOString(), weekKey: 'week1' });
      if (!isCorrect) { setWrong(true); return; }
      setFeedback(question);
      setAttempt({ completed: attempt.completed + 1, selected: '', executed: null });
      setHint(false);
      setShowAllCode(false);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } finally { submitting.current = false; setBusy(false); }
  }

  if (!loaded) return <ActivityIndicator />;
  return <View style={styles.root}>
    <ScrollView ref={scroll} contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <AccessibleButton label="×" accessibilityLabel="ドリルを閉じる（作業は自動保存）" variant="ghost" onPress={() => router.back()} />
        <Text style={styles.counter}>{Math.min(attempt.completed + 1, steps.length)} / {steps.length}</Text>
        <Text style={styles.small}>WEEK 01</Text>
      </View>
      <View style={styles.progress} accessibilityLabel={`${steps.length}ステップ中${attempt.completed}ステップ完了`}>
        {steps.map((s, index) => <View key={s.id} style={[styles.segment, index < attempt.completed && styles.segmentDone]} />)}
      </View>
      {saveError && <Text accessibilityRole="alert" style={styles.warning}>ブラウザへの保存ができません。この画面を閉じると進捗が失われる可能性があります。</Text>}
      <Text style={styles.eyebrow}>HTML / TAILWIND · {first.preview.title}</Text>
      {feedback || complete ? <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{complete ? 'ドリル完了！' : 'ステップクリア！'}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.copy}>{feedback?.explanation ?? '全てのステップをクリアしました。完成したカードを確認しましょう。'}</Text>
        <CodePreview code={complete ? first.preview.goalCode : codeForSelection(feedback!, feedback!.payload.correctOptionId)} />
        <Text style={styles.small}>{attempt.completed} / {steps.length} ステップ完了</Text>
        {complete ? <>
          <AccessibleButton label="ドリル一覧へ" onPress={() => { setScopeSelection({ ...scopeSelection, weekKeys: ['week1'] }); router.replace('/scope' as never); }} />
          <AccessibleButton label="最初からもう一度" variant="secondary" onPress={() => { setAttempt(emptyAttempt()); setFeedback(null); setTab('preview'); }} />
        </> : <AccessibleButton label="次のステップへ" onPress={() => { setFeedback(null); setTab('preview'); scroll.current?.scrollTo({ y: 0 }); }} />}
      </View> : <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{question.prompt}</Text>
        <Text style={styles.copy}>{question.preview.hint}</Text>
        <View style={styles.row}>
          <AccessibleButton label="プレビュー" selected={tab === 'preview'} variant={tab === 'preview' ? 'primary' : 'secondary'} onPress={() => setTab('preview')} style={styles.flex} />
          <AccessibleButton label="見本" selected={tab === 'goal'} variant={tab === 'goal' ? 'primary' : 'secondary'} onPress={() => setTab('goal')} style={styles.flex} />
        </View>
        <CodePreview code={tab === 'goal' ? question.preview.goalCode : codeForSelection(question, attempt.executed ?? '')} />
        <Text style={styles.small}>{tab === 'goal' ? 'ドリル全体の完成見本' : stale ? '編集前の結果です。もう一度実行してください。' : attempt.executed ? '現在のコードの実行結果' : 'ステップ開始時の表示。候補を選んで実行してください。'}</Text>
        <Text style={styles.small}>画像はプレビュー用の代替イラストです。</Text>
        <View style={styles.editor}>
          <Text style={styles.filename}>▤ index.html</Text>
          <ScrollView style={styles.codeScroll} nestedScrollEnabled>
            <Text selectable style={styles.code}>{showAllCode ? before : before.split('\n').slice(-3).join('\n')}<Text style={styles.editToken}>{token ?? '【ここを編集】'}</Text>{showAllCode ? after : after.split('\n').slice(0, 3).join('\n')}</Text>
          </ScrollView>
        </View>
        <AccessibleButton label={showAllCode ? '編集箇所を表示' : 'コード全体を表示'} expanded={showAllCode} variant="ghost" onPress={() => setShowAllCode(!showAllCode)} />
        <Text style={styles.small}>オレンジの編集箇所に入れるクラスを選ぼう</Text>
        <View style={styles.tokens}>{question.payload.options.map(option => <AccessibleButton key={option.id} label={option.text} selected={attempt.selected === option.id} variant="secondary" onPress={() => update({ selected: option.id })} style={attempt.selected === option.id ? styles.selected : styles.option} />)}</View>
        <View style={styles.row}>
          <AccessibleButton label="↶ やり直す" variant="secondary" style={styles.flex} onPress={() => { update({ selected: '', executed: null }); setTab('preview'); }} />
          <AccessibleButton label="▶ 実行する" style={styles.flex} disabled={!attempt.selected} onPress={() => { update({ executed: attempt.selected }); setTab('preview'); }} />
        </View>
        <AccessibleButton label={hint ? 'ヒントを閉じる' : 'ヒントを見る'} expanded={hint} variant="ghost" onPress={() => setHint(!hint)} />
        {hint && <Text style={styles.warning}>class属性では半角スペースで複数のクラスを並べます。前のステップのコードはそのまま残ります。見本と、今編集している要素の色・幅・余白を比較しましょう。</Text>}
        {wrong && <Text accessibilityRole="alert" style={styles.warning}>まだ指定のスタイルと一致していません。{question.preview.hint} 候補を変更して再実行しましょう。</Text>}
        <Text style={styles.small}>出典：Week01 / {question.sourceReference.sectionHeading}</Text>
      </View>}
    </ScrollView>
    {!complete && !feedback && <View style={styles.footer}>
      <AccessibleButton label={busy ? '保存中…' : '解答を確定'} disabled={!canSubmit(attempt) || busy || progressLoading || wrong} onPress={() => void submit()} />
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fffaf5' },
  page: { padding: 18, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { fontWeight: '800', fontSize: 20, color: '#38251b' },
  progress: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  segment: { height: 7, borderRadius: 8, flex: 1, backgroundColor: '#ffdcc4' },
  segmentDone: { backgroundColor: '#ff5900' },
  eyebrow: { color: '#c2410c', fontSize: 12, fontWeight: '700' },
  card: { borderRadius: 18, borderWidth: 1, borderColor: '#fb923c', backgroundColor: '#fff', padding: 14, gap: 12 },
  title: { fontSize: 23, lineHeight: 32, fontWeight: '800', color: '#38251b' },
  copy: { color: '#38251b', lineHeight: 24, fontSize: 15 },
  small: { fontSize: 12, lineHeight: 18, color: '#685549' },
  row: { flexDirection: 'row', gap: 8 }, flex: { flex: 1 },
  editor: { borderRadius: 12, backgroundColor: '#30251e', overflow: 'hidden' },
  filename: { color: '#f5e4ce', padding: 12, borderBottomWidth: 1, borderBottomColor: '#635044' },
  codeScroll: { maxHeight: 250 },
  code: { fontFamily: 'monospace', fontSize: 13, lineHeight: 22, color: '#b4d9f7', padding: 12 },
  editToken: { color: '#fff7ed', backgroundColor: '#9a3412', fontWeight: '700' },
  tokens: { gap: 4 }, option: { borderColor: '#fed7aa' }, selected: { borderColor: '#f97316', borderWidth: 2, backgroundColor: '#ffedd5' },
  warning: { color: '#713f12', backgroundColor: '#fef3c7', padding: 12, borderRadius: 10, lineHeight: 22 },
  footer: { padding: 12, paddingBottom: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ffdcc4', maxWidth: 640, width: '100%', alignSelf: 'center' },
});
