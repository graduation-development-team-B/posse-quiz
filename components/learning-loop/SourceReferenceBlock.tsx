import { StyleSheet } from 'react-native';

import { LearningCard } from '@/components/learning-loop/LearningCard';
import { ThemedText } from '@/components/themed-text';
import { formatCurriculumUnitLabel } from '@/lib/content/curriculumLabels';
import type { SourceReference } from '@/types/content';

export interface SourceReferenceBlockProps {
  sourceReference: SourceReference;
}

/** 出典を1行で示す。階層は PH → Week の2段なので、週と節見出しだけで位置が決まる。 */
export function SourceReferenceBlock({ sourceReference }: SourceReferenceBlockProps) {
  const sourceLabel = `${formatCurriculumUnitLabel(sourceReference.weekKey)}「${sourceReference.sectionHeading}」`;

  return (
    <LearningCard accessibilityLabel={`引用: ${sourceLabel}`} title="教材情報" style={styles.card}>
      <ThemedText>引用：{sourceLabel}</ThemedText>
    </LearningCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
});
