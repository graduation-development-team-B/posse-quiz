import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AccessibleButton } from '@/components/AccessibleButton';
import { isPreviewQuestion } from '@/lib/quiz/previewDrill';
import type { QuestionItem } from '@/types/content';

export function DrillList({ questions }: { questions: QuestionItem[] }) {
  const router = useRouter();
  const drills = questions.filter(isPreviewQuestion).filter(q => q.published && !q.deleted && q.sourceReference.weekKey === 'week1' && q.preview.step === 1);
  return <ScrollView contentContainerStyle={styles.page}>
    <AccessibleButton label="閉じる" variant="ghost" onPress={() => router.back()} />
    <Text style={styles.eyebrow}>WEEK 01 · HTML / TAILWIND</Text>
    <Text style={styles.title}>ミニドリル</Text>
    <Text style={styles.description}>カードを1つ選び、コードを編集して完成させよう。各ステップを順番にクリアすると、ドリルが完了します。</Text>
    {drills.map((question, index) => <View key={question.preview.drillId} style={styles.card}>
      <Text style={styles.eyebrow}>DRILL 0{index + 1} · {question.preview.total} STEPS</Text>
      <Text style={styles.heading}>{question.preview.title}</Text>
      <Text style={styles.description}>プレビュー＋コード · 途中から再開できます</Text>
      <AccessibleButton label="ドリルを開く" onPress={() => router.push({ pathname: '/drill/[drillId]', params: { drillId: question.preview.drillId } } as never)} />
    </View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { padding: 24, gap: 16, backgroundColor: '#fffaf5', flexGrow: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  eyebrow: { color: '#c2410c', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '800', color: '#38251b' },
  heading: { fontSize: 20, fontWeight: '700', color: '#38251b' },
  description: { color: '#685549', lineHeight: 24 },
  card: { borderWidth: 1, borderColor: '#fed7aa', borderRadius: 18, backgroundColor: '#fff', padding: 20, gap: 12 },
});
