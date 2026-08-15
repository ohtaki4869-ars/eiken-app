import Link from 'next/link';

const FEATURES = [
  {
    href: '/writing/essay',
    emoji: '📝',
    title: '週次エッセイ',
    frequency: '週1回',
    description: '意見論述問題（大問5形式）のTOPICを自動生成。200〜240語で意見を述べる練習。',
    color: 'hover:border-indigo-400 group-hover:text-indigo-700',
  },
  {
    href: '/writing/daily',
    emoji: '💬',
    title: '毎日の表現トレーニング',
    frequency: '毎日',
    description: 'エッセイ・要約で使う構文/語彙を1〜2文の短い作文で反復練習。本番の負荷を分散する助走。',
    color: 'hover:border-teal-400 group-hover:text-teal-700',
  },
  {
    href: '/writing/summary',
    emoji: '📄',
    title: '隔週要約',
    frequency: '隔週',
    description: '英文要約問題（大問4形式）用の300語程度のパッセージを自動生成。90〜110語で要約する練習。',
    color: 'hover:border-amber-400 group-hover:text-amber-700',
  },
];

export default function WritingMenuPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">英検1級 ライティング</h1>
          <p className="text-sm text-gray-500">お題を生成してPDFに出力し、GoodNotesで手書き練習</p>
        </div>
        <Link href="/" className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
          ← トップへ
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-bold mb-1">✍️ 使い方</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>各ページでお題を生成し、「📄 PDFを開く」からPDFをダウンロード</li>
            <li>PDFをGoodNotesに読み込み、Apple Pencilで解答を書き込む</li>
            <li>添削はアプリの範囲外です。手書きの写真を <code className="bg-white px-1 rounded">writing-correction-review</code> スキルやChatGPT等に貼って評価を受けてください</li>
          </ul>
        </div>

        <div className="space-y-4">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition ${f.color}`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{f.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">{f.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{f.frequency}</span>
                  </div>
                  <p className="text-sm text-gray-500">{f.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
