# Week09｜フォーム・入力値取得・バリデーション

ユーザーから情報を受け取る「フォーム」の作り方を学びます。入力欄を設置してJavaScriptで値を取得し、「入力が不正な場合はエラーを表示する」バリデーション処理まで書けるようになります。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | `form` / `input` / `label` / `select` / `textarea`、`.value` / `.checked`、HTML5バリデーション、JS側バリデーション、`submit` イベントと `preventDefault()` |
| **作るもの** | ユーザー登録フォーム（名前・メール・パスワード・利用規約同意のバリデーション付き） |
| **完了条件** | `submit` イベントで入力値を取得し、バリデーションに応じてメッセージを表示できる |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・自信度チェック・ミニドリルでは使わないこと。

---

## インプット

### 1. フォームの基本構造

フォームは、ユーザーが入力した情報をアプリ側で受け取るための仕組みです。ログインフォーム・お問い合わせフォーム・検索ボックスなど、Webアプリには欠かせません。

HTML上での基本形は次のとおりです。

```html
<form id="signupForm">
  <label for="userName">お名前</label>
  <input type="text" id="userName" name="userName">

  <button type="submit">送信</button>
</form>
```

- `<form>` — フォーム全体を囲む要素
- `<input>` — ユーザーが値を入力する欄
- `<label>` — 入力欄の説明文。`for` 属性に対応する `input` の `id` を指定すると、ラベルをクリックしてもフォーカスが移る
- `<button type="submit">` — フォームの送信ボタン

`form` 要素内の `submit` ボタンを押すと、デフォルトではページのリロードや別ページへの遷移が起きます。JavaScriptでフォームを処理する場合はこの挙動を止める必要があります（後述の `preventDefault()` を参照）。

---

### 2. さまざまな input タイプ

`<input>` は `type` 属性によって動作が変わります。

```html
<!-- テキスト入力 -->
<input type="text" id="name" placeholder="山田太郎">

<!-- メールアドレス入力（メール形式でないと送信できない） -->
<input type="email" id="email" placeholder="example@mail.com">

<!-- パスワード入力（入力内容が伏字になる） -->
<input type="password" id="password">

<!-- チェックボックス -->
<input type="checkbox" id="agree">

<!-- ラジオボタン（name属性が同じものが1グループになる） -->
<input type="radio" name="plan" value="free" id="planFree">
<input type="radio" name="plan" value="pro" id="planPro">
```

#### テキストエリア

複数行の入力欄には `<textarea>` を使います。

```html
<textarea id="message" rows="4" placeholder="メッセージを入力してください"></textarea>
```

#### セレクトボックス

ドロップダウンから1つ選ぶ場合は `<select>` を使います。

```html
<select id="plan">
  <option value="">選択してください</option>
  <option value="free">フリープラン</option>
  <option value="pro">プロプラン</option>
</select>
```

---

### 3. JavaScriptで値を取得する

#### .value でテキストを取得する

`input`・`textarea`・`select` はすべて `.value` で値を取得できます。

```js
const nameInput = document.getElementById("name");
console.log(nameInput.value); // 入力されたテキスト
```

ボタンクリックや送信のタイミングで `.value` を読み取るのが基本パターンです。

```html
<input type="text" id="name">
<button id="btn">確認</button>
```

```js
document.getElementById("btn").addEventListener("click", () => {
  const value = document.getElementById("name").value;
  console.log(value);
});
```

#### .checked でチェック状態を取得する

チェックボックスやラジオボタンは `.checked` で `true` / `false` を取得します。

```js
const agreeCheckbox = document.getElementById("agree");
console.log(agreeCheckbox.checked); // チェックされていれば true
```

---

### 4. HTML5バリデーション

「バリデーション」とは、入力された値が正しいかを確認し、ダメなら弾く処理のことです（例：名前が空なら「入力してください」と出す）。やり方は大きく2つあります。

- **(A) HTML5バリデーション** … 入力欄に属性を**書くだけ**で、ブラウザが自動でチェックしてくれる
- **(B) JSバリデーション** … `submit` のときに自分で `if` 文を書いてチェックする（→ 6節で学びます）

まずは手軽な (A) から、1歩ずつ見ていきます。

#### Step 1：属性を付けるだけでチェックできる

入力欄に次の属性を付けると、ブラウザが送信時に自動でチェックしてくれます。

| 属性 | 効果 |
|---|---|
| `required` | 未入力のまま送信するとブラウザが警告を出す |
| `type="email"` | メール形式でない場合に警告を出す |
| `minlength="8"` | 指定文字数未満で送信しようとすると警告を出す |
| `maxlength="50"` | 入力できる最大文字数を制限する |

```html
<input type="email" id="email" required>
<input type="password" id="password" minlength="8" required>
```

#### Step 2：ブラウザの自動チェックには困りごとがある

`required` を付けた欄を空のまま送信ボタンを押すと、ブラウザが**勝手に**こうします。

> 「このフィールドを入力してください」という吹き出しを出して、**送信そのものを止める**

手軽な反面、3つの困りごとがあります。

1. 吹き出しの**見た目をCSSで変えられない**（アプリのデザインから浮く）
2. **文言を変えられない**（ブラウザの言語まかせ）
3. 一番の問題 → ブラウザが送信を止めるので **`submit` イベントが発火しない**。つまり、自分で書いたJSのチェックやメッセージが**まったく動かない**

「エラーメッセージを自分で作って画面に出したい」場合、3つ目が決定的な壁になります。

#### Step 3：`novalidate` でブラウザの自動チェックを止める

`<form>` に `novalidate` を付けると、上の「自動チェック・吹き出し・送信ブロック」を**すべてオフ**にできます。

```html
<!-- novalidate でブラウザの自動チェックを止め、検証は JS に任せる -->
<form id="signupForm" novalidate>
  <input type="email" id="email" required>
  <button type="submit">送信</button>
</form>
```

オフにすると、入力が不正でもブラウザは黙って `submit` を発火させます。だから自分のJSで好きなようにチェックし、好きなメッセージを好きな見た目で出せます。

| | `novalidate` なし | `novalidate` あり |
|---|---|---|
| 空欄で送信を押すと | ブラウザが吹き出しを出して**止める**。JSは動かない | ブラウザは黙る。**`submit` が発火 → 自分のJSが動く** |
| メッセージの見た目 | ブラウザまかせ（変えられない） | 自分で自由に作れる |

#### Step 4：`novalidate` を付けたら、`required` は何のために残すの？

ここで素朴な疑問が出ます。「`novalidate` でチェックをオフにするなら、`required` は要らないのでは？」

実は `novalidate` を付けると、`required` は**送信時のチェックをしなくなります**（その役目はJSの `if` 文に移ります）。でも `required` には、送信チェック以外に2つの役割が残ります。

1. **スクリーンリーダー**（目が見えない人向けの読み上げ）が「ここは**必須項目**です」と読み上げてくれる
2. **CSS** で `:required` / `:invalid` を使ったスタイルが当たる

つまりこの教材では、**入力チェックの本体はJS（6節）が担当**し、**`required` は「検証のため」ではなく「アクセシビリティとCSSのため」に付けておく**、という役割分担です。「`required` を付けたから安心」ではなく「実際に弾いているのはJS」と意識しておきましょう。

---

### 5. submit イベントと preventDefault()

フォームの送信は `submit` イベントで捕捉します。ただしデフォルトでは送信と同時にページがリロードされるため、`event.preventDefault()` でそれを止めます。

```js
const form = document.getElementById("signupForm");

form.addEventListener("submit", (event) => {
  event.preventDefault(); // ページリロードを止める

  // ここにバリデーションや処理を書く
  console.log("フォームが送信されました");
});
```

`event.preventDefault()` を忘れると、JSがメッセージを表示しても、その直後にページが再読み込みされ、結果が一瞬で消えてしまいます。

---

### 6. JavaScriptでバリデーションを書く

HTML5バリデーションに加え、より細かいルールはJSで実装します。

**よくある確認パターン：**

```js
// 空文字チェック
if (value === "") {
  // エラー処理
}

// 文字数チェック
if (value.length < 8) {
  // エラー処理
}

// チェックボックスの確認
if (!agreeCheckbox.checked) {
  // エラー処理
}
```

---

### 7. まとめ：バリデーション付きフォームの完全サンプル

以下のコードをコピーして動かしてみましょう。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <title>ユーザー登録フォーム</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 flex items-center justify-center min-h-screen">
    <div class="bg-white rounded-lg shadow p-8 w-full max-w-md">
      <h1 class="text-xl font-bold mb-6">ユーザー登録</h1>

      <!-- novalidate でブラウザの自動チェックを止め、検証は下の JS で行う -->
      <form id="signupForm" class="space-y-4" novalidate>
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            お名前
          </label>
          <input
            type="text"
            id="name"
            required
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="山田太郎"
          >
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            required
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="example@mail.com"
          >
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            パスワード（8文字以上）
          </label>
          <input
            type="password"
            id="password"
            required
            minlength="8"
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" id="agree">
          <label for="agree" class="text-sm text-gray-700">
            利用規約に同意する
          </label>
        </div>

        <p id="message" class="text-sm font-medium"></p>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700"
        >
          登録する
        </button>
      </form>
    </div>

    <script>
      const form = document.getElementById("signupForm");
      const message = document.getElementById("message");

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();   // 前後の空白を除く
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;  // パスワードは空白も意味を持つのでtrimしない
        const agree = document.getElementById("agree").checked;

        // バリデーション
        if (name === "") {
          message.textContent = "お名前を入力してください";
          message.className = "text-sm font-medium text-red-500";
          return;
        }

        if (email === "") {
          message.textContent = "メールアドレスを入力してください";
          message.className = "text-sm font-medium text-red-500";
          return;
        }

        if (password.length < 8) {
          message.textContent = "パスワードは8文字以上で入力してください";
          message.className = "text-sm font-medium text-red-500";
          return;
        }

        if (!agree) {
          message.textContent = "利用規約に同意してください";
          message.className = "text-sm font-medium text-red-500";
          return;
        }

        // すべてOKなら成功メッセージ
        message.textContent = "登録完了！ようこそ、" + name + " さん！";
        message.className = "text-sm font-medium text-green-600";
      });
    </script>
  </body>
</html>
```

処理の流れを整理すると次のようになります。

| 段階 | 内容 |
|---|---|
| 1. イベント登録 | `submit` イベントをリッスンする |
| 2. デフォルト停止 | `event.preventDefault()` でリロードを止める |
| 3. 値の取得 | `.value` / `.checked` で各入力欄の値を読む |
| 4. バリデーション | 条件を確認し、問題があれば `return` でここで処理を止める |
| 5. 成功処理 | すべて通過したら完了メッセージを表示する |

> **次週とのつながり**：今週身につけた「`.value` で入力値を取り出す」「`submit` で送信を受け取る」は、来週（Week10）の非同期通信（Fetch）でそのまま使います。入力されたGitHubユーザー名を取り出してAPIのURLに渡し、データを取得する、という流れです。

---

## ミニドリル（AI禁止・60分）

### 着手前：着手前分解表（5分）

まず**分解のやり方**を確認してください。「どの要素を取得するか・どのイベントか・どんな条件で弾くか」を先に整理してからコードを書きます。

> 分解の例はWeek03の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

次を埋めてから問題1へ。

| 項目 | 書くこと |
|---|---|
| 完成状態 | 送信したとき、成功時・失敗時にそれぞれどう見えるか |
| 取得する要素 | `getElementById` で何を取るか（`.value` か `.checked` か） |
| イベント | `submit` か `click` か |
| バリデーション | どんな条件で弾くか・チェックする順番 |
| エラーが出やすい所 | `preventDefault()` 忘れ・空文字判定・`return` 忘れ |
| 確認方法 | 空のまま送信・正常入力の両方で確認 |

---

### 問題1：お問い合わせフォーム（20分）

`drill-ph1` の `week09-1/` で作業します。

お名前（テキスト）とお問い合わせ内容（テキストエリア）を入力して送信ボタンを押すと、未入力ならエラー、両方入っていれば受付メッセージを表示するフォームを完成させます。
**完成したら同じフォルダ内の `goal.png` を開いて見比べてください。同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス / 内容 |
|---|---|
| ページ背景 | `bg-slate-50`（`flex` で中央寄せ） |
| カード | `max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-8` |
| 入力欄 | `w-full border border-slate-300 rounded px-3 py-2`（`focus:ring-2`） |
| メッセージ | `id="result"`。失敗時は `text-red-500`、成功時は `text-green-600` |
| ボタン | `w-full bg-blue-600 text-white font-bold py-2 rounded` |

#### 掲載する内容

- お名前（`type="text"`）／お問い合わせ内容（`<textarea rows="4">`）／送信ボタン

#### Step 1：`form` に `submit` イベントを登録し、コールバックの最初で `event.preventDefault()` を呼ぶ

#### Step 2：`name` が空なら「お名前を入力してください」、`message` が空なら「お問い合わせ内容を入力してください」、両方OKなら「〇〇さんのお問い合わせを受け付けました」を表示する。失敗は赤・成功は緑にクラスを切り替える

#### Step 3：空のまま送信／正常入力の両方を試し、`goal.png` とレイアウトを照合する

---

### 問題2：バグ診断（preventDefault）（15分）

`drill-ph1` の `week09-2/` ディレクトリで作業してください。

`week09-2/index.html` を開いて「ログイン」ボタンを押すと、メッセージが**一瞬表示されてすぐ消えてしまいます**。正しく修正できると、ボタンを押してもメッセージが消えずに表示され続けます。何が問題か説明し、修正してください。

![Week09 ミニドリル 問題2 ゴールUI](./images/minidrill-week09-2.png)

<details>
<summary>ヒント</summary>
フォームの送信ボタンを押したときの、ブラウザのデフォルト動作を思い出してみましょう。
</details>

<details>
<summary>解答の要点</summary>

`event.preventDefault()` が呼ばれていないため、ボタンを押すとブラウザがフォームを送信してページを**リロード**しています。メッセージは表示された直後にリロードで消えてしまいます。`addEventListener("submit", (event) => { ... })` のように引数で `event` を受け取り、最初の行で `event.preventDefault()` を呼べば直ります。

</details>

---

### 問題3：参加者登録リスト（フォーム × 配列・forEach の復習）（25分）

`drill-ph1` の `week09-3/` ディレクトリで作業してください。

フォームから名前と役割を登録すると、配列に追加されて一覧が**再描画**されるアプリを作ります。Week09のフォーム・バリデーションと、Week08の配列・`forEach` 描画を組み合わせた復習問題です。

- 名前が空・役割が未選択のときは追加せず、エラーメッセージを出す
- 追加できたら配列に `push` し、`forEach` で一覧を描き直す。入力欄は空に戻す

![Week09 ミニドリル 問題3 ゴールUI](./images/minidrill-week09-3.png)

#### Step 1：`goal.png` を見ながら、ブロック（ヘッダー / フォーム / 一覧）に分解する

#### Step 2：`render()` で `memberList.innerHTML = ""` → `members.forEach` → `appendChild`（Week08の復習）。`submit` では `preventDefault` → 検証 → `push` → `render()` → 入力欄クリア

#### Step 3：未入力のとき追加されないこと・複数回追加しても一覧が壊れないことを確認する

---

## POSSE課題

### テーマ：ユーザー登録フォーム

**前週（Week08）とは別の、新しいHTMLファイル**を作ってください。入力値取得・バリデーション・フィードバック表示の3つをすべて含むフォームを実装します。

**要件:**
- 名前（テキスト）・メールアドレス（`type="email"`）・パスワード（`type="password"`）・利用規約同意（`type="checkbox"`）の4つの入力欄を設置する
- 送信ボタンを押したとき、JS側でバリデーションを実行する
  - 全項目が入力済みか確認する
  - パスワードが8文字以上か確認する
  - チェックボックスにチェックが入っているか確認する
- バリデーション失敗時：「〇〇を入力してください」「〇〇してください」など具体的なメッセージを画面に表示する
- バリデーション成功時：「登録完了！」のようなメッセージを表示する
- HTML5の `required` 属性も付ける（検証のためではなく、スクリーンリーダーの読み上げとCSS用）。JSで自前のエラーメッセージを出すため、`<form>` に `novalidate` を付けてブラウザの自動チェックは止める（インプット4 Step 2〜4を参照）
- Tailwind CSSで見た目を整える
- GitHubリポジトリにpushしてURLを提出。ローカルで動作確認済みであればOK
- **エラーメッセージの出し方を自分で設計すること（最初の1件だけ出す／すべてまとめて出す／各入力欄の下に個別表示する など。なぜそうしたかをPR本文に書く）**

**【発展・任意】**
- メールアドレスの形式（`@` を含むか等）をJS側でも追加チェックする
- パスワードと確認用パスワードの一致チェックを追加する

**提出:**
- GitHubリポジトリURL

**PR本文に必ず書くこと:**
1. `event.preventDefault()` を使う理由、バリデーションの順番を決めた理由など、実装上の判断を3点以上書く
2. `.value` と `.checked` をどの入力欄で使い分けたか
3. 詰まった場所とどう解決したか（1箇所以上）

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A（例: エラーは最初の1件だけ表示する）:
- 選択肢B（例: すべてのエラーをまとめて表示する）:
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

- [ ] 前週とは別の新しいHTMLファイルを作った
- [ ] `form` 要素で入力欄全体を囲んでいる
- [ ] `label` と `input` が `for` / `id` で正しく対応している
- [ ] `event.preventDefault()` で送信時のリロードを止めている
- [ ] `.value` と `.checked` で各入力欄の値を取得している
- [ ] パスワード8文字以上・利用規約同意のバリデーションがある
- [ ] バリデーション失敗時に具体的なエラーメッセージが表示される
- [ ] バリデーション成功時に登録完了メッセージが表示される
- [ ] HTML5の `required` を付けつつ、`<form>` に `novalidate` を付けてJS側のメッセージが表示されるようにした
- [ ] リポジトリURLが提出されており、ローカルで動作確認済みである
- [ ] PR本文に実装上の判断と詰まった箇所の記録がある
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] エラーメッセージの出し方の設計と理由をPR本文に書いた
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIとの比較を記録した（Week06以降必須）
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### フォーム関連の要素

| 要素 | 用途 |
|---|---|
| `<form>` | フォーム全体を囲む |
| `<input>` | 1行入力欄（`type` で種類が変わる） |
| `<textarea>` | 複数行の入力欄 |
| `<select>` / `<option>` | ドロップダウンから選択する |
| `<label>` | 入力欄の説明（`for` と `id` で対応づける） |
| `<button type="submit">` | フォームの送信ボタン |

### input の主な type

| type | 用途 |
|---|---|
| `text` | 1行テキスト |
| `email` | メール形式（形式チェックあり） |
| `password` | 入力内容が伏字になる |
| `checkbox` | オン/オフ（`.checked` で取得） |
| `radio` | グループから1つ選択（同じ `name`） |
| `number` | 数値入力 |

### HTML5バリデーション属性

| 属性 | 効果 |
|---|---|
| `required` | 未入力のまま送信できない |
| `minlength` / `maxlength` | 文字数の下限・上限 |
| `type="email"` | メール形式かをチェックする |
| `pattern` | 正規表現でパターンを指定する |

### 値の取得とイベント

| 書き方 | 説明 |
|---|---|
| `input.value` | テキスト・`textarea`・`select` の値を取得・設定する |
| `checkbox.checked` | チェックの有無を取得する（`true` / `false`） |
| `event.preventDefault()` | `submit` のデフォルト動作（リロード）を止める |

### MDN参考リンク

- [\<form\>](https://developer.mozilla.org/ja/docs/Web/HTML/Element/form)
- [\<input\>](https://developer.mozilla.org/ja/docs/Web/HTML/Element/input)
- [HTMLFormElement: submit イベント](https://developer.mozilla.org/ja/docs/Web/API/HTMLFormElement/submit_event)
- [Event.preventDefault()](https://developer.mozilla.org/ja/docs/Web/API/Event/preventDefault)
- [クライアント側のフォーム検証](https://developer.mozilla.org/ja/docs/Learn/Forms/Form_validation)（MDN Learn）
