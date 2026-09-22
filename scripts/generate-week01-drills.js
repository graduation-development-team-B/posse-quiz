/* global __dirname */
// Week01.mdのミニドリルを、順序付きのコード編集ステップへ変換する。
// node scripts/generate-week01-drills.js（他のWeek・用語は保持）
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../mock-api/catalog.json');
const response = JSON.parse(fs.readFileSync(file, 'utf8'));
const drills = [
  {
    id: 'movie', title: '映画カードを作る', source: '問題1：映画カードを作る（20分）',
    code: `<main class="bg-zinc-950 p-4">
  <article class="{{1}} overflow-hidden">
    <img src="./images/poster.jpg" alt="インターステラーのポスター" class="{{2}}">
    <div class="p-4 space-y-2">
      <span class="bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded">PG-12</span>
      <h1 class="{{3}}">インターステラー</h1>
      <p class="text-zinc-400 text-xs">2014 · 2時間49分</p>
      <p class="{{4}}">★★★★★ 8.6 / 10</p>
      <div class="flex gap-2">
        <span class="{{5}}">SF</span>
        <span class="bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded">アドベンチャー</span>
        <span class="bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded">ドラマ</span>
      </div>
      <p class="text-zinc-400 text-xs leading-relaxed">地球の環境が崩壊に向かう未来。元宇宙飛行士の農夫クーパーは、人類を救う新天地を求めワームホールへと旅立つ。</p>
      <div class="flex gap-2">
        <button class="{{6}} px-3 py-2 rounded">▶ 再生</button>
        <button class="bg-zinc-600 text-white text-sm px-3 py-2 rounded">詳細情報</button>
      </div>
    </div>
  </article>
</main>`,
    steps: [
      ['カードの土台を作ろう', '幅w-72、背景bg-zinc-800、角丸rounded-lg、大きな影shadow-2xlを指定します。', 'w-72 bg-zinc-800 rounded-lg shadow-2xl', 'w-80 bg-white rounded-lg shadow-2xl', 'w-72 bg-zinc-950 rounded-xl shadow-lg', 'w-full bg-zinc-800 rounded-lg shadow-lg'],
      ['ポスターの大きさを整えよう', '幅いっぱい・高さh-44にし、object-coverで画像を枠に合わせます。', 'w-full h-44 object-cover', 'w-full h-36 object-cover', 'w-72 h-44 object-contain', 'w-full h-40 object-contain'],
      ['映画タイトルを目立たせよう', 'タイトルはtext-xl・font-bold・text-whiteを使います。', 'text-xl font-bold text-white', 'text-xs text-zinc-400', 'text-sm font-bold text-yellow-400', 'text-xl text-black'],
      ['評価を黄色で表示しよう', '評価は黄色の小さめの太字です。text-yellow-400・text-sm・font-boldを指定します。', 'text-yellow-400 text-sm font-bold', 'text-zinc-400 text-xs', 'text-white text-xl font-bold', 'text-yellow-400 text-xs'],
      ['SFタグを隣のタグと揃えよう', '背景bg-zinc-700、文字text-zinc-300、text-xsと上下左右の余白・角丸を指定します。', 'bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded', 'bg-white text-black text-xs px-2 py-1 rounded', 'bg-zinc-700 text-zinc-300 text-xl px-2 py-1 rounded', 'bg-zinc-600 text-white text-sm p-4 rounded'],
      ['再生ボタンを完成させよう', '白い背景に黒い小さめの太字を指定し、見本とカード全体を比べましょう。', 'bg-white text-black text-sm font-bold', 'bg-zinc-600 text-white text-sm', 'bg-black text-white text-sm font-bold', 'bg-white text-black text-xs'],
    ],
  },
  {
    id: 'artist', title: 'アーティストカードを作る', source: '問題2：アーティストカードを作る（10分）',
    code: `<main class="bg-gray-900 p-4">
  <article class="{{1}} overflow-hidden">
    <img src="./images/cover.jpg" alt="NEON GHOSTのアーティスト写真" class="{{2}}">
    <div class="p-4 space-y-2">
      <span class="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">ARTIST</span>
      <h1 class="{{3}}">NEON GHOST</h1>
      <p class="text-purple-400 text-xs">インディーロック・東京</p>
      <ul class="{{4}}">
        <li>🎸 ボーカル&amp;ギター：田中 凛</li>
        <li>🥁 ドラム：佐藤 海</li>
        <li>🎹 キーボード：山本 蒼</li>
      </ul>
      <div class="flex gap-2">
        <span class="{{5}}">ロック</span>
        <span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">インディー</span>
        <span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">バンド</span>
      </div>
      <button class="{{6}} w-full px-3 py-2 rounded">プロフィールを見る</button>
    </div>
  </article>
</main>`,
    steps: [
      ['ダークテーマの土台を作ろう', 'w-72・bg-gray-800・rounded-xl・shadow-2xlでカードを作ります。', 'w-72 bg-gray-800 rounded-xl shadow-2xl', 'w-80 bg-white rounded-xl shadow-lg', 'w-72 bg-gray-900 rounded-lg shadow-lg', 'w-full bg-purple-500 rounded-xl shadow-2xl'],
      ['写真をカード幅に合わせよう', '幅w-full、高さh-40、object-coverを指定します。', 'w-full h-40 object-cover', 'w-full h-44 object-cover', 'w-72 h-36 object-contain', 'w-full h-40 object-contain'],
      ['アーティスト名を整えよう', '白色・text-xl・font-boldの見出しにします。', 'text-white text-xl font-bold', 'text-purple-400 text-xs', 'text-white text-sm', 'text-black text-xl font-bold'],
      ['メンバーリストの間隔を作ろう', '文字はtext-gray-300・text-xs、行間の余白はspace-y-1を指定します。', 'text-gray-300 text-xs space-y-1', 'text-gray-300 text-xl space-y-2', 'text-black text-xs space-y-1', 'text-purple-400 text-sm space-y-2'],
      ['ロックのタグを揃えよう', 'bg-gray-700・text-gray-300・text-xs・px-2・py-1・roundedで他のタグに揃えます。', 'bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded', 'bg-purple-500 text-white text-xs px-2 py-1 rounded', 'bg-gray-700 text-gray-300 text-xl px-2 py-1 rounded', 'bg-white text-black text-sm p-4 rounded'],
      ['紫のボタンで仕上げよう', 'bg-purple-600・text-white・text-sm・font-boldにして、見本と完成形を比べましょう。', 'bg-purple-600 text-white text-sm font-bold', 'bg-purple-500 text-white text-xs', 'bg-white text-black text-sm font-bold', 'bg-gray-700 text-gray-300 text-sm'],
    ],
  },
  {
    id: 'event', title: 'イベント告知カードを作る', source: '問題3：イベント告知カードを作る（10分）',
    code: `<main class="bg-gray-100 p-4">
  <article class="{{1}} overflow-hidden">
    <img src="./images/event.jpg" alt="ハッカソン会場の様子" class="{{2}}">
    <header class="{{3}}">
      <p class="text-orange-100 text-xs font-semibold">POSSE Event</p>
      <h1 class="text-white text-xl font-bold">新人ハッカソン 2026</h1>
    </header>
    <div class="p-5 space-y-2">
      <p class="text-gray-600 text-sm leading-relaxed">初めてのチーム開発を体験しよう！アイデアをカタチにする2日間。プログラミング歴3ヶ月以上なら誰でも参加できます。</p>
      <ul class="{{4}}">
        <li>📅 2026年6月13日（土）・14日（日）</li>
        <li>📍 渋谷・POSSEオフィス</li>
        <li>👥 対象：PH1修了以上</li>
        <li>🎯 定員：20名</li>
      </ul>
      <div class="flex gap-2">
        <span class="{{5}}">ハッカソン</span>
        <span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">初心者歓迎</span>
        <span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">チーム開発</span>
      </div>
      <button class="{{6}} w-full px-3 py-2 rounded">申し込む</button>
    </div>
  </article>
</main>`,
    steps: [
      ['白いカードの土台を作ろう', '幅w-80・背景bg-white・角丸rounded-xl・影shadow-lgを指定します。', 'w-80 bg-white rounded-xl shadow-lg', 'w-72 bg-gray-800 rounded-xl shadow-2xl', 'w-80 bg-gray-100 rounded-lg shadow-2xl', 'w-full bg-white rounded-lg shadow-lg'],
      ['会場写真の高さを整えよう', 'w-full・h-36・object-coverで横長の会場写真を表示します。', 'w-full h-36 object-cover', 'w-full h-44 object-cover', 'w-full h-40 object-contain', 'w-72 h-36 object-contain'],
      ['オレンジ色のヘッダーを作ろう', 'bg-orange-500で背景色をつけ、左右px-5・上下py-4の余白を指定します。', 'bg-orange-500 px-5 py-4', 'bg-orange-100 px-5 py-4', 'bg-orange-500 px-2 py-1', 'bg-purple-600 px-5 py-4'],
      ['開催情報を読みやすくしよう', 'リストはspace-y-2、文字はtext-gray-700・text-smを指定します。', 'space-y-2 text-gray-700 text-sm', 'space-y-1 text-gray-300 text-xs', 'space-y-2 text-white text-sm', 'space-y-1 text-gray-700 text-xl'],
      ['イベントタグを揃えよう', 'bg-orange-100・text-orange-700に、小さい文字・余白・角丸を加えます。', 'bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded', 'bg-orange-500 text-white text-xs px-2 py-1 rounded', 'bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded', 'bg-orange-100 text-orange-700 text-xl p-4 rounded'],
      ['申し込みボタンで完成させよう', 'bg-orange-500・text-white・text-sm・font-boldで仕上げ、見本と比較します。', 'bg-orange-500 text-white text-sm font-bold', 'bg-orange-100 text-orange-700 text-xs', 'bg-white text-black text-sm font-bold', 'bg-purple-600 text-white text-sm font-bold'],
    ],
  },
];
const questions = drills.flatMap(drill => {
  const goalCode = drill.code.replace(/\{\{(\d)\}\}/g, (_, n) => drill.steps[Number(n) - 1][2]);
  return drill.steps.map(([prompt, hint, correct, ...wrong], index) => {
    const options = [correct, ...wrong].map((text, i) => ({ id: `option-${i + 1}`, text }));
    // 固定された選択順でも正答位置が毎回同じにならないようローテーション。
    const offset = (index + 1) % 4;
    return {
      id: `question-week1-preview-${drill.id}-${index + 1}`, weekUnitId: 'week-unit-week1',
      format: 'fillBlank', prompt,
      payload: {
        kind: 'fillBlank', mode: 'choice', blankToken: '__EDIT__',
        content: drill.code.replace(/\{\{(\d)\}\}/g, (_, n) => Number(n) === index + 1 ? '__EDIT__' : Number(n) <= index ? drill.steps[Number(n) - 1][2] : ''),
        options: [...options.slice(offset), ...options.slice(0, offset)], correctOptionId: 'option-1',
      },
      explanation: `${hint} 指定したクラスがプレビューに反映されることを確認しましょう。`,
      sourceReference: { weekKey: 'week1', sectionHeading: drill.source },
      preview: { drillId: `week1-${drill.id}`, title: drill.title, version: 1, step: index + 1, total: drill.steps.length, hint, goalCode },
      published: true, deleted: false,
    };
  });
});
response.catalog.questions = [...questions, ...response.catalog.questions.filter(q => q.weekUnitId !== 'week-unit-week1')];
response.contentVersion = '2026-09-19.week01-preview.1';
response.updatedAt = '2026-09-19T00:00:00.000Z';
fs.writeFileSync(file, JSON.stringify(response, null, 2) + '\n');
