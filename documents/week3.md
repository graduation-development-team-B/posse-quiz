# Week03｜Flexboxレイアウト

Week01・02で作ったページは、要素が縦にずらっと並ぶレイアウトでした。

今週は **Flexbox** を使って、要素を**横並び**にしたり、間隔を均等に広げたり、上下中央に揃えたりする方法を学びます。

「親が子を横に並べる」というたった1つの概念が、Webページのレイアウトの多くを支えています。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | Flexboxの基本・justify-contentとalign-itemsの違い・レスポンシブ対応 |
| **作るもの** | 自己紹介カードを3枚横並びで表示するページ（Week01・02とは別の新しいHTML） |
| **完了条件** | カードが横3枚並び、スマホ幅では縦1列になる。使ったFlexboxクラスの理由をPR本文で説明できる |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 0.5〜1h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・ミニドリルでは使わないこと。

---

## インプット

### 1. デフォルトでは要素は縦に積まれる

何もスタイルを指定しなければ、ブラウザは要素を上から下へ縦に積んでいきます。

```html
<div>
  <div>カード1</div>
  <div>カード2</div>
  <div>カード3</div>
</div>
```

これを横並びにしたい時に使うのが **Flexbox** です。

---

### 2. Flexboxの基本：「親」に `flex` をつける

Flexboxは「親要素」に指定します。親に `flex` を指定すると、その「子要素」が横に並びます。

```html
<!-- 親に flex をつける -->
<div class="flex">
  <div>カード1</div>
  <div>カード2</div>
  <div>カード3</div>
</div>
```

これだけでカード1・2・3が横に並びます。

重要なのは、「**flex をつけるのは子を並べたい親**」ということです。子要素自身に `flex` をつけても、その子要素の中身が横並びになるだけで、兄弟要素とは横並びになりません。

```
親（flex）
  ├── 子1    ← 横に並ぶ
  ├── 子2    ← 横に並ぶ
  └── 子3    ← 横に並ぶ
```

Tailwindでは `class="flex"` と書くだけで `display: flex;` が適用されます。

![flex適用前：要素が縦に並ぶ](./images/week02-header-noflex.png)

![display:flex適用：横並びになる](./images/week02-header-semiflex.png)

![ulにもflex適用：メニューが横並び](./images/week02-header-nav.png)

---

### 3. justify-content：横方向の並び方を決める

`flex` を使ったとき、子要素の**横方向**の配置を `justify-content` で決めます。

Tailwindでは `justify-*` の形式で指定します。

```html
<div class="flex justify-between">
  <div>左端</div>
  <div>中央</div>
  <div>右端</div>
</div>
```

| クラス | CSSでの意味 | 見た目 |
|---|---|---|
| `justify-start` | `justify-content: flex-start` | 左寄せ（デフォルト） |
| `justify-center` | `justify-content: center` | 中央寄せ |
| `justify-end` | `justify-content: flex-end` | 右寄せ |
| `justify-between` | `justify-content: space-between` | 両端に1つずつ、残りは均等 |
| `justify-around` | `justify-content: space-around` | 各要素の周囲に均等な余白 |

よく使うのは `justify-center`（ナビゲーションメニューを中央に）と `justify-between`（ヘッダーのロゴとメニューを左右に分ける）です。

---

### 4. align-items：縦方向の揃え方を決める

`flex` を使ったとき、子要素の**縦方向**の揃え方を `align-items` で決めます。

```html
<div class="flex items-center h-16">
  <img src="logo.png" alt="ロゴ" class="w-8 h-8">
  <span class="text-xl font-bold">サイト名</span>
</div>
```

`items-center` で、画像とテキストの高さが違っても上下中央に揃います。

| クラス | CSSでの意味 | 見た目 |
|---|---|---|
| `items-start` | `align-items: flex-start` | 上端揃え |
| `items-center` | `align-items: center` | 上下中央揃え |
| `items-end` | `align-items: flex-end` | 下端揃え |
| `items-stretch` | `align-items: stretch` | 高さを揃えて伸ばす（デフォルト） |

#### justify-content と align-items の違いを整理する

混乱しやすいポイントなので、図で確認しましょう。

`flex`（デフォルトは横方向に並ぶ）の場合：

```
justify-content → 横（主軸）方向を制御
align-items     → 縦（交差軸）方向を制御
```

ヘッダーでよく使うパターン：

```html
<header class="flex justify-between items-center px-6 py-4">
  <span class="text-xl font-bold">LOGO</span>
  <nav>
    <ul class="flex gap-4">
      <li><a href="#">About</a></li>
      <li><a href="#">Works</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
  </nav>
</header>
```

- `justify-between`：ロゴとナビゲーションを左右両端に配置
- `items-center`：ロゴとナビゲーションを上下中央に揃える
- `ul` にも `flex gap-4` をつけて、ナビゲーション項目を横並びにする

![justify-contentとalign-itemsの動き](./images/header-flex.png)

---

### 5. gap：要素と要素の間隔を決める

`flex` の子要素の間隔は `gap` で指定します。各要素に `margin` をつけるよりもシンプルに書けます。

```html
<div class="flex gap-4">
  <div>カード1</div>
  <div>カード2</div>
  <div>カード3</div>
</div>
```

`gap-4` は `gap: 1rem`（16px）の間隔を子要素の間に入れます。

| クラス | 間隔 |
|---|---|
| `gap-2` | 8px |
| `gap-4` | 16px |
| `gap-6` | 24px |
| `gap-8` | 32px |

---

### 6. flex-col：縦方向に並べる

`flex` をつけると子要素は横に並びますが、`flex-col` をつけると縦に並べ直せます。

```html
<!-- 縦並び -->
<div class="flex flex-col gap-4">
  <div>項目1</div>
  <div>項目2</div>
  <div>項目3</div>
</div>
```

一見「縦並びなら flex なしと同じでは？」と思うかもしれませんが、`flex-col` にすることで `justify-content` や `align-items`、`gap` が使えるようになります。

---

### 7. flex-wrap：はみ出した時に折り返す

要素が多くて横に並びきらない時、`flex-wrap` を使うと折り返してくれます。

```html
<div class="flex flex-wrap gap-4">
  <div class="w-64">カード1</div>
  <div class="w-64">カード2</div>
  <div class="w-64">カード3</div>
  <div class="w-64">カード4</div>
</div>
```

画面幅が狭い時は2列になったり1列になったりします。

---

### 8. スマホ幅で縦並びにする（レスポンシブ対応）

Tailwindには「画面幅に応じてスタイルを切り替える」書き方があります。

```html
<div class="flex flex-col md:flex-row gap-4">
  <div>カード1</div>
  <div>カード2</div>
  <div>カード3</div>
</div>
```

- `flex-col`：デフォルト（スマホ幅）では縦並び
- `md:flex-row`：`md`（768px以上）の画面幅では横並びに切り替わる

これがレスポンシブデザインの基本的な書き方です。

| プレフィックス | 適用される画面幅 |
|---|---|
| （なし） | すべての画面幅（スマホ含む） |
| `sm:` | 640px以上 |
| `md:` | 768px以上 |
| `lg:` | 1024px以上 |

「スマホファースト」という考え方で、まずスマホ用のスタイルを書き、そこから大きい画面のスタイルを上書きしていきます。

---

### 9. 実例：3枚のカードを横並びにする

以上を組み合わせると次のようになります。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>自己紹介カード</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50 py-8">
    <main class="max-w-4xl mx-auto px-4">
      <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">チームメンバー</h1>

      <!-- カードを横3枚並びにする。スマホでは縦1列 -->
      <div class="flex flex-col md:flex-row gap-6">

        <div class="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span class="text-4xl">🎸</span>
          <h2 class="text-lg font-bold text-gray-900 mt-3">田中 凛</h2>
          <p class="text-gray-600 text-sm mt-2 text-center">フロントエンドを担当。React好き。</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span class="text-4xl">💻</span>
          <h2 class="text-lg font-bold text-gray-900 mt-3">佐藤 海</h2>
          <p class="text-gray-600 text-sm mt-2 text-center">バックエンドを担当。DBが得意。</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span class="text-4xl">🎨</span>
          <h2 class="text-lg font-bold text-gray-900 mt-3">山本 蒼</h2>
          <p class="text-gray-600 text-sm mt-2 text-center">デザイン担当。Figma使い。</p>
        </div>

      </div>
    </main>
  </body>
</html>
```

各カード自体にも `flex flex-col items-center` をつけています。これでカード内のアイコン・名前・説明が縦方向に並び、左右中央に揃います。

このように、Flexboxは入れ子にして使うことが多いです。「この親の子をどう並べたいか」を考えながら `flex` をつける場所を決めましょう。

---

### 10. ヘッダー・フッターのHTML構造

Flexboxが使われる最もよくある場所がヘッダーです。実際のサイトも同じ構造で作られています。

![AmazonのヘッダーはFlexboxで横並び](./images/week02-amazon.png)

![YouTubeのヘッダーも同様の構造](./images/week02-youtube.png)

#### ヘッダーの基本構造

```html
<header class="bg-white border-b px-6 py-4 flex items-center justify-between">
  <!-- 左：ロゴ -->
  <a href="./index.html">
    <img src="./images/logo.svg" alt="サイトロゴ" class="h-8">
  </a>

  <!-- 右：ナビゲーション -->
  <nav>
    <ul class="flex gap-6">
      <li><a href="#about" class="text-gray-600 hover:text-gray-900">About</a></li>
      <li><a href="#works" class="text-gray-600 hover:text-gray-900">Works</a></li>
      <li><a href="#contact" class="text-gray-600 hover:text-gray-900">Contact</a></li>
    </ul>
  </nav>
</header>
```

![ヘッダーのFlexbox適用前](./images/week02-header-noflex.png)

![display:flex適用後](./images/week02-header-semiflex.png)

![ナビにもflex適用で完成](./images/week02-header-nav.png)

#### フッターの基本構造

```html
<footer class="bg-gray-800 text-white px-6 py-8">
  <div class="max-w-4xl mx-auto flex items-center justify-between">
    <!-- 左：ロゴ -->
    <a href="./index.html">
      <img src="./images/logo-white.svg" alt="サイトロゴ" class="h-6">
    </a>

    <!-- 右：SNSリンク -->
    <ul class="flex gap-4 text-sm">
      <li><a href="https://twitter.com/posse_2023" class="hover:underline">X</a></li>
      <li><a href="https://www.instagram.com/posse_programming/" class="hover:underline">Instagram</a></li>
    </ul>
  </div>
  <p class="text-center text-xs text-gray-400 mt-6">© 2026 POSSE</p>
</footer>
```

---

### 11. 発展：スクロールしてもヘッダーを固定する（`position: fixed`）

多くのサイトでは、スクロールしてもヘッダーが画面上部に固定されています。YouTubeも同様です。Tailwindでは `fixed` クラスと `top-0` `left-0` `w-full` を組み合わせます。

```html
<header class="fixed top-0 left-0 w-full bg-white border-b z-50
               flex items-center justify-between px-6 py-4">
  <!-- ヘッダーの中身 -->
</header>

<!-- ヘッダーの高さ分だけmainを下げる（ヘッダーに隠れないように） -->
<main class="mt-16">
  <!-- コンテンツ -->
</main>
```

| クラス | 意味 |
|---|---|
| `fixed` | スクロールしても位置が動かない |
| `top-0 left-0` | 画面の左上を基準に配置 |
| `w-full` | 横幅を画面いっぱいに |
| `z-50` | 他の要素より手前に表示する（重なり順） |

`z-50`（= `z-index: 50`）が必要な理由：`fixed` で浮かせた要素は、スクロール中に他のコンテンツと重なります。`z-index` の値が大きいほど手前に表示されるので、ヘッダーが隠れないように大きい値を指定します。

---

## ミニドリル（AI禁止・45分）

### 着手前：ゴールUIを分解する（5分）

まず**分解のやり方**を確認してください。今週は「どの親に `flex` を付けるか」を意識して分解します。

![分解の例](./images/week03-breakdown.png)

---

今週のミニドリルで作るUIです。上と同じやり方で、自分でブロックに分解してみましょう。

![Week03 ミニドリル ゴールUI](./images/minidrill-week03-goal.png)

このUIをブロックに分けると何パーツありますか？特に「どの親要素に `flex` を付けるか」を意識して表を埋めてください。

| ブロック名 | 役割 | 付ける親要素 | どの方向に並べるか | 確認方法 |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

---

### 問題1：レシピカード一覧を作る（25分）

上のゴールUIと同じレシピカード一覧をHTMLとTailwindで作ってください。
**完成したらゴールUIのスクショと見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-gray-50` |
| ヘッダー背景 | `bg-white shadow` |
| ヘッダー内レイアウト | `flex justify-between items-center px-6 py-4` |
| カード一覧レイアウト | `flex flex-col md:flex-row gap-4` |
| カード背景 | `bg-white` |
| 角丸 | `rounded-xl` |
| 影 | `shadow` |
| 画像エリア背景 | `bg-amber-100` |
| 画像エリア高さ | `h-36` |
| カード本文パディング | `p-4` |
| 料理名 | `text-base font-bold text-gray-900` |
| 調理時間・カロリー | `text-gray-500 text-sm` |
| タグ背景 | `bg-orange-100` |
| タグ文字 | `text-orange-700 text-xs px-2 py-1 rounded` |
| リンク | `text-orange-500 text-sm font-semibold` |

#### 掲載する内容
- カード1：トマトパスタ / 20分 / 450kcal / タグ:簡単・イタリアン
- カード2：鶏の唐揚げ / 30分 / 620kcal / タグ:揚げ物・定番
- カード3：アボカドサラダ / 10分 / 280kcal / タグ:ヘルシー・サラダ

#### Step 1：「どの親に flex を付けるか」「どの方向に並べるか」を着手前の表で確認してから実装する
#### Step 2：カード1枚だけ先に作って確認し、残り2枚に増やす
#### Step 3：ゴールUIのスクショと見比べて確認する

---

### 問題2：バグ診断

以下のコードは「ヘッダーの左にロゴ、右にナビを配置する」つもりだが、意図通りにならない。何が問題か2点指摘してください。

```html
<header class="flex justify-between p-4 bg-white shadow">
  <a href="/">
    <img src="logo.png" alt="ロゴ" class="w-8 h-8">
  </a>
  <nav>
    <ul class="flex-col gap-4">
      <li><a href="#about">About</a></li>
      <li><a href="#works">Works</a></li>
    </ul>
  </nav>
</header>
```

<details>
<summary>ヒント</summary>

`flex-col` 単体では何も起きません。Flexboxの方向を指定するクラスは、`flex` が前提です。`ul` の子要素をどの方向に並べたいかを考えてみてください。

</details>

<details>
<summary>解答</summary>

問題は2点あります。

1. `<ul>` に `flex` クラスがなく `flex-col` だけがついている。`flex-col`（や `flex-row`）は `flex` が前提のクラスのため、`flex` がなければ何も変わらない。`flex flex-col` か `flex flex-row` のどちらかが必要。
2. ナビ項目を横並びにしたい場合は `flex flex-row gap-4` が正しい（`flex-col` のままだと縦並びになる）。

```html
<!-- 修正後 -->
<ul class="flex flex-row gap-4">
```

`flex-col` や `flex-row` は「Flexboxの並び方向を変える」クラスです。単体では機能せず、必ず `flex` と一緒に使います。

</details>

---

### 問題3：SaaSの料金プランを3列で作る（20分）

`drill-ph1` の `week03-2/` ディレクトリで作業してください。

Flexboxを使って、3つの料金プランカードを横並びで表示してください。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-gray-50` |
| 全体幅 | `max-w-4xl mx-auto` |
| カード一覧レイアウト | `flex gap-6` |
| カード背景 | `bg-white` |
| 角丸 | `rounded-xl` |
| 影 | `shadow` |
| カードパディング | `p-6` |
| カード幅 | `flex-1` |
| プラン名 | `text-xl font-bold` |
| 価格 | `text-3xl font-bold` |
| 真ん中の価格 | `text-blue-600` |
| 月ごとの単位 | `text-gray-400 text-sm` |
| 機能リスト | `space-y-2 text-sm text-gray-600` |
| 通常ボタン | `border border-gray-300 text-gray-700` |
| 真ん中のボタン | `bg-blue-600 text-white` |

#### 掲載する内容
- 無料プラン：¥0 / 月
- 無料プランの機能：プロジェクト1件、ストレージ5GB、メールサポート
- スタンダード：¥1,980 / 月
- スタンダードの機能：プロジェクト10件、ストレージ50GB、チャットサポート
- プロ：¥4,980 / 月
- プロの機能：無制限、ストレージ500GB、専任サポート
- ボタン：すべて「始める」

#### Step 1：3つのカードを入れる親要素を作り、`flex gap-6` を付ける
#### Step 2：カード1枚を作ってから、内容を変えて3枚に増やす
#### Step 3：ゴールUIのスクショと見比べて確認する

---

## POSSE課題

### テーマ：自己紹介カードを3枚横並びで表示するページ

3人分（実在する人でも架空の人でもよい）の自己紹介カードを横3枚並びで表示するページを作成してください。Week01・02とは別の、新しいHTMLファイルを作ります。

**要件:**

- 3枚のカードが横並びで表示されること
- 各カードに次の3要素を含むこと
  - アイコン（絵文字でOK。`span` タグに大きめのテキストサイズをつける）
  - 名前（`h2` など見出しタグを使う）
  - 説明（`p` タグで1〜2文）
- `flex`、`gap`、`items-center`、`justify-between` のいずれかを使うこと（全部使わなくてよいが、横並びを実現するために必要なものは使う）
- スマホ幅（480px以下の目安）では縦1列で表示されること（`flex-col` か `flex-wrap` を使う）
- ページ全体に `max-w-*` と `mx-auto` を使って中央寄せにすること
- **スマホ幅での並び順を自分で判断すること（なぜその順番にしたかをPR本文に書く）**

**提出:**

- GitHubリポジトリにpushしてURL提出。ローカルで動作確認済みであればOK。（Week01のGitHub PagesのURLがある人はそこにも反映されます）

**PR本文に必ず書くこと:**

1. カードを横並びにするために使ったFlexboxクラスと、それぞれを使った理由（3点以上）
2. スマホで縦並びにするために使った方法とその理由
3. 詰まった場所とどう解決したか（1箇所以上）
4. 【発展・任意】AIに同じページを作らせて、自分の作ったものと何が違うか比較して書く

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A（例: flex-col でスマホは名前→説明→アイコンの順にする）:
- 選択肢B（例: flex-col でスマホはアイコン→名前→説明の順にする）:
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

- [ ] 3枚のカードが横並びで表示されている
- [ ] 各カードにアイコン・名前・説明の3要素がある
- [ ] カードを横並びにするために親要素に `flex` をつけた
- [ ] カード間に `gap-*` で間隔をつけた
- [ ] スマホ幅では縦1列になる（`flex-col` または `flex-wrap` を使っている）
- [ ] ページが `max-w-*` と `mx-auto` で中央寄せになっている
- [ ] ローカルで表示を確認した
- [ ] デベロッパーツールのレスポンシブモードでスマホ幅の表示を確認した
- [ ] GitHubリポジトリにpushした
- [ ] PR本文にFlexboxクラスの理由を3点以上書いた
- [ ] PR本文にスマホ対応の方法と理由を書いた
- [ ] PR本文に詰まった場所と解決方法を書いた
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] スマホ幅での並び順の理由をPR本文に書いた
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## DevToolsでレスポンシブを確認する

スマホ幅での表示を確認するには、Chrome の **デベロッパーツール** を使います。

1. Chrome でページを開く
2. `Cmd + Option + I`（Mac）/ `Ctrl + Shift + I`（Windows）でDevToolsを開く
3. ツールバーのスマホアイコン（📱）をクリックするとスマホ幅のプレビューに切り替わる
4. 上部の幅を変えながら、カードが崩れないか確認する

![DevToolsのレスポンシブモード](./images/devtools-responsive.png)

---

## 参考資料

### Flexbox関連クラスまとめ

| クラス | CSSでの意味 | 使う場面 |
|---|---|---|
| `flex` | `display: flex` | 子を横並びにしたい親につける |
| `flex-col` | `flex-direction: column` | 縦並びにしたい（デフォルト方向を縦に） |
| `flex-row` | `flex-direction: row` | 横並びに戻す（`md:flex-row` のように使う） |
| `flex-wrap` | `flex-wrap: wrap` | はみ出した時に折り返す |
| `justify-start` | `justify-content: flex-start` | 横方向：左寄せ |
| `justify-center` | `justify-content: center` | 横方向：中央寄せ |
| `justify-end` | `justify-content: flex-end` | 横方向：右寄せ |
| `justify-between` | `justify-content: space-between` | 横方向：両端 + 均等 |
| `items-start` | `align-items: flex-start` | 縦方向：上端揃え |
| `items-center` | `align-items: center` | 縦方向：中央揃え |
| `items-end` | `align-items: flex-end` | 縦方向：下端揃え |
| `gap-4` | `gap: 1rem` | 子要素の間隔 |

### レスポンシブの基本パターン

```html
<!-- スマホでは縦、PC（md以上）では横 -->
<div class="flex flex-col md:flex-row gap-6">
  ...
</div>
```

今週は `flex-col md:flex-row` のパターンが理解できれば十分です。

> **発展（Week05以降で扱います）**: `sm:w-[calc(50%-0.5rem)]` のような書き方はTailwindの任意値構文といい、中級以上の内容です。今は読まなくて大丈夫です。

### デベロッパーツールでの確認方法

1. Mac: `Cmd + Option + I` / Windows: `F12`
2. 左上のスマホアイコン（「Toggle device toolbar」）をクリック
3. 画面上部のドロップダウンから「Responsive」を選び、幅を変えてみる

幅を480pxや768pxに設定して、縦並びと横並びが切り替わることを確認しましょう。

### 参考動画・記事

理解を深めるために以下を活用してください。

- [Flexboxを完全理解する](https://youtu.be/Ei_GspQuS7A) — display:flex / align-items / justify-contentを視覚的に解説（視聴目安: 00:00〜07:50）
- [Flexbox完全ガイド（日本語）](https://coliss.com/articles/build-websites/operation/css/css-flexbox-cheat-sheet.html) — Flexboxチートシート
- [CSS Flexbox Froggy](https://flexboxfroggy.com/#ja) — ゲーム感覚でFlexboxを練習できるサイト（日本語対応）
