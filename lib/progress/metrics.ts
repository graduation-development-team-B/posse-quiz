/**
 * 進捗表示用の正答率計算。
 */

/**
 * 正答率を整数パーセントへ丸める。
 * 出題数0は未学習を表すnullを返す。
 */
export function percentage(correct: number, total: number): number | null {
  if (total === 0) return null;

  const rounded = Math.round((correct / total) * 100);
  return Math.min(100, Math.max(0, rounded));
}
