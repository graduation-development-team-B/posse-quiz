# Week01｜HTML基礎・Webの仕組み

HTMLでページの骨組みを作り、GitHub Pagesでインターネットに公開するところまで進みます。

「自分で作ったページをスマホで開ける・友達に送れる」状態がこの週のゴールです。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | Webの仕組み・HTMLの構造・主要タグ・Tailwind CDN・GitHub Pages |
| **作るもの** | 自分のプロフィールページ（`my-profile`） |
| **完了条件** | GitHub Pages で公開し、PR本文でタグの選択理由を3点以上説明できる |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 1〜1.5h、POSSE課題 3〜5h（Git/GitHub初回は+2〜3hかかることがあります） |

AIを使う場合はPOSSE課題のみ。インプット・ミニドリルでは使わないこと。

**AIを使わない時間を大切にしてほしい理由**

まずできるようになってほしい、という気持ちがほんとに強いです！

ただ、AIを使って3分クッキングのように進めてしまうと、いつか詰まったときにすごいストレスがかかります。
「今までできていたのにできない」という感覚が来たとき、恥ずかしいとか、自分が否定されるんじゃないかって気持ちになってしまうことを懸念してます！
そうなってから自信を取り戻すのはとても大変だと考えていて最初は筋肉痛のような感じで負荷がある状態になれてください！

学んで成長するためには、一度枷をかけて挑戦することが大事だと思っています。
AIを使わずに、今インプットしたことが正しく自分の頭から出てくるかチャレンジしてみてほしいです 💪

簡単に問題を解くために学ぶんじゃなくて、問題に対してどうアプローチするかを試行錯誤することで成長できる。
そのための時間がミニドリルだと考えているのでAI禁止としています！

---

## インプット

### 1. Webページが表示されるまでの仕組み

![WebサイトとWebページの関係](./images/webpage-website.png)

ブラウザで `https://posse-ap.com/` を開くとき、裏側でこんなやりとりが起きています。

1. ブラウザが「このURLのページを見せてください」とサーバーに要求する
2. サーバーが HTML・CSS などのファイルを送り返す
3. ブラウザがそのファイルを読み込んで画面に表示する

ブラウザ（あなたのPC・スマホ）が「クライアント」、ファイルを持っている側が「サーバー」です。

今週はこのメンタルモデルだけ持っておけば十分です。HTTP の詳細（ステータスコード・ヘッダーなど）は PH2 で扱います。

![クライアントとサーバーのやりとり](./images/client-server.png)

---

### 2. HTMLはページの構造を書く言語

HTML（HyperText Markup Language）は、ページの中身に「これは見出し」「これは段落」「これはリスト」という意味を与えるための言語です。

見た目（色・大きさ・余白）を変えるのは CSS の仕事です。HTML と CSS の役割は分かれています。

![関心の分離のイメージ](./images/separation-of-concerns.png)

#### タグの使い方

タグは `<タグ名>` と `</タグ名>` でコンテンツを囲います。

```html
<p>Web制作を学んでいます。</p>
```

- `<p>` が開始タグ
- `</p>` が終了タグ
- 全体を「要素」と呼ぶ

タグは見た目ではなく意味で選びます。「大きく表示したいから `h1` を使う」ではなく、「このページで一番重要な見出しだから `h1` を使う」という考え方です。

![HTMLタグの構造](./images/tag.png)

#### HTMLファイルの基本構造

すべての HTML ファイルは次の骨格から始まります。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ページタイトル</title>
  </head>
  <body>
    <!-- ここにページの中身を書く -->
  </body>
</html>
```

| 部分 | 役割 |
|---|---|
| `<!DOCTYPE html>` | 「これはHTMLです」とブラウザに伝える宣言 |
| `<html lang="ja">` | ページ全体を囲む。`lang="ja"` は日本語のページであることを示す |
| `<head>` | ブラウザへの設定を書く場所（画面には表示されない） |
| `<meta charset="UTF-8">` | 文字コードの指定。日本語を正しく表示するために必要 |
| `<meta name="viewport" ...>` | スマホでも正しく表示するための設定 |
| `<title>` | ブラウザのタブに表示されるタイトル |
| `<body>` | 実際に画面に表示される内容を書く場所 |

---

### 3. よく使うHTMLタグ

今週使うタグを中心に紹介します。使いながら覚えれば十分なので、今は「こんなものがある」程度に読んでください。

#### 見出し・段落

```html
<h1>ぽっせ</h1>
<h2>自己紹介</h2>
<p>POSSEでプログラミングを学んでいます。好きなものはコーヒーと音楽です。</p>
```

| タグ | 役割 |
|---|---|
| `h1` | 一番重要な見出し。1ページに1つが基本 |
| `h2` | 第2レベルの見出し |
| `h3`〜`h6` | 第3〜6レベルの見出し |
| `p` | 段落（テキストのまとまり） |

#### リスト

```html
<ul>
  <li>ボーカル：田中 凛（Rin Tanaka）</li>
  <li>ギター：佐藤 海（Kai Sato）</li>
  <li>ドラム：山本 蒼（Ao Yamamoto）</li>
</ul>
```

| タグ | 役割 |
|---|---|
| `ul` | 順序なしリスト（箇条書き） |
| `ol` | 順序付きリスト（番号付き） |
| `li` | リストの各項目 |

#### 画像

```html
<img src="./images/rin.jpg" alt="ボーカル田中凛の写真">
```

- `src` 属性に画像ファイルのパスを指定する
- `alt` 属性は「画像が読み込めなかった時の説明文」。スクリーンリーダーでも使われる
- `alt` は省略しないこと

**パスの種類:**

| 種類 | 書き方の例 | 意味 |
|---|---|---|
| 相対パス | `./images/photo.jpg` | 今のHTMLファイルと同じフォルダの中にある `images` フォルダ |
| 相対パス | `./images/photo.jpg` | 1つ上のフォルダにある `images` フォルダ |
| URL | `https://example.com/photo.jpg` | インターネット上の画像 |

今週は `./images/ファイル名` の形（相対パス）を使います。

#### リンク

```html
<a href="https://twitter.com/neonghost">X（旧Twitter）をフォローする</a>
```

- `href` 属性にリンク先のURLを指定する
- 別のWebページへのリンク、同じページ内の別の場所へのリンクなど、様々な使い方がある

#### ページ構造のためのタグ

```html
<body>
  <header>
    <h1>NEON GHOST</h1>
  </header>
  <main>
    <section>
      <h2>メンバー紹介</h2>
      <!-- メンバーの情報 -->
    </section>
  </main>
  <footer>
    <p>2019 NEON GHOST All rights reserved.</p>
  </footer>
</body>
```

| タグ | 役割 |
|---|---|
| `header` | ページの上部（ナビゲーションやタイトル） |
| `main` | ページの主要なコンテンツ |
| `footer` | ページの下部（著作権情報など） |
| `section` | 内容のひとまとまり（見出しとセットで使う） |
| `div` | 意味を持たないグループ化（構造上の都合でまとめる時） |

![DOMツリーのイメージ](./images/dom-tree.png)

---

### 4. 属性

タグには「属性」を追加して補足情報を渡せます。

```html
<img src="./images/photo.jpg" alt="写真の説明">
<a href="https://example.com" target="_blank">外部リンク</a>
<div class="card">カード</div>
```

| 属性 | 使う場面 | 意味 |
|---|---|---|
| `src` | `img` | 画像ファイルのパス |
| `alt` | `img` | 画像の説明文 |
| `href` | `a` | リンク先のURL |
| `target="_blank"` | `a` | 新しいタブで開く |
| `class` | ほぼ全要素 | Tailwindのクラスを指定するために使う |

---

### 5. Tailwind CDN で見た目をつける

HTML だけではページは白黒で素っ気ない見た目になります。見た目を整えるには CSS が必要ですが、今週は **Tailwind CSS** を使います。

Tailwind は、よく使う CSS の指定に短いクラス名をつけてくれたフレームワークです。`class` にクラス名を書くだけで見た目がつくので、CSS をゼロから書くより手軽に始められます。

`head` の中に次を追加すると使えます。

```html
<script src="https://cdn.tailwindcss.com"></script>
```

これは CDN（インターネット上のファイル配信サービス）から Tailwind を読み込む方法です。インターネット接続が必要ですが、インストール作業が不要です。

> 本来 CDN 経由での読み込みは本番環境では推奨されていません。ただ、最初から複雑な環境構築をするより「まず動かして使ってみる」を優先したいので、今は CDN 経由で OK 👌 セットアップの本格的な方法は後の週で扱います。

#### Tailwindのクラスの例

```html
<body class="bg-gray-50">
  <main class="max-w-2xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-900">NEON GHOST</h1>
    <p class="text-gray-600 mt-2">POSSEでプログラミングを学んでいます</p>
  </main>
</body>
```

| クラス | 意味 |
|---|---|
| `bg-gray-50` | 背景色をごく薄いグレーにする |
| `max-w-2xl` | 最大幅を決める |
| `mx-auto` | 左右の外側余白を自動にして中央寄せ |
| `p-6` | 内側に余白をつける |
| `text-3xl` | 文字を大きくする |
| `font-bold` | 太字にする |
| `text-gray-900` | 文字色をほぼ黒にする |
| `text-gray-600` | 文字色を中程度のグレーにする |
| `mt-2` | 上の外側余白をつける |

今週はクラスを5つ以上使ってみることが目標です。全部覚えなくて大丈夫です。

---

### 6. Git・GitHub・GitHub Pages

Git はコードの変更を記録するツールです。GitHubはコードをインターネット上に置く場所です。GitHub Pages は、GitHubに置いたHTMLをWebページとして公開する機能です。

![Gitの概念図](./images/git-concept.png)

#### 全体の流れ

これから行う操作の流れです。

![clone→VSCode→コード作成→pushの流れ](./images/vscode-git-workflow.gif)

#### リポジトリを作る

まず GitHub 上でリポジトリを作成します。

1. GitHubにログインし、左上の「New」ボタンをクリック

![GitHubの新規リポジトリボタン](./images/week02-setup1.png)

2. 次のように入力して「Create repository」をクリック
   - Repository name: `my-profile`
   - Public を選択
   - **「Add a README file」にチェックを入れる**（これでリポジトリが初期化されます）

![リポジトリ名の入力](./images/github-new-repo-form.png)

#### ローカルにクローンしてVSCodeで開く

GitHub上に作ったリポジトリを自分のPCに複製（クローン）します。リポジトリの「Code」ボタンをクリックし、SSH のURLをコピーします。

![CodeボタンからSSH URLをコピー](./images/week02-setup3.png)

ターミナルを開き、以下を実行します。

```bash
# workspaceフォルダを作る（初回のみ）
mkdir -p ~/workspace
cd ~/workspace

# リポジトリをクローン（SSH URL を使う）
git clone git@github.com:（ユーザー名）/my-profile.git
cd my-profile

# VSCodeで開く
code .
```

![クローンしてVSCodeで開く操作](./images/sample_clone.gif)

**VSCode のターミナル**（`Ctrl+J` / `Cmd+J`）でこれ以降の操作を行います。`code .` でVSCodeが開いたら、左のファイルツリーに `README.md` が表示されていれば成功です。

#### index.html を作成する

VSCode の左のファイルツリーで **「新しいファイル」** ボタンをクリックし、`index.html` という名前でファイルを作成します。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>テスト</title>
  </head>
  <body>
    <h1>テスト</h1>
  </body>
</html>
```

書けたら、`<body>` の中に `<h1>テスト</h1>` を追加してブラウザで表示を確認してください。

#### ブラウザで確認する方法（どちらでもOK）

**方法1：Live Server（推奨）**

Week00でインストールした VSCode 拡張機能「Live Server」を使います。ファイルを保存するたびにブラウザが自動で更新されるので便利です。

1. VSCode の右下に表示される「Go Live」ボタンをクリック
2. ブラウザが開いてページが表示される
3. HTMLを編集して保存するたびに自動で更新される

![VSCode右下の「Go Live」ボタン](./images/live-server-go-live.png)

**方法2：ファイルを直接開く**

Live Serverが使えない場合は、HTMLファイルをブラウザで直接開けます。

- **Mac**: Finder でファイルを右クリック → 「このアプリケーションで開く」→ Chrome
- **Windows**: エクスプローラーでファイルを右クリック → 「プログラムから開く」→ Chrome

またはターミナルで次のコマンドを実行する方法もあります。

```bash
# Mac
open index.html

# Windows（PowerShell）
start index.html
```

![初めてのHTMLプレビュー](./images/first-html-preview.png)

「テスト」と表示されれば成功です。ブラウザで確認できたら、POSSE課題に進んで本格的な内容を書いていきます。

#### IssueとブランチでPOSSE課題を管理する

POSSEでは **イシュー駆動開発（Issue Driven Development）** という方法で課題を管理します。作業前に GitHub で Issue を立て、Issue 番号をブランチ名に入れることで「何の作業をしているか」が一目でわかるようになります。

**Step 1: GitHub で Issue を立てる**

1. `my-profile` リポジトリの「Issues」タブをクリック
2. 「New issue」をクリック
3. タイトルに「Week01 プロフィールページ作成」と入力して「Submit new issue」
4. `#1` という番号が付く（以降の週は `#2`, `#3` ... と増えていく）

**Step 2: Issue 番号を使ってブランチを切る**

```bash
git switch -c feature/1-week01-profile
```

`feature/（Issue番号）-（週番号）-（一言説明）` がブランチの命名規則です。

**Step 3: コードを書いてGitHubに送る**

`index.html` に内容を書いたら、VSCode のターミナルで以下を実行します。

```bash
git add .
git commit -m "プロフィールページを作成"
git push -u origin feature/1-week01-profile
```

`push` のときパスワードを聞かれることはありません（Week00でSSH鍵を設定済みです）。

![git add・commit・pushの操作イメージ](./images/git-add-commit-push.gif)

**Step 4: PR を作成する**

GitHub でPRを作成するとき、本文の冒頭に以下を書いてください。

```
Closes #1
```

これを書いておくとPRがマージされたときに Issue が自動でクローズされます。

#### GitHub Pagesで公開する

1. GitHubのリポジトリページで「Settings」タブをクリック

![リポジトリのSettingsタブ](./images/github-settings-tab.png)

2. 左サイドバーの「Pages」をクリック

![GitHub Pagesの設定メニュー](./images/github-pages-menu.png)

3. Source を「Deploy from a branch」に設定し、Branch: `main` / `/ (root)` を選択して「Save」

![mainブランチを選択する](./images/github-pages-settings.png)

1〜3分後にページを更新すると、公開URLが表示されます。

![公開URLが表示される](./images/github-pages-url.png)

#### よくあるエラーと対処

| エラー | 原因 | 対処 |
|---|---|---|
| `Permission denied (publickey)` | SSH鍵が登録されていない | Week00の手順でSSH鍵をGitHubに登録する |
| `remote: Repository not found` | URLが間違い | `git remote -v` で確認し、GitHub のリポジトリ名と一致しているか確認する |
| `code: command not found` | VSCode の `code` コマンドが未設定 | VSCode 上で `Cmd+Shift+P` → 「shell command」と検索 → 「Install 'code' command in PATH」を実行 |
| 画像が表示されない | パスの大文字小文字が違う | ファイル名と `src` を完全一致させる |
| ページが更新されない | まだ反映中 | 2〜3分待って再読み込み |

---

## ミニドリル（AI禁止・45分）

### 着手前：ゴールUIを分解する（5分）

まず**分解のやり方**を確認してください。UIはこうやってブロックに分けて考えます。

![分解の例：①完成イメージ → ②大ブロックに分ける → ③各ブロックの内部を分解](./images/week01-breakdown.png)

---

今週のミニドリルで作るUIです。上と同じやり方で、自分でブロックに分解してみましょう。

![Week01 ミニドリル ゴールUI](./images/minidrill-week01-goal.png)

このUIをブロックに分けると何パーツありますか？以下の表を埋めてから問題1に進んでください。

| ブロック名 | 役割・見た目の特徴 | 使うHTMLタグ | 確認方法 |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

---

### 問題1：映画カードを作る（20分）

`drill-ph1` の `week01-1/` ディレクトリで作業してください。`images/poster.jpg` が入っています。

上のゴールUIと同じ映画カードをHTMLとTailwindで作ってください。
**完成したら `goal.png` と見比べて、同じになっていればOKです。**

#### 仕様

| 項目 | 値 |
|---|---|
| カード幅 | `w-72` |
| ページ背景色 | `bg-zinc-950` |
| カード背景色 | `bg-zinc-800` |
| 角丸 | `rounded-lg` |
| 影 | `shadow-2xl` |
| ポスター画像 | `<img src="./images/poster.jpg" alt="インターステラーのポスター" class="w-full h-44 object-cover">` |
| 本文パディング | `p-4` |
| タイトル | `text-xl font-bold text-white` |
| メタ情報（年・時間） | `text-zinc-400 text-xs` |
| 評価 | `text-yellow-400 text-sm font-bold` |
| ジャンルタグ背景 | `bg-zinc-700` |
| ジャンルタグ文字 | `text-zinc-300 text-xs px-2 py-1 rounded` |
| あらすじ | `text-zinc-400 text-xs leading-relaxed` |
| 再生ボタン | `bg-white text-black text-sm font-bold` |
| 詳細ボタン | `bg-zinc-600 text-white text-sm` |

#### 掲載する内容

- タイトル：インターステラー
- 年・時間：2014 · 2時間49分
- 評価：★★★★★ 8.6 / 10
- ジャンル：SF、アドベンチャー、ドラマ
- あらすじ：地球の環境が崩壊に向かう未来。元宇宙飛行士の農夫クーパーは、人類を救う新天地を求めワームホールへと旅立つ。
- ボタン：▶ 再生 / 詳細情報
- PG-12バッジ

#### Step 1：着手前に分解した表を見ながら、実装順を決める

#### Step 2：1パーツずつ実装してブラウザで確認する

#### Step 3：ゴールUIのスクショと見比べて確認する

---

### 問題2：アーティストカードを作る（10分）

`drill-ph1` の `week01-2/` ディレクトリで作業してください。`images/cover.jpg` が入っています。

今度はダークテーマのカードです。問題1・3と同じ手順で「分解 → 実装 → 確認」で進めてください。

**完成したら `goal.png` と見比べて、同じになっていればOKです。**

![Week01 ミニドリル 問題2 ゴールUI](./images/minidrill-week01-artist.png)

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-gray-900` |
| カード背景 | `bg-gray-800` |
| カード幅 | `w-72` |
| 角丸 | `rounded-xl` |
| 影 | `shadow-2xl` |
| アーティスト写真 | `<img src="./images/cover.jpg" alt="NEON GHOSTのアーティスト写真" class="w-full h-40 object-cover">` |
| ARTISTバッジ | `bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded` |
| 本文パディング | `p-4` |
| アーティスト名 | `text-white text-xl font-bold` |
| サブ情報 | `text-purple-400 text-xs` |
| メンバーリスト | `text-gray-300 text-xs space-y-1` |
| ジャンルタグ背景 | `bg-gray-700` |
| ジャンルタグ文字 | `text-gray-300 text-xs px-2 py-1 rounded` |
| ボタン | `bg-purple-600 text-white text-sm font-bold` |

#### 掲載する内容

- アーティスト名：NEON GHOST
- サブ情報：インディーロック・東京
- メンバー：🎸 ボーカル&ギター：田中 凛 ／ 🥁 ドラム：佐藤 海 ／ 🎹 キーボード：山本 蒼
- ジャンルタグ：ロック・インディー・バンド
- ボタン：プロフィールを見る

---

### 問題3：イベント告知カードを作る（10分）

`drill-ph1` の `week01-3/` ディレクトリで作業してください。`images/event.jpg` が入っています。

映画カードと同じ要領で、今度は別のUIを作ってみましょう。構造が違うので、もう一度「分解 → 実装」の手順で進めてください。

**完成したら `goal.png` と見比べて、同じになっていればOKです。**

![Week01 ミニドリル 問題3 ゴールUI](./images/minidrill-week01-event.png)

#### 仕様

| 項目 | Tailwindクラス |
|---|---|
| ページ背景 | `bg-gray-100` |
| カード背景 | `bg-white` |
| カード幅 | `w-80` |
| 角丸 | `rounded-xl` |
| 影 | `shadow-lg` |
| イベント写真 | `<img src="./images/event.jpg" alt="ハッカソン会場の様子" class="w-full h-36 object-cover">` |
| ヘッダー帯背景 | `bg-orange-500` |
| ヘッダー帯パディング | `px-5 py-4` |
| サブタイトル | `text-orange-100 text-xs font-semibold` |
| イベント名 | `text-white text-xl font-bold` |
| 本文パディング | `p-5` |
| 説明文 | `text-gray-600 text-sm leading-relaxed` |
| リスト間隔 | `space-y-2` |
| リスト文字 | `text-gray-700 text-sm` |
| タグ背景 | `bg-orange-100` |
| タグ文字 | `text-orange-700 text-xs px-2 py-1 rounded` |
| 申し込みボタン | `bg-orange-500 text-white text-sm font-bold` |

#### 掲載する内容

- サブタイトル：POSSE Event
- イベント名：新人ハッカソン 2026
- 説明文：初めてのチーム開発を体験しよう！アイデアをカタチにする2日間。プログラミング歴3ヶ月以上なら誰でも参加できます。
- リスト：📅 2026年6月13日（土）・14日（日）／ 📍 渋谷・POSSEオフィス ／ 👥 対象：PH1修了以上 ／ 🎯 定員：20名
- タグ：ハッカソン・初心者歓迎・チーム開発
- ボタン：申し込む

**完成したらゴールUIのスクショと見比べて、同じになっていればOKです。**

---

## POSSE課題

### テーマ：自分のプロフィールページ

自分のニックネーム・好きなこと・リンクをまとめたプロフィールページを HTML で作成し、GitHub Pages で公開してください。

本名を使う必要はありません。ニックネームやあだ名で作ってください。

前週（Week00）は環境構築のみでした。このページが PH1 最初の制作物になります。

**要件:**

- 以下のタグを使うこと
  - `h1`（ニックネームなど）
  - `h2`（セクション見出しなど）
  - `p`（自己紹介文）
  - `ul` と `li`（好きなことリストなど）
  - `img`（画像。フリー素材や自分で用意したものを使う。すべてに `alt` を書くこと）
  - `a`（SNSリンクや好きなサイトなど）
- `<head>` 内に Tailwind CDN を追加し、Tailwindのクラスを5つ以上使うこと
- GitHub Pagesで公開し、公開URLをPRに記載すること

**提出:**

- GitHubリポジトリURL
- GitHub Pages URL

**PR本文に必ず書くこと:**

1. 使ったHTMLタグを3点以上選び、「なぜそのタグを選んだのか」理由を書く
2. 詰まった場所とどう解決したか（1箇所以上）
3. 【発展・任意】AIに同じページを作らせて、自分の作ったものと何が違うか比較して書く

### チェックポイント

- [ ] `<!DOCTYPE html>` から始まるHTMLの基本構造が書けている
- [ ] `<head>` に Tailwind CDN の `<script>` タグを追加した
- [ ] `h1`、`h2`、`p`、`ul`、`li`、`img`、`a` をすべて使っている
- [ ] すべての `img` に `alt` 属性がある
- [ ] Tailwindのクラスを5つ以上使っている
- [ ] ローカル（VSCode の Live Server またはブラウザで直接開く）で表示を確認した
- [ ] GitHub にコミット・プッシュできた
- [ ] GitHub Pages で公開されていて、URLでアクセスできる
- [ ] PR本文に「なぜそのタグを使ったか（3点以上）」を書いた
- [ ] PR本文に「詰まった場所とどう解決したか」を書いた

---

## 参考資料

### よく使うHTMLタグ

| タグ | 説明 | MDN |
|---|---|---|
| `h1`〜`h6` | 見出し（サイズではなくレベルで選ぶ） | [MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/Heading_Elements) |
| `p` | 段落 | [MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/p) |
| `a` | リンク | [MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/a) |
| `img` | 画像 | [MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/img) |
| `ul` / `ol` | 箇条書き・番号付きリスト | [MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/ul) |
| `li` | リストの項目 | [MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/li) |
| `header` / `main` / `footer` | ページの領域 | [MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/header) |
| `section` | 内容のまとまり | [MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/section) |
| `div` | 汎用グループ | [MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/div) |

### よく使うTailwindクラス（今週の範囲）

| クラス | 意味 |
|---|---|
| `bg-gray-50` / `bg-white` | 背景色 |
| `text-3xl` / `text-xl` / `text-base` | 文字の大きさ |
| `font-bold` | 太字 |
| `text-gray-900` / `text-gray-600` | 文字色 |
| `p-4` / `p-6` | 内側の余白 |
| `mt-2` / `mb-4` | 上下の外側余白 |
| `max-w-2xl` | 最大幅 |
| `mx-auto` | 左右中央寄せ |
| `rounded-lg` | 角丸 |
| `shadow` | 影 |

### 参考動画・記事

- [ウェブ入門（MDN）](https://developer.mozilla.org/ja/docs/Learn/Getting_started_with_the_web) — HTMLとCSSの基礎をステップ形式で学べる
- [Git入門（サルでもわかるGit）](https://backlog.com/ja/git-tutorial/) — Gitの概念を図解で説明した定番の日本語資料
- [GitHub Pages でウェブサイトを公開する方法（Zenn）](https://zenn.dev/topics/githubpages) — GitHub Pagesの設定手順の補足として

### 困った時は

1. 自分でWeb検索する
2. [MDN ドキュメント](https://developer.mozilla.org/ja/docs/Learn/Getting_started_with_the_web)を読む
3. 同期・先輩メンバー・メンターに Discord で質問する
