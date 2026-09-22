#!/usr/bin/env node

/**
 * Validate the checked-in demo Content_API catalog without parsing curriculum Markdown.
 * Run with: node scripts/validate-fixture.js
 */

const fs = require('fs');
const path = require('path');

const fixturePath = path.resolve(__dirname, '..', 'mock-api', 'catalog.json');
const supportedWeeks = ['week1', 'week3', 'week4', 'week5', 'week6', 'git_github_level1'];
const sourceHeadings = {
  week1: [
    '1. Webページが表示されるまでの仕組み', '2. HTMLはページの構造を書く言語',
    '3. よく使うHTMLタグ', '4. 属性', '5. Tailwind CDN で見た目をつける', '6. Git・GitHub・GitHub Pages',
    '問題1：映画カードを作る（20分）', '問題2：アーティストカードを作る（10分）', '問題3：イベント告知カードを作る（10分）',
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

const issues = [];
const addIssue = (message, entity) => {
  const suffix = entity ? ` [${entity.type}:${entity.id}]` : '';
  issues.push(`${message}${suffix}`);
};
const isActive = (entity) => entity && entity.published === true && entity.deleted === false;
const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const compactLength = (value) => String(value).replace(/\s/g, '').length;
const unique = (values) => new Set(values).size === values.length;

let response;
try {
  response = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
} catch (error) {
  console.error(`カタログJSONを読み込めません: ${error.message}`);
  process.exit(1);
}

if (!response || response.schemaVersion !== 1 || !nonEmptyString(response.contentVersion)) {
  addIssue('schemaVersion=1 と空でない contentVersion が必要です');
}
if (!response || !nonEmptyString(response.updatedAt) || Number.isNaN(Date.parse(response.updatedAt))) {
  addIssue('updatedAt は有効なISO日時文字列である必要があります');
}
const catalog = response && response.catalog;
if (!catalog || !Array.isArray(catalog.weekUnits) || !Array.isArray(catalog.questions) || !Array.isArray(catalog.terms) || !Array.isArray(catalog.activities)) {
  addIssue('catalog は weekUnits/questions/terms/activities の配列をすべて含む必要があります');
  console.error(issues.join('\n'));
  process.exit(1);
}

const allEntities = [
  ...catalog.weekUnits.map((value) => ({ type: 'weekUnit', value })),
  ...catalog.questions.map((value) => ({ type: 'question', value })),
  ...catalog.terms.map((value) => ({ type: 'term', value })),
  ...catalog.activities.map((value) => ({ type: 'activity', value })),
];
const allIds = allEntities.map(({ value }) => value.id);
if (!unique(allIds) || allIds.some((id) => !nonEmptyString(id))) {
  addIssue('active/inactiveを問わず全エンティティのstable IDは空でなく一意である必要があります');
}

if (catalog.weekUnits.length !== supportedWeeks.length || !unique(catalog.weekUnits.map((week) => week.key)) || !supportedWeeks.every((key) => catalog.weekUnits.some((week) => week.key === key))) {
  addIssue(`初期カタログは対応する${supportedWeeks.length}教材単位を含む必要があります`);
}

for (const weekKey of supportedWeeks) {
  const week = catalog.weekUnits.find((value) => value.key === weekKey);
  if (!week || !isActive(week)) {
    addIssue('対象週は公開中かつ未削除である必要があります', { type: 'weekUnit', id: week && week.id });
    continue;
  }
  const questions = catalog.questions.filter((question) => question.weekUnitId === week.id && isActive(question));
  const terms = catalog.terms.filter((term) => term.weekUnitId === week.id && isActive(term));
  if (questions.length < 10 || questions.length > 60) addIssue('Question_Item数は10〜60件である必要があります', { type: 'weekUnit', id: week.id });
  if (terms.length < 5) addIssue('Term_Entry数は5件以上である必要があります', { type: 'weekUnit', id: week.id });

  const formatCounts = { bugDiagnosis: 0, fillBlank: 0 };
  const commonMistakeCount = questions.filter((question) => question.sourceReference.sectionHeading.includes('よくある間違い')).length;
  for (const question of questions) {
    validateQuestion(question, week, weekKey, formatCounts, catalog.activities);
  }
  const interactiveOnly = questions.length > 0 && questions.every((question) => question.format === 'interactive' || question.preview);
  if (!interactiveOnly && commonMistakeCount < 2 && formatCounts.bugDiagnosis < 2) addIssue('「よくある間違い」問題2件、または代替バグ診断2件が必要です', { type: 'weekUnit', id: week.id });
  if (!interactiveOnly && formatCounts.bugDiagnosis < 1) addIssue('各週にバグ診断問題が1件以上必要です', { type: 'weekUnit', id: week.id });
  if (!interactiveOnly && formatCounts.fillBlank < 1) addIssue('各週に穴埋め問題が1件以上必要です', { type: 'weekUnit', id: week.id });
  if (weekKey === 'git_github_level1' && (questions.length !== 10 || !interactiveOnly)) {
    addIssue('Git/GitHub Level 1は10問すべてinteractive形式である必要があります', { type: 'weekUnit', id: week.id });
  }

  for (const term of terms) validateTerm(term, week, weekKey);
}

if (catalog.terms.filter(isActive).length < 30) addIssue('activeなTerm_Entryは合計30件以上必要です');
for (const activity of catalog.activities) validateActivity(activity);

function validateSource(sourceReference, weekKey, entity) {
  if (!sourceReference || sourceReference.weekKey !== weekKey || !nonEmptyString(sourceReference.sectionHeading) || !sourceHeadings[weekKey].includes(sourceReference.sectionHeading)) {
    addIssue('Source_Referenceは所属週と教材に実在するセクション見出しを参照する必要があります', entity);
  }
}

function validateOptions(payload, expectedCount, entity) {
  if (!payload || !Array.isArray(payload.options) || payload.options.length !== expectedCount) {
    addIssue(`選択肢は${expectedCount}件必要です`, entity);
    return;
  }
  if (!unique(payload.options.map((option) => option.id)) || !unique(payload.options.map((option) => option.text)) || payload.options.some((option) => !nonEmptyString(option.id) || !nonEmptyString(option.text))) {
    addIssue('選択肢のIDと表示文字列は相互に重複せず空でない必要があります', entity);
  }
  if (!nonEmptyString(payload.correctOptionId) || payload.options.filter((option) => option.id === payload.correctOptionId).length !== 1) {
    addIssue('正解選択肢は1件だけ指定する必要があります', entity);
  }
  const wrongOptions = payload.options.filter((option) => option.id !== payload.correctOptionId);
  if (payload.incorrectReasons) {
    for (const option of wrongOptions) {
      if (!nonEmptyString(payload.incorrectReasons[option.id])) addIssue('誤答選択肢には誤り理由が必要です', entity);
    }
  }
}

function validateQuestion(question, week, weekKey, formatCounts, activities) {
  const entity = { type: 'question', id: question.id };
  if (!isActive(question) || question.weekUnitId !== week.id) return;
  if (!nonEmptyString(question.prompt) || compactLength(question.explanation) < 20 || compactLength(question.explanation) > 400) addIssue('問題文は空でなく、解説は空白を除いて20〜400文字である必要があります', entity);
  validateSource(question.sourceReference, weekKey, entity);
  if (question.format === 'interactive') {
    const payload = question.payload;
    const activity = payload && activities.find((candidate) => candidate.id === payload.activityId);
    const stage = activity && Array.isArray(activity.stages)
      ? activity.stages.find((candidate) => candidate.id === payload.stageId)
      : undefined;
    if (!payload || payload.kind !== 'activityRef' || payload.activityType !== 'terminalToken' || !activity || !isActive(activity) || activity.type !== payload.activityType || !stage) {
      addIssue('interactive payloadは公開中のterminalToken Activityと実在stageを参照する必要があります', entity);
    }
    return;
  }
  const expectedPayloadKind = question.format === 'singleChoice' ? 'choice' : question.format;
  if (!['singleChoice', 'trueFalse', 'bugDiagnosis', 'fillBlank'].includes(question.format) || !question.payload || question.payload.kind !== expectedPayloadKind) {
    addIssue('formatとpayload.kindは許可された形式の組み合わせで一致する必要があります', entity);
    return;
  }
  if (question.format === 'singleChoice') validateOptions(question.payload, 4, entity);
  if (question.format === 'trueFalse') {
    if (JSON.stringify(question.payload.options) !== JSON.stringify([{ id: 'true', text: '正しい' }, { id: 'false', text: '誤り' }])) addIssue('正誤選択肢は「正しい」「誤り」の順である必要があります', entity);
    validateOptions(question.payload, 2, entity);
  }
  if (question.format === 'bugDiagnosis') {
    formatCounts.bugDiagnosis += 1;
    validateOptions(question.payload, 4, entity);
    const lineCount = question.payload.code.split('\n').length;
    if (!nonEmptyString(question.payload.code) || lineCount < 1 || lineCount > 20) addIssue('バグ診断コードは1〜20行である必要があります', entity);
  }
  if (question.format === 'fillBlank') {
    formatCounts.fillBlank += 1;
    if (!nonEmptyString(question.payload.content) || !nonEmptyString(question.payload.blankToken) || question.payload.content.split(question.payload.blankToken).length - 1 !== 1) addIssue('穴埋めcontentはblankTokenを1件だけ含む必要があります', entity);
    if (question.payload.mode === 'choice') validateOptions(question.payload, 4, entity);
    else if (question.payload.mode !== 'freeText' || !nonEmptyString(question.payload.correctText) || question.payload.maxInputLength !== 64) addIssue('自由入力穴埋めの契約が不正です', entity);
  }
}

function validateActivity(activity) {
  const entity = { type: 'activity', id: activity && activity.id };
  if (!isActive(activity) || activity.type !== 'terminalToken' || !nonEmptyString(activity.title) || !activity.root || !Array.isArray(activity.stages) || activity.stages.length === 0) {
    addIssue('Activityは公開中のterminalToken形式でrootとstageを持つ必要があります', entity);
    return;
  }
  if (!unique(activity.stages.map((stage) => stage.id)) || activity.stages.some((stage) => !nonEmptyString(stage.id))) addIssue('stage IDはActivity内で一意かつ空でない必要があります', entity);
  for (const stage of activity.stages) {
    if (!nonEmptyString(stage.mission) || !nonEmptyString(stage.hint) || !nonEmptyString(stage.successMessage) || !['terminal', 'pullRequest'].includes(stage.inputMode)) addIssue('stageの表示文言とinputModeが不正です', entity);
    if (!Array.isArray(stage.tokens) || stage.tokens.length === 0 || !unique(stage.tokens.map((token) => token.id)) || !unique(stage.tokens.map((token) => token.label))) addIssue('stage tokenのIDとlabelは一意である必要があります', entity);
    const labels = new Set((stage.tokens || []).map((token) => token.label));
    const commands = Array.isArray(stage.commands) ? stage.commands : [];
    const commandKeys = commands.map((command) => JSON.stringify(command.argv));
    if (commands.length === 0 || !unique(commandKeys) || commands.some((command) => !Array.isArray(command.argv) || command.argv.length === 0 || command.argv.some((part) => !labels.has(part)) || !Array.isArray(command.output))) addIssue('stage commandはtokenで構成された一意な宣言である必要があります', entity);
    const sequence = stage.goal && stage.goal.commandSequence;
    if (!Array.isArray(sequence) || sequence.length === 0 || sequence.some((command) => !commandKeys.includes(JSON.stringify(command)))) addIssue('stage goalは定義済みcommandの1件以上の列である必要があります', entity);
  }
}

function validateTerm(term, week, weekKey) {
  const entity = { type: 'term', id: term.id };
  if (!isActive(term) || term.weekUnitId !== week.id) return;
  if (!nonEmptyString(term.name) || [...term.name].length > 40 || compactLength(term.definition) < 20 || compactLength(term.definition) > 200) addIssue('Term名は1〜40文字、説明は空白を除いて20〜200文字である必要があります', entity);
  if (!Array.isArray(term.usageExamples) || term.usageExamples.length < 1 || term.usageExamples.length > 3 || term.usageExamples.some((example) => !nonEmptyString(example))) addIssue('Termの使用例は1〜3件の空でない文字列である必要があります', entity);
  if (!Array.isArray(term.relatedTermNames) || term.relatedTermNames.length > 5) addIssue('関連用語名は0〜5件である必要があります', entity);
  validateSource(term.sourceReference, weekKey, entity);
}

if (issues.length > 0) {
  console.error(`カタログ検証失敗: ${issues.length}件`);
  console.error(issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n'));
  process.exit(1);
}

console.log('カタログ検証成功: 対応教材、教材別数量、stable ID、interactive Activity参照、Source_Reference、解説、Term制約を確認しました。');
