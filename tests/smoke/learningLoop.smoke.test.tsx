import React from 'react';
import { describe, expect, it, vi } from 'vitest';

/* eslint-disable import/first -- route imports must follow hoisted test-boundary mocks. */
import type { ContentCatalog, QuestionItem } from '@/types/content';
import type { ProgressSnapshot } from '@/types/progress';
import type { AnswerRecord, QuizSession } from '@/types/session';

const testState = vi.hoisted(() => ({
  screen: 'home' as 'home' | 'scope' | 'quiz' | 'feedback' | 'result',
  catalog: null as ContentCatalog | null,
  snapshot: null as ProgressSnapshot | null,
  scopeSelection: { weekKeys: [] as string[], questionCount: 5 as 3 | 5 | 10 },
  session: null as QuizSession | null,
  draftAnswers: {} as Record<string, { selectedOptionId?: string; freeText?: string }>,
  router: { push: vi.fn(), replace: vi.fn() },
  recordAnswer: vi.fn(async () => undefined),
  updateReviewQueue: vi.fn(async (queue: readonly unknown[]) => {
    if (testState.snapshot) testState.snapshot = { ...testState.snapshot, reviewQueue: queue as ProgressSnapshot['reviewQueue'] };
  }),
  save: vi.fn(async () => undefined),
}));

// Use the same semantic React Native harness as the existing Visual Contract tests.
// Route components and their ViewModels remain real; only Context, Router, and storage
// boundaries are supplied by this focused smoke fixture.
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useCallback: <T,>(callback: T) => callback,
    useEffect: () => undefined,
    useMemo: <T,>(factory: () => T) => factory(),
    useRef: <T,>(current: T) => ({ current }),
    useState: <T,>(initial: T) => [initial, () => undefined] as const,
  };
});

vi.mock('react-native', () => {
  const host = (name: string) => name;
  return {
    ActivityIndicator: host('ActivityIndicator'),
    Alert: { alert: vi.fn() },
    Animated: {
      Value: class {
        value: number;
        constructor(initialValue: number) {
          this.value = initialValue;
        }
        setValue(value: number) {
          this.value = value;
        }
      },
      View: host('Animated.View'),
      timing: vi.fn(() => ({ start: (callback?: (result: { finished: boolean }) => void) => callback?.({ finished: true }) })),
    },
    PanResponder: {
      create: () => ({ panHandlers: {} }),
    },
    Dimensions: { get: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }) },
    Platform: {
      OS: 'web',
      select: <T,>(options: Record<string, T> & { default?: T }) => options.web ?? options.default,
    },
    Pressable: host('Pressable'),
    SafeAreaView: host('SafeAreaView'),
    ScrollView: host('ScrollView'),
    StyleSheet: {
      create: <T,>(styles: T) => styles,
      flatten: <T,>(styles: T) => styles,
      hairlineWidth: 1,
    },
    Text: host('Text'),
    TextInput: host('TextInput'),
    View: host('View'),
    useColorScheme: () => 'light',
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
  };
});

vi.mock('expo-router', () => {
  const Stack = Object.assign(() => null, { Screen: () => null });
  return {
    Stack,
    useLocalSearchParams: () => ({ sessionId: testState.session?.id ?? 'session-smoke' }),
    useRouter: () => testState.router,
  };
});

vi.mock('@/hooks/use-accessibility-focus', () => ({
  useAccessibilityFocus: () => ({ onBlur: vi.fn(), onFocus: vi.fn(), focusStyle: undefined }),
}));

vi.mock('@/contexts/ContentContext', () => ({
  useContent: () => ({ catalog: testState.catalog, state: 'ready', retry: vi.fn(async () => undefined) }),
}));

vi.mock('@/hooks/useContentSync', () => ({
  useContentSync: () => ({
    catalog: testState.catalog,
    state: 'ready',
    message: undefined,
    isContentAvailable: Boolean(testState.catalog),
    retry: vi.fn(async () => undefined),
  }),
}));

vi.mock('@/contexts/ProgressContext', () => ({
  useProgress: () => ({
    snapshot: testState.snapshot,
    isLoading: false,
    recordAnswer: testState.recordAnswer,
    updateReviewQueue: testState.updateReviewQueue,
    getStore: () => ({ save: testState.save }),
  }),
}));

vi.mock('@/contexts/QuizSessionContext', () => ({
  useQuizSession: () => ({
    currentSession: testState.screen === 'home' ? null : testState.session,
    scopeSelection: testState.scopeSelection,
    setScopeSelection: (selection: typeof testState.scopeSelection) => {
      testState.scopeSelection = {
        weekKeys: [...selection.weekKeys],
        questionCount: selection.questionCount,
      };
    },
    startSessionForScope: () => testState.session,
    startSession: () => testState.session,
    startSessionFromPool: () => testState.session,
    clearSession: vi.fn(),
    draftAnswers: testState.draftAnswers,
    getSession: () => testState.session,
    setDraftAnswer: (questionId: string, draft: { selectedOptionId?: string; freeText?: string }) => {
      testState.draftAnswers[questionId] = { ...draft };
    },
    submitAnswer: (input: { selectedOptionId?: string; freeText?: string; isCorrect: boolean; answeredAt: string }) => {
      const session = testState.session;
      const question = session?.questions[session.currentIndex];
      if (!session || !question) return null;
      const answer: AnswerRecord = {
        questionId: question.id,
        ...(input.selectedOptionId === undefined ? {} : { selectedOptionId: input.selectedOptionId }),
        ...(input.freeText === undefined ? {} : { freeText: input.freeText }),
        isCorrect: input.isCorrect,
        answeredAt: input.answeredAt,
      };
      testState.session = {
        ...session,
        answeredCount: session.answeredCount + 1,
        correctCount: session.correctCount + (input.isCorrect ? 1 : 0),
        answers: { ...session.answers, [question.id]: answer },
      };
      delete testState.draftAnswers[question.id];
      return answer;
    },
    goToNextQuestion: vi.fn(),
  }),
}));

import HomeScreen from '@/app/(tabs)/home';
import ScopeSelectionScreen from '@/app/scope';
import QuizScreen from '@/app/quiz/[sessionId]';
import FeedbackScreen from '@/app/feedback/[sessionId]';
import ResultScreen from '@/app/result/[sessionId]';
import { visualCatalog, visualProgress } from '@/tests/ui/fixtures/visualContractFixtures';

(globalThis as { React?: typeof React }).React = React;

type SemanticNode = {
  type: string;
  props: Record<string, unknown>;
  children: SemanticNode[];
  text?: string;
};

function expand(value: unknown): SemanticNode[] {
  if (value === null || value === undefined || typeof value === 'boolean') return [];
  if (typeof value === 'string' || typeof value === 'number') {
    return [{ type: '#text', props: {}, children: [], text: String(value) }];
  }
  if (Array.isArray(value)) return value.flatMap(expand);
  if (!React.isValidElement(value)) return [];

  const element = value as React.ReactElement<Record<string, unknown>>;
  if (typeof element.type === 'function') {
    return expand((element.type as (props: Record<string, unknown>) => unknown)(element.props));
  }
  if (typeof element.type !== 'string') return expand(element.props.children);
  return [{ type: element.type, props: element.props, children: expand(element.props.children) }];
}

function renderScreen(Screen: () => React.ReactNode): SemanticNode[] {
  return expand(Screen());
}

function findByType(nodes: SemanticNode[], type: string): SemanticNode[] {
  return nodes.flatMap((node) => [
    ...(node.type === type ? [node] : []),
    ...findByType(node.children, type),
  ]);
}

function findByLabel(nodes: SemanticNode[], label: string): SemanticNode[] {
  return findByType(nodes, 'Pressable').filter((node) => node.props.accessibilityLabel === label);
}

function findLabelContaining(nodes: SemanticNode[], fragment: string): SemanticNode[] {
  return findByType(nodes, 'Pressable').filter((node) => String(node.props.accessibilityLabel).includes(fragment));
}

function textContent(node: SemanticNode): string {
  return node.text ?? node.children.map(textContent).join('');
}

function allText(nodes: SemanticNode[]): string {
  return nodes.map(textContent).join('');
}

function press(nodes: SemanticNode[], label: string) {
  const control = findByLabel(nodes, label)[0];
  expect(control, `control ${label}`).toBeDefined();
  (control?.props.onPress as (() => void) | undefined)?.();
}

function pressContaining(nodes: SemanticNode[], fragment: string) {
  const control = findLabelContaining(nodes, fragment)[0];
  expect(control, `control containing ${fragment}`).toBeDefined();
  (control?.props.onPress as (() => void) | undefined)?.();
}

function makeQuestion(format: QuestionItem['format'], fillBlankMode: 'choice' | 'freeText' = 'choice'): QuestionItem {
  const base = {
    id: `question-smoke-${format}`,
    weekUnitId: 'week-unit-week3',
    format,
    prompt: `${format}の問題です。`,
    explanation: 'この問題の解説は、教材の根拠と確認手順を説明する十分な長さの文章です。',
    sourceReference: { weekKey: 'week3' as const, sectionHeading: 'Flexboxの基本' },
    published: true,
    deleted: false,
  } satisfies Omit<QuestionItem, 'payload'>;

  if (format === 'singleChoice') {
    return { ...base, payload: { kind: 'choice', options: choiceOptions(), correctOptionId: 'a' } };
  }
  if (format === 'trueFalse') {
    return {
      ...base,
      payload: {
        kind: 'trueFalse',
        options: [{ id: 'true', text: '正しい' }, { id: 'false', text: '誤り' }],
        correctOptionId: 'true',
      },
    };
  }
  if (format === 'bugDiagnosis') {
    return {
      ...base,
      payload: { kind: 'bugDiagnosis', code: 'const value = broken();\nconsole.log(value);', options: choiceOptions(), correctOptionId: 'a' },
    };
  }
  if (format === 'fillBlank' && fillBlankMode === 'choice') {
    return {
      ...base,
      payload: {
        kind: 'fillBlank',
        content: 'const value = __BLANK__;',
        blankToken: '__BLANK__',
        mode: 'choice',
        options: choiceOptions(),
        correctOptionId: 'a',
      },
    };
  }
  if (format === 'fillBlank') {
    return {
      ...base,
      payload: {
        kind: 'fillBlank',
        content: 'const value = __BLANK__;',
        blankToken: '__BLANK__',
        mode: 'freeText',
        correctText: 'answer',
        maxInputLength: 64,
      },
    };
  }
  throw new Error(`unsupported format: ${format}`);
}

function choiceOptions() {
  return [
    { id: 'a', text: '正しい答え' },
    { id: 'b', text: '別の答え' },
    { id: 'c', text: '補助の答え' },
    { id: 'd', text: '最後の答え' },
  ];
}

function makeSession(question: QuestionItem, answered = false): QuizSession {
  const answer = answered
    ? {
      questionId: question.id,
      ...(question.format === 'fillBlank' && 'mode' in question.payload && question.payload.mode === 'freeText' ? { freeText: 'answer' } : { selectedOptionId: 'b' }),
      isCorrect: false,
      answeredAt: '2025-01-01T00:00:42.000Z',
    }
    : undefined;
  return {
    id: `session-${question.id}`,
    startedAt: '2025-01-01T00:00:00.000Z',
    questionIds: [question.id],
    questions: [question],
    optionOrders: 'options' in question.payload
      ? { [question.id]: question.payload.options.map((option) => option.id) }
      : { [question.id]: [] },
    currentIndex: 0,
    answeredCount: answered ? 1 : 0,
    correctCount: 0,
    answers: answer ? { [question.id]: answer } : {},
    mode: 'normal',
  };
}

function resetState() {
  const flowQuestion = makeQuestion('singleChoice');
  testState.screen = 'home';
  testState.catalog = visualCatalog;
  testState.snapshot = structuredClone(visualProgress);
  testState.scopeSelection = { weekKeys: [], questionCount: 5 };
  testState.session = makeSession(flowQuestion);
  testState.draftAnswers = {};
  testState.router.push.mockClear();
  testState.router.replace.mockClear();
  testState.recordAnswer.mockClear();
  testState.updateReviewQueue.mockClear();
  testState.save.mockClear();
}

describe('主要学習ループ UI smoke', () => {
  it('ホームはストリーク専用で、そこから主要学習フローを検証する', async () => {
    resetState();

    let tree = renderScreen(HomeScreen);
    expect(allText(tree)).toContain('問連続正解！');
    expect(findByType(tree, 'Pressable')).toHaveLength(0);

    testState.screen = 'scope';
    tree = renderScreen(ScopeSelectionScreen);
    expect(allText(tree)).toContain('既定 5問');
    expect(allText(tree)).toContain('選択中のWeek');
    pressContaining(tree, '問題を始めよう');
    expect(testState.router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/quiz/[sessionId]' }));

    testState.screen = 'quiz';
    tree = renderScreen(QuizScreen);
    expect(allText(tree)).toContain('4択');
    press(tree, '2番、別の答え');
    tree = renderScreen(QuizScreen);
    press(tree, '解答を確定');
    expect(testState.session?.answers[testState.session.questions[0]!.id]).toMatchObject({
      selectedOptionId: 'b',
      isCorrect: false,
    });
    expect(testState.router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/feedback/[sessionId]' }));

    testState.screen = 'feedback';
    tree = renderScreen(FeedbackScreen);
    expect(allText(tree)).toContain('解説全文');
    expect(allText(tree)).toContain('教材情報');
    expect(allText(tree)).toContain('誤り');
    expect(allText(tree)).not.toContain('復習に追加');
    expect(findLabelContaining(tree, '間違えた問題をすぐに復習')).toHaveLength(1);

    press(tree, '結果を見る');
    expect(testState.router.replace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/result/[sessionId]' }));

    testState.screen = 'result';
    tree = renderScreen(ResultScreen);
    expect(allText(tree)).toContain('学習完了');
    expect(allText(tree)).toContain('正解数');
    expect(findLabelContaining(tree, 'もう一度挑戦')).toHaveLength(1);
    expect(findLabelContaining(tree, '間違いを復習')).toHaveLength(1);
    expect(findByLabel(tree, 'ホームへ')).toHaveLength(1);

    pressContaining(tree, 'もう一度挑戦');
    expect(testState.router.replace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/quiz/[sessionId]' }));
    pressContaining(tree, '間違いを復習');
    expect(testState.router.push).toHaveBeenCalledWith('/review');
    press(tree, 'ホームへ');
    expect(testState.router.replace).toHaveBeenCalledWith('/');

    for (const node of tree) {
      expect(findByType([node], 'TabBar')).toHaveLength(0);
    }
  });

  it('既存QuizSession/ViewModel境界を通して5形式を表示し、回答確定へ進める', () => {
    resetState();
    const cases: { format: QuestionItem['format']; expected: string; fillBlankMode?: 'choice' | 'freeText' }[] = [
      { format: 'singleChoice', expected: '4択' },
      { format: 'trueFalse', expected: '正誤判定' },
      { format: 'bugDiagnosis', expected: 'バグ診断' },
      { format: 'fillBlank', expected: '穴埋め', fillBlankMode: 'choice' },
      { format: 'fillBlank', expected: '空欄に入る語句を入力', fillBlankMode: 'freeText' },
    ];

    cases.forEach(({ format, expected, fillBlankMode }, index) => {
      const question = makeQuestion(format, fillBlankMode);
      testState.screen = 'quiz';
      testState.session = makeSession(question);
      testState.draftAnswers = {};
      let tree = renderScreen(QuizScreen);
      expect(allText(tree), `format ${format} case ${index}`).toContain(expected);

      if (format === 'fillBlank' && 'mode' in question.payload && question.payload.mode === 'freeText') {
        const input = findByType(tree, 'TextInput')[0];
        expect(input).toBeDefined();
        (input?.props.onChangeText as ((value: string) => void) | undefined)?.('answer');
      } else {
        const option = findByType(tree, 'Pressable').find((node) => node.props.accessibilityRole === 'radio');
        expect(option).toBeDefined();
        (option?.props.onPress as (() => void) | undefined)?.();
      }

      tree = renderScreen(QuizScreen);
      const submit = findByLabel(tree, '解答を確定')[0];
      expect(submit?.props.accessibilityState).toMatchObject({ disabled: false });
      (submit?.props.onPress as (() => void) | undefined)?.();
      expect(testState.router.push).toHaveBeenLastCalledWith(expect.objectContaining({ pathname: '/feedback/[sessionId]' }));
    });
  });
});
