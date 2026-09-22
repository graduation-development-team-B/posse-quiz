/**
 * コンテンツAPIのドメイン型定義
 * design.md Section 3: TypeScriptデータモデル に基づく
 */

/** 対象教材のキー。UIではWeek01、Week03〜06とGit/GitHub Level 1を表示対象とする */
export type WeekKey = 'week1' | 'week3' | 'week4' | 'week5' | 'week6' | 'git_github_level1';

/** 問題形式 */
export type QuestionFormat =
  | 'singleChoice'
  | 'trueFalse'
  | 'bugDiagnosis'
  | 'fillBlank'
  | 'interactive';

/** 同期状態は sync.ts を正規の定義元とし、既存の import 互換性のため再公開する */
export type { SyncState } from './sync';

/** 出典情報 */
export interface SourceReference {
  weekKey: string;
  sectionHeading: string;
}

/** 公開状態フィールド */
export interface PublicationFields {
  published: boolean;
  deleted: boolean;
}

/** 教材の週単位 */
export interface WeekUnit extends PublicationFields {
  id: string;
  key: string; // 初期値 week1、week3〜week6、git_github_level1
  order: number;
  title: string;
}

/** 選択肢 */
export interface ChoiceOption {
  id: string;
  text: string;
}

/** 4択ペイロード */
export interface ChoicePayload {
  kind: 'choice';
  options: ChoiceOption[];
  correctOptionId: string;
  incorrectReasons?: Record<string, string>;
}

/** 正誤ペイロード */
export interface TrueFalsePayload {
  kind: 'trueFalse';
  options: [{ id: 'true'; text: '正しい' }, { id: 'false'; text: '誤り' }];
  correctOptionId: 'true' | 'false';
  incorrectReasons?: Partial<Record<'true' | 'false', string>>;
}

/** バグ診断ペイロード */
export interface BugDiagnosisPayload {
  kind: 'bugDiagnosis';
  code: string;
  options: ChoiceOption[];
  correctOptionId: string;
  incorrectReasons?: Record<string, string>;
}

/** 穴埋め（候補選択）ペイロード */
export interface FillBlankChoicePayload {
  kind: 'fillBlank';
  content: string;
  blankToken: string;
  mode: 'choice';
  options: ChoiceOption[];
  correctOptionId: string;
  incorrectReasons?: Record<string, string>;
}

/** 穴埋め（自由入力）ペイロード */
export interface FillBlankFreeTextPayload {
  kind: 'fillBlank';
  content: string;
  blankToken: string;
  mode: 'freeText';
  correctText: string;
  maxInputLength: 64;
}

/** インタラクティブ問題から公開Activity内の1ステージを参照するペイロード */
export interface InteractiveQuestionPayload {
  kind: 'activityRef';
  activityType: 'terminalToken';
  activityId: string;
  stageId: string;
}

/** 問題ペイロードのユニオン型 */
export type QuestionPayload =
  | ChoicePayload
  | TrueFalsePayload
  | BugDiagnosisPayload
  | FillBlankChoicePayload
  | FillBlankFreeTextPayload
  | InteractiveQuestionPayload;

/** 問題アイテム */
export interface QuestionItem extends PublicationFields {
  id: string;
  weekUnitId: string;
  format: QuestionFormat;
  prompt: string;
  payload: QuestionPayload;
  explanation: string;
  sourceReference: SourceReference;
  /** 順序付きプレビュー制作課題。通常のランダム出題とは分ける。 */
  preview?: PreviewStep;
  console?: ConsoleStep;
}

export interface ConsoleStep extends PreviewStep {
  expectedOutput: string[];
}

export interface PreviewStep {
  drillId: string;
  title: string;
  version: number;
  step: number;
  total: number;
  hint: string;
  goalCode: string;
}

/** 仮想ファイルシステム。stageのカレントディレクトリ表示に利用する。 */
export type TerminalFileNode =
  | { name: string; type: 'dir'; children: TerminalFileNode[] }
  | { name: string; type: 'file'; content: string };

export type TerminalTokenKind = 'command' | 'argument' | 'path' | 'value' | 'control';

export interface TerminalToken {
  id: string;
  label: string;
  kind: TerminalTokenKind;
}

/** そのstage内で安全に実行できる宣言的なコマンド。 */
export interface TerminalStageCommand {
  argv: string[];
  output: string[];
  nextCwd?: string[];
}

export interface TerminalStageGoal {
  /** この順序で実行すると完了する。誤操作では進捗を失わず、不正解にもならない。 */
  commandSequence: string[][];
}

export interface TerminalStage {
  id: string;
  mission: string;
  hint: string;
  inputMode: 'terminal' | 'pullRequest';
  startCwd: string[];
  tokens: TerminalToken[];
  commands: TerminalStageCommand[];
  goal: TerminalStageGoal;
  successMessage: string;
}

export interface TerminalTokenActivity extends PublicationFields {
  id: string;
  type: 'terminalToken';
  title: string;
  root: TerminalFileNode;
  stages: TerminalStage[];
}

export type InteractiveActivity = TerminalTokenActivity;

/** 用語エントリ */
export interface TermEntry extends PublicationFields {
  id: string;
  weekUnitId: string;
  name: string;
  definition: string;
  usageExamples: string[];
  sourceReference: SourceReference;
  relatedTermNames: string[];
}

/** 教材カタログ（メモリ上で利用するデータ） */
export interface ContentCatalog {
  weekUnits: WeekUnit[];
  questions: QuestionItem[];
  terms: TermEntry[];
  activities: InteractiveActivity[];
}

/** APIレスポンス */
export interface ApiResponse {
  schemaVersion: number;
  contentVersion: string;
  updatedAt: string;
  catalog: ContentCatalog;
}

/** コンテンツキャッシュ（端末保存形式） */
export interface ContentCache {
  response: ApiResponse;
  cachedAt: string;
  apiVersion: string;
}

/** バリデーション問題 */
export interface ValidationIssue {
  code: string;
  message: string;
  entityId?: string;
  entityType?: 'weekUnit' | 'question' | 'term' | 'activity';
}
