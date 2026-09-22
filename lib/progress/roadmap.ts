/**
 * 学習ロードマップ（学習マップ）とホーム画面のゲーミフィケーション表示に使う純粋な導出ロジック。
 *
 * 画面はここで作った値をそのまま描画するだけにして、状態計算をテスト可能に保つ。
 * Progress_Snapshot に日別の学習履歴は存在しないため、学習日は weekProgress の
 * lastAnsweredAt から導出する。streakCount は「連続正解数（問）」であり日数ではない。
 */

import {
  POINTS_PER_CORRECT_ANSWER,
  STUDY_WEEK_DAYS,
  SUPPORTED_WEEK_KEYS,
} from '@/lib/constants';
import { percentage } from '@/lib/progress/metrics';
import { isActiveEntity } from '@/lib/quiz/scope';
import type { ContentCatalog, WeekKey } from '@/types/content';
import type { ProgressSnapshot } from '@/types/progress';

/** ロードマップ上のノード状態。未着手の教材も常に選択できる。 */
export type RoadmapStatus = 'completed' | 'in-progress' | 'not-started';

export interface RoadmapNode {
  weekKey: WeekKey;
  /** Week03 のような短い表示名。 */
  label: string;
  /** カタログ上の教材タイトル。 */
  title: string;
  status: RoadmapStatus;
  /** クリア・学習中。未着手の場合は空文字。 */
  statusLabel: string;
  answeredCount: number;
  totalCount: number;
  correctCount: number;
  accuracy: number | null;
  lastAnsweredAt: string | null;
}

export interface StudyDay {
  /** ローカル日付のキー（YYYY-MM-DD）。 */
  dateKey: string;
  /** 日・月・火…の1文字ラベル。 */
  dayLabel: string;
  studied: boolean;
  isToday: boolean;
}

export interface RecentHistoryEntry {
  weekKey: WeekKey;
  label: string;
  answeredCount: number;
  correctCount: number;
  accuracy: number | null;
  lastAnsweredAt: string;
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 教材キーを Week03 / Git Lv1 のような短い表示名へ変換する。 */
export function formatWeekLabel(weekKey: WeekKey | string): string {
  if (weekKey === 'git_github_level1') return 'Git Lv1';
  const number = String(weekKey).replace('week', '');
  return `Week${number.padStart(2, '0')}`;
}

/** 教材キーをWeek数バッジ向けの短い表示名へ変換する。 */
export function formatWeekBadgeLabel(weekKey: WeekKey | string): string {
  if (weekKey === 'git_github_level1') return 'Git';
  const number = String(weekKey).replace('week', '');
  return number.padStart(2, '0');
}

/**
 * 教材カタログと進捗からロードマップのノード列を作る。
 *
 * 全教材を常に選択可能とし、状態は回答数だけで決める。
 * - 全問回答済み: クリア
 * - 1問以上回答済み: 学習中
 * - 未回答: 状態ラベルなし
 */
export function buildRoadmapNodes(
  catalog: ContentCatalog | null,
  snapshot: ProgressSnapshot | null,
  weekKeys: readonly WeekKey[] = SUPPORTED_WEEK_KEYS,
): RoadmapNode[] {
  return weekKeys.map((weekKey) => {
    const week = catalog?.weekUnits.find(
      (candidate) => candidate.key === weekKey && isActiveEntity(candidate),
    );
    const totalCount = week && catalog
      ? catalog.questions.filter(
          (question) => question.weekUnitId === week.id && isActiveEntity(question),
        ).length
      : 0;
    const progress = snapshot?.weekProgress.find((item) => item.weekKey === weekKey);
    const rawAnswered = progress?.questionCount ?? 0;
    const answeredCount = totalCount > 0 ? Math.min(rawAnswered, totalCount) : rawAnswered;
    const correctCount = Math.min(progress?.correctCount ?? 0, Math.max(answeredCount, 0));
    const label = formatWeekLabel(weekKey);
    const status: RoadmapStatus = totalCount > 0 && answeredCount >= totalCount
      ? 'completed'
      : answeredCount > 0
        ? 'in-progress'
        : 'not-started';

    return {
      weekKey,
      label,
      title: week?.title ?? label,
      status,
      statusLabel: toStatusLabel(status),
      answeredCount,
      totalCount,
      correctCount,
      accuracy: percentage(correctCount, answeredCount),
      lastAnsweredAt: progress?.lastAnsweredAt ?? null,
    };
  });
}

function toStatusLabel(status: RoadmapStatus): string {
  switch (status) {
    case 'completed':
      return 'クリア';
    case 'in-progress':
      return '学習中';
    case 'not-started':
      return '';
  }
}

/** ロードマップから今日取り組む教材を1件選ぶ。全て完了ならnullを返す。 */
export function pickMissionNode(nodes: readonly RoadmapNode[]): RoadmapNode | null {
  const inProgress = nodes.find((node) => node.status === 'in-progress');
  if (inProgress) return inProgress;
  return nodes.find((node) => node.status === 'not-started') ?? null;
}

/** 完了した教材数と、問題が存在する教材数を返す。 */
export function countRoadmapProgress(nodes: readonly RoadmapNode[]): {
  completed: number;
  total: number;
} {
  const available = nodes.filter((node) => node.totalCount > 0);
  return {
    completed: available.filter((node) => node.status === 'completed').length,
    total: available.length,
  };
}

/**
 * 直近7日分（当日を最後尾）の学習日を作る。
 * weekProgress の lastAnsweredAt だけが日付の根拠なので、記録がない日は未学習として扱う。
 */
export function buildStudyWeek(
  snapshot: ProgressSnapshot | null,
  now: Date = new Date(),
): StudyDay[] {
  const studiedKeys = new Set(
    (snapshot?.weekProgress ?? [])
      .map((progress) => toLocalDateKey(progress.lastAnsweredAt))
      .filter((key): key is string => key !== null),
  );
  const todayKey = toDateKey(now);

  return Array.from({ length: STUDY_WEEK_DAYS }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date.setDate(date.getDate() - (STUDY_WEEK_DAYS - 1 - index));
    const dateKey = toDateKey(date);
    return {
      dateKey,
      dayLabel: DAY_LABELS[date.getDay()] ?? '',
      studied: studiedKeys.has(dateKey),
      isToday: dateKey === todayKey,
    };
  });
}

/** 直近7日間で学習した日数。 */
export function countStudyDays(days: readonly StudyDay[]): number {
  return days.filter((day) => day.studied).length;
}

/** 正解数から学習ポイントを求める。 */
export function computeLearningPoints(snapshot: ProgressSnapshot | null): number {
  const correct = (snapshot?.weekProgress ?? []).reduce(
    (total, progress) => total + progress.correctCount,
    0,
  );
  return correct * POINTS_PER_CORRECT_ANSWER;
}

/** 回答済みの総問題数。 */
export function countAnsweredQuestions(snapshot: ProgressSnapshot | null): number {
  return (snapshot?.weekProgress ?? []).reduce(
    (total, progress) => total + progress.questionCount,
    0,
  );
}

/** 最近学習した教材を新しい順に返す。未学習の教材は含めない。 */
export function buildRecentHistory(
  snapshot: ProgressSnapshot | null,
  limit = 3,
): RecentHistoryEntry[] {
  return (snapshot?.weekProgress ?? [])
    .filter(
      (progress): progress is typeof progress & { lastAnsweredAt: string } =>
        typeof progress.lastAnsweredAt === 'string' && progress.questionCount > 0,
    )
    .map((progress) => ({
      weekKey: progress.weekKey,
      label: formatWeekLabel(progress.weekKey),
      answeredCount: progress.questionCount,
      correctCount: progress.correctCount,
      accuracy: percentage(progress.correctCount, progress.questionCount),
      lastAnsweredAt: progress.lastAnsweredAt,
    }))
    .sort((left, right) => right.lastAnsweredAt.localeCompare(left.lastAnsweredAt))
    .slice(0, Math.max(0, limit));
}

function toLocalDateKey(value: string | null): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return toDateKey(date);
}

function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
