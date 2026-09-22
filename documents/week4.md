# Week04｜Gridレイアウト・擬似クラス

今週のゴールは、Gridを使ったカード一覧レイアウトを作れるようになることと、ホバーエフェクトなど「状態に応じたスタイル」をTailwindで指定できるようになることです。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | CSS Grid、grid-cols、col-span、gap、hover:、odd:/even: |
| **作るもの** | 架空のオンラインショップの商品一覧ページ（新しいHTMLファイル） |
| **完了条件** | Gridを使った一覧を作り、なぜflexではなくgridを選んだかをPR本文で説明できる |
| **所要時間目安** | インプット 1〜1.5h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・ミニドリルでは使わないこと。

---

## インプット

### 1. GridとFlexの役割の違い

Week03ではFlexを使って横並びを作りました。
Gridは「格子状（マス目状）に並べる」レイアウトです。

```html
<!-- Flex: ヘッダーのリンクを横に並べる、プロフィールの画像+文章など -->
<nav class="flex gap-4">
  <a href="#">Top</a>
  <a href="#">About</a>
  <a href="#">Contact</a>
</nav>

<!-- Grid: 商品カード、スキル一覧など「同じ形を繰り返す」 -->
<div class="grid grid-cols-3 gap-4">
  <div>商品A</div>
  <div>商品B</div>
  <div>商品C</div>
</div>
```

**使い分けの目安**

| 場面 | 向いているレイアウト |
|---|---|
| ナビのリンクを横に並べる | Flex |
| 画像+テキストを横に置く | Flex |
| 同じ形のカードを整列させる | Grid |
| ギャラリーや商品一覧 | Grid |

Flexは「子要素の内容量に応じて柔軟に伸縮する」、Gridは「あらかじめ列数を決めて均等に並べる」という違いがあります。どちらも正解がある問題ではなく、「この並べ方にはどちらが素直か」で選びます。

![FlexとGridの使い分け](./images/week04-flex-grid.png)

---

### 2. Gridの基本クラス

Gridを使うときは、並べたい要素の**親**に `grid` を付けます。

```html
<div class="grid grid-cols-3 gap-4">
  <div class="bg-white rounded shadow p-4">カード1</div>
  <div class="bg-white rounded shadow p-4">カード2</div>
  <div class="bg-white rounded shadow p-4">カード3</div>
  <div class="bg-white rounded shadow p-4">カード4</div>
  <div class="bg-white rounded shadow p-4">カード5</div>
  <div class="bg-white rounded shadow p-4">カード6</div>
</div>
```

この場合、6枚のカードが3列×2行に自動で並びます。

よく使うGridクラスです。

| クラス | 意味 |
|---|---|
| `grid` | Gridレイアウトを有効にする |
| `grid-cols-2` | 2列にする |
| `grid-cols-3` | 3列にする |
| `grid-cols-4` | 4列にする |
| `gap-4` | 列・行の間に余白を作る（`gap-x-4` で列間のみ、`gap-y-4` で行間のみ） |
| `col-span-2` | その要素を2列分の幅にする |

---

### 3. col-span で幅を変える

特定のカードだけ幅広にしたいときは `col-span` を使います。

```html
<div class="grid grid-cols-3 gap-4">
  <div class="col-span-2 bg-blue-100 rounded p-4">幅広カード（2列分）</div>
  <div class="bg-white rounded p-4">通常カード</div>
  <div class="bg-white rounded p-4">通常カード</div>
  <div class="bg-white rounded p-4">通常カード</div>
  <div class="bg-white rounded p-4">通常カード</div>
</div>
```

`col-span-2` は「子要素」側に付けます。「親の grid が3列なら、その子に col-span-2 を付けると2列分占有する」という考え方です。

---

### 4. レスポンシブGridの書き方

スマホでは1列、タブレット以上では2列、PCでは4列、という指定は次のように書きます。

```html
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
  <div>カード</div>
  <div>カード</div>
  <div>カード</div>
  <div>カード</div>
</div>
```

Tailwindはモバイルファーストなので、接頭辞なし（`grid-cols-1`）がスマホ幅のデフォルトになります。

| 接頭辞 | ブレイクポイント | 目安の画面幅 |
|---|---|---|
| なし | 全画面（最小幅から） | 0px〜 |
| `sm:` | 640px以上 | スマホ横・小さいタブレット |
| `md:` | 768px以上 | タブレット |
| `lg:` | 1024px以上 | PC |

---

### 5. hover: で状態に応じたスタイル

Tailwindでは `hover:` を接頭辞に付けると、マウスが乗った（ホバー）ときだけ効くクラスになります。

```html
<div class="bg-white rounded shadow p-4 hover:shadow-lg hover:bg-gray-50">
  マウスを乗せると影が濃くなります
</div>
```

`hover:` はどのクラスにも付けられます。

| クラス | 意味 |
|---|---|
| `hover:shadow-lg` | ホバー時に影を強くする |
| `hover:bg-gray-50` | ホバー時に背景色を変える |
| `hover:text-blue-600` | ホバー時に文字色を変える |
| `hover:scale-105` | ホバー時に少し拡大する |
| `hover:opacity-80` | ホバー時に少し透明にする |

`hover:scale-105` を使う場合は、なめらかに変化させるために `transition` クラスも一緒に付けると自然な動きになります。

```html
<div class="transition hover:scale-105">ふわっと拡大</div>
```

---

### 6. odd: / even: で行ごとに色を変える

リストやテーブルで「1行おきに色を変えたい」場合、Tailwindでは `odd:` と `even:` を使います。

```html
<ul>
  <li class="odd:bg-white even:bg-gray-50 p-2">商品A</li>
  <li class="odd:bg-white even:bg-gray-50 p-2">商品B</li>
  <li class="odd:bg-white even:bg-gray-50 p-2">商品C</li>
  <li class="odd:bg-white even:bg-gray-50 p-2">商品D</li>
</ul>
```

奇数番目は `odd:` のスタイル、偶数番目は `even:` のスタイルが適用されます。

![擬似クラスなしの状態](./images/week03-pseudo-none.png)
![擬似クラスを使った例](./images/week03-pseudo.png)

---

### 7. 完成例：商品カード一覧

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>商品一覧</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 p-6">
    <h1 class="text-2xl font-bold mb-6">商品一覧</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
        <div class="text-4xl mb-2">👟</div>
        <h2 class="font-bold">スニーカー</h2>
        <p class="text-gray-500 text-sm mt-1">¥8,800</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
        <div class="text-4xl mb-2">👜</div>
        <h2 class="font-bold">トートバッグ</h2>
        <p class="text-gray-500 text-sm mt-1">¥4,400</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
        <div class="text-4xl mb-2">🧢</div>
        <h2 class="font-bold">キャップ</h2>
        <p class="text-gray-500 text-sm mt-1">¥2,200</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
        <div class="text-4xl mb-2">🧣</div>
        <h2 class="font-bold">マフラー</h2>
        <p class="text-gray-500 text-sm mt-1">¥3,300</p>
      </div>
    </div>
  </body>
</html>
```

---

### 8. よくある間違いと確認ポイント

#### 「grid を子に付けてしまう」

```html
<!-- 間違い: gridを子要素に付けている -->
<div>
  <div class="grid grid-cols-3">カード1</div>
  <div>カード2</div>
  <div>カード3</div>
</div>
```

```html
<!-- 正しい: gridを親要素に付ける -->
<div class="grid grid-cols-3 gap-4">
  <div>カード1</div>
  <div>カード2</div>
  <div>カード3</div>
</div>
```

`grid` と `grid-cols-*` は「子要素をどう並べるか」を指定するため、必ず**並べる側の親**に付けます。

#### 「gap が効いていない」

`gap` は `grid` または `flex` が付いている要素に付けると有効です。どちらも付いていない要素に `gap` だけ付けても効きません。

#### 「hover:が効いていない」

CDNを使っていれば基本的に動作しますが、Tailwindのビルドツールを使っている環境では設定が必要な場合があります。今週はCDN（`<script src="https://cdn.tailwindcss.com"></script>`）を使っているので問題ありません。

---

### 9. 実務でよく使うGridパターン

#### ブログ記事一覧

```html
<section class="max-w-5xl mx-auto px-4 py-8">
  <h2 class="text-2xl font-bold mb-6">最新記事</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <article class="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
      <div class="bg-gray-200 h-40"></div>
      <div class="p-4">
        <h3 class="font-bold mb-1">記事タイトル1</h3>
        <p class="text-gray-500 text-sm">2025年5月11日</p>
      </div>
    </article>
    <article class="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
      <div class="bg-gray-200 h-40"></div>
      <div class="p-4">
        <h3 class="font-bold mb-1">記事タイトル2</h3>
        <p class="text-gray-500 text-sm">2025年5月10日</p>
      </div>
    </article>
    <article class="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
      <div class="bg-gray-200 h-40"></div>
      <div class="p-4">
        <h3 class="font-bold mb-1">記事タイトル3</h3>
        <p class="text-gray-500 text-sm">2025年5月9日</p>
      </div>
    </article>
  </div>
</section>
```

#### ギャラリー（大きなメイン画像 + 小さいサブ画像）

```html
<div class="grid grid-cols-3 gap-2">
  <div class="col-span-2 bg-gray-300 h-48 rounded"></div>
  <div class="grid gap-2">
    <div class="bg-gray-200 rounded"></div>
    <div class="bg-gray-200 rounded"></div>
  </div>
</div>
```

`col-span-2` でメイン画像が2列分を占め、残り1列にサブ画像が縦に並ぶ構成です。

---

## ミニドリル（AI禁止・75分）

### 着手前：Gridの親子関係を分解する（5分）

まず**分解のやり方**を確認してください。作る前に「どの要素が親か・子か」「何を変えるか」を決めてから手を動かすのが今週のポイントです。

> 分解の例はWeek03の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

今週は「どの親に `grid` を付けるか」「どの子に `col-span-*` や `hover:*` を付けるか」を先に決めてから書き始めます。

コードを書く前に、各問題で次の表を埋めてください。

| 見る場所 | 書くこと |
|---|---|
| 完成状態 | 何を何個並べるUIか |
| Gridの親 | `grid grid-cols-* gap-*` を付ける要素 |
| Gridの子 | 並ぶカード・ウィジェット・記事など |
| 幅を変える子 | `col-span-*` を付ける要素 |
| 状態変化 | `hover:*` で何を変えるか |
| 確認方法 | Live ServerまたはChromeで開き、`goal.png` と見比べる |

---

### 問題1：ダッシュボード風ウィジェットを作る（25分）

`drill-ph1` の `week04-1/` ディレクトリで作業してください。

色付きの `div` だけを使って、ダッシュボード風のウィジェットを作ります。画像は使いません。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-gray-100` |
| 全体幅 | `max-w-4xl mx-auto` |
| グリッド | `grid grid-cols-3 gap-4` |
| ウィジェット共通 | `rounded-xl p-6 shadow-sm` |
| bigウィジェット | `col-span-2 bg-blue-100` |
| 売上ウィジェット | `bg-green-100` |
| 注文ウィジェット | `bg-yellow-100` |
| 新規会員ウィジェット | `bg-purple-100` |
| ラベル | `text-sm font-bold` |
| bigの数値 | `text-4xl font-bold` |
| 通常の数値 | `text-2xl font-bold` |

#### 掲載する内容

| ウィジェット | 背景 | 内容 |
|---|---|---|
| 訪問者数 | `bg-blue-100` | `訪問者数` / `12,430` / `先週比 +8%` |
| 売上 | `bg-green-100` | `売上` / `¥482,000` |
| 注文 | `bg-yellow-100` | `注文` / `128件` |
| 新規会員 | `bg-purple-100` | `新規会員` / `34名` |

#### Step 1：着手前の表で「Gridの親」と「col-spanを付ける子」を決める

`grid grid-cols-3 gap-4` は4つのウィジェットを包む親に付けます。`col-span-2` は親ではなく、幅広にしたい「訪問者数」ウィジェットに付けます。

#### Step 2：bigウィジェットを1つ作ってから、通常ウィジェットを3つ追加する

最初に `col-span-2 bg-blue-100` のカードだけを作り、2列分の幅になっているか確認します。その後、売上・注文・新規会員を追加します。

#### Step 3：`goal.png` と見比べて確認する

Chromeで `index.html` を開き、bigウィジェットが2列分、他の3つが1列分になっているか確認してください。

---

### 問題2：バグ診断（`hover:` の使い方ミス）（15分）

`drill-ph1` の `week04-2/` ディレクトリで作業してください。

次のコードは「ホバーしたらボタンの背景色を濃くする」つもりですが、ホバーしても変化しません。何が問題か説明し、修正してください。

```html
<a href="#" class="bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover: bg-blue-700 transition">
  詳細を見る
</a>
```

#### 仕様

| 項目 | 正しい書き方 |
|---|---|
| 通常背景 | `bg-blue-600` |
| ホバー背景 | `hover:bg-blue-700` |
| 文字 | `text-white font-bold` |
| 角丸 | `rounded-lg` |
| 余白 | `px-5 py-3` |
| なめらかな変化 | `transition` |

#### 掲載する内容

- 見出し：ホバー診断カード
- 説明：マウスを乗せるとボタンの色が変わります
- ボタン：詳細を見る
- 修正対象：`hover: bg-blue-700` を `hover:bg-blue-700` に直す

#### Step 1：バグの原因を文章で書く

`hover:` と `bg-blue-700` の間にスペースがあると、Tailwindは `hover:bg-blue-700` という1つのクラスとして認識できません。

#### Step 2：クラス名を1つだけ直す

`hover: bg-blue-700` ではなく、スペースなしの `hover:bg-blue-700` にしてください。

#### Step 3：Chromeでホバーして確認する

ボタンにマウスを乗せたときだけ背景色が濃くなればOKです。

<details>
<summary>解答</summary>

```html
<a href="#" class="bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
  詳細を見る
</a>
```

`hover:` はCSSの擬似クラスをTailwindで書くための接頭辞です。`hover:bg-blue-700` までを1つのクラス名として書く必要があります。

</details>

---

### 問題3：ヘッダー + Grid + 画像の復習ページを作る（20分）

`drill-ph1` の `week04-3/` ディレクトリで作業してください。`images/team.svg` が入っています。

Week01〜03の復習として、画像・ヘッダーのFlexbox・メインコンテンツのGridを組み合わせたページを作ります。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-slate-100` |
| ヘッダー | `bg-white shadow` |
| ヘッダー内レイアウト | `flex justify-between items-center px-6 py-4` |
| ナビ | `flex gap-4 text-sm` |
| メイン幅 | `max-w-5xl mx-auto px-6 py-8` |
| メインGrid | `grid grid-cols-3 gap-4` |
| メインカード | `col-span-2 bg-white rounded-xl shadow p-6` |
| サイドカード | `bg-white rounded-xl shadow p-6` |
| 画像 | `<img src="./images/team.svg" alt="学習チームのイラスト" class="w-full h-48 object-cover rounded-lg">` |
| カードホバー | `hover:shadow-lg transition` |

#### 掲載する内容

- ヘッダーロゴ：POSSE Studio
- ナビ：About / Works / Contact
- メイン見出し：仲間と作るWebページ
- 本文：HTMLの構造、Flexboxの横並び、Gridのカード配置を組み合わせて練習します。
- サイドカード3つ：HTML復習 / Flex復習 / Grid練習

#### Step 1：ヘッダーだけ作り、`flex justify-between` が効いているか確認する

左にロゴ、右にナビが分かれていればOKです。ナビの中も `flex gap-4` で横並びにします。

#### Step 2：メインコンテンツの親に `grid grid-cols-3 gap-4` を付ける

大きい紹介カードには `col-span-2`、右側の小さいカードエリアは1列分にします。

#### Step 3：画像パスとGridの列幅を確認する

画像が表示されているか、メインカードが2列分・サイドカードが1列分になっているかを `goal.png` と見比べてください。

---

## POSSE課題

### テーマ：架空のオンラインショップの商品一覧ページ

架空のオンラインショップの商品一覧ページを新しいHTMLファイルとして作ってください。Week03までのプロフィールページとは別の、独立した新しいページです。

**要件:**
- 商品カードを8枚以上並べる
- 各カードには「画像（絵文字でよい）」「商品名」「価格」を含める
- グリッドで並べる（スマホで1〜2列、PCで4列程度）
- `hover:` を使って、マウスを乗せたときにカードの見た目が変わるエフェクトを付ける
- ページ全体のレイアウト（ヘッダーや余白など）も整える
- **ホバー時のエフェクトを自分で選ぶこと（shadow-lg・scale-105・bg変化など。採用理由をPR本文に書く）**

**提出:**
- GitHubリポジトリにpushしてURLを提出。ローカルで動作確認済みであればOK

**PR本文に必ず書くこと:**
1. なぜgridを選んだか、flexとの違いは何か（自分の言葉で）
2. `hover:` で何を変えたか、どの要素に付けたか
3. レスポンシブで何列から何列に変えたか（例：スマホ1列 → PC4列）
4. 詰まった場所とどう解決したか（1箇所以上）
5. 【発展・任意】AIに同じページを作らせて、自分のコードと何が違うか比較する

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A（例: hover:shadow-lg を使う）:
- 選択肢B（例: hover:scale-105 を使う）:
- 採用した理由:
- 確認方法:

## AI利用
AIを使った場合は以下を記入してください（使っていない場合は「未使用」と書く）:
- 使ったAIツールとプロンプトの概要:
- AIが生成したコードをどう使ったか:

AIを使って生成したコードは、必ず以下を自分で確認してください:
- [ ] 指定した要件を満たしているか（要件表と照合）
- [ ] スマホ幅（375px）で崩れていないか（DevToolsで確認）
- [ ] AIが生成したクラスの意味を1つ以上説明できるか

### チェックポイント

- [ ] 新しいHTMLファイルを作った（プロフィールページへの追記ではない）
- [ ] 商品カードに画像・商品名・価格が含まれている
- [ ] 親要素に `grid` と `grid-cols-*` を付けた
- [ ] `hover:` でカードにホバーエフェクトをつけた
- [ ] スマホ幅でも崩れていない
- [ ] ローカルで表示を確認した
- [ ] GitHubリポジトリにpushした
- [ ] PR本文に詰まった場所と解決方法を書いた
- [ ] PR本文に「なぜgridを選んだか」を自分の言葉で書いた
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] ホバーエフェクトの採用理由をPR本文に書いた
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## この週の分解の型

商品一覧ページを作るとき、「まずGridで並べる」と思っても、どの要素が親でどの要素が子なのかが混乱しやすいです。

作る前に次の順番で分解することで、迷いを減らせます。

| 段階 | 書くこと |
|---|---|
| 1. 完成状態 | 何を並べるページか |
| 2. 並べる要素 | カード / 記事 / 商品 など |
| 3. 親要素 | gridを付ける要素（例：`<div class="grid">`） |
| 4. 子要素 | 並ぶ要素（例：各商品カードの `<div>`） |
| 5. 列数 | スマホ何列・PCで何列 |
| 6. ホバー | 何を変えるか（影・背景色・拡大など） |
| 7. 確認方法 | ブラウザでの見た目、スマホ幅での確認 |

良い分解：

```md
商品カードを8枚並べる一覧ページを作る。
並べる要素は商品カード（div.card）。
親のdivにgrid grid-cols-1 md:grid-cols-4を付ける。
ホバーで shadow-lg と scale-105 を付ける。
DevToolsのレスポンシブモードで375px・1280pxで確認する。
```

悪い分解：

```md
グリッドで並べる。
ホバーエフェクトをつける。
いい感じにする。
```

悪い例は「どの要素が親か」「何列か」「何を変えるか」が見えません。

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### Tailwind Grid クラス一覧（よく使うもの）

| クラス | 説明 |
|---|---|
| `grid` | Gridレイアウトを有効にする |
| `grid-cols-1` 〜 `grid-cols-12` | 列数を指定する |
| `col-span-1` 〜 `col-span-12` | 子要素が占める列数を指定する |
| `col-span-full` | 子要素をすべての列幅にする |
| `gap-1` 〜 `gap-16` | 行・列の間に余白を作る |
| `gap-x-4` | 列間だけに余白を作る |
| `gap-y-4` | 行間だけに余白を作る |
| `grid-rows-2` | 行数を指定する（使用頻度は低め） |

### Tailwind hover: / transition 関連

| クラス | 説明 |
|---|---|
| `hover:*` | マウスが乗ったときだけ効くクラス |
| `transition` | すべてのプロパティ変化をアニメーションにする |
| `transition-colors` | 色の変化だけをアニメーションにする |
| `transition-shadow` | 影の変化だけをアニメーションにする |
| `duration-200` | アニメーションの時間（200ms） |

### MDN参考リンク

- [CSS Grid Layout](https://developer.mozilla.org/ja/docs/Web/CSS/CSS_grid_layout)
- [Tailwind CSS Grid公式ドキュメント](https://tailwindcss.com/docs/grid-template-columns)
- [Tailwind CSS Hover, Focus & Other States](https://tailwindcss.com/docs/hover-focus-and-other-states)

### 参考動画・記事

- [CSS Gridレイアウト入門](https://youtu.be/oRQBrllOzYE) — grid-template-columnsからfrまで、日本語で丁寧に解説
- [CSS Grid Garden](https://cssgridgarden.com/#ja) — ゲーム形式でCSSグリッドを練習（日本語対応）
- [Tailwind CSS Grid（公式）](https://tailwindcss.com/docs/grid-template-columns) — クラス名一覧
