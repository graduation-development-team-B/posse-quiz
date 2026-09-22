# Week14｜React基礎（JSX・コンポーネント・props・map）

先週、Vite で自分の作業場（ローカル開発環境）を持ちました。Vanilla テンプレートでカウンターを作り、保存した瞬間にブラウザが変わる手ごたえも味わいました。

今週は、その作業場で React を動かします。作るのは、本を何冊も並べた書籍紹介ページ。ここで最初にぶつかるのが、こんな場面です。1冊目のカードを作り、同じ見た目のまま2冊目、3冊目とコピペしていく。そして4冊目で、閉じタグを1つ消し忘れる。レイアウトが崩れる。原因の行がどこにあるのか、探すだけでひと苦労です。

同じ見た目のものを手でコピペするのは、間違いのもとです。React は、この「同じ部品」を一度だけ作って、何度でも使い回すための道具です。今週は、ページを `Header` や `BookCard` のような小さな部品に分けて組み立てる考え方を、手を動かしながら身につけます。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | JSXの基本ルール、関数コンポーネント、props、`.map` でのリスト表示、`key`、ファイル分割（export / import）、Vite + React での Tailwind 導入 |
| **作るもの** | Reactで作る書籍紹介ページ（`BookCard` コンポーネント＋mapで書籍リストを表示） |
| **完了条件** | `BookCard` に props を渡し、map で複数の書籍を表示できる（各要素に `key` を付けられる） |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・自信度チェック・ミニドリルでは使わないこと。

---

## インプット

### まず、Reactの作業場をつくる

先週は Vite の Vanilla テンプレートを使いました。今週は同じ Vite を、今度は React テンプレートで立ち上げます。ターミナルでこう打ちます。

```bash
pnpm create vite my-bookshelf --template react
cd my-bookshelf
pnpm install
pnpm run dev
```

`http://localhost:5173/` を開くと、React と Vite のロゴが並んだサンプル画面が出ます。これがテンプレートの初期状態です。

中身を自分のものに書き換えます。`src/App.jsx` を開いて、全部消して、次の内容にしてください。

```jsx
function App() {
  return <h1>書籍紹介ページ</h1>;
}

export default App;
```

ブラウザに「書籍紹介ページ」と表示されれば、React が動いています。ここが今週のスタート地点です。

このあと、見た目を整えるのに Tailwind を使います。先週までは URL で読み込む CDN 方式でしたが、Vite の中では pnpm で入れる方式が素直です。3ステップで終わります。

まずインストール。

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

次に `vite.config.js`（プロジェクト作成時に生成されているファイル）を開いて、Tailwind のプラグインを足します。

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

最後に `src/index.css` を開いて、中身をすべて消し、次の1行だけにします。

```css
@import "tailwindcss";
```

`src/main.jsx` の先頭で `import './index.css'` と書かれていれば、この CSS が読み込まれています（テンプレートに最初から書いてあります）。`vite.config.js` を変えたら dev サーバーは一度止めて（ターミナルで `Ctrl+C`）、`pnpm run dev` で立ち上げ直してください。`App.jsx` の `<h1>` に `className="text-2xl font-bold"` と足して、文字が太く大きくなれば Tailwind が効いています。

これで作業場の準備は完了です。ここから先の例はすべて、この `my-bookshelf` の中で試せます。

---

### 見た目はHTML、書いているのはJavaScript

さっき書いた `return <h1>書籍紹介ページ</h1>`。JavaScript の関数の中に、HTMLタグがそのまま置いてあります。これは一体何なのか。まず、動かして確かめてみましょう。

`App.jsx` の中身を、こう書き換えます。

```jsx
function App() {
  return (
    <div>
      <p>1 + 1</p>
      <p>{1 + 1}</p>
    </div>
  );
}
```

ブラウザにはこう出ます。

```
1 + 1
2
```

上の行は、文字としてそのまま「1 + 1」。下の行は、計算されて「2」。違いは波括弧 `{}` だけです。`{}` の中に書いたものは、文字ではなく **JavaScript として実行される**。だから足し算が答えになる。

つまり、これはHTMLではありません。JavaScript の中に、HTMLのような見た目でUIを書く記法です。これを **JSX** と呼びます。名前のとおり見た目はHTMLでも、正体はJavaScript。だから `{}` の中で変数を呼んだり、計算したりできるわけです。

JSXは、ブラウザに届く前にViteが**ただの関数呼び出しに書き換えています**。たとえばこう書いた行は、

```jsx
<h1>書籍紹介ページ</h1>
```

だいたいこういう関数呼び出しに変換されてから、ブラウザに渡ります。

```js
_jsx("h1", { children: "書籍紹介ページ" })
```

「`h1` というタグを、中身は『書籍紹介ページ』で作れ」という命令です。だからJSXは、JavaScriptが書ける場所ならどこにでも置けるし、変数に入れることも、関数から `return` することもできる。HTMLに見えているものの正体は、この関数呼び出しです。

ちなみに、Week13でCDNからVite環境に引っ越した理由の1つが、まさにこれでした。この書き換えをやってくれる工程がないと、ブラウザは `<h1>` が直接書かれたJavaScriptを読めずにエラーになります。JSXにはビルドが要る、というのはこういう意味です。

```jsx
function Header() {
  const title = "わたしの本棚";

  return (
    <header>
      <h1>{title}</h1>
    </header>
  );
}
```

見た目がHTMLに寄っているぶん、HTMLの感覚のまま書くと引っかかる所がいくつかあります。よく使う5つのルールを先に押さえておきます。

| ルール | 内容 | 例 |
|---|---|---|
| `class` ではなく `className` | HTMLの `class` は JSX では `className` と書く | `<div className="card">` |
| `{}` でJS式を埋め込む | 変数・計算・関数呼び出しを `{}` に書く | `<p>{name}</p>` / `<p>{1 + 1}</p>` |
| 1つのルート要素にまとめる | `return` の中身は1つの要素で包む | `<div>...</div>` か `<>...</>` |
| タグは必ず閉じる | `<br>` ではなく `<br />` と自分で閉じる | `<img src="..." alt="..." />` |
| コンポーネント名は大文字始まり | 小文字だとHTMLタグ扱いになる | `<BookCard />` ○ / `<bookCard />` × |

1つ目の `className` は、Reactの気まぐれではありません。さっき見たとおり、JSXの正体はJavaScriptです。ところが JavaScript では `class` が**予約語**——`class Dog { }` のようにクラスを定義するための、言語があらかじめ押さえている単語です。同じ場所で属性名としても使うと衝突するので、`className` という別名になっている。理由が分かれば、`class` と書いてスタイルが当たらないときに「ああ、あれか」とすぐ戻ってこられます。

3つ目の「1つのルート要素」は最初につまずきやすいので、具体例を出します。次のコードはエラーになります。

```jsx
// エラーになる（返す要素が2つある）
function App() {
  return (
    <h1>タイトル</h1>
    <p>説明</p>
  );
}
```

`return` が返せるのは1つだけ。並んだ2つをそのまま返せません。解決は2通りあります。

```jsx
// OK：div で1つにまとめる
function App() {
  return (
    <div>
      <h1>タイトル</h1>
      <p>説明</p>
    </div>
  );
}

// OK：<>...</> で包む（余分な div を増やさずにまとめられる）
function App() {
  return (
    <>
      <h1>タイトル</h1>
      <p>説明</p>
    </>
  );
}
```

`<>...</>` は中身をまとめるためだけの「見えない包み」で、フラグメントと呼びます。余計な `<div>` を画面に増やしたくないときに使います。

---

### 同じカードを、一度作れば何度でも

本題です。書籍紹介ページに本を3冊並べるとします。JSX の感覚のままだと、こう書きたくなります。

```jsx
function App() {
  return (
    <main>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold">JavaScript入門</h2>
        <p className="text-gray-500 text-sm">著者: 田中 太郎</p>
        <p className="text-yellow-500">★★★★☆</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold">Reactの教科書</h2>
        <p className="text-gray-500 text-sm">著者: 山田 花子</p>
        <p className="text-yellow-500">★★★★★</p>
      </div>
      {/* 3枚目、4枚目、と同じブロックが続く... */}
    </main>
  );
}
```

同じ `<div>` のかたまりを、本の数だけコピペする。冒頭の「4枚目で閉じタグを消す」事故は、まさにここで起きます。

たい焼きを思い浮かべてください。あの魚の形は、一匹ずつ手でこねているわけではありません。金型が一つあって、そこに生地を流して焼く。型さえあれば、同じ形が何匹でも作れます。もし型が無かったら、一匹ずつ手で魚の形を作ることになる。

React では、この「型」を作れます。カード1枚分の見た目を返す関数を、一つ用意します。

```jsx
function BookCard() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold">JavaScript入門</h2>
      <p className="text-gray-500 text-sm">著者: 田中 太郎</p>
      <p className="text-yellow-500">★★★★☆</p>
    </div>
  );
}
```

これを使うときは、自分で作ったタグのように書きます。

```jsx
function App() {
  return (
    <main className="max-w-2xl mx-auto p-4">
      <BookCard />
      <BookCard />
    </main>
  );
}
```

`<BookCard />` と書くたびに、さっきの `<div>` のかたまりが1枚出てきます。カードの中身を直したいときは、`BookCard` の関数を1か所直せば、使っている全部に反映される。コピペのように「4枚とも直す」必要はありません。

この「UIを返す関数」を、**コンポーネント**（正確には関数コンポーネント）と呼びます。たい焼きの金型にあたるものです。

ひとつ、ルールの念押しです。コンポーネント名は必ず大文字始まりにします。`bookCard`（小文字）と書くと、React はそれをHTMLタグとして扱い、カードの中身は画面に出ません。エラーで止まりもしない。手がかりは、Console にひっそり出る「このタグはブラウザが知らない。コンポーネントなら大文字で始めて」という趣旨の警告だけです。気づきにくいので、名前の頭は大文字、と体で覚えてしまってください。

---

### 型は同じ、中身だけ変えたい

いまの `BookCard` には弱点があります。何回使っても、同じ「JavaScript入門」しか出せません。型は良いのに、中身が固定です。

たい焼きの型は同じでも、中に入れる具は変えられます。あんこ、カスタード、チョコレート。形（型）は共通で、中身（具）だけが違う。コンポーネントでも同じことをしたい。この「外から入れる中身」が **props** です。

コンポーネント側は、受け取りたい値を `{}` の分割代入で書きます。

```jsx
function BookCard({ title, author, rating, comment }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-gray-500 text-sm">著者: {author}</p>
      <p className="text-yellow-500">{rating}</p>
      <p className="text-gray-600 mt-2">{comment}</p>
    </div>
  );
}
```

呼び出す側は、HTMLの属性のように値を渡します。

```jsx
function App() {
  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <BookCard
        title="JavaScript入門"
        author="田中 太郎"
        rating="★★★★☆"
        comment="基礎からていねいで、最初の1冊によかった。"
      />
      <BookCard
        title="Reactの教科書"
        author="山田 花子"
        rating="★★★★★"
        comment="コンポーネント設計の考え方が勉強になった。"
      />
    </main>
  );
}
```

型（`BookCard`）は1つ、中身（props）は2通り。だから見た目のそろった別々のカードが2枚出ます。props は、コンポーネントに渡す引数のようなものだと思っておけば十分です。受け取り方は `{ title, author }` のような分割代入で書くのがおすすめです。何を受け取る部品なのかが、関数の頭を見ただけで分かるからです。

ここで、来週につながる大事なルールを1つ。**props は受け取るだけで、受け取った側が書き換えてはいけません。**

```jsx
function BookCard({ title }) {
  title = "書き換えた題名"; // やらない
  return <h2>{title}</h2>;
}
```

たい焼きで言えば、焼いている途中の型が、勝手に具をあんこからチョコレートに入れ替えるようなものです。中身を入れるのは作り手（親のコンポーネント）で、型の側にその権限はありません。中身を変えたいなら、変えるのは**渡す側**です。

「渡された値は書き換えない、変えるのは持ち主の側」。この感覚は、来週 `useState` で「変わる値」を扱うときに、そのまま効いてきます。

---

### 本が10冊に増えたら

props で中身は変えられるようになりました。でも本が10冊になったら、`<BookCard ... />` を10個書き並べることになります。これでは、またコピペに逆戻りです。

たい焼き屋さんは、注文が10匹入っても、型に生地を流して次々に焼くだけです。一匹ずつ設計図から描き直したりしません。データが10件あるなら、同じ型に流し込んで一気に作りたい。

まず、本のデータを配列にまとめます。

```jsx
const books = [
  {
    id: 1,
    title: "JavaScript入門",
    author: "田中 太郎",
    rating: "★★★★☆",
    comment: "基礎からていねいで、最初の1冊によかった。",
  },
  {
    id: 2,
    title: "Reactの教科書",
    author: "山田 花子",
    rating: "★★★★★",
    comment: "コンポーネント設計の考え方が勉強になった。",
  },
  {
    id: 3,
    title: "CSS設計完全ガイド",
    author: "鈴木 一郎",
    rating: "★★★☆☆",
    comment: "分厚いが、辞書として手元に置きたい。",
  },
];
```

この配列を `map` で回して、1件ごとに `<BookCard />` を作ります。`map` は「配列の各要素から、別のものを1個ずつ作って新しい配列にする」メソッドです。ここでは、本のデータ1件からカード1枚を作ります。

```jsx
function App() {
  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">わたしの本棚</h1>
      {books.map((book) => (
        <BookCard
          key={book.id}
          title={book.title}
          author={book.author}
          rating={book.rating}
          comment={book.comment}
        />
      ))}
    </main>
  );
}
```

本が10冊でも100冊でも、書くコードはこれだけ。増えるのは配列のデータで、JSX 側は1行も増えません。

ここで初めて出てきた `key` に触れておきます。`map` でリストを描くとき、React は各要素を見分ける目印として `key` を使います。付け忘れると、ブラウザのコンソールにこう警告が出ます。

```
Each child in a list should have a unique "key" prop.
```

「リストの子要素には、それぞれ一意な `key` を付けてください」という意味です。`key` にはリストの中で重複しない値を渡します。本のデータには `id` があるので、それを使います。

ひとつ、はっきり言っておきます。`key` に配列のインデックス（`0, 1, 2...`）を使うのは、やめておきましょう。

```jsx
// おすすめしない：インデックスを key にする
{books.map((book, index) => (
  <BookCard key={index} title={book.title} /* ... */ />
))}

// おすすめ：データ固有の id を key にする
{books.map((book) => (
  <BookCard key={book.id} title={book.title} /* ... */ />
))}
```

インデックスは「並び順の番号」でしかありません。並べ替えたり、途中の1件を消したりすると、番号が指す中身がずれます。React が「同じ `key` だから同じもの」と勘違いして、表示が実際のデータとちぐはぐになることがあります。データそのものに紐づく `id` を渡しておけば、順番が変わっても取り違えは起きません。

---

### 部品を、別ファイルに引っ越す

`BookCard` と `App` を同じファイルに書いてきましたが、部品が増えると `App.jsx` がどんどん長くなります。そろそろ `BookCard` を独立した部屋に引っ越します。

こういうフォルダ構成にします。

```
src/
  App.jsx
  components/
    BookCard.jsx
```

`BookCard.jsx` の側では、関数を書いたあとに `export default` を付けて「この部品を外に出す」と宣言します。

```jsx
// src/components/BookCard.jsx
function BookCard({ title, author, rating, comment }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-gray-500 text-sm">著者: {author}</p>
      <p className="text-yellow-500">{rating}</p>
      <p className="text-gray-600 mt-2">{comment}</p>
    </div>
  );
}

export default BookCard;
```

`App.jsx` の側では、`import` で読み込みます。読み込めば、同じファイルに書いていたときと同じように使えます。

```jsx
// src/App.jsx
import BookCard from './components/BookCard';

const books = [ /* ...さっきの配列... */ ];

function App() {
  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">わたしの本棚</h1>
      {books.map((book) => (
        <BookCard
          key={book.id}
          title={book.title}
          author={book.author}
          rating={book.rating}
          comment={book.comment}
        />
      ))}
    </main>
  );
}

export default App;
```

`export default` で外に出し、`import` で受け取る。この2つはセットです。先週 Vite で「ファイルを分けて `import` でつなぐ」練習をしましたが、React ではその単位が「コンポーネント」になった、というだけの話です。部品ごとにファイルを分けておくと、どこに何があるか探しやすくなります。

`import` の行には、初めて見ると引っかかる点が2つあります。

**1つ目。`export default` で出したものは、受け取る側で好きな名前を付けられます。** 次のどちらも動きます。

```jsx
import BookCard from './components/BookCard';
import Card from './components/BookCard'; // これも動く（<Card /> として使う）
```

`default` は「このファイルの代表を1つだけ出す」という意味で、名前ではなく**位置**で受け渡ししているからです。ただし、混乱のもとになるので、**出したときと同じ名前で受け取る**のが基本です。

**2つ目。ファイルの拡張子は書きません。** 実体は `BookCard.jsx` ですが、`import` では `'./components/BookCard'` と書きます。`.jsx` や `.js` はViteが探し当ててくれます。逆に、先頭の `./` は省略できません。これを落とすと「npmで入れたライブラリ」を探しに行ってしまい、`Failed to resolve import` というエラーになります。

---

### 今日のまとめ

- コンポーネントは「UIを返す関数」。たい焼きの金型のように、一度作れば同じ見た目を何度でも使い回せる。手でコピペして4枚目でミスる、あの事故がなくなる。
- props はコンポーネントの外から渡す「中身」。型（コンポーネント）は同じで、中身（props）だけ変えれば、違うカードが作れる。受け取りは `{ title, author }` の分割代入で、受け取った側では書き換えない。
- 数が増えたら `map`。配列のデータを `{books.map((book) => <BookCard ... />)}` で一気に展開する。このとき `key` を必ず付け、インデックスではなくデータ固有の `id` を渡す。

この3つが手に馴染めば、ページを「小さな部品の組み合わせ」として設計できるようになります。

> **次週とのつながり**：Week15は React の状態管理（`useState`・`useEffect`）です。今週作った部品は、まだ動きません。ボタンを押すと数が変わる、入力すると画面が変わる——そういう「変化する状態」を React でどう扱うかを学び、部品に動きを持たせます。

---

## ミニドリル（AI禁止・60分）

今週のドリルは、自分の Vite + React プロジェクトの中で行います（`my-bookshelf` をそのまま使っても、新しく作ってもかまいません）。完成したかどうかは、ブラウザ（`http://localhost:5173/`）の見た目で確認します。

### 着手前：着手前分解表（5分）

コードを書く前に、作るものを分解します。React では「どこを部品にするか」「何を props で渡すか」「何を map で繰り返すか」を先に決めておくと、手が止まりにくくなります。次を埋めてから問題1へ進んでください。

> 分解のやり方の例は Week03 の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

| 項目 | 書くこと |
|---|---|
| 完成状態 | 画面に何が、いくつ並ぶか（成功時の見た目） |
| 部品に分ける単位 | どの見た目のかたまりを1つのコンポーネントにするか |
| props で渡す値 | コンポーネントの外から渡す値の名前（例: `name`・`role`） |
| 繰り返す部分 | 配列の何を `map` で展開するか |
| `key` に使う値 | 各要素で重複しない値は何か（`id` など） |
| 確認方法 | ブラウザで何が見えれば完成といえるか |

---

### 問題1：MemberCard を作って props を渡す（20分）

チーム紹介ページ用に、メンバー1人分のカードを表示する `MemberCard` コンポーネントを作ってください。

**要件:**

- `src/components/MemberCard.jsx` に `MemberCard` を作り、`export default` する
- `name`（名前）・`role`（役割）・`message`（一言コメント）の3つの props を受け取る
- 名前を大きく（`text-lg font-bold`）、役割をグレー（`text-gray-500`）、コメントを通常のテキストで表示する
- `App.jsx` で `MemberCard` を `import` し、3回使って、それぞれ別のデータを渡す

**完成状態の確認方法:** ブラウザに3人分のカードが縦に並び、名前・役割・コメントがそれぞれ違って表示されていればOKです。次の見た目を目指してください。

![Week14 ミニドリル 問題1 ゴールUI](./images/minidrill-week14-1.png)

<details>
<summary>ヒント</summary>

```jsx
// src/components/MemberCard.jsx の雛形
function MemberCard({ name, role, message }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-lg font-bold">{/* name をここに */}</p>
      {/* role と message も同じ要領で */}
    </div>
  );
}

export default MemberCard;
```

`App.jsx` では `import MemberCard from './components/MemberCard';` で読み込み、`<MemberCard name="..." role="..." message="..." />` を3回書きます。

</details>

<details>
<summary>解答の要点</summary>

```jsx
// src/components/MemberCard.jsx
function MemberCard({ name, role, message }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-lg font-bold">{name}</p>
      <p className="text-gray-500 text-sm">{role}</p>
      <p className="text-gray-700 mt-2">{message}</p>
    </div>
  );
}

export default MemberCard;
```

```jsx
// src/App.jsx
import MemberCard from './components/MemberCard';

function App() {
  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <MemberCard name="田中 太郎" role="フロントエンド" message="Reactが楽しくなってきた。" />
      <MemberCard name="山田 花子" role="デザイナー" message="UIを整えるのが好きです。" />
      <MemberCard name="鈴木 一郎" role="バックエンド" message="APIを作っています。" />
    </main>
  );
}

export default App;
```

同じ `MemberCard` に違う props を渡して、3枚のカードを作り分けています。

</details>

---

### 問題2：バグ診断（key 忘れ）（15分）

次のコードは `map` で書籍リストを表示しようとしています。画面には3件のタイトルが出ますが、ブラウザのコンソール（DevTools の Console タブ）に警告が出ています。何が問題か説明し、修正してください。

```jsx
const books = [
  { id: 1, title: "JavaScript入門" },
  { id: 2, title: "Reactの教科書" },
  { id: 3, title: "CSS設計完全ガイド" },
];

function App() {
  return (
    <ul>
      {books.map((book) => (
        <li>{book.title}</li>
      ))}
    </ul>
  );
}

export default App;
```

<details>
<summary>ヒント</summary>

`map` でリストを表示するとき、React が各要素を見分けるために必要なものが、`<li>` に付いていません。コンソールの警告文をそのまま読んでみましょう。インプットの「本が10冊に増えたら」の節が対応します。

</details>

<details>
<summary>解答の要点</summary>

問題は、`<li>` に `key` が付いていないことです。`map` で作った各要素には、リスト内で一意な `key` が必要です。付いていないと、コンソールにこの警告が出ます。

```
Each child in a list should have a unique "key" prop.
```

`book.id` を `key` に渡して直します。

```jsx
{books.map((book) => (
  <li key={book.id}>{book.title}</li>
))}
```

`key` には `book.id` のようなデータ固有の値を使います。配列のインデックス（`index`）を渡す方法もありますが、並べ替えや途中削除で表示がずれることがあるため、避けます。

</details>

---

### 問題3：Week08の一覧描画を、React の map で書き直す（25分）

Week08 では、配列を `forEach` で回し、`document.createElement` で要素を作って `appendChild` で画面に足す、という書き方でリストを表示しました。次はその「素のJavaScript版」です。

```html
<ul id="fruitList"></ul>
```

```js
const fruits = [
  { id: 1, name: "りんご", price: 120 },
  { id: 2, name: "みかん", price: 80 },
  { id: 3, name: "ぶどう", price: 300 },
];

const list = document.getElementById("fruitList");
fruits.forEach((fruit) => {
  const li = document.createElement("li");
  li.textContent = `${fruit.name} - ${fruit.price}円`;
  list.appendChild(li);
});
```

これと**同じデータ・同じ見た目**を、React の `map` で書き直してください（自分の Vite プロジェクトの `App.jsx` に書きます）。書き直せたら、**2つの方式のどこが違うかを、自分の言葉で1行だけ**書いてください。

**完成状態の確認方法:** ブラウザに「りんご - 120円」「みかん - 80円」「ぶどう - 300円」の3行が並べばOKです。コンソールに `key` の警告が出ていないことも確認してください。

<details>
<summary>ヒント</summary>

`forEach` の「作る → 文字を入れる → 付け足す」の3手順を、React では書きません。配列を `map` で回し、各要素から `<li>` を1つ返すだけです。`key` を忘れずに。

</details>

<details>
<summary>解答の要点</summary>

```jsx
const fruits = [
  { id: 1, name: "りんご", price: 120 },
  { id: 2, name: "みかん", price: 80 },
  { id: 3, name: "ぶどう", price: 300 },
];

function App() {
  return (
    <ul>
      {fruits.map((fruit) => (
        <li key={fruit.id}>{fruit.name} - {fruit.price}円</li>
      ))}
    </ul>
  );
}

export default App;
```

違いの一言（例）:「`createElement` は『要素を作る → 文字を入れる → 付け足す』と手順を一つずつ命令するが、`map` は『このデータからこの要素を返す』と結果だけを書き、画面への反映は React に任せる。」

同じ結果でも、素のJavaScriptは「どう作るか」を手順で書き、React は「何を出したいか」を結果で書きます。データが変わったとき `createElement` 側は消して作り直す手間がありますが、React は配列を差し替えるだけで描き直してくれます。

</details>

---

## POSSE課題

### テーマ：Reactで作る書籍紹介ページ

**先週（Week13）のカウンターとは別に、新しい React プロジェクト**を作ってください。React のコンポーネント・props・map を使って、自分のおすすめ本を並べた書籍紹介ページを実装します。

**要件:**

- `pnpm create vite <名前> --template react` で React テンプレートを使っている
- Tailwind を pnpm でインストールし、Vite のプラグイン（`@tailwindcss/vite`）で使っている（CDN読み込みではない）
- 書籍データを配列で定義している（タイトル・著者・評価・コメントを含む、3冊以上）
- `BookCard` コンポーネントを `src/components/BookCard.jsx` として別ファイルで作っている
- `BookCard` が title・author・rating・comment の4つの props を受け取っている
- `map` で全書籍を表示している（各要素に `key` を付け、`id` などデータ固有の値を使う）
- `App.jsx` に `BookCard` の中身を直接書かず、`import` して使っている
- `className` で見た目を整えている

**【発展・任意】**

- `BookCard` にホバーの動き（`hover:scale-105 transition` など）を足す
- 評価を星の数（`1`〜`5` の数値）で props に渡し、コンポーネント側で `★` を繰り返して表示する
- `Header`・`Footer` コンポーネントを作り、ページ全体を部品の組み合わせで構成する
- GitHub Pages にデプロイする（Vite でデプロイする場合、`vite.config.js` に `base: './'` を設定しないとアセットが 404 になります。設定は Week13 参照）

**提出:**

GitHub リポジトリに push して URL を提出してください。`pnpm run build` を実行し、`dist` フォルダが生成されることを確認します。GitHub Pages へのデプロイは発展（任意）です。

**PR本文に必ず書くこと:**

1. 作ったコンポーネントの一覧と、それぞれが何を担当しているか
2. `BookCard` に渡している props の名前と、その値の型（文字列 / 数値など）
3. `map` で表示したとき、`key` に何を使ったか（`id` を使った理由）
4. 詰まった場所とどう解決したか（1箇所以上）

## 確認結果

### 表示確認

- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録

今週の実装で判断が必要だった場面を1つ書いてください:

- 選択肢A（例: 評価を `"★★★★☆"` の文字列で props に渡す）:
- 選択肢B（例: 評価を `4` の数値で渡し、コンポーネント側で星に変換する）:
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
- AIが間違えた・足りなかったこと（`key` の付け忘れ・props の受け渡し・コンポーネントのファイル分割など）:
- 自分が修正・判断した箇所:

### チェックポイント

- [ ] React テンプレートで新しいプロジェクトを作成した
- [ ] Tailwind を pnpm でインストールし、`vite.config.js` にプラグインを追加した
- [ ] `BookCard` コンポーネントを `src/components/BookCard.jsx` に別ファイルで作成した
- [ ] props でタイトル・著者・評価・コメントを渡している
- [ ] `map` で全書籍を表示し、各要素に `key` を付けている（`id` を使った）
- [ ] `App.jsx` で `import` / `export default` を使ってコンポーネントを読み込んでいる
- [ ] JSX で `class` ではなく `className` を使っている
- [ ] `pnpm run build` で `dist` フォルダが生成された
- [ ] PR本文にコンポーネント一覧・props の説明・`key` の理由・詰まった箇所を書いた
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] AIとの比較を記録した（Week06以降必須）

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### JSXの基本ルール

| ルール | 内容 | 例 |
|---|---|---|
| `className` | HTMLの `class` は `className` と書く | `<div className="card">` |
| `{}` | 中に書いたものは JavaScript として実行される | `<p>{1 + 1}</p>` → `2` |
| 1つのルート要素 | `return` の中身は1つに包む | `<div>...</div>` / `<>...</>` |
| 閉じタグ | 単独タグも自分で閉じる | `<br />` / `<img ... />` |
| 大文字始まり | コンポーネント名は大文字で始める | `<BookCard />` |

### コンポーネント・props・map

| 書き方 | 説明 |
|---|---|
| `function Xxx() { return (...) }` | UIを返す関数（コンポーネント）。名前は大文字始まり |
| `<Xxx />` | コンポーネントを使う |
| `function Xxx({ a, b })` | props を分割代入で受け取る |
| `<Xxx a={値} b={値} />` | props を渡す |
| `{配列.map((item) => <Xxx key={item.id} ... />)}` | 配列から複数の要素を作る。`key` を付ける |
| `export default Xxx` | コンポーネントを外に出す |
| `import Xxx from './...'` | 別ファイルのコンポーネントを読み込む |

### Vite + React での Tailwind 導入

| 手順 | コマンド / 内容 |
|---|---|
| インストール | `pnpm add -D tailwindcss @tailwindcss/vite` |
| `vite.config.js` | `plugins` に `tailwindcss()` を追加する |
| `src/index.css` | 中身を `@import "tailwindcss";` の1行にする |

### 公式ドキュメント

- [JSXでマークアップを書く（React）](https://ja.react.dev/learn/writing-markup-with-jsx)
- [波括弧でJavaScriptを使う（React）](https://ja.react.dev/learn/javascript-in-jsx-with-curly-braces)
- [最初のコンポーネント（React）](https://ja.react.dev/learn/your-first-component)
- [コンポーネントにpropsを渡す（React）](https://ja.react.dev/learn/passing-props-to-a-component)
- [リストのレンダー（React）](https://ja.react.dev/learn/rendering-lists)
- [Vite ガイド](https://ja.vite.dev/guide/)
- [Tailwind CSS: Vite での導入](https://tailwindcss.com/docs/installation/using-vite)
- [import（MDN）](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/import)
- [export（MDN）](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/export)
