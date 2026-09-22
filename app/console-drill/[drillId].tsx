import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AccessibleButton } from '@/components/AccessibleButton';
import { useContent } from '@/contexts/ContentContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import { DRILL_STORAGE_PREFIX, canSubmit, codeForSelection, emptyAttempt, restoreAttempt, type DrillAttempt } from '@/lib/quiz/previewDrill';
import { getConsoleSteps, judgeConsoleStep, type ConsoleQuestion } from '@/lib/quiz/consoleDrill';
import { runConsoleCode, type ConsoleResult } from '@/lib/quiz/consoleExecution';

export default function ConsoleDrillScreen() {
  const { drillId } = useLocalSearchParams<{ drillId: string }>();
  const { catalog, retry, state } = useContent();
  const router = useRouter();
  const steps = useMemo(() => getConsoleSteps(catalog?.questions ?? [], drillId), [catalog, drillId]);
  if (!catalog) return <View style={styles.page}><ActivityIndicator />{state === 'error' && <AccessibleButton label="教材を再試行" onPress={() => void retry()} />}</View>;
  if (!steps.length) return <View style={styles.page}><Text>ドリルが見つかりません。</Text><AccessibleButton label="戻る" onPress={() => router.back()} /></View>;
  return <ConsoleWorkspace key={`${drillId}:${steps[0].console.version}`} steps={steps} />;
}

function ConsoleWorkspace({ steps }: { steps: ConsoleQuestion[] }) {
  const router = useRouter();
  const { scopeSelection, setScopeSelection } = useQuizSession();
  const { recordAnswer, isLoading, notice } = useProgress();
  const [attempt, setAttempt] = useState<DrillAttempt>(emptyAttempt);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [result, setResult] = useState<ConsoleResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [feedback, setFeedback] = useState<ConsoleQuestion | null>(null);
  const operation = useRef(0);
  const cancelRun = useRef<(() => void) | null>(null);
  const submitting = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const first = steps[0].console;
  const storageKey = `${DRILL_STORAGE_PREFIX}${first.drillId}:v${first.version}`;
  useEffect(() => {
    try {
      const saved = restoreAttempt(globalThis.localStorage.getItem(storageKey), steps);
      // 保存された出力は信用せず、再開後は実行し直してから採点する。
      setAttempt({ ...saved, executed: null });
    } catch { setSaveError(true); }
    setLoaded(true);
    return () => { operation.current += 1; cancelRun.current?.(); };
  }, [steps, storageKey]);
  useEffect(() => {
    if (!loaded) return;
    try { globalThis.localStorage.setItem(storageKey, JSON.stringify(attempt)); setSaveError(false); }
    catch { setSaveError(true); }
  }, [attempt, loaded, storageKey]);
  const complete = attempt.completed === steps.length;
  const question = steps[Math.min(attempt.completed, steps.length - 1)];
  const [before, after] = question.payload.content.split(question.payload.blankToken);
  const token = question.payload.options.find(option => option.id === attempt.selected)?.text ?? '【ここを編集】';
  const stale = result !== null && attempt.executed !== attempt.selected;
  const stop = () => { operation.current += 1; cancelRun.current?.(); cancelRun.current = null; setRunning(false); };
  const select = (id: string) => { stop(); setAttempt(value => ({ ...value, selected: id })); setWrong(false); };
  const reset = () => { stop(); setAttempt(value => ({ ...value, selected: '', executed: null })); setResult(null); setWrong(false); };
  async function execute() {
    if (!attempt.selected || saving) return;
    stop();
    const generation = operation.current;
    const selected = attempt.selected;
    setRunning(true);
    setResult(null);
    setAttempt(value => ({ ...value, executed: null }));
    setWrong(false);
    const execution = runConsoleCode(codeForSelection(question, selected));
    cancelRun.current = execution.cancel;
    const next = await execution.result;
    if (generation !== operation.current) return;
    setResult(next);
    setAttempt(value => ({ ...value, executed: selected }));
    setRunning(false);
    cancelRun.current = null;
  }
  async function submit() {
    if (!canSubmit(attempt) || !result || running || submitting.current || wrong || isLoading || result.status === 'unavailable') return;
    submitting.current = true;
    setSaving(true);
    const correct = judgeConsoleStep(question, attempt, result);
    try {
      await recordAnswer({ questionId: question.id, selectedOptionId: attempt.selected, isCorrect: correct, answeredAt: new Date().toISOString(), weekKey: 'week6' });
      if (!correct) { setWrong(true); return; }
      setFeedback(question);
      setAttempt({ completed: attempt.completed + 1, selected: '', executed: null });
      setHint(false);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } finally { submitting.current = false; setSaving(false); }
  }
  if (!loaded) return <ActivityIndicator />;
  return <View style={styles.root}>
    <ScrollView ref={scroll} contentContainerStyle={styles.page}>
      <View style={styles.row}>
        <AccessibleButton label="×" accessibilityLabel="ドリルを閉じる（作業は自動保存）" variant="ghost" onPress={() => { stop(); router.back(); }} />
        <Text style={styles.counter}>{feedback ? attempt.completed : Math.min(attempt.completed + 1, steps.length)} / {steps.length}</Text>
        <Text style={styles.small}>WEEK 06</Text>
      </View>
      <View style={styles.row} accessibilityLabel={`${steps.length}ステップ中${attempt.completed}ステップ完了`}>
        {steps.map((q, i) => <View key={q.id} style={[styles.segment, i < attempt.completed && styles.done]} />)}
      </View>
      <Text style={styles.eyebrow}>JAVASCRIPT / コード＋コンソール</Text>
      <Text style={styles.small}>{first.title}</Text>
      {saveError && <Text accessibilityRole="alert" style={styles.warning}>作業をブラウザに保存できません。この画面を閉じると進捗が失われる可能性があります。</Text>}
      {notice?.kind === 'save-failed' && <Text style={styles.warning}>{notice.message}</Text>}
      {feedback || complete ? <View style={styles.card}>
        <Text style={styles.title}>{complete ? 'ドリル完了！' : 'ステップクリア！'}</Text>
        <Text style={styles.copy}>{feedback?.explanation ?? '全てのステップをクリアしました。完成コードを確認しましょう。'}</Text>
        <View style={styles.editor}><Text style={styles.filename}>script.js</Text><Text selectable style={styles.code}>{complete ? first.goalCode : codeForSelection(feedback!, feedback!.payload.correctOptionId)}</Text></View>
        {result ? <ConsoleOutput result={result} running={false} /> : <>
          <Text style={styles.small}>完成コードの期待する出力</Text>
          <Text selectable style={styles.expected}>{steps[steps.length - 1].console.expectedOutput.join('\n')}</Text>
        </>}
        {complete ? <>
          <AccessibleButton label="Week06へ戻る" onPress={() => { setScopeSelection({ ...scopeSelection, weekKeys: ['week6'] }); router.replace('/scope' as never); }} />
          <AccessibleButton label="最初からもう一度" variant="secondary" onPress={() => { stop(); setAttempt(emptyAttempt()); setFeedback(null); setResult(null); }} />
        </> : <AccessibleButton label="次のステップへ" onPress={() => { setFeedback(null); setResult(null); scroll.current?.scrollTo({ y: 0 }); }} />}
      </View> : <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{question.prompt}</Text>
        <Text style={styles.copy}>{question.console.hint}</Text>
        <View style={styles.editor}>
          <Text style={styles.filename}>▤ script.js</Text>
          <Text selectable style={styles.code}>{before}<Text style={styles.token}>{token}</Text>{after}</Text>
        </View>
        <Text style={styles.small}>編集箇所に入れるコードを選ぼう</Text>
        {question.payload.options.map(option => <AccessibleButton key={option.id} label={option.text} disabled={saving} selected={attempt.selected === option.id} variant="secondary" onPress={() => select(option.id)} style={attempt.selected === option.id ? styles.selected : undefined} />)}
        <View style={styles.row}>
          <AccessibleButton label="↶ やり直す" disabled={saving} variant="secondary" onPress={reset} style={styles.flex} />
          <AccessibleButton label={running ? '実行中…' : '▶ 実行する'} disabled={!attempt.selected || saving || running} onPress={() => void execute()} style={styles.flex} />
        </View>
        <ConsoleOutput result={result} running={running} />
        {stale && <Text style={styles.warning}>編集前の実行結果です。もう一度実行してください。</Text>}
        <Text style={styles.small}>このステップの期待する出力</Text>
        <Text selectable style={styles.expected}>{question.console.expectedOutput.join('\n')}</Text>
        <AccessibleButton label={hint ? 'ヒントを閉じる' : 'ヒントを見る'} expanded={hint} variant="ghost" onPress={() => setHint(!hint)} />
        {hint && <Text style={styles.warning}>入力の型 → 計算・条件分岐 → console.logの順に追ってみましょう。{question.explanation}</Text>}
        {wrong && <Text accessibilityRole="alert" style={styles.warning}>まだ達成条件を満たしていません。指定の処理と、すべての出力行を確認し、編集して再実行しましょう。</Text>}
        <Text style={styles.small}>出典：Week06 / {question.sourceReference.sectionHeading}</Text>
      </View>}
    </ScrollView>
    {!complete && !feedback && <View style={styles.footer}><AccessibleButton label={saving ? '保存中…' : '解答を確定'} disabled={!canSubmit(attempt) || !result || result.status === 'unavailable' || running || saving || wrong || isLoading} onPress={() => void submit()} /></View>}
  </View>;
}
function ConsoleOutput({ result, running }: { result: ConsoleResult | null; running: boolean }) {
  const statusLabels = { success: '実行完了', syntaxError: '構文エラー', runtimeError: '実行時エラー', timeout: '時間切れ', outputLimit: '出力上限', unavailable: '実行できません' };
  return <View style={styles.editor} accessibilityLiveRegion="polite">
    <Text style={styles.filename}>コンソール</Text>
    <Text selectable style={styles.code}>{running ? '実行しています…' : result ? result.lines.map(line => `> ${line}`).join('\n') || '（出力なし）' : 'コードを実行すると結果が表示されます。'}</Text>
    {result?.message && <Text style={styles.error}>{statusLabels[result.status]}: {result.message}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fffaf5' },
  page: { padding: 18, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, flex: { flex: 1 },
  counter: { fontSize: 20, fontWeight: '800', color: '#38251b' },
  segment: { height: 7, flex: 1, borderRadius: 8, backgroundColor: '#ffdcc4' }, done: { backgroundColor: '#ff5900' },
  eyebrow: { color: '#c2410c', fontSize: 12, fontWeight: '700' },
  card: { padding: 14, gap: 12, borderRadius: 18, borderWidth: 1, borderColor: '#fb923c', backgroundColor: '#fff' },
  title: { fontSize: 23, lineHeight: 32, fontWeight: '800', color: '#38251b' },
  copy: { color: '#38251b', lineHeight: 24, fontSize: 15 }, small: { fontSize: 12, lineHeight: 18, color: '#685549' },
  editor: { backgroundColor: '#30251e', borderRadius: 12, overflow: 'hidden' },
  filename: { color: '#f5e4ce', padding: 12, borderBottomWidth: 1, borderBottomColor: '#635044' },
  code: { fontFamily: 'monospace', fontSize: 13, lineHeight: 22, color: '#b4d9f7', padding: 12 },
  token: { backgroundColor: '#9a3412', color: '#fff7ed', fontWeight: '700' },
  selected: { borderWidth: 2, borderColor: '#f97316', backgroundColor: '#ffedd5' },
  warning: { backgroundColor: '#fef3c7', color: '#713f12', lineHeight: 22, padding: 12, borderRadius: 10 },
  error: { color: '#fecaca', padding: 12, lineHeight: 22 },
  expected: { fontFamily: 'monospace', fontSize: 13, lineHeight: 22, color: '#38251b' },
  footer: { padding: 12, paddingBottom: 20, maxWidth: 640, width: '100%', alignSelf: 'center', backgroundColor: '#fff' },
});
