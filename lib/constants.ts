/**
 * アプリ全体で共有する定数
 * design.md に基づき、型・設定値・制約を一元管理する
 */

import type { WeekKey, QuestionFormat } from '@/types/content';

/** 表示・出題・辞書対象の教材キー（表示順） */
export const SUPPORTED_WEEK_KEYS = [
  'week1',
  'git_github_level1',
  'week3',
  'week4',
  'week5',
  'week6',
] as const satisfies readonly WeekKey[];

/** 許可された問題形式 */
export const ALLOWED_QUESTION_FORMATS = [
  'singleChoice',
  'trueFalse',
  'bugDiagnosis',
  'fillBlank',
  'interactive',
] as const satisfies readonly QuestionFormat[];

/** 許可された1セッションの問題数 */
export const ALLOWED_QUESTION_COUNTS = [3, 5, 10] as const;
export type AllowedQuestionCount = (typeof ALLOWED_QUESTION_COUNTS)[number];

/** デフォルト問題数 */
export const DEFAULT_QUESTION_COUNT: AllowedQuestionCount = 5;

/** 現行スキーマバージョン */
export const CURRENT_SCHEMA_VERSION = 1;

/** Progress_Snapshot の現行スキーマバージョン（v2: Topic概念を廃止） */
export const PROGRESS_SCHEMA_VERSION = 2;

/** 移行対象として読み込める旧 Progress_Snapshot バージョン（Topicを含む） */
export const PROGRESS_SCHEMA_VERSION_LEGACY_TOPIC = 1;

/** APIタイムアウト（ミリ秒） */
export const DEFAULT_API_TIMEOUT_MS = 8000;

/** 連続正解2回で復習除外 */
export const REVIEW_GRADUATION_COUNT = 2;

/** Review Queue の運用上限（新規追加時） */
export const REVIEW_QUEUE_MAX = 200;

/** Review Queue の保存フォーマット上限 */
export const REVIEW_QUEUE_STORAGE_MAX = 500;

/** Streak の実行時上限 */
export const STREAK_MAX = 999;

/** 誤答回数の上限 */
export const WRONG_COUNT_MAX = 99;

/** 自由入力の最大文字数 */
export const FREE_TEXT_MAX_LENGTH = 64;

/** 解説文の最小文字数（空白除く） */
export const EXPLANATION_MIN_LENGTH = 20;

/** 解説文の最大文字数（空白除く） */
export const EXPLANATION_MAX_LENGTH = 400;

/** 各教材単位の最小問題数 */
export const MIN_QUESTIONS_PER_WEEK = 10;

/** 各週の最大問題数 */
export const MAX_QUESTIONS_PER_WEEK = 60;

/** 全Term最小件数 */
export const MIN_TOTAL_TERMS = 30;

/** 各週の最小Term数 */
export const MIN_TERMS_PER_WEEK = 5;

/** 各週の「よくある間違い」系問題の最小件数 */
export const MIN_COMMON_MISTAKE_QUESTIONS_PER_WEEK = 2;

/** Progress 復元タイムアウト（ミリ秒） */
export const PROGRESS_RESTORE_TIMEOUT_MS = 2000;

/** 4択・バグ診断・候補選択穴埋めの選択肢数 */
export const CHOICE_OPTIONS_COUNT = 4;

/** 正誤判定の選択肢数 */
export const TRUE_FALSE_OPTIONS_COUNT = 2;

/** 用語名の最小文字数 */
export const TERM_NAME_MIN_LENGTH = 1;

/** 用語名の最大文字数 */
export const TERM_NAME_MAX_LENGTH = 40;

/** 用語説明の最小文字数 */
export const TERM_DEFINITION_MIN_LENGTH = 20;

/** 用語説明の最大文字数 */
export const TERM_DEFINITION_MAX_LENGTH = 200;

/** 用語の最大使用例数 */
export const TERM_USAGE_EXAMPLE_MAX = 3;

/** 用語の最大関連用語名数 */
export const TERM_RELATED_NAMES_MAX = 5;

/** バグ診断コードの最大行数 */
export const BUG_DIAGNOSIS_MAX_LINES = 20;

/** 辞書検索の最小文字数 */
export const GLOSSARY_SEARCH_MIN_LENGTH = 1;

/** 辞書検索の最大文字数 */
export const GLOSSARY_SEARCH_MAX_LENGTH = 50;

/** 用語確認セッションの問題数 */
export const TERM_CHECK_SESSION_COUNT = 5;

/** 用語確認セッションに必要な最小Term数 */
export const TERM_CHECK_MIN_TERMS = 4;

/** 横断出題の最大週数 */
export const CROSS_WEEK_MAX = 4;

/** 横断出題の最小週数 */
export const CROSS_WEEK_MIN = 2;

/** 非4択問題を優先的に含める最低セッション問題数 */
export const NON_CHOICE_PRIORITY_SESSION_MIN = 5;

/** 学習ポイント（正解1問あたり） */
export const POINTS_PER_CORRECT_ANSWER = 10;

/** ホームの学習記録カードに表示する日数 */
export const STUDY_WEEK_DAYS = 7;

/** ホームの最近の学習履歴に表示する件数 */
export const RECENT_HISTORY_MAX = 3;

/** 学習ロードマップのフェーズ見出し */
export const ROADMAP_PHASE_TITLE = 'PH1：基礎を固めよう';
