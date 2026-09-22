# Git GitHub テキスト

- 新人ハッカソンで実際に運用する開発手法について学びます！
- Level1, 2で学んだことを理解している前提で説明が進みます！

## ここで学ぶこと

1. issue駆動開発とは何か
2. issueを作成する
3. issueに準拠したブランチを作成する
4. 擬似issue駆動開発を体験する

---

## 1. issue駆動開発とは何か

issue駆動開発は複数人で開発する際にメリットが生じる開発手法です。
以下のような特徴があります。

```text
issue駆動開発は開発に必要なタスクをすべてissueとして明文化する。
それに対して専用のブランチを作成し、Pull Request（PR）で変更を加える。
```

まだまだ何を言っているか分かりにくいですね！
少しずつ噛み砕いて説明していくので、一つずつ理解していきましょう！

主に以下のメリットがあります。

- タスクが可視化される
- 開発と管理の一貫性が保たれる

「issue」や「駆動」といった単語が聞き馴染みないかもしれませんが、実際の開発現場であり得る状況を想定してみましょう。

### 具体的な状況を想定してみる

WebサイトをA,B,Cさんの３人で開発することになったとします。
その際に、誰がどこを開発するのかを共有できてないと、開発箇所が重複してしまったり、同じブランチで開発してしまい内容を上書きしてしまうかもしれません。

そこでissue駆動開発を導入していれば、「Aさんはブランチ1でヘッダーを作成」、「Bさんはブランチ２でメインセクションを作成」、「Cさんはブランチ３でフッターを作成」と円滑に役割分担ができるのです！

![GitHub Clone](images/ph1-idd.png)

## 2. issueを作成する

まず作成物の完成形から逆算してどの粒度でissueを作成するか大まかに計算した上で、issueを作成します。
先ほどの例を借りて、「ヘッダーの作成」というissueを作成します。

まずissuesタブを開きます

![GitHub Clone](images/ph1-idd-step1.png)

次に「New Issue」をクリック

![GitHub Clone](images/ph1-idd-step2.png)

Titleはタスクの内容について端的にまとめたもの、内容には実装する背景・実装の詳細などを書きます。

![GitHub Clone](images/ph1-idd-step3.png)

次にassign（誰に割り当てられたタスクなのか）を選択しましょう。今回は自分を選択します。

![GitHub Clone](images/ph1-idd-step4.png)
これでissueの作成は完了です！

## 3. issueに準拠したブランチを作成する

ここで重要なのが作成した後、issueに対してIDが割り振られてることです。
このIDをブランチ作成する際に「feature/1」や「issue/1」と名称を設定してください。

```text
補足
ブランチは基本的にmainからdevelop、developからfeature/1、のようにして切りましょう！
```

これでチーム全体の認識として `feature/1` = `issue番号1` のタスクの実装が行われているのだと分かるようになりました！

このタスクのゴールは「ヘッダーの作成」までなので、ヘッダーが完了出来次第git add, git commit, git pushを行い、リモートへ反映させましょう！

反映後はGitHubにてPRを作成し、LGTM（承認）をもらい次第親ブランチへマージします。
issueもcloseすることでメンバーにタスクが終了したことを認識してもらえますよ！（この辺りの反映の話は[Level 2 テキスト](https://github.com/posse-ap/curriculum/blob/main/PH1/PH1_Git_GitHub_Level_2.md#github-%E3%81%AB-push-%E3%81%99%E3%82%8B)に説明を譲ることとします）

```text
親ブランチとは作業ブランチをどこから作成したかによって変わります。
例えば、developブランチから作業ブランチを作成した場合、親ブランチはdevelopブランチです！
```

１つのタスクが完了したら、次のissueを作成し同じ手順を繰り返していきましょう！

![GitHub Clone](images/ph1-idd-loop.png)

## 4. 擬似issue駆動開発を体験する

これまで学習した手順に沿ってissue駆動開発を体験してみましょう！
以下のレポジトリをcloneして、Readme.mdを参考に進めてください！

[擬似issue駆動開発のレポジトリ](https://github.com/posse-ap/ph1-idd-sample)

## 最後に

実際に運用していくとコンフリクトなど想定外が沢山起きると思いますが、[Level 2 テキスト](https://github.com/posse-ap/curriculum/blob/main/PH1/PH1_Git_GitHub_Level_2.md#4-%E3%82%B3%E3%83%B3%E3%83%95%E3%83%AA%E3%82%AF%E3%83%88)を参考に落ち着いて対処しましょう。

少し古いですが、一連の流れを説明した[動画](https://drive.google.com/file/d/1FJoebGx2hFcIhakn7SLo4YX8YQqlWp-h/view?usp=drive_link)も参考になるので見ておきましょう。

```text
動画ではProject管理などカリキュラムで取り扱っていない話題も出ます。
新人ハッカソンでは扱うissue駆動開発は勝手が違う可能性があるので、運営に確認しましょう。
```
