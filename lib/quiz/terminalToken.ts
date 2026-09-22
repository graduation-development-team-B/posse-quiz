import type {
  ContentCatalog,
  InteractiveQuestionPayload,
  TerminalStage,
  TerminalTokenActivity,
} from '@/types/content';

export interface TerminalHistoryEntry {
  command: string;
  lines: string[];
  isError: boolean;
}

export interface TerminalStageState {
  cwd: string[];
  completedCommandCount: number;
  history: TerminalHistoryEntry[];
  isComplete: boolean;
}

export interface ResolvedTerminalStage {
  activity: TerminalTokenActivity;
  stage: TerminalStage;
}

export function isInteractiveQuestionPayload(
  payload: unknown,
): payload is InteractiveQuestionPayload {
  if (typeof payload !== 'object' || payload === null) return false;
  const candidate = payload as Partial<InteractiveQuestionPayload>;
  return candidate.kind === 'activityRef'
    && candidate.activityType === 'terminalToken'
    && typeof candidate.activityId === 'string'
    && typeof candidate.stageId === 'string';
}

export function resolveTerminalStage(
  catalog: ContentCatalog | null,
  payload: InteractiveQuestionPayload,
): ResolvedTerminalStage | null {
  if (!catalog) return null;
  const activity = catalog.activities.find((candidate) =>
    candidate.id === payload.activityId
      && candidate.type === payload.activityType
      && candidate.published
      && !candidate.deleted,
  );
  if (!activity) return null;
  const stage = activity.stages.find((candidate) => candidate.id === payload.stageId);
  return stage ? { activity, stage } : null;
}

export function createTerminalStageState(stage: TerminalStage): TerminalStageState {
  return {
    cwd: [...stage.startCwd],
    completedCommandCount: 0,
    history: [],
    isComplete: false,
  };
}

export function runTerminalStageCommand(
  stage: TerminalStage,
  state: TerminalStageState,
  argv: readonly string[],
): TerminalStageState {
  if (state.isComplete || argv.length === 0) return state;

  const commandText = argv.join(' ');
  const declaredCommand = stage.commands.find((candidate) => sameCommand(candidate.argv, argv));
  const expectedCommand = stage.goal.commandSequence[state.completedCommandCount];

  if (!declaredCommand || !expectedCommand || !sameCommand(expectedCommand, argv)) {
    const lines = declaredCommand
      ? ['操作の順番が違います。ヒントを確認して、次の操作を組み立てましょう。']
      : ['そのトークンの組み合わせでは実行できません。並びを確認してもう一度試しましょう。'];
    return {
      ...state,
      history: [...state.history, { command: commandText, lines, isError: true }],
    };
  }

  const completedCommandCount = state.completedCommandCount + 1;
  return {
    cwd: declaredCommand.nextCwd ? [...declaredCommand.nextCwd] : state.cwd,
    completedCommandCount,
    history: [
      ...state.history,
      { command: commandText, lines: [...declaredCommand.output], isError: false },
    ],
    isComplete: completedCommandCount === stage.goal.commandSequence.length,
  };
}

export function absoluteTerminalPath(rootName: string, cwd: readonly string[]): string {
  return `/${[rootName, ...cwd].join('/')}`;
}

function sameCommand(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((part, index) => part === right[index]);
}
