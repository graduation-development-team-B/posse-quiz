import { SafeAreaView, StyleSheet } from 'react-native';

import { ResponsiveScrollView } from '@/components/layout';
import { StreakHeaderBar } from '@/components/home/StreakHeaderBar';
import { useProgress } from '@/contexts/ProgressContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { computeLearningPoints } from '@/lib/progress/roadmap';

/** ホーム画面。ストリークと学習ポイントだけを表示する。 */
export default function HomeScreen() {
  const { snapshot } = useProgress();
  const pageColor = useThemeColor({}, 'pageSurface');
  const streakCount = snapshot?.streakCount ?? 0;
  const points = computeLearningPoints(snapshot);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: pageColor }]}>
      <ResponsiveScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StreakHeaderBar streakCount={streakCount} points={points} />
      </ResponsiveScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    paddingTop: 12,
  },
});
