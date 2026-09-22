import type { ViewStyle } from 'react-native';

export const LEARNING_TOUCH_TARGET = 44;
export const LEARNING_MIN_ADJACENT_SPACING = 8;
export const LEARNING_CONTENT_MAX_WIDTH = 960;

export const LearningSpacing = {
  screenCompact: 16,
  screenMedium: 24,
  screenWide: 32,
  card: 20,
  control: 12,
  adjacent: LEARNING_MIN_ADJACENT_SPACING,
} as const;

export const LearningRadii = {
  card: 24,
  control: 16,
  badge: 999,
} as const;

export type LearningStatus =
  | 'selected'
  | 'disabled'
  | 'correct'
  | 'incorrect'
  | 'registered';

export const LEARNING_STATUS_LABELS: Record<LearningStatus, string> = {
  selected: '✓ 選択中',
  disabled: '利用不可',
  correct: '✓ 正解',
  incorrect: '! 誤り',
  registered: '✓ 登録済み',
};

export function getLearningStatus(
  status: LearningStatus | undefined,
  values: {
    selected?: boolean;
    disabled?: boolean;
    correct?: boolean;
    incorrect?: boolean;
    registered?: boolean;
  },
): LearningStatus | undefined {
  if (status) return status;
  if (values.incorrect) return 'incorrect';
  if (values.correct) return 'correct';
  if (values.registered) return 'registered';
  if (values.disabled) return 'disabled';
  if (values.selected) return 'selected';
  return undefined;
}

export function getLearningStatusLabel(status: LearningStatus | undefined): string | undefined {
  return status ? LEARNING_STATUS_LABELS[status] : undefined;
}

export function getLearningContainerStyle(width: number): ViewStyle {
  if (width <= 767) {
    return {
      alignSelf: 'center',
      maxWidth: LEARNING_CONTENT_MAX_WIDTH,
      paddingHorizontal: LearningSpacing.screenCompact,
      width: '100%',
    };
  }

  if (width <= 1023) {
    return {
      alignSelf: 'center',
      maxWidth: LEARNING_CONTENT_MAX_WIDTH,
      paddingHorizontal: LearningSpacing.screenMedium,
      width: '100%',
    };
  }

  return {
    alignSelf: 'center',
    maxWidth: LEARNING_CONTENT_MAX_WIDTH,
    paddingHorizontal: LearningSpacing.screenWide,
    width: '100%',
  };
}
