# Week06｜JavaScript基礎（変数・型・条件分岐・関数）

今週からJavaScriptに入ります。HTML・CSSが「見た目を作る」言語だとすれば、JavaScriptは「動きをつける」言語です。今週は変数・データ型・条件分岐・関数という基礎を固め、計算ツールを作ります。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | HTML/CSS/JSの役割分担、const/let、データ型、if/else、関数（function宣言・アロー関数）、console.log |
| **作るもの** | BMI計算ツール（新しいHTMLファイル） |
| **完了条件** | JSで条件分岐と計算を使って結果を画面に表示できる。処理の流れを自分の言葉で説明できる |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・ミニドリルでは使わないこと。

---

## インプット

### 1. HTML・CSS・JavaScriptの役割分担

Webページは3つの役割に分かれています。

| 言語 | 担当 | 例 |
|---|---|---|
| HTML | 構造・内容 | 「ここが見出し」「ここが入力欄」 |
| CSS / Tailwind | 見た目 | 「文字は青」「余白は16px」 |
| JavaScript | 動き・処理 | 「ボタンが押されたら計算する」 |

JavaScriptはHTMLと同じファイルに書くこともできます。`<script>` タグで囲んだ部分がJavaScriptのコードです。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <title>JavaScript入門</title>
  </head>
  <body>
    <h1>はじめてのJS</h1>

    <script>
      console.log("JavaScriptが動きました");
    </script>
  </body>
</html>
```

`<script>` タグは `</body>` の直前に置くのがおすすめです。HTMLが読み込まれた後にJavaScriptが動くため、ボタンや入力欄などの要素を確実に見つけられます。

---

### 2. console.log で確認する習慣

プログラミングを学ぶ上で一番大事な習慣のひとつが「値を確認しながら進める」ことです。

`console.log(...)` を使うと、ブラウザの開発者ツール（Console）に値を表示できます。

```js
console.log("こんにちは"); // 文字列を表示
console.log(42);           // 数値を表示
console.log(3 + 5);        // 計算結果を表示
console.log(true);         // 真偽値を表示
```

DevToolsの開き方（Consoleタブ）：
- Mac: `Cmd + Option + I`
- Windows: `F12`

「なんか動かない」というときは、まず `console.log` で値を確認します。エラーメッセージもConsoleに表示されるので、詰まったときの最初の確認場所です。

![console.logの基本的な使い方](./images/week09-console1.png)
![変数の値をconsole.logで確認](./images/week09-console2.png)

---

### 3. 変数：値に名前をつける

変数は「値に名前をつけて、後で使えるようにする」仕組みです。

```js
const name = "ぽっせ";       // 文字列
const age = 20;              // 数値
const isStudent = true;      // 真偽値

console.log(name);    // ぽっせ
console.log(age);     // 20
```

`const` と `let` の使い分けです。

| キーワード | 使う場面 | 上書き |
|---|---|---|
| `const` | 変わらない値（基本はこちら） | できない |
| `let` | 後から変える値 | できる |

```js
const baseScore = 100;  // 変わらない基準値
let score = 80;         // 後から変わりうるスコア

score = 90;             // letは上書きOK
// baseScore = 200;     // constは上書きするとエラー
```

`var` はJavaScriptの古い書き方です。現代では `const` と `let` を使います。

---

### 4. データ型：値の種類

JavaScriptには値の「種類」があります。

| 種類 | 例 | 説明 |
|---|---|---|
| string（文字列） | `"こんにちは"` | 文字。`"` または `'` で囲む |
| number（数値） | `42`, `3.14` | 数字。整数も小数もnumber |
| boolean（真偽値） | `true`, `false` | 正しいか間違いか |

よくあるミスが「文字列と数値の混同」です。

```js
const a = "10";  // string（文字列の10）
const b = 5;     // number（数値の5）

console.log(a + b);  // "105"（文字列に数値がくっついた！）
console.log(Number(a) + b); // 15（正しく計算）
```

入力フォームから取った値は**文字列（string）**になります。計算に使う場合は `Number(...)` で数値に変換する必要があります。

---

### 5. 条件分岐：if / else

「もし〜なら〜する、そうでなければ〜する」という処理が条件分岐です。

```js
const score = 75;

if (score >= 80) {
  console.log("合格");
} else if (score >= 60) {
  console.log("ボーダーライン");
} else {
  console.log("不合格");
}
```

比較演算子の一覧です。

| 演算子 | 意味 | 例 |
|---|---|---|
| `===` | 等しい（型も一致） | `score === 100` |
| `!==` | 等しくない | `score !== 0` |
| `>` | より大きい | `score > 80` |
| `>=` | 以上 | `score >= 80` |
| `<` | より小さい | `score < 60` |
| `<=` | 以下 | `score <= 60` |

`==`（イコール2つ）ではなく `===`（イコール3つ）を使う習慣をつけましょう。`==` は型が違っても一致と見なすことがあり、バグの原因になりやすいです。

![条件分岐の確認にconsole.logを使う](./images/week09-console3.png)
![エラーがConsoleに表示される](./images/week09-console4.png)

---

### 6. 関数：処理をまとめて名前をつける

関数は「一連の処理をまとめて、名前をつけて使い回せるようにする」仕組みです。

#### function宣言

```js
function greet(name) {
  return "こんにちは、" + name + "さん！";
}

const message = greet("ぽっせ");
console.log(message); // こんにちは、ぽっせさん！
```

#### アロー関数

```js
const greet = (name) => {
  return "こんにちは、" + name + "さん！";
};

const message = greet("ぽっせ");
console.log(message); // こんにちは、ぽっせさん！
```

`function greet` と `const greet = () => {}` は書き方が違いますが、今の段階では「どちらも関数を作る書き方」と理解しておけば十分です。

引数（ひきすう）は「関数に渡す入力値」、戻り値（もどりち）は `return` で返す結果です。

```js
function calcBmi(height, weight) {
  const heightM = height / 100; // cmをmに変換
  const bmi = weight / (heightM * heightM);
  return bmi;
}

const result = calcBmi(170, 65);
console.log(result); // 22.49...
```

---

### 7. 完成例：BMI計算ツール（基本形）

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BMI計算ツール</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 flex items-center justify-center min-h-screen p-4">

    <div class="bg-white rounded-lg shadow p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6">BMI計算ツール</h1>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">身長 (cm)</label>
        <input id="height" type="number" placeholder="例：170"
          class="w-full border border-gray-300 rounded px-3 py-2">
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
        <input id="weight" type="number" placeholder="例：65"
          class="w-full border border-gray-300 rounded px-3 py-2">
      </div>

      <button id="calcBtn"
        class="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
        計算する
      </button>

      <p id="result" class="mt-6 text-center text-lg font-bold text-gray-800"></p>
    </div>

    <script>
      function calcBmi(height, weight) {
        const heightM = height / 100;
        return weight / (heightM * heightM);
      }

      function getJudgment(bmi) {
        if (bmi < 18.5) {
          return "痩せ型";
        } else if (bmi < 25) {
          return "普通";
        } else {
          return "肥満";
        }
      }

      const button = document.querySelector("#calcBtn");
      const result = document.querySelector("#result");

      button.addEventListener("click", () => {
        const height = Number(document.querySelector("#height").value);
        const weight = Number(document.querySelector("#weight").value);

        if (height <= 0 || weight <= 0) {
          result.textContent = "身長と体重を入力してください";
          return;
        }

        const bmi = calcBmi(height, weight);
        const judgment = getJudgment(bmi);

        result.textContent = "BMI: " + bmi.toFixed(1) + "（" + judgment + "）";
      });
    </script>

  </body>
</html>
```

`document.querySelector` や `addEventListener` はWeek07で詳しく説明します。今週はコードを読んで「ボタンを押したときに計算が走る」という流れを理解できれば十分です。

---

### 8. エラーの読み方

JavaScriptでエラーが出たとき、Consoleに表示されるメッセージを読む習慣が大切です。

よくあるエラーメッセージと原因です。

| エラーメッセージ | 主な原因 |
|---|---|
| `ReferenceError: xxx is not defined` | `xxx` という変数が定義されていない |
| `TypeError: Cannot read properties of null` | `querySelector` で要素が見つからなかった（`null` を操作しようとした） |
| `SyntaxError: Unexpected token` | 書き方に誤りがある（括弧の閉じ忘れなど） |
| `NaN`（Not a Number） | 計算の途中で数値以外が混ざった |

`NaN` はエラーメッセージではなく、計算の結果として表示される値です。「文字列を計算に使ってしまった」場合によく出ます。

```js
const a = "身長"; // 文字列
const b = 2;
console.log(a * b); // NaN（文字列は計算できない）
```

---

### 9. よくある間違いと確認ポイント

#### 「Number変換を忘れる」

```js
// 間違い: value は文字列のまま
const height = document.querySelector("#height").value;
const heightM = height / 100; // "170" / 100 = 1.7（* は偶然動く場合がある）

// 正しい: 必ずNumber変換する
const height = Number(document.querySelector("#height").value);
```

`+` 演算子では文字列結合になるため特に注意が必要です。

```js
const a = "10"; // 文字列
const b = 5;
console.log(a + b); // "105"（文字列結合）
console.log(Number(a) + b); // 15（正しい加算）
```

#### 「===を==と書く」

```js
// 間違い: == は型変換が起きる
if ("0" == 0) { ... } // true（型が違うのに一致と判定される）

// 正しい: === は型も含めて比較する
if ("0" === 0) { ... } // false（文字列と数値は異なる）
```

#### 「条件の方向を間違える」

BMI判定で「25以上が肥満」なのに `bmi > 25` と書かず `bmi < 25` と書いてしまうミスです。判定条件を書いた後、境界値（18.5, 25など）でテストして動作を確認しましょう。

---

## ミニドリル（AI禁止・60分）

### 着手前：着手前分解表（5分）

まず**分解のやり方**を確認してください。「入力→処理→出力」を先に言語化してからコードを書くのが今週のポイントです。

> 分解の例はWeek03の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

コードを書く前に、次の表を埋めてから問題1に進んでください。

| 項目 | 書くこと |
|---|---|
| 完成状態 | どんな画面・挙動になれば「できた」か |
| 入力 | ユーザーが入れる値は何か（型も） |
| 処理 | どんな計算・変換をするか（`Number` / `Math.ceil` など） |
| 出力 | どこに何を表示するか |
| 境界値 | 0・未入力・人数1など、試す数値 |
| 確認方法 | Live Server / ファイル直開き・Console の見方 |

---

### 問題1：割り勘計算ツール（20分）

`drill-ph1` の `week06-1/` ディレクトリで作業してください。

`index.html` に骨組みがあります。**この `README.md` の仕様表**と **`goal.png`** を見比べて、同じレイアウトになれば OK です（完成答えの HTML は配布していません）。

#### 仕様

| 項目 | Tailwindクラス / 内容 |
|---|---|
| ページ背景 | `bg-gray-50` |
| カード | `max-w-sm w-full mx-auto bg-white rounded-xl shadow-lg p-8` |
| h1 | `text-2xl font-bold text-gray-900 mb-6`、テキスト「割り勘計算」 |
| 入力 | 「合計金額（円）」「人数」の `type="number"` |
| ボタン | `bg-blue-600 text-white w-full py-2 rounded-lg font-semibold hover:bg-blue-700`、テキスト「計算する」 |
| 結果表示 | `id="result"` — 「1人あたり: ¥〇〇」`text-3xl font-bold text-center`。**端数は切り上げ**（`Math.ceil`） |
| ガード | 未入力・0以下は「入力を確認してください」などで表示 |
| JS | `.value` は文字列なので `Number(...)` で数値へ変換してから計算 |

#### Step 1：分解表と仕様表を見ながら、ラベル・入力・ボタン・結果の構造を `index.html` に実装する

#### Step 2：`addEventListener` でクリック時に `Number` → 割り算 → `Math.ceil` の順で実装する

#### Step 3：`goal.png` と並べて表示を確認する（情報の並びが揃っていればOK）

---

### 問題2：バグ診断（型変換・文字列と数値）（15分）

`drill-ph1` の `week06-2/` ディレクトリで作業してください。

`week06-2/index.html` を開いてください。

合計 **5000** 円・人数 **3** のとき、1人あたりは **1667** 円（切り上げ）になるはずですが、現状は `"50003"` のように**文字列の連結**になっています。原因を説明し、正しく計算されるよう修正してください。必要なら `goal.png` で表示の参考にします。

<details>
<summary>ヒント</summary>

`total + people` の `+` は、両方が文字列だと**足し算ではなく連結**になります。割り算には `Number(total)` と `Number(people)` を使い、結果に `Math.ceil` をかけます。

</details>

<details>
<summary>解答例</summary>

```js
document.querySelector("#calcBtn").addEventListener("click", () => {
  const total = Number(totalInput.value);
  const people = Number(peopleInput.value);
  if (total <= 0 || people <= 0) {
    result.textContent = "入力を確認してください";
    return;
  }
  const perPerson = Math.ceil(total / people);
  result.textContent = perPerson + " 円";
});
```

</details>

---

### 問題3：おやつ買い出しメモ（過去復習）（25分）

`drill-ph1` の `week06-3/` ディレクトリで作業してください。

`week06-3/` で、仕様表と **`goal.png`** どおり **Tailwind + Flex + JS計算** のカードを作ってください。

- 左カラム：グラデーション背景と絵文字、緑の帯で「POSSE部室ストア」
- 右カラム：`flex` で「単価」「個数」を並べ、**小計 = 単価 × 個数**（`Number` 必須）
- `input` の `input` イベントまたは「再計算」ボタンで表示を更新

![Week06 ミニドリル 問題3 ゴールUI](./images/minidrill-week06-3.png)

#### Step 1：レイアウトを2カラムに分け、`md:` 前後で横並びになるよう組む

#### Step 2：`Number(unitInput.value) * Number(qtyInput.value)` で小計を出す関数を書く

#### Step 3：負の数や空入力のときの表示方針を決め、Console に警告が出ないか確認する

## POSSE課題

### テーマ：BMI計算ツール

身長と体重を入力して計算ボタンを押すと、BMIと判定結果が表示されるツールを作ってください。Week05のNPOページとは別の、独立した新しいHTMLファイルです。

**要件:**
- 身長（cm）と体重（kg）を入力できる
- 「計算する」ボタンを押すと、BMIの数値と判定（「痩せ型」「普通」「肥満」など）が表示される
- BMIは `体重(kg) / 身長(m)^2` で計算する（身長はcmをmに変換すること）
- 判定はif/elseで条件分岐を使う
- 数値が入力されていない場合や0以下の場合はメッセージを表示する
- **入力エラー時のメッセージ文言を自分で考えること（「入力してください」だけでなく、ユーザーが何をすればよいか分かる文言にする。選んだ文言の理由をPR本文に書く）**

**提出:**
- GitHubリポジトリにpushしてURLを提出。ローカルで動作確認済みであればOK

**PR本文に必ず書くこと:**
1. 計算処理の流れを自分の言葉で説明する（「ボタンを押したら〜して〜する」という形で）
2. `const` と `let` をどこで使い分けたか
3. `Number(...)` でどこを変換したか、なぜ必要だったか
4. 詰まった場所とどう解決したか（1箇所以上）
5. 【発展・任意】AIに同じツールを作らせて、自分のコードと何が違うか比較する

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A（例: エラーメッセージを「数値を入力してください」にする）:
- 選択肢B（例: エラーメッセージを「身長と体重を半角数字で入力してください」にする）:
- 採用した理由:
- 確認方法:

## AI利用
AIを使った場合は記入してください（使わなかった場合は「不使用」と記入）:

- 使ったAIツール:
- 何を依頼したか:
- 自分で修正した箇所:

### AIとの比較（必須）
AIに同じ要件で実装させ、自分の実装と比べてください:
- AIが正しく実装できていたこと:
- AIが間違えた・足りなかったこと（境界値・エラー処理・見た目など）:
- 自分が修正・判断した箇所:

### チェックポイント

- [ ] 新しいHTMLファイルを作った（Week05のページへの追記ではない）
- [ ] 身長・体重の入力欄とボタンが動作する
- [ ] if/elseで判定（痩せ型・普通・肥満）を分岐させている
- [ ] 入力値を `Number(...)` で変換してから計算している
- [ ] 未入力・0以下の場合にエラーメッセージが出る
- [ ] Consoleでエラーが出ていない
- [ ] PR本文に処理の流れを自分の言葉で書いた
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] エラーメッセージ文言の選定理由をPR本文に書いた
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIとの比較を記録した（Week06以降必須）
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### データ型の変換

| 変換先 | 方法 | 例 |
|---|---|---|
| 数値に変換 | `Number(値)` | `Number("42")` → `42` |
| 文字列に変換 | `String(値)` | `String(42)` → `"42"` |
| 真偽値に変換 | `Boolean(値)` | `Boolean(0)` → `false` |

### 比較演算子まとめ

| 演算子 | 意味 | 例 | 結果 |
|---|---|---|---|
| `===` | 等しい（型も一致） | `"1" === 1` | `false` |
| `!==` | 等しくない | `"1" !== 1` | `true` |
| `>` | より大きい | `5 > 3` | `true` |
| `>=` | 以上 | `5 >= 5` | `true` |
| `<` | より小さい | `3 < 5` | `true` |
| `<=` | 以下 | `3 <= 3` | `true` |

### よく使うMathメソッド

| メソッド | 説明 | 例 |
|---|---|---|
| `Math.round(x)` | 四捨五入 | `Math.round(3.6)` → `4` |
| `Math.floor(x)` | 切り捨て | `Math.floor(3.9)` → `3` |
| `Math.ceil(x)` | 切り上げ | `Math.ceil(3.1)` → `4` |
| `x.toFixed(1)` | 小数点以下の桁数を指定 | `(22.4567).toFixed(1)` → `"22.5"` |

### MDN参考リンク

- [JavaScript チュートリアル入門](https://developer.mozilla.org/ja/docs/Learn/JavaScript/First_steps)
- [if...else](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/if...else)
- [関数](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Functions)

### 参考動画・記事

JavaScriptは最初の週が一番とっつきにくいです。動画で補完しましょう。

- [【JavaScript入門①】変数・定数・データ型の基本（const・let・var）](https://youtu.be/LgnGnkM5VKI) — JavaScriptの変数を日本語でゼロから解説（視聴目安: 全編 約15分）
- [条件分岐（if文）をわかりやすく解説【JavaScript】](https://youtu.be/gVtJXoqbzuM) — if/else と比較演算子を具体例で説明（視聴目安: 全編 約10分）
- [JavaScript関数入門（宣言・アロー関数・引数・戻り値）](https://youtu.be/V5MKfLTEJno) — 関数の3つの書き方を比較（視聴目安: 全編 約20分）
- [JavaScript 変数・データ型・演算子（MDN Learn）](https://developer.mozilla.org/ja/docs/Learn/JavaScript/First_steps/Variables) — MDNの入門チュートリアル

