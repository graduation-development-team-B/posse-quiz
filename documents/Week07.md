# Week07｜DOM操作・イベント

今週のゴールは、JavaScriptでHTMLの要素を取得・書き換え・追加できるようになることです。ボタンのクリックに反応する処理と、リストに項目を追加するTODOアプリを作ります。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | querySelector、textContent、classList、addEventListener、input.value、createElement/appendChild |
| **作るもの** | シンプルなTODOリスト（新しいHTMLファイル） |
| **完了条件** | ボタン押下でリストに項目が追加され、完了ボタンで打ち消し線がつく動作を自分の言葉で説明できる |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・ミニドリルでは使わないこと。

---

## インプット

### 1. DOMとは何か

ブラウザはHTMLを読み込むと、ページの構造をツリー状のデータとして内部に持ちます。これを**DOM（Document Object Model）**と呼びます。

```
document
└── html
    ├── head
    └── body
        ├── h1
        ├── ul
        │   ├── li
        │   └── li
        └── script
```

JavaScriptからDOMにアクセスすることで、「特定の要素を見つける」「文字を書き換える」「クラスを追加する」「新しい要素を作って追加する」といった操作ができます。

---

### 2. querySelector：要素を取得する

`document.querySelector(セレクター)` で、ページから要素を1つ取得します。

```js
// IDで取得（# を付ける）
const title = document.querySelector("#page-title");

// クラスで取得（. を付ける）
const card = document.querySelector(".card");

// タグ名で取得
const firstParagraph = document.querySelector("p");
```

**# と . の使い分けは必須知識です。**

| セレクター | 書き方 | 対象 |
|---|---|---|
| ID | `"#id名"` | `id="id名"` の要素 |
| クラス | `".クラス名"` | `class="クラス名"` の要素 |
| タグ名 | `"p"` | 該当するタグ全体の最初の1つ |

`querySelector(".card")` は「クラス名が `card` の最初の要素」を返します。同じクラスが複数ある場合は `querySelectorAll` を使います（今週は必須ではありません）。

---

### 3. textContent：文字を書き換える

取得した要素の `.textContent` に値を代入すると、表示されている文字を書き換えられます。

```html
<p id="message">初期テキスト</p>

<script>
  const message = document.querySelector("#message");
  message.textContent = "書き換えました";
</script>
```

`.textContent` は「テキストだけ」を扱います。HTMLタグを含む内容を書き換えたい場合は `.innerHTML` を使いますが、セキュリティ上のリスクがあるため、まずは `.textContent` を使う習慣をつけましょう。

![textContentで文字を書き換えた画面](./images/week10-changetext.png)

---

### 4. addEventListener：イベントを登録する

「ボタンが押されたら〜する」という処理を登録するのが `addEventListener` です。

```js
const button = document.querySelector("#myButton");

button.addEventListener("click", () => {
  console.log("クリックされた！");
});
```

書き方のパターンです。

```js
要素.addEventListener("イベント名", () => {
  // イベントが起きたときに実行する処理
});
```

よく使うイベント名です。

| イベント名 | 発生するタイミング |
|---|---|
| `"click"` | クリックされた |
| `"input"` | 入力欄の値が変わった |
| `"submit"` | フォームが送信された |
| `"keydown"` | キーが押された |

---

### 5. input.value：入力値を取得する

`<input>` 要素の値は `.value` で取得します。

```html
<input id="textInput" type="text" placeholder="入力してください">
<button id="showBtn">表示</button>
<p id="output"></p>

<script>
  const button = document.querySelector("#showBtn");
  const input = document.querySelector("#textInput");
  const output = document.querySelector("#output");

  button.addEventListener("click", () => {
    const value = input.value;
    output.textContent = "入力値：" + value;
  });
</script>
```

数値計算に使う場合は Week06 で学んだように `Number(input.value)` と変換します。

---

### 6. classList：クラスを操作する

`.classList` を使うと、要素にクラスを追加・削除・切り替えできます。

```js
const element = document.querySelector("#target");

element.classList.add("bg-red-100");    // クラスを追加
element.classList.remove("bg-red-100"); // クラスを削除
element.classList.toggle("hidden");     // あれば削除、なければ追加
```

「完了ボタンを押したら打ち消し線をつける」という処理は次のように書きます。

```js
const doneButton = document.querySelector("#doneBtn");
const taskText = document.querySelector("#task");

doneButton.addEventListener("click", () => {
  taskText.classList.add("line-through");
});
```

Tailwindの `line-through` クラスは `text-decoration: line-through` に対応し、テキストに打ち消し線をつけます。

---

### 7. createElement と appendChild：新しい要素を作って追加する

`document.createElement` で新しいHTML要素を作り、`appendChild` で既存の要素の子として追加できます。

```js
const list = document.querySelector("#todo-list");

// 新しいli要素を作る
const item = document.createElement("li");
item.textContent = "新しいタスク";

// リストに追加する
list.appendChild(item);
```

TODOリストの「追加」機能の核心部分です。

---

### 8. 完成例：シンプルなTODOリスト

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TODOリスト</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 flex items-center justify-center min-h-screen p-4">

    <div class="bg-white rounded-lg shadow p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6">TODOリスト</h1>

      <div class="flex gap-2 mb-6">
        <input id="todoInput" type="text" placeholder="タスクを入力..."
          class="flex-1 border border-gray-300 rounded px-3 py-2">
        <button id="addBtn"
          class="bg-blue-600 text-white font-bold px-4 py-2 rounded hover:bg-blue-700 transition">
          追加
        </button>
      </div>

      <ul id="todoList" class="space-y-2"></ul>
    </div>

    <script>
      const addButton = document.querySelector("#addBtn");
      const todoInput = document.querySelector("#todoInput");
      const todoList = document.querySelector("#todoList");

      addButton.addEventListener("click", () => {
        const text = todoInput.value;

        // 何も入力されていなければ何もしない
        if (text === "") {
          return;
        }

        // li要素を作る
        const item = document.createElement("li");
        item.className = "flex items-center justify-between bg-gray-50 rounded px-3 py-2";

        // タスクのテキスト部分
        const span = document.createElement("span");
        span.textContent = text;

        // 完了ボタン
        const doneBtn = document.createElement("button");
        doneBtn.textContent = "完了";
        doneBtn.className = "text-sm text-gray-500 hover:text-red-500";

        doneBtn.addEventListener("click", () => {
          span.classList.toggle("line-through");
          span.classList.toggle("text-gray-400");
        });

        item.appendChild(span);
        item.appendChild(doneBtn);
        todoList.appendChild(item);

        // 入力欄をリセット
        todoInput.value = "";
      });
    </script>

  </body>
</html>
```

---

### 9. よくある間違いと確認ポイント

#### 「querySelector で # を忘れる」

```js
// 間違い: # がないのでタグ名として解釈される
const button = document.querySelector("myButton");

// 正しい: IDは # が必要
const button = document.querySelector("#myButton");
```

`querySelector("myButton")` は「myButton というHTMLタグ名の要素」を探します。そのようなタグは存在しないため `null` が返り、次の処理でエラーになります。

#### 「処理の順番が逆になる」

```js
// 間違い: ボタンを取得するより前に addEventListener を書いてしまう
button.addEventListener("click", () => { ... }); // エラー: button は undefined
const button = document.querySelector("#btn");
```

`const button = ...` より先に `button` を使おうとするとエラーになります。変数の宣言が先、使用が後という順番を守りましょう。

#### 「`<script>` タグの置き場所」

`<script>` タグを `<head>` の中に書くと、HTML要素がまだ読み込まれていないタイミングでJavaScriptが実行されるため、`querySelector` でボタンや入力欄が見つからないことがあります。

解決策は2つです。

```html
<!-- 解決策1: </body>の直前に置く（今週はこちら） -->
  <script src="script.js"></script>
</body>

<!-- 解決策2: headに置く場合は defer を付ける -->
<head>
  <script src="script.js" defer></script>
</head>
```

`defer` を付けると、HTMLの読み込みが完了してからJavaScriptが実行されます。

---

### 10. createElement + appendChild の詳しい流れ

TODOリストへの追加処理を1行ずつ追っていきます。

```js
// 1. 入力値を取得する
const text = document.querySelector("#todoInput").value;

// 2. li要素を新たに作る（まだページには表示されていない）
const item = document.createElement("li");

// 3. li要素の文字を設定する
item.textContent = text;

// 4. li要素にクラスを付ける
item.className = "p-2 bg-white rounded";

// 5. ul要素（リストの親）を取得する
const list = document.querySelector("#todoList");

// 6. ul要素の子としてli要素を追加する（ここでページに表示される）
list.appendChild(item);
```

`createElement` で作った要素は「メモリの中にある状態」で、`appendChild` でDOMツリーに追加されて初めて画面に表示されます。

---

## ミニドリル（AI禁止・60分）

### 着手前：着手前分解表（5分）

まず**分解のやり方**を確認してください。「どの要素を取得するか・どのイベントか・何を変えるか」を先に整理してからコードを書きます。

> 分解の例はWeek03の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

次を埋めてから問題1へ。

| 項目 | 書くこと |
|---|---|
| 完成状態 | 何を操作し、最終的にどう見えるか |
| 取得する要素 | `querySelector` で何を取るか（`#` 付きか等） |
| イベント | クリック / input など |
| 処理内容 | どの変数を増減し、どこに反映するか |
| エラーが出やすい所 | `null`・`#` 忘れ・スクリプトの位置 |
| 確認方法 | 境界（0・上限）でクリックして確認 |

---

### 問題1：数量カウンター（20分）

`drill-ph1` の `week07-1/` で作業します。

`-` / `+` ボタンで数量を変え、**0 未満にならない**こと、**在庫上限 10** で止まること、単価980円で**合計金額を更新**することがゴールです。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス / 内容 |
|---|---|
| ページ背景 | `bg-gray-100` |
| カード | `max-w-xs mx-auto bg-white rounded-xl shadow-lg p-8 text-center` |
| h2 | `text-xl font-bold text-gray-900 mb-1` |
| 在庫テキスト | `text-gray-500 text-sm mb-6` |
| ボタンエリア | `flex items-center justify-center gap-4 mb-6` |
| マイナスボタン | `bg-gray-200 w-10 h-10 rounded-full text-xl font-bold text-gray-700`（0以下に行かない） |
| 数値表示 | `id="count"` `text-3xl font-bold text-gray-900` |
| プラスボタン | `bg-blue-600 text-white w-10 h-10 rounded-full text-xl font-bold`（在庫上限10） |
| 合計 | `id="total"` `text-gray-700 font-semibold` |

#### 掲載する内容

- h2：商品名（「プログラミング入門書」など）
- 在庫テキスト：在庫: 10個
- 初期値：1、上限 `const MAX = 10`、単価 `const PRICE = 980`
- 合計：「合計: ¥〇〇」（`count * PRICE` を `toLocaleString()` で表示）

#### Step 1：`let count = 1` と `const MAX = 10` `const PRICE = 980` を決め、HTML にボタンと表示枠を置く

#### Step 2：`refresh()` で `count` の表示と合計金額をまとめて更新する。`disabled` も付けると上限・下限の挙動が分かりやすくなる

#### Step 3：`goal.png` と操作感を照合する（0 と 10 のときの挙動は必ず確認）

---

### 問題2：バグ診断（querySelector）（15分）

`drill-ph1` の `week07-2/` ディレクトリで作業してください。

`week07-2/index.html` を開くと、Console に **Cannot read properties of null** が出ます。

ボタンを押すと文言が差し代わるのが正しい動きです。`querySelector` の**セレクター文字列**のどこが間違いか説明し、修正してください。

![Week07 ミニドリル 問題2 ゴールUI](./images/minidrill-week07-2.png)

<details>
<summary>解答の要点</summary>

`document.querySelector("swapBtn")` は **タグ名 `swapBtn` を探している**状態です。`id="swapBtn"` を取りたいときは `document.querySelector("#swapBtn")` とし、ID には `#` が必要です（Week7インプットの表どおり）。

</details>

---

### 問題3：復習ダッシュボード（Week01〜06の要素）（25分）

`drill-ph1` の `week07-3/` ディレクトリで作業してください。

`week07-3/` で、**ヘッダー（見出し＋リンク）＋ Flex 2カラム** を組み合わせたダッシュボードを作ります。

- 左カラム：合計・人数を入力し、**1人あたり（切り上げ）**を表示（Week06 の計算）
- 右カラム：**在庫上限 5** の ± カウンター（Week07）
- 下：チェックリスト（`ul` / `li` で「学んだタグ」を書くなど、HTML復習）

![Week07 ミニドリル 問題3 ゴールUI](./images/minidrill-week07-3.png)

#### Step 1：仕様表と `goal.png` を見ながら、ブロック（header / 2カラム / チェックリスト）に分解する

#### Step 2：左は `input` の `input` イベントで即再計算、右は問題1と同じパターンで実装する

#### Step 3：スマホ幅と `lg:` 前後で横並びが切り替わるか確認する

## POSSE課題

### テーマ：シンプルなTODOリスト

テキストを入力してボタンを押すとリストに追加され、各項目に「完了」ボタンをつけるTODOリストを作ってください。Week06のBMI計算ツールとは別の、独立した新しいHTMLファイルです。

**要件:**
- テキスト入力欄と「追加」ボタンがある
- ボタンを押すとタスクがリストに追加される
- 追加後、入力欄は空になる
- 各タスクに「完了」ボタンがあり、クリックするとタスクのテキストに打ち消し線（line-through）がつく
- 何も入力されていない状態で追加ボタンを押しても何も追加されない
- **削除確認のUXを自分で設計すること（削除ボタンを押したとき、確認なしで即削除・確認ダイアログあり・アンドゥ可能など。なぜそのUXにしたかをPR本文に書く）**

**提出:**
- GitHubリポジトリにpushしてURLを提出。ローカルで動作確認済みであればOK

**PR本文に必ず書くこと:**
1. 「追加」ボタンを押したときの処理の流れを自分の言葉で説明する
2. `querySelector` でID指定とクラス指定をどの場面で使い分けたか
3. `classList` のどのメソッドを使ったか、なぜそのメソッドを選んだか
4. 詰まった場所とどう解決したか（1箇所以上）
5. 【発展・任意】「削除」ボタンを追加してリストから項目を取り除く機能を実装する

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A（例: 削除は確認なしで即削除にする）:
- 選択肢B（例: 削除前に「本当に削除しますか？」の確認を出す）:
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

- [ ] 新しいHTMLファイルを作った（Week06のページへの追記ではない）
- [ ] テキスト入力→追加ボタン→リスト追加の流れが動く
- [ ] 追加後に入力欄が空になる
- [ ] 各タスクの「完了」ボタンで打ち消し線がつく
- [ ] 空入力のときに追加されない
- [ ] Consoleにエラーが出ていない
- [ ] PR本文に処理の流れを自分の言葉で書いた
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] 削除確認のUX設計とその理由をPR本文に書いた
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIとの比較を記録した（Week06以降必須）
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### querySelector セレクター一覧

| 書き方 | 対象 |
|---|---|
| `"#id名"` | IDが一致する要素（1つ） |
| `".クラス名"` | クラスが一致する最初の要素 |
| `"タグ名"` | タグ名が一致する最初の要素 |
| `"親 子"` | 親の中にある子要素（例: `"ul li"`） |

### DOM操作メソッドまとめ

| メソッド / プロパティ | 説明 |
|---|---|
| `element.textContent` | 要素のテキストを取得・設定する |
| `element.classList.add("クラス")` | クラスを追加する |
| `element.classList.remove("クラス")` | クラスを削除する |
| `element.classList.toggle("クラス")` | クラスを追加または削除する |
| `element.classList.contains("クラス")` | クラスが付いているか確認する（true/false） |
| `input.value` | 入力欄の値を取得・設定する |
| `document.createElement("タグ名")` | 新しい要素を作る |
| `parent.appendChild(child)` | 親要素の末尾に子要素を追加する |

### よく使うイベント一覧

| イベント名 | 発生するタイミング |
|---|---|
| `"click"` | クリックされた |
| `"input"` | 入力欄の値が変わった（毎文字） |
| `"change"` | フォームの値が変わって、フォーカスが外れた |
| `"keydown"` | キーが押されたとき |
| `"keyup"` | キーが離されたとき |
| `"submit"` | フォームが送信された |

### MDN参考リンク

- [document.querySelector](https://developer.mozilla.org/ja/docs/Web/API/Document/querySelector)
- [EventTarget.addEventListener](https://developer.mozilla.org/ja/docs/Web/API/EventTarget/addEventListener)
- [Element.classList](https://developer.mozilla.org/ja/docs/Web/API/Element/classList)
- [document.createElement](https://developer.mozilla.org/ja/docs/Web/API/Document/createElement)
- [Node.appendChild](https://developer.mozilla.org/ja/docs/Web/API/Node/appendChild)

