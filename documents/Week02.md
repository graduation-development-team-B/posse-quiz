# Week02｜Tailwindで見た目を整える

Week01ではHTMLでページの骨組みを作り、GitHub Pagesで公開しました。

今週は **Tailwind CSS** を本格的に使って、余白・文字・色・カードレイアウトを整えます。「なんとなく見た目をよくする」ではなく、どのクラスを何のために使ったか説明できる状態を目指します。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | Tailwindの余白・幅・文字・色・カード・hover |
| **作るもの** | 架空のカフェのメニューページ（Week01とは別の新しいHTML） |
| **完了条件** | 使ったTailwindクラスの役割をPR本文で説明できる |
| **所要時間目安** | インプット 1〜1.5h、ミニドリル 0.5〜1h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・ミニドリルでは使わないこと。

---

## インプット

### 1. TailwindはCSSの便利な道具

Week01 で `class="text-3xl font-bold"` のようなクラスを使いましたが、これは何をしているのでしょうか？

Tailwind は、よく使う CSS の指定に短いクラス名をつけてくれたフレームワークです。

例えば `p-4` というクラスは、裏側では次のCSSと同じ意味です。

```css
padding: 1rem; /* 1rem = 16px */
```

自分で CSS ファイルを作って `padding: 1rem;` と書く代わりに、`class="p-4"` と書くだけで済む、ということです。

今週は「どのクラスが何のCSSに対応するか」という対応関係を意識しながら使ってみましょう。

![Tailwindクラスのサンプル](./images/tailwind-sample.png)

---

### 2. 余白：内側と外側を分けて考える

余白はページの読みやすさに大きく影響します。Tailwindでは2種類の余白を別々に指定します。

- `p`（padding）：要素の**内側**の余白
- `m`（margin）：要素の**外側**の余白、つまり隣の要素との距離

![ボックスモデルのイメージ](./images/box-model.png)

![marginとpaddingの違い](./images/week02-margin-padding.png)

```html
<section class="p-6 mb-8">
  <h2 class="mb-2">ドリンクメニュー</h2>
  <p class="mt-1">本日のコーヒーは600円から</p>
</section>
```

このコードの余白を読み解くと：

- `p-6`：section の内側全方向に余白をつける
- `mb-8`：section の下側に外側余白をつける（次のsectionとの間隔）
- `mb-2`：h2の下側に外側余白をつける
- `mt-1`：p の上側に外側余白をつける

#### 余白の数値の意味

Tailwind の余白は数値が大きいほど広くなります。目安として：

| クラス | CSSでの意味 | ピクセル換算 |
|---|---|---|
| `p-1` | `padding: 0.25rem` | 4px |
| `p-2` | `padding: 0.5rem` | 8px |
| `p-4` | `padding: 1rem` | 16px |
| `p-6` | `padding: 1.5rem` | 24px |
| `p-8` | `padding: 2rem` | 32px |

`m` も同じ数値体系です（`m-4` なら `margin: 1rem`）。

#### 方向を指定する

```
p-4   → 全方向
px-4  → 左右（x軸）のみ
py-4  → 上下（y軸）のみ
pt-4  → 上（top）のみ
pb-4  → 下（bottom）のみ
pl-4  → 左（left）のみ
pr-4  → 右（right）のみ
```

`m` も同様に `mx`、`my`、`mt`、`mb`、`ml`、`mr` が使えます。

---

### 3. 幅と中央寄せ

ページが画面いっぱいに広がると、文章が読みにくくなります。最大幅を決めて中央に置くと、読みやすくなります。

```html
<main class="max-w-2xl mx-auto px-4">
  <!-- コンテンツ -->
</main>
```

| クラス | 意味 |
|---|---|
| `max-w-sm` | 最大幅 384px |
| `max-w-xl` | 最大幅 576px |
| `max-w-2xl` | 最大幅 672px |
| `max-w-4xl` | 最大幅 896px |
| `w-full` | 親要素いっぱいの幅にする |
| `mx-auto` | 左右の外側余白を自動にして中央寄せ |

`mx-auto` は「左右の margin を auto にする」という CSS で、要素が中央に来るようになります。

![widthとheightの例](./images/week02-width-height.png)

#### なぜ `mx-auto` で中央に来るのか：ブロック要素とインライン要素

`mx-auto` が効くのは **ブロック要素** に限られます。HTMLの要素には「ブロック」と「インライン」の2種類があります。

| 種類 | 特徴 | 代表的なタグ |
|---|---|---|
| **ブロック要素** | 横幅いっぱいに広がる「箱」。縦に積まれる | `div`, `p`, `h1`〜`h6`, `section`, `ul` |
| **インライン要素** | 文字の流れの中に収まる「中身」。横に並ぶ | `a`, `img`, `span`, `strong` |

![ブロック要素とインライン要素の違い](./images/block-and-inline.png)

`mx-auto` の3ステップを見てみましょう。

**① 幅が100%のブロック要素（デフォルト）:**

![幅100%のブロック要素](./images/block1.png)

**② `max-w-xl` で幅を制限 → 箱は中央になるが、文字は左寄り:**

![max-w-xlとmx-autoを適用](./images/block2.png)

**③ さらに文字を中央に寄せたい場合は `text-center`（= `text-align: center`）を追加:**

![text-centerも追加](./images/block3.png)

「箱（ブロック要素）を中央に置く」のが `mx-auto`、「箱の中の文字を中央に揃える」のが `text-center` です。この2つは別のものなので、場面に応じて使い分けます。

---

### 4. 文字の大きさ・太さ・色

文字は「大きさ」「太さ」「色」の3つで見た目が決まります。Tailwindでそれぞれを指定します。

```html
<h1 class="text-3xl font-bold text-gray-900">POSSE CAFE</h1>
<h2 class="text-xl font-bold text-gray-800">ドリンクメニュー</h2>
<p class="text-base text-gray-600">季節のコーヒーをご用意しています。</p>
<span class="text-sm text-gray-400">価格は税込です</span>
```

#### 文字の大きさ

| クラス | 大きさの目安 |
|---|---|
| `text-sm` | やや小さめ（説明文・補足） |
| `text-base` | 標準（本文） |
| `text-lg` | やや大きめ |
| `text-xl` | 小見出しに |
| `text-2xl` | 中見出しに |
| `text-3xl` | 大きな見出しに |

![font-sizeの例](./images/week02-font-size.png)

#### 文字の太さ

| クラス | 意味 |
|---|---|
| `font-normal` | 通常の太さ |
| `font-bold` | 太字 |

![font-weight・text-align・line-heightの例](./images/week02-font-weight.png)

#### 文字の色

| クラス | 意味 |
|---|---|
| `text-gray-900` | ほぼ黒（メインの見出し） |
| `text-gray-800` | 濃いグレー（第2見出し） |
| `text-gray-600` | 中程度のグレー（本文） |
| `text-gray-400` | 薄いグレー（補足・注釈） |
| `text-blue-600` | 青色（リンクや強調） |
| `text-red-600` | 赤色（注意・警告） |

色を選ぶときは、背景色との差（コントラスト）を意識してください。白い背景に薄い文字色は読みにくくなります。

![colorの例](./images/week02-color.png)

---

### 5. 背景色とカード

要素をカード状に見せると、情報のまとまりが伝わりやすくなります。

```html
<div class="bg-white rounded-lg shadow p-6">
  <h2 class="text-xl font-bold text-gray-900">ブレンドコーヒー</h2>
  <p class="text-gray-600 mt-2">本日のおすすめブレンド。深みとコクが特徴です。</p>
  <p class="text-blue-600 font-bold mt-3">600円</p>
</div>
```

| クラス | 意味 |
|---|---|
| `bg-white` | 背景を白にする |
| `bg-gray-50` | 背景をごく薄いグレーにする |
| `bg-gray-100` | 背景を薄いグレーにする |
| `rounded-sm` | 少し角丸にする |
| `rounded-lg` | 角丸にする（カードによく使う） |
| `rounded-full` | 完全な丸にする |
| `shadow` | 標準の影をつける |
| `shadow-md` | やや濃い影をつける |
| `border` | 枠線をつける |
| `border-gray-200` | 枠線の色を薄いグレーにする |

---

### 6. hover：マウスを乗せた時の変化

`hover:` をクラスの前につけると、マウスを乗せた時だけ効くスタイルを指定できます。

```html
<button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
  注文する
</button>

<a href="#" class="text-blue-600 underline hover:text-blue-800">
  詳細を見る
</a>
```

- `hover:bg-blue-700`：マウスを乗せた時に背景色が濃くなる
- `hover:text-blue-800`：マウスを乗せた時に文字色が濃くなる

ボタンやリンクに `hover:` を指定すると、「クリックできる要素」という見た目の合図になります。

---

### まとめ：カフェのメニューページのサンプル

以上を組み合わせると、次のようなコードになります。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POSSE CAFE メニュー</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50">
    <header class="bg-white shadow px-6 py-4">
      <h1 class="text-2xl font-bold text-gray-900">POSSE CAFE</h1>
      <p class="text-gray-600 text-sm mt-1">東京・渋谷のスペシャルティコーヒーショップ</p>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-8">
      <section class="mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-4">ドリンク</h2>

        <div class="bg-white rounded-lg shadow p-6 mb-4">
          <h3 class="text-lg font-bold text-gray-900">ブレンドコーヒー</h3>
          <p class="text-gray-600 mt-1">本日のおすすめ。深みとコクが特徴です。</p>
          <p class="text-blue-600 font-bold mt-2">600円</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6 mb-4">
          <h3 class="text-lg font-bold text-gray-900">カフェラテ</h3>
          <p class="text-gray-600 mt-1">なめらかなミルクとエスプレッソのバランス。</p>
          <p class="text-blue-600 font-bold mt-2">700円</p>
        </div>
      </section>
    </main>

    <footer class="bg-gray-100 text-center py-6 text-gray-500 text-sm">
      <p>2024 POSSE CAFE</p>
    </footer>
  </body>
</html>
```

このサンプルを見ながら、「なぜこのクラスを使っているのか」を自分の言葉で説明してみましょう。それがこの週のゴールです。

---

## ミニドリル（AI禁止・45分）

### 着手前：ゴールUIを分解する（5分）

まず**分解のやり方**を確認してください。Week01で学んだ「①大ブロックに分ける → ②内部を分解する」の手順です。

![分解の例](./images/week02-breakdown.png)

---

今週のミニドリルで作るUIです。上と同じやり方で、自分でブロックに分解してみましょう。

![Week02 ミニドリル ゴールUI](./images/minidrill-week02-goal.png)

このUIをブロックに分けると何パーツありますか？以下の表を埋めてから問題1に進んでください。

| ブロック名 | 役割・見た目の特徴 | 使うTailwindクラス候補 | 確認方法 |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

---

### 問題1：本の紹介カードを作る（25分）

`drill-ph1` の `week02-1/` ディレクトリで作業してください。`images/book.jpg` が入っています。

上のゴールUIと同じ本の紹介カードをHTMLとTailwindで作ってください。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-gray-100` |
| カード背景 | `bg-white` |
| カード幅 | `w-80` |
| 角丸 | `rounded-xl` |
| 影 | `shadow-lg` |
| 本の表紙画像 | `<img src="./images/book.jpg" alt="本棚の写真" class="w-full h-56 object-cover">` |
| 本文パディング | `p-5` |
| タイトル | `text-xl font-bold text-gray-900` |
| 著者名 | `text-gray-500 text-sm` |
| 評価 | `text-orange-400 text-sm font-bold` |
| ジャンルタグ背景 | `bg-gray-200` |
| ジャンルタグ文字 | `text-gray-600 text-xs px-2 py-1 rounded` |
| あらすじ | `text-gray-500 text-xs leading-relaxed` |
| カートボタン | `bg-orange-400 text-white text-sm font-bold` |
| 試し読みボタン | `bg-gray-200 text-gray-700 text-sm` |

#### 掲載する内容
- タイトル：人生を変えるコードの書き方
- 著者：田中 じゅん
- 評価：★★★★☆ 4.2 / 5
- ジャンル：プログラミング、入門
- あらすじ：コードを書くことは、問題を分解する力を育てること。初学者から中級者まで、思考の型を身につけるための一冊。
- ボタン：カートに追加 / 試し読み

#### Step 1：着手前に分解した表を見ながら実装順を決める
#### Step 2：1パーツずつ実装してブラウザで確認する
#### Step 3：ゴールUIのスクショと見比べて確認する

---

### 問題2：バグ診断

以下のコードは「3枚のカードをきれいに並べる」つもりで書きましたが、スマホでカードが横にはみ出してしまいます。何が問題か説明し、修正してください。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <title>カフェメニュー</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50 p-8">
    <main class="max-w-xl mx-auto">
      <div class="bg-white rounded shadow p-6 w-96 mb-4">
        <h2 class="font-bold">ブレンドコーヒー</h2>
        <p class="text-gray-600">本日のおすすめ</p>
        <p class="text-blue-600 font-bold">600円</p>
      </div>
      <div class="bg-white rounded shadow p-6 w-96 mb-4">
        <h2 class="font-bold">カフェラテ</h2>
        <p class="text-gray-600">なめらかな口当たり</p>
        <p class="text-blue-600 font-bold">700円</p>
      </div>
    </main>
  </body>
</html>
```

<details>
<summary>ヒント</summary>

`max-w-xl` は最大幅576pxです。`w-96` は何pxでしょうか？

</details>

<details>
<summary>解答</summary>

問題は `w-96`（= 384px）という固定幅を指定していることです。`max-w-xl`（576px）の親より小さいので PC では収まりますが、スマホ（375px幅など）では 384px のカードがはみ出します。

修正方法：`w-96` を `w-full` に変えると、親の幅に合わせてカードが伸縮します。

```html
<div class="bg-white rounded shadow p-6 w-full mb-4">
```

`w-full` は「親要素の幅いっぱい」という意味で、どの画面幅でも収まるようになります。

</details>

---

### 問題3：ニュース記事カードを作る（20分）

`drill-ph1` の `week02-2/` ディレクトリで作業してください。`images/news.jpg` が入っています。

Week01とWeek02で学んだTailwindの基本を使って、ニュース記事カードを作ってください。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-slate-100` |
| カード背景 | `bg-white` |
| カード幅 | `w-80` |
| 角丸 | `rounded-xl` |
| 影 | `shadow-lg` |
| カードのはみ出し防止 | `overflow-hidden` |
| カテゴリバッジ | `bg-red-600 text-white text-xs font-bold px-4 py-2` |
| 記事画像 | `<img src="./images/news.jpg" alt="ニュース記事の写真" class="w-full h-48 object-cover">` |
| 本文パディング | `p-5` |
| タイトル | `text-xl font-bold text-gray-900` |
| メタ情報 | `text-gray-500 text-xs` |
| 本文 | `text-gray-600 text-sm leading-relaxed` |
| 続きを読むリンク | `text-red-600 font-semibold text-sm hover:text-red-800` |

#### 掲載する内容
- カテゴリ：TECH
- タイトル：AIエンジニアが語る「コードを書く理由」
- 日付・著者：2026年5月12日 ・ 田中 じゅん
- 本文：生成AIが当たり前になった時代に、なぜエンジニアは自分でコードを書くのか。その問いに向き合った3人へのインタビュー。
- リンク：続きを読む

#### Step 1：ページ全体とカードの外側を作る
#### Step 2：カテゴリバッジ、画像、本文エリアを順番に作る
#### Step 3：ゴールUIのスクショと見比べて確認する

---

## POSSE課題

### テーマ：架空のカフェのメニューページ

架空のカフェを考えて、メニューページをTailwindで作成してください。Week01のプロフィールページとは別の、新しいHTMLファイルを作ります。

**要件:**

- ページ全体の背景色を設定すること
- メニュー項目はカード形式で表示すること（`bg-white rounded-lg shadow p-6` のような組み合わせ）
- 見出し・本文・価格で文字の大きさや色に差をつけること
- `hover:` を使ったインタラクションを1箇所以上入れること
- Tailwindのみでスタイリングし、素のCSSファイルは作らないこと
- ドリンク・フード・スイーツのうち2種類以上のセクションを設けること
- **カフェのターゲット客層に合った配色にすること（選んだ理由をPR本文に書く）**

**提出:**

- GitHubリポジトリにpushしてURL提出。ローカルで動作確認済みであればOK。（Week01のGitHub PagesのURLがある人はそこにも反映されます）

**PR本文に必ず書くこと:**

1. 使ったTailwindクラスを5つ以上選び、それぞれ「なぜそのクラスを使ったか」理由を書く
2. 詰まった場所とどう解決したか（1箇所以上）
3. 【発展・任意】AIに同じメニューページを作らせて、自分の作ったものと何が違うか比較して書く

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A（例: text-amber-600 を使う）:
- 選択肢B（例: text-blue-600 を使う）:
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

- [ ] `head` に Tailwind CDN の `script` タグがある
- [ ] ページ全体に背景色を指定した
- [ ] メニュー項目がカード形式で表示されている（背景・角丸・影・余白のいずれかを使っている）
- [ ] 見出しと本文で文字の大きさまたは色に差がある
- [ ] `hover:` を使ったインタラクションが1箇所以上ある
- [ ] 素のCSSファイルを別途作成していない（Tailwindのみ）
- [ ] ローカルで表示を確認した
- [ ] GitHubリポジトリにpushした
- [ ] PR本文に「なぜそのクラスを使ったか（5つ以上）」を書いた
- [ ] PR本文に「詰まった場所とどう解決したか」を書いた
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] ターゲット客層に合った配色を選び、選んだ理由をPR本文に書いた
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## 参考資料

### 余白クラスの一覧（頻出）

| クラス | CSSでの意味 |
|---|---|
| `p-1` / `p-2` / `p-4` / `p-6` / `p-8` | padding（全方向） |
| `px-4` | padding-left / padding-right |
| `py-4` | padding-top / padding-bottom |
| `mt-2` / `mb-4` | margin-top / margin-bottom |
| `space-y-2` | 子要素の縦方向の間隔 |

### 色クラスの命名規則

Tailwindの色クラスは `プロパティ-色名-数値` の形式です。

- 数値は 50（最も薄い）〜 950（最も濃い）
- よく使うのは 100・200・400・600・800 あたり

例：`bg-blue-100`（薄い青背景）、`text-blue-600`（青文字）、`border-gray-200`（薄いグレー枠線）

### Tailwind公式ドキュメント

[tailwindcss.com](https://tailwindcss.com/docs) — クラス名を検索するとすぐに見つかります。困ったら公式が一番正確です。

### 参考動画・記事

理解を深めるために以下の動画を視聴しましょう。

- [【CSS】marginとpaddingを完全理解！](https://youtu.be/Zgmrmg0XcSg) — margin/paddingの違いと使い方（視聴目安: 00:00〜05:00）
- [CSSのブロック要素・インライン要素とは？](https://youtu.be/AtwbVdLtNOQ) — ブロック/インラインの違いを視覚的に解説
- [Tailwind CSS クイックスタート（日本語解説）](https://zenn.dev/topics/tailwindcss) — TailwindのZenn記事一覧
