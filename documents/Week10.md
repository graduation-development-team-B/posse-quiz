# Week10｜非同期処理・Fetch・JSON

スマホでSNSを開いて、画面を上から下に引っ張る。一瞬おいて、さっきまで無かった投稿が表示される。あれは、アプリが裏で「サーバーに最新のデータを取りに行き、返ってきたら画面に並べる」という仕事をしているからです。今週は、その仕組みを自分の手で作れるようにします。中心になる道具が `fetch` です。

---

## 今週の全体像

| | |
|---|---|
| **学ぶこと** | 非同期処理の概念、Promise（概念）、`async/await`、`fetch()`、`response.ok`、`response.json()`、JSON形式、`try/catch` |
| **作るもの** | GitHubユーザー情報表示ツール（GitHub APIからデータを取得して表示） |
| **完了条件** | `fetch` と `async/await` でデータを取得し、結果を画面に表示・エラー時の処理を書ける |
| **所要時間目安** | インプット 1.5〜2h、ミニドリル 1〜1.5h、POSSE課題 2〜3h |

AIを使う場合はPOSSE課題のみ。インプット・自信度チェック・ミニドリルでは使わないこと。

---

## インプット

### 頼んでも、すぐには返ってこない

カップ麺を作るとき、お湯を入れてから3分待ちますよね。あの3分は、地味に長い。待ちきれずにフタを開けて、芯の残った固い麺をすすってしまった——たぶん、誰にでも一度はある失敗です。

実は `fetch` も、これとまったく同じ構造をしています。

`fetch` を使うと、指定したURLにデータを取りに行けます。でも、**頼んだ結果は、その場では返ってきません**。データはネットの向こう側にあって、サーバーとの往復には、速くても0.数秒、遅ければ数秒かかる。お湯を注いだ直後のカップ麺と同じで、「頼んだ＝すぐできあがり」ではないのです。

どれくらい「まだできていない」かは、目で見えます。`fetch` の戻り値を、そのまま表示してみてください。

```js
console.log(fetch("https://jsonplaceholder.typicode.com/users/1"));
// → Promise {<pending>}
```

返ってくるのは、ユーザーのデータ——ではありません。`Promise {<pending>}` という、見慣れない文字です。`<pending>` は「保留中」。これはまさに、お湯を入れて待っている最中のカップ麺です。麺（データ）はまだできていない。でも、「3分後にはできあがる」という入れ物だけは、もう手元にある。

ここで問題が起きます。JavaScriptは、せっかちなのです。何も指示しないと、この『調理中のカップ麺』を待たずに、**そのままフタを開けて食べようとします**。芯の残った麺——つまり、まだデータの入っていない空の状態——を使ってしまい、当然うまくいきません。

だから、ひとこと言ってやります。「ここは時間がかかる。**できあがるまで、ちゃんと待ってから次に進め**」。この『待て』が `await` です。

```js
const response = await fetch("https://jsonplaceholder.typicode.com/users/1");
```

`await` を付けると、`fetch` の結果が返ってくるまでこの行で待ち、できあがってから次へ進みます。さっきの `Promise {<pending>}`（調理中のカップ麺）を、ちゃんと完成させてから受け取れる、というわけです。

この「時間のかかる処理を、できあがるまで待ちながら順番に進める」やり方を、まとめて**非同期処理**と呼びます。

---

### 「Promise」という入れ物

さっき出てきた `Promise {<pending>}` に、名前をつけておきます。

あの「いまは空っぽだけど、あとで中身が入る入れ物」——調理中のカップ麺にあたるものを、**Promise** と呼びます。`fetch` のように時間のかかる処理は、結果そのものをすぐには返せないので、代わりにこの『あとで結果が入る入れ物』を先に渡してくるわけです。

`await` の役割も、これで筋が通ります。`await` は「その入れ物の中身ができあがるまで待って、できたら受け取る」指示です。`await` を付けずに進めば、まだ空っぽの Promise を、そのまま使おうとして失敗する。さっきの『待たずにフタを開ける』が、コードの上で起きるわけです。

PH1では、Promiseの内部の仕組みまで覚える必要はありません。「`fetch` はすぐ結果を返さず、`await` で待ってから受け取る」。この流れが掴めていれば十分です。

---

### async と、いちばん多い事故

`await` には、ひとつだけルールがあります。`await` を書く行は、必ず `async` を付けた関数の中に置く、というものです。`async` は「この関数の中では `await` を使う」という宣言で、`await` とセットで覚えてしまって構いません。

```js
async function loadUser() {
  const response = await fetch("https://jsonplaceholder.typicode.com/users/1");
  const data = await response.json();
  console.log(data);
}
```

上から「取りに行く → 待つ → 受け取る → 使う」と、書いた順そのままに並びます。この読みやすさが `async/await` の利点です。

いちばん多い事故は、やはり `await` の付け忘れです。付け忘れると、まだ調理中の Promise に対して、いきなり「中身をよこせ」と `.json()` を呼ぶことになり、こう怒られます。

```
TypeError: response.json is not a function
```

「`response` に `.json()` なんて関数は無い」という意味です。できあがる前のカップ麺に箸を突っ込んでも、食べられる麺がまだ無いのと同じこと。だから、**時間のかかる処理を見たら、反射で `await`**。これは理屈で覚えるより、手を動かして体に入れてしまうほうが早いです。

---

### 受け取っても、まだ中身は使えない

`await fetch()` で待って受け取った `response`。これでデータが手に入った、と言いたいところですが、もうひと手順あります。

試しに `response` を、そのまま表示してみます。

```js
console.log(response);
// → Response {status: 200, ok: true, url: '...', ...}
```

ユーザーの名前もメールも、どこにも見当たりません。「あれ、取れてない？」と一瞬あせるところですが、これで正しい状態です。`response` は、**中身は入っているのに、まだ開けていない宅配ボックス**のようなもの。ちゃんと届いてはいるけれど、開けていないから中身が見えていないだけです。

このボックスを開ける命令が、これです。

```js
const data = await response.json();
```

`.json()` は、`response` の中身を取り出して、JavaScriptで扱える形に変換します。この変換にも少し時間がかかるので、ここにも `await` が必要です。開けて初めて、中からデータ本体——オブジェクトや配列——が出てきます。

このとき出てくるデータの形式が **JSON** です。JavaScriptのオブジェクトや配列の書き方によく似た、データをやり取りするための形式で、`response.json()` はこれをJavaScriptのオブジェクト・配列に変換してくれます。中身を受け取ったら、まず `console.log` で形を確かめ、どのプロパティ（`name`、`email` など）を使うかを決める。これが、いちばん詰まりにくい順番です。

---

### 通信はわりと失敗する

最後に、現実的な話をひとつ。**通信は、わりと失敗します。**

ユーザー名のスペルを間違える。そんなユーザーは存在しない。電波が弱い。サーバーが落ちている。失敗する理由はいくらでもあります。自分のPCではたまたま動いても、別の回線や別の人の環境では普通に転びます。だから「動いたからOK」ではなく、**失敗したときにどうするか**まで書いておきます。

備えは2段階です。

ひとつ目は `response.ok`。HTTPステータスが200番台（成功）なら `true`、404（見つからない）や500（サーバーエラー）なら `false` になる値です。これを確認して、ダメなら自分でエラーを投げます。

```js
if (!response.ok) {
  throw new Error("通信エラー: " + response.status);
}
```

ふたつ目は `try / catch`。ネットが切れているなど、通信そのものが成立しなかった場合、`fetch` はエラーを投げてプログラムを止めてしまいます。それを受け止めるのが `try / catch` です。

```js
async function loadUser() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users/1");
    if (!response.ok) {
      throw new Error("通信エラー: " + response.status);
    }
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("取得に失敗しました:", error);
  }
}
```

`try` の中で何か問題が起きると、処理はそこで止まらず `catch` に移ります。画面が真っ白なまま固まる代わりに、「取得に失敗しました」と表示して、原因をConsoleに残せる。この一手間があるかないかで、アプリの完成度はずいぶん変わります。

---

### 取ってきたデータを、画面に出す

中身（データ）を取り出せたら、あとは画面に並べるだけです。ここは Week08 でやった `forEach` の出番。配列を1件ずつ回して、要素を作って付け足していきます。

```html
<ul id="userList"></ul>
```

```js
async function loadUsers() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    if (!response.ok) {
      throw new Error("通信エラー: " + response.status);
    }
    const users = await response.json();

    const userList = document.getElementById("userList");
    userList.textContent = ""; // 重複防止のため一度空にする

    users.forEach((user) => {
      const item = document.createElement("li");
      item.textContent = user.name + " / " + user.email;
      userList.appendChild(item);
    });
  } catch (error) {
    console.error("取得失敗:", error);
  }
}

loadUsers();
```

コツはひとつだけ。**いきなり画面に出そうとせず、まず `console.log` でデータの形を確かめる**こと。配列なのかオブジェクトなのか、`name` や `email` がどう入っているのかを見てから書くと、ぐっと詰まりにくくなります。

---

### 全部つなげた完成サンプル

ここまでの「取りに行く → 待つ → 確認する → 開ける → 並べる → 失敗に備える」を、ひとつにまとめた完成形です。コピーして、ブラウザで動かしてみてください。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <title>ユーザー一覧</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 p-8">
    <h1 class="text-2xl font-bold mb-6">ユーザー一覧</h1>
    <div id="userList" class="grid gap-4"></div>

    <script>
      async function loadUsers() {
        const userList = document.getElementById("userList");

        try {
          const response = await fetch("https://jsonplaceholder.typicode.com/users");

          if (!response.ok) {
            throw new Error("通信エラー: " + response.status);
          }

          const users = await response.json();

          // まずConsoleで確認
          console.log(users);

          userList.textContent = "";

          users.forEach((user) => {
            const card = document.createElement("div");
            card.className = "bg-white rounded-lg shadow p-4";

            const name = document.createElement("h2");
            name.className = "text-lg font-bold";
            name.textContent = user.name;

            const email = document.createElement("p");
            email.className = "text-gray-600 text-sm";
            email.textContent = user.email;

            card.appendChild(name);
            card.appendChild(email);
            userList.appendChild(card);
          });
        } catch (error) {
          userList.textContent = "データの取得に失敗しました。";
          console.error(error);
        }
      }

      loadUsers();
    </script>
  </body>
</html>
```

最後に、道具をひとつ紹介します。DevToolsの **Networkタブ** を開くと、実際にどのURLへリクエストが飛び、何が返ってきたかが全部見えます。`fetch` がうまくいかないときの原因調査は、だいたいここから始まります。開き方だけでも覚えておいてください。

---

### 今日のまとめ

- 時間のかかる処理（`fetch` など）には `await`。待たずに使うのは、3分待たずにフタを開けて芯の残った麺を食べるのと同じで、まだ空の状態を触ってエラーになる。
- `fetch` で受け取った `response` は、まだ開けていない宅配ボックス。`await response.json()` で開けて、はじめてデータ本体（JSON）が使える。
- 通信は失敗する前提で書く。`response.ok` で成功を確認し、`try / catch` で通信エラーを受け止める。

この流れが手に馴染めば、外部のAPIからデータを取ってきて画面に表示する、という今どきのWebアプリの土台ができます。

> **次週とのつながり**：Week11はAIリテラシーの週です。AIに手伝ってもらったコードを「借り物」のままにせず、"なぜ"を聞き出して自分のものに変えるやり方を身につけます。今週まで身につけた「自分でコードを読んで直せる力」が、その土台になります。

---

## ミニドリル（AI禁止・60分）

### 着手前：着手前分解表（5分）

まず**分解のやり方**を確認してください。fetchは「取りに行く → 中身を確認する → 表示する」の順で考えると詰まりにくくなります。コードを書く前に整理しましょう。

> 分解の例はWeek03の着手前セクションを参照してください（Week03 → ミニドリル → 着手前）。

次を埋めてから問題1へ。

| 項目 | 書くこと |
|---|---|
| 完成状態 | 取得成功時・失敗時にそれぞれどう見えるか |
| 取得元URL | どのAPIから取るか |
| 取得タイミング | ページ読み込み時か、入力・クリック時か |
| Consoleで確認 | `console.log` で何の形（配列かオブジェクトか）を確認するか |
| 使うプロパティ | `title`・`name` など、どの値を使うか |
| 失敗時 | `response.ok` が false のとき・`catch` のときに何を出すか |

---

### 問題1：投稿タイトル一覧（fetch × forEach）（20分）

`drill-ph1` の `week10-1/` で作業します。

APIから投稿データを取得し、最初の5件のタイトルを一覧表示するコードを完成させます。
**完成したら同じフォルダ内の `goal.png` を開いて見比べてください。同じになっていればOKです。**

#### 仕様

| 項目 | Tailwindクラス / 内容 |
|---|---|
| ページ背景 | `bg-slate-50`（`p-8`） |
| コンテナ | `mx-auto max-w-2xl` |
| 各投稿 | `<li>`：`rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm` |
| ステータス | `id="status"`。失敗時は `text-red-500` |

#### 掲載する内容

- 取得元URL：`https://jsonplaceholder.typicode.com/posts`
- 最初の5件だけ表示する（`slice(0, 5)` を使う）／各投稿の `title` を `<li>` として `<ul id="postList">` に追加する

#### Step 1：`async` 関数の中で `await fetch(...)` → `response.ok` 確認 → `await response.json()` の順で取得し、`console.log` で配列の形を確認する

#### Step 2：`slice(0, 5)` で5件にし、`forEach` で `<li>` を作って `postList` に追加する。取得できたら `status` を空にする

#### Step 3：`try/catch` で失敗時に「取得に失敗しました」を表示する。`goal.png` とレイアウトを照合する

---

### 問題2：バグ診断（await 忘れ）（15分）

`drill-ph1` の `week10-2/` ディレクトリで作業してください。

`week10-2/index.html` を開くと、ユーザー名が**表示されず**、Consoleにエラーが出ています。`goal.html` は同じ見た目で、名前とメールが正しく表示されます。何が問題か説明し、修正してください。

![Week10 ミニドリル 問題2 ゴールUI](./images/minidrill-week10-2.png)

<details>
<summary>ヒント</summary>
`fetch()` はすぐに結果を返さず、Promiseを返します。その前に必要なキーワードが1つ抜けています。Consoleのエラー文を読んでみましょう。
</details>

<details>
<summary>解答の要点</summary>

`const response = fetch(...)` に `await` が付いていません。`await` なしの `fetch()` はPromiseオブジェクトを返すため、そのまま `.json()` を呼ぶとエラーになります（`response.json is not a function` のようなエラーが出ます）。`const response = await fetch(...)` のように `await` を付けると、レスポンスが返ってくるまで待ってから次の行へ進むので直ります。非同期処理では `await` が必要な箇所を意識的に確認しましょう。

</details>

---

### 問題3：投稿検索（fetch × filter・input の復習）（25分）

`drill-ph1` の `week10-3/` ディレクトリで作業してください。

APIから取得した投稿一覧を、入力欄のキーワードで絞り込むアプリを作ります。Week10のfetchと、Week08の配列・`filter`・`forEach`、Week09の入力値取得（`.value`）を組み合わせた復習問題です。

- ページ読み込み時にfetchで投稿を取得し、`allPosts`（10件）に貯めて一覧を描く
- 入力欄に文字を打つたびに、タイトルにその文字を含む投稿だけに絞り込んで描き直す

![Week10 ミニドリル 問題3 ゴールUI](./images/minidrill-week10-3.png)

#### Step 1：`render(posts)` 関数を作る。`postList.innerHTML = ""` → `posts.forEach` で `<li>` を作って `appendChild`（Week08の復習）

#### Step 2：`async` 関数でfetch → `response.ok` 確認 → `json()` → `slice(0, 10)` を `allPosts` に代入 → `render(allPosts)`。`try/catch` で失敗時の表示も書く

#### Step 3：`keyword` の `input` イベントで `allPosts.filter(post => post.title.includes(keyword))` を `render()` に渡す。キーワードを消すと全件に戻ることを確認する

---

## POSSE課題

### テーマ：GitHubユーザー情報表示ツール

**前週（Week09）とは別の、新しいHTMLファイル**を作ってください。GitHub APIを使って、入力したユーザー名の情報を取得して表示するツールを実装します。

**要件:**
- テキスト入力欄でGitHubのユーザー名を受け取る
- ボタンを押すと GitHub API（`https://api.github.com/users/{ユーザー名}`）にリクエストを送る
- 取得したデータから以下を画面に表示する：
  - アバター画像（`avatar_url`）
  - 名前（`name`）
  - bio（自己紹介）（`bio`）
  - フォロワー数（`followers`）
- `async/await` と `try/catch` を使って書く
- `response.ok` で通信の成功を確認する
- 存在しないユーザー名を入力した場合（`response.ok` が `false` の場合）は「ユーザーが見つかりませんでした」と表示する
- Tailwind CSSで見た目を整える
- GitHubリポジトリにpushしてURLを提出。ローカルで動作確認済みであればOK
- **取得したデータをConsoleで確認し、どのプロパティを使うかを自分で決めること（確認した内容をPR本文に書く）**

**【発展・任意】**
- ボタンを押している間（データが返ってくるまでの間）「読み込み中...」と表示するローディング表示を実装する
- リポジトリ数（`public_repos`）やプロフィールページへのリンク（`html_url`）も表示する

**提出:**
- GitHubリポジトリURL

**PR本文に必ず書くこと:**
1. `fetch` / `async/await` / `try/catch` をどう使ったか、自分の実装をもとに説明する（3点以上）
2. `response.ok` の確認と、存在しないユーザーのときの分岐をどう書いたか
3. 詰まった場所とどう解決したか（1箇所以上）

## 確認結果
### 表示確認
- スマホ幅（375px）:
- PC幅（1280px）:

## 判断の記録
今週の実装で判断が必要だった場面を1つ書く:
- 選択肢A（例: 失敗時はメッセージだけ出す）:
- 選択肢B（例: 失敗時は入力欄もリセットする）:
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
- AIが間違えた・足りなかったこと（`response.ok` の確認・エラー処理・`await` の付け忘れなど）:
- 自分が修正・判断した箇所:

### チェックポイント

- [ ] 前週とは別の新しいHTMLファイルを作った
- [ ] `fetch()` と `async/await` を使っている
- [ ] `response.ok` で通信の成功を確認している
- [ ] `try/catch` でエラー処理を書いている
- [ ] アバター・名前・bio・フォロワー数が画面に表示されている
- [ ] 存在しないユーザー名のとき「ユーザーが見つかりませんでした」と表示される
- [ ] 取得データをConsoleで確認している（PR本文に確認内容の記録がある）
- [ ] リポジトリURLが提出されており、ローカルで動作確認済みである
- [ ] PR本文に実装の説明と詰まった箇所の記録がある
- [ ] PR本文の「判断の記録」を1件書いた（選択肢・採用理由・確認方法）
- [ ] DevToolsでスマホ幅（375px）とPC幅（1280px）の両方で表示確認した
- [ ] PRの「確認結果」にスクリーンショットまたは確認した幅と状態を記載した
- [ ] AIとの比較を記録した（Week06以降必須）
- [ ] AIを使った場合、生成コードの要件照合・スマホ幅確認・クラスの意味確認を済ませた

---

## 参考資料

教材を読み終えてから、必要に応じて参照してください。

### 非同期処理の基本

| 書き方 | 説明 |
|---|---|
| `async function` | 中で `await` を使う関数の宣言 |
| `await` | 結果が返ってくるまで待ってから次の行へ進む |
| `fetch(url)` | URLにリクエストを送る（Promiseを返す） |
| `response.ok` | 通信が成功したとき `true` |
| `response.status` | HTTPステータスコード（`200`・`404` など） |
| `response.json()` | レスポンスのJSONをJSの配列・オブジェクトに変換する |

### エラー処理

| 書き方 | 説明 |
|---|---|
| `try { ... } catch (error) { ... }` | `try` 内でエラーが起きたら `catch` に飛ぶ |
| `throw new Error("メッセージ")` | 自分からエラーを投げて `catch` に渡す |
| `console.error(error)` | エラーの内容をConsoleに出す |

### JSONとデータの形

| 形 | 例 | 取り出し方 |
|---|---|---|
| オブジェクト | `{ "name": "太郎" }` | `data.name` |
| 配列 | `[ {...}, {...} ]` | `data.forEach(...)` / `data[0]` |

### MDN参考リンク

- [fetch() の使い方](https://developer.mozilla.org/ja/docs/Web/API/Window/fetch)
- [async function](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/async_function)
- [await](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/await)
- [Response: ok プロパティ](https://developer.mozilla.org/ja/docs/Web/API/Response/ok)
- [try...catch](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/try...catch)
- [JSON.parse() と JSON](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/JSON)
