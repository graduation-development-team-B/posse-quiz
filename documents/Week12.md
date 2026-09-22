# Week12｜CSSアニメーション・ライブラリ活用

よくできたサイトと、なんとなく素人っぽいサイト。その差は、中身より先に「動き」に出ます。ボタンの色がパッと切り替わるか、ふわっと変わるか。カードにマウスを乗せたとき、ピクリともしないか、すっと持ち上がるか。この「ふわっ」「すっ」を作るのが、今週前半のCSSアニメーションです。

後半は、スライダー（画像が横に流れるアレ）を作ります。ただし、一から自分では書きません。世界中の人が使っている出来合いの部品（ライブラリ）を借りてきます。自分で動きをつける技術と、出来のいい部品を借りてくる技術。この2つで、ポートフォリオサイトを仕上げます。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | CSS Transition（Tailwindクラス）、transform、visibility/opacity、`group` / `group-hover`、Splide.js（CDN） |
| **作るもの** | ポートフォリオサイト（1ページ）：ヘッダー・自己紹介・スキルリスト・作品スライダー・フッター |
| **完了条件** | Splideでスライダーが動き、ホバーアニメーションが2箇所以上ある状態でPRを出せる |
| **所要時間目安** | インプット 1.5h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・自信度チェック・ミニドリルでは使わないこと。

---

## インプット

### パッと変わると、安っぽい

ボタンにマウスを乗せると、色が変わる。Week02でやった `hover:` です。でも、あのときの変化は一瞬で「パッ」と切り替わっていました。照明のスイッチと同じで、オンかオフか、途中がない。

これを、調光ダイヤルのように「じわっ」と変えたい。0.3秒ほどかけて、なめらかに色が移る。そのためのひと言が **`transition`** です。

ためしに、`transition` を付けたボタンと付けていないボタンを並べて、両方にマウスを乗せてみてください。片方はパッ、もう片方はじわっ。同じ `hover:` でも、`transition` があるかないかだけで、これだけ印象が変わります。

**素のCSSで書く場合の書き方（参考）**

```css
.box {
  transition: all 300ms ease;
}
.box:hover {
  width: 300px;
}
```

むずかしいことは足していません。`transition` は「何を・何秒かけて・どんな速さで・何秒後に始めるか」を指定するだけ。変化の中身（色が変わる、大きくなる）は今まで通り `hover:` などで書き、それを「瞬間」から「なめらか」に変えるのが `transition` の仕事です。

| プロパティ | 意味 | よく使う値 |
|---|---|---|
| `transition-property` | 変化させるCSSプロパティ | `all`, `background-color`, `transform` |
| `transition-duration` | 所要時間 | `300ms`, `0.5s` |
| `transition-timing-function` | 速度変化の形 | `ease`, `ease-in-out`, `linear` |
| `transition-delay` | 開始を遅らせる時間 | `0s`, `200ms` |

**Tailwindで書く場合**

Tailwindには、よく使うtransition設定がクラスとして用意されています。

```html
<button class="transition-all duration-300 ease-in-out
               bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
  送信する
</button>
```

| Tailwindクラス | 意味 |
|---|---|
| `transition-all` | すべてのプロパティにtransitionを適用 |
| `duration-300` | 300msかけて変化 |
| `duration-500` | 500msかけて変化 |
| `ease-in-out` | 始めと終わりが緩やかなイージング |
| `ease-in` | 始めが緩やかで終わりが速い |
| `ease-out` | 始めが速くて終わりが緩やか |

実際は、`transition-all` と `duration-300` をセットで付けるのがほとんどです。**この2つを付け忘れると、せっかくのホバーが「パッ」に逆戻りします。** 動きが効かないときは、まずこの付け忘れを疑ってください。

![CSS Transitionのアニメーション例](./images/week11-animation1.gif)

![hoverでアニメーションする例](./images/week11-animation2.gif)

---

### 周りを押しのけずに、動かす

カードにマウスを乗せたら、少し大きくなる。よくある演出です。でも、これを `width` を増やして作ると、困ったことが起きます。大きくなったカードが隣のカードを押しのけて、**レイアウト全体がガクッとずれる。**

ここで使うのが **`transform`** です。`transform` は要素を移動・拡大・回転させますが、**周りのレイアウトには手を出しません。** 大きくなっても回転しても、隣の要素は元の位置にいたまま。だからホバーで安心して動かせます。

**主な変形の種類**

| 種類 | CSSの書き方 | 意味 |
|---|---|---|
| 移動 | `translate(120px, 50px)` | X軸方向に120px、Y軸方向に50px移動 |
| 拡大縮小 | `scale(1.05)` | 1.05倍に拡大（`1` が等倍） |
| 回転 | `rotate(45deg)` | 45度時計回りに回転 |
| 傾斜 | `skew(10deg)` | 斜めに傾ける |

**Tailwindのtransformクラス（よく使うもの）**

| クラス | 意味 |
|---|---|
| `hover:scale-105` | ホバーで1.05倍に拡大 |
| `hover:scale-110` | ホバーで1.1倍に拡大 |
| `hover:-translate-y-1` | ホバーで1段階上に浮き上がる |
| `hover:rotate-3` | ホバーで3度回転 |
| `translate-x-2` | 右方向に少しずらす（常時） |

**使用例**

```html
<!-- カードにホバーで浮き上がるエフェクト -->
<div class="transition-all duration-300 ease-in-out
            hover:scale-105 hover:-translate-y-1
            bg-white rounded-lg shadow-md p-4">
  カード内容
</div>
```

```html
<!-- ボタンにホバーで色が変わり少し大きくなるエフェクト -->
<button class="transition-all duration-200
               bg-indigo-500 hover:bg-indigo-600 hover:scale-105
               text-white px-6 py-2 rounded-full">
  もっと見る
</button>
```

`transition-all` と組み合わせるのを忘れずに。`transform` だけだと、また「パッ」と一瞬で変形してしまいます。**動きは `transform` で作り、なめらかさは `transition` で足す。** この役割分担さえ押さえれば、混乱しません。

![transformのアニメーション例](./images/week11-transform.gif)

---

### 消したいのに、消すと動かせない

要素をふわっと出したり消したりしたい。フェードイン・フェードアウトです。素直に思いつくのは、Week05で使った `hidden`（`display: none`）の切り替え。でも、これは効きません。

理由はシンプルで、 **`display: none` には「途中」がないからです。** あるか、ないか。0か1で、その間の「半分だけ見えている」状態が存在しない。`transition` は途中をつないでなめらかにする道具なので、つなぐ途中がなければ何もできません。

そこで使うのが `opacity`（透明度）です。`opacity` は 0（透明）から 1（不透明）まで、途中の半透明をいくらでも取れる。だから 0 → 1 をなめらかにつないで、フェードインになります。似たはたらきの `visibility` も含めて、3つの違いはここです。

| 状態 | 要素の存在 | クリック | 表示 |
|---|---|---|---|
| `display: none` / `hidden` | なし扱い | できない | されない |
| `visibility: hidden` / `invisible` | あり | できない | されない |
| `opacity: 0` / `opacity-0` | あり | できる | されない（透明） |

表の一番下の行に注目してください。 **`opacity: 0` は透明なだけで、要素はそこに居座り、クリックもできてしまう。** 見えないボタンを踏んでしまう事故のもとなので、頭の隅に置いておきます。

フェードインの定番が、親要素にホバーしたとき子要素を出すこの形です。

```html
<!-- 親要素にgroupをつけ、子要素のopacityをホバーで切り替える -->
<div class="relative group">
  <img src="./works/thumb.jpg" alt="作品サムネイル" class="w-full rounded">
  <div class="absolute inset-0 bg-black/50
              opacity-0 group-hover:opacity-100
              transition-opacity duration-300
              flex items-center justify-center">
    <span class="text-white font-bold">詳細を見る</span>
  </div>
</div>
```

`group` と `group-hover:` を使うと、親要素にホバーしたときに子要素を変化させられます。今週のミニドリル問題3でこの形を練習します。

![toggleによるアニメーション](./images/week11-toggle.gif)

---

### 全部を、自分で作らない

次は、作品スライダー。画像が横に流れて、矢印で送れて、下に「今何枚目か」のドットが付く、アレです。

これを一から自分で書こうとすると、かなり大変です。スワイプ、無限ループ、自動再生、スマホ対応……考えることが山ほどある。そして——**世界中の人が、もうとっくに同じものを作って、無料で配っています。** 車輪を再発明する必要はありません。こういう出来合いの部品を **ライブラリ** と呼びます。

ここで、先週の話を思い出してください。Week11で、AIの答えは「借り物」だと言いました。**ライブラリも、まったく同じ借り物です。** 他人が書いたコードを、中身を全部は知らないまま借りて使う。便利ですが、借り物には作法があります。決められた書き方を守ること、そして動いたかを自分で確かめること。先週身につけた習慣が、そのまま効きます。

借り方は2種類あります。

| 方法 | 特徴 | 使う場面 |
|---|---|---|
| CDN（URLで読み込む） | HTMLに数行追加するだけで使える | 素のHTMLで試したいとき |
| パッケージマネージャー（npm/pnpm） | バージョン管理が確実、本番向き | Vite・Reactなどの開発環境で使うとき |

今週は、HTMLに数行のURLを足すだけの **CDN** を使います。CDN（Content Delivery Network）は、ファイルを世界中のサーバーに置いておき、あなたに一番近いサーバーから届ける仕組みです。ライブラリを自分のサーバーに用意しなくても、URLを書くだけで読み込めます。

---

### 決められた名前じゃないと、動かない

今回借りるのは **[Splide](https://ja.splidejs.com/)** という、日本製のスライダーライブラリです。

#### CDNでの読み込み

`<head>` の中（自分のCSSより前）に以下を追加します。

```html
<head>
  <meta charset="UTF-8">
  <title>ポートフォリオ</title>

  <!-- Splide CSS（自分のCSSより前に読み込む） -->
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css">

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
```

`</body>` の直前にJavaScriptを読み込みます。

```html
  <!-- Splide JS（bodyの閉じタグ前） -->
  <script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script>
  <script src="./js/main.js"></script>
</body>
```

#### HTML構造

ここからが、借り物の作法です。Splideには **決められたクラス名** があり、これを守らないと、うんともすんとも言いません。

![SplideのHTML構造](./images/week12-splide1.png)

```html
<section class="splide" aria-label="作品スライダー">
  <div class="splide__track">
    <ul class="splide__list">
      <li class="splide__slide">
        <img src="./works/work1.jpg" alt="作品1">
      </li>
      <li class="splide__slide">
        <img src="./works/work2.jpg" alt="作品2">
      </li>
      <li class="splide__slide">
        <img src="./works/work3.jpg" alt="作品3">
      </li>
    </ul>
  </div>
</section>
```

注目は区切り文字です。`splide__track`、`splide__list`、`splide__slide`——すべて **アンダースコア2つ（`__`）** でつながっています。ハイフン（`-`）ではありません。ここを `splide-list` のように書き間違えると、Splideは目印を見つけられず、スライダーになりません。スライドが「ただの縦並びのリスト」のまま残るだけで、**画面の上では派手に壊れません**——だから見落としやすい（コンソールにはエラーが出ることもあるので、あわせて確認してください）。動かないときに最初に疑うのは、このクラス名です（ミニドリル問題2は、まさにこの罠です）。

#### JavaScriptで初期化する

名前さえ正しければ、起動はあっけないほど簡単です。

```js
// js/main.js
new Splide('.splide').mount();
```

この1行で、矢印ボタンもドットも付いたスライダーが完成します。借り物の威力です。

![Splideの基本表示](./images/week12-splide2.png)

#### オプションで動きをカスタマイズ

```js
new Splide('.splide', {
  type: 'loop',      // 'loop': 無限ループ / 'fade': フェード切り替え
  perPage: 2,        // 一度に表示するスライド数
  gap: '1rem',       // スライド間の隙間
  autoplay: true,    // 自動再生
  interval: 3000,    // 自動再生の間隔（ミリ秒）
}).mount();
```

よく使うオプション一覧は[公式サイト](https://ja.splidejs.com/guides/options/)で確認できます。

![Splideのオプション設定](./images/week12-splide3.png)

![Splideの完成イメージ](./images/week12-splide4.png)

---

### 全部つなげた完成形

ここまでの部品——`transition`・`transform`・`group-hover`・Splide——を1ページに組み込んだ、ポートフォリオの骨組みです。コピーして自分の言葉に書き換えれば、そのまま課題の土台になります。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ポートフォリオ</title>
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-800">

  <!-- ヘッダー -->
  <header class="bg-indigo-600 text-white py-8 text-center">
    <h1 class="text-3xl font-bold">あだ名のポートフォリオ</h1>
    <p class="mt-2 text-indigo-200">POSSEでプログラミングを学んでいます</p>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-12 space-y-16">

    <!-- 自己紹介 -->
    <section>
      <h2 class="text-2xl font-bold mb-4">自己紹介</h2>
      <p class="text-gray-600 leading-relaxed">
        こんにちは！Web制作を学んでいます。
      </p>
    </section>

    <!-- スキルリスト -->
    <section>
      <h2 class="text-2xl font-bold mb-4">スキル</h2>
      <ul class="flex flex-wrap gap-2">
        <li class="transition-all duration-200 hover:scale-105
                   bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
          HTML
        </li>
        <li class="transition-all duration-200 hover:scale-105
                   bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
          Tailwind CSS
        </li>
        <li class="transition-all duration-200 hover:scale-105
                   bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
          JavaScript
        </li>
      </ul>
    </section>

    <!-- 作品スライダー -->
    <section>
      <h2 class="text-2xl font-bold mb-4">作品</h2>
      <section class="splide" aria-label="作品スライダー">
        <div class="splide__track">
          <ul class="splide__list">
            <li class="splide__slide">
              <img src="./works/work1.jpg" alt="作品1"
                   class="w-full rounded-lg object-cover">
            </li>
            <li class="splide__slide">
              <img src="./works/work2.jpg" alt="作品2"
                   class="w-full rounded-lg object-cover">
            </li>
          </ul>
        </div>
      </section>
    </section>

  </main>

  <!-- フッター -->
  <footer class="bg-gray-800 text-gray-400 text-center py-6 mt-16">
    <p>2026 あだ名</p>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script>
  <script src="./js/main.js"></script>
</body>
</html>
```

### 今日のまとめ

- `hover:` の変化を「パッ」から「じわっ」に変えるのが `transition`。動きの中身は `transform`（移動・拡大・回転）で作り、なめらかさは `transition` で足す。この2つはセットで使う。
- フェードには `opacity`。`display: none` は「途中」がないからアニメできない。`opacity: 0` は透明でも要素は居座る（クリックできてしまう）。
- スライダーのような重い部品は、自分で作らず **ライブラリを借りる**。借り物には作法がある——決められたクラス名（Splideは `__` ふたつ）を守り、動いたか自分で確かめる。先週の「借り物を自分のものにする」が、ここでも効く。

> **次週とのつながり**：Week13では、CDNでライブラリを読み込むやり方から、ローカルの開発環境（Node.js・pnpm・Vite）に移行します。`./js/main.js` のようにファイルを分けて書いてきた経験が、Viteでの開発に自然につながります。

---

## ミニドリル（AI禁止・60分）

### 着手前：着手前分解表（5分）

まず**分解のやり方**を確認してください。アニメーションは「普段どう見えるか」「ホバーで何がどう変わるか」を分けて考えると整理しやすくなります。コードを書く前に埋めましょう。

> 分解の例はWeek03の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

次を埋めてから問題1へ。

| 項目 | 書くこと |
|---|---|
| 完成状態（普段） | ホバーしていないとき、どう見えるか |
| 完成状態（ホバー時） | 何が・どの方向に・どれくらい変わるか |
| 使うクラス | `transition-all` / `duration-xxx` / `hover:...` のどれを使うか |
| 滑らかさ | `transition` と `duration` を付け忘れていないか |
| 確認方法 | マウスを乗せて動きを確認する（静止画では分からない） |

---

### 問題1：ホバーアニメーション（transition × transform）（20分）

`drill-ph1` の `week12-1/` で作業します。

3枚のスキルカードに、ホバーすると少し浮き上がり・影が強くなるアニメーションを追加します。
**完成したら同じフォルダ内の `goal.png` を開いて見比べてください。カードの見た目（普段の状態）が同じになっていればOKです。ホバーの動きはマウスを乗せて確認します。**

#### 仕様

| 項目 | Tailwindクラス / 内容 |
|---|---|
| ページ背景 | `bg-slate-50`（`p-8`） |
| カード | `rounded-xl border border-slate-200 bg-white p-6 shadow-sm` |
| アニメーション | `transition-all duration-300` |
| ホバー（浮く） | `hover:-translate-y-1` |
| ホバー（影） | `hover:shadow-lg` |

#### 掲載する内容

- 3枚のカード（HTML / Tailwind CSS / JavaScript）。すべて同じホバー演出を付ける

#### Step 1：各カードの `class` に `transition-all duration-300` を足して、アニメーションを有効にする

#### Step 2：`hover:-translate-y-1`（浮き上がり）と `hover:shadow-lg`（影を強く）を足す

#### Step 3：ブラウザでマウスを乗せ、3枚とも滑らかに浮き上がることを確認する。`goal.png` と普段の見た目を照合する

---

### 問題2：バグ診断（Splideのクラス名）（15分）

`drill-ph1` の `week12-2/` ディレクトリで作業してください。

`week12-2/index.html` を開くと、スライダーが**表示されず**、矢印ボタンも出ません（スライドが縦に並んだままです）。`goal.html` は同じ内容でスライダーとして動きます。何が問題か説明し、修正してください。

![Week12 ミニドリル 問題2 ゴールUI](./images/minidrill-week12-2.png)

<details>
<summary>ヒント</summary>
Splideは特定のクラス名を見つけることで動きます。各要素のクラス名を、インプット「5. Splide.js の導入」のHTML構造と1つずつ見比べてみましょう。区切り文字に注目してください。
</details>

<details>
<summary>解答の要点</summary>

`<ul>` のクラス名が `splide-list`（ハイフン）になっており、正しくは `splide__list`（アンダースコア2つ）です。Splideはクラス名 `splide__list` を内部で探しているため、ハイフンだとリストを認識できず、スライダーとして機能しません。`splide__track` や `splide__slide` も同じく `__`（アンダースコア2つ）が正しい書き方です。

</details>

---

### 問題3：作品カードのホバー演出（group-hover の復習）（25分）

`drill-ph1` の `week12-3/` ディレクトリで作業してください。

普段はサムネイルだけ表示され、ホバーすると半透明のオーバーレイと「詳細を見る」が浮かび上がる作品カードを作ります。Week12のtransition・transformと、`group` / `group-hover` / `opacity` を組み合わせた復習問題です。

- 普段：オーバーレイは透明（`opacity-0`）で見えない
- ホバー時：オーバーレイが表示され（`group-hover:opacity-100`）、カードが少し持ち上がる

![Week12 ミニドリル 問題3 ゴールUI](./images/minidrill-week12-3.png)

#### Step 1：各カードの外側 `<div>` に `group` を足し、`transition-all duration-300 hover:-translate-y-1 hover:shadow-lg` でカードを浮かせる

#### Step 2：オーバーレイ（`bg-black/50` の `<div>`）に `opacity-0 group-hover:opacity-100 transition-opacity duration-300` を足し、普段は隠れて親へのホバーで表示されるようにする

#### Step 3：3枚ともマウスを乗せたときだけオーバーレイが出ること・普段はサムネイルだけ見えることを確認する。`goal.png` と普段の見た目を照合する

---

## POSSE課題

### テーマ：ポートフォリオサイト（1ページ）

これまで学んだHTML・Tailwind・CSSアニメーション・Splideをすべて使い、自分のポートフォリオサイトを1ページで作ります。**過去の週の提出物への追記ではなく、今週の独立した新しいHTMLファイル**として作成してください。

**要件:**

- 以下のセクションをすべて含める
  - ヘッダー（あだ名・キャッチコピーなど）
  - 自己紹介
  - スキルリスト（PH1で学んだ技術など）
  - 作品スライダー（Splideを使う。画像は仮の画像でもよい）
  - フッター
- Splideでスライダーを実装している（スライドが2枚以上ある）
- ホバーアニメーション（`hover:scale-xxx` / `hover:-translate-y-x` など）を2箇所以上使っている
- `transition-all duration-xxx` でアニメーションを滑らかにしている
- これまでの週の提出物とは別の独立したHTML/フォルダで作成している
- Tailwind CSSで見た目を整える

**【発展・任意】**
- `group` と `group-hover:` を使って、作品サムネイルにホバーしたとき「詳細を見る」オーバーレイが出る演出を実装する
- Splideのオプション（`type: 'loop'`・`autoplay` など）を設定する

**提出:**
- GitHubリポジトリURL
- GitHub PagesのURL（推奨）

**PR本文に必ず書くこと:**
1. 使ったアニメーションクラスとその箇所（2箇所以上それぞれ）
2. Splideのオプションで設定した内容と選んだ理由（オプション未設定なら、なぜデフォルトのままにしたか）
3. 詰まった場所とどう解決したか（1箇所以上）

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A（例: スライダーは自動再生する）:
- 選択肢B（例: 自動再生せず手動でめくる）:
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
- AIが間違えた・足りなかったこと（Splideのクラス名・CDNの読み込み順・transitionの付け忘れなど）:
- 自分が修正・判断した箇所:

### チェックポイント

- [ ] 前週とは別の新しいHTMLファイル/フォルダで作った
- [ ] ヘッダー・自己紹介・スキルリスト・作品スライダー・フッターの5セクションがある
- [ ] Splide CDNをCSSとJSの両方読み込んでいる
- [ ] `splide__track`・`splide__list`・`splide__slide` のクラス名が正しく書かれている
- [ ] `new Splide('.splide').mount()` でスライダーが動いている
- [ ] ホバーアニメーションが2箇所以上ある
- [ ] `transition-all duration-xxx` でアニメーションが滑らかになっている
- [ ] リポジトリURLが提出されており、ローカルで動作確認済みである（GitHub Pages公開は推奨）
- [ ] PR本文にアニメーションの選択理由と詰まった箇所を書いている
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIとの比較を記録した（Week06以降必須）
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### Tailwind アニメーション関連クラス

| クラス | 効果 |
|---|---|
| `transition-all` / `transition-opacity` | transitionを適用する対象 |
| `duration-200` / `duration-300` / `duration-500` | 変化にかける時間 |
| `ease-in` / `ease-out` / `ease-in-out` | 速度変化の形 |
| `hover:scale-105` / `hover:scale-110` | ホバーで拡大 |
| `hover:-translate-y-1` | ホバーで浮き上がる |
| `group` / `group-hover:...` | 親へのホバーで子要素を変化させる |
| `opacity-0` / `opacity-100` | 透明度（フェードに使う） |

### Splide の基本

| 項目 | 内容 |
|---|---|
| 必須クラス | `splide` / `splide__track` / `splide__list` / `splide__slide` |
| 初期化 | `new Splide('.splide').mount();` |
| 読み込み順 | CSSは `<head>`、JSは `</body>` 直前。Splide JSは初期化コードより前 |

### 公式・MDN参考リンク

- [Splide 公式ガイド（日本語）](https://ja.splidejs.com/)
- [Splide オプション一覧](https://ja.splidejs.com/guides/options/)
- [transition（MDN）](https://developer.mozilla.org/ja/docs/Web/CSS/transition)
- [transform（MDN）](https://developer.mozilla.org/ja/docs/Web/CSS/transform)
- [Tailwind CSS: Transition Property](https://tailwindcss.com/docs/transition-property)
- [Tailwind CSS: Hover, Focus, & Other States](https://tailwindcss.com/docs/hover-focus-and-other-states)
