import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { AccessibleButton } from '@/components/AccessibleButton';
import { ResponsiveScrollView } from '@/components/layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AccountScreen() {
  const router = useRouter();

  return (
    <ThemedView colorName="pageSurface" style={styles.screen}>
      <ResponsiveScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="title">マイページ</ThemedText>
        <ThemedText style={styles.description}>POSSE Quizの学習環境を整えます。</ThemedText>
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText type="subtitle">学習設定</ThemedText>
          <ThemedText style={styles.description}>問題数、教材の再取得、端末内の学習記録を管理できます。</ThemedText>
          <AccessibleButton label="設定を開く" onPress={() => router.push('/settings')} style={styles.cta} variant="secondary" />
        </ThemedView>
      </ResponsiveScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 20, paddingBottom: 112 },
  description: { lineHeight: 23, opacity: 0.76 },
  card: { borderRadius: 28, gap: 10, padding: 22 },
  cta: { alignSelf: 'flex-start', borderRadius: 999, marginHorizontal: 0 },
});
