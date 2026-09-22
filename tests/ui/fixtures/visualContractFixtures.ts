import type { ContentCatalog, QuestionItem } from '@/types/content';
import type { ProgressSnapshot } from '@/types/progress';
import type { QuizSession } from '@/types/session';

const options = [
  { id: 'a', text: '主軸方向に並べる' },
  { id: 'b', text: '交差軸方向に揃える' },
  { id: 'c', text: '表示方式を指定する' },
  { id: 'd', text: '配置方法を指定する' },
];

export const visualQuestion: QuestionItem = {
  id: 'question-week3-bug-001',
  weekUnitId: 'week-unit-week3',
  format: 'bugDiagnosis',
  prompt: 'このコードの誤りを選んでください。',
  payload: {
    kind: 'bugDiagnosis',
    code: 'const layout = { display: "grid" };\nconsole.log(layout);',
    options,
    correctOptionId: 'a',
  },
  explanation: 'この解説ではレイアウトの考え方と、誤りを確認する手順を説明します。',
  sourceReference: {
    weekKey: 'week3',
    sectionHeading: 'Flexboxの基本',
  },
  published: true,
  deleted: false,
};

const weekKeys = ['week3', 'week4', 'week5', 'week6', 'git_github_level1'] as const;

export const visualCatalog: ContentCatalog = {
  weekUnits: weekKeys.map((key, index) => ({
    id: `week-unit-${key}`,
    key,
    order: index + 3,
    title: `Week0${index + 3}｜カリキュラム`,
    published: true,
    deleted: false,
  })),
  questions: [visualQuestion, ...weekKeys.slice(1).map((key, index) => ({
    ...visualQuestion,
    id: `question-${key}-001`,
    weekUnitId: `week-unit-${key}`,
    sourceReference: { weekKey: key, sectionHeading: 'カリキュラムの基本' },
    payload: {
      ...visualQuestion.payload,
      code: `const week = '${key}';\nconsole.log(week);`,
    },
  } as QuestionItem))],
  terms: [],
  activities: [],
};

export const unansweredSession: QuizSession = {
  id: 'session-visual-contract',
  startedAt: '2025-01-01T00:00:00.000Z',
  questionIds: [visualQuestion.id],
  questions: [visualQuestion],
  optionOrders: { [visualQuestion.id]: options.map((option) => option.id) },
  currentIndex: 0,
  answeredCount: 0,
  correctCount: 0,
  answers: {},
  mode: 'normal',
};

export const answeredSession: QuizSession = {
  ...unansweredSession,
  answeredCount: 1,
  answers: {
    [visualQuestion.id]: {
      questionId: visualQuestion.id,
      selectedOptionId: 'b',
      isCorrect: false,
      answeredAt: '2025-01-01T00:00:42.000Z',
    },
  },
};

export const visualProgress: ProgressSnapshot = {
  schemaVersion: 1,
  weekProgress: weekKeys.map((weekKey) => ({
    weekKey,
    questionCount: 0,
    correctCount: 0,
    lastAnsweredAt: null,
  })),
  reviewQueue: [],
  streakCount: 0,
};

export const visualFeedback = {
  isCorrect: false,
  correctText: '主軸方向に並べる',
  explanation: 'この解説全文は、教材の根拠と確認手順を省略せずに表示します。',
  explanationSegments: [
    { text: 'この解説全文は、教材の根拠と確認手順を省略せずに表示します。' },
  ],
  sourceReference: visualQuestion.sourceReference,
  incorrectReason: 'この選択肢は交差軸の指定を説明しているため誤りです。',
};
