# Git GitHub テキスト

- Git, GitHub を復習し、便利な知識についても少しインプットしていきましょう！
- 困った場合、[Level 1 テキスト](https://github.com/posse-ap/curriculum/blob/main/PH1/PH1_Git_GitHub_Level_1.md)と一緒に確認してみましょう！

## ここで学ぶこと

1. Level 1 の復習
2. ターミナルでの操作
3. プルリクエストのテンプレートについて
4. コンフリクト

---

## 1. Level 1 の復習

[Level 1 テキスト](https://github.com/posse-ap/curriculum/blob/main/PH1/PH1_Git_GitHub_Level_1.md) では、Git、GitHub の基礎について理解した後に、よく使うコマンドや Pull Request について学習しました。

以下の基本的な流れは必ず理解できているようにしましょう！

---

### リポジトリを clone する

`git clone`

- リモートリポジトリのブランチを複製してカレントディレクトリに保存する
- (手元の PC のコマンドを実行した場所にリポジトリの内容を複製する)

---

### 作業用ブランチを作成

![GitHub Clone](images/github-branches.png)

1. ブランチ一覧ページの「New Branch」のボタンをクリックし、新しく作成する

![GitHub Clone](images/github-branches-create.png)

2. `git fetch` を使ってリモートリポジトリの変更を取得する

- GitHub 上で新しいブランチを作成したことが変更点になるので、ローカルリポジトリに反映するために取得する

---

### 作業用ブランチに移動

`git checkout [新しい作業用ブランチ名]` を使って GitHub で作成した新しいブランチに移動する

---

### GitHub に push する

1. `git add {ファイル}` でファイルをインデックスに追加する（コミットの対象にする）

2. `git commit -m "{変更を記録するメッセージ}"` でインデックスに追加した変更を、ローカル or リモートリポジトリに記録する（基本はローカルリポジトリに記録する）

3. `git push origin {指定のブランチ}` でローカルの変更をリモートリポジトリにアップロードする

---

### Pull Request を作成する

1. Pull Requests のタブを押して表示されたページで、右上の「New pull request」 をクリックする

2. 「Compare changes」というページで、マージ先のブランチ（変更を反映するブランチ）を左側、自分の作業ブランチを右側に指定する

3. 「Create pull request」のボタンを押す

![Create Pull Request](images/github-pull-request-1.png)

4. Pull Request のタイトル、コメントを記載し、Pull Request の作成を完了させる

![Pull Request](images/github-pull-request-2.png)

---

### Pull Request を反映させる

1. Pull Request の下の方にある「Merge pull request」ボタンをクリックして反映する

- 反映しても良いか確認されるので、問題なければ 「Confirm」をクリックしてください

![Pull Request](images/github-pull-request-3.png)

2. Github 上で PR が紫色で「Merged」と表記されてるか確認する

![Pull Request](images/github-pull-request-4.png)

3. 反映の指定先にしたブランチに切り替え、リモートリポジトリで反映された内容を取り込む

![Pull Request](images/github-pull-request-5.png)

---

少し古いですが、[こちらの資料](https://drive.google.com/file/d/1r5YA9OeRqgnbGJqEkst7jX7xXUCwWWZn/view?usp=drive_link) も流れが記述されているので、確認してみましょう！

---

## 2. ターミナルの操作

ターミナルでできる操作についていくつか新しく勉強しましょう！

### ターミナルでブランチを作成

今まで GitHub でブランチを作成していたと思いますが、ターミナルでブランチを作成することもできます。

GitHub で作る場合、新しいブランチを作った後、`git fetch` でブランチの情報を取得する必要がありますが、この手間を省けます。

`git checkout -b [新しいブランチ名]` で作成することができます！

---

### ターミナルでブランチを削除

ブランチ数が多くなるとリポジトリが重くなってしまうので、不要なブランチは適宜削除しましょう。

`git branch -d [ブランチ名]` で削除することができます！

d は delete の略です。

マージされていれば上記のコマンドで問題なく消せるのですが、マージがされていなければエラーが出ます。

それでも消したい場合は `git branch -D [ブランチ名]` を実行しましょう。

---

## 3. プルリクエストのテンプレートについて

プルリクエストを毎回一から書かずに、テンプレートを使って記述することができます！

開発者同士で指定されたフォーマットを共有できるので、レビュアーはプルリクエストの目的や変更点を迅速に理解し、効率的にフィードバックすることができるようになります。

ハッカソンやチーム開発では開発時間が限られていますが、1 つのものを一緒に作る以上、お互いの作業や変更点について把握しておくのがとても重要です。

プルリクエストのテンプレートを使って時間を削減し、わかりやすい形で情報共有もできるので、どんどん活用しましょう！

---

### テンプレートの作成方法

1. main ブランチで、`.github` というフォルダを作成する。

![template 1](images/github-template-1.png)

2. `.github` フォルダの中に `PULL_REQUEST_TEMPLATE.md` というファイルを作成する。

![template 2](images/github-template-2.png)

3. 作成したファイルにテンプレートの内容を記述する。例えば、以下のようなフォーマットを書いてみます。

- ここの `##` は見出しを指します。`.md` はマークダウンファイルを指し、フォーマットがいくつか決まっています。基本的な書き方については[こちら](https://docs.github.com/ja/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)を確認してみましょう！

```markdown
## 目的・概要

このセクションでは、この PR の目的と概要を簡潔に説明してください。

## 変更点

このセクションでは、具体的な変更点や修正箇所を箇条書きでリストアップしてください。

- 変更点 1
- 変更点 2
- 変更点 3
```

![template 3](images/github-template-3.png)

4. GitHub に `add`, `commit`, `push` する。

---

### テンプレートの利用

実際にテンプレートを使ってみましょう。以下の手順に沿って自分の PC でやってみましょう！

1. GitHub で新しいリポジトリを作成し、`index.html`、`.github/PULL_REQUEST_TEMPLATE.md` ファイルを作成しましょう。

2. `.github/PULL_REQUEST_TEMPLATE.md` にテンプレートを記述しましょう。

3. GitHub に `add`, `commit`, `push` しましょう。

4. プルリクエストを作るためにはブランチが複数必要となるので、新しいブランチを作成しましょう。

5. 新しいブランチに移動し、`index.html` に変更を加えましょう。その後、GitHub に `add`, `commit`, `push` しましょう。

6. push 直後は以下の画像のように変更を加えたブランチの情報が上に表示されるので、`Compare & pull request` をクリックしましょう。

![template 4](images/github-template-4.png)

7. すると、以下の画像のようにテンプレートが書き込まれた状態で表示されます！プルリクエストの中身を記述し、`Create pull request` をクリックしましょう。

![template 5](images/github-template-5.png)

最終的に、プルリクエストは以下のように表示されるはずです！

![template 6](images/github-template-6.png)

---

## 4. コンフリクト

コンフリクトとは、英語で「衝突」を意味します。

ここでは、ファイル上で自分のコードと他人のコードの一部が重複している状態を指します。複数人が同じ箇所を変更したときに生じます。

コンフリクトが起きると、マージする際に、GitHub はどちらのブランチの記述が正しいか判断できないため自動でマージができなくなってしまい、先に進めません。

簡単に解決できることもありますが、ファイルやブランチが多いと解消に時間がかかります！ここで慣れておきましょう。

---

### コンフリクトの具体例

まず、実際のコンフリクトを見てみましょう。

[この動画](https://youtu.be/LDOR5HfI_sQ)の 42:49〜46:01 にコンフリクトの例がわかりやすく示されているので、確認してみましょう。

コンフリクトは、GitHub では以下のように表示されます。

## ![conflict 1](images/github-conflict-1.png)

### コンフリクトの予防方法

コンフリクトの解消方法について学ぶ前に、予防の仕方について学習しましょう。以下のポイントをおさえておきましょう。

1. 最初から作業分担をしっかりやりましょう。

- 誰がどの部分を担当するのかをしっかり確認し、同じファイルを編集することがないようにしましょう。
- CSS ファイル、Javascript ファイルも内容で分けると作業を分担しやすいです。

2. メンバーと頻繁にコミュニケーションをとりましょう。

- 新たに実装したい機能や変更したい部分などがメンバーに伝わっていないと、コンフリクトが生じる可能性が上がります。

3. マージ先の最新状態を取り込みましょう。

- 間違えて全体に影響を及ぼす可能性のあるファイルを編集してしまった場合、すぐメンバー全員に報告し、全員がマージ先の最新状態を取り込むようにしましょう。

---

### コンフリクトの解消方法

上の動画でも解消方法が紹介されていましたが、文章でも確認しておきましょう。

1. どちらのブランチのコードが正しいかを判断する（必要であればメンバーと一緒に）。

2. ターミナルでマージ先のブランチの最新状態を取得する（`git pull origin [ブランチ名]`）。

3. VSCode 上 でコンフリクト修正し、`add`、`commit`、`push`

4. 変更内容がプルリクエストに反映されたか確認する。

5. マージする。

以上が流れになります！

動画やここの手順ではターミナルや VSCode で解消する方法を紹介していますが、GitHub 上で直接解消することもできます。コンフリクトの画面で「Resolve conflicts」をクリックすれば編集画面に遷移します。

ただ、VSCode の方が操作しやすいのでそちらに慣れておきましょう！

ここまでお疲れ様でした！最後に[Level3](https://github.com/posse-ap/curriculum/blob/main/PH1/PH1_Git_GitHub_Level_3.md)に進んでください！
