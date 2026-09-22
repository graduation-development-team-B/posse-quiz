export const GIT_GITHUB_LEVEL1_KEY = 'git_github_level1' as const;

/** 教材キーを学習者向けの短い表示名へ変換する。 */
export function formatCurriculumUnitLabel(key: string): string {
  if (key === GIT_GITHUB_LEVEL1_KEY) return 'Git/GitHub Level 1';

  const weekNumber = /^week(\d+)$/.exec(key)?.[1];
  return weekNumber ? `Week${weekNumber.padStart(2, '0')}` : key;
}

/** 小さなカードバッジ向けの表示名。 */
export function formatCurriculumUnitBadge(key: string): string {
  if (key === GIT_GITHUB_LEVEL1_KEY) return 'Git';
  return /^week(\d+)$/.exec(key)?.[1] ?? key;
}
