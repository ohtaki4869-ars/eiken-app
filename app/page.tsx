import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">英検1級 毎日トレーニング</h1>
        <p className="text-sm text-gray-500">トレーニングの種類を選んでください</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
          <Link
            href="/reading"
            className="group bg-white border border-gray-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-md transition flex flex-col items-start gap-3"
          >
            <span className="text-4xl">📖</span>
            <span className="text-lg font-bold text-gray-800 group-hover:text-blue-700">リーディング</span>
            <span className="text-sm text-gray-500">
              語彙問題＋長文読解を毎日自動生成。解答・解説・精読ノート・フラッシュカードつき。
            </span>
          </Link>

          <Link
            href="/writing"
            className="group bg-white border border-gray-200 rounded-2xl p-8 hover:border-indigo-400 hover:shadow-md transition flex flex-col items-start gap-3"
          >
            <span className="text-4xl">✍️</span>
            <span className="text-lg font-bold text-gray-800 group-hover:text-indigo-700">ライティング</span>
            <span className="text-sm text-gray-500">
              週次エッセイ・毎日の表現トレーニング・隔週要約のお題をPDFで出力し、GoodNotesで手書き練習。
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
