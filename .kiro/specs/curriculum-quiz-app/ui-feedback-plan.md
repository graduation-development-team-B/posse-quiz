# UI/UX FB 対応プラン（メンバーFB → 実装単位）

メンバーからのぱっと見FBを、コード変更単位まで分解したもの。
「まず決めること」→「決まれば着手できるもの」の順に並べる。

---

## 0. 先に決めるべき方針（これが決まらないと下流が全部やり直しになる）

| # | 論点 | FB該当 | 選択肢 | 影響範囲 |
|---|---|---|---|---|
| D1 | ベースカラーをオレンジ `#FF4500` のまま行くか | 「ベースカラーオレンジってどうなん？癖強すぎ」 | (a) 維持し彩度を落とす（`#FF4500`→`#E8590C` 等）(b) 主役を落として無彩色ベース＋オレンジをアクセント限定 (c) 別色へ全面変更 | `constants/theme.ts`, `constants/game-theme.ts` の2ファイルで集中管理されているので**変更コスト自体は低い**。ただし全画面のスクショ確認が必要 |
| D2 | 解説画面は「読ませる」画面か | 「回答後の解説ページ全然みる気起きない。そもそもここは読ませたいんだっけ？」 | (a) 正解時は最小・誤答時のみ読ませる (b) 常に1画面1メッセージへ圧縮し全文は折りたたみ (c) 読ませない（1行＋次へ） | `app/feedback/[sessionId].tsx` の構成そのもの |
| D3 | 階層の正式な呼称と表記 | 「PH→Week→Topic？この辺が明確にわかりやすいUIに」 | **決定済み: 階層は PH → Week の2段。Topic は廃止**（詳細は F14）。残る論点は呼称のみ（例: フェーズ / 教材） | 全画面の文言、`types/content.ts` の用語コメント |
| D5 | 「Weekのミニドリルに関する問題」の解釈 | 「必須なのはPh→Weekの階層で、weekのミニドリルに関する問題」 | **決定済み: (a) 階層を2段にするだけ。出題内容は現状のインプット節由来のまま維持** | 出題データの改訂なし。F14のTopic削除のみ |
| D4 | ロードマップをトップにするか | 「最初からこれがメイン画面の方がいい」 | (a) タブ1枚目をロードマップに置換 (b) ロードマップ＋今日の1手だけの統合トップ | ルーティング構造（下記 P1） |

**推奨**: D1は(b)、D2は(a)、D4は(b)。理由は各項に記載。

---

## 1. FB項目 → 変更単位マッピング

### F1. キャラクターに個性がない

**現状**: `components/game/Mascot.tsx` に8表情のPNG（cheer/gentle/focus/wink/love/angry/sad/fun）が用意済み。ただし
- 名前・性格・口調の定義がコード上に存在しない（FBの「熱中くん」は画面外の呼称）
- セリフは `app/(tabs)/index.tsx` に3パターンだけ直書き（`encouragement`）
- 表情の選択ルールも各画面バラバラ（`streakCount >= 5 ? 'fun' : ...` などその場判断）

つまり素材はあるが**キャラ設定という単一の情報源がない**のが「個性がない」の実体。

**変更**
1. `lib/mascot/persona.ts` を新規作成
   - 名前、一人称、語尾/口調ルール、NG表現
   - シーン別セリフ辞書: `greeting` / `missionStart` / `correct` / `wrong` / `streak` / `allClear` / `comeback`（各3〜5パターンでランダム）
   - シーン → 表情のマッピングを1箇所に集約
2. 直書きセリフの置換: `app/(tabs)/index.tsx`, `components/game/GameResultBanner.tsx`, `app/quiz/[sessionId].tsx`(mood算出), `components/home/DailyMissionCard.tsx`
3. 画面内でキャラ名を1度は出す（トップの吹き出し）

**受け入れ条件**: セリフ・表情の決定ロジックが `lib/mascot/persona.ts` に集約され、画面側は `pickLine(scene, context)` を呼ぶだけになる。同じシーンで毎回同じセリフが出ない。

---

### F2. 全部茶色枠で囲われている / 余分なものを排除したい

**現状**: `border: '#F0C9A0'`（薄茶）＋ `borderWidth: 1` が **37ファイル・112箇所**。カード・ボタン・チップ・行の区切り・空状態まで全部同じ枠。枠が同じなので**情報の重要度差が視覚的に出ていない**。

**変更**
1. `constants/theme.ts` にサーフェス階層トークンを追加し、枠線の用途を限定
   - `surfaceRaised`（影のみ、枠なし）= 情報カード
   - `surfaceSunken`（背景を一段落とす、枠なし）= 補助情報
   - `border` は**区切り線と入力欄のみ**に用途を限定（現状の「カードの囲い」用途を廃止）
2. 枠 → 面＋余白＋影への置換（対象ファイル）
   - `components/home/*`（WeekSummaryCard / RecentHistoryCard / LearningMapPreview / DailyMissionCard / StudyWeekCard / StreakHeaderBar）
   - `components/learning-loop/LearningCard.tsx`（ここを直すと解説・出典・指標カードが一括で変わる）
   - `components/scope/*`, `components/roadmap/RoadmapPathNode.tsx`
3. 選択状態だけは枠を残す（選択中のみ `selectedBorder`）。これで「枠がある＝いま操作対象」という意味が生まれる

**受け入れ条件**: 1画面あたりの枠線本数が3本以下。枠線が付いているのは「選択中」「入力欄」「区切り」のいずれか。

---

### F3. 次に何をしたらいいかが明確にわかる状態にしたい

**現状**: `app/(tabs)/index.tsx` は5枚のカードが等価に縦積み（StreakHeaderBar → DailyMissionCard → StudyWeekCard → LearningMapPreview → RecentHistoryCard）。主従がない。

**変更**: 1画面 = 1主要アクション。ファーストビューに入るのは「いまやること」と「そのボタン」だけ。実績系（連続正解・学習日カレンダー・履歴）はスクロール下 or マイページへ移動。

**受け入れ条件**: 初期表示（スクロールなし）で主要CTAが1つだけ見える。

---

### F4. メニューバーは簡潔でわかりやすい

**変更なし**。`app/(tabs)/_layout.tsx` の3タブ（ホーム/学習/マイページ）を維持。
※ただしP1でトップをロードマップにするならタブ名「ホーム」の見直しは必要（例:「学習マップ」）。

---

### F5. ロードマップをトップ画面にする（PH1クリアしたいと思わせたい）

**現状**: `app/roadmap.tsx` が独立画面で、`components/home/LearningMapPreview.tsx` の「すべてのカリキュラムを見る 〉」から遷移する2階層構造。ロードマップは実装済み（蛇行パス、ノード状態、ゴールの宝箱、`countRoadmapProgress` による完了数）。

**変更**
1. タブ1枚目をロードマップ主体に再構成（`app/(tabs)/index.tsx`）
   - 上部固定: PH1の到達度（`countRoadmapProgress` の completed/total）とゴールまでの残り
   - 本体: 縦スクロールのロードマップ（`RoadmapPathNode` + `RoadmapPathConnector` を流用）
   - 現在地ノードに「ここから始める」CTAを直付け（`/scope` へ）→ F3を同時に満たす
2. `LearningMapPreview.tsx` は役割消滅 → 削除
3. `app/roadmap.tsx` は重複するので削除し、`/roadmap` への内部リンクをタブへ張り替え
   - 参照元: `app/(tabs)/index.tsx`（`router.push('/roadmap')` 2箇所）
4. 「PH1クリアしたい」の動機付けを言語化して表示: ゴール到達で何が得られるか（現状は宝箱🧰の絵だけで報酬が不明）

**受け入れ条件**: 起動直後にPH1全体の道筋と現在地と残り数が見える。ロードマップに到達するまでのタップ数が0。

---

### F6. 絵文字アイコンを手書きイラストにしたい

**現状の絵文字使用箇所**（マスコットPNGと混在してテイストが割れている）

| 箇所 | 絵文字 | ファイル |
|---|---|---|
| ストリーク／ポイント | 🔥 💎 | `components/home/StreakHeaderBar.tsx` |
| 履歴行バッジ | 🔥 | `components/home/RecentHistoryCard.tsx` |
| 週間カレンダーのごほうび | 🎁 | `components/home/StudyWeekCard.tsx` |
| ロードマップ背景の木 | 🌳 🌲 ×6 | `app/roadmap.tsx` |
| ゴールの宝箱 | 🧰 | `app/roadmap.tsx` |
| ノード状態 | 🔒 ⋯ | `components/roadmap/RoadmapNodeBadge.tsx` |

**変更**
1. `assets/images/icons/` に手描きアイコンを追加（マスコットと同じ線・同じ塗り）。必要な最小セット: streak / point / reward / lock / chest / tree
2. `components/ui/AppIcon.tsx` を新規作成（`name` で引く。マスコットPNGと同じ `expo-image` ベース、`accessibilityLabel` 必須）
3. 上表の絵文字を全置換
4. `✓` `×` `!` は**アイコン化しない**（色に依存しない正誤テキスト代替として機能しているため。`tests/ui/visualContract.test.tsx:422` が `✓` の存在を検証している）

**受け入れ条件**: 画面上の装飾的絵文字が0。アイコンは全て `AppIcon` 経由。

---

### F7. 「挑戦中」「学習できる」の意味が分からない

**現状**: `lib/progress/roadmap.ts` の `toStatusLabel()` が状態を4語に写像。
```
completed → '完了'
current   → answeredCount > 0 ? '挑戦中' : '学習できる'
locked    → 'ロック中'
preparing → '準備中'
```
`current` を回答有無で2語に割っているが、**どちらも「いまやれる」で意味が同じ**。ユーザーには区別の理由が伝わらない。

**変更**: 状態ラベルを「学習者の次の行動」に置き換える。
```
completed → 'クリア'
current(未着手) → 'ここから'   ＋ CTA「はじめる」
current(着手済) → '3/12問'     ＋ CTA「つづける」
locked    → 'Week03を1問解くと開く'（unlockHintを短縮してラベル自体に出す）
preparing → 'じゅんび中'
```
- 進捗は文字ラベルではなく数値（`answeredCount/totalCount`）で出す＝解釈不要
- ロック理由は別枠の hint ではなくラベルに統合（現状 `unlockHint` はタップ時の notice でしか出ず、見る前に分からない）

**影響**: `lib/progress/roadmap.ts`、`components/roadmap/RoadmapPathNode.tsx`、`components/home/LearningMapPreview.tsx`（F5で削除予定）、**`tests/progress/roadmap.test.ts` の文言アサーション（"挑戦中"/"学習できる" を検証している行）を更新必要**。

---

### F8. 最近の学習履歴だけでは復習しようと思わない（忘却曲線という理由付けが欲しい）

**現状の重大な前提**: 復習キューに**時間軸の概念がない**。`types/progress.ts` の `ReviewEntry` は
`questionId` / `weekKey` / `topicId` / `wrongCount` / `consecutiveCorrect` / `lastWrongAt` のみ。
`lib/progress/reviewQueue.ts` の優先順位は「誤答回数の降順 → 最終誤答日時の新しい順」。
つまり**「忘却曲線に基づく復習」は現在のデータモデルでは表示できない**（謳うと嘘になる）。

**変更（2段階）**
1. **データモデル拡張**（`types/progress.ts` + `lib/progress/reviewQueue.ts`）
   - `ReviewEntry` に `nextReviewAt: string` と `intervalStep: number` を追加
   - 間隔反復のステップを定数化（例: `REVIEW_INTERVALS_DAYS = [1, 3, 7, 14]` を `lib/constants.ts` へ）
   - 正解で `intervalStep` を1進めて `nextReviewAt` を再計算、誤答で0へ戻す
   - `sortReviewQueue` を「期限超過が先、次に誤答回数」へ変更
   - 永続データの後方互換: 既存スナップショットに欠けたフィールドは `lastWrongAt` から補完（`lib/progress/progressSerialization` 系の復元経路）
   - 既存テスト `tests/progress/reviewQueue.test.ts`, `tests/property/reviewQueue.property.test.ts`, `tests/property/reviewSession.property.test.ts` の更新
2. **UI: 履歴カードを「復習の理由」カードに置換**（`components/home/RecentHistoryCard.tsx`）
   - 見出しを「最近の学習履歴」から「わすれる前に復習」へ
   - 各行に理由を出す:「前回から3日。いま解くと定着しやすい」「2回まちがえた問題」
   - 期限が来た件数をCTAに出す:「3問の復習をはじめる」→ `/review`

**受け入れ条件**: 復習導線に必ず「なぜ今か」が1文添えられる。忘却曲線という表現を出す場合、`nextReviewAt` の実装が裏付けになっている。

---

### F9. PH→Week→Topic の階層が分かりにくい

→ **F14で階層自体を PH → Week の2段に単純化するため、この項目はF14に統合**。
残る作業は呼称の統一のみ:

1. `lib/constants.ts` に表示名を定義（例: `HIERARCHY_LABELS = { phase: 'フェーズ', week: '教材' }`）
2. `components/home/PhaseSelector.tsx` の空フェーズ（PH2〜4は `PHASE_WEEK_KEYS` が空配列）を選択肢から外し、「今後追加」の1行に集約
3. 出典表記も同じ語彙に揃える（F13と共通）

---

### F14. Topic 概念の廃止（PH → Week の2段階層へ）

**結論**: Topic は不要。必須は PH → Week の2段。

#### 現状: Topic は3つの役割を兼ねている

| 役割 | 実装 | 廃止の可否 |
|---|---|---|
| (a) 出題範囲の絞り込み | `types/session.ts` の `SessionScope.topicIds`、`lib/quiz/scope.ts` の `selectQuestionPool` | **可。すでに死んでいる**。アプリコード内の `topicIds` は全箇所で `[]` 固定（`app/(tabs)/index.tsx:66`、`app/(tabs)/learn.tsx:60`、`app/roadmap.tsx:52`、`app/scope/index.tsx` 4箇所）。実際のTopic IDが入る経路が存在しない |
| (b) 苦手分野の集計 | `types/progress.ts` の `TopicProgress`、`lib/progress/metrics.ts` の `buildWeakTopics`（出題数3以上・正答率60%未満・最大10件）、`components/result/ResultMetrics.tsx` | **粒度を失う**。廃止するとWeek単位の正答率しか残らない → 代替の判断が必要（下記） |
| (c) 問題の分類キー | `types/content.ts` の `QuestionItem.topicId`（必須の外部キー）、`ContentCatalog.topics` | **可**。ただし後述の理由で実質すでに冗長 |

#### Topic が冗長である根拠（実データで確認）

`mock-api/catalog.json` の実データ:
- weekUnits 5件 / topics 32件 / questions 70件 / terms 35件
- Topic名と `sourceReference.sectionHeading` が**ほぼ同一の情報**
  - `topic-week3-justify-content` → 名前「justify-content」／出典見出し「3. justify-content：横方向の並び方を決める」
  - `topic-week3-common-mistakes` → 名前「よくある間違いと確認ポイント」／出典見出し「8. よくある間違いと確認ポイント」
- つまり Topic は `sectionHeading` を正規化しただけの中間テーブルで、**独立した情報を持っていない**

→ (c)の分類は `sourceReference.sectionHeading` で代替できる。(b)の集計も、必要なら Topic ではなく `sectionHeading` 単位で導出できる（永続データに新しいIDを増やさずに済む）。

#### 変更内容

**1. コンテンツモデル**（`types/content.ts`）
- `Topic` インターフェース削除
- `ContentCatalog.topics` 削除
- `QuestionItem.topicId` 削除
- `ValidationIssue.entityType` から `'topic'` を削除

**2. バリデーション**（`lib/content/validateApiResponse.ts`、Topic参照45箇所）
- Topic配列の検証、Week↔Topic参照整合、Question→Topic外部キー検証を削除
- 数量制約は Week 単位へ集約
- `lib/constants.ts` から削除: `MIN_TOPICS_PER_WEEK` / `MAX_TOPICS_PER_WEEK` / `MIN_QUESTIONS_PER_TOPIC` / `MAX_QUESTIONS_PER_TOPIC` / `MAX_TOPIC_PROGRESS` / `WEAK_TOPIC_*`（(b)の判断次第）
- `MIN_QUESTIONS_PER_WEEK` / `MAX_QUESTIONS_PER_WEEK` は維持（現状 週15問・Git10問で成立）
- **注意**: 現仕様は「Topic不明IDならAPIレスポンス全体を不正として拒否」（requirements.md 12項）。この拒否条件が消えるため requirements.md も更新対象

**3. 出題範囲**（`lib/quiz/scope.ts`、`types/session.ts`）
- `SessionScope.topicIds` 削除。`selectQuestionPool` を Week 判定のみに単純化（現在の Topic 経由の二重照合が消えて実装が短くなる）
- `topicBelongsToWeek()` 削除
- 呼び出し側の `{ ...scopeSelection, weekKeys: [...], topicIds: [] }` を全箇所修正（`app/(tabs)/index.tsx`、`app/(tabs)/learn.tsx`、`app/roadmap.tsx`）

**4. 進捗モデル（破壊的変更・移行が必要）**
- `types/progress.ts`: `TopicProgress` 削除、`ProgressSnapshot.topicProgress` 削除、`ReviewEntry.topicId` 削除
- `lib/constants.ts`: `PROGRESS_SCHEMA_VERSION` を `1` → `2`
- `lib/progress/progressSerialization.ts`: v1データの読み込み時に `topicProgress` と `topicId` を捨てて v2 へ移行するパスを追加（**既存端末の学習記録を消さない**）
- `lib/progress/ProgressStore.ts` / `progressDefaults.ts` / `reviewQueue.ts` / `metrics.ts` から Topic 集計を除去

**5. UI**
- **削除（未使用の死んだコード）**: `components/scope/ScopeTopicOption.tsx` と `components/scope/ScopeWeekCard.tsx` はどこからも import されていない（自ファイル内の定義参照のみ）。Topic選択UIは実装されたが結線されていない状態
- `components/home/WeekSummaryCard.tsx` / `app/(tabs)/learn.tsx`: `topicCount`（「トピック 8件」表示）を**問題数**へ置換。学習者にとって意味があるのは「解ける問題が何問あるか」
- `components/learning-loop/SourceReferenceBlock.tsx`: Topic行を削除し1行化（F13と同一作業）
- `components/result/ResultMetrics.tsx`（Topic参照14箇所）/ `ResultSummary.tsx`: 「誤答Topic数」「苦手Topic一覧」の扱いを(b)の判断に従って決める
- `app/scope/index.tsx`: Topic関連の残存参照を除去

**6. 教材データ**（`mock-api/catalog.json`）
- `topics` 配列（103箇所）を削除し、各 question から `topicId` を削除

#### (b) 苦手分野機能の判断が必要

Topic を消すと「苦手分野」の粒度が Week 単位になります。選択肢:

- **B1: 苦手分野機能を廃止** — `buildWeakTopics`、`ResultMetrics` の該当表示、`WEAK_TOPIC_*` 定数、`tests/progress/metrics.test.ts` を削除。最も単純
- **B2: `sectionHeading` 単位に付け替え** — 永続データに `sectionHeading` を持たせて集計。Topic と同じ粒度を保てるが、進捗データに教材文字列を保存することになる（教材改訂で見出しが変わると集計が壊れる）
- **B3: 誤答した問題ID単位に寄せる** — 既に `ReviewEntry` が誤答回数を持っているので、「苦手分野」ではなく「よく間違える問題」として復習リストに統合。F8（間隔反復）と親和性が高い

**推奨: B3**。Topic を消す動機（階層を単純にする）と整合し、F8の復習強化と作業が重なるため。B2は教材改訂に弱く、Topic を消した意味が薄れます。

#### 影響するテスト（Topic参照の多い順）

`tests/property/sessionScope.property.test.ts`(48) / `tests/property/progressMetrics.property.test.ts`(24) / `tests/quiz/sessionManager.test.ts`(23) / `tests/generators/catalog.ts`(22) / `tests/progress/metrics.test.ts`(19) / `tests/generators/content.ts`(18) / `tests/property/contentCatalog.property.test.ts`(17) / `tests/generators/progress.ts`(13) / `tests/progress/ProgressStore.test.ts`(11) / `tests/content/validateApiResponse.test.ts`(9) ほか

うち `tests/generators/*` を先に直すと他が連鎖的に通るため、**ジェネレータ → ドメイン → UI の順**で進める。

#### 仕様書の更新

Topic を前提にした記述が残ると次の実装時に復活するため、同時に更新する。
- `.kiro/specs/curriculum-quiz-app/requirements.md`（Topic参照38箇所。用語定義、5・6・8・9・12・13項、Story記述）
- `.kiro/specs/curriculum-quiz-app/design.md`（47箇所。データモデル、JSON例、画面構成）
- `.kiro/specs/curriculum-quiz-app/uiux.md`（16箇所）
- `.kiro/specs/curriculum-quiz-app/tasks.md`（35箇所）

---

### F15. 「Weekのミニドリルに関する問題」への対応 — **D5(a)で確定。出題内容の改訂は行わない**

**決定**: 階層を PH → Week の2段にする（F14）ところまでが対応範囲。出題内容は現状のインプット節由来のまま維持し、`mock-api/catalog.json` の70問と `SOURCE_HEADINGS` は変更しない。

**調査結果（記録として残す）**
- 教材側にミニドリルは実在する構造（`documents/*.md` の各Weekに `## ミニドリル（AI禁止・45〜75分）`、問題1〜3とゴールUI画像）
- 一方 `mock-api/catalog.json` の70問は**全てインプット節由来**（ミニドリルを出典に持つ問題は0件）
- `lib/content/validateApiResponse.ts` の `SOURCE_HEADINGS` に登録された見出しも全てインプット節で、ミニドリル見出しは1つも登録されていない
- `requirements.md` 冒頭の課題認識は「ミニドリルが重すぎる・アウトプット機会が不足 → 3〜10問の小さなセッションに細分化」

**将来ミニドリル化する場合の前提**（今回はやらない）
1. `SOURCE_HEADINGS` に各Weekのミニドリル見出しを追加
2. ミニドリルのつまずきポイントを出典とする問題を作成
3. ミニドリルは1Weekあたり3問程度なので、1セッション3〜10問を成立させるにはミニドリル1問から複数のクイズを派生させる設計が必要

---

### F10. 「誤り！」の色がベースカラーに合わない / ベースカラーの是非

**現状の不整合**: 誤答表現に**2系統の色が混在**している。
- `components/game/GameResultBanner.tsx` → `danger` 系（`#B91C1C` 赤 / 背景 `#FBE4E4`）
- `components/learning-loop/FeedbackState.tsx` → `reviewBlue`（`#1D4ED8` 青 / 背景 `#EFF6FF`）

同じ解説画面に**赤の「おしい！」と青の「誤り」が同時に出ている**（`app/feedback/[sessionId].tsx` が両方描画）。オレンジ `#FF4500` の隣に純赤が来るため色が喧嘩して見える。

**変更**
1. 誤答の色を**青系（`reviewBlue`）に一本化**。赤（`danger`）は破壊的操作と通信エラー専用に用途を限定
   - 対象: `constants/game-theme.ts`（`danger*` の使用箇所整理）、`GameResultBanner.tsx`、`FeedbackStatus.tsx`、`FeedbackState.tsx`
   - 理由: 誤答は「失敗」ではなく「復習対象」なので、復習の色と揃える方が意味が通る。かつオレンジと調和する
2. 正誤の主表現を色からマスコットの表情＋記号へ移す（F1と連動）
3. **D1**: ベースカラーは `constants/theme.ts` / `constants/game-theme.ts` の2ファイルに集中しているため差し替えは容易。推奨は「無彩色ベース＋オレンジをCTAとアクティブ状態だけに限定」。現状オレンジが枠・バッジ・進捗バー・タブ・リンク全部に乗って**主張が飽和している**のが「癖が強い」の実体で、色そのものより使用量の問題

---

### F11. 「復習キューに追加済み」が何か分からない / いらない

**現状**: 誤答時は `addReviewOnWrongAnswer` で**自動的にキューへ入る**（`app/feedback/[sessionId].tsx` の永続化処理）。その上で `components/feedback/FeedbackActions.tsx` が手動の「復習に追加」ボタンと「復習キューに登録されています。あとで復習しよう。」を出している。**自動で入るものを手動で追加させる二重UI**で、FBの通り不要。

**変更**
1. `FeedbackActions.tsx` から「復習に追加」ボタンと `registered` テキストを削除
2. `app/feedback/[sessionId].tsx` の `handleAmbiguous` / `isAmbiguousSaving` / 関連notice（「復習キューに登録しました。」）を削除
3. 「あいまい申告」機能自体を残すか判断
   - 残す場合: ラベルを内部語彙から学習者語彙へ（「あとで見直す」）＋ボタン位置を副次に
   - 廃止する場合: `lib/quiz/feedback.ts` の `registerAmbiguousFeedback` と `lib/progress/reviewQueue.ts` の `addReviewOnAmbiguous` も削除
4. 「復習キュー」という内部語彙をUIから全廃（`app/feedback`, `components/review/ReviewQueueSummary.tsx`）→「復習リスト」等
5. **`tests/smoke/learningLoop.smoke.test.tsx`（'復習に追加済み' を検証）を更新必要**

---

### F12. 問題画面でマスコットが左にいて問題文が見づらい

**現状**: `components/game/MissionBubble.tsx` が `flexDirection: 'row'` でマスコット64px＋吹き出しを横並び。吹き出しは `flex: 1` なので、**問題文の横幅が常に64px＋余白ぶん削られる**。日本語の長文プロンプト（`fontSize: 20`）では折り返しが増えて読みにくい。

**変更**
1. レイアウトを縦積みに変更: マスコット（小さく32〜40px）＋出題形式ラベルを1行目に置き、問題文は**全幅**
2. または解答中はマスコットを出さず、正誤フィードバック時のみ登場させる（登場の希少性で印象を強める＝F1にも効く）
3. 吹き出しの尻尾（`styles.tail`）とマスコットの位置関係を再調整
4. `tests/ui/visualContract.test.tsx:360`（クイズ画面の構成検証）への影響を確認

**推奨**: 2案。問題文の可読性が最優先で、かつキャラの出番を減らすほうが個性が立つ。

---

### F13. 解説ページを読む気が起きない / 教材情報は「引用：PH1 Week1の〇〇」程度でいい

**現状**: `app/feedback/[sessionId].tsx` が**8ブロックを縦に並べている**。
```
1. GameResultBanner        正誤（マスコット＋赤/緑）
2. progressText            問題 3/10 ・ 正解数 2問
3. FeedbackState           正誤（青/緑）＋正解    ← 1と重複
4. FeedbackQuestion        問題文と選択肢の再掲
5. LearningCard「解説全文」  正解の内容 ＋ 解説    ← 3と正解が重複
6. SourceReferenceBlock    教材情報（出典＋Topicの2項目カード）
7. reasonCard「なぜ違う？」   誤答理由
8. FeedbackActions         復習追加＋次へ
```
正誤が2回、正解テキストが2回、出典が独立カード1枚。**読む前に「長い」と判定される構成**になっている。

**変更**
1. 重複排除: 1と3を統合（`FeedbackState` を廃止し `GameResultBanner` に正解テキストを内包）。5の「正解の内容」も削除
2. 正解時は最小構成（判定＋1行＋次へ）。解説は折りたたみ
3. 誤答時のみ「なぜ違う？」を**先頭付近**に出す（読む価値が最も高いのはここ）
4. `components/learning-loop/SourceReferenceBlock.tsx` をカードから**1行テキスト**へ縮小
   - 現状: `LearningCard` に「出典」「Topic」の2項目（`week3 / セクション見出し` という内部キー混じりの表示）
   - 変更後: `引用：PH1 Week03「Gitの基本」` の1行。`weekKey` の生値（`week3`）を表示に使うのをやめ、`formatWeekLabel()` とフェーズ名で整形
5. 4のFeedbackQuestion（問題文再掲）は誤答時のみ表示
6. **`tests/ui/visualContract.test.tsx:406`（「Feedbackは正誤の記号/日本語、全文解説、出典、Topic、復習/次へCTAを表示する」）の期待値を更新必要**

**受け入れ条件**: 正解時の解説画面が1スクロール以内。誤答時に最初に目に入るのが「なぜ違うか」。

---

## 2. 実装順（依存関係順）

| Phase | 内容 | 含むFB | 前提 |
|---|---|---|---|
| P0 | 方針決定 | D1, D2, D4, D5 | — |
| P1 | **Topic廃止（PH→Week の2段化）** | F14, F9 | D5 |
| P2 | デザイントークン整理（枠線廃止・サーフェス階層・誤答色の一本化） | F2, F10 | D1 |
| P3 | 情報アーキテクチャ再構成（ロードマップをトップへ、状態ラベル改訂） | F5, F3, F7 | D4, P1, P2 |
| P4 | 学習ループ画面の圧縮（出題レイアウト、解説の重複排除、復習キューUI削除） | F12, F13, F11 | D2, P1, P2 |
| P5 | 復習の理由付け（間隔反復のデータモデル＋UI） | F8 | P1 |
| P6 | キャラクター人格の集約 ＋ 手描きアイコン差し替え | F1, F6 | 素材制作、P2 |
| P7 | ~~出題内容のミニドリル化~~ **D5(a)により対象外** | F15 | — |

**P1を最優先にした理由**: Topic廃止は型定義・バリデーション・進捗スキーマ・テストジェネレータに及ぶ構造変更で、UI変更より下の層にあります。UIを先に直すとTopic前提のコードを触ったうえで再度触ることになります。
**進捗スキーマの移行はP1とP5で2回発生する**（P1で `topicProgress`/`topicId` を落とし、P5で `nextReviewAt`/`intervalStep` を足す）ため、P5を近くに置くか、**両方を1回のスキーマ移行（v1→v2）にまとめる**ほうが安全です。まとめる場合はP1とP5を同一フェーズとして扱ってください。
**P6を最後に置く理由**: イラスト素材の制作待ちでブロックされるため、コード側の構造変更を先に終わらせる。

---

## 3. 更新が必要な既存テスト

構造変更に伴い期待値の更新が必要（削除ではなく新仕様への書き換え）。

| テスト | 理由 |
|---|---|
| `tests/generators/catalog.ts` / `content.ts` / `progress.ts` | Topic廃止（F14）。**ここを最初に直すと他が連鎖的に通る** |
| `tests/property/sessionScope.property.test.ts`(Topic参照48) / `tests/quiz/sessionManager.test.ts`(23) | `SessionScope.topicIds` 廃止（F14） |
| `tests/property/progressMetrics.property.test.ts`(24) / `tests/progress/metrics.test.ts`(19) | `TopicProgress` と苦手Topic集計の廃止（F14-b） |
| `tests/property/contentCatalog.property.test.ts`(17) / `tests/content/validateApiResponse.test.ts`(9) / `tests/content.validateApiResponse.test.ts` | Topic検証ルール削除（F14） |
| `tests/progress/ProgressStore.test.ts`(11) / `tests/progress/progressSerialization.test.ts` | 進捗スキーマ v1→v2 移行（F14, F8） |
| `tests/progress/roadmap.test.ts` | 状態ラベル文言（"挑戦中" / "学習できる"）の変更（F7） |
| `tests/smoke/learningLoop.smoke.test.tsx` | "復習に追加済み" の削除（F11）、"誤り" の表現変更（F10） |
| `tests/ui/visualContract.test.tsx` | Topic表示（F14）、ホーム構成（F5）、クイズ構成（F12）、Feedback構成（F13）、セマンティックカラー（F10） |
| `tests/progress/reviewQueue.test.ts` / `tests/property/reviewQueue.property.test.ts` / `tests/property/reviewSession.property.test.ts` | `ReviewEntry` の `topicId` 削除（F14）と間隔反復フィールド追加（F8） |
| `tests/api/contract.test.ts` / `scripts/validate-fixture.js` | カタログのTopic配列削除（F14） |

検証コマンド:
```bash
npm run typecheck
npx vitest run
```

---

## 5. 実装前に修正すべき既存の不具合

プラン外だが調査中に見つかったもの。

**`/content/[weekKey]` ルートが存在しない**
`app/(tabs)/learn.tsx:64` の `openDetails()` が `router.push({ pathname: '/content/[weekKey]', ... })` を呼んでいるが、`app/` 配下に `content/` ディレクトリがない（存在するのは `feedback` / `immediate-review` / `quiz` / `result` / `scope` / `term` / `api`）。
つまり `components/home/WeekSummaryCard.tsx` の「教材の詳細を見る 〉」ボタンは**遷移先がない**。

対応方針の選択肢:
- F5でトップをロードマップ化するなら、Week詳細画面の役割はロードマップのノード＋出題範囲選択に吸収できる → **ボタンごと削除**（余分なものを排除したいというFBにも合う）
- 詳細画面を残すなら `app/content/[weekKey].tsx` を新規作成。ただしTopic廃止後は「Topicの進行と出題可能数」（現在のボタンの `accessibilityHint`）という表示内容自体が成立しなくなる

**推奨**: 削除。Week単位の情報はロードマップのノードと出題範囲画面で足り、詳細画面を作る動機がTopic表示だったため、Topic廃止と同時に役割が消えます。

---

## 4. FBのうち「変更しない」もの

| FB | 判断 |
|---|---|
| メニューバーは簡潔でわかりやすい | 現状維持（3タブ）。P2でタブ名のみ再検討 |
| `✓` `×` の記号 | 手描きアイコン化しない。色覚に依存しない代替テキストとして機能しており、UI契約テストの検証対象でもある |
