# Week00｜環境構築

プログラミング学習を始めるために、使用するツールをインストールし、初期設定を行いましょう。

- Webサイトを表示するための**ブラウザ**
- コードを書くための**エディタ**
- デザインを作る・確認するための**デザインツール**
- ファイルのバージョンを管理するための**Git**

をインストールしましょう。

この週はコードを書く前の準備だけです。POSSE課題はありません。セットアップが完了したら Week01 に進んでください。

---

## 今週の全体像

| | |
|---|---|
| **やること** | ブラウザ・エディタ・Node.js・Git・GitHubの準備 |
| **完了条件** | ターミナルで `node -v`、`pnpm -v`、`git --version` がエラーなく表示される |
| **所要時間目安** | 1〜2時間（ネット環境や機種によって前後します） |

---

## 1. ブラウザ「Google Chrome」

ブラウザはいくつか種類があります（Safari、Edge、Firefox など）。

POSSEのカリキュラムでは、開発に便利な拡張機能が豊富な **Google Chrome** を使います。

[Google Chrome をダウンロード](https://www.google.com/intl/ja/chrome/gsem/download/)

ダウンロードしたらインストールまで進めてください。

インストール後、Chrome のデベロッパーツール（検証ツール）という機能を Week01 以降で使います。詳しい使い方はその都度説明しますが、右クリック → 「検証」で開けることだけ覚えておいてください。

---

## 2. エディタ「VSCode」

エディタは、コードを書くためのツールです。メモ帳の高機能版だと思ってください。

[VSCode をダウンロード](https://code.visualstudio.com/)

ダウンロードしたらインストールまで進めてください。

### 日本語化

VSCode は初期状態が英語表示です。次の拡張機能をインストールすると日本語になります。

1. 左サイドバーの「Extensions」アイコンをクリック
2. 検索欄に `Japanese Language Pack for Visual Studio Code` と入力
3. 「Install」をクリック
4. インストール後、VSCode を再起動

左上の「EXTENSIONS: MARKETPLACE」が「拡張機能」に変わっていれば成功です。

### 拡張機能のインストール

以下の拡張機能をすべてインストールしてください。インストール手順は日本語化と同じです。

| 拡張機能名 | 説明 |
|---|---|
| `Tailwind CSS IntelliSense` | Tailwindのクラス名を入力補完してくれる（PH1で必須） |
| `Live Server` | ファイルを保存するとブラウザが自動で再読み込みされる |
| `indent-rainbow` | インデントに色をつけて見やすくする |
| `Zenkaku` | 全角スペースを見つけてくれる（日本語入力ミスを防ぐ） |
| `Auto Rename Tag` | 開始タグを変えると終了タグも自動で変わる |
| `Path Intellisense` | ファイル名を入力するときに候補を出してくれる |
| `Code Spell Checker` | 英語のスペルミスを教えてくれる |
| `Prettier - Code formatter` | コードの形を自動で整えてくれる |
| `Live Share` | 画面を共有して共同作業できる（メンターとのペアプロに便利） |

全部入れ終わったら VSCode を再起動してください。

![VSCode拡張機能のインストール](./images/vscode-plugin.png)

![VSCode日本語化の確認](./images/vscode-japanese.png)

---

## 3. デザインツール「Figma」

Figma はデザインを確認・共有するためのツールです。ブラウザでも使えますが、アプリをインストールして使うのがおすすめです（タブが増えて迷子になりにくい）。

[Figma をダウンロード](https://www.figma.com/ja/downloads/)

デスクトップアプリを選択してダウンロードしてください。

### アカウントを作成する

Figma はログインして使います。公式サイトの右上から「Sign up」をクリックしてアカウントを作成してください。

![Figmaのサインアップ画面](./images/figma-download.png)

---

## 4. Node.js のインストール（mise を使う）

Node.js は、JavaScript をブラウザの外で動かすための仕組みです。PH2 以降のツールを使うために必要です。

POSSEでは Node.js のバージョン管理に **mise** を使います。`nvm` や `nodenv` はここでは使いません。

### mise のインストール

ターミナルを開いて（VSCode なら「ターミナル」→「新しいターミナル」）、次のコマンドを実行します。

![VSCodeのターミナルを開く](./images/terminal1.png)

![ターミナルが開いた状態](./images/terminal2.png)

**Mac の場合:**

```bash
curl https://mise.run | sh
```

インストール後、ターミナルに次の設定を追加します。使っているシェルに合わせて選んでください。

```bash
# zsh の場合（Mac のデフォルト）
echo 'eval "$(~/.local/bin/mise activate zsh)"' >> ~/.zshrc
source ~/.zshrc

# bash の場合
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
```

**Windows の場合（まず Scoop を入れる）:**

Windows には `winget`（Microsoft公式）という似たツールもありますが、POSSEでは **Scoop** を使います。

| | winget | Scoop |
|---|---|---|
| 管理者権限 | 必要なことが多い | **不要**（ユーザーフォルダにインストール） |
| 開発CLIツールとの相性 | △（PATH反映が不安定になることがある） | **○**（PATHが確実に通る） |
| アンインストール | 不完全なことがある | クリーン（フォルダごと消える） |
| 学校PC・共有PC | 制限で使えないことがある | **使いやすい** |

開発ツール（mise・Git・pnpm など）は Scoop で管理するとトラブルが少ないため、POSSEではこちらを採用しています。

Scoop を使うとコマンド1つでツールをインストールでき、Git も後でまとめてインストールできます。

スタートメニューから **PowerShell** を開き、次を実行してください。

```powershell
# 実行ポリシーを変更（コピペで実行してOK）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Scoopをインストール
irm get.scoop.sh | iex
```

「Scoop was installed successfully」と表示されたら成功です。

```powershell
# miseをインストール
scoop install mise
```

続けて、PowerShell を開くたびに mise が有効になるように設定します。

```powershell
# profile用のフォルダを作成
New-Item -ItemType Directory -Force -Path (Split-Path $PROFILE)

# profileファイルがなければ作成
if (-not (Test-Path $PROFILE)) {
  New-Item -ItemType File -Path $PROFILE
}

# profileにmiseの起動設定を追記（すでにある場合は追記しない）
$miseActivate = '(& mise activate pwsh) | Out-String | Invoke-Expression'
if (-not (Select-String -Path $PROFILE -Pattern 'mise activate pwsh' -SimpleMatch -Quiet)) {
  Add-Content -Path $PROFILE -Value $miseActivate
}

# 今開いているPowerShellにも反映
(& mise activate pwsh) | Out-String | Invoke-Expression
```

設定後、PowerShell を一度閉じて開き直してください。

### インストールの確認

```bash
mise --version
```

バージョン番号が表示されれば OK です。

### Node.js のインストール

```bash
mise use --global node@lts
```

`lts` は「長期サポート版」という意味で、現在最も安定したバージョンが入ります。

Windows の場合は、ここで PowerShell を一度閉じて開き直してください。開き直すことで、profile に書いた mise の設定が正しく反映されるか確認できます。

インストール後、確認します。

```bash
node -v
```

`v22.x.x` または `v24.x.x` のように表示されれば成功です（LTSのバージョンはインストール時期によって変わります）。

---

## 5. pnpm のインストール

pnpm は JavaScript のパッケージ（ライブラリ）を管理するツールです。`npm install` の代わりに `pnpm install` を使います。

POSSEでは Node.js と同じく、pnpm も mise で管理します。`npm install -g pnpm` は使いません。

```bash
mise use --global pnpm@latest
```

確認します。

```bash
pnpm -v
```

バージョン番号が表示されれば成功です。pnpm のバージョンはインストール時期によって変わるため、数字が表示されれば問題ありません。

---

## 6. Git のインストールと初期設定

Git は、コードの変更履歴を記録するツールです。「ゲームのセーブデータ」と同じ感覚で使います。

### インストール

**Mac の場合:**

ターミナルで次を実行します。

```bash
git --version
```

すでに `git version 2.x.x` と表示されれば、インストール済みです。

「command not found」と表示された場合は、[git-scm.com](https://git-scm.com) からインストーラーをダウンロードしてください。または、Homebrew が入っていれば次でも入ります。

```bash
brew install git
```

**Windows の場合:**

Scoop を使ってインストールします。PowerShell で次を実行してください。

```powershell
scoop install git
```

これで Git と Git Bash が一緒にインストールされます。SSH鍵の設定（セクション7）では Git Bash を使います。

### インストールの確認

```bash
git --version
```

`git version 2.x.x` のように表示されれば OK です。

![git --versionの出力例](./images/setup-git-version.png)

### 初期設定

Git に「誰がコードを書いたか」を教えるための設定です。GitHub のアカウント名とメールアドレスを使ってください。

```bash
git config --global user.name "あなたのGitHubユーザー名"
git config --global user.email "あなたのメールアドレス"
```

設定を確認します。

```bash
git config --global --list
```

`user.name` と `user.email` が表示されれば完了です。

---

## 7. GitHub アカウントの作成

GitHub は、コードをインターネット上に置いておける場所です。Week01 以降でコードを公開するために使います。

### アカウントを作る

1. [github.com](https://github.com) を開く
2. 右上の「Sign up」をクリック
3. メールアドレス・パスワード・ユーザー名を入力する
   - ユーザー名は後から変えにくいです。シンプルなものにしましょう（例：`tanaka-taro`、`posse-jun`）
4. メールアドレスに届いた確認コード（6桁の数字）を入力して完了

GitHub のアカウントを持っている場合はそのまま使ってください。

![GitHubトップページ](./images/setup-github-top.png)

![GitHubサインアップ画面](./images/setup-github-signup.png)

### アカウント確認

GitHub にログインした状態で [github.com](https://github.com) を開き、右上に自分のアイコンが表示されていれば OK です。

---

## 8. SSH鍵の設定（GitHubへの認証）

コードを GitHub に送る（`git push`）とき、「本人確認」が必要です。現在の標準的な方法は **SSH鍵** を使う方法です。一度設定すれば、以降はパスワード入力なしで使えます。

### SSH鍵を生成する

**Mac の場合：** VSCode のターミナルで実行します。

**Windows の場合：** スタートメニューから **Git Bash** を開いて実行します（VSCode のターミナルではなく Git Bash を使う）。

```bash
ssh-keygen -t ed25519 -C "GitHubに登録したメールアドレス"
```

実行するといくつか質問されますが、すべて **Enter を押す**（デフォルトのまま）で問題ありません。

```
Enter file in which to save the key: （Enter）
Enter passphrase: （Enter）
Enter same passphrase again: （Enter）
```

`~/.ssh/id_ed25519`（秘密鍵）と `~/.ssh/id_ed25519.pub`（公開鍵）の2ファイルが生成されます。

### 公開鍵をコピーする

**Mac の場合：**

```bash
cat ~/.ssh/id_ed25519.pub
```

表示された `ssh-ed25519 AAAA...` から始まる1行をすべてコピーします。

**Windows（Git Bash）の場合：**

```bash
cat ~/.ssh/id_ed25519.pub | clip
```

クリップボードに直接コピーされます（画面には何も表示されません）。

### GitHubに公開鍵を登録する

1. GitHub にログインし、右上のアイコン → **Settings**
2. 左メニューの **「SSH and GPG keys」** をクリック
3. **「New SSH key」** をクリック
4. Title に `my-pc`（任意の名前）、Key に先ほどコピーした公開鍵を貼り付け
5. **「Add SSH key」** をクリック

### 接続テスト

```bash
ssh -T git@github.com
```

```
Hi （ユーザー名）! You've successfully authenticated, but GitHub does not provide shell access.
```

と表示されれば設定完了です。

> **Windows で「Permission denied」が出る場合：** Git Bash で `eval "$(ssh-agent -s)"` を実行してから `ssh-add ~/.ssh/id_ed25519` を実行し、もう一度 `ssh -T git@github.com` を試してください。

---

## 動作確認まとめ

セットアップが終わったら、以下をターミナルで順番に実行して確認してください。

```bash
node -v
pnpm -v
git --version
git config --global user.name
git config --global user.email
ssh -T git@github.com
```

6つとも正常に表示されれば Week01 に進む準備ができています。

| コマンド | 期待される出力の例 |
|---|---|
| `node -v` | `v24.x.x`（現在のLTS） |
| `pnpm -v` | `10.x.x` や `11.x.x` など |
| `git --version` | `git version 2.x.x` |
| `git config --global user.name` | 設定したユーザー名 |
| `git config --global user.email` | 設定したメールアドレス |
| `ssh -T git@github.com` | `Hi xxx! You've successfully authenticated...` |

---

## よくあるエラーと対処

| 症状 | 原因 | 対処 |
|---|---|---|
| `mise: command not found` | インストール後の設定が反映されていない | ターミナルを閉じて開き直す |
| `node: command not found` | mise は入っているが、Node.js のパスが反映されていない | `mise use --global node@lts` を実行し、ターミナルを閉じて開き直す |
| `pnpm: command not found` | pnpm が mise でインストールされていない | `mise use --global pnpm@latest` を実行し、ターミナルを閉じて開き直す |
| PowerShell を開くたびに赤いエラーが出る | PowerShell の profile に書いた mise 設定が壊れている | 下の「profile が壊れている場合」を確認する |
| `git: command not found` | Git がインストールされていない | インストーラーで再インストール |
| `user.name` が空欄 | `git config` がまだ | `git config --global user.name "..."` を実行 |

### profile が壊れている場合

ここでいう「profile が壊れている」とは、PowerShell を開くたびに読み込まれる設定ファイルの中に、正しく動かない mise の設定が書かれている状態です。

たとえば、次のような状態です。

- PowerShell を開いただけで赤いエラーが表示される
- エラーの中に `mise.exe` や `scoop\apps\mise` が出てくる
- `C:\Users\...` のユーザー名部分が文字化けしている
- `node -v` や `code .` を実行したときにも同じようなエラーが出る

この場合は、どの行を消すか自分で判断せず、profile をバックアップして mise 用の設定だけに作り直します。

まず、profile を読み込まずに PowerShell を開きます。

```powershell
powershell -NoProfile
```

開いた PowerShell で、次を実行してください。

```powershell
New-Item -ItemType Directory -Force -Path (Split-Path $PROFILE)
if (Test-Path $PROFILE) {
  Copy-Item $PROFILE "$PROFILE.bak" -Force
}
Set-Content -Path $PROFILE -Value '(& mise activate pwsh) | Out-String | Invoke-Expression'
```

書き込み内容を確認します。

```powershell
Get-Content $PROFILE
```

次の1行だけが表示されれば OK です。

```powershell
(& mise activate pwsh) | Out-String | Invoke-Expression
```

その後、PowerShell をすべて閉じて、開き直してください。

詰まった場合は Discord の質問チャンネルに状況（エラーメッセージのスクリーンショット、OS、何をしたか）を書いて投稿してください。
