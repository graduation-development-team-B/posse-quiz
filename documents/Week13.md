# Week13｜Node.js・pnpm・Vite（開発環境の引っ越し）

この12週間、HTMLの `<head>` には毎回この手の一行を書いてきました。

```html
<script src="https://cdn.tailwindcss.com"></script>
```

TailwindもSplideも、使うたびにネット越しに借りてきていたわけです。手軽で、よく働いてくれました。でも、借り物には限界があります。世の中の道具の大半には手が届かないし、コードを本番用に固めることも、Reactを使うこともできません。そこで今週、道具を自分の作業場にそろえて、手元で組み立てるように移行します。引っ越しを仕切るのが **Node.js・pnpm・Vite** の3つです。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | Node.jsとは、mise・pnpmでの道具の管理、`pnpm create vite`（Vanilla）、開発サーバー（`pnpm run dev`）、HMR、フォルダ構成、`package.json`の読み方、`pnpm run build`とdist、GitHub Pagesデプロイ（`base: './'`） |
| **作るもの** | Vite（Vanillaテンプレート）で動くカウンターアプリ。`pnpm run build` で本番用ファイルまで固める |
| **完了条件** | `pnpm run dev` で開発サーバーを起動でき、`pnpm run build` で `dist/` フォルダを生成できる |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・自信度チェック・ミニドリルでは使わないこと。

---

## インプット

### 毎回道具を借りに走っていた

`<script src="https://cdn.tailwindcss.com">` を書くと、そのページを開くたびに、ブラウザはネットの向こうへTailwindを取りに行きます。CDN（Content Delivery Network）という仕組みで、これはこれで便利でした。でも、よく考えると、あなたは道具を1つも持っていません。使うたびに、外へ借りに走っている状態です。

借り物には、限界が3つあります。

- **ネットにつながっていないと道具が届かない。**
- **世の中の道具の、ほんの一部にしか手が届かない。** ライブラリはnpmという配布所に集まっていて、CDNで配られているのはそのうちの人気どころだけです。しかも「どのバージョンを使ったか」を記録して固定する仕組みがないので、あとから同じ環境をそっくり作り直せません。
- **書いたコードを、ブラウザに渡す前に加工できない。**

3つめは言葉だけだと像を結びにくいので、実物を出します。来週から使うReactでは、JavaScriptの中にこう書きます。

```js
const button = <button>増やす</button>;
```

`=` の右に、HTMLのタグがそのまま置いてあります。これはJavaScriptの文法ではないので、このままブラウザに渡すと `Unexpected token '<'` という文法エラーで止まります。Reactを使うには、**この行をふつうのJavaScriptに翻訳してからブラウザに渡す**工程が要る。ほかにも「余計な空白と改行を削って、ファイルを小さくしてから公開する」といった仕上げがあります。どれも、書いたコードとブラウザのあいだに、手を入れる場所が要る。CDN方式には、その場所がありません。**Reactに進めない直接の理由が、これです。**

ここで、腕のいい職人を思い浮かべてください。道具を持たない職人は、板を切るたびにレンタル屋へノコギリを借りに行きます。店が閉まっていれば、その日は何も作れない。棚に並んでいる道具しか使えないし、借りたノコギリを自分好みに研ぐこともできない。一方、自分の作業場を持つ職人は、道具を棚にそろえ、作業灯をつければいつでも手を動かせます。刃を研ぎ、材料を下ごしらえして、仕上がった品は箱に詰めて出荷する。

CDNは前者、レンタル屋通いです。今週やるのは、後者への引っ越し——**道具を自分の作業場にそろえ、手元で組み立てて、最後に出荷用に固める**、という作業です。

| これまで（CDN方式） | 今週から（手元の開発環境） |
|---|---|
| 使うたびにネットから借りる | 道具を自分のフォルダにそろえる |
| CDNで配られている道具しか使えない | npmにある道具を、バージョンごと固定して使える |
| コードを加工する工程がない | 本番用に小さくまとめられる（ビルド） |
| JSXなどは使えない | Reactなどの土台になる |

---

### ブラウザの外でJavaScriptを動かす

道具を作業場にそろえる、と言いました。その作業場を動かす電源にあたるのが **Node.js** です。

これまでJavaScriptは、ブラウザの中だけで動く言語でした。`<script>` に書いたJSは、Chromeが読んで実行してくれる。でも、開発ツール（このあと使うViteなど）は、ブラウザではなく**ターミナル**で動きます。ブラウザの外でJavaScriptを走らせる何かが要る。それがNode.jsです。

言葉で聞くよりも、動かしたほうが早いです。ターミナルで `node` とだけ打ってEnterを押してください。

```
$ node
Welcome to Node.js v22.15.0.
Type ".help" for more information.
>
```

`>` が出たら、ここはもう「ブラウザの外のJavaScript」です。試しに計算させてみます。

```
> 1 + 1
2
```

ちゃんと動きます。JavaScriptは、ブラウザがなくても走る。では、ブラウザの中でおなじみだった `document` を呼んでみましょう。Week07以降、さんざん使ってきた、あの `document.querySelector` の `document` です。

```
> document
Uncaught ReferenceError: document is not defined
```

`document is not defined`——「`document` なんて無い」と怒られました。当然です。`document` はブラウザが用意してくれる「表示中のページ」の入り口で、ここにはブラウザがいない。**同じJavaScriptでも、動く場所が変わると、使える道具も変わる**というわけです。これがブラウザの外の世界、Node.jsです。抜けるときは `.exit` と打つか、Ctrl+C を2回押します。

このNode.jsが土台にあるおかげで、開発サーバーの起動やビルドといった「ブラウザの外の仕事」ができるようになります。POSSEでは、Node.js自体のバージョンは **mise** で管理します（Week00でセットアップ済み）。今どのバージョンが入っているかは、次のコマンドで確かめられます。

```
$ node -v
v22.15.0
```

---

### npmではなく、pnpmで道具をそろえる

作業場に道具をそろえる、その運搬役が**パッケージマネージャー**です。ライブラリ（他人が作った部品）をネットから取ってきて、あなたのプロジェクトフォルダに入れてくれます。

Node.jsには標準で **npm** が付いてきます。ただしPOSSEでは、その代わりに **pnpm** を使います。理由は3つあって、最後のひとつがいちばん大事です。

ひとつ、速い。ふたつ、同じ道具を何度もダウンロードせず、パソコンの中の1か所（グローバルストア）から共有するので、ディスクを食わない。プロジェクトを10個作っても、Tailwindの実体は1つで済みます。

3つめが本題です。**ライブラリを入れるという行為は、他人が書いたコードを自分のパソコンで実行することでもあります。** npmには誰でもパッケージを公開できるので、乗っ取られたアカウントから悪意あるコードが配られる事件が、実際に何度も起きています。しかも道具は道具を呼ぶので、あなたが入れた1つの裏に、名前も知らないパッケージが何十個も付いてきます。

pnpmは、ここに最初から2枚の壁を立てています。

- **入れた直後に勝手にコードを走らせない。** npmでは、パッケージに `postinstall` という「インストール直後に実行される処理」を仕込むことができ、これが乗っ取り事件の定番の入り口になってきました。pnpmはv10から、この自動実行を既定で止めます。本当に必要な道具だけ、名指しで許可する形です。
- **公開されたての版を、すぐには入れない。** pnpmはv11から、公開後24時間経っていないバージョンを既定で拒みます（`minimumReleaseAge`）。おかしなパッケージはたいてい数時間で見つかって消されるので、一日待つだけで大半をよけられる、という考え方です。

npmでも注意深く運用すれば防げますが、pnpmは**何もしなくてもその状態から始まります**。「どちらでも動くが、事故ったときの被害が違う」——POSSEがpnpmで統一しているのは、この差のためです。

なおこの2つの壁は、pnpm本体が新しくないと効きません。2枚目は v11 からなので、`pnpm -v` で確認して、`11` より小さい数字が出たら上げておいてください（`pnpm self-update`。miseで入れた場合は `mise use -g pnpm@latest`）。

```
$ pnpm -v
11.20.0
```

この教材のコマンドは、すべて `pnpm` で書きます。ネットの記事には `npm install` と書いてあることが多いですが、POSSEでは読み替えて `pnpm install` を使ってください。よく使うのは、この3つです。

| コマンド | 何をするか |
|---|---|
| `pnpm create vite` | Viteプロジェクトの雛形を作る |
| `pnpm install` | `package.json` に書かれた道具を作業場に運び込む |
| `pnpm run dev` | 開発サーバーを起動する |

---

### 作業場を立ち上げる

いよいよ作業場を作ります。ターミナルで、プロジェクトを置きたいフォルダに移動してから、次を実行してください。

```
pnpm create vite my-counter-app --template vanilla
```

読み下すと、「`my-counter-app` という名前で、`vanilla`（＝素のJavaScript。フレームワークなし）のViteプロジェクトを作れ」という指示です。初回はViteの雛形ツールをダウンロードするか聞かれることがあるので、その場合はEnterで進めます。しばらくすると、こう出ます。

```
Scaffolding project in .../my-counter-app...

Done. Now run:

  cd my-counter-app
  pnpm install
  pnpm dev
```

親切にも、次にやることまで書いてくれています（`pnpm dev` は `pnpm run dev` の短い書き方で、どちらでも同じです。この教材では `pnpm run dev` で統一します）。順に打ちます。まず作った作業場に入り、道具を運び込みます。

```
cd my-counter-app
pnpm install
```

`pnpm install` を打つと、`package.json` に書かれた道具（今回はVite本体）が `node_modules` というフォルダに入り、`pnpm-lock.yaml` というファイルも作られます。これで棚に道具がそろいました。次は、作業場に電気を通します。

```
pnpm run dev
```

ターミナルに、こんな表示が出ます。

```
  VITE v8.2.0  ready in 620 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

`http://localhost:5173/` が、あなたの手元で動いている開発サーバーのアドレスです。`localhost` は「このパソコン自身」という意味で、`5173` はViteが使う番号（ポート）。このURLをブラウザで開くと、Viteの初期ページが表示されます。

大事な引っ越しポイントがひとつ。**Vite環境では、これまでのLive Serverの代わりに、この `pnpm run dev` が開発サーバーになります。** サーバーを止めるときは、ターミナルで Ctrl+C。開発中はこのターミナルを開いたままにしておきます。

---

### 保存した瞬間に画面が変わる

開発サーバーを起動したまま、`src/style.css` を開いて、どこかの色を変えて保存してみてください。

ブラウザに切り替えると——**再読み込みしていないのに、色がもう変わっています。** そしてターミナルにも、1行増えているはずです。

```
11:24:23 [vite] (client) hmr update /src/style.css
```

`hmr update`。「変わったところだけ差し替えた」という報告です。ページ全体は読み込み直していません。この仕組みを **HMR（Hot Module Replacement）** と呼びます。

続けて、今度は `src/main.js` の文字を書き換えて保存し、もう一度ターミナルを見てください。今度は、さっきと違う行が出ます。

```
11:24:26 [vite] (client) page reload src/main.js
```

`page reload`——ページごと読み込み直しています。同じ保存なのに、CSSとJSで扱いが違う。

理由はこうです。CSSは、当てているスタイルを新しいものに貼り替えれば済みます。ところがJSは、もう実行されて画面を組み立てたあとです。新しいコードを渡したところで、**すでに画面に出ているものをどう作り直せばいいか**まではViteにはわかりません。だから安全側に倒して、ページごとやり直します。逆に言えば、「差し替わったらここをこう直して」とコードの側から教えてあげれば、JSでもHMRが効きます。Week14で入れるReact用のプラグインが、まさにそれを裏でやってくれる道具です。

紛らわしい言葉が2つあるので、ここで並べておきます。

| | 何をするか | 入力中の文字やカウントの数は |
|---|---|---|
| リロード（Live Serverはこれ） | ページ全体を読み込み直す | 消える |
| HMR | 変わったモジュールだけ差し替える | 残る |

「ホットリロード」という言い方も見かけますが、指す中身が人によってぶれます（丸ごと読み込み直すことを指す人もいれば、HMRを指す人もいる）。この教材では、Viteが実際に出す `page reload` と `hmr update` の呼び方に合わせます。

書いては保存し、ブラウザで確かめる。これが今週の基本動作です。

---

### 作業場の中には何が入っているか

`pnpm create vite` が作ったフォルダの中を、いちど見渡しておきます。

| ファイル / フォルダ | 中身 |
|---|---|
| `index.html` | 入り口となるHTML。`<div id="app"></div>` と、`src/main.js` を読み込む行がある |
| `package.json` | プロジェクトの設定書。道具の一覧やコマンドが書いてある |
| `pnpm-lock.yaml` | 入れた道具の正確なバージョンの記録 |
| `node_modules/` | 借りてきた道具の実体が全部入る、巨大なフォルダ |
| `public/` | そのまま公開される画像などを置く場所（雛形では `favicon.svg` などが入っている） |
| `src/main.js` | JavaScriptのメインファイル。ここに処理を書く |
| `src/style.css` | スタイルシート |
| `src/counter.js`・`src/assets/` | 雛形の初期ページが使っている部品と画像。今週は使いません（`import` しなくなれば本番用ファイルにも入らないので、消しても残したままでも構いません） |

`index.html` を開くと、中身は驚くほど短く、`<div id="app"></div>` という空の箱と、次の一行があるだけです。

```html
<script type="module" src="/src/main.js"></script>
```

画面の中身は、この `src/main.js` が動いて後から流し込みます。だから、**このプロジェクトの `index.html` は、ダブルクリックやLive Serverで直接開いても動きません。** `/src/main.js` や `import` の行を組み立てているのは開発サーバーなので、必ず `pnpm run dev` で開いてください。ここも、これまでとの大きな違いです。

もうひとつ、`node_modules` について。これは道具の実体が丸ごと入るので、平気で数万ファイル・数百MBになります。ただし、中身は `package.json` と `pnpm-lock.yaml` さえあれば `pnpm install` でいつでも作り直せます。だから、**`node_modules` はGitにコミットしません**（重いうえに再生成できるから、記録する意味がない）。Viteの雛形には最初から `.gitignore` が入っていて、`node_modules` と、このあと作る `dist` は最初から除外されています。自分で書き足す必要はありませんが、なぜ除外されているかは知っておいてください。

---

### 設定書（package.json）を読む

作業場の設定書、`package.json` を開いてみます。

```json
{
  "name": "my-counter-app",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^8.2.0"
  }
}
```

はじめて見ると項目が多く感じますが、当面おさえるのはこれだけです。

| フィールド | 意味 |
|---|---|
| `name` | プロジェクト名 |
| `version` | バージョン番号 |
| `scripts` | `pnpm run xxx` で呼び出せるコマンドの登録表 |
| `devDependencies` | 開発中だけ必要な道具とそのバージョン |
| `dependencies` | 本番でも必要な道具（Reactなどはここに入る） |

たとえば `pnpm run dev` は、`scripts` の `dev` に書いてある `vite` を実行しています。`pnpm run build` なら `vite build`。つまり `scripts` は、長いコマンドに短いあだ名を付けておく場所です。残りの2つ、`"type": "module"` は「`import` / `export` が使える形式ですよ」という宣言、`"private": true` は「うっかり世界に公開しない」ための印です。今は「そういうものがある」で十分で、暗記はしなくて構いません。

なお `devDependencies` のバージョン番号（ここでは `^8.2.0`）は、プロジェクトを作った時期によって変わります。数字そのものより、「開発で使う道具がここに並ぶ」という読み方を覚えてください。

---

### main.jsを書き換えて、カウンターにする

`src/main.js` を、いったん全部消して、次のカウンターのコードに書き換えます。

```js
import './style.css';

document.querySelector('#app').innerHTML = `
  <h1>カウンター</h1>
  <p id="count">0</p>
  <button id="btn">増やす</button>
`;

const countEl = document.querySelector('#count');
const btn = document.querySelector('#btn');
let count = 0;

btn.addEventListener('click', () => {
  count += 1;
  countEl.textContent = count;
});
```

1行目の `import './style.css';` が、これまでにはなかった書き方です。CDNで `<link>` を読み込む代わりに、JavaScriptの中からCSSファイルを直接呼び込んでいます。これが「ファイルを分割してつなぐ」ということ。`document.querySelector('#app')` は、`index.html` の `<div id="app"></div>` を指していて、そこに中身を流し込んでいます。

保存すると、ターミナルに `page reload src/main.js` が流れ、ブラウザにカウンターが出ます。「増やす」を押して数字が増えれば成功。中身のロジックは、Week07で書いた `addEventListener` のカウンターとまったく同じで、置き場所が `src/main.js` に変わっただけです。

ここでいちばん転びやすいのが、`import` のパスです。ファイル名を1文字でも間違えると、ブラウザに真っ赤なエラーが出ます（このあとのミニドリル問題2が、まさにその罠です）。動かないときは、まずブラウザのConsoleとターミナルのエラー文を読む——これはWeb開発を続けるかぎり、ずっと効く習慣です。

---

### 本番用に固めて公開する

開発サーバー（`pnpm run dev`）は、あなたのパソコンの中だけで動いています。友だちや採点者に見せるには、**本番用のファイルに固めて**、ネット上に置く必要があります。固める作業がビルドです。

```
pnpm run build
```

実行すると、こんな要約が出て、`dist/` という新しいフォルダができます。

```
vite v8.2.0 building client environment for production...
transforming...
✓ 5 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                 0.46 kB │ gzip: 0.30 kB
dist/assets/index-CsUDhMuy.css  4.10 kB │ gzip: 1.46 kB
dist/assets/index-F_J6GZSp.js   0.93 kB │ gzip: 0.55 kB

✓ built in 236ms
```

`dist/` の中に、余計な空白を削って小さくまとめたHTML・CSS・JSが入ります（ファイル名の `index-CsUDhMuy` のような部分は中身から計算されるので、あなたの手元では違う文字列になります。ファイルサイズも書いたコード次第で変わります）。この `dist/` の中身が、本番に置くファイルです。

ここで、さっきの「ファイルを分けてつなぐ」が効いてきます。`src/main.js` と `src/style.css` は別々のファイルでしたが、`dist/` に出てきたのは `assets/` の下のCSS 1本とJS 1本だけ。**分けて書いたものを、公開する直前に1つにまとめ直している**わけです。これがあるから、開発中はいくらでもファイルを分けられます。

固めた結果を手元で確認したいときは、次のコマンドでプレビューできます（`pnpm run dev` とは別の `http://localhost:4173/` で開きます）。

```
pnpm run preview
```

#### GitHub Pagesに載せる前に、必ず1行足す

固めたファイルを、無料で公開できる **GitHub Pages** に載せます。ただし、そのまま載せると**画面が真っ白**になります。理由は、ビルドしたHTMLの中身を見ると分かります。

```html
<script type="module" crossorigin src="/assets/index-F_J6GZSp.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-CsUDhMuy.css">
```

読み込み先が `/assets/...` と、スラッシュ始まりの**絶対パス**になっています。ところがGitHub Pagesのプロジェクトサイトは、`https://ユーザー名.github.io/リポジトリ名/` という一段深い場所に置かれます。すると `/assets/...` は `https://ユーザー名.github.io/assets/...` を探しに行ってしまい、`リポジトリ名` が抜けるので **404（見つからない）** になる。JSもCSSも読めず、真っ白というわけです。

これを直すのが、`vite.config.js` に置く1行です。プロジェクトの一番上（`package.json` と同じ階層）に `vite.config.js` を作り、次を書きます。

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
});
```

`base: './'` は「読み込み先を、絶対パスではなく**相対パス**にしてくれ」という指定です。もう一度 `pnpm run build` すると、さっきの行がこう変わります。

```html
<script type="module" crossorigin src="./assets/index-F_J6GZSp.js"></script>
<link rel="stylesheet" crossorigin href="./assets/index-CsUDhMuy.css">
```

`/assets` が `./assets` になりました。相対パスなら、`/リポジトリ名/` の下に置かれても正しくたどれるので、404になりません。**Viteで作ったサイトをGitHub Pagesに載せるときは、この `base: './'` を先に設定する**——これは合言葉として覚えておいてください。

#### その前にリポジトリを public にする

`base: './'` を入れたのに公開できない、という詰まり方がもうひとつあります。**GitHub Pagesは無料で使えます。ただし条件がひとつあって、リポジトリが public であることです。** GitHubの無料プラン（GitHub Free）では、private のリポジトリから GitHub Pages を公開できません。公式ドキュメントに「リポジトリを持つアカウントが GitHub Free を使っている場合、そのリポジトリは public でなければならない」と明記されています。private のまま Settings → Pages を開くと、公開元を選ぶところで手が止まります。提出用のリポジトリは public で作ってください。

逆向きの注意も、ここで1つ。**GitHub Pages で公開したサイトは、リポジトリが private であっても、サイト自体はインターネット上の誰からでも見られます。** これも公式に警告として書かれています。だから、パスワードやAPIキーのような「他人に見られてはいけないもの」を、公開するコードの中に書かないこと。今週はまだ出てきませんが、この先ずっと気をつけないといけません。

#### `dist` を公開する

`base: './'` を設定してビルドしたら、`dist/` を公開します。`gh-pages` という道具を入れると、`dist/` の中身を公開用ブランチへ自動で送ってくれます。

```
pnpm add -D gh-pages
```

`package.json` の `scripts` に1行足します。

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "gh-pages -d dist"
}
```

あとはビルドして送るだけです。

```
pnpm run build
pnpm run deploy
```

自動で `gh-pages` ブランチが作られるので、Settings → Pages でそのブランチを公開元に指定すれば完了です。2回目以降は `pnpm run build && pnpm run deploy` で更新できます。真っ白になったら、まず疑うのは `base: './'` の書き忘れです。

---

### Tailwindを作業場に入れる（発展・任意）

ここは余力がある人向けです。これまでのTailwindはCDN（`<script src="https://cdn.tailwindcss.com">`）でした。手軽ですが、この読み込み方はTailwind公式が「開発用であって、本番向けではない」と明言しているものです。Vite環境では、Tailwindも借り物ではなく、pnpmで作業場に入れて使います。

先に、引っかかりやすい点をひとつ。**ここでTailwindのバージョンが上がります。** これまで使ってきた `cdn.tailwindcss.com` はv3で、これから入れるのはv4です。`bg-blue-500` のようなクラス名はそのまま使えますが、**設定の書き方が変わります**。v3は `tailwind.config.js` という設定ファイルと `@tailwind base;` という3行の書き出しが要りましたが、v4ではどちらも不要で、次に書く `@import "tailwindcss";` の1行だけになります。ネットの記事を読むときは、まずどちらのバージョンの話かを確かめてください。`tailwind.config.js` が出てきたら、それはv3の記事です。

もうひとつ、こちらは気づきにくい変更です。いくつかのクラスは、名前はそのままで**中身の大きさがずれました**。エラーは出ず、ただ見た目が変わるだけなので、いちばん気づきにくいタイプです。

| これまで（v3）で書いていたもの | v4では |
|---|---|
| `shadow-sm` | `shadow-xs` に相当。`shadow-sm` と書くと、v3の `shadow` くらいの濃さになる |
| `rounded-sm` | `rounded-xs` に相当。`rounded-sm` と書くと、v3の `rounded` くらいの丸さになる |
| `ring` | `ring-3` と書く（v4の `ring` は1pxで、色も青ではなく文字色になった） |
| `outline-none` | `outline-hidden` と書く |

これまでの週で書いたコードをコピーしてきて「なんか影が濃い」「角が丸すぎる」と感じたら、この表を思い出してください。`shadow` や `rounded` のように、後ろに何も付けない形はv4でもそのまま使えます。

まず、Tailwind本体とVite用のプラグインを入れます。

```
pnpm add -D tailwindcss @tailwindcss/vite
```

`vite.config.js` にプラグインを登録します（`base: './'` はそのまま残します）。

```js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
});
```

最後に、`src/style.css` の先頭に次の1行を書けば、Tailwindのクラスが使えるようになります。

```css
@import "tailwindcss";
```

---

### 今日のまとめ

- CDNは、使うたびにネットから道具を借りる方式。今週からは道具を自分の作業場（`node_modules`）にそろえ、`pnpm run dev` の開発サーバーで組み立てる。`index.html` を直接開いても動かず、必ず開発サーバー経由で開く。
- Node.jsはブラウザの外でJavaScriptを動かす土台（`node` で `document` を呼ぶと `ReferenceError`＝ブラウザがいない証拠）。道具はpnpmで入れ、`import` でファイルをつなぐ。保存すると、CSSは差し替えだけで済み（`hmr update`）、JSは今週の素のJavaScriptではページごと読み込み直しになる（`page reload`）。
- `pnpm run build` で `dist/` に本番用ファイルが出る。GitHub Pagesに載せるなら、`vite.config.js` に `base: './'` を必ず設定する（絶対パスのままだとアセットが404になり、画面が真っ白になる）。リポジトリは public にすること（無料プランでは private から公開できない）。

> **次週とのつながり**：Week14からはReactに入ります。作業場（開発環境）ができたので、次はその中でUIを「部品（コンポーネント）」に分けて作ります。同じカードを何度もコピペする書き方から卒業し、部品を1つ作って何度も使い回す——その第一歩がReactです。

---

## ミニドリル（AI禁止・60分）

このドリルは、インプットで作った自分のViteプロジェクト（`my-counter-app`）の中で行います。`pnpm run dev` で開発サーバーを起動したまま進めてください。完成の判断は、ブラウザ（`http://localhost:5173/`）での見え方と動きで確認します。

### 着手前：着手前分解表（5分）

いきなり書き始めず、まず頭の中を整理します。コードを書く前に、次の表を埋めてください。

> 分解の例はWeek03の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

| 項目 | 書くこと |
|---|---|
| 完成状態 | ボタンを押したとき、数字がどう変わるか（+1 / -1 / 0に戻す） |
| 編集するファイル | どのファイルに書くか（`src/main.js`） |
| 取得する要素 | `querySelector` で何を取るか（`#count`、各ボタンのid） |
| イベント | どのボタンに何のイベントを付けるか（`click`） |
| 状態の置き場所 | 数を覚えておく変数（`let count`）をどこに置くか |
| 確認方法 | `pnpm run dev` で開いて押す。保存したら画面に反映されるか |

---

### 問題1：カウンターに「減らす」「リセット」を足す（20分）

インプットで作ったカウンター（`src/main.js`）に、ボタンを2つ追加します。

- 「減らす」ボタン：押すとカウントが −1 される
- 「リセット」ボタン：押すとカウントが 0 に戻る

**完成の確認方法：** 開発サーバーで開き、「増やす」で数字が増え、「減らす」で減り、「リセット」で0に戻れば成功です。3つのボタンがそれぞれ正しく動くことを確かめてください。あわせて、カウントを何回か増やした状態で `src/main.js` を保存し、**数字が0に戻ってしまう**ことも見ておいてください。JSの変更はページごと読み込み直しになる（`page reload`）ので、画面の状態は残りません。

<details>
<summary>ヒント</summary>

まず `innerHTML` のボタンを増やし、それぞれに `id` を付けます。次に `querySelector` でボタンを取得し、`addEventListener('click', ...)` を追加します。「増やす」を真似れば、あとは `count += 1` を `count -= 1` や `count = 0` に変えるだけです。

```js
const decreaseBtn = document.querySelector('#decrease-btn');
decreaseBtn.addEventListener('click', () => {
  count -= 1;
  countEl.textContent = count;
});
```

</details>

<details>
<summary>解答</summary>

```js
import './style.css';

document.querySelector('#app').innerHTML = `
  <h1>カウンター</h1>
  <p id="count">0</p>
  <div>
    <button id="increase-btn">増やす</button>
    <button id="decrease-btn">減らす</button>
    <button id="reset-btn">リセット</button>
  </div>
`;

const countEl = document.querySelector('#count');
const increaseBtn = document.querySelector('#increase-btn');
const decreaseBtn = document.querySelector('#decrease-btn');
const resetBtn = document.querySelector('#reset-btn');
let count = 0;

increaseBtn.addEventListener('click', () => {
  count += 1;
  countEl.textContent = count;
});

decreaseBtn.addEventListener('click', () => {
  count -= 1;
  countEl.textContent = count;
});

resetBtn.addEventListener('click', () => {
  count = 0;
  countEl.textContent = count;
});
```

</details>

---

### 問題2：バグ診断（importのファイル名）（15分）

次のコードは、あるViteプロジェクトの `src/main.js` です。`pnpm run dev` で起動すると、画面が真っ赤なエラー表示になり、スタイルも当たりません。何が問題か説明し、修正してください。

```js
// src/main.js
import './styles.css';

document.querySelector('#app').innerHTML = '<h1>こんにちは</h1>';
```

このとき、ブラウザのConsoleとターミナルには、次のエラーが出ています。

```
[vite] Internal server error: Failed to resolve import "./styles.css" from "src/main.js". Does the file exist?
  Plugin: vite:import-analysis
  File: /.../src/main.js:1:8
  1  |  import './styles.css';
     |          ^
```

<details>
<summary>ヒント</summary>

エラー文をそのまま読んでみましょう。「`./styles.css` という import を解決できなかった。そのファイルは存在する？」と言っています。Viteのプロジェクトに実際にあるCSSファイルの名前と、`import` に書いた名前を1文字ずつ見比べてください。

</details>

<details>
<summary>解答の要点</summary>

`import` に書いたのは `./styles.css`（`s` あり）ですが、Viteの雛形に実際にあるファイルは `./style.css`（`s` なし）です。名前が1文字違うだけで、Viteはファイルを見つけられず、`Failed to resolve import "./styles.css" ...` というエラーになります。

```js
// 誤り
import './styles.css';

// 正しい
import './style.css';
```

`import` はファイル名が1文字でも違うとエラーになります。動かないときは、まずブラウザのConsoleとターミナルのエラー文を読み、`Failed to resolve import` と出ていたら、まっさきに import のパスとファイル名を疑ってください。

</details>

---

### 問題3：前週のホバーカードを、Viteに引っ越す（25分）

Week12で作った「マウスを乗せるとふわっと浮き上がるカード」を、今週のViteプロジェクトに移植します。ポイントは、**CSSを `src/style.css` に分けて書き、`src/main.js` から `import` で読み込む**こと。今週の「ファイルを分割してつなぐ」を、前週のアニメーションで練習します。

Week12ではTailwindのクラスで書きましたが、今回はViteのVanillaプロジェクトなので、素のCSS（Week12の「素のCSSで書く場合」で見た `transition` と `transform`）で書きます。

- `src/style.css`：カードの見た目と、`transition` / `:hover` での `transform` を書く
- `src/main.js`：`import './style.css';` した上で、カードのHTMLを `#app` に流し込む

**完成の確認方法：** 開発サーバーで開き、カードにマウスを乗せると、0.3秒ほどかけてカードが少し持ち上がり、影が濃くなれば成功です。`src/style.css` を編集して保存すると、HMRですぐ反映されることも確かめてください。

<details>
<summary>ヒント</summary>

`src/style.css` に、普段の状態と `:hover` の状態を分けて書きます。`transition` を付け忘れると「じわっ」ではなく「パッ」と動くので、そこも確認しましょう。

```css
.card {
  transition: transform 300ms ease, box-shadow 300ms ease;
}
.card:hover {
  transform: translateY(-6px);
}
```

</details>

<details>
<summary>解答</summary>

```css
/* src/style.css */
.card {
  width: 240px;
  padding: 24px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 300ms ease, box-shadow 300ms ease;
}
.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

```js
// src/main.js
import './style.css';

document.querySelector('#app').innerHTML = `
  <div class="card">
    <h2>ホバーしてみて</h2>
    <p>マウスを乗せると浮き上がります</p>
  </div>
`;
```

`import './style.css';` が、CSSファイルを分割してつないでいる部分です。動きの中身（`transform` で浮かせ、`transition` でなめらかにする）はWeek12そのまま。置き場所と読み込み方だけがVite流に変わっています。

</details>

---

## POSSE課題

### テーマ：Viteで作るカウンターアプリ

**これまでの週の提出物とは別に、今週の新しいViteプロジェクト**を作ります。`pnpm create vite` で雛形を作り、カウンターアプリを完成させて、`pnpm run build` で本番用ファイルまで固めてください。

**要件:**

- `pnpm create vite <プロジェクト名> --template vanilla` でVanillaテンプレートのプロジェクトを作る
- `pnpm install` → `pnpm run dev` で開発サーバーを起動して開発する
- カウンターに次の3つのボタンを実装する
  - 「+」または「増やす」ボタン（カウントを +1）
  - 「−」または「減らす」ボタン（カウントを −1）
  - 「リセット」ボタン（カウントを 0 に戻す）
- CSSは `src/style.css` に書き、`src/main.js` から `import './style.css';` で読み込む
- `vite.config.js` に `base: './'` を設定する
- `pnpm run build` を実行して `dist/` フォルダが生成されることを確認する
- `node_modules/` がGitにコミットされていないこと（`.gitignore` に含まれていること）を確認する
- GitHubリポジトリにpushしてURLを提出する

**【発展・任意】**

- GitHub Pagesで公開し、公開URLも提出する（`base: './'` を設定済みであることが前提）
- リセット時やマイナス値のときに色を変えるなど、見た目の工夫を加える
- カウントを `localStorage` に保存し、リロードしても値が残るようにする
- CDNではなくpnpmでTailwindを導入して見た目を整える（発展の手順を参照）

**提出:**

- GitHubリポジトリURL
- （発展）GitHub PagesのURL

**PR本文に必ず書くこと:**

1. プロジェクトを作ってから完成までに打ったコマンドの順序（`pnpm create vite` → `pnpm install` → `pnpm run dev` → `pnpm run build` など）
2. `vite.config.js` に `base: './'` を設定した理由（設定しないと何が起きるか）
3. 詰まった場所とどう解決したか（1箇所以上。エラーが出たら、そのエラー文もあわせて書く）

## 確認結果

### 表示確認

- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録

今週の実装で判断が必要だった場面を1つ書く:

- 選択肢A（例: デプロイは `dist` の中身を手動で公開ブランチに置く方式）:
- 選択肢B（例: デプロイは `gh-pages` ツールに任せる方式）:
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
- AIが間違えた・足りなかったこと（`base: './'` の設定・`import` のパス・pnpmではなくnpmで案内してくるなど）:
- 自分が修正・判断した箇所:

### チェックポイント

- [ ] `pnpm create vite <名前> --template vanilla` でプロジェクトを作成した
- [ ] `pnpm install` を実行した
- [ ] `pnpm run dev` で開発サーバーが起動した
- [ ] 「+」「−」「リセット」の3ボタンが正しく動いている
- [ ] CSSを `src/style.css` に分け、`src/main.js` から `import` で読み込んでいる
- [ ] `vite.config.js` に `base: './'` を設定した
- [ ] `pnpm run build` で `dist/` フォルダが生成された
- [ ] `node_modules/` が `.gitignore` に含まれている（コミットされていない）
- [ ] リポジトリURLが提出されている
- [ ] PR本文にコマンドの順序・`base: './'` の理由・詰まった箇所を書いた
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] AIとの比較を記録した（Week06以降必須）
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・コマンドの意味確認を済ませた

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### よく使うコマンド

| コマンド | 何をするか |
|---|---|
| `pnpm create vite <名前> --template vanilla` | Vanillaテンプレートのプロジェクトを作る |
| `pnpm install` | `package.json` の道具を `node_modules` に入れる |
| `pnpm run dev` | 開発サーバーを起動する（`http://localhost:5173/`） |
| `pnpm run build` | 本番用ファイルを `dist/` に生成する |
| `pnpm run preview` | ビルドした結果を手元で確認する |
| `pnpm add -D <パッケージ名>` | 開発用の道具を追加する |
| Ctrl+C | 開発サーバーを止める |
| `node -v` / `pnpm -v` | バージョンを確認する |

### package.json の主なフィールド

| フィールド | 意味 |
|---|---|
| `name` | プロジェクト名 |
| `version` | バージョン番号 |
| `scripts` | `pnpm run xxx` で呼び出すコマンドの登録表 |
| `devDependencies` | 開発中だけ必要な道具 |
| `dependencies` | 本番でも必要な道具（Reactなど） |

### GitHub Pages で公開できない・真っ白になったら

| 症状 | 原因 | 対処 |
|---|---|---|
| 画面が真っ白・アセットが404 | ビルド出力が絶対パス（`/assets/...`）を参照している | `vite.config.js` に `base: './'` を設定して再ビルド |
| Settings → Pages で公開元を選べない | 無料プランでは private リポジトリから公開できない | リポジトリを public にする |

### 公式・MDN参考リンク

- [Vite 公式ガイド（日本語）](https://ja.vite.dev/)
- [Vite: なぜViteなのか（バンドルが必要な理由）](https://ja.vite.dev/guide/why.html)
- [Vite: 静的サイトのデプロイ（GitHub Pages）](https://ja.vite.dev/guide/static-deploy.html)
- [pnpm 公式（日本語）](https://pnpm.io/ja/)
- [Node.js 公式](https://nodejs.org/ja)
- [GitHub Pages サイトを作成する（public が必要な条件・公開範囲の注意）](https://docs.github.com/ja/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Tailwind CSS: Play CDN は開発用（本番では使わない）](https://tailwindcss.com/docs/installation/play-cdn)
- [Tailwind CSS: Vite での導入（v4）](https://tailwindcss.com/docs/installation/using-vite)
- [import（MDN）](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/import)
- [export（MDN）](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/export)
- [JavaScript モジュール（MDN・`import` でファイルを分ける仕組み）](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Modules)
- [pnpm: サプライチェーンセキュリティ（インストール時スクリプトの既定停止・`minimumReleaseAge`）](https://pnpm.io/supply-chain-security)
