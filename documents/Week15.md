# Week15｜React状態管理（useState・useEffect）

先週は、ページを `BookCard` のような部品に切り分けて、同じ型のカードを何枚も並べました。ただ、あの本棚は、まだ「置いてあるだけ」です。ボタンを押しても何も起きないし、文字を打っても画面はうんともすんとも言いません。

本物のアプリは、触ると反応します。ボタンを押せば数が増える。入力すれば下に文字が出る。チェックを入れれば色が変わる。今週は、その「変わる値」を扱って、部品に動きを持たせます。中心になるのが `useState` という仕組みです。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | state・`useState`、set関数による更新（元を書き換えず作り直す：spread / `filter` / `map`）、イベント処理（`onClick` / `onChange` / `onSubmit`）、`useEffect`（第2引数の3パターン）、`localStorage` への保存 |
| **作るもの** | Reactで作るタスク管理アプリ（追加・完了切り替え・削除） |
| **完了条件** | タスクの追加・完了切り替え・削除が動き、配列stateをset関数で更新できる。PR本文でstateの設計を説明できる |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・自信度チェック・ミニドリルでは使わないこと。

---

## インプット

### まず、ふつうの変数でやってみる

今週は Vite の React プロジェクトで試します。先週の `my-bookshelf` をそのまま使ってもいいし、新しく作っても構いません。

```bash
pnpm create vite my-task-app --template react
cd my-task-app
pnpm install
pnpm run dev
```

まず、ごく素直に「ボタンを押すと増えるカウンター」を作ってみます。変わる値なんだから、ふつうの変数を1つ用意して、押すたびに `+1` すればいい——そう考えて、`App.jsx` をこう書きます。

```jsx
function App() {
  let count = 0;

  const handleClick = () => {
    count++;
    console.log(count);
  };

  return (
    <main className="p-4">
      <p>クリック回数: {count}</p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleClick}
      >
        増やす
      </button>
    </main>
  );
}

export default App;
```

ボタンを何回か押してみてください。画面の「クリック回数」は……**0のまま**。びくともしません。

でも、DevToolsのConsoleを開いたまま押すと、そこには数字が並びます。

```
1
2
3
4
```

おかしな話です。`count` はちゃんと増えている（Consoleがそう言っている）のに、画面だけが0で止まっている。値は変わったのに、表示が変わらない。

バスケの試合を思い浮かべてください。選手がシュートを決める。ベンチの記録係は、手元のメモに「2点」と書き足します。でも、体育館の壁にある大きな得点ボードは、係の人が操作卓のボタンを押すまで、前の数字のまま止まっています。点は入った。メモも増えた。なのに、観客が見上げるボードは変わらない——いま画面ではこれと同じことが起きています。

`count++` は、記録係がメモに書き足しただけ。`console.log`（メモ）の数字は増える。でも、観客が見るボード（画面）には、手が届いていないのです。

---

### ボタンを通すと、ボードが変わる

では、ボードを動かすにはどうするか。さっきのカウンターを、`useState` で作り直します。

```jsx
import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <main className="p-4">
      <p>クリック回数: {count}</p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleClick}
      >
        増やす
      </button>
    </main>
  );
}

export default App;
```

今度は、押すたびに画面の数字がちゃんと増えます。変えたのは1か所だけ。`count++` をやめて、`setCount(count + 1)` にした。それだけです。

この `setCount` が、得点ボードの操作卓のボタンです。これを押す（＝呼ぶ）と、値が新しくなり、しかもReactが画面を描き直してくれる。さっきの `count++` は、メモに書き足しただけで操作卓に触れていなかった。だから数は増えてもボードは動かなかった。値を変える窓口を `setCount` に通したことで、画面（ボード）が追いついてくるわけです。

では、その「描き直す」とは、具体的に何が起きているのか。ここを飛ばすと、このあと出てくるルールが全部まる暗記になってしまうので、いま押さえます。

`App` は関数でした。Reactは、`setCount` が呼ばれると **`App` 関数をもう一度、頭から実行し直します**。順に見ると、こうなります。

1. `setCount(1)` が呼ばれる
2. Reactが `App()` をもう一度実行する
3. 2回目の `useState(0)` は、`0` ではなく**新しい値の `1` を返す**（`useState` の `0` は初期値で、使われるのは最初の1回だけ）
4. その `1` を使ってJSXが作り直され、Reactが画面の変わった部分だけ書き換える

つまりReactは、値が変わるたびに**その部品を丸ごと作り直している**わけです。「どこを書き換えるか」ではなく「もう一度作ったら、今度はどうなるか」。これがReactの発想です。

3番が肝心です。「関数をもう一度実行するなら、`let count = 0` からやり直しでは？」——素の変数だとそのとおりで、だから最初のカウンターは0のままでした。`useState` で作った値だけは、Reactが関数の外側で覚えていて、実行し直しても引き継がれます。だから増えていく。

`useState` の書き方は、いつもこの形です。

```jsx
const [count, setCount] = useState(0);
```

| 部分 | 意味 |
|---|---|
| `useState(0)` | `0` を初期値にして、変わる値を1つ用意する |
| `count` | いまの値（読むだけ。ここに直接代入しない） |
| `setCount` | 値を新しくするための関数（操作卓のボタン） |

この「画面に映る、変わる値」のことを **state** と呼びます。`useState` は、その state を1つ用意する道具です。`count` と `setCount` のように、`[値, その値を変える関数]` のセットで受け取ります。

大事なルールを、先に釘を刺しておきます。**`count` に直接代入してはいけません。** `count = count + 1` と書いても、メモに書いただけと同じで画面は変わらない。値を変えるときは、必ず `setCount` を通す。ここが今週いちばんの肝です。

---

### 何をstateにして、何をしないか

state は「コンポーネントの中で変化する値」です。全部の値をstateにする必要はありません。画面を見て「これは動く？ 動かない？」で分けます。

**stateにするもの（画面の中で変わるもの）：**

- ボタンをクリックした回数
- 入力欄に打ち込まれた文字
- メニューが開いているか、閉じているか
- チェックのON / OFF
- 追加・削除されていくリスト

**stateにしなくていいもの（変わらないもの）：**

- ページタイトルなど、固定のテキスト
- 外から渡ってくる props（その部品の中では変えない場合）
- 計算で毎回求まる値（例：`tasks` の件数は `tasks.length` で出せるので、別のstateにしない）

迷ったら「これはユーザーの操作で変わるか？」と自問します。変わるならstate、変わらないならただの定数やpropsで足ります。

---

### 数・文字・ON/OFF・リストをstateで持つ

state に入れる値は、数字だけではありません。よく使う4つの型を、set関数の呼び方とセットで見ておきます。

**数値（カウンター）**

```jsx
const [count, setCount] = useState(0);

setCount(count + 1); // 増やす
setCount(0);         // リセット
```

**文字列（テキスト入力）**

```jsx
const [name, setName] = useState("");

// JSXの中
<input
  className="border rounded px-3 py-2"
  value={name}
  onChange={(event) => setName(event.target.value)}
/>
<p>こんにちは、{name} さん</p>
```

`onChange` は、入力欄の中身が変わるたびに呼ばれます。`event.target.value` が、そのとき入力欄に入っている文字列です。`value={name}` とセットにすると、入力欄の中身が常に state と一致します。打つそばから、下の `{name}` が書き換わっていくのが見えるはずです。

**真偽値（開いている / 閉じている）**

```jsx
const [isOpen, setIsOpen] = useState(false);

setIsOpen(!isOpen); // いまの値を反転する
```

**配列（リストの追加・削除）**

```jsx
const [tasks, setTasks] = useState([]);

// 追加
setTasks([...tasks, { id: Date.now(), text: "牛乳を買う", done: false }]);
// 削除
setTasks(tasks.filter((task) => task.id !== targetId));
// 1件だけ更新
setTasks(tasks.map((task) =>
  task.id === targetId ? { ...task, done: !task.done } : task
));
```

配列のところで、`[...tasks, ...]` や `filter`・`map` という見慣れない形が出てきました。「なぜ `tasks` にそのまま足さないのか」——これが次の話です。

---

### stateは、上書きせずに作り直す

配列やオブジェクトのstateには、引っかかりやすいルールが1つあります。**元のstateを直接書き換えてはいけない。** 理由をはっきりさせておきます。

やりがちなのが、これです。

```jsx
// 動かない
tasks.push({ id: Date.now(), text: "牛乳を買う", done: false });
```

`push` は配列にそのまま1件足すメソッドで、素のJavaScriptなら正しい書き方です。でもReactでは、これをやっても画面は1件も増えません。しかも、つまずきが2段構えになっています。

**1段目**：`push` はset関数を呼んでいません。set関数を通さないと、そもそも `App` の実行し直しが起きない。操作卓に触れず、メモだけ書いた状態です。

ここまでは、さっきのカウンターと同じ話です。では、と `setTasks(tasks)` を書き足してみる。すると**2段目**にぶつかります。**それでも画面は変わりません。**

Reactは、set関数に渡された値が本当に前と違うのかを、渡されたものが**同じ入れ物かどうか**で見分けます。中身を1件ずつ比べたりはしません（毎回そんな照合をしていたら重くなるからです）。`push` は元の配列に足すだけなので、入れ物そのものは同じまま。Reactからは「さっきと同じ配列を渡された＝何も変わっていない」と見え、描き直しをサボります。

引っ越しにたとえるなら、段ボールの中身を入れ替えても、外から見れば同じ段ボールです。Reactは箱の外側しか見ていない。だから、**中身を変えるのではなく、新しい箱に詰め直して渡す**必要があります。

だから、**元のstateは触らず、新しいものを作ってset関数に渡す**。この3つの形を使います。

```jsx
// 追加：元の中身を広げて、新しい要素を足した新しい配列を作る
setTasks([...tasks, newTask]);

// 削除：対象を除いた新しい配列を作る
setTasks(tasks.filter((task) => task.id !== targetId));

// 更新：対象だけ差し替えた新しい配列を作る
setTasks(tasks.map((task) =>
  task.id === targetId ? { ...task, done: !task.done } : task
));
```

オブジェクトの一部を変えるときも同じです。`task.done = true` と直接書き換えず、`{ ...task, done: true }` で新しいオブジェクトを作ります。

「元を書き換えない、作り直す」。配列とオブジェクトのstateは、これを合言葉にしてください。

#### 押しても1しか増えない（発展・詰まったとき用）

もう1つ、set関数の癖を書いておきます。いまは知らなくても課題は進みますが、詰まったときに戻ってきてください。

「1回のクリックで2つ増やしたい」と思って、こう書いたとします。

```jsx
setCount(count + 1);
setCount(count + 1);
```

結果は、**2ではなく1しか増えません**。理由は、さっきの「関数がもう一度実行される」の話とつながっています。この2行が動いている時点では、まだ実行し直しは起きていないので、`count` は**どちらの行でも同じ古い値**（たとえば `0`）のまま。つまり2行とも `setCount(0 + 1)` を言っているだけです。

こういうときは、set関数に値ではなく**関数**を渡します。

```jsx
setCount((prev) => prev + 1);
setCount((prev) => prev + 1); // 今度は2つ増える
```

`prev` には、Reactが「その時点での最新の値」を入れて渡してくれます。だから1行目で `0 → 1`、2行目は `1 → 2` と正しく積み上がる。「前の値をもとに更新する」ときは、この形が確実です。

---

### 「どこを書き換えるか」を考えなくてよくなる

ここまでの「値を変えると画面が変わる」を、前にやったやり方と比べてみます。

PH1の前半、素のJavaScriptで画面を動かしていたころは、こう書いていました（Week07）。

```js
const countEl = document.querySelector("#count");
countEl.textContent = count;
```

「`#count` という要素を探し出して、その中身を書き換える」。画面を変えたい箇所ごとに、自分でDOMを探して、自分で書き換える必要がありました。要素が増えるほど、「どれをどう書き換えるか」の管理が重くなっていきます。

Reactでは、この作業がなくなります。

```jsx
setCount(count + 1);
// → 画面のどこを、どう書き換えるかはReactが判断してくれる
```

やることは「値を新しくする」だけ。「その値が画面のどこに出ているか」「そこをどう書き換えるか」はReactに任せます。

| | 素のJavaScript（DOM直接操作） | React（state） |
|---|---|---|
| 画面の更新 | 要素を探して自分で書き換える | set関数を呼ぶとReactが描き直す |
| ずれ | 変数とDOMが別物なので、ずれやすい | stateと画面が常に一致する |
| 増えたとき | 書き換える箇所を全部追う必要がある | 「どの値が変わるか」だけ考えればよい |

「どのDOMを、どう書き換えるか」を考えるのをやめて、「どの値が変わるか」だけを考える。この頭の切り替えが、Reactの入り口です。

---

### クリック・入力・送信を受け取る

state を変えるきっかけは、たいていユーザーの操作です。Reactでは、操作を受け取るイベントを、HTMLの `onclick` と違ってキャメルケースで書き、関数を渡します。よく使うのは3つ。

```jsx
// クリック
<button onClick={() => setCount(count + 1)}>増やす</button>

// 入力が変わるたび
<input value={name} onChange={(event) => setName(event.target.value)} />

// フォーム送信
<form onSubmit={handleSubmit}>
  <input value={input} onChange={(event) => setInput(event.target.value)} />
  <button type="submit">追加</button>
</form>
```

`onSubmit` には、ひとつ落とし穴があります。フォームは、送信するとページを再読み込みするのが標準の動きです。Reactアプリでこれをやられると、入力したものが全部消えてしまう。だから、送信処理の先頭で `event.preventDefault()` を呼んで、その再読み込みを止めます。

```jsx
const handleSubmit = (event) => {
  event.preventDefault(); // ページ再読み込みを止める
  // ここでタスクを追加するなどの処理
};
```

`<input>` を `<form>` で包んで `onSubmit` にしておくと、キーボードのEnterでも送信できるようになります。ボタンのクリックとEnter、両方で追加できる入力欄は、この形で作れます。

---

### 描いたあとに、ひと仕事してほしい

タスク管理アプリに「入力した内容を、リロードしても残す」を足したくなったとします。保存する処理は、画面を描いたあとに走ってほしい。こういう「描画のあとにやりたいひと仕事」を書く場所が `useEffect` です。

なぜ、わざわざ場所を分けるのか。さっきの「set関数を呼ぶと、コンポーネント関数がもう一度実行される」を思い出してください。**関数の中に直接書いた処理は、実行し直されるたびに、毎回走ります。** 確かめてみます。`App` の中に、こう1行足してボタンを何回か押してみてください。

```jsx
function App() {
  const [count, setCount] = useState(0);

  console.log("本体に書いた処理");

  return <button onClick={() => setCount(count + 1)}>{count}回クリック</button>;
}
```

Consoleには、押すたびに「本体に書いた処理」が積み上がっていきます。表示のたびに毎回やり直されているわけです（開発中は1回の描き直しにつき2行出ます。理由はこのあとの `useEffect` の節で説明します）。

タイトル書き換えくらいなら害はありません。でもこれが「サーバーにデータを送る」「`localStorage` に保存する」だったら、押すたびに毎回走ることになる。さらに、その処理の中でset関数を呼ぼうものなら——実行し直す→set関数を呼ぶ→また実行し直す、と止まらなくなります。React入門で最初にやらかす無限ループが、これです。

だから、**「毎回やり直してほしくない処理」「画面を描き終えたあとにやりたい処理」だけを、`useEffect` という別室に隔離します。** そのうえで「いつ動かすか」を自分で指定する。

まずは分かりやすい例から。ブラウザのタブに出るタイトルを、カウンターの数に合わせて変えてみます。

```jsx
import { useState, useEffect } from "react";

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `クリック回数: ${count}`;
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}回クリック
    </button>
  );
}
```

ボタンを押して数が変わるたびに、タブのタイトルも変わります。`useEffect(処理, [依存する値])` という形で、「いつ処理を動かすか」を第2引数で指定します。

| 第2引数 | 動くタイミング |
|---|---|
| `[]`（空の配列） | 最初の表示のあとに1回だけ |
| `[count]` | 最初 ＋ `count` が変わるたびに |
| 書かない | 毎回の再描画のあと（基本は使いません） |

ひとつ、開発中に驚くかもしれないことを先に言っておきます。`[]`（1回だけ）にしたのに、中の `console.log` が2回出ます。さっき本体に置いた `console.log` が2行ずつ増えたのも、同じ理由です。これはViteのReactテンプレートが `src/main.jsx` でアプリを `<StrictMode>` で包んでいるためで、開発中だけわざと2回動かしてみて、「2回動かすと壊れる書き方」をしていないかを早めに炙り出す仕組みです（2回目は薄いグレーで表示されます）。`pnpm run build` した本番では1回になります。バグではないので、驚かないでください。

---

### リロードしても消えないタスク（発展）

`localStorage` は、ブラウザにデータを保存しておく場所です。タブを閉じても、リロードしても消えません。これと `useEffect` を組み合わせると、タスクがリロードで消えないアプリになります。

やることは2つです。

ひとつ、最初に `localStorage` から読み込んで、初期値にする。`useState` の初期値には、値そのものだけでなく「値を返す関数」も渡せます。こう書くと、最初の1回だけ実行されて、保存済みのデータがあれば読み込みます。

```jsx
const [tasks, setTasks] = useState(() => {
  const saved = localStorage.getItem("tasks");
  return saved ? JSON.parse(saved) : [];
});
```

`localStorage` には文字列しか入れられません。だから取り出すときは、`JSON.parse` でJavaScriptの配列に戻します。

もうひとつ、`tasks` が変わるたびに保存する。ここが `useEffect` の出番です。

```jsx
useEffect(() => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}, [tasks]);
```

保存するときは、逆に `JSON.stringify` で文字列に変換してから入れます。第2引数を `[tasks]` にしているので、タスクを追加・削除・切り替えするたびに、保存が走ります。これでリロードしてもタスクが残ります。

---

### 全部つなげた完成サンプル

ここまでの「state・set関数・イベント・useEffect・localStorage」を、ひとつにまとめたタスク管理アプリです。`App.jsx` にそのまま貼って、動かしてみてください。

```jsx
import { useState, useEffect } from "react";

function App() {
  // 保存済みのタスクがあれば、それを初期値にする
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");

  // tasks が変わるたびに localStorage へ保存する
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // タスクを追加する
  const addTask = (event) => {
    event.preventDefault(); // フォーム送信によるページ再読み込みを止める
    const text = input.trim();
    if (text === "") return; // 空文字は追加しない
    setTasks([...tasks, { id: Date.now(), text, done: false }]);
    setInput(""); // 入力欄を空に戻す
  };

  // 完了状態を切り替える
  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  // タスクを削除する
  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">タスク管理</h1>

      {/* 入力フォーム：ボタンでもEnterでも追加できる */}
      <form onSubmit={addTask} className="flex gap-2 mb-4">
        <input
          className="border rounded px-3 py-2 flex-1"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="新しいタスクを入力..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          追加
        </button>
      </form>

      {/* タスク一覧 */}
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-2 bg-white rounded-lg shadow px-4 py-2"
          >
            <span
              className={`flex-1 cursor-pointer ${task.done ? "line-through text-gray-400" : ""}`}
              onClick={() => toggleTask(task.id)}
            >
              {task.text}
            </span>
            <button
              className="text-red-400 hover:text-red-600 text-sm"
              onClick={() => deleteTask(task.id)}
            >
              削除
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && (
        <p className="text-center text-gray-400 mt-8">タスクがありません</p>
      )}
    </main>
  );
}

export default App;
```

3つの操作が、それぞれ配列stateをどう更新しているかを、もう一度見てください。追加は `[...tasks, 新しいタスク]`、削除は `filter`、完了切り替えは `map`。どれも元の `tasks` は触らず、新しい配列を作って `setTasks` に渡しています。これが今週の背骨です。

---

### 今日のまとめ

- 画面に映る値は state。変えるときは必ずset関数（`setCount`・`setTasks`）を通す。set関数を呼ぶと、Reactはそのコンポーネント関数をもう一度実行して画面を作り直す。直接 `count = ...` や `tasks.push(...)` をしても、操作卓を無視してメモに書くのと同じで、画面（得点ボード）は変わらない。
- 配列やオブジェクトのstateは、元を書き換えず新しいものを作って渡す。Reactは中身ではなく「同じ入れ物かどうか」で変化を見分けるので、詰め直さないと気づいてもらえない。追加は `[...tasks, x]`、削除は `filter`、更新は `map`。
- 描画のあとにやりたい処理（保存など）は `useEffect`。第2引数に「いつ動かすか」を書く（`[]` は最初だけ、`[tasks]` は `tasks` が変わるたび）。

この3つが手に馴染めば、触ると反応するアプリを、自分で組み立てられるようになります。

> **次週とのつながり**：Week16はPH1の最終週です。ここまで積んだ「自分で読めて、自分で直せる」力を土台に、今度はAIと組んで、作りたいものを自由に形にします。AIに丸投げして終わりにするのではなく、出てきたコードを自分で読み、なぜそう動くのかを説明できる状態まで持っていく——そこを一区切りにします。

---

## ミニドリル（AI禁止・60分）

今週のドリルは、自分の Vite + React プロジェクトの中で行います（`my-task-app` をそのまま使っても、新しく作ってもかまいません）。完成したかどうかは、ブラウザ（`http://localhost:5173/`）の見た目と、DevToolsのConsoleで確認します。

### 着手前：着手前分解表（5分）

コードを書く前に、作るものを分解します。stateを使うときは「何をstateにするか」「それをどう更新するか（どのset関数に何を渡すか）」を先に決めておくと、手が止まりにくくなります。次を埋めてから問題1へ進んでください。

> 分解のやり方の例は Week03 の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

| 項目 | 書くこと |
|---|---|
| 完成状態 | 追加・完了切り替え・削除をしたとき、画面がどう変わるか |
| stateにする値 | 何を `useState` で持つか（変数名・初期値） |
| 更新のしかた | 各操作で、どのset関数に何を渡すか（`[...tasks, x]` / `filter` / `map`） |
| イベント | どの操作を `onClick` / `onChange` / `onSubmit` のどれで受けるか |
| やってはいけない | 直接書き換え（`push` や `task.done = true`）をしていないか |
| 確認方法 | ブラウザで何ができれば完成といえるか |

---

### 問題1：フィルター機能を追加する（20分）

インプットの完成サンプル（タスク管理アプリ）に、「すべて」「未完了」「完了済み」の3つで絞り込めるフィルターを追加してください。

**要件:**

- `filter` という state（初期値 `"all"`）を追加する
- 「すべて」「未完了」「完了済み」の3つのボタンを表示する
- `filter` の値に応じて、表示するタスクを絞り込む（元の `tasks` は消さない）

**完成状態の確認方法:** ボタンを押すと、表示されるタスクが切り替わればOKです。「完了済み」を選ぶと、打ち消し線のついたタスクだけが残ります。フィルターを「すべて」に戻すと全部表示されることも確認してください。次は「すべて」を選んでいる状態の見た目です。選択中のボタンだけ色を変えておくと、いま何で絞り込んでいるかが分かります。

![Week15 ミニドリル 問題1 ゴールUI](./images/minidrill-week15-1.png)

<details>
<summary>ヒント</summary>

`tasks` はそのまま残し、表示用に絞り込んだ配列を別に作ります。

```jsx
const [filter, setFilter] = useState("all");

// filter の値に応じて、表示するタスクを決める
const visibleTasks = tasks.filter((task) => {
  if (filter === "done") return task.done;
  if (filter === "undone") return !task.done;
  return true; // "all" のときは全部
});
```

一覧の `map` は、`tasks` ではなく `visibleTasks` を回します。

</details>

<details>
<summary>解答の要点</summary>

```jsx
const [filter, setFilter] = useState("all");

const visibleTasks = tasks.filter((task) => {
  if (filter === "done") return task.done;
  if (filter === "undone") return !task.done;
  return true;
});
```

ボタンは、押されたら `setFilter` で `filter` を切り替えます。選択中のボタンだけ見た目を変えると分かりやすくなります。

```jsx
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setFilter("all")}
    className={filter === "all" ? "bg-blue-500 text-white px-3 py-1 rounded" : "border px-3 py-1 rounded"}
  >
    すべて
  </button>
  <button
    onClick={() => setFilter("undone")}
    className={filter === "undone" ? "bg-blue-500 text-white px-3 py-1 rounded" : "border px-3 py-1 rounded"}
  >
    未完了
  </button>
  <button
    onClick={() => setFilter("done")}
    className={filter === "done" ? "bg-blue-500 text-white px-3 py-1 rounded" : "border px-3 py-1 rounded"}
  >
    完了済み
  </button>
</div>
```

一覧の `map` を `visibleTasks` に差し替えます。

```jsx
{visibleTasks.map((task) => (
  <li key={task.id}>{/* ... */}</li>
))}
```

ポイントは、絞り込みで元の `tasks` を削らないこと。表示だけを切り替えているので、「すべて」に戻せば全件そのまま出ます。

</details>

---

### 問題2：バグ診断（追加ボタンを押しても画面が変わらない）（15分）

次のコードは、タスクを追加しようとしています。追加ボタンを押しても、リストには何も増えません（入力欄の文字もそのまま残ります）。何が問題か説明し、修正してください。

```jsx
import { useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");

  const addTask = () => {
    tasks.push({ id: Date.now(), text: input, done: false });
  };

  return (
    <div className="p-4">
      <input value={input} onChange={(event) => setInput(event.target.value)} />
      <button onClick={addTask}>追加</button>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.text}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

<details>
<summary>ヒント</summary>

配列stateを更新するには、set関数を通す必要があります。`push` で元の配列を直接書き換えても、Reactは「変わった」ことに気づけません。インプットの「stateは、上書きせずに作り直す」の節が対応します。

</details>

<details>
<summary>解答の要点</summary>

問題は `tasks.push(...)` です。`push` は元の配列を直接書き換えるだけで、`setTasks` を呼んでいません。set関数を通していないので、`App` の実行し直しが起きず、画面は描き直されません。配列の中身は増えているのに、画面には出てこない——インプットの「メモは増えたのに、得点ボードが変わらない」と同じ状態です。

`setTasks` に、新しい配列を作って渡すように直します（追加できたら入力欄も空に戻しておきます）。

```jsx
const addTask = () => {
  setTasks([...tasks, { id: Date.now(), text: input, done: false }]);
  setInput("");
};
```

`[...tasks, 新しい要素]` で、元の中身をコピーした上に1件足した「新しい配列」を作り、それを `setTasks` に渡します。これでReactが「stateが変わった」と判断して、リストを描き直します。

</details>

---

### 問題3：タスク1件を `TaskItem` コンポーネントに切り出す（25分）

先週（Week14）は、部品（コンポーネント）に props を渡して見た目を作りました。今週はそこに state を組み合わせます。完成サンプルの「タスク1件分の `<li>`」を、`TaskItem` という別コンポーネントに切り出してください。

state（`tasks`）は `App` に置いたまま、`TaskItem` には「表示するタスク」と「押されたときに呼ぶ関数」を props で渡すのがポイントです。

**要件:**

- `src/components/TaskItem.jsx` に `TaskItem` を作り、`export default` する
- `TaskItem` は `task`（タスク1件）・`onToggle`・`onDelete` の3つの props を受け取る
- タスクの文字をクリックしたら `onToggle` を、削除ボタンを押したら `onDelete` を、それぞれ `task.id` を渡して呼ぶ
- `App` 側は `map` の中で `<TaskItem ... />` を使い、`onToggle={toggleTask}` `onDelete={deleteTask}` を渡す

**完成状態の確認方法:** 見た目と動きは、切り出す前とまったく同じ（追加・完了切り替え・削除が動く）ならOKです。コンポーネントに分けても機能が変わらないことを確認してください。

<details>
<summary>ヒント</summary>

`TaskItem` は「1件分の見た目」だけを持ちます。データも、押されたときの中身も、`App` から props でもらいます。

```jsx
// src/components/TaskItem.jsx
function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li className="flex items-center gap-2 bg-white rounded-lg shadow px-4 py-2">
      <span
        className={`flex-1 cursor-pointer ${task.done ? "line-through text-gray-400" : ""}`}
        onClick={() => {/* TODO: onToggle に task.id を渡して呼ぶ */}}
      >
        {task.text}
      </span>
      <button
        className="text-red-400 hover:text-red-600 text-sm"
        onClick={() => {/* TODO: onDelete に task.id を渡して呼ぶ */}}
      >
        削除
      </button>
    </li>
  );
}

export default TaskItem;
```

`App` 側では `import TaskItem from "./components/TaskItem";` してから、`map` の中で使います。

</details>

<details>
<summary>解答の要点</summary>

```jsx
// src/components/TaskItem.jsx
function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li className="flex items-center gap-2 bg-white rounded-lg shadow px-4 py-2">
      <span
        className={`flex-1 cursor-pointer ${task.done ? "line-through text-gray-400" : ""}`}
        onClick={() => onToggle(task.id)}
      >
        {task.text}
      </span>
      <button
        className="text-red-400 hover:text-red-600 text-sm"
        onClick={() => onDelete(task.id)}
      >
        削除
      </button>
    </li>
  );
}

export default TaskItem;
```

```jsx
// App.jsx の一覧部分
import TaskItem from "./components/TaskItem";

// ...

<ul className="space-y-2">
  {tasks.map((task) => (
    <TaskItem
      key={task.id}
      task={task}
      onToggle={toggleTask}
      onDelete={deleteTask}
    />
  ))}
</ul>
```

state（`tasks`）と、それを更新する関数（`toggleTask`・`deleteTask`）は `App` に置いたままです。`TaskItem` は「1件を表示して、押されたら受け取った関数を呼ぶ」だけ。データは props（`task`）で下ろし、操作は props（`onToggle`・`onDelete`）で上に戻す。これが、先週の props と今週の state を組み合わせた形です。

</details>

---

## POSSE課題

### テーマ：React製タスク管理アプリ

**先週（Week14）の書籍紹介ページとは別に、新しい React プロジェクト**を作ってください。`useState`・`useEffect` を使って、タスク管理アプリを実装します。

**要件:**

- `pnpm create vite <名前> --template react` で React テンプレートを使っている
- Tailwind を pnpm でインストールし、Vite のプラグイン（`@tailwindcss/vite`）で使っている（CDN読み込みではない）
- タスクの追加（テキスト入力 → ボタンクリック、またはEnterで追加）
- タスクの完了切り替え（クリックで `done` を反転し、完了済みは打ち消し線や色などで視覚的に区別できる）
- タスクの削除
- 配列stateの更新に `setTasks(...)` を使い、`push` や `splice` で元の配列を直接書き換えていない
- 空文字のタスクは追加しない

**【発展・任意】:**

- `useEffect` で `localStorage` に保存し、リロードしてもタスクが消えないようにする
- フィルター機能（すべて・未完了・完了済み）を追加する
- タスク1件を `TaskItem` コンポーネントに切り出し、props で `task` とコールバックを渡す

**提出:**

GitHub リポジトリに push して URL を提出してください。`pnpm run build` を実行し、`dist` フォルダが生成されることを確認します。GitHub Pages へのデプロイは発展（任意）です。

**PR本文に必ず書くこと:**

1. stateの一覧（変数名・初期値・何を管理しているか）
2. タスクの追加・完了切り替え・削除で、それぞれどのstateを、どう更新したか（`[...tasks, x]` / `filter` / `map` のどれを使ったか）
3. DOM直接操作（`document.querySelector` など）を使わずにstateで画面を変えている理由を、自分の言葉で
4. 詰まった場所とどう解決したか（1箇所以上）

## 確認結果

### 表示確認

- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録

今週の実装で判断が必要だった場面を1つ書いてください:

- 選択肢A（例: 完了済みを打ち消し線で表す）:
- 選択肢B（例: 完了済みを背景色で表す）:
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
- AIが間違えた・足りなかったこと（`push` での直接更新・`key` の付け忘れ・空文字チェック漏れなど）:
- 自分が修正・判断した箇所:

### チェックポイント

- [ ] React テンプレートで新しいプロジェクトを作成した
- [ ] Tailwind を pnpm でインストールし、`vite.config.js` にプラグインを追加した
- [ ] タスクの追加・完了切り替え・削除が動いている
- [ ] 配列stateの更新に `setTasks` と `[...tasks, x]` / `filter` / `map` を使っている（`push`・`splice` を使っていない）
- [ ] 完了済みのタスクとそうでないタスクが、視覚的に区別できる
- [ ] 空文字のタスクは追加されない
- [ ] JSX で `class` ではなく `className` を使っている
- [ ] `pnpm run build` で `dist` フォルダが生成された
- [ ] PR本文にstateの一覧・各操作の更新方法・DOM直接操作を使わない理由・詰まった箇所を書いた
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] AIとの比較を記録した（Week06以降必須）

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### useState

| 書き方 | 説明 |
|---|---|
| `const [v, setV] = useState(初期値)` | 変わる値を1つ用意する。`v` が今の値、`setV` が更新用の関数 |
| `setV(新しい値)` | 値を新しくして、Reactに画面を描き直させる |
| `useState(() => 初期値)` | 初期値を関数で渡すと、最初の1回だけ実行される（`localStorage` 読み込みなど） |

### 配列・オブジェクトstateの更新（元を書き換えず作り直す）

| 操作 | 書き方 |
|---|---|
| 追加 | `setTasks([...tasks, newTask])` |
| 削除 | `setTasks(tasks.filter((t) => t.id !== id))` |
| 1件更新 | `setTasks(tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t))` |
| オブジェクトの一部更新 | `{ ...task, done: true }` で新しいオブジェクトを作る |

### イベント

| 書き方 | 説明 |
|---|---|
| `onClick={() => ...}` | クリックされたとき |
| `onChange={(e) => setX(e.target.value)}` | 入力欄の中身が変わるたび |
| `onSubmit={(e) => { e.preventDefault(); ... }}` | フォーム送信時。`preventDefault` で再読み込みを止める |

### useEffect

| 第2引数 | 動くタイミング |
|---|---|
| `[]` | 最初の表示のあとに1回だけ |
| `[count]` | 最初 ＋ `count` が変わるたびに |
| 書かない | 毎回の再描画のあと（基本は使わない） |

### 公式ドキュメント

- [state：コンポーネントのメモリ（React）](https://ja.react.dev/learn/state-a-components-memory)
- [useState（React）](https://ja.react.dev/reference/react/useState)
- [イベントへの応答（React）](https://ja.react.dev/learn/responding-to-events)
- [state内の配列の更新（React）](https://ja.react.dev/learn/updating-arrays-in-state)
- [state内のオブジェクトの更新（React）](https://ja.react.dev/learn/updating-objects-in-state)
- [エフェクトを使って同期する（React）](https://ja.react.dev/learn/synchronizing-with-effects)
- [useEffect（React）](https://ja.react.dev/reference/react/useEffect)
- [Window.localStorage（MDN）](https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage)
