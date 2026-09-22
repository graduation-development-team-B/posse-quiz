# Week05｜レスポンシブデザイン

今週のゴールは、モバイルファーストの考え方を理解し、Tailwindのブレイクポイント接頭辞を使ってスマホとPCで見た目が変わるページを作れるようになることです。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | モバイルファースト、sm:/md:/lg: 接頭辞、flex-col→flex-row切り替え、grid-cols切り替え、hidden/block |
| **作るもの** | 架空のNPOや学校のトップページ（新しいHTMLファイル） |
| **完了条件** | スマホ幅とPC幅でレイアウトが変わることをDevToolsで確認し、PR本文に報告できる |
| **所要時間目安** | インプット 1〜1.5h、ミニドリル 1〜1.5h、POSSE課題 3〜4h（DevToolsでの確認・調整に時間がかかります） |

AIを使う場合はPOSSE課題のみ。インプット・ミニドリルでは使わないこと。

---

> Week03ではFlexboxを使って要素を横並びにし、Week04ではGridとブレイクポイント接頭辞（`md:` など）を学びました。Week05では、この2つを組み合わせてスマホとPCで見た目が変わるページを完成させます。

---

## インプット

### 1. なぜレスポンシブデザインが必要か

Webサイトを開く環境は、PCだけではありません。スマートフォン、タブレット、ワイドモニターなど、画面サイズはさまざまです。

同じHTMLファイルで、画面サイズに合わせてレイアウトを変える設計を**レスポンシブデザイン**と呼びます。

たとえば、PC幅では3列で並んでいたカードが、スマホ幅では1列になる、ナビメニューがPC幅では横並びなのにスマホ幅では縦並びになる、といった変化です。

---

### 2. Tailwindはモバイルファースト

Tailwindでは、**接頭辞なしのクラスが最も小さい画面（スマホ）に適用**されます。

```html
<div class="grid-cols-1 md:grid-cols-3">
```

この場合：
- 0px〜768px（スマホ幅）：1列
- 768px以上（タブレット・PC幅）：3列

「まず小さい画面で読める状態を作り、広い画面では補足でレイアウトを足す」という考え方です。

> 💡 **CS原則：モバイルファースト**
> スマホ向けに最低限必要なものから設計を始め、画面が広くなるにつれて情報を足していく設計方針です。スマホユーザーが世界的に多数派になった現在、標準的なアプローチとして定着しています。

---

### 3. ブレイクポイント接頭辞

| 接頭辞 | ブレイクポイント | 主な対象 |
|---|---|---|
| なし | 0px〜 | スマホ（全画面のデフォルト） |
| `sm:` | 640px以上 | スマホ横向き・小さいタブレット |
| `md:` | 768px以上 | タブレット |
| `lg:` | 1024px以上 | PC |
| `xl:` | 1280px以上 | ワイドPC |

接頭辞は「その幅以上のときだけ効く」という意味です。

![Tailwindのブレイクポイント一覧](./images/week06-breakpoints.png)

---

### 4. よく使うレスポンシブパターン

#### ナビの縦横切り替え

スマホでは縦並び、PCでは横並びにするパターンです。

```html
<nav class="flex flex-col md:flex-row gap-2 md:gap-6">
  <a href="#" class="text-gray-700 hover:text-blue-600">ホーム</a>
  <a href="#" class="text-gray-700 hover:text-blue-600">活動内容</a>
  <a href="#" class="text-gray-700 hover:text-blue-600">お問い合わせ</a>
</nav>
```

`flex-col` がスマホ幅のデフォルト（縦並び）、`md:flex-row` でタブレット以上では横並びになります。

#### カードの列数変更

```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div class="bg-white rounded p-4 shadow">カード1</div>
  <div class="bg-white rounded p-4 shadow">カード2</div>
  <div class="bg-white rounded p-4 shadow">カード3</div>
</div>
```

スマホでは1列、タブレット以上では3列になります。

#### 画像の幅変更

```html
<div class="flex flex-col md:flex-row gap-4 items-center">
  <img class="w-full md:w-1/2 rounded" src="./hero.jpg" alt="メイン画像">
  <div class="md:w-1/2">
    <h2 class="text-xl font-bold">私たちについて</h2>
    <p class="text-gray-600 mt-2">活動内容の説明テキスト。</p>
  </div>
</div>
```

スマホでは画像が上、テキストが下の縦並び。PCでは左右に分かれます。

#### 要素の表示・非表示

特定の画面サイズだけ要素を見せたい・隠したい場合は `hidden` と `block` を組み合わせます。

```html
<!-- PCのみ表示 -->
<div class="hidden md:block">PCだけ見えるコンテンツ</div>

<!-- スマホのみ表示 -->
<div class="block md:hidden">スマホだけ見えるコンテンツ</div>
```

---

### 5. DevToolsでレスポンシブを確認する

DevToolsには画面幅をシミュレートする機能があります。

- Mac: `Cmd + Option + I` でDevToolsを開く
- 左上のスマホアイコン（レスポンシブモード）をクリックする
- 画面上部のドロップダウンから「iPhone」「iPad」などを選ぶ、または幅を直接入力する

確認するべきポイント：
- スマホ幅（375px）で横にはみ出していないか
- タブレット幅（768px）でレイアウトが切り替わるか
- PC幅（1280px）で意図した列数になっているか

![DevToolsのレスポンシブモード](./images/devtools-responsive.png)

![スマホとPCの表示比較](./images/res1.png)
![スマホとPCの表示比較（詳細）](./images/res2.png)

---

### 6. 完成例：NPOのトップページ

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>グリーンアース</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50">

    <!-- ヘッダー -->
    <header class="bg-white shadow px-6 py-4">
      <div class="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 class="text-xl font-bold text-green-700">グリーンアース</h1>
        <nav class="flex flex-col md:flex-row gap-2 md:gap-6 text-sm">
          <a href="#" class="text-gray-700 hover:text-green-600">ホーム</a>
          <a href="#" class="text-gray-700 hover:text-green-600">活動内容</a>
          <a href="#" class="text-gray-700 hover:text-green-600">お問い合わせ</a>
        </nav>
      </div>
    </header>

    <!-- メイン -->
    <main class="max-w-4xl mx-auto px-6 py-10">

      <!-- ヒーローエリア -->
      <section class="mb-10 text-center">
        <h2 class="text-3xl font-bold text-gray-800 mb-4">地球のために、今できることを。</h2>
        <p class="text-gray-600">私たちは環境保護活動を通じて、未来の地球を守ります。</p>
      </section>

      <!-- 活動内容カード -->
      <section class="mb-10">
        <h2 class="text-xl font-bold mb-4">活動内容</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
            <p class="text-2xl mb-2">🌱</p>
            <h3 class="font-bold">植樹活動</h3>
            <p class="text-gray-500 text-sm mt-1">月1回、地域の公園で植樹を行っています。</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
            <p class="text-2xl mb-2">♻️</p>
            <h3 class="font-bold">リサイクル推進</h3>
            <p class="text-gray-500 text-sm mt-1">家庭ごみの分別と資源回収を支援します。</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
            <p class="text-2xl mb-2">🏫</p>
            <h3 class="font-bold">環境教育</h3>
            <p class="text-gray-500 text-sm mt-1">小学校への出前授業を年10回実施しています。</p>
          </div>
        </div>
      </section>

    </main>

    <!-- フッター -->
    <footer class="bg-gray-800 text-gray-400 text-sm text-center py-6">
      &copy; 2025 グリーンアース
    </footer>

  </body>
</html>
```

---

### 7. レスポンシブデザインでよくある間違い

#### 「接頭辞なしを書き忘れてスマホが崩れる」

```html
<!-- 間違い: スマホ幅の指定がない -->
<div class="md:grid-cols-3">
  ...
</div>
```

```html
<!-- 正しい: 先にスマホ幅の指定を書く -->
<div class="grid grid-cols-1 md:grid-cols-3">
  ...
</div>
```

接頭辞なしで `grid-cols-1` を書かないと、スマホ幅では列の指定がなく崩れます。

#### 「flex-col をどこに付けるか迷う」

縦並び・横並びの指定は子ではなく、並べる側の**親要素**に付けます。

```html
<!-- 間違い: 子要素に付けている -->
<nav class="flex">
  <a class="flex-col" href="#">リンク1</a>
  <a class="flex-col" href="#">リンク2</a>
</nav>

<!-- 正しい: 親要素に付ける -->
<nav class="flex flex-col md:flex-row">
  <a href="#">リンク1</a>
  <a href="#">リンク2</a>
</nav>
```

#### 「viewport metaタグを入れ忘れる」

レスポンシブが動作するには `<head>` の中に次のタグが必要です。

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

これがないと、スマホのブラウザがPC幅でページをレンダリングし、縮小して表示します。ブレイクポイント接頭辞が想定通りに効きません。

---

### 8. 実務でよく使うレスポンシブパターン

#### サイドバー付きレイアウト

スマホではコンテンツが上、サイドバーが下の縦並び。PCでは左右に並ぶパターンです。

```html
<div class="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto px-4 py-8">
  <!-- メインコンテンツ -->
  <main class="flex-1">
    <h2 class="text-xl font-bold mb-4">メインコンテンツ</h2>
    <p class="text-gray-600">本文テキスト...</p>
  </main>

  <!-- サイドバー -->
  <aside class="lg:w-64">
    <div class="bg-gray-100 rounded p-4">
      <h3 class="font-bold mb-2">カテゴリ</h3>
      <ul class="text-sm text-gray-600 space-y-1">
        <li>カテゴリA</li>
        <li>カテゴリB</li>
      </ul>
    </div>
  </aside>
</div>
```

`flex-1` は「残りの幅をすべて使う」という指定です。サイドバーの幅（`lg:w-64`）を固定し、メインコンテンツが残りを埋めます。

#### ヒーロー画像 + テキスト

スマホでは上下に積み、PCでは左右に並べるパターンです。

```html
<section class="flex flex-col md:flex-row items-center gap-8 py-12 px-6">
  <div class="md:w-1/2">
    <h1 class="text-3xl font-bold mb-4">メインキャッチコピー</h1>
    <p class="text-gray-600 mb-6">サブテキスト説明文。</p>
    <a href="#" class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition inline-block">
      詳しく見る
    </a>
  </div>
  <div class="md:w-1/2 bg-gray-200 h-64 rounded-lg"></div>
</section>
```

`md:w-1/2` はPC幅で左右それぞれ50%の幅になる指定です。

---

## ミニドリル（AI禁止・60分）

### 着手前：スマホ幅とPC幅を分けて考える（5分）

まず**分解のやり方**を確認してください。レスポンシブは「スマホ幅」と「PC幅」の2段階で考えるのがポイントです。

> 分解の例はWeek03の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

レスポンシブ対応は、いきなり `md:` を足すのではなく「接頭辞なしの状態」と「`md:` 以上の状態」を分けて考えます。

コードを書く前に、各問題で次の表を埋めてください。

| 見る場所 | 書くこと |
|---|---|
| 完成状態 | どんなページ・部品を作るか |
| スマホ幅 | 縦並びか、1列か、どの順番で表示するか |
| PC幅（md以上） | 横並びか、2列・3列か、どこが広がるか |
| 使う接頭辞 | `md:` をどのクラスに付けるか |
| 確認する幅 | 375px / 768px / 1280px |
| 確認方法 | DevToolsのレスポンシブモードで横はみ出しと列数を見る |

---

### 問題1：防災チェックリストLPを作る（25分）

`drill-ph1` の `week05-1/` ディレクトリで作業してください。

スマホでは上から順に読めて、PC幅では説明エリアとチェックリストが2カラムになる防災チェックリストLPを作ります。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-slate-100` |
| 全体幅 | `max-w-5xl mx-auto px-6 py-8` |
| ヘッダー | `flex flex-col md:flex-row md:items-center md:justify-between gap-3` |
| ナビ | `flex flex-col md:flex-row gap-2 md:gap-4 text-sm` |
| ヒーロー | `grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch` |
| 左カラム | `bg-white rounded-2xl shadow p-6` |
| 右カラム | `bg-blue-900 text-white rounded-2xl shadow p-6` |
| チェックリスト | `space-y-3` |
| チェック項目 | `bg-white/10 rounded-lg p-3` |
| ボタン | `inline-block bg-orange-500 text-white px-5 py-3 rounded-lg font-bold hover:bg-orange-600 transition` |

#### 掲載する内容

- サイト名：防災スタート
- ナビ：備える / チェックリスト / 連絡先
- 見出し：今日からできる防災チェック
- 本文：水・食料・ライト・連絡手段を、家族で確認しておきましょう。
- ボタン：チェックを始める
- チェック項目：飲料水3日分 / モバイルバッテリー / 懐中電灯 / 家族の集合場所

#### Step 1：スマホ幅の順番を先に決める

接頭辞なしでは `grid-cols-1` にして、説明エリア → チェックリストの順に縦に積みます。

#### Step 2：PC幅の2カラムだけ `md:` で追加する

同じ親要素に `md:grid-cols-2` を追加します。`md:` は「768px以上で上書きする」指定です。

#### Step 3：DevToolsで375pxと768pxを確認する

375pxでは1列、768px以上では2列になっていればOKです。横スクロールが出ていないかも確認してください。

---

### 問題2：バグ診断（`md:` クラスが効かない）（15分）

`drill-ph1` の `week05-2/` ディレクトリで作業してください。

次のコードは「スマホでは1列、md以上では2列」にしたいのに、期待通りに切り替わりません。何が問題か説明し、修正してください。

```html
<div class="grid grid-cols-1 md: grid-cols-2 gap-4">
  <div class="bg-white rounded-lg p-4">水</div>
  <div class="bg-white rounded-lg p-4">食料</div>
</div>
```

#### 仕様

| 項目 | 正しい書き方 |
|---|---|
| Grid有効化 | `grid` |
| スマホ幅 | `grid-cols-1` |
| md以上 | `md:grid-cols-2` |
| 余白 | `gap-4` |
| カード | `bg-white rounded-lg p-4 shadow` |

#### 掲載する内容

- 見出し：レスポンシブ診断
- 説明：375pxでは1列、768px以上では2列にします
- カード：水 / 食料
- 修正対象：`md: grid-cols-2` を `md:grid-cols-2` に直す

#### Step 1：バグの原因を文章で書く

`md:` と `grid-cols-2` の間にスペースがあると、Tailwindは `md:grid-cols-2` という1つのクラスとして認識できません。

#### Step 2：クラス名をスペースなしに直す

`md: grid-cols-2` ではなく `md:grid-cols-2` と書きます。

#### Step 3：375pxと768pxで表示を確認する

DevToolsのレスポンシブモードで、375pxでは1列、768px以上では2列になることを確認してください。

<details>
<summary>解答</summary>

```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="bg-white rounded-lg p-4">水</div>
  <div class="bg-white rounded-lg p-4">食料</div>
</div>
```

Tailwindの接頭辞は `md:` と本体クラスをつなげて1つのクラス名にします。`md:` の後ろにスペースを入れると別々のクラスとして扱われ、意図したブレイクポイント指定になりません。

</details>

---

### 問題3：Flex + Grid + レスポンシブを全部使う（20分）

`drill-ph1` の `week05-3/` ディレクトリで作業してください。

Week03のFlex、Week04のGrid、Week05のレスポンシブを全部使って、イベント紹介ページを作ります。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-gray-50` |
| ヘッダー | `flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4` |
| ナビ | `flex flex-col md:flex-row gap-2 md:gap-5 text-sm` |
| メイン幅 | `max-w-5xl mx-auto px-6 py-8` |
| ヒーロー | `flex flex-col md:flex-row gap-6 items-center` |
| ヒーロー画像枠 | `w-full md:w-1/2 bg-indigo-100 rounded-2xl h-56` |
| ヒーロー本文 | `w-full md:w-1/2` |
| カード一覧 | `grid grid-cols-1 md:grid-cols-3 gap-4` |
| カード | `bg-white rounded-xl shadow p-5 hover:shadow-lg transition` |

#### 掲載する内容

- サイト名：POSSE Weekend
- ナビ：概要 / タイムテーブル / 申し込み
- メイン見出し：週末に小さなWebサービスを作ろう
- 本文：チームでアイデアを出し、HTML・Tailwind・JavaScriptで形にする1日イベントです。
- カード1：アイデア出し / 10:00
- カード2：実装タイム / 13:00
- カード3：発表会 / 17:00

#### Step 1：ヘッダーをスマホ縦並び、md以上横並びにする

ヘッダーとナビの両方に `flex flex-col md:flex-row` を使います。PC幅では `md:justify-between` で左右に分けます。

#### Step 2：ヒーローを `flex-col md:flex-row` で切り替える

スマホでは画像枠が上、本文が下。md以上では左右50%ずつになるように `w-full md:w-1/2` を使います。

#### Step 3：カード一覧を `grid-cols-1 md:grid-cols-3` で切り替える

375pxではカードが縦1列、768px以上では3列になっているかを `goal.png` とDevToolsで確認してください。

---

## この週の分解の型

レスポンシブ対応でよくある詰まりは「スマホで縦並びにしようとしたのにならない」「PCでは3列なのにスマホで崩れる」です。

作る前に次の順番で分解すると整理できます。

| 段階 | 書くこと |
|---|---|
| 1. 完成状態 | どんなページか |
| 2. スマホのレイアウト | 縦並び・1列・中央寄せなど |
| 3. PCのレイアウト | 横並び・3列・左右分割など |
| 4. 使う接頭辞 | `md:` か `lg:` か |
| 5. 変更する箇所 | ヘッダー・カードエリア・フッターなど |
| 6. 確認方法 | DevToolsのレスポンシブモード、実際のスマホ |

良い分解：

```md
ヘッダーのナビ：スマホは縦並び（flex-col）、md以上は横並び（md:flex-row）。
カードエリア：スマホは1列（grid-cols-1）、md以上は3列（md:grid-cols-3）。
DevToolsで375px・768px・1280pxの3つで確認する。
```

悪い分解：

```md
レスポンシブにする。
スマホとPCで変える。
```

悪い例は「何を、どこで、どのクラスで変えるか」が見えません。

---

## POSSE課題

### テーマ：架空のNPOや学校のトップページ（モバイル→PC対応）

架空のNPOや学校など、好きなテーマのトップページを新しいHTMLファイルとして作ってください。Week04の商品一覧ページとは別の、独立した新しいページです。

**要件:**
- ヘッダー：スマホでナビが縦並び、PCで横並びになる（`flex-col md:flex-row`）
- カードエリア：スマホで1列、PCで3列になる（`grid-cols-1 md:grid-cols-3`）
- フッターを含める
- スマホ幅（375px相当）で横にはみ出さない

**提出:**
- GitHubリポジトリにpushしてURLを提出。ローカルで動作確認済みであればOK

**PR本文に必ず書くこと:**
1. スマホ幅とPC幅それぞれのレイアウトの変化（何が縦から横になったか、何列になったかなど）
2. DevToolsのレスポンシブモードで確認したことと、確認してわかったこと
3. 詰まった場所とどう解決したか（1箇所以上）
4. 【発展・任意】AIに同じページを作らせて、自分のコードと何が違うか比較する

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A:
- 選択肢B:
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

- [ ] 新しいHTMLファイルを作った（Week04の商品ページへの追記ではない）
- [ ] ヘッダーのナビがスマホで縦並び、PCで横並びになっている
- [ ] カードがスマホで1列、PCで3列（またはそれ以上）になっている
- [ ] スマホ幅で横にはみ出していない
- [ ] DevToolsのレスポンシブモードで確認した
- [ ] PR本文にスマホとPCのレイアウトの変化を書いた
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### Tailwind レスポンシブ接頭辞まとめ

| 接頭辞 | ブレイクポイント | CSSに換算すると |
|---|---|---|
| なし | 0px〜 | 指定なし（全幅に効く） |
| `sm:` | 640px〜 | `@media (min-width: 640px)` |
| `md:` | 768px〜 | `@media (min-width: 768px)` |
| `lg:` | 1024px〜 | `@media (min-width: 1024px)` |
| `xl:` | 1280px〜 | `@media (min-width: 1280px)` |
| `2xl:` | 1536px〜 | `@media (min-width: 1536px)` |

### よく使うレスポンシブクラスパターン

| 目的 | クラスの例 |
|---|---|
| カードの列数をスマホ1列→PC3列に | `grid-cols-1 md:grid-cols-3` |
| ナビをスマホ縦→PC横に | `flex-col md:flex-row` |
| 画像をスマホ全幅→PC半幅に | `w-full md:w-1/2` |
| スマホのみ表示 | `block md:hidden` |
| PCのみ表示 | `hidden md:block` |
| テキストをスマホ中央→PC左に | `text-center md:text-left` |

### MDN参考リンク

- [レスポンシブウェブデザインの基本](https://developer.mozilla.org/ja/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)

### 参考動画・記事

- [CSSメディアクエリ入門](https://youtu.be/YgrPsNxRb8U) — メディアクエリの基本と、モバイルファーストの考え方を解説
- [レスポンシブWebデザイン（MDN Learn）](https://developer.mozilla.org/ja/docs/Learn/CSS/CSS_layout/Responsive_Design) — モバイルファーストの原則と実装パターン
- [Tailwind CSS Responsive Design（公式）](https://tailwindcss.com/docs/responsive-design) — sm/md/lg接頭辞の詳細
