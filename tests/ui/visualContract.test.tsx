import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  viewportWidth: 390,
  screen: 'home' as 'home' | 'scope' | 'quiz' | 'feedback' | 'result',
  catalog: null as unknown,
  snapshot: null as unknown,
  feedback: null as unknown,
  router: { push: vi.fn(), replace: vi.fn(), back: vi.fn() },
  alert: vi.fn(),
  confirm: vi.fn(() => true),
  clearSession: vi.fn(),
  animatedTiming: vi.fn(),
  animatedValues: vi.fn(),
  startSessionForScope: vi.fn(() => null),
}));

// The screens use React hooks, while this suite evaluates their React Native
// element trees as a lightweight react-native-web semantic contract harness.
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
    Alert: { alert: testState.alert },
    Dimensions: { get: () => ({ width: testState.viewportWidth, height: 844, scale: 1, fontScale: 1 }) },
    Platform: {
      OS: 'web',
      select: <T,>(options: Record<string, T> & { default?: T }) => options.web ?? options.default,
    },
    Pressable: host('Pressable'),
    PanResponder: {
      create: (config: Record<string, (...args: readonly unknown[]) => unknown>) => ({
        panHandlers: {
          onMoveShouldSetPanResponder: config.onMoveShouldSetPanResponder,
          onPanResponderMove: config.onPanResponderMove,
          onPanResponderRelease: config.onPanResponderRelease,
          onPanResponderTerminate: config.onPanResponderTerminate,
        },
      }),
    },
    Animated: {
      Value: class {
        constructor(initialValue: number) {
          this.value = initialValue;
        }
        value: number;
        setValue(value: number) {
          this.value = value;
          testState.animatedValues(value);
        }
      },
      View: host('Animated.View'),
      timing: vi.fn((_value: unknown, config: unknown) => {
        testState.animatedTiming(config);
        return { start: (callback?: (result: { finished: boolean }) => void) => callback?.({ finished: true }) };
      }),
    },
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
    useWindowDimensions: () => ({ width: testState.viewportWidth, height: 844, scale: 1, fontScale: 1 }),
  };
});

vi.mock('expo-router', () => {
  const Stack = Object.assign(() => null, { Screen: () => null });
  return {
    Stack,
    useLocalSearchParams: () => ({ sessionId: 'session-visual-contract' }),
    useRouter: () => testState.router,
  };
});

vi.mock('@/hooks/use-accessibility-focus', () => ({
  useAccessibilityFocus: () => ({ onBlur: vi.fn(), onFocus: vi.fn(), focusStyle: undefined }),
}));

vi.mock('@/contexts/ContentContext', () => ({
  useContent: () => ({ catalog: testState.catalog, state: 'ready', retry: vi.fn() }),
}));

vi.mock('@/hooks/useContentSync', () => ({
  useContentSync: () => ({
    catalog: testState.catalog,
    state: 'ready',
    message: undefined,
    isContentAvailable: Boolean(testState.catalog),
    retry: vi.fn(),
  }),
}));

vi.mock('@/contexts/ProgressContext', () => ({
  useProgress: () => ({
    snapshot: testState.snapshot,
    isLoading: false,
    recordAnswer: vi.fn(async () => undefined),
    updateReviewQueue: vi.fn(async () => undefined),
    getStore: () => ({ save: vi.fn(async () => undefined) }),
  }),
}));

vi.mock('@/contexts/QuizSessionContext', () => ({
  useQuizSession: () => {
    const session = testState.screen === 'quiz'
      ? testState.unansweredSession
      : testState.answeredSession;
    return {
      currentSession: testState.screen === 'home' ? null : session,
      scopeSelection: { weekKeys: ['week3'], questionCount: 5 },
      setScopeSelection: vi.fn(),
      startSessionForScope: testState.startSessionForScope,
      startSession: vi.fn(() => testState.unansweredSession),
      startSessionFromPool: vi.fn(() => testState.unansweredSession),
      draftAnswers: testState.screen === 'quiz'
        ? { 'question-week3-bug-001': { selectedOptionId: 'a' } }
        : {},
      getSession: () => session,
      setDraftAnswer: vi.fn(),
      submitAnswer: vi.fn(() => testState.answeredSession.answers['question-week3-bug-001']),
      goToNextQuestion: vi.fn(),
      clearSession: testState.clearSession,
    };
  },
}));

vi.mock('@/lib/quiz/feedback', () => ({
  buildFeedback: () => testState.feedback,
}));

vi.mock('@/lib/progress/reviewQueue', () => ({
  addReviewOnWrongAnswer: (queue: unknown[]) => queue,
  applyReviewAnswer: (queue: unknown[]) => queue,
}));

import HomeScreen from '@/app/(tabs)/home';
import ScopeSelectionScreen from '@/app/scope';
import QuizScreen from '@/app/quiz/[sessionId]';
import FeedbackScreen from '@/app/feedback/[sessionId]';
import ResultScreen from '@/app/result/[sessionId]';
import { QuizCodeBlock } from '@/components/quiz/QuizCodeBlock';
import { Colors, Fonts } from '@/constants/theme';
import { getResponsiveBreakpoint, getResponsiveContentStyle } from '@/styles/responsive';
import {
  answeredSession,
  unansweredSession,
  visualCatalog,
  visualFeedback,
  visualProgress,
} from '@/tests/ui/fixtures/visualContractFixtures';

// Expo's TS JSX transform emits classic React.createElement calls for route files.
(globalThis as { React?: typeof React }).React = React;

testState.catalog = visualCatalog;
testState.snapshot = visualProgress;
testState.feedback = visualFeedback;
testState.unansweredSession = unansweredSession;
testState.answeredSession = answeredSession;

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
    return expand(element.type(element.props));
  }
  if (typeof element.type !== 'string') return expand(element.props.children);

  return [{
    type: element.type,
    props: element.props,
    children: expand(element.props.children),
  }];
}

function renderScreen(Screen: () => React.ReactNode): SemanticNode[] {
  return expand(Screen());
}

function textContent(node: SemanticNode): string {
  return node.text ?? node.children.map(textContent).join('');
}

function allText(nodes: SemanticNode[]): string {
  return nodes.map(textContent).join('');
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

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
  if (typeof style === 'function') {
    return flattenStyle(style({ pressed: false, focused: false, hovered: false }));
  }
  return typeof style === 'object' ? style as Record<string, unknown> : {};
}

function assertSemanticControls(nodes: SemanticNode[]) {
  const controls = findByType(nodes, 'Pressable');
  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) {
    expect(control.props.accessibilityRole).toBeTruthy();
    expect(control.props.accessibilityLabel).toEqual(expect.any(String));
    expect(String(control.props.accessibilityLabel)).toMatch(/[ぁ-んァ-ン一-龯]/);
    expect(flattenStyle(control.props.style).minHeight).toBeGreaterThanOrEqual(44);
  }
}

function assertNoExcludedUi(nodes: SemanticNode[]) {
  const text = allText(nodes);
  expect(text).not.toMatch(/キャラクター|みかん|Premium|課金|広告|SALE|セール|ユーザー名|けたさん|学習データ/);
  expect(findByType(nodes, 'TabBar')).toHaveLength(0);
}

describe('主要学習ループ Visual Contract', () => {
  it('ホームはストリークと学習ポイントだけを表示する', () => {
    testState.screen = 'home';
    const tree = renderScreen(HomeScreen);
    const text = allText(tree);

    expect(text).toContain('0');
    expect(text).toContain('問連続正解！');
    expect(findByType(tree, 'View').filter((node) => node.props.accessibilityRole === 'text')).toHaveLength(2);
    expect(findByType(tree, 'View').some((node) => node.props.accessibilityLabel === '連続正解0問')).toBe(true);
    expect(findByType(tree, 'View').some((node) => node.props.accessibilityLabel === '学習ポイント0')).toBe(true);
    expect(text).not.toContain('今日のミッション');
    expect(text).not.toContain('学習マップ');
    expect(text).not.toContain('RECOMMENDED CURRICULUM');
    expect(findByType(tree, 'Pressable')).toHaveLength(0);
    assertNoExcludedUi(tree);
  });

  it('scopeは選択中のWeekと問題数だけを表示する', () => {
    testState.screen = 'scope';
    const tree = renderScreen(ScopeSelectionScreen);
    const text = allText(tree);

    expect(text).toContain('問題数を選ぶ');
    expect(text).toContain('選択中のWeek');
    expect(text).toContain('Week03');
    expect(text).toContain('1問を出題できます。');
    expect(text).not.toContain('Week全体');
    expect(text).toContain('問題数');
    expect(text).toContain('既定 5問');
    expect(text).toContain('問題を始めよう！');
    expect(findByLabel(tree, '問題数設定')).toHaveLength(0);
    expect(findByType(tree, 'ScrollView').some((node) => node.props.horizontal === true)).toBe(false);
    expect(findByLabel(tree, '5問')).toHaveLength(1);
    expect(findByLabel(tree, '5問')[0]?.props.accessibilityState).toMatchObject({ selected: true });
    const sheet = findByType(tree, 'Animated.View')[0];
    expect((sheet?.props.onMoveShouldSetPanResponder as ((event: unknown, gesture: { dy: number; dx: number }) => boolean) | undefined)?.({}, { dy: 40, dx: 0 })).toBe(true);
    (sheet?.props.onPanResponderMove as ((event: unknown, gesture: { dy: number }) => void) | undefined)?.({}, { dy: 60 });
    expect(testState.animatedValues).toHaveBeenLastCalledWith(60);
    (sheet?.props.onPanResponderRelease as ((event: unknown, gesture: { dy: number; vy: number }) => void) | undefined)?.({}, { dy: 60, vy: 0 });
    expect(testState.animatedTiming).toHaveBeenCalledWith({
      duration: 180,
      toValue: 0,
      useNativeDriver: true,
    });
    const startButton = findByType(tree, 'Pressable').find((node) => String(node.props.accessibilityLabel).includes('問題を始めよう'));
    expect(startButton).toBeDefined();
    (startButton?.props.onPress as (() => void) | undefined)?.();
    expect(testState.startSessionForScope).toHaveBeenCalledWith(
      expect.anything(),
      { weekKeys: ['week3'] },
      5,
    );
    const scopeScrollView = findByType(tree, 'ScrollView')[0];
    (scopeScrollView?.props.onScroll as ((event: unknown) => void) | undefined)?.({
      nativeEvent: { contentOffset: { y: -60 } },
    });
    expect(testState.animatedTiming).toHaveBeenCalledWith({
      duration: 220,
      toValue: 844,
      useNativeDriver: true,
    });
    expect(testState.router.back).toHaveBeenCalledTimes(1);
    assertSemanticControls(tree);
    assertNoExcludedUi(tree);
  });

  it('コード表示は背景付きの等幅コードブロックとして横スクロールできる', () => {
    const code = 'const value = 1;\nconsole.log(value);';
    const tree = renderScreen(() => <QuizCodeBlock code={code} label="問題のコード" />);
    const scrollView = findByType(tree, 'ScrollView')[0];
    const codeText = findByType(tree, 'Text').find((node) => textContent(node).includes('const value = 1;'));
    const codeWrapper = findByType(tree, 'View').find(
      (node) => flattenStyle(node.props.style).backgroundColor === '#1E1E1E',
    );
    const editorHeader = findByType(tree, 'View').find(
      (node) => flattenStyle(node.props.style).backgroundColor === '#252526',
    );

    expect(scrollView?.props.horizontal).toBe(true);
    expect(scrollView?.props.accessibilityLabel).toBe('問題のコード');
    expect(allText(tree)).toContain('const value = 1;');
    expect(allText(tree)).toContain('console.log(value);');
    expect(allText(tree)).toContain('1');
    expect(allText(tree)).toContain('2');
    expect(flattenStyle(codeText?.props.style).fontFamily).toBe(Fonts.mono);
    expect(codeWrapper).toBeDefined();
    expect(editorHeader).toBeDefined();
    expect(flattenStyle(codeWrapper?.props.style)).toMatchObject({
      backgroundColor: '#1E1E1E',
      borderColor: '#3E3E42',
    });
  });

  it('クイズは没入型ヘッダー、進捗、1問カード、局所コードスクロールを表示する', () => {
    testState.alert.mockClear();
    testState.confirm.mockReset();
    testState.confirm.mockReturnValue(true);
    vi.stubGlobal('confirm', testState.confirm);
    testState.clearSession.mockClear();
    testState.router.replace.mockClear();
    testState.screen = 'quiz';
    const tree = renderScreen(QuizScreen);
    const text = allText(tree);
    const scrollViews = findByType(tree, 'ScrollView');

    expect(text).toContain('1 / 1');
    expect(findByType(tree, 'View').some((node) => String(node.props.accessibilityLabel).includes('クイズ、問題1 / 1'))).toBe(true);
    expect(text).toContain('バグ診断');
    expect(text).toContain('このコードの誤りを選んでください。');
    expect(text).toContain('解答を確定');
    expect(scrollViews.filter((node) => node.props.horizontal === true)).toHaveLength(1);
    expect(scrollViews.find((node) => node.props.horizontal === true)?.props.accessibilityLabel).toBe('バグ診断コード');
    expect(scrollViews.find((node) => node.props.horizontal !== true)?.props.style).toBeDefined();
    expect(flattenStyle(scrollViews.find((node) => node.props.horizontal !== true)?.props.style).overflow).toBe('hidden');
    const selectedOption = findByLabel(tree, '1番、主軸方向に並べる、選択中');
    expect(selectedOption).toHaveLength(1);
    expect(selectedOption[0]?.props.accessibilityState).toMatchObject({ selected: true, disabled: false });
    expect(findByLabel(tree, '解答を確定')[0]?.props.accessibilityState).toMatchObject({ disabled: false });

    const exitButton = findByLabel(tree, 'クイズを中断')[0];
    expect(exitButton).toBeDefined();
    testState.confirm.mockReturnValueOnce(false).mockReturnValueOnce(true);
    (exitButton?.props.onPress as (() => void) | undefined)?.();
    expect(testState.confirm).toHaveBeenCalledWith(
      'クイズを中断しますか？\n\n確定済みの解答は保存されます。未解答の問題は記録されません。',
    );
    expect(testState.alert).not.toHaveBeenCalled();
    expect(testState.clearSession).not.toHaveBeenCalled();
    expect(testState.router.replace).not.toHaveBeenCalled();

    (exitButton?.props.onPress as (() => void) | undefined)?.();
    expect(testState.confirm).toHaveBeenCalledTimes(2);
    expect(testState.clearSession).toHaveBeenCalledTimes(1);
    expect(testState.router.replace).toHaveBeenCalledWith('/scope');

    assertSemanticControls(tree);
    assertNoExcludedUi(tree);
  });

  it('Feedbackは正誤の記号/日本語、全文解説、引用1行、復習/次へCTAを表示する', () => {
    testState.screen = 'feedback';
    const tree = renderScreen(FeedbackScreen);
    const text = allText(tree);
    const summaries = findByType(tree, 'View').filter((node) => node.props.accessibilityRole === 'summary');

    expect(text).toContain('解説');
    expect(text).toContain('誤り');
    expect(text).toContain('正解の内容');
    expect(text).toContain('解説全文');
    expect(text).toContain('教材情報');
    expect(text).toContain('引用：');
    expect(text).not.toContain('Topic');
    expect(text).toContain('なぜ違う？');
    expect(text).not.toContain('復習に追加');
    expect(findByLabel(tree, '間違えた問題をすぐに復習')).toHaveLength(1);
    expect(text).toContain('結果を見る');
    expect(text).toContain('✓');
    expect(text).toContain('!');
    expect(summaries.some((node) => String(node.props.accessibilityLabel).includes('判定結果'))).toBe(true);
    expect(findByType(tree, 'Text').some((node) => node.props.accessibilityLiveRegion === 'polite')).toBe(true);
    const answeredOptions = findByType(tree, 'Pressable').filter((node) => node.props.accessibilityRole === 'radio');
    expect(answeredOptions.length).toBeGreaterThan(0);
    expect(answeredOptions.every((node) => (node.props.accessibilityState as { disabled?: boolean }).disabled === true)).toBe(true);
    assertSemanticControls(tree);
    assertNoExcludedUi(tree);
  });

  it('結果は完了、主指標、補助指標、再挑戦/復習/ホームの順で表示する', () => {
    testState.screen = 'result';
    const tree = renderScreen(ResultScreen);
    const text = allText(tree);

    expect(text).toContain('学習完了');
    expect(text).toContain('今日の一歩を達成');
    expect(text).toContain('正解数');
    expect(text).toContain('解答時間');
    expect(text).toContain('復習対象');
    expect(text).not.toContain('間違えたTopic');
    expect(text).toContain('もう一度確認する問題');
    expect(text).toContain('もう一度挑戦');
    expect(text).toContain('間違いを復習');
    expect(text).toContain('ホームへ');
    const resultActions = findByType(tree, 'View').filter(
      (node) => node.props.accessibilityLabel === '結果画面の次の行動',
    );
    expect(resultActions).toHaveLength(1);
    const buttons = findByType(tree, 'Pressable').map((node) => String(node.props.accessibilityLabel));
    expect(buttons[0]).toBe('もう一度挑戦');
    expect(buttons[1]).toContain('間違いを復習');
    expect(buttons[2]).toBe('ホームへ');
    expect(findByType(tree, 'Pressable')[1]?.props.accessibilityState).toMatchObject({ disabled: true });
    assertSemanticControls(tree);
    assertNoExcludedUi(tree);
  });

  it.each([
    [320, 'compact'],
    [767, 'compact'],
    [768, 'medium'],
    [1023, 'medium'],
    [1024, 'wide'],
  ] as const)('all screens use the contract container at %dpx (%s)', (width, breakpoint) => {
    testState.viewportWidth = width;
    expect(getResponsiveBreakpoint(width)).toBe(breakpoint);
    expect(getResponsiveContentStyle(width)).toMatchObject({
      alignSelf: 'center',
      maxWidth: 960,
      width: '100%',
    });
  });

  it('uses semantic colors for progress, review, growth, support, and white surfaces', () => {
    expect(Colors.light.progressOrange).toBe(Colors.light.primary);
    expect(Colors.light.reviewBlue).toBe(Colors.light.review);
    expect(Colors.light.growthGreen).toBe(Colors.light.growth);
    expect(Colors.light.surfaceWhite).toBe('#FFFFFF');
    expect(Colors.dark.progressOrange).not.toBe(Colors.dark.reviewBlue);
    expect(Colors.dark.growthGreen).not.toBe(Colors.dark.progressOrange);
  });
});
