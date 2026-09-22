import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createQuizSession, createReviewSession, createSessionForScope } from '@/lib/quiz/sessionManager';
import type { RandomSource } from '@/lib/quiz/random';
import { createQuizRoute, type QuizRoute } from '@/lib/navigation/routes';
import type { ContentCatalog, QuestionItem } from '@/types/content';
import type { ReviewEntry } from '@/types/progress';
import type { AnswerRecord, QuizSession, SessionMode, SessionScope } from '@/types/session';
import { useSettings } from '@/contexts/SettingsContext';

export interface ScopeSelectionState {
  weekKeys: string[];
  questionCount: 3 | 5 | 10;
}

export interface SubmitAnswerInput {
  selectedOptionId?: string;
  freeText?: string;
  activityCompleted?: boolean;
  isCorrect: boolean;
  answeredAt: string;
}

/** 画面遷移やresizeをまたいで保持する、現在問題の未確定入力。 */
export interface DraftAnswer {
  selectedOptionId?: string;
  freeText?: string;
  activityCompleted?: boolean;
}

export interface QuizSessionContextValue {
  currentSession: QuizSession | null;
  scopeSelection: ScopeSelectionState;
  currentQuestion: QuestionItem | null;
  isComplete: boolean;
  /** Routerへ渡す値はsessionIdだけで、問題本体はContext内に保持する。 */
  quizRoute: QuizRoute | null;
  /** 問題IDごとの未確定入力。Context内に置くことでresizeや画面遷移で失われない。 */
  draftAnswers: Readonly<Record<string, DraftAnswer>>;
  setScopeSelection: (selection: ScopeSelectionState) => void;
  setDraftAnswer: (questionId: string, draft: DraftAnswer) => void;
  clearDraftAnswer: (questionId: string) => void;
  /** 現在の範囲選択から通常Sessionを生成する。 */
  startSession: (catalog: ContentCatalog, random?: RandomSource) => QuizSession | null;
  startSessionForScope: (
    catalog: ContentCatalog,
    scope: SessionScope,
    requestedCount: unknown,
    random?: RandomSource,
  ) => QuizSession | null;
  startSessionFromPool: (
    pool: readonly QuestionItem[],
    requestedCount: unknown,
    mode?: SessionMode,
    random?: RandomSource,
  ) => QuizSession | null;
  startReviewSession: (
    reviewQueue: readonly ReviewEntry[],
    questions: readonly QuestionItem[],
    requestedCount: unknown,
    random?: RandomSource,
  ) => QuizSession | null;
  getSession: (sessionId: string) => QuizSession | null;
  submitAnswer: (input: SubmitAnswerInput) => AnswerRecord | null;
  goToNextQuestion: () => void;
  clearSession: () => void;
}

const DEFAULT_SCOPE_SELECTION: ScopeSelectionState = {
  weekKeys: [],
  questionCount: 5,
};

const QuizSessionContext = createContext<QuizSessionContextValue | null>(null);

export function QuizSessionProvider({ children }: { children: React.ReactNode }) {
  const { questionCount: savedQuestionCount } = useSettings();
  const [scopeSelection, setScopeSelectionState] = useState<ScopeSelectionState>(DEFAULT_SCOPE_SELECTION);

  useEffect(() => {
    setScopeSelectionState((current) => current.questionCount === savedQuestionCount
      ? current
      : { ...current, questionCount: savedQuestionCount });
  }, [savedQuestionCount]);
  const [sessions, setSessions] = useState<Record<string, QuizSession>>({});
  const [draftAnswers, setDraftAnswers] = useState<Record<string, DraftAnswer>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const setScopeSelection = useCallback((selection: ScopeSelectionState) => {
    setScopeSelectionState({
      weekKeys: [...selection.weekKeys],
      questionCount: selection.questionCount,
    });
  }, []);

  const setDraftAnswer = useCallback((questionId: string, draft: DraftAnswer) => {
    setDraftAnswers((current) => ({
      ...current,
      [questionId]: { ...draft },
    }));
  }, []);

  const clearDraftAnswer = useCallback((questionId: string) => {
    setDraftAnswers((current) => {
      if (!(questionId in current)) return current;
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  }, []);

  const storeSession = useCallback((session: QuizSession | null): QuizSession | null => {
    if (!session) return null;
    setSessions((current) => ({ ...current, [session.id]: session }));
    setCurrentSessionId(session.id);
    return session;
  }, []);

  const startSession = useCallback((catalog: ContentCatalog, random?: RandomSource) => {
    return storeSession(createSessionForScope(
      catalog,
      { weekKeys: scopeSelection.weekKeys },
      scopeSelection.questionCount,
      random,
    ));
  }, [scopeSelection, storeSession]);

  const startSessionForScope = useCallback((
    catalog: ContentCatalog,
    scope: SessionScope,
    requestedCount: unknown,
    random?: RandomSource,
  ) => storeSession(createSessionForScope(catalog, scope, requestedCount, random)), [storeSession]);

  const startSessionFromPool = useCallback((
    pool: readonly QuestionItem[],
    requestedCount: unknown,
    mode: SessionMode = 'normal',
    random?: RandomSource,
  ) => storeSession(createQuizSession(pool, requestedCount, mode, random)), [storeSession]);

  const startReviewSession = useCallback((
    reviewQueue: readonly ReviewEntry[],
    questions: readonly QuestionItem[],
    requestedCount: unknown,
    random?: RandomSource,
  ) => storeSession(createReviewSession(reviewQueue, questions, requestedCount, random)), [storeSession]);

  const getSession = useCallback((sessionId: string) => sessions[sessionId] ?? null, [sessions]);
  const clearSession = useCallback(() => {
    if (currentSessionId) {
      setSessions((current) => {
        if (!(currentSessionId in current)) return current;
        const next = { ...current };
        delete next[currentSessionId];
        return next;
      });
    }
    setCurrentSessionId(null);
    setDraftAnswers({});
  }, [currentSessionId]);
  const currentSession = currentSessionId ? sessions[currentSessionId] ?? null : null;
  const currentQuestion = currentSession?.questions[currentSession.currentIndex] ?? null;

  const submitAnswer = useCallback((input: SubmitAnswerInput): AnswerRecord | null => {
    if (!currentSession || !currentQuestion || currentSession.answers[currentQuestion.id]) return null;

    const answer: AnswerRecord = {
      questionId: currentQuestion.id,
      ...(input.selectedOptionId === undefined ? {} : { selectedOptionId: input.selectedOptionId }),
      ...(input.freeText === undefined ? {} : { freeText: input.freeText }),
      ...(input.activityCompleted === undefined ? {} : { activityCompleted: input.activityCompleted }),
      isCorrect: input.isCorrect,
      answeredAt: input.answeredAt,
    };
    const updatedSession: QuizSession = {
      ...currentSession,
      answeredCount: currentSession.answeredCount + 1,
      correctCount: currentSession.correctCount + (input.isCorrect ? 1 : 0),
      answers: { ...currentSession.answers, [currentQuestion.id]: answer },
    };
    setSessions((current) => ({ ...current, [updatedSession.id]: updatedSession }));
    setDraftAnswers((current) => {
      if (!(currentQuestion.id in current)) return current;
      const next = { ...current };
      delete next[currentQuestion.id];
      return next;
    });
    return answer;
  }, [currentQuestion, currentSession]);

  const goToNextQuestion = useCallback(() => {
    if (!currentSession || currentSession.currentIndex >= currentSession.questions.length - 1) return;
    const updatedSession: QuizSession = {
      ...currentSession,
      currentIndex: currentSession.currentIndex + 1,
    };
    setSessions((current) => ({ ...current, [updatedSession.id]: updatedSession }));
  }, [currentSession]);

  const value = useMemo<QuizSessionContextValue>(() => ({
    currentSession,
    scopeSelection,
    currentQuestion,
    isComplete: currentSession !== null && currentSession.currentIndex >= currentSession.questions.length - 1,
    quizRoute: currentSession ? createQuizRoute(currentSession.id) : null,
    draftAnswers,
    setScopeSelection,
    setDraftAnswer,
    clearDraftAnswer,
    startSession,
    startSessionForScope,
    startSessionFromPool,
    startReviewSession,
    getSession,
    submitAnswer,
    goToNextQuestion,
    clearSession,
  }), [
    clearSession,
    clearDraftAnswer,
    currentQuestion,
    currentSession,
    draftAnswers,
    getSession,
    goToNextQuestion,
    scopeSelection,
    setScopeSelection,
    setDraftAnswer,
    startReviewSession,
    startSession,
    startSessionForScope,
    startSessionFromPool,
    submitAnswer,
  ]);

  return <QuizSessionContext.Provider value={value}>{children}</QuizSessionContext.Provider>;
}

export function useQuizSession(): QuizSessionContextValue {
  const context = useContext(QuizSessionContext);
  if (!context) throw new Error('useQuizSession は QuizSessionProvider の内側で使用してください');
  return context;
}
