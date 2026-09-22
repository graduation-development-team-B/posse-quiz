import { StyleSheet, View } from 'react-native';

import { AccessibleButton } from '@/components/AccessibleButton';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WeekKey } from '@/types/content';

export type CurriculumPhase = 'ph1' | 'ph2' | 'ph3' | 'ph4';

export const CURRICULUM_PHASES: readonly { key: CurriculumPhase; label: string }[] = [
  { key: 'ph1', label: 'PH1' },
  { key: 'ph2', label: 'PH2' },
  { key: 'ph3', label: 'PH3' },
  { key: 'ph4', label: 'PH4' },
];

/** The current catalog is grouped under PH1 until later phase content is published. */
export const PHASE_WEEK_KEYS: Record<CurriculumPhase, readonly WeekKey[]> = {
  ph1: ['week1', 'git_github_level1', 'week3', 'week4', 'week5', 'week6'],
  ph2: [],
  ph3: [],
  ph4: [],
};

interface PhaseSelectorProps {
  selectedPhase: CurriculumPhase;
  onSelect: (phase: CurriculumPhase) => void;
}

export function PhaseSelector({ selectedPhase, onSelect }: PhaseSelectorProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const primaryTextColor = useThemeColor({}, 'primaryText');
  const textColor = useThemeColor({}, 'text');

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="カリキュラムのフェーズを選択" style={styles.grid}>
      {CURRICULUM_PHASES.map((phase) => {
        const selected = phase.key === selectedPhase;
        const hasContent = PHASE_WEEK_KEYS[phase.key].length > 0;
        return (
          <AccessibleButton
            key={phase.key}
            label={phase.label}
            selected={selected}
            accessibilityLabel={`${phase.label}、${hasContent ? 'PH1教材を表示' : '準備中'}`}
            accessibilityHint={hasContent ? 'このフェーズのWeekを表示します' : 'このフェーズの教材は準備中です'}
            variant="secondary"
            onPress={() => onSelect(phase.key)}
            style={[
              styles.phaseButton,
              selected && { backgroundColor: primaryColor, borderColor: primaryColor },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.phaseLabel, { color: selected ? primaryTextColor : textColor }]}
            >
              {phase.label}
            </ThemedText>
            <ThemedText style={[styles.phaseStatus, { color: selected ? primaryTextColor : textColor }]}>
              {hasContent ? 'PH1教材' : '準備中'}
            </ThemedText>
          </AccessibleButton>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  phaseButton: {
    flexBasis: '46%',
    flexGrow: 1,
    minHeight: 68,
    marginVertical: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  phaseLabel: {
    fontSize: 16,
    lineHeight: 22,
  },
  phaseStatus: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.78,
  },
});
