# Week08｜配列・オブジェクト・ループ

JavaScriptで「複数のデータをまとめて扱う」方法を学びます。配列とオブジェクトを使いこなせると、チームメンバー一覧・商品リスト・TODOリストなど、現実のアプリで必要なデータ表示が一気にできるようになります。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | 配列（`[]`）、オブジェクト（`{key: value}`）、`forEach`、`map`、DOM操作との組み合わせ |
| **作るもの** | 架空のチームメンバー一覧ページ（JSの配列データからカードを動的に生成） |
| **完了条件** | 配列・オブジェクトの違いを説明でき、`forEach` でHTMLカードを動的に生成できる |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・自信度チェック・ミニドリルでは使わないこと。

---

## インプット

### 1. 配列とは

配列は「複数の値をひとまとめにして管理する入れ物」です。変数を1つずつ作る代わりに、1つの変数に複数の値を並べて格納できます。

```js
// 変数を1つずつ作ると面倒
const name1 = "田中";
const name2 = "鈴木";
const name3 = "佐藤";

// 配列なら1つにまとめられる
const names = ["田中", "鈴木", "佐藤"];
```

`[` と `]` で囲み、値をカンマで区切ります。中に入れる値の種類は数値でも文字列でも何でも構いません。

#### 要素の取得（インデックス番号）

配列の各要素には、先頭から順に **0, 1, 2, ...** という番号が割り振られます。これをインデックス番号と呼びます。

```js
const names = ["田中", "鈴木", "佐藤"];

console.log(names[0]); // 田中
console.log(names[1]); // 鈴木
console.log(names[2]); // 佐藤
```

「0から始まる」のは最初だけ意識しづらいですが、プログラミング全般で共通のルールです。

#### length（要素の数）

`.length` で配列に何個の要素が入っているかを取得できます。

```js
const names = ["田中", "鈴木", "佐藤"];
console.log(names.length); // 3
```

---

### 2. 配列を操作する主なメソッド

#### push（末尾に追加）

```js
const names = ["田中", "鈴木"];
names.push("佐藤");
console.log(names); // ["田中", "鈴木", "佐藤"]
```

#### pop（末尾を削除）

```js
const names = ["田中", "鈴木", "佐藤"];
names.pop();
console.log(names); // ["田中", "鈴木"]
```

---

### 3. オブジェクトとは

配列は「値の集合」ですが、各値に**名前（キー）**をつけて管理したいときは**オブジェクト**を使います。

```js
// 配列だとどの値が何を意味するか分かりにくい
const user = ["田中太郎", 22, "デザイナー"];

// オブジェクトなら名前がついて意味が明確になる
const user = {
  name: "田中太郎",
  age: 22,
  role: "デザイナー",
};
```

`{` と `}` で囲み、`キー: 値` の形で書きます。複数のプロパティはカンマで区切ります。

#### ドット記法でアクセス

```js
const user = {
  name: "田中太郎",
  age: 22,
  role: "デザイナー",
};

console.log(user.name); // 田中太郎
console.log(user.age);  // 22
console.log(user.role); // デザイナー
```

`オブジェクト名.キー名` でその値を取得できます。

---

### 4. 配列の中にオブジェクト（最重要パターン）

実際のアプリでは「複数人のデータをまとめて扱う」場面が多いです。そのときは**配列の中にオブジェクトを入れる**パターンをよく使います。

```js
const members = [
  { name: "田中太郎", role: "デザイナー", comment: "UIにこだわっています" },
  { name: "鈴木花子", role: "エンジニア", comment: "バックエンドが得意です" },
  { name: "佐藤次郎", role: "PdM",       comment: "ユーザー視点を大切に" },
];
```

各メンバーのデータが1つのオブジェクトになっており、それが配列に並んでいます。

- `members[0]` → 田中太郎さんのオブジェクト全体
- `members[0].name` → `"田中太郎"`
- `members[1].role` → `"エンジニア"`

---

### 5. forEach でループする

`forEach` は、配列の要素を1つずつ取り出して同じ処理を繰り返すメソッドです。

```js
const names = ["田中", "鈴木", "佐藤"];

names.forEach(function(name) {
  console.log(name);
});
// 田中
// 鈴木
// 佐藤
```

アロー関数で書くと少し短くなります。

```js
names.forEach((name) => {
  console.log(name);
});
```

配列の中にオブジェクトが入っている場合も同じように書けます。

```js
const members = [
  { name: "田中太郎", role: "デザイナー" },
  { name: "鈴木花子", role: "エンジニア" },
];

members.forEach((member) => {
  console.log(member.name + " / " + member.role);
});
// 田中太郎 / デザイナー
// 鈴木花子 / エンジニア
```

---

### 6. map で新しい配列を作る

`map` は配列の各要素を変換し、**新しい配列**を返すメソッドです。`forEach` との違いは「結果を新しい配列として受け取れる」点です。

```js
const numbers = [1, 2, 3, 4];

const doubled = numbers.map(function(n) {
  return n * 2;
});

console.log(doubled);  // [2, 4, 6, 8]
console.log(numbers);  // [1, 2, 3, 4]（元の配列は変わらない）
```

`map` では必ず `return` が必要です。`forEach` との使い分けは次の通りです。

| | forEach | map |
|---|---|---|
| 用途 | 各要素に対して処理を実行する | 各要素を変換した新しい配列が欲しい |
| 戻り値 | なし（`undefined`） | 新しい配列 |

---

### 7. forEach + DOM操作でHTML要素を動的に生成する（今週のメイン）

配列のデータを画面に表示するには、`forEach` でループしながら `createElement` でHTML要素を作り、`appendChild` で追加していきます。

**完全なサンプルコード（コピーして動かしてみましょう）:**

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <title>チームメンバー一覧</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 p-8">
    <h1 class="text-2xl font-bold mb-6">チームメンバー</h1>
    <div id="memberList" class="grid gap-4"></div>

    <script>
      const members = [
        { name: "田中太郎", role: "デザイナー", comment: "UIにこだわっています" },
        { name: "鈴木花子", role: "エンジニア", comment: "バックエンドが得意です" },
        { name: "佐藤次郎", role: "PdM",       comment: "ユーザー視点を大切に" },
      ];

      const memberList = document.getElementById("memberList");

      members.forEach((member) => {
        // カード要素を作る
        const card = document.createElement("div");
        card.className = "bg-white rounded-lg shadow p-4";

        // カードの中身を設定する
        card.innerHTML = `
          <h2 class="text-lg font-bold">${member.name}</h2>
          <p class="text-blue-600 text-sm">${member.role}</p>
          <p class="text-gray-600 mt-2">${member.comment}</p>
        `;

        // リストに追加する
        memberList.appendChild(card);
      });
    </script>
  </body>
</html>
```

処理の流れを分解すると次のようになります。

| 段階 | コード | 意味 |
|---|---|---|
| 1. データを定義 | `const members = [...]` | 表示したいデータを配列で用意 |
| 2. 挿入先を取得 | `getElementById("memberList")` | HTMLの挿入先の要素を取得 |
| 3. ループ開始 | `members.forEach((member) => {` | 配列を1件ずつ処理 |
| 4. 要素を作成 | `createElement("div")` | 新しいdiv要素を作る |
| 5. 中身を設定 | `innerHTML = ...` | テンプレートリテラルで内容を書く |
| 6. 追加 | `appendChild(card)` | 挿入先に追加 |

`${member.name}` のようにバッククォート（`` ` ``）で囲んだ文字列の中に変数を埋め込む書き方を**テンプレートリテラル**と呼びます。文字列連結（`+`）より読みやすいのでよく使います。

---

### 8. filter で絞り込む（発展）

`filter` は条件に合う要素だけを取り出した新しい配列を返すメソッドです。「役割がエンジニアのメンバーだけ表示する」ような絞り込みに使います。

```js
const members = [
  { name: "田中太郎", role: "デザイナー" },
  { name: "鈴木花子", role: "エンジニア" },
  { name: "佐藤次郎", role: "エンジニア" },
];

const engineers = members.filter((member) => {
  return member.role === "エンジニア";
});

console.log(engineers);
// [{ name: "鈴木花子", role: "エンジニア" }, { name: "佐藤次郎", role: "エンジニア" }]
```

`filter` の結果も配列なので、そのまま `forEach` でループして表示できます。

---

## ミニドリル（AI禁止・60分）

### 着手前：着手前分解表（5分）

まず**分解のやり方**を確認してください。「どんなデータ・どんなループ・どこに追加するか」を先に決めてからコードを書きます。

> 分解の例はWeek03の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

| 項目 | 書くこと |
|---|---|
| データ形 | 配列の中身はオブジェクトか、何キーがあるか |
| ループ | `forEach` で何を1件ずつ作るか（`tr` か `li` か） |
| DOM | どの親に `appendChild` するか |
| map と forEach | 今回どちらを使う理由 |
| 確認方法 | 行が足りているか・Console に `undefined` がないか |

---

### 問題1：部室備品リスト（forEach × テーブル）（20分）

`drill-ph1` の `week08-1/` で、配列 `items` を **`forEach` で `<tbody>` に行追加**してください。

仕様表と `goal.png` を参考に実装します。`innerHTML` で一気に `tr` を組んでも、`createElement("tr")` でセルを足しても構いません。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス / 内容 |
|---|---|
| ページ背景 | `bg-gray-50` |
| テーブル | `bg-white rounded-xl shadow overflow-hidden` |
| thead | `bg-gray-100` |
| 列 | 備品名 / 数量 / 借用者 |
| 借用者が「なし」の行 | `text-gray-400`（それ以外は `text-gray-800`） |

#### 掲載する内容

```js
const items = [
  { name: "プロジェクター", qty: 1, borrower: "田中" },
  { name: "ホワイトボード", qty: 2, borrower: "なし" },
  { name: "延長コード", qty: 3, borrower: "佐藤" },
  { name: "スピーカー", qty: 1, borrower: "なし" },
];
```

#### Step 1：`tbody#tableBody` を `getElementById` で取得し、初期は空のままにする

#### Step 2：`items.forEach` の中で `tr` を作り、3セル（name / qty / borrower）のデータを入れる。borrowerが「なし」かどうかで文字色クラスを切り替える

#### Step 3：`goal.png` と行数・文字・借用者の色を照合する

---

### 問題2：バグ診断（map の return）（15分）

`drill-ph1` の `week08-2/` ディレクトリで作業してください。

`week08-2/index.html` では、Console に **`undefined`** が混ざったリストになっています。

`map` のコールバックで**値を返していない**のが原因です。「名前 · 役割」の文字列を **return** して表示を直してください。

![Week08 ミニドリル 問題2 ゴールUI](./images/minidrill-week08-2.png)

<details>
<summary>解答の要点</summary>

`map` は**新しい配列の要素になる値を `return` する**のが必須です。`forEach` だと戻り値は使われません。今回は `m.name + " · " + m.role` を `return` します。

</details>

---

### 問題3：名前ソート＋復習（DOM・イベント）（25分）

`drill-ph1` の `week08-3/` ディレクトリで作業してください。

`week08-3/` で、メンバー配列をカード表示し、**「名前順に並べる」**ボタンで **日本語の文字順**（`localeCompare`）に並べ替えたあと、再度 `forEach` で描画し直します。

- `members = members.slice().sort(...)` のように**元配列を壊さない**書き方にする
- ヘッダーに見出し・説明・ボタン（Week01〜07で使ってきた構造の復習）

![Week08 ミニドリル 問題3 ゴールUI](./images/minidrill-week08-3.png)

#### Step 1：仕様表と `goal.png` を見ながら HTML 骨格を組み、レイアウトを揃える

#### Step 2：ソート後に `container.innerHTML = ""` で一度空にしてからカードを付け直す（または `replaceChildren`）

#### Step 3：ボタンを複数回押しても破綻しないか確認する

---

## POSSE課題

### テーマ：架空のチームメンバー一覧ページ

**前週（Week07）とは別の、新しいHTMLファイル**を作ってください。今週覚えた配列・オブジェクト・`forEach` を使って、JSのデータからHTMLカードを動的に生成します。

**要件:**
- JSの配列にメンバーデータ（名前・役割・コメント）を5人分定義する
- `forEach` でループして、各メンバーのHTMLカードを動的に生成してページに表示する
- カードにはメンバーの名前・役割・コメントをすべて表示する
- Tailwind CSSでカードのデザインを整える（`bg-white`・`rounded`・`shadow` などを活用）
- GitHubリポジトリにpushしてURLを提出。ローカルで動作確認済みであればOK
- **データの並び順の初期値を自分で決めること（追加した順・名前順・役割順など。なぜその順にしたかをPR本文に書く）**

**【発展・任意】**
- ページ上にボタンを複数設置し（例：「全員」「エンジニア」「デザイナー」）、ボタンをクリックすると役割で絞り込んで表示が切り替わる機能を実装する
- 絞り込みには `filter` を使う

**提出:**
- GitHubリポジトリURL

**PR本文に必ず書くこと:**
1. 配列・オブジェクトの組み合わせ方や、`forEach` でDOM生成する流れを自分の言葉で説明する（3点以上）
2. 詰まった場所とどう解決したか（1箇所以上）
3. 【発展・任意】絞り込み機能を実装した場合、`filter` がどんな配列を返すか実際に `console.log` で確認した結果を書く

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A（例: 配列の並び順を追加した順にする）:
- 選択肢B（例: 配列の並び順を名前順にする）:
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

- [ ] JSの配列にオブジェクトが5個以上定義されている
- [ ] `forEach` でループしてカード要素を動的に生成している
- [ ] `createElement` と `appendChild`（または `innerHTML`）を使ってカードをDOMに追加している
- [ ] 各カードにメンバーの名前・役割・コメントが表示されている
- [ ] Tailwindで見た目が整っている
- [ ] リポジトリURLが提出されており、ローカルで動作確認済みである
- [ ] PR本文に実装の説明と詰まった箇所の記録がある
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] データの並び順の初期値と選んだ理由をPR本文に書いた
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIとの比較を記録した（Week06以降必須）
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### 配列メソッド一覧

| メソッド | 説明 | 備考 |
|---|---|---|
| `push(要素)` | 配列の末尾に要素を追加する | 元の配列を書き換える |
| `pop()` | 配列の末尾の要素を取り除く（返り値は取り除いた要素） | 元の配列を書き換える |
| `forEach((要素, index?) => { ... })` | 要素を順に処理する（副作用向け） | 新しい配列は返さない |
| `map((要素) => { return 変換後 })` | 各要素を変換した新しい配列を返す | `return` が必要 |
| `filter((要素) => { return 条件 })` | 条件が真の要素だけの新しい配列を返す | `return` で真偽値を返す |

### オブジェクト操作

| 書き方 | 例 | いつ使うか |
|---|---|---|
| **ドット記法** | `member.name` | キー名がコード上で決まっているとき（基本はこちら） |
| **ブラケット記法** | `member["name"]` | キーが変数のとき・特殊文字を含むとき |

### MDN参考リンク

- [配列（Array）](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [Array.prototype.forEach](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
- [Array.prototype.map](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- [Array.prototype.filter](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
- [オブジェクト（Object）](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object)
- [Learn JavaScript — 配列](https://developer.mozilla.org/ja/docs/Learn/JavaScript/First_steps/Arrays)（MDN Learn）

### 参考動画・記事

- [【JavaScript入門】配列とオブジェクトをわかりやすく解説](https://youtu.be/ZkEMfqQQwdU) — 配列の基本とインデックス（視聴目安: 約15分）
- [JavaScriptのmap・filter・forEachの違い](https://youtu.be/yuxiywzRKDw) — 3つのメソッドの役割の違い（視聴目安: 約10分）
- [オブジェクトとプロパティアクセス【JavaScript】](https://youtu.be/KyDwVCGtRwU) — ドット記法・ブラケット記法のイメージ（視聴目安: 約15分）
