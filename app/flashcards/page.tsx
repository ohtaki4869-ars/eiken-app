'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { VocabQuestion } from '@/lib/claude';
import SpeechPlayer from '@/components/SpeechPlayer';

type CardStatus = 'unknown' | 'known';

interface CardState extends VocabQuestion {
  status?: CardStatus;
  flipped: boolean;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<CardState[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch('/api/flashcards')
      .then((r) => r.json())
      .then((data: VocabQuestion[]) => {
        setCards(data.map((q) => ({ ...q, flipped: false })));
        setLoading(false);
      });
  }, []);

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  function flip() {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, flipped: !c.flipped } : c))
    );
  }

  function judge(status: CardStatus) {
    const updated = cards.map((c, i) => (i === index ? { ...c, status } : c));
    setCards(updated);
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
    }
  }

  function restart() {
    setCards(cards.map((c) => ({ ...c, flipped: false, status: undefined })));
    setIndex(0);
    setDone(false);
  }

  function retryUnknown() {
    const unknown = cards
      .filter((c) => c.status === 'unknown')
      .map((c) => ({ ...c, flipped: false, status: undefined }));
    setCards(unknown);
    setIndex(0);
    setDone(false);
  }

  const knownCount = cards.filter((c) => c.status === 'known').length;
  const unknownCount = cards.filter((c) => c.status === 'unknown').length;
  const current = cards[index];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* ヘッダー */}
      <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">単語フラッシュカード</h1>
          <p className="text-sm text-gray-500">{today}　前日の復習</p>
        </div>
        <Link href="/" className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
          今日の問題へ
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        {loading && (
          <p className="text-center text-gray-500 py-20">読み込み中...</p>
        )}

        {!loading && cards.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg mb-2">本日の復習カードはありません</p>
            <p className="text-gray-400 text-sm mb-6">前日の問題が生成されると翌日に復習カードが表示されます</p>
            <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              今日の問題を解く
            </Link>
          </div>
        )}

        {!loading && cards.length > 0 && !done && current && (
          <>
            {/* 進捗バー */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>{index + 1} / {cards.length} 枚</span>
                <span className="text-green-600">✓ {knownCount}　</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${(index / cards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* カード */}
            <div
              onClick={flip}
              className="cursor-pointer bg-white rounded-2xl shadow-lg border border-gray-100 p-8 min-h-56 flex flex-col items-center justify-center text-center mb-6 transition hover:shadow-xl"
            >
              {!current.flipped ? (
                <>
                  <p className="text-3xl font-bold text-indigo-700 mb-4">
                    {current.choices[current.answer as keyof typeof current.choices]}
                  </p>
                  <p className="text-sm text-gray-400">タップして意味を確認</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-indigo-700 mb-3">
                    {current.choices[current.answer as keyof typeof current.choices]}
                  </p>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {current.sentence.replace('____', `[${current.choices[current.answer as keyof typeof current.choices]}]`)}
                  </p>
                  <SpeechPlayer
                    text={current.sentence.replace('____', current.choices[current.answer as keyof typeof current.choices])}
                    label="読み上げ"
                  />
                  <p className="text-sm text-gray-500 bg-yellow-50 rounded p-3 mt-2">
                    {current.explanation}
                  </p>
                </>
              )}
            </div>

            {/* 判定ボタン */}
            {current.flipped && (
              <div className="flex gap-4">
                <button
                  onClick={() => judge('unknown')}
                  className="flex-1 py-4 rounded-xl bg-red-100 text-red-700 font-bold text-lg hover:bg-red-200 transition"
                >
                  ✗ もう一度
                </button>
                <button
                  onClick={() => judge('known')}
                  className="flex-1 py-4 rounded-xl bg-green-100 text-green-700 font-bold text-lg hover:bg-green-200 transition"
                >
                  ✓ 知ってた！
                </button>
              </div>
            )}

            {!current.flipped && (
              <p className="text-center text-gray-400 text-sm">カードをタップして裏返す</p>
            )}
          </>
        )}

        {/* 完了画面 */}
        {done && (
          <div className="text-center py-10">
            <p className="text-4xl mb-4">🎉</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">復習完了！</h2>
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{knownCount}</p>
                <p className="text-sm text-gray-500">知ってた</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{unknownCount}</p>
                <p className="text-sm text-gray-500">要復習</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              {unknownCount > 0 && (
                <button
                  onClick={retryUnknown}
                  className="py-3 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200"
                >
                  ✗ の単語をもう一度
                </button>
              )}
              <button
                onClick={restart}
                className="py-3 rounded-xl bg-indigo-100 text-indigo-700 font-bold hover:bg-indigo-200"
              >
                最初からやり直す
              </button>
              <Link
                href="/"
                className="py-3 rounded-xl bg-gray-600 text-white font-bold hover:bg-gray-700 text-center"
              >
                今日の問題へ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
