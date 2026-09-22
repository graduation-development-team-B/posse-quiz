import { describe, expect, it } from 'vitest';

import { percentage } from '@/lib/progress/metrics';

describe('percentage', () => {
  it('出題数0を未学習としてnullで返す', () => {
    expect(percentage(0, 0)).toBeNull();
  });

  it('正答率を小数第1位四捨五入した整数パーセントで返す', () => {
    expect(percentage(1, 3)).toBe(33);
    expect(percentage(1, 8)).toBe(13);
    expect(percentage(2, 3)).toBe(67);
    expect(percentage(3, 3)).toBe(100);
  });

  it('結果を0以上100以下に収める', () => {
    expect(percentage(-1, 3)).toBe(0);
    expect(percentage(4, 3)).toBe(100);
  });
});
