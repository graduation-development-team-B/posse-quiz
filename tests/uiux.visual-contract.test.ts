import { describe, expect, it } from 'vitest';

import { Colors } from '@/constants/theme';
import { formatDuration } from '@/components/result/ResultSummary';

describe('POSSE Quiz visual contracts', () => {
  it('keeps progress and review contexts semantically distinct in both themes', () => {
    expect(Colors.light.primary).toBe('#FF4500');
    expect(Colors.light.review).toBe('#1D4ED8');
    expect(Colors.dark.primary).toBe('#FDBA74');
    expect(Colors.dark.review).toBe('#93C5FD');
    expect(Colors.light.primary).not.toBe(Colors.light.review);
    expect(Colors.dark.primary).not.toBe(Colors.dark.review);
  });

  it('keeps result time copy compact for the completion card', () => {
    expect(formatDuration(0)).toBe('0分00秒');
    expect(formatDuration(42)).toBe('0分42秒');
    expect(formatDuration(125)).toBe('2分05秒');
  });
});
