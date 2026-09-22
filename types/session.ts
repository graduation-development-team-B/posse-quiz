/**
 * クイズセッションのドメイン型定義
 * design.md Section 3.2: セッション・回答モデル に基づく
 */

import type { QuestionItem } from './content';

/** クイズセッション */
export interface QuizSession {
  id: string;
  startedAt: string;
  /** 出題順（重複なし） */
  questionIds: string[];
  /** 開始時のimmutable snapshot */
  questions: QuestionItem[];
  /** セッション内の選択肢表示順（questionId -> optionIdの配列） */
  optionOrders: Record<string, string[]>;
  currentIndex: number;
  answeredCount: number;
  correctCount: number;
  answers: Record<string, AnswerRecord>;
  mode: 'normal' | 'review' | 'termCheck';
}

/** 回答記録 */
export interface AnswerRecord {
  questionId: string;
  selectedOptionId?: string;
  freeText?: string;
  activityCompleted?: boolean;
  isCorrect: boolean;
  answeredAt: string;
}

/** 用語確認問題 */
export interface TermCheckQuestion {
  termId: string;
  /** 正解の意味1件 + 他Termの意味3件 */
  options: string[];
  correctIndex: number;
}

/** セッション生成のスコープ設定。階層は PH → Week の2段のため、Weekだけで範囲が決まる。 */
export interface SessionScope {
  weekKeys: string[];
}

/** クイズセッションモード */
export type SessionMode = 'normal' | 'review' | 'termCheck';
