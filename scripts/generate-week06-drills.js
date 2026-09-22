/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.join(__dirname, '../mock-api/catalog.json');
const response = JSON.parse(fs.readFileSync(file, 'utf8'));
// 各段階のコードは前の段階までの正答を保持し、新しい編集箇所だけを追加する。
const drills = [
  {
    id: 'split', title: '割り勘計算ツール', source: '問題1：割り勘計算ツール（20分）',
    stages: [
      ['合計金額を数値に変換しよう', '文字列の入力をNumberで変換し、型もコンソールで確認します。', 'const totalInput = "1000";\nconst total = __EDIT__;\nconsole.log(total, typeof total);', 'Number(totalInput)', 'totalInput', 'Boolean(totalInput)', 'Number("totalInput")'],
      ['人数も数値として扱おう', '人数の入力も文字列です。計算前に数値へ変換してください。', 'const totalInput = "1000";\nconst peopleInput = "3";\nconst total = Number(totalInput);\nconst people = __EDIT__;\nconsole.log(total, people, typeof people);', 'Number(peopleInput)', 'peopleInput', 'Boolean(peopleInput)', 'Number("peopleInput")'],
      ['1人分の金額を計算しよう', '合計金額を人数で割ります。この段階では小数のまま確認します。', 'const totalInput = "1000";\nconst peopleInput = "3";\nconst total = Number(totalInput);\nconst people = Number(peopleInput);\nconst perPerson = __EDIT__;\nconsole.log(perPerson);', 'total / people', 'total + people', 'total * people', 'people / total'],
      ['端数を切り上げよう', '1000円を3人で割ると334円です。切り捨てや四捨五入との違いを確認します。', 'const totalInput = "1000";\nconst peopleInput = "3";\nconst total = Number(totalInput);\nconst people = Number(peopleInput);\nconst perPerson = __EDIT__(total / people);\nconsole.log(perPerson);', 'Math.ceil', 'Math.floor', 'Math.round', 'Number'],
      ['空入力・0以下をガードしよう', '関数にまとめ、入力が0以下なら計算せずメッセージを返します。空文字のNumber変換は0になります。', 'function splitBill(totalInput, peopleInput) {\n  const total = Number(totalInput);\n  const people = Number(peopleInput);\n  if (__EDIT__) return "入力を確認してください";\n  return Math.ceil(total / people);\n}\nconsole.log(splitBill("1000", "3"));\nconsole.log(splitBill("", "3"));\nconsole.log(splitBill("1000", "0"));\nconsole.log(splitBill("1000", "1"));', 'total <= 0 || people <= 0', 'total <= 0 && people <= 0', 'total < 0 || people < 0', 'total > 0 || people > 0'],
      ['結果のメッセージを完成させよう', '有効な入力では「1人あたり: ¥334」のように表示します。無効な入力はガードで先に返します。', 'function splitBill(totalInput, peopleInput) {\n  const total = Number(totalInput);\n  const people = Number(peopleInput);\n  if (total <= 0 || people <= 0) return "入力を確認してください";\n  const perPerson = Math.ceil(total / people);\n  return __EDIT__;\n}\nconsole.log(splitBill("1000", "3"));\nconsole.log(splitBill("", "3"));\nconsole.log(splitBill("1000", "0"));\nconsole.log(splitBill("1000", "1"));', '"1人あたり: ¥" + perPerson', '"1人あたり: ¥" + total', '"1人あたり: ¥" + people', '"1人あたり: ¥" + (total / people)'],
    ],
  },
  {
    id: 'type-bug', title: '型変換・文字列と数値のバグ修正', source: '問題2：バグ診断（型変換・文字列と数値）（15分）',
    stages: [
      ['文字列連結の原因を調べよう', '元のバグを再現します。typeofでtotalの型を出力し、「50003」になる理由を確認します。', 'const total = "5000";\nconst people = "3";\nconsole.log(total + people);\nconsole.log(__EDIT__);', 'typeof total', 'Number(total)', 'total / people', 'total === people'],
      ['合計の型を修正しよう', '合計を数値へ変換します。人数が文字列のままだと、+の結果はまだ連結になります。', 'const totalInput = "5000";\nconst people = "3";\nconst total = __EDIT__;\nconsole.log(typeof total, typeof people);\nconsole.log(total + people);', 'Number(totalInput)', 'totalInput', 'String(totalInput)', 'Boolean(totalInput)'],
      ['人数の型も修正しよう', '両方を数値にすると+は加算になります。ただし割り勘には、次に演算の修正が必要です。', 'const totalInput = "5000";\nconst peopleInput = "3";\nconst total = Number(totalInput);\nconst people = __EDIT__;\nconsole.log(typeof total, typeof people);\nconsole.log(total + people);', 'Number(peopleInput)', 'peopleInput', 'String(peopleInput)', 'Boolean(peopleInput)'],
      ['加算を割り算へ直そう', '数値変換だけでなく、合計÷人数に修正します。端数処理は次のステップです。', 'const total = Number("5000");\nconst people = Number("3");\nconst perPerson = __EDIT__;\nconsole.log(perPerson);', 'total / people', 'total + people', 'total - people', 'people / total'],
      ['切り上げて1667円にしよう', 'Math.ceilで端数を切り上げます。5000÷3が1667になることを確認してください。', 'const total = Number("5000");\nconst people = Number("3");\nconst perPerson = __EDIT__(total / people);\nconsole.log(perPerson + " 円");', 'Math.ceil', 'Math.floor', 'Math.round', 'Number'],
      ['入力ガードを加えて修正を完了しよう', '元教材の修正例と同じく、0以下を先に検出します。通常値・0・空入力・負数を確認しましょう。', 'function calculate(totalInput, peopleInput) {\n  const total = Number(totalInput);\n  const people = Number(peopleInput);\n  if (__EDIT__) return "入力を確認してください";\n  const perPerson = Math.ceil(total / people);\n  return perPerson + " 円";\n}\nconsole.log(calculate("5000", "3"));\nconsole.log(calculate("5000", "0"));\nconsole.log(calculate("", "3"));\nconsole.log(calculate("5000", "-1"));', 'total <= 0 || people <= 0', 'total < 0 || people < 0', 'total <= 0 && people <= 0', 'total === people'],
    ],
  },
  {
    id: 'snacks', title: 'おやつ買い出しメモ', source: '問題3：おやつ買い出しメモ（過去復習）（25分）',
    stages: [
      ['単価を数値に変換しよう', '単価の入力を数値にします。入力例は150円です。', 'const unitInput = "150";\nconst unit = __EDIT__;\nconsole.log(unit, typeof unit);', 'Number(unitInput)', 'unitInput', 'Boolean(unitInput)', 'Number("unitInput")'],
      ['個数を数値に変換しよう', '個数も数値に変換します。入力例は3個です。', 'const unit = Number("150");\nconst qtyInput = "3";\nconst qty = __EDIT__;\nconsole.log(unit, qty, typeof qty);', 'Number(qtyInput)', 'qtyInput', 'Boolean(qtyInput)', 'Number("qtyInput")'],
      ['小計を求めよう', '小計は単価×個数です。150円×3個で450円にします。', 'const unit = Number("150");\nconst qty = Number("3");\nconst subtotal = __EDIT__;\nconsole.log(subtotal);', 'unit * qty', 'unit + qty', 'unit / qty', 'unit - qty'],
      ['関数から小計を返そう', '入力が変わっても再利用できる関数にします。returnで計算結果を呼び出し元に返します。', 'function calcSubtotal(unitInput, qtyInput) {\n  const unit = Number(unitInput);\n  const qty = Number(qtyInput);\n  const subtotal = unit * qty;\n  __EDIT__ subtotal;\n}\nconsole.log(calcSubtotal("150", "3"));\nconsole.log(calcSubtotal("200", "2"));', 'return', 'typeof', 'void', 'throw'],
      ['空入力を区別しよう', 'この版では空入力はメッセージ、0は有効とします。Number変換の前にtrimで空入力を検出します。', 'function calcSubtotal(unitInput, qtyInput) {\n  if (__EDIT__) return "入力を確認してください";\n  const unit = Number(unitInput);\n  const qty = Number(qtyInput);\n  return unit * qty;\n}\nconsole.log(calcSubtotal("150", "3"));\nconsole.log(calcSubtotal("", "3"));\nconsole.log(calcSubtotal("150", " "));\nconsole.log(calcSubtotal("150", "0"));', 'unitInput.trim() === "" || qtyInput.trim() === ""', 'unitInput.trim() === "" && qtyInput.trim() === ""', 'Number(unitInput) === 0 || Number(qtyInput) === 0', 'unitInput === qtyInput'],
      ['負の数をガードして完成させよう', '負数はメッセージ、0個は0円とする方針で完成させます。複数の入力で結果を確かめましょう。', 'function calcSubtotal(unitInput, qtyInput) {\n  if (unitInput.trim() === "" || qtyInput.trim() === "") return "入力を確認してください";\n  const unit = Number(unitInput);\n  const qty = Number(qtyInput);\n  if (__EDIT__) return "入力を確認してください";\n  return unit * qty;\n}\nconsole.log(calcSubtotal("150", "3"));\nconsole.log(calcSubtotal("200", "2"));\nconsole.log(calcSubtotal("", "3"));\nconsole.log(calcSubtotal("-150", "3"));\nconsole.log(calcSubtotal("150", "-1"));\nconsole.log(calcSubtotal("150", "0"));', 'unit < 0 || qty < 0', 'unit <= 0 || qty <= 0', 'unit < 0 && qty < 0', 'unit > 0 || qty > 0'],
    ],
  },
];
const questions = drills.flatMap(drill => {
  const last = drill.stages.at(-1);
  const goalCode = last[2].replace('__EDIT__', last[3]);
  return drill.stages.map(([prompt, hint, content, correct, ...wrong], index) => {
    const output = [];
    vm.runInNewContext(content.replace('__EDIT__', correct), { console: { log: (...args) => output.push(args.map(String).join(' ')) } }, { timeout: 500 });
    const options = [correct, ...wrong].map((text, i) => ({ id: `option-${i + 1}`, text }));
    const offset = (index + 1) % 4;
    return {
      id: `question-week6-console-${drill.id}-${index + 1}`, weekUnitId: 'week-unit-week6', format: 'fillBlank', prompt,
      payload: { kind: 'fillBlank', mode: 'choice', blankToken: '__EDIT__', content, options: [...options.slice(offset), ...options.slice(0, offset)], correctOptionId: 'option-1' },
      console: { drillId: `week6-${drill.id}`, title: drill.title, version: 1, step: index + 1, total: drill.stages.length, hint, goalCode, expectedOutput: output },
      explanation: `${hint} 入力、処理、出力の順にコードと実行結果を確認しましょう。`,
      sourceReference: { weekKey: 'week6', sectionHeading: drill.source }, published: true, deleted: false,
    };
  });
});
// 新形式の所有IDだけを置換する。既存Week06問題・Week01・用語は変更しない。
const ownedIds = new Set(questions.map(q => q.id));
response.catalog.questions = [...response.catalog.questions.filter(q => !ownedIds.has(q.id)), ...questions];
response.contentVersion = '2026-09-19.week06-console.1';
response.updatedAt = '2026-09-19T01:00:00.000Z';
fs.writeFileSync(file, JSON.stringify(response, null, 2) + '\n');
