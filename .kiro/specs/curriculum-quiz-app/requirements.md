# Requirements Document

## Introduction

POSSE のカリキュラム（`documents/week3.md`〜`week6.md`）と同期した一問一答アプリを、React Native (Expo SDK 54 / Expo Router) の単一コードベースで実装し、PWA として Web に配信する。

本アプリが解決する課題は2つある。

1. **ミニドリルが重すぎる・アウトプット機会が不足している** — 3〜10問の小さなセッションに細分化したクイズで、短時間の成功体験を反復できるようにする。
2. **専門用語が分からず解説が読めない** — カリキュラム用語に限定した用語辞書と反復確認を搭載し、解説を読める状態まで語彙を底上げする。

本スペックはデモ開発を前提とする。week3〜week6 の教材・Question_Item・Term_Entry は、認証なしの外部教材API（デモ用バックエンド）が管理する動的データとして提供する。Quiz_App は教材APIからカタログを取得してメモリ上で利用し、正常取得したカタログを端末内キャッシュへ保存する。学習進捗は端末内にのみ保存し、教材APIへ送信しない。

## Glossary

- **Learner**: 本アプリの利用者（POSSE 受講生）
- **Quiz_App**: 本アプリ全体。Expo Router によるルーティングを持つ React Native / Web アプリケーション
- **Content_API**: 教材カタログを HTTPS の REST/JSON API として提供する認証なしのデモ用API。APIの具体的な実装技術は本スペックでは定めない
- **API_Response**: Content_API が返す教材カタログのJSON応答。カタログ本体と schemaVersion、contentVersion、取得日時相当のメタデータを含む
- **Content_Catalog**: Content_API または Content_Cache から読み込んでメモリ上で利用する教材カタログ。Question_Item・Term_Entryを保持し、今回のUIでは `week3`〜`week6` を対象とする
- **Content_Cache**: 直近に正常検証・取得した API_Response の教材データを端末内に保存するデータキャッシュ。PWA_Shell のアプリ資材キャッシュおよび Progress_Snapshot の保存領域とは分離する
- **API_Version**: Content_API のエンドポイント互換性を識別するバージョン。APIパスまたは環境設定で指定する
- **Sync_State**: 教材カタログの取得状態。未取得、取得中、最新、更新済み、キャッシュ利用中、エラーを含む
- **Content_Repository**: Content_API 上で教材・Question_Item・Term_Entryの作成、更新、非公開、削除を管理する教材データ管理領域。本スペックでは管理UIや運用方式を定めない
- **Week_Unit**: 教材1週分の単位。デモAPIの初期データでは `week3`、`week4`、`week5`、`week6` の4件。API追加により将来週を配信できる
- **Question_Item**: 1問分のデータ。安定した識別子、出題形式、問題文、選択肢、正解、解説、Source_Reference を持つ。階層は Curriculum_Phase → Week_Unit の2段とし、Week_Unit 直下に属する
- **Source_Reference**: 出典情報。Week_Unit 番号と教材内のセクション見出しの組
- **Question_Format**: Question_Item の出題形式。4択選択、正誤判定、バグ診断、穴埋めの4種
- **Session_Manager**: Quiz_Session の生成・進行・終了を制御する構成要素
- **Quiz_Session**: 1回の学習単位。指定された出題範囲から選ばれた Question_Item の並び
- **Answer_Judge**: Learner の解答の正誤を判定する構成要素
- **Feedback_View**: 正誤判定と解説を表示する画面
- **Streak_Counter**: 連続正解数を保持するカウンタ
- **Review_Queue**: 誤答した Question_Item を保持する復習待ち行列
- **Progress_Store**: 学習進捗の保存と復元を担う構成要素
- **Progress_Snapshot**: Progress_Store が永続化する進捗データ構造。週別成績、Review_Queue、Streak_Counter、スキーマ版番号を含む
- **Glossary_Module**: 用語辞書機能
- **Term_Entry**: 用語1件のデータ。安定した識別子、用語名、意味の説明、教材上の使用例、Source_Reference、関連用語名を持つ
- **PWA_Shell**: Web 配信時のアプリ外殻。Web アプリマニフェスト、アプリ資材用Service Workerキャッシュ、レスポンシブレイアウトを含む
- **Local_Storage**: 端末内の永続化領域（Web では localStorage、ネイティブでは同等のキー値ストア）

## Requirements

### Requirement 1: API管理の教材カタログ

**User Story:** As a Learner, I want 教材APIから教材と対応の取れた問題を利用したい, so that アプリで解いた内容がそのまま週のカリキュラム理解につながる

#### Acceptance Criteria

1. THE Content_API SHALL HTTPS の REST/JSON API として API_Response を提供し、API_Response に Content_Catalog、schemaVersion、contentVersion、取得日時相当のメタデータを含める
2. THE Quiz_App SHALL API_Version と本番用または開発用の Content_API の Base URL を環境変数等の実行環境設定で切り替えられる状態とし、教材APIの認証情報を要求しないデモとして動作する
3. WHEN Quiz_App が Content_API から API_Response を取得する、THE Quiz_App SHALL API_Response 全体を利用前に検証し、schemaVersion、contentVersion、メタデータ、Week_Unit、Question_Item、Term_Entry、および各参照関係が要件に適合した場合のみ Content_Catalog としてメモリ上で利用する
4. THE API_Response SHALL デモAPIの初期データとして `week3`、`week4`、`week5`、`week6` の4件の Week_Unit を含み、THE Quiz_App SHALL 今回のUIで表示・出題・辞書分類する Week_Unit をこの4件に限定する
5. THE Content_Catalog SHALL 各 Question_Item を1件の Week_Unit に直接所属させ、Week_Unit と Question_Item の間に中間の階層を持たない
6. THE Content_Catalog SHALL 各 Week_Unit に対し10件以上60件以下の Question_Item を保持する
7. THE Content_Catalog SHALL 各 Question_Item に、Content_Catalog 全体で安定かつ一意な識別子、所属 Week_Unit の安定した識別子、Question_Format、問題文、選択肢、正解、解説文（空白を除いて20文字以上400文字以下）、Source_Reference（Week_Unit 番号と、当該 Week_Unit の教材に実在するセクション見出しの組）を保持する
8. THE Content_Catalog SHALL 各 Week_Unit と各 Term_Entry に Content_Catalog 全体で安定かつ一意な識別子を保持し、Content_Repository が教材更新や並び順変更を行っても既存データの識別子を再利用して別の対象を表さない
9. THE Content_Catalog SHALL 各 Week_Unit に対し、当該教材の誤りやすい点を扱う節（見出しに「よくある間違い」を含む節、または当該節を持たない Week_Unit ではミニドリルのバグ診断問題）を Source_Reference に持つ Question_Item を2件以上保持する
10. IF Question_Item の解説文または Source_Reference が未設定、空文字列、または空白文字のみである、THEN THE Quiz_App SHALL API_Response 全体を不正として利用せず、直近の正常な Content_Cache がある場合は当該キャッシュへフォールバックし、ない場合は再試行導線付きのエラーを表示する
11. IF Question_Item の所属 Week_Unit 識別子が Content_Catalog のいずれの Week_Unit の識別子とも一致しない、THEN THE Quiz_App SHALL API_Response 全体を不正として利用せず、直近の正常な Content_Cache がある場合は当該キャッシュへフォールバックし、ない場合は再試行導線付きのエラーを表示し、問題識別子を開発者向けログに出力する
12. IF API_Response に非公開または削除済みを示すフラグが付いた Week_Unit、Question_Item、または Term_Entry が含まれる、THEN THE Quiz_App SHALL 当該データを出題対象および辞書表示対象から除外する
13. THE Content_Catalog SHALL 各 Question_Item の Question_Format を4択選択、正誤判定、バグ診断、穴埋めのいずれか1件とし、これら以外の値を保持しない
14. IF Question_Item の Question_Format に必要な選択肢件数（4択選択：4件、正誤判定：2件、バグ診断：4件、候補選択の穴埋め：4件）を満たさない、または正解が1件でない、THEN THE Quiz_App SHALL API_Response 全体を不正として利用せず、直近の正常な Content_Cache がある場合は当該キャッシュへフォールバックし、ない場合は再試行導線付きのエラーを表示し、問題識別子を開発者向けログに出力する
15. IF Content_API への接続、JSON解析、またはAPI_Responseの取得が設定されたタイムアウト以内に完了しない、THEN THE Quiz_App SHALL 当該取得を失敗として扱い、直近の正常な Content_Cache がある場合は当該キャッシュを利用し、ない場合は再試行導線付きのエラーを表示する
16. THE Quiz_App SHALL Content_API から取得して検証に成功した Content_Catalog をメモリ上で利用し、同一 contentVersion の API_Response を再取得した場合は教材データを Content_Cache に再保存しない
17. WHERE Content_API が `week7` 以降の Week_Unit を追加提供する、THE Quiz_App SHALL APIから追加データを取得できる構造を維持しつつ、今回のUIで表示・出題・辞書分類の対象とする Week_Unit を `week3`、`week4`、`week5`、`week6` に限定する

### Requirement 2: 週単位の出題範囲選択

**User Story:** As a Learner, I want 学習中の週だけを選んで出題してほしい, so that 今週の課題に直結した範囲だけを短時間で練習できる

#### Acceptance Criteria

1. WHEN Learner がホーム画面を開く、THE Quiz_App SHALL `week3`、`week4`、`week5`、`week6` の4件の Week_Unit を週番号の昇順で、各 Week_Unit の出題可能な Question_Item 件数と正答率（0以上100以下の整数パーセント、出題数が0件の場合は「未学習」）とともに、画面遷移から500ミリ秒以内に一覧表示する
2. WHEN Learner が Week_Unit を選択する、THE Quiz_App SHALL 当該 Week_Unit の出題可能な Question_Item 件数と Week_Unit 別正答率（0以上100以下の整数パーセント、出題数が0件の場合は「未学習」）を、選択操作から500ミリ秒以内に表示する
3. WHEN Learner が Week_Unit を選択して開始操作を行う、THE Session_Manager SHALL 当該 Week_Unit に属し、かつ出題対象から除外されていない Question_Item のみから Quiz_Session を生成し、最初の Question_Item を開始操作から1秒以内に表示する
4. WHERE 複数 Week_Unit の横断出題が選択されている、THE Session_Manager SHALL 選択された2件以上4件以下の Week_Unit に属し、かつ出題対象から除外されていない Question_Item を出題範囲とし、同一 Question_Item を出題範囲内で重複させない
5. IF 選択された出題範囲に出題可能な Question_Item が0件である、THEN THE Quiz_App SHALL Quiz_Session を生成せず、当該範囲に出題可能な問題が存在しないことを示すメッセージと範囲選択画面への戻り操作を表示し、直前の選択状態を保持する
6. WHEN Learner が Week_Unit の選択または選択解除を行う、THE Quiz_App SHALL 選択中の Week_Unit 件数と、現在の出題範囲に含まれる出題可能な Question_Item の件数を更新して表示する
7. IF 横断出題で Week_Unit が1件も選択されていない状態で開始操作が行われる、THEN THE Quiz_App SHALL Quiz_Session を生成せず、Week_Unit の選択が1件以上必要であることを示すメッセージを表示し、範囲選択画面の選択状態を保持する
8. WHEN Learner が Quiz_Session または結果画面から範囲選択画面に戻る操作を行う、THE Quiz_App SHALL 直前に選択されていた Week_Unit と問題数の選択状態を復元して表示する

### Requirement 3: 小さなセッション構成と成功体験の反復

**User Story:** As a Learner, I want 数分で終わる小さなセッションで区切って学習したい, so that ミニドリルより低い負荷で反復し、完了できたという実感を積み上げられる

#### Acceptance Criteria

1. WHEN Quiz_Session の生成が要求され、かつ Learner による1セッションの問題数設定が存在しない、THE Session_Manager SHALL 5件の Question_Item で Quiz_Session を構成する
2. WHERE Learner が1セッションの問題数を3問、5問、10問のいずれかに設定している、WHEN Quiz_Session の生成が要求される、THE Session_Manager SHALL 当該設定値と同数の Question_Item で Quiz_Session を構成する
3. IF 出題範囲の出題可能な Question_Item 件数が1件以上かつ設定問題数を下回る、THEN THE Session_Manager SHALL 出題可能な Question_Item 全件で Quiz_Session を構成し、当該件数を当該 Quiz_Session の総問題数とする
4. THE Session_Manager SHALL 1つの Quiz_Session に同一の Question_Item を重複して含めず、各 Question_Item を1回だけ出題する
5. WHILE Quiz_Session が進行中である、THE Quiz_App SHALL 1以上かつ総問題数以下の現在の問題番号、当該 Quiz_Session の総問題数、および0以上かつ解答済み件数以下の現在の正解数を画面上に表示する
6. WHEN Learner が Quiz_Session の最終問題の解説を閉じる、THE Quiz_App SHALL 正解数、総問題数、最初の Question_Item を表示した時点から最終問題の解説を閉じた時点までの所要時間を分と秒で示した値、および誤答した Question_Item の問題文を重複なく列挙した一覧を含む結果画面を表示する
7. WHEN 結果画面が表示される、THE Quiz_App SHALL 直前の Quiz_Session と同一の出題範囲および同一の問題数での再挑戦、復習セッションの開始、ホームへの復帰の3つの操作を提供する
8. WHEN Quiz_Session の正解数が当該 Quiz_Session の総問題数と一致する、THE Quiz_App SHALL 全問正解であることを示す表示を結果画面に追加する
9. WHEN Learner が Quiz_Session の中断操作を確定する、THE Progress_Store SHALL 中断時点で解答済みの Question_Item の判定結果を保存する
10. IF Quiz_Session の生成時に参照した問題数設定値が3、5、10のいずれでもない、THEN THE Session_Manager SHALL 当該設定値を破棄し、5件の Question_Item で Quiz_Session を構成する
11. IF 結果画面の表示時に Review_Queue の復習対象が0件である、THEN THE Quiz_App SHALL 復習セッションの開始操作を無効状態で表示する
12. IF Quiz_Session が最終問題の解答確定前に中断される、THEN THE Progress_Store SHALL 未解答の Question_Item を Week_Unit 別の出題数と正解数のいずれにも加算しない

### Requirement 4: 出題形式のバリエーション

**User Story:** As a Learner, I want 4択だけでなくバグ診断や穴埋めでも問われたい, so that 教材のミニドリルと同じ形で知識を使う練習ができる

#### Acceptance Criteria

1. THE Quiz_App SHALL 4択選択、正誤判定、バグ診断、穴埋めの4種の Question_Format すべてについて、当該 Question_Format に対応する解答画面を表示する
2. WHEN 4択選択形式の Question_Item を表示する、THE Quiz_App SHALL 相互に文字列が重複しない4件の選択肢を表示し、そのうち正解を1件のみ含める
3. WHEN 正誤判定形式の Question_Item を表示する、THE Quiz_App SHALL 「正しい」「誤り」の2件の選択肢をこの順序で表示し、そのうち正解を1件のみ含める
4. WHEN バグ診断形式の Question_Item を表示する、THE Quiz_App SHALL 1行以上20行以下のコードを等幅フォントのコードブロックで表示し、コードブロック内の1行が表示幅を超える場合は当該コードブロック内の横方向スクロールで全文を参照可能とし、誤りの箇所を特定する相互に重複しない4件の選択肢のうち正解を1件のみ含めて表示する
5. WHEN 穴埋め形式の Question_Item を表示する、THE Quiz_App SHALL 空欄を1件だけ含むコードまたは文を表示し、空欄に入る候補として相互に重複しない4件の選択肢のうち正解を1件のみ含めて表示する
6. WHERE 穴埋め形式が語句の自由入力を受け付ける、THE Answer_Judge SHALL 入力文字列の先頭と末尾の半角空白、全角空白、タブ、改行を除去したうえで、英字の大文字小文字を区別して正解文字列と完全一致で比較する
7. THE Content_Catalog SHALL 各 Week_Unit に対しバグ診断形式の Question_Item を1件以上、穴埋め形式の Question_Item を1件以上保持する
8. WHEN 4択選択形式、バグ診断形式、または候補選択の穴埋め形式の Question_Item を Quiz_Session 内で初めて表示する、THE Quiz_App SHALL 選択肢の表示順を無作為に並べ替え、同一 Quiz_Session 内で同一 Question_Item を再表示する場合は同じ表示順を維持する
9. WHILE 選択肢が未選択である、または自由入力欄が空文字もしくは空白文字のみである、THE Quiz_App SHALL 解答確定操作を、操作を受け付けない無効状態として表示する
10. WHEN 出題範囲に4択選択以外の Question_Format の Question_Item が1件以上存在し、かつ Quiz_Session の問題数が5問以上である、THE Session_Manager SHALL 当該 Quiz_Session に4択選択以外の Question_Format の Question_Item を1件以上含める
11. IF Question_Item の Question_Format に必要な選択肢件数（4択選択：4件、正誤判定：2件、バグ診断：4件、候補選択の穴埋め：4件）を満たさない、または正解が1件でない、THEN THE Quiz_App SHALL API_Response 全体を不正として利用せず、直近の正常な Content_Cache がある場合は当該キャッシュへフォールバックし、ない場合は再試行導線付きのエラーを表示し、問題識別子を開発者向けログに出力する
12. WHERE 穴埋め形式が語句の自由入力を受け付ける、THE Quiz_App SHALL 自由入力欄に入力可能な文字数を64文字以下に制限する

### Requirement 5: 即時フィードバックと教材に裏付けられた解説

**User Story:** As a Learner, I want 解答直後に理由と出典付きの解説を読みたい, so that 間違いをその場で理解し、教材の該当箇所に戻れる

#### Acceptance Criteria

1. WHEN Learner が解答を確定する、THE Answer_Judge SHALL 確定操作から1秒以内に当該解答の正誤を「正解」または「誤り」のいずれか1つとして判定する
2. WHEN Answer_Judge が正誤を判定する、THE Feedback_View SHALL 判定完了から1秒以内に、画面遷移を伴わず問題文と同一画面上に判定結果を表示する
3. WHEN Feedback_View を表示する、THE Feedback_View SHALL 正解の選択肢の内容、解説文の全文（省略・切り詰めなし、画面に収まらない場合はスクロールで到達可能）、Source_Reference（Week_Unit 表示名とセクション見出しを「引用：Week03「見出し」」の形で1行に示す）の3項目をすべて表示する
4. WHEN 解答が誤りと判定される、THE Feedback_View SHALL Learner が選択した選択肢に対応する誤り理由の文を、正解の内容とは区別できる位置に表示する
5. WHILE Feedback_View を表示中、THE Quiz_App SHALL 当該 Question_Item の解答操作（選択肢の選択および解答確定）を操作不可状態で表示し、当該 Question_Item への再解答を受け付けず、確定済みの判定結果を保持する
6. WHILE 当該 Quiz_Session に未出題の Question_Item が1件以上残っている、WHEN Learner が Feedback_View の「次へ」操作を行う、THE Session_Manager SHALL 操作から1秒以内に Feedback_View を閉じ、次の Question_Item を表示する
7. THE Feedback_View SHALL 解説文中に出現する文字列のうち Term_Entry の用語名と英字の大文字小文字を区別せず完全一致するものについて、各用語名の最初の出現箇所1件に対して対応する Term_Entry への遷移操作を提供する
8. IF 解説文中の用語名に対応する Term_Entry が存在しない、THEN THE Feedback_View SHALL 当該用語名を遷移操作なしの通常テキストとして表示する
9. WHEN Learner が Feedback_View で「あいまい」を申告する、THE Review_Queue SHALL 当該 Question_Item を復習対象として追加し、当該 Question_Item が既に復習対象である場合は登録件数を変化させない
10. IF Learner が選択した選択肢に対応する誤り理由の文が Content_Catalog に存在しない、THEN THE Feedback_View SHALL 誤り理由の表示領域を設けず、正解の選択肢の内容と解説文の全文を表示する
11. WHEN Learner が Quiz_Session の最終 Question_Item の Feedback_View で「次へ」操作を行う、THE Session_Manager SHALL 当該 Quiz_Session を終了し、結果画面へ遷移する
12. WHEN Review_Queue が「あいまい」申告による追加を完了する、THE Feedback_View SHALL 申告が受理されたことを示す表示を行い、当該 Question_Item に対する「あいまい」申告操作を操作不可状態で表示する

### Requirement 6: 進捗表示とストリーク

**User Story:** As a Learner, I want 連続正解と週ごとの到達度を見たい, so that 小さな前進が可視化され、次のセッションに進む動機になる

#### Acceptance Criteria

1. WHEN Answer_Judge が解答を正解と判定する、THE Streak_Counter SHALL 連続正解数を1増加させ、増加後の値が999を超える場合は999とする
2. WHEN Answer_Judge が解答を誤りと判定する、THE Streak_Counter SHALL 連続正解数を0に設定する
3. WHILE 連続正解数が3以上である、THE Quiz_App SHALL 連続正解数の数値と、連続正解中であることを示す記号およびテキストからなるラベルを表示する
4. THE Progress_Store SHALL 各 Week_Unit について、0以上の整数である出題数、0以上かつ出題数以下の整数である正解数、および最後に解答が確定した日時（年月日および時刻）を保持する
5. WHEN Learner がホーム画面を開く、THE Quiz_App SHALL 各 Week_Unit の正答率を、正解数を出題数で除した百分率の小数第1位を四捨五入した0以上100以下の整数パーセントで表示する
6. IF Week_Unit の出題数が0件である、THEN THE Quiz_App SHALL 当該 Week_Unit の正答率に代えて「未学習」を表示する
7. THE Streak_Counter SHALL 連続正解数を0以上999以下の整数として保持し、Quiz_Session の開始および終了によって当該値を初期化しない
8. THE Progress_Store SHALL 学習記録が存在しない Week_Unit について、出題数0、正解数0、最終学習日時なしを初期値として保持する

### Requirement 7: 間違えた問題の復習キュー

**User Story:** As a Learner, I want 間違えた問題だけをあとでまとめて解き直したい, so that 弱点を放置せず定着させられる

#### Acceptance Criteria

1. WHILE 当該 Question_Item が Review_Queue に登録されていない、WHEN 解答が誤りと判定される、THE Review_Queue SHALL 当該 Question_Item を、誤答回数1、連続正解回数0、最終誤答日時を当該判定時刻として復習対象に追加する
2. WHEN Review_Queue に既に登録されている Question_Item が誤答される、THE Review_Queue SHALL 当該復習対象の誤答回数を1増加させ（上限99）、Review_Queue の登録件数を変化させない
3. THE Review_Queue SHALL 各復習対象について、Question_Item の識別子、所属 Week_Unit、誤答回数（1以上99以下の整数）、連続正解回数（0以上2以下の整数）、最終誤答日時を保持する
4. WHILE Review_Queue に1件以上の復習対象が存在する、WHEN Learner が復習セッションを開始する、THE Session_Manager SHALL 誤答回数の降順（誤答回数が同一の場合は最終誤答日時の新しい順）に並べた復習対象から、1セッションの設定問題数（既定5問、設定時は3問・5問・10問のいずれか）を上限として Quiz_Session を生成する
5. WHEN 復習対象の連続正解回数が2に達する、THE Review_Queue SHALL 当該復習対象を Review_Queue から除外し、登録件数を1減少させる
6. WHEN Learner が復習画面を開く、THE Quiz_App SHALL 復習対象の総件数を0以上の整数で表示し、4件の Week_Unit ごとの復習対象件数をそれぞれ0以上の整数で表示する
7. IF Review_Queue の登録件数が0件である、THEN THE Quiz_App SHALL 復習セッションを生成せず、復習画面に「復習待ちの問題はありません」というメッセージと週選択への遷移操作を表示する
8. WHEN Review_Queue に登録されている復習対象の Question_Item が誤答される、THE Review_Queue SHALL 当該復習対象の最終誤答日時を当該判定時刻に更新し、連続正解回数を0に設定する
9. WHEN Review_Queue に登録されている復習対象の Question_Item が正解と判定される、THE Review_Queue SHALL 当該復習対象の連続正解回数を1増加させ、誤答回数を変化させない
10. IF Review_Queue の登録件数が上限200件に達している状態で Review_Queue に未登録の Question_Item が誤答される、THEN THE Review_Queue SHALL 最終誤答日時が最も古い復習対象を1件除外したうえで当該 Question_Item を復習対象に追加する

### Requirement 8: カリキュラム用語辞書

**User Story:** As a Learner, I want 教材に出てくる用語の意味と使われ方をすぐ引きたい, so that 解説が読めるようになり、学習が止まらない

#### Acceptance Criteria

1. THE Glossary_Module SHALL week3〜week6 の教材で使用される用語を Term_Entry として合計30件以上保持し、各 Week_Unit に対し5件以上を割り当てる
2. THE Term_Entry SHALL 1文字以上40文字以下の用語名、20文字以上200文字以下の意味の説明、1件以上3件以下の教材上の使用例、1件の Source_Reference、0件以上5件以下の関連用語名を保持する
3. WHEN Learner が用語一覧を開く、THE Glossary_Module SHALL Term_Entry を Week_Unit 番号の昇順に区分し、各区分内では用語名の昇順で、各区分の見出しに当該区分の件数を付して表示する
4. WHEN Learner が1文字以上50文字以下の検索文字列を入力する、THE Glossary_Module SHALL 前後の空白を除去した当該文字列を用語名または意味の説明に部分一致で含む Term_Entry のみを、入力から1秒以内に表示する
5. WHEN Learner が検索文字列を入力する、THE Glossary_Module SHALL 英字の大文字小文字を区別せずに照合する
6. IF 検索文字列に一致する Term_Entry が0件である、THEN THE Glossary_Module SHALL 「一致する用語がありません」というメッセージと検索文字列の消去操作を表示し、入力された検索文字列を保持する
7. WHEN Learner が Term_Entry を選択する、THE Glossary_Module SHALL 当該 Term_Entry の意味の説明、教材上の使用例、Source_Reference（Week_Unit 番号とセクション見出し）、および関連用語名ごとの遷移操作を表示する
8. THE Glossary_Module SHALL 用語名から意味の説明を選ぶ4択形式の用語確認セッションを1セッション5問で提供し、各問題の選択肢を正解の Term_Entry の意味の説明1件と他の Term_Entry の意味の説明3件で構成する
9. WHEN 用語確認セッションで誤答が発生する、THE Review_Queue SHALL 当該 Term_Entry に対応する問題を誤答回数1および最終誤答日時とともに復習対象として追加し、当該問題が既に Review_Queue に存在する場合は誤答回数を1増加させて登録件数を変化させない
10. WHEN Learner が Feedback_View から Term_Entry に遷移した後に戻る操作を行う、THE Quiz_App SHALL 中断した Quiz_Session を、遷移前と同じ問題番号、同じ正解数、同じ Feedback_View 表示状態から再開する
11. IF 検索文字列が空文字または空白のみである、THEN THE Glossary_Module SHALL 絞り込みを行わず、全 Term_Entry を Week_Unit ごとの分類表示に戻す
12. IF 選択された Term_Entry の関連用語名に対応する Term_Entry が存在しない、THEN THE Glossary_Module SHALL 当該関連用語名を遷移操作なしの通常テキストとして表示する
13. IF 用語確認セッションの出題対象 Term_Entry が4件未満である、THEN THE Glossary_Module SHALL セッションを開始せず、出題可能な用語が不足していることを示すメッセージと用語一覧への戻り操作を表示する

### Requirement 9: 学習進捗の永続化、教材APIキャッシュと同期

**User Story:** As a Learner, I want アプリを閉じても進捗が残り、教材APIに接続できないときも直近の教材で学習したい, so that 通学中などの細切れの時間に継続して使える

#### Acceptance Criteria

1. WHEN Learner が解答を確定する、THE Progress_Store SHALL 当該解答の判定結果を反映した Progress_Snapshot を、判定結果の表示から1秒以内に Local_Storage に保存する
2. WHEN Quiz_Session が終了する、THE Progress_Store SHALL 週別成績、Review_Queue、Streak_Counter、スキーマ版番号の4項目すべてを含む Progress_Snapshot を、結果画面の表示から1秒以内に Local_Storage に保存する
3. WHEN Quiz_App が起動する、THE Progress_Store SHALL Local_Storage から Progress_Snapshot を読み出し、起動から2秒以内に復元処理を完了する
4. WHEN Progress_Store が Progress_Snapshot の復元を完了する、THE Quiz_App SHALL 復元した週別成績の正答率を0以上100以下の整数パーセントでホーム画面の進捗表示に反映する
5. THE Progress_Store SHALL 任意の Progress_Snapshot を JSON 文字列に直列化する機能を提供し、週別成績、Review_Queue、Streak_Counter、スキーマ版番号を欠落なく含める
6. THE Progress_Store SHALL JSON 文字列から Progress_Snapshot を復元する機能を提供し、JSON として解析できない場合、または上記5項目のいずれかが欠落もしくは想定の型・範囲に適合しない場合は復元不能として扱う
7. FOR ALL 有効な Progress_Snapshot（週別成績が対応 Week_Unit 件数分を持ち、Review_Queue が0件以上500件以下、Streak_Counter が0以上9999以下の整数、各出題数・正解数が0以上99999以下の整数かつ正解数が出題数以下）、直列化してから復元した結果 SHALL 元の Progress_Snapshot と全項目の値および Review_Queue の並び順において一致し、かつ当該復元結果を再度直列化した JSON 文字列 SHALL 1回目の直列化結果と一致する（ラウンドトリップ特性）
8. THE Progress_Snapshot SHALL 1以上の整数であるスキーマ版番号を1件含む
9. IF Local_Storage に Progress_Snapshot が存在するが復元不能である、THEN THE Progress_Store SHALL 初期状態の Progress_Snapshot を生成して Local_Storage に保存し、「学習記録を初期化しました」というメッセージを表示し、復元不能であった内容を復元対象として再利用しない
10. IF Local_Storage の Progress_Snapshot のスキーマ版番号が現行版と異なる（現行版より小さい場合と大きい場合の双方を含む）、THEN THE Progress_Store SHALL 初期状態の Progress_Snapshot を生成して Local_Storage に保存し、「学習記録を初期化しました」というメッセージを表示する
11. WHILE ネットワークが未接続であり、Content_Cache に直近の正常な API_Response が存在する、THE Quiz_App SHALL Content_Cache から Content_Catalog を読み出し、出題、解答判定、解説表示、用語辞書の閲覧と検索、および Progress_Snapshot の Local_Storage への保存と復元を、ネットワーク接続を促すエラー表示なしに提供する
12. WHEN Learner が学習記録の削除操作を確認する、THE Progress_Store SHALL Local_Storage の Progress_Snapshot を初期状態（全 Week_Unit の出題数0および正解数0、Review_Queue 0件、Streak_Counter 0、現行スキーマ版番号）に戻し、1秒以内にホーム画面の進捗表示を未学習の状態に更新する
13. IF Local_Storage に Progress_Snapshot が存在しない、THE Progress_Store SHALL 初期状態の Progress_Snapshot を生成し、初期化を示すメッセージを表示せずに Quiz_App の全機能を利用可能とする
14. IF Local_Storage への Progress_Snapshot の保存が失敗する、THEN THE Progress_Store SHALL 直前に保持していた Progress_Snapshot をメモリ上に保持したまま Quiz_Session の進行を継続し、学習記録を保存できなかったことを示すメッセージを表示し、Local_Storage 上の既存の Progress_Snapshot を破棄しない
15. IF Learner が学習記録の削除操作を取り消す、THEN THE Progress_Store SHALL Local_Storage の Progress_Snapshot を変更しない
16. WHEN Content_API から取得した API_Response 全体の検証が成功する、THE Quiz_App SHALL contentVersion、schemaVersion、取得日時相当のメタデータとともに当該 API_Response を Content_Cache に保存し、Content_Catalog をメモリ上の利用データとして更新する
17. WHEN Quiz_App が起動する、THE Quiz_App SHALL 利用可能な Content_Cache がある場合は当該キャッシュの Content_Catalog を表示・利用しながら、UI操作をブロックせずに Content_API へ更新確認を開始する
18. WHEN Content_API から Content_Catalog の新版を取得し全体検証が成功する、THE Quiz_App SHALL 新しい API_Response を Content_Cache に原子的に保存してからメモリ上の Content_Catalog を新版へ切り替え、切り替え完了後に旧版の教材キャッシュを破棄する
19. WHEN Content_API への接続、JSON解析、検証、または Content_Cache の更新に失敗する、THE Quiz_App SHALL 直近の正常な Content_Cache を保持してその Content_Catalog を利用し、現在の Sync_State をキャッシュ利用中またはエラーとして表示する
20. IF Quiz_App の初回教材取得で Content_API から取得できず Content_Cache も存在しない、THEN THE Quiz_App SHALL クイズと辞書を開始せず、再試行操作を含む教材取得エラーを表示する
21. WHEN Content_API の更新確認結果が現行の API_Version と contentVersion に一致する、THE Quiz_App SHALL Content_Catalog 全体を再取得せず、Content_Cache の再保存およびメモリ上の教材切り替えを行わない
22. WHEN Content_API が現行 contentVersion より新しい API_Response を返し、かつ検証に成功する、THE Quiz_App SHALL Quiz_App の再起動なしに新しい Content_Catalog を出題範囲選択画面、出題画面、辞書画面へ反映し、進行中の Quiz_Session が参照する Question_Item と Feedback_View の内容をセッション開始時点のデータから変更しない
23. THE Content_Cache SHALL Progress_Snapshot、Review_Queue、Streak_Counter を保存する学習進捗領域と別のキーまたはデータストアで管理し、教材APIの更新・削除・初期化によって学習進捗を削除または上書きしない
24. IF 新版 API_Response に非公開または削除済みの Question_Item または Term_Entry が含まれる、THEN THE Quiz_App SHALL 新版へ切り替えた後に当該データを新規の出題対象または辞書表示対象へ含めず、既存の Review_Queue に識別子が残る場合は当該復習対象を利用不能として安全に扱い、他の対象の利用を継続する
25. IF API更新中に Week_Unit、Question_Item、または Term_Entry の安定した識別子が既存 Content_Catalog と同一の対象を表さない値へ変更される、THEN THE Quiz_App SHALL 当該 API_Response 全体を不正として利用せず、直近の正常な Content_Cache へフォールバックする
26. THE Quiz_App SHALL Content_API の取得、検証、Content_Cache の保存、メモリ上の切り替え、および失敗時のフォールバックの状態を Sync_State として管理し、利用可能な状態をUIへ反映する
27. WHEN Learner が教材APIの再試行操作を行う、THE Quiz_App SHALL 設定されたタイムアウトと検証規則を適用して Content_API の取得を再実行し、取得成功時は Content_Cache とメモリ上の Content_Catalog を更新する
28. THE Progress_Store SHALL Progress_Snapshot、Review_Queue、Streak_CounterをContent_APIへ送信せず、学習進捗の読み取り先および書き込み先をLocal_Storageに限定する

### Requirement 10: PWA としての配信とレスポンシブ表示

**User Story:** As a Learner, I want スマホのホーム画面に置いてアプリのように開きたい, so that ブラウザでURLを探す手間なく反復学習に入れる

#### Acceptance Criteria

1. WHEN Learner が対応ブラウザ（Web アプリマニフェストとサービスワーカー登録の両方をサポートするブラウザ）で Quiz_App の URL を開く、THE PWA_Shell SHALL 10秒以内に Quiz_App の初期画面を操作可能な状態で表示する
2. THE PWA_Shell SHALL アプリ名（1文字以上30文字以下）、短縮名（1文字以上12文字以下）、192×192ピクセルおよび512×512ピクセルのアイコン、表示モード `standalone`、テーマ色、背景色の6項目すべてを含む Web アプリマニフェストを配信する
3. WHEN 対応ブラウザで Quiz_App を開く、THE PWA_Shell SHALL ブラウザのインストール要件を満たした状態を提示し、Learner がホーム画面への追加を完了できる状態とする
4. IF ブラウザがマニフェストまたはサービスワーカー登録の少なくとも一方をサポートしない、THEN THE PWA_Shell SHALL インストール導線を提示せず、Quiz_App の全機能を通常のブラウザタブ内で継続提供する
5. WHEN ビューポート幅が320ピクセル以上767ピクセル以下である、THE Quiz_App SHALL 1カラムでコンテンツを表示し、水平方向のオーバーフローを0ピクセルとする（横スクロールバーおよび横スワイプによる移動が発生しない）
6. WHEN ビューポート幅が1024ピクセル以上である、THE Quiz_App SHALL コンテンツ幅を最大960ピクセルに制限し、左右余白の差を8ピクセル以内として水平方向中央に配置する
7. WHEN 表示中にビューポート幅が上記の区分（320〜767／768〜1023／1024以上）をまたいで変化する、THE Quiz_App SHALL ページの再読み込みなしに1秒以内で該当区分のレイアウトを適用し、入力途中の解答選択状態を保持する
8. WHILE ネットワークが未接続である、WHEN 2回目以降の起動が行われる、THE PWA_Shell SHALL Service Worker が保持するアプリ資材キャッシュから5秒以内に Quiz_App を起動し、Content_Cache が存在する場合は教材APIへ接続せず当該キャッシュを教材データとして利用する
9. IF ネットワークが未接続でアプリ資材キャッシュが存在しない、THEN THE PWA_Shell SHALL オフラインのため起動できないことを示す案内を表示し、Content_Cache と端末に保存済みの学習データを削除しない
10. WHEN ネットワーク接続がある状態で Quiz_App が起動される、THE PWA_Shell SHALL 配信中の最新アプリ資材をService Workerのキャッシュへ更新し、次回起動時に更新後の資材を使用する
11. THE PWA_Shell SHALL Service WorkerによるHTML、JavaScript、CSS、画像等のアプリ資材キャッシュと、Content_APIから取得したAPI_ResponseのContent_Cacheを別のキャッシュ領域および更新ライフサイクルとして管理する
12. WHILE アプリ資材キャッシュが利用可能である、THE Quiz_App SHALL Content_APIの接続失敗によってアプリ資材キャッシュを無効化せず、Content_Cache の有無に応じて教材利用可能状態または教材取得エラーを表示する
13. WHEN Content_API から教材APIの新版が取得される、THE PWA_Shell SHALL アプリ資材の再配信・再キャッシュを待たず、Requirement 9で定義したContent_Cacheの検証・原子的切り替えを実行して教材データだけをアプリ再起動なしに更新する
14. THE Quiz_App SHALL 単一のコードベース（Expo SDK 54 と expo-router によるルート定義）から Web（react-native-web）、iOS、Android の3プラットフォーム向けビルドをビルドエラー0件で完了できる状態とする

### Requirement 11: 日本語UIとアクセシビリティ

**User Story:** As a Learner, I want 日本語で読みやすく、支援技術でも操作できるUIがほしい, so that 表示や操作でつまずかずに学習内容へ集中できる

#### Acceptance Criteria

1. THE Quiz_App SHALL ホーム画面、Week_Unit 選択画面、出題画面、Feedback_View、結果画面、復習画面、用語辞書画面のUI文言（見出し、ボタン名、タブ名、状態表示、メッセージ、エラー表示）を日本語で表示し、コード片およびプログラミング言語の予約語・識別子は原文表記のまま表示する
2. THE Quiz_App SHALL 解答選択肢、ボタン、タブのすべてに、要素種別を示す accessibilityRole と、1文字以上で当該要素の操作目的を識別できる accessibilityLabel を設定し、選択状態および無効状態を持つ要素についてはその現在の状態を支援技術へ伝達する
3. WHEN 解答の正誤が判定される、THE Feedback_View SHALL 判定結果を、色の違いに加えて、正解と誤りで異なる記号と、正解と誤りを区別する日本語テキストラベルの両方で表示する
4. THE Quiz_App SHALL ライト配色とダーク配色の両方において、本文テキストと背景のコントラスト比を4.5対1以上とし、18ポイント以上のテキストまたは14ポイント以上の太字テキストと背景のコントラスト比を3対1以上とする
5. WHEN Quiz_App が起動する、THE Quiz_App SHALL 端末の外観設定がダークモードである場合はダーク配色を、それ以外の場合はライト配色を全画面に適用する
6. THE Quiz_App SHALL 解答選択肢、解答確定ボタン、ナビゲーションタブ、および画面内のすべてのタップ可能要素のタップ領域を44ポイント×44ポイント以上とし、隣接するタップ可能要素の領域間隔を8ポイント以上とする
7. WHEN Feedback_View が表示される、THE Quiz_App SHALL 表示から1秒以内に、正誤の判定結果と正解を含むテキストをライブリージョン通知としてスクリーンリーダーへ1回のみ伝達する
8. WHEN 端末の外観設定がライトモードとダークモードの間で変更される、THE Quiz_App SHALL 再起動なしに、表示中の画面へ変更後の配色を1秒以内に適用する
9. WHERE Quiz_App が Web ブラウザ上で動作している、THE Quiz_App SHALL 解答選択肢、ボタン、タブを含むすべての操作可能要素に対し、Tab キーによるフォーカス到達と、Enter キーまたはスペースキーによる実行を提供する
10. WHERE Quiz_App が Web ブラウザ上で動作している、THE Quiz_App SHALL キーボードフォーカスを保持している要素に、隣接背景とのコントラスト比3対1以上の可視フォーカス表示を付与する

### Requirement 12: デモとしてのスコープ制約

**User Story:** As a 開発者, I want デモの範囲を明確に固定したい, so that 外部教材APIを使いつつ、認証や学習進捗のサーバー同期なしにアプリ単体の価値を検証できる

#### Acceptance Criteria

1. WHEN Quiz_App が初回起動される、THE Quiz_App SHALL アカウント登録、ログイン、メールアドレス入力のいずれの操作も要求せずにホーム画面または教材取得状態を表示し、教材が利用可能な場合は Learner の1回以上3回以下の操作で Quiz_Session を開始可能とする
2. THE Quiz_App SHALL Content_API が提供する教材データ（デモAPIの初期範囲は `week3`〜`week6` の4件の Week_Unit に属する Question_Item、Term_Entry）を実行時に取得し、教材をアプリバンドル内へ固定した静的データとして保持しない
3. THE Quiz_App SHALL 学習データ（Progress_Snapshot、Review_Queue、Streak_Counter）の読み取り先および書き込み先を Local_Storage のみに限定し、学習データを Content_API その他の外部ネットワーク宛に送信しない
4. WHEN Content_Repository が管理する API_Response の教材データが差し替えられた状態で Quiz_App が起動または更新確認される、THE Quiz_App SHALL アプリのソースコードを変更することなく、API_Response の検証に成功した差し替え後の Week_Unit、Question_Item、Term_Entry を Content_Catalog として読み込む
5. IF Content_API が所属 Week_Unit、Question_Format、解説文、Source_Reference、またはその他の要件を欠く API_Response を返す、THEN THE Quiz_App SHALL 当該 API_Response を利用せず、直近の正常な Content_Cache へフォールバックし、初回取得でキャッシュがない場合は再試行導線付きのエラーを表示する
6. THE Quiz_App SHALL Content_API が将来の Week_Unit を追加提供できる構造を維持しつつ、今回の出題対象および画面表示対象を `week3`、`week4`、`week5`、`week6` の4件に限定し、それ以外の Week_Unit を選択肢として表示しない
7. THE Content_API SHALL 認証なしのデモ用バックエンドとして利用可能であり、APIの具体的なバックエンド言語、データベース、ホスティング、Content_Repositoryの管理画面および管理者認証は本スペックで実装対象に含めない
8. THE Quiz_App SHALL Content_API が利用できない場合に Content_Cache を教材データとして利用し、Content_API への接続回復を要求して学習進捗をサーバー同期しない

## Non-Goals（本スペックの対象外）

- 外部の本番CMS・LMSとの連携、教材Markdownの実行時取得やパース
- Content_API の本番運用、可用性保証、監視、スケーリング、課金
- Content_Repository の管理画面、教材編集ワークフロー、API管理者認証・認可
- ユーザー登録、ログイン、Learner向け認証・認可
- 学習データのサーバーサイドAPI送信、クラウド同期、複数端末間の引き継ぎ
- AIによる自由記述解答の採点、AIによる問題自動生成
- ランキング、フォロー、コメントなどのソーシャル機能
- プッシュ通知・リマインダー配信
- 学習データの分析ダッシュボード、講師向け管理画面
- week1・week2・week7以降のコンテンツを今回のUIで表示・出題すること（API追加配信の構造は対象に含む）
- 多言語対応（日本語UIのみ）
- 課金・サブスクリプション

## 前提と制約

- 実装は Expo SDK 54（`expo ~54.0.36`）、Expo Router（`~6.0.24`）、React 19.1.0、React Native 0.81.5、react-native-web `~0.21.0`、TypeScript `~5.9.2` を使用する
- Expo の API 利用は v54 の公式ドキュメント（https://docs.expo.dev/versions/v54.0.0/）に従う
- Content_API は REST/JSON と HTTPS を使用し、API_Version と開発用・本番用 Base URL を環境変数等で切り替え可能とする
- Content_API は認証なしのデモ用バックエンドとして利用可能であり、APIの具体的なバックエンド言語、データベース、ホスティングは設計フェーズで決定する
- 開発時は Content_API のモックまたは開発サーバーを利用でき、ネットワーク障害、不正レスポンス、更新応答、Content_Cache のフォールバックを再現可能とする
- Content_API は schemaVersion、contentVersion、取得日時相当のメタデータを含む API_Response を返し、Quiz_App は利用前に API_Response 全体を検証する
- Content_API の取得タイムアウト値、更新確認方式、Content_Cache の保存方式、APIレスポンスの検証方式は設計フェーズで決定する。ただし取得失敗時は直近の正常キャッシュへフォールバックし、初回でキャッシュがない場合は再試行を表示する
- 既存の `app/(tabs)/`、`components/themed-text.tsx`、`components/themed-view.tsx`、`constants/theme.ts` を土台として拡張する
- 外部UIライブラリ、状態管理ライブラリ、永続化ライブラリ、テストフレームワークは未導入であり、必要な依存は設計フェーズで決定する
- 主要な配信ターゲットは Web（PWA）であり、iOS・Android ビルドは同一コードベースで維持することのみを対象とする
- PWA_Shell のService Workerによるアプリ資材キャッシュと Content_Cache の教材APIデータキャッシュは別管理とする
