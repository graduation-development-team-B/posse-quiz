import {
  ALLOWED_QUESTION_FORMATS,
  BUG_DIAGNOSIS_MAX_LINES,
  CHOICE_OPTIONS_COUNT,
  CURRENT_SCHEMA_VERSION,
  EXPLANATION_MAX_LENGTH,
  EXPLANATION_MIN_LENGTH,
  FREE_TEXT_MAX_LENGTH,
  MAX_QUESTIONS_PER_WEEK,
  MIN_COMMON_MISTAKE_QUESTIONS_PER_WEEK,
  MIN_QUESTIONS_PER_WEEK,
  MIN_TERMS_PER_WEEK,
  MIN_TOTAL_TERMS,
  SUPPORTED_WEEK_KEYS,
  TERM_DEFINITION_MAX_LENGTH,
  TERM_DEFINITION_MIN_LENGTH,
  TERM_NAME_MAX_LENGTH,
  TERM_NAME_MIN_LENGTH,
  TERM_RELATED_NAMES_MAX,
  TERM_USAGE_EXAMPLE_MAX,
  TRUE_FALSE_OPTIONS_COUNT,
} from '@/lib/constants';
import type {
  ApiResponse,
  ContentCatalog,
  InteractiveActivity,
  QuestionItem,
  QuestionPayload,
  SourceReference,
  TermEntry,
  ValidationIssue,
  WeekUnit,
} from '@/types/content';
import { createValidationIssue, type ValidationEntity, type ValidationEntityType } from './validationIssues';

export type ValidationResult =
  | { ok: true; response: ApiResponse }
  | { ok: false; issues: ValidationIssue[] };

type UnknownRecord = Record<string, unknown>;
type EntityRecord = UnknownRecord & { id?: unknown };

/** API側の教材Markdownを実行時に解析せず、登録済みの実在見出しと照合する。 */
const SOURCE_HEADINGS: Record<string, readonly string[]> = {
  week1: [
    '問題1：映画カードを作る（20分）',
    '問題2：アーティストカードを作る（10分）',
    '問題3：イベント告知カードを作る（10分）',
    '1. Webページが表示されるまでの仕組み',
    '2. HTMLはページの構造を書く言語',
    '3. よく使うHTMLタグ',
    '4. 属性',
    '5. Tailwind CDN で見た目をつける',
    '6. Git・GitHub・GitHub Pages',
  ],
  week3: [
    '1. デフォルトでは要素は縦に積まれる',
    '2. Flexboxの基本：「親」に `flex` をつける',
    '3. justify-content：横方向の並び方を決める',
    '4. align-items：縦方向の揃え方を決める',
    '5. gap：要素と要素の間隔を決める',
    '6. flex-col：縦方向に並べる',
    '7. flex-wrap：はみ出した時に折り返す',
    '8. スマホ幅で縦並びにする（レスポンシブ対応）',
  ],
  week4: [
    '1. GridとFlexの役割の違い',
    '2. Gridの基本クラス',
    '3. col-span で幅を変える',
    '4. レスポンシブGridの書き方',
    '5. hover: で状態に応じたスタイル',
    '6. odd: / even: で行ごとに色を変える',
    '8. よくある間違いと確認ポイント',
  ],
  week5: [
    '1. なぜレスポンシブデザインが必要か',
    '2. Tailwindはモバイルファースト',
    '3. ブレイクポイント接頭辞',
    '4. よく使うレスポンシブパターン',
    '5. DevToolsでレスポンシブを確認する',
    '7. レスポンシブデザインでよくある間違い',
  ],
  week6: [
    '問題1：割り勘計算ツール（20分）',
    '問題2：バグ診断（型変換・文字列と数値）（15分）',
    '問題3：おやつ買い出しメモ（過去復習）（25分）',
    '1. HTML・CSS・JavaScriptの役割分担',
    '2. console.log で確認する習慣',
    '3. 変数：値に名前をつける',
    '4. データ型：値の種類',
    '5. 条件分岐：if / else',
    '6. 関数：処理をまとめて名前をつける',
    '9. よくある間違いと確認ポイント',
  ],
  git_github_level1: [
    '2. ターミナルの基本',
    '4. Git、GitHub 基礎知識',
    '5. Git を使ってみよう',
    '6. GitHub で Pull Request (PR) を使ってコードを反映してみよう',
    '7. 反映されたか確認してみよう',
  ],
};

const SUPPORTED_WEEK_SET = new Set<string>(SUPPORTED_WEEK_KEYS);
const QUESTION_FORMAT_SET = new Set<string>(ALLOWED_QUESTION_FORMATS);
const TRUE_FALSE_OPTIONS = [
  { id: 'true', text: '正しい' },
  { id: 'false', text: '誤り' },
] as const;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const compactLength = (value: string): number => value.replace(/\s/g, '').length;
const characterLength = (value: string): number => [...value].length;
const isInteger = (value: unknown): value is number => Number.isInteger(value);
const isActive = (value: UnknownRecord): boolean =>
  value.published === true && value.deleted === false;

function entityOf(type: ValidationEntityType, value: EntityRecord): ValidationEntity {
  return {
    entityType: type,
    entityId: typeof value.id === 'string' && value.id.trim() ? value.id : undefined,
  };
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  message: string,
  entity?: ValidationEntity,
): void {
  issues.push(createValidationIssue(code, message, entity));
}

function validatePublicationFields(
  value: EntityRecord,
  type: ValidationEntityType,
  issues: ValidationIssue[],
): void {
  const entity = entityOf(type, value);
  if (!isNonEmptyString(value.id)) {
    addIssue(issues, 'entity.id.required', 'stable IDは空でない文字列である必要があります', entity);
  }
  if (typeof value.published !== 'boolean' || typeof value.deleted !== 'boolean') {
    addIssue(
      issues,
      'entity.publication.invalid',
      'publishedとdeletedはbooleanで指定する必要があります',
      entity,
    );
  }
}

function validateWeekShape(value: EntityRecord, issues: ValidationIssue[]): void {
  const entity = entityOf('weekUnit', value);
  if (!isNonEmptyString(value.key)) addIssue(issues, 'week.key.invalid', 'Week_Unitのkeyは空でない文字列が必要です', entity);
  if (!isInteger(value.order) || value.order < 1) addIssue(issues, 'week.order.invalid', 'Week_Unitのorderは正の整数が必要です', entity);
  if (!isNonEmptyString(value.title)) addIssue(issues, 'week.title.invalid', 'Week_Unitのtitleは空でない文字列が必要です', entity);
}

function validateQuestionShape(value: EntityRecord, issues: ValidationIssue[]): void {
  const entity = entityOf('question', value);
  if (!isNonEmptyString(value.weekUnitId)) addIssue(issues, 'question.week.required', 'Question_ItemのweekUnitIdが必要です', entity);
  if (!isNonEmptyString(value.prompt)) addIssue(issues, 'question.prompt.invalid', '問題文は空でない文字列が必要です', entity);
  if (!isNonEmptyString(value.explanation)) addIssue(issues, 'question.explanation.required', '解説文が必要です', entity);
  if (!isRecord(value.payload)) addIssue(issues, 'question.payload.invalid', 'Question_Itemのpayloadはオブジェクトが必要です', entity);
  if (!isNonEmptyString(value.format)) addIssue(issues, 'question.format.required', 'Question_Itemのformatが必要です', entity);
}

function validateTermShape(value: EntityRecord, issues: ValidationIssue[]): void {
  const entity = entityOf('term', value);
  if (!isNonEmptyString(value.weekUnitId)) addIssue(issues, 'term.week.required', 'Term_EntryのweekUnitIdが必要です', entity);
  if (!isNonEmptyString(value.name)) addIssue(issues, 'term.name.required', 'Term名が必要です', entity);
  if (!isNonEmptyString(value.definition)) addIssue(issues, 'term.definition.required', 'Termの意味の説明が必要です', entity);
  if (!Array.isArray(value.usageExamples)) addIssue(issues, 'term.usage.invalid', 'Termの使用例は配列が必要です', entity);
  if (!isRecord(value.sourceReference)) addIssue(issues, 'term.source.invalid', 'TermのSource_Referenceが必要です', entity);
  if (!Array.isArray(value.relatedTermNames)) addIssue(issues, 'term.related.invalid', '関連用語名は配列が必要です', entity);
}

const TERMINAL_TOKEN_KINDS = new Set(['command', 'argument', 'path', 'value', 'control']);
const commandKey = (argv: readonly string[]): string => JSON.stringify(argv);

function findDirectory(root: UnknownRecord, path: readonly string[]): UnknownRecord | undefined {
  let current = root;
  for (const segment of path) {
    if (current.type !== 'dir' || !Array.isArray(current.children)) return undefined;
    const child = current.children.find((candidate) =>
      isRecord(candidate) && candidate.type === 'dir' && candidate.name === segment,
    );
    if (!isRecord(child)) return undefined;
    current = child;
  }
  return current.type === 'dir' ? current : undefined;
}

function validateFileNode(
  value: unknown,
  entity: ValidationEntity,
  issues: ValidationIssue[],
): void {
  if (!isRecord(value) || !isNonEmptyString(value.name) || (value.type !== 'dir' && value.type !== 'file')) {
    addIssue(issues, 'activity.root.invalid', '仮想ファイルはnameとdir/file種別が必要です', entity);
    return;
  }
  if (value.type === 'file') {
    if (typeof value.content !== 'string') addIssue(issues, 'activity.file.content.invalid', '仮想ファイルのcontentは文字列が必要です', entity);
    return;
  }
  if (!Array.isArray(value.children)) {
    addIssue(issues, 'activity.directory.children.invalid', '仮想ディレクトリのchildrenは配列が必要です', entity);
    return;
  }
  const names = value.children.filter(isRecord).map((child) => child.name);
  if (names.some((name) => !isNonEmptyString(name)) || new Set(names).size !== names.length) {
    addIssue(issues, 'activity.directory.children.duplicate', '同一ディレクトリ内の名前は空でなく一意である必要があります', entity);
  }
  value.children.forEach((child) => validateFileNode(child, entity, issues));
}

function validateActivityShape(value: EntityRecord, issues: ValidationIssue[]): void {
  const entity = entityOf('activity', value);
  if (value.type !== 'terminalToken') addIssue(issues, 'activity.type.unsupported', 'ActivityのtypeはterminalTokenである必要があります', entity);
  if (!isNonEmptyString(value.title)) addIssue(issues, 'activity.title.required', 'Activityのtitleが必要です', entity);
  validateFileNode(value.root, entity, issues);
  if (!Array.isArray(value.stages) || value.stages.length === 0) {
    addIssue(issues, 'activity.stages.required', 'Activityには1件以上のstageが必要です', entity);
    return;
  }

  const stages = value.stages.filter(isRecord);
  if (stages.length !== value.stages.length) addIssue(issues, 'activity.stage.shape', 'stageはオブジェクトである必要があります', entity);
  const stageIds = stages.map((stage) => stage.id);
  if (stageIds.some((id) => !isNonEmptyString(id)) || new Set(stageIds).size !== stageIds.length) {
    addIssue(issues, 'activity.stage.id.unique', 'Activity内のstage IDは空でなく一意である必要があります', entity);
  }

  for (const stage of stages) {
    if (!isNonEmptyString(stage.mission) || !isNonEmptyString(stage.hint) || !isNonEmptyString(stage.successMessage)) {
      addIssue(issues, 'activity.stage.copy.required', 'stageのmission、hint、successMessageが必要です', entity);
    }
    if (stage.inputMode !== 'terminal' && stage.inputMode !== 'pullRequest') {
      addIssue(issues, 'activity.stage.inputMode.invalid', 'stageのinputModeが不正です', entity);
    }
    if (!Array.isArray(stage.startCwd) || stage.startCwd.some((segment) => !isNonEmptyString(segment))) {
      addIssue(issues, 'activity.stage.cwd.invalid', 'stageのstartCwdは空でないパス要素の配列である必要があります', entity);
    } else if (isRecord(value.root) && !findDirectory(value.root, stage.startCwd as string[])) {
      addIssue(issues, 'activity.stage.cwd.missing', 'stageのstartCwdは仮想ファイルシステム内のディレクトリを参照する必要があります', entity);
    }

    if (!Array.isArray(stage.tokens) || stage.tokens.length === 0 || !stage.tokens.every(isRecord)) {
      addIssue(issues, 'activity.stage.tokens.invalid', 'stageには1件以上のtokenが必要です', entity);
      continue;
    }
    const tokens = stage.tokens as UnknownRecord[];
    const tokenIds = tokens.map((token) => token.id);
    const tokenLabels = tokens.map((token) => token.label);
    if (
      tokenIds.some((id) => !isNonEmptyString(id)) ||
      tokenLabels.some((label) => !isNonEmptyString(label)) ||
      new Set(tokenIds).size !== tokenIds.length ||
      new Set(tokenLabels).size !== tokenLabels.length ||
      tokens.some((token) => typeof token.kind !== 'string' || !TERMINAL_TOKEN_KINDS.has(token.kind))
    ) {
      addIssue(issues, 'activity.stage.tokens.unique', 'tokenのIDとlabelは空でなく一意で、kindは許可値である必要があります', entity);
    }

    if (!Array.isArray(stage.commands) || stage.commands.length === 0 || !stage.commands.every(isRecord)) {
      addIssue(issues, 'activity.stage.commands.invalid', 'stageには1件以上の宣言的commandが必要です', entity);
      continue;
    }
    const commandKeys: string[] = [];
    for (const command of stage.commands as UnknownRecord[]) {
      if (!Array.isArray(command.argv) || command.argv.length === 0 || command.argv.some((part) => !isNonEmptyString(part))) {
        addIssue(issues, 'activity.command.argv.invalid', 'commandのargvは空でない文字列配列である必要があります', entity);
        continue;
      }
      commandKeys.push(commandKey(command.argv as string[]));
      if ((command.argv as string[]).some((part) => !tokenLabels.includes(part))) {
        addIssue(issues, 'activity.command.token.missing', 'commandの各要素はstageのtoken labelを参照する必要があります', entity);
      }
      if (!Array.isArray(command.output) || command.output.some((line) => typeof line !== 'string')) {
        addIssue(issues, 'activity.command.output.invalid', 'commandのoutputは文字列配列である必要があります', entity);
      }
      if (command.nextCwd !== undefined) {
        if (!Array.isArray(command.nextCwd) || command.nextCwd.some((segment) => !isNonEmptyString(segment)) || !isRecord(value.root) || !findDirectory(value.root, command.nextCwd as string[])) {
          addIssue(issues, 'activity.command.cwd.invalid', 'commandのnextCwdは仮想ファイルシステム内のディレクトリを参照する必要があります', entity);
        }
      }
    }
    if (new Set(commandKeys).size !== commandKeys.length) addIssue(issues, 'activity.command.duplicate', 'stage内のcommand argvは一意である必要があります', entity);

    if (!isRecord(stage.goal) || !Array.isArray(stage.goal.commandSequence) || stage.goal.commandSequence.length === 0) {
      addIssue(issues, 'activity.goal.required', 'stageのgoalには1件以上のcommandSequenceが必要です', entity);
      continue;
    }
    for (const goalCommand of stage.goal.commandSequence) {
      if (!Array.isArray(goalCommand) || goalCommand.length === 0 || goalCommand.some((part) => !isNonEmptyString(part)) || !commandKeys.includes(commandKey(goalCommand as string[]))) {
        addIssue(issues, 'activity.goal.command.invalid', 'goalの各commandはstage.commandsに定義されている必要があります', entity);
      }
    }
  }
}

function validateSourceReference(
  value: unknown,
  weekKey: string,
  entity: ValidationEntity,
  issues: ValidationIssue[],
): void {
  if (!isRecord(value)) {
    addIssue(issues, 'sourceReference.required', 'Source_Referenceは必須のオブジェクトです', entity);
    return;
  }
  if (value.weekKey !== weekKey) {
    addIssue(issues, 'sourceReference.week.mismatch', 'Source_ReferenceのweekKeyは所属週と一致する必要があります', entity);
  }
  if (!isNonEmptyString(value.sectionHeading)) {
    addIssue(issues, 'sourceReference.heading.required', 'Source_ReferenceのsectionHeadingが必要です', entity);
    return;
  }
  const knownHeadings = SOURCE_HEADINGS[weekKey];
  if (knownHeadings && !knownHeadings.includes(value.sectionHeading)) {
    addIssue(issues, 'sourceReference.heading.unknown', 'Source_ReferenceのsectionHeadingは教材に実在する見出しである必要があります', entity);
  }
}

function validateOptions(
  payload: UnknownRecord,
  expectedCount: number,
  entity: ValidationEntity,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(payload.options) || payload.options.length !== expectedCount) {
    addIssue(issues, 'payload.options.count', `選択肢は${expectedCount}件必要です`, entity);
    return;
  }

  const options = payload.options;
  const validOptions = options.every(isRecord);
  if (!validOptions) {
    addIssue(issues, 'payload.options.shape', '選択肢はidとtextを持つオブジェクトである必要があります', entity);
    return;
  }

  const typedOptions = options as UnknownRecord[];
  const ids = typedOptions.map((option) => option.id);
  const texts = typedOptions.map((option) => option.text);
  if (
    ids.some((id) => !isNonEmptyString(id)) ||
    texts.some((text) => !isNonEmptyString(text)) ||
    new Set(ids).size !== ids.length ||
    new Set(texts).size !== texts.length
  ) {
    addIssue(issues, 'payload.options.unique', '選択肢のIDと表示文字列は相互に重複せず空でない必要があります', entity);
  }

  const correctOptionId = payload.correctOptionId;
  const correctCount = typedOptions.filter((option) => option.id === correctOptionId).length;
  if (!isNonEmptyString(correctOptionId) || correctCount !== 1) {
    addIssue(issues, 'payload.correctOption.count', '正解選択肢は1件だけ指定する必要があります', entity);
  }

  if (payload.incorrectReasons !== undefined) {
    if (!isRecord(payload.incorrectReasons)) {
      addIssue(issues, 'payload.incorrectReasons.invalid', '誤り理由はオブジェクトで指定する必要があります', entity);
    } else {
      for (const option of typedOptions) {
        if (option.id !== correctOptionId && !isNonEmptyString(payload.incorrectReasons[option.id as string])) {
          addIssue(issues, 'payload.incorrectReason.missing', '誤答選択肢には誤り理由が必要です', entity);
        }
      }
    }
  }
}

function validateQuestionPayload(
  value: EntityRecord,
  entity: ValidationEntity,
  issues: ValidationIssue[],
): void {
  if (!isRecord(value.payload) || !isNonEmptyString(value.format)) return;
  const payload = value.payload;
  const format = value.format;
  if (!QUESTION_FORMAT_SET.has(format)) {
    addIssue(issues, 'question.format.unsupported', 'Question_Formatは許可された形式のいずれかである必要があります', entity);
    return;
  }

  if (format === 'interactive') {
    if (
      payload.kind !== 'activityRef' ||
      payload.activityType !== 'terminalToken' ||
      !isNonEmptyString(payload.activityId) ||
      !isNonEmptyString(payload.stageId)
    ) {
      addIssue(issues, 'payload.activityRef.invalid', 'interactive payloadにはterminalTokenのactivityIdとstageIdが必要です', entity);
    }
    return;
  }

  const expectedKind = format === 'singleChoice' ? 'choice' : format;
  if (payload.kind !== expectedKind) {
    addIssue(issues, 'payload.kind.mismatch', 'formatとpayload.kindは一致する必要があります', entity);
    return;
  }

  if (format === 'singleChoice') {
    validateOptions(payload, CHOICE_OPTIONS_COUNT, entity, issues);
    return;
  }

  if (format === 'trueFalse') {
    validateOptions(payload, TRUE_FALSE_OPTIONS_COUNT, entity, issues);
    if (
      !Array.isArray(payload.options) ||
      payload.options.length !== TRUE_FALSE_OPTIONS_COUNT ||
      JSON.stringify(payload.options) !== JSON.stringify(TRUE_FALSE_OPTIONS)
    ) {
      addIssue(issues, 'payload.trueFalse.order', '正誤選択肢は「正しい」「誤り」の順である必要があります', entity);
    }
    return;
  }

  if (format === 'bugDiagnosis') {
    validateOptions(payload, CHOICE_OPTIONS_COUNT, entity, issues);
    if (!isNonEmptyString(payload.code)) {
      addIssue(issues, 'payload.bug.code.required', 'バグ診断コードが必要です', entity);
    } else {
      const lineCount = payload.code.split('\n').length;
      if (lineCount < 1 || lineCount > BUG_DIAGNOSIS_MAX_LINES) {
        addIssue(issues, 'payload.bug.code.lines', 'バグ診断コードは1〜20行である必要があります', entity);
      }
    }
    return;
  }

  if (!isNonEmptyString(payload.content) || !isNonEmptyString(payload.blankToken)) {
    addIssue(issues, 'payload.fillBlank.content', '穴埋めcontentとblankTokenは空でない文字列が必要です', entity);
  } else if (payload.content.split(payload.blankToken).length - 1 !== 1) {
    addIssue(issues, 'payload.fillBlank.blank.count', '穴埋めcontentはblankTokenを1件だけ含む必要があります', entity);
  }

  if (payload.mode === 'choice') {
    validateOptions(payload, CHOICE_OPTIONS_COUNT, entity, issues);
  } else if (payload.mode === 'freeText') {
    if (!isNonEmptyString(payload.correctText) || payload.maxInputLength !== FREE_TEXT_MAX_LENGTH) {
      addIssue(issues, 'payload.fillBlank.freeText', '自由入力穴埋めは正解文字列と最大64文字の制約が必要です', entity);
    } else if (characterLength(payload.correctText) > FREE_TEXT_MAX_LENGTH) {
      addIssue(issues, 'payload.fillBlank.correctText.length', '自由入力穴埋めの正解文字列は64文字以下である必要があります', entity);
    }
  } else {
    addIssue(issues, 'payload.fillBlank.mode', '穴埋めのmodeはchoiceまたはfreeTextである必要があります', entity);
  }
}

function validateActiveQuestion(
  value: EntityRecord,
  weekKey: string,
  issues: ValidationIssue[],
): void {
  const entity = entityOf('question', value);
  if (
    !isNonEmptyString(value.explanation) ||
    compactLength(value.explanation) < EXPLANATION_MIN_LENGTH ||
    compactLength(value.explanation) > EXPLANATION_MAX_LENGTH
  ) {
    addIssue(issues, 'question.explanation.length', '解説は空白を除いて20〜400文字である必要があります', entity);
  }
  validateSourceReference(value.sourceReference, weekKey, entity, issues);
  validateQuestionPayload(value, entity, issues);
  if (value.preview !== undefined && value.console !== undefined) addIssue(issues, 'question.drill.ambiguous', '1問に複数の実行形式は指定できません', entity);
  for (const kind of ['preview', 'console'] as const) {
    if (value[kind] === undefined) continue;
    const p = value[kind];
    if (!isRecord(p) || !isNonEmptyString(p.drillId) || !isNonEmptyString(p.title) || !isNonEmptyString(p.hint) || !isNonEmptyString(p.goalCode)
      || !Number.isInteger(p.version) || Number(p.version) < 1
      || !Number.isInteger(p.step) || !Number.isInteger(p.total) || Number(p.step) < 1 || Number(p.step) > Number(p.total)
      || value.format !== 'fillBlank' || !isRecord(value.payload) || value.payload.mode !== 'choice') {
      addIssue(issues, `question.${kind}.invalid`, 'ドリルの版・順序・見本・候補選択ペイロードが必要です', entity);
    }
    if (kind === 'console' && (!isRecord(p) || !Array.isArray(p.expectedOutput) || p.expectedOutput.length === 0 || p.expectedOutput.length > 60 || p.expectedOutput.some(line => typeof line !== 'string' || line.length > 2000))) addIssue(issues, 'question.console.output', '期待する出力は1〜60行の文字列で定義してください', entity);
  }
}

function validateActiveTerm(
  value: EntityRecord,
  weekKey: string,
  issues: ValidationIssue[],
): void {
  const entity = entityOf('term', value);
  if (!isNonEmptyString(value.name) || characterLength(value.name) < TERM_NAME_MIN_LENGTH || characterLength(value.name) > TERM_NAME_MAX_LENGTH) {
    addIssue(issues, 'term.name.length', 'Term名は1〜40文字である必要があります', entity);
  }
  if (
    !isNonEmptyString(value.definition) ||
    compactLength(value.definition) < TERM_DEFINITION_MIN_LENGTH ||
    compactLength(value.definition) > TERM_DEFINITION_MAX_LENGTH
  ) {
    addIssue(issues, 'term.definition.length', 'Termの説明は空白を除いて20〜200文字である必要があります', entity);
  }
  if (
    !Array.isArray(value.usageExamples) ||
    value.usageExamples.length < 1 ||
    value.usageExamples.length > TERM_USAGE_EXAMPLE_MAX ||
    value.usageExamples.some((example) => !isNonEmptyString(example))
  ) {
    addIssue(issues, 'term.usage.count', 'Termの使用例は1〜3件の空でない文字列である必要があります', entity);
  }
  if (
    !Array.isArray(value.relatedTermNames) ||
    value.relatedTermNames.length > TERM_RELATED_NAMES_MAX ||
    value.relatedTermNames.some((name) => !isNonEmptyString(name))
  ) {
    addIssue(issues, 'term.related.count', '関連用語名は0〜5件の空でない文字列である必要があります', entity);
  }
  validateSourceReference(value.sourceReference, weekKey, entity, issues);
}

function clonePayload(payload: UnknownRecord): QuestionPayload {
  const result: UnknownRecord = { ...payload };
  if (Array.isArray(payload.options)) {
    result.options = payload.options.map((option) => (isRecord(option) ? { ...option } : option));
  }
  if (isRecord(payload.incorrectReasons)) result.incorrectReasons = { ...payload.incorrectReasons };
  return result as unknown as QuestionPayload;
}

function normalizeCatalog(
  weekUnits: EntityRecord[],
  questions: EntityRecord[],
  terms: EntityRecord[],
  activities: EntityRecord[],
): ContentCatalog {
  return {
    weekUnits: weekUnits.filter(isActive).map((week) => ({ ...week } as unknown as WeekUnit)),
    questions: questions.filter(isActive).map((question) => ({
      ...question,
      payload: clonePayload(question.payload as UnknownRecord),
      ...(isRecord(question.preview) ? { preview: { ...question.preview } } : {}),
      ...(isRecord(question.console) ? { console: { ...question.console, expectedOutput: [...question.console.expectedOutput as string[]] } } : {}),
      sourceReference: { ...(question.sourceReference as UnknownRecord) },
    } as unknown as QuestionItem)),
    terms: terms.filter(isActive).map((term) => ({
      ...term,
      usageExamples: [...(term.usageExamples as string[])],
      relatedTermNames: [...(term.relatedTermNames as string[])],
      sourceReference: { ...(term.sourceReference as UnknownRecord) } as unknown as SourceReference,
    } as TermEntry)),
    activities: activities
      .filter(isActive)
      .map((activity) => JSON.parse(JSON.stringify(activity)) as InteractiveActivity),
  };
}

/**
 * API_Responseを利用前に全体検証する。
 * 1件でも違反があれば部分的なcatalogを返さず、問題ID付きissuesだけを返す。
 */
export function validateApiResponse(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    addIssue(issues, 'response.shape', 'API_Responseはオブジェクトである必要があります');
    return { ok: false, issues };
  }

  if (input.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    addIssue(issues, 'response.schemaVersion', `schemaVersionは${CURRENT_SCHEMA_VERSION}である必要があります`);
  }
  if (!isNonEmptyString(input.contentVersion)) {
    addIssue(issues, 'response.contentVersion', 'contentVersionは空でない文字列が必要です');
  }
  if (
    !isNonEmptyString(input.updatedAt) ||
    !input.updatedAt.includes('T') ||
    Number.isNaN(Date.parse(input.updatedAt))
  ) {
    addIssue(issues, 'response.updatedAt', 'updatedAtは有効なISO 8601日時文字列が必要です');
  }

  if (!isRecord(input.catalog)) {
    addIssue(issues, 'catalog.shape', 'catalogはオブジェクトである必要があります');
    return { ok: false, issues };
  }
  const rawCatalog = input.catalog;
  const collectionNames = ['weekUnits', 'questions', 'terms', 'activities'] as const;
  if (collectionNames.some((name) => !Array.isArray(rawCatalog[name]))) {
    addIssue(issues, 'catalog.collections', 'catalogはweekUnits/questions/terms/activitiesの配列をすべて含む必要があります');
    return { ok: false, issues };
  }

  const weekUnits = rawCatalog.weekUnits as unknown[];
  const questions = rawCatalog.questions as unknown[];
  const terms = rawCatalog.terms as unknown[];
  const activities = rawCatalog.activities as unknown[];
  const entityCollections: [ValidationEntityType, unknown[]][] = [
    ['weekUnit', weekUnits],
    ['question', questions],
    ['term', terms],
    ['activity', activities],
  ];
  const entityRecords = new Map<ValidationEntityType, EntityRecord[]>();

  for (const [type, values] of entityCollections) {
    const records: EntityRecord[] = [];
    for (const value of values) {
      if (!isRecord(value)) {
        addIssue(issues, `${type}.shape`, `${type}はオブジェクトである必要があります`);
        continue;
      }
      records.push(value);
      validatePublicationFields(value, type, issues);
      if (isActive(value)) {
        if (type === 'weekUnit') validateWeekShape(value, issues);
        if (type === 'question') validateQuestionShape(value, issues);
        if (type === 'term') validateTermShape(value, issues);
        if (type === 'activity') validateActivityShape(value, issues);
      }
    }
    entityRecords.set(type, records);
  }

  const allRecords = entityCollections.flatMap(([type, values]) =>
    values.filter(isRecord).map((value) => ({ type, value })),
  );
  const ids = new Map<string, { type: ValidationEntityType; value: EntityRecord }[]>();
  for (const { type, value } of allRecords) {
    if (!isNonEmptyString(value.id)) continue;
    const entries = ids.get(value.id) ?? [];
    entries.push({ type, value });
    ids.set(value.id, entries);
  }
  for (const [id, entries] of ids) {
    if (entries.length > 1) {
      for (const entry of entries) {
        addIssue(issues, 'entity.id.duplicate', `stable ID「${id}」はContent_Catalog全体で一意である必要があります`, entityOf(entry.type, entry.value));
      }
    }
  }

  const weekRecords = entityRecords.get('weekUnit') ?? [];
  const questionRecords = entityRecords.get('question') ?? [];
  const termRecords = entityRecords.get('term') ?? [];
  const activityRecords = entityRecords.get('activity') ?? [];
  const weeksById = new Map<string, EntityRecord>();
  for (const week of weekRecords) if (isNonEmptyString(week.id)) weeksById.set(week.id, week);

  const activeWeeks = weekRecords.filter(isActive);
  const activeQuestions = questionRecords.filter(isActive);
  const activeTerms = termRecords.filter(isActive);
  const activitiesById = new Map<string, EntityRecord>();
  for (const activity of activityRecords) if (isNonEmptyString(activity.id)) activitiesById.set(activity.id, activity);
  const activeWeekKeys = new Map<string, EntityRecord[]>();
  for (const week of activeWeeks) {
    if (typeof week.key !== 'string') continue;
    const entries = activeWeekKeys.get(week.key) ?? [];
    entries.push(week);
    activeWeekKeys.set(week.key, entries);
  }
  for (const [key, entries] of activeWeekKeys) {
    if (entries.length > 1) {
      for (const entry of entries) {
        addIssue(issues, 'week.key.duplicate', `active Week_Unitのkey「${key}」は一意である必要があります`, entityOf('weekUnit', entry));
      }
    }
  }

  for (const question of activeQuestions) {
    const entity = entityOf('question', question);
    const week = typeof question.weekUnitId === 'string' ? weeksById.get(question.weekUnitId) : undefined;
    if (!week) addIssue(issues, 'question.week.reference', 'active Question_Itemは存在するWeek_Unitを参照する必要があります', entity);
    else if (!isActive(week)) addIssue(issues, 'question.week.inactive', 'active Question_Itemは公開中かつ未削除のWeek_Unitを参照する必要があります', entity);
    if (typeof week?.key === 'string') validateActiveQuestion(question, week.key, issues);

    if (question.format === 'interactive' && isRecord(question.payload)) {
      const payload = question.payload;
      const activity = typeof payload.activityId === 'string' ? activitiesById.get(payload.activityId) : undefined;
      if (!activity) addIssue(issues, 'question.activity.reference', 'interactive Question_Itemは存在するActivityを参照する必要があります', entity);
      else if (!isActive(activity)) addIssue(issues, 'question.activity.inactive', 'interactive Question_Itemは公開中かつ未削除のActivityを参照する必要があります', entity);
      else if (activity.type !== payload.activityType) addIssue(issues, 'question.activity.type.mismatch', 'payloadのactivityTypeは参照先Activityと一致する必要があります', entity);
      else if (!Array.isArray(activity.stages) || !activity.stages.some((stage) => isRecord(stage) && stage.id === payload.stageId)) {
        addIssue(issues, 'question.activity.stage.reference', 'interactive Question_Itemは参照先Activityに存在するstageを指定する必要があります', entity);
      }
    }
  }

  const stageReferences = new Map<string, EntityRecord[]>();
  for (const question of activeQuestions) {
    if (question.format !== 'interactive' || !isRecord(question.payload) || !isNonEmptyString(question.payload.activityId) || !isNonEmptyString(question.payload.stageId)) continue;
    const key = `${question.payload.activityId}:${question.payload.stageId}`;
    const entries = stageReferences.get(key) ?? [];
    entries.push(question);
    stageReferences.set(key, entries);
  }
  for (const [key, entries] of stageReferences) {
    if (entries.length > 1) entries.forEach((question) => addIssue(issues, 'question.activity.stage.duplicate', `Activity stage「${key}」は1問だけから参照する必要があります`, entityOf('question', question)));
  }

  for (const term of activeTerms) {
    const entity = entityOf('term', term);
    const week = typeof term.weekUnitId === 'string' ? weeksById.get(term.weekUnitId) : undefined;
    if (!week) addIssue(issues, 'term.week.reference', 'active Term_Entryは存在するWeek_Unitを参照する必要があります', entity);
    else if (!isActive(week)) addIssue(issues, 'term.week.inactive', 'active Term_Entryは公開中かつ未削除のWeek_Unitを参照する必要があります', entity);
    if (typeof week?.key === 'string') validateActiveTerm(term, week.key, issues);
  }

  for (const weekKey of SUPPORTED_WEEK_KEYS) {
    const week = activeWeeks.find((value) => value.key === weekKey);
    const entity = week ? entityOf('weekUnit', week) : { entityType: 'weekUnit' as const };
    if (!week) {
      addIssue(issues, 'week.required', `${weekKey}のactiveなWeek_Unitが必要です`, entity);
      continue;
    }

    const linkedQuestions = activeQuestions.filter(
      (question) => question.weekUnitId === week.id,
    );
    const linkedTerms = activeTerms.filter((term) => term.weekUnitId === week.id);
    if (linkedQuestions.length < MIN_QUESTIONS_PER_WEEK || linkedQuestions.length > MAX_QUESTIONS_PER_WEEK) {
      addIssue(issues, 'week.question.count', `各教材単位のactive Question_Item数は${MIN_QUESTIONS_PER_WEEK}〜${MAX_QUESTIONS_PER_WEEK}件である必要があります`, entity);
    }
    if (linkedTerms.length < MIN_TERMS_PER_WEEK) {
      addIssue(issues, 'week.term.count', '各Week_Unitのactive Term_Entry数は5件以上である必要があります', entity);
    }

    const bugQuestions = linkedQuestions.filter((question) => question.format === 'bugDiagnosis');
    const fillBlankQuestions = linkedQuestions.filter((question) => question.format === 'fillBlank');
    const interactiveOnly = linkedQuestions.length > 0 && linkedQuestions.every((question) => question.format === 'interactive' || isRecord(question.preview));
    if (!interactiveOnly && bugQuestions.length < 1) addIssue(issues, 'week.bugDiagnosis.required', '各週にバグ診断問題が1件以上必要です', entity);
    if (!interactiveOnly && fillBlankQuestions.length < 1) addIssue(issues, 'week.fillBlank.required', '各週に穴埋め問題が1件以上必要です', entity);

    const commonMistakeSectionExists = (SOURCE_HEADINGS[weekKey] ?? []).some((heading) => heading.includes('よくある間違い'));
    const commonMistakeQuestions = linkedQuestions.filter((question) =>
      isRecord(question.sourceReference) &&
      typeof question.sourceReference.sectionHeading === 'string' &&
      question.sourceReference.sectionHeading.includes('よくある間違い'),
    );
    const requiredMistakeCount = commonMistakeSectionExists ? commonMistakeQuestions.length : bugQuestions.length;
    if (!interactiveOnly && requiredMistakeCount < MIN_COMMON_MISTAKE_QUESTIONS_PER_WEEK) {
      addIssue(
        issues,
        'week.commonMistake.count',
        commonMistakeSectionExists
          ? '「よくある間違い」を扱うQuestion_Itemが2件以上必要です'
          : '「よくある間違い」節がない週はバグ診断問題が2件以上必要です',
        entity,
      );
    }

    for (const term of linkedTerms) {
      if (term.weekUnitId !== week.id) addIssue(issues, 'term.week.mismatch', 'Term_Entryの所属週が不正です', entityOf('term', term));
    }
  }

  for (const kind of ['preview', 'console'] as const) {
  const drillGroups = new Map<string, EntityRecord[]>();
  for (const question of activeQuestions) {
    const metadata = question[kind];
    if (!isRecord(metadata) || !isNonEmptyString(metadata.drillId)) continue;
    const id = metadata.drillId;
    drillGroups.set(id, [...(drillGroups.get(id) ?? []), question]);
  }
  for (const group of drillGroups.values()) {
    const ordered = [...group].sort((a, b) => Number((a[kind] as UnknownRecord).step) - Number((b[kind] as UnknownRecord).step));
    const first = ordered[0][kind] as UnknownRecord;
    if (ordered.some((q, index) => {
      const p = q[kind] as UnknownRecord;
      return p.step !== index + 1 || p.total !== ordered.length || p.version !== first.version || p.title !== first.title || p.goalCode !== first.goalCode || q.weekUnitId !== ordered[0].weekUnitId;
    })) addIssue(issues, `question.${kind}.sequence`, '同じドリルのステップは1から欠番なく、同じ版・見本で定義してください', entityOf('question', ordered[0]));
  }
  }

  const supportedTermCount = activeTerms.filter((term) => {
    const week = weeksById.get(String(term.weekUnitId));
    return week !== undefined && isActive(week) && SUPPORTED_WEEK_SET.has(String(week.key));
  }).length;
  if (supportedTermCount < MIN_TOTAL_TERMS) addIssue(issues, 'term.total.count', '対応教材のactive Term_Entryは合計30件以上必要です');

  if (issues.length > 0) return { ok: false, issues };

  const normalized = normalizeCatalog(weekRecords, questionRecords, termRecords, activityRecords);
  return {
    ok: true,
    response: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      contentVersion: input.contentVersion as string,
      updatedAt: input.updatedAt as string,
      catalog: normalized,
    },
  };
}
