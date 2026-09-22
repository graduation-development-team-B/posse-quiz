/** クイズ生成で利用する、テスト可能な乱数・シャッフルユーティリティ。 */

/** 乱数値を返す関数、または乱数生成器オブジェクト。 */
export type RandomSource = (() => number) | { next: () => number };

/**
 * RandomSourceから0以上1未満の乱数を取得する。
 * 外部から不正な値が渡ってもシャッフルの添字が範囲外にならないように正規化する。
 */
export function nextRandom(source: RandomSource = Math.random): number {
  const value = typeof source === 'function' ? source() : source.next();
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 0.9999999999999999;
  return value;
}

/** 入力配列を変更せず、Fisher-Yates法で新しい配列を返す。 */
export function shuffle<T>(items: readonly T[], source: RandomSource = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom(source) * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }
  return result;
}

/**
 * 文字列または数値から再現可能な乱数源を作る。
 * セッション生成テストや、同じseedでの表示順再現に利用できる。
 */
export function createSeededRandom(seed: string | number): RandomSource {
  let state = hashSeed(seed);
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function hashSeed(seed: string | number): number {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
