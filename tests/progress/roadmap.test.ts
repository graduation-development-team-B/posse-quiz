import { describe, expect, it } from 'vitest';

import { POINTS_PER_CORRECT_ANSWER, PROGRESS_SCHEMA_VERSION, STUDY_WEEK_DAYS } from '@/lib/constants';
import {
  buildRecentHistory,
  buildRoadmapNodes,
  buildStudyWeek,
  computeLearningPoints,
  countRoadmapProgress,
  countStudyDays,
  formatWeekLabel,
  formatWeekBadgeLabel,
  pickMissionNode,
} from '@/lib/progress/roadmap';
import type { ContentCatalog, WeekKey } from '@/types/content';
import type { ProgressSnapshot, WeekProgress } from '@/types/progress';

const ROADMAP_WEEK_KEYS = ['week3', 'week4', 'week5'] as const satisfies readonly WeekKey[];

/** 週ごとの問題数を指定して、ロードマップ判定に必要な最小のカタログを作る。 */
function makeCatalog(questionCountByWeek: Partial<Record<WeekKey, number>>): ContentCatalog {
  const weekUnits = ROADMAP_WEEK_KEYS.map((key, index) => ({
    id: `week-unit-${key}`,
    key,
    order: index + 3,
    title: `${formatWeekLabel(key)}｜カリキュラム`,
    published: true,
    deleted: false,
  }));

  const questions = ROADMAP_WEEK_KEYS.flatMap((key) =>
    Array.from({ length: questionCountByWeek[key] ?? 0 }, (_, index) => ({
      id: `question-${key}-${index}`,
      weekUnitId: `week-unit-${key}`,
      format: 'singleChoice' as const,
      prompt: '設問',
      payload: {
        kind: 'choice' as const,
        options: [
          { id: 'a', text: '選択肢A' },
          { id: 'b', text: '選択肢B' },
          { id: 'c', text: '選択肢C' },
          { id: 'd', text: '選択肢D' },
        ],
        correctOptionId: 'a',
      },
      explanation: 'この解説は根拠と確認手順を20文字以上で説明します。',
      sourceReference: { weekKey: key, sectionHeading: '基本' },
      published: true,
      deleted: false,
    })),
  );

  return {
    weekUnits,
    questions,
    terms: [],
    activities: [],
  };
}

function makeSnapshot(weekProgress: readonly Partial<WeekProgress>[]): ProgressSnapshot {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    weekProgress: ROADMAP_WEEK_KEYS.map((weekKey, index) => ({
      weekKey,
      questionCount: weekProgress[index]?.questionCount ?? 0,
      correctCount: weekProgress[index]?.correctCount ?? 0,
      lastAnsweredAt: weekProgress[index]?.lastAnsweredAt ?? null,
    })),
    reviewQueue: [],
    streakCount: 0,
  };
}

describe('formatWeekLabel', () => {
  it('教材キーを2桁のWeek表記とGit表記へ変換する', () => {
    expect(formatWeekLabel('week3')).toBe('Week03');
    expect(formatWeekLabel('week6')).toBe('Week06');
    expect(formatWeekLabel('git_github_level1')).toBe('Git Lv1');
    expect(formatWeekBadgeLabel('week3')).toBe('03');
    expect(formatWeekBadgeLabel('git_github_level1')).toBe('Git');
  });
});

describe('buildRoadmapNodes', () => {
  it('未学習でもすべての教材を選択でき、状態ラベルは表示しない', () => {
    const nodes = buildRoadmapNodes(
      makeCatalog({ week3: 4, week4: 4, week5: 4 }),
      makeSnapshot([]),
      ROADMAP_WEEK_KEYS,
    );

    expect(nodes.map((node) => node.status)).toEqual(['not-started', 'not-started', 'not-started']);
    expect(nodes.map((node) => node.statusLabel)).toEqual(['', '', '']);
    expect(nodes.every((node) => node.status !== 'completed')).toBe(true);
  });

  it('全問回答した教材をクリアにし、回答済みの教材を学習中にする', () => {
    const nodes = buildRoadmapNodes(
      makeCatalog({ week3: 4, week4: 4, week5: 4 }),
      makeSnapshot([
        { questionCount: 4, correctCount: 3, lastAnsweredAt: '2026-09-01T10:00:00.000Z' },
        { questionCount: 1, correctCount: 1, lastAnsweredAt: '2026-09-02T10:00:00.000Z' },
      ]),
      ROADMAP_WEEK_KEYS,
    );

    expect(nodes.map((node) => node.statusLabel)).toEqual(['クリア', '学習中', '']);
    expect(nodes[0]?.accuracy).toBe(75);
    expect(nodes[1]?.answeredCount).toBe(1);
    expect(nodes[2]?.statusLabel).toBe('');
  });

  it('回答数が総問題数を超えても完了扱いにし、表示上は総問題数で止める', () => {
    const nodes = buildRoadmapNodes(
      makeCatalog({ week3: 3 }),
      makeSnapshot([{ questionCount: 9, correctCount: 9, lastAnsweredAt: '2026-09-01T10:00:00.000Z' }]),
      ['week3'],
    );

    expect(nodes[0]?.answeredCount).toBe(3);
    expect(nodes[0]?.status).toBe('completed');
  });

  it('問題が0件の教材もロックせず、状態ラベルを表示しない', () => {
    const nodes = buildRoadmapNodes(
      makeCatalog({ week3: 0, week4: 2 }),
      makeSnapshot([]),
      ['week3', 'week4'],
    );

    expect(nodes[0]?.status).toBe('not-started');
    expect(nodes[0]?.statusLabel).toBe('');
    expect(nodes[1]?.status).toBe('not-started');
    expect(nodes[1]?.statusLabel).toBe('');
  });

  it('カタログ未取得でもすべて未着手として落ちない', () => {
    const nodes = buildRoadmapNodes(null, null, ROADMAP_WEEK_KEYS);

    expect(nodes).toHaveLength(ROADMAP_WEEK_KEYS.length);
    expect(nodes.every((node) => node.status === 'not-started')).toBe(true);
    expect(nodes.every((node) => node.statusLabel === '')).toBe(true);
  });
});

describe('pickMissionNode', () => {
  it('着手済みの教材を優先し、なければ最初の解放済み教材を選ぶ', () => {
    const catalog = makeCatalog({ week3: 2, week4: 4, week5: 4 });
    const started = buildRoadmapNodes(
      catalog,
      makeSnapshot([
        { questionCount: 2, correctCount: 2, lastAnsweredAt: '2026-09-01T10:00:00.000Z' },
        { questionCount: 1, correctCount: 0, lastAnsweredAt: '2026-09-02T10:00:00.000Z' },
      ]),
      ROADMAP_WEEK_KEYS,
    );
    const fresh = buildRoadmapNodes(catalog, makeSnapshot([]), ROADMAP_WEEK_KEYS);

    expect(pickMissionNode(started)?.weekKey).toBe('week4');
    expect(pickMissionNode(fresh)?.weekKey).toBe('week3');
  });

  it('すべて完了ならnullを返す', () => {
    const nodes = buildRoadmapNodes(
      makeCatalog({ week3: 1 }),
      makeSnapshot([{ questionCount: 1, correctCount: 1, lastAnsweredAt: '2026-09-01T10:00:00.000Z' }]),
      ['week3'],
    );

    expect(pickMissionNode(nodes)).toBeNull();
  });
});

describe('countRoadmapProgress', () => {
  it('問題がある教材だけを対象に、クリア数を返す', () => {
    const nodes = buildRoadmapNodes(
      makeCatalog({ week3: 1, week4: 2, week5: 0 }),
      makeSnapshot([{ questionCount: 1, correctCount: 1, lastAnsweredAt: '2026-09-01T10:00:00.000Z' }]),
      ROADMAP_WEEK_KEYS,
    );

    expect(countRoadmapProgress(nodes)).toEqual({ completed: 1, total: 2 });
  });
});

describe('buildStudyWeek', () => {
  it('当日を最後尾にした7日分を返し、最終回答日を学習済みにする', () => {
    const now = new Date(2026, 8, 3, 11, 30);
    const days = buildStudyWeek(
      makeSnapshot([
        { questionCount: 1, correctCount: 1, lastAnsweredAt: new Date(2026, 8, 3, 9, 0).toISOString() },
        { questionCount: 1, correctCount: 0, lastAnsweredAt: new Date(2026, 8, 1, 21, 0).toISOString() },
      ]),
      now,
    );

    expect(days).toHaveLength(STUDY_WEEK_DAYS);
    expect(days.at(-1)).toMatchObject({ dateKey: '2026-09-03', isToday: true, studied: true });
    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-08-28',
      '2026-08-29',
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
    ]);
    expect(days.filter((day) => day.studied).map((day) => day.dateKey)).toEqual([
      '2026-09-01',
      '2026-09-03',
    ]);
    expect(countStudyDays(days)).toBe(2);
    expect(days.map((day) => day.dayLabel)).toEqual(['金', '土', '日', '月', '火', '水', '木']);
  });

  it('7日より前の記録や未学習は学習済みにしない', () => {
    const now = new Date(2026, 8, 3, 11, 30);
    const days = buildStudyWeek(
      makeSnapshot([
        { questionCount: 1, correctCount: 1, lastAnsweredAt: new Date(2026, 7, 1, 9, 0).toISOString() },
      ]),
      now,
    );

    expect(countStudyDays(days)).toBe(0);
    expect(countStudyDays(buildStudyWeek(null, now))).toBe(0);
  });
});

describe('computeLearningPoints', () => {
  it('正解数に単価を掛けた値を返す', () => {
    expect(computeLearningPoints(null)).toBe(0);
    expect(
      computeLearningPoints(
        makeSnapshot([
          { questionCount: 4, correctCount: 3 },
          { questionCount: 2, correctCount: 2 },
        ]),
      ),
    ).toBe(5 * POINTS_PER_CORRECT_ANSWER);
  });
});

describe('buildRecentHistory', () => {
  it('最終回答が新しい順に並べ、未学習の教材を除き件数を制限する', () => {
    const history = buildRecentHistory(
      makeSnapshot([
        { questionCount: 8, correctCount: 6, lastAnsweredAt: '2026-09-01T10:00:00.000Z' },
        { questionCount: 0, correctCount: 0, lastAnsweredAt: null },
        { questionCount: 4, correctCount: 1, lastAnsweredAt: '2026-09-02T10:00:00.000Z' },
      ]),
      3,
    );

    expect(history.map((entry) => entry.weekKey)).toEqual(['week5', 'week3']);
    expect(history[1]).toMatchObject({ label: 'Week03', accuracy: 75, correctCount: 6, answeredCount: 8 });
    expect(buildRecentHistory(makeSnapshot([{ questionCount: 1, correctCount: 1, lastAnsweredAt: '2026-09-01T10:00:00.000Z' }]), 0)).toEqual([]);
    expect(buildRecentHistory(null)).toEqual([]);
  });
});
