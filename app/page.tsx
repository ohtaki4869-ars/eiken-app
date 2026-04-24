'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GeneratedQuestions } from '@/lib/claude';
import SpeechPlayer from '@/components/SpeechPlayer';

function renderPassageWithBlanks(passage: string) {
  // (1), (2)... を太字の下線付きに変換
  const parts = passage.split(/(\(\d+\))/g);
  return parts.map((part, i) =>
    /^\(\d+\)$/.test(part) ? (
      <strong key={i} className="underline text-blue-800">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function Home() {
  const [data, setData] = useState<GeneratedQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJa, setShowJa] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions(refresh = false) {
    setLoading(true);
    setError('');
    setShowJa(false);
    try {
      const res = await fetch(`/api/generate${refresh ? '?refresh=true' : ''}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch {
      setError('問題の取得に失敗しました。APIキーを確認してください。');
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const isFillInBlank = data?.readingFormat === 'fill-in-blank';
  const formatLabel = isFillInBlank ? '【穴埋め形式】' : '【内容一致形式】';
  const formatBadgeColor = isFillInBlank ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーションバー */}
      <div className="no-print bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">英検1級 毎日トレーニング</h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <button
            onClick={() => setShowJa(!showJa)}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            {showJa ? '日本語訳を隠す' : '日本語訳を表示'}
          </button>
          <Link href="/flashcards" className="px-4 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600">
            単語復習
          </Link>
          <Link href="/history" className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
            過去の問題
          </Link>
          <button
            onClick={() => fetchQuestions(true)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            再生成
          </button>
          <button
            onClick={() => {
              document.body.setAttribute('data-print', 'questions');
              window.print();
              document.body.removeAttribute('data-print');
            }}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            問題を印刷
          </button>
          <button
            onClick={() => {
              document.body.setAttribute('data-print', 'answers');
              window.print();
              document.body.removeAttribute('data-print');
            }}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            解答・解説を印刷
          </button>
        </div>
      </div>

      {/* ===== 問題用紙 ===== */}
      <div className="max-w-3xl mx-auto px-6 py-8 print-questions">
        <div className="print-only mb-6 text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold">英検1級 毎日トレーニング　問題用紙</h1>
          <p className="text-sm mt-1">{today}</p>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="text-gray-500 text-lg">問題を生成中...</div>
            <div className="text-gray-400 text-sm mt-2">最新ニュースから問題を作成しています</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">{error}</div>
        )}

        {data && !loading && (
          <>
            <div className="mb-6 flex items-center gap-3 no-print">
              <span className={`text-xs font-bold px-2 py-1 rounded ${formatBadgeColor}`}>
                本日の形式: {formatLabel}
              </span>
              <span className="text-sm text-gray-500">
                出典: {data.article.source} —{' '}
                <a href={data.article.link} target="_blank" rel="noopener noreferrer" className="underline">
                  {data.article.title}
                </a>
              </span>
            </div>

            {/* 第1部：語彙問題 */}
            <section className="mb-10">
              <h2 className="text-lg font-bold border-b-2 border-gray-800 pb-2 mb-6">
                第1部　語彙・語法問題
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                次の(1)〜(5)の（　　）に入れるのに最も適切なものを1、2、3、4の中から一つ選びなさい。
              </p>
              {data.vocabQuestions.map((q) => (
                <div key={q.number} className="mb-8">
                  <p className="font-medium mb-2">
                    ({q.number}) {q.sentence.replace('____', '（　　　　）')}
                  </p>
                  <SpeechPlayer text={q.sentence.replace('____', 'blank')} label="例文を読み上げ" />
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    {(['A', 'B', 'C', 'D'] as const).map((key, i) => (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-gray-500 w-4">{i + 1}</span>
                        <span>{q.choices[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* 第2部：長文読解 */}
            <section>
              <h2 className="text-lg font-bold border-b-2 border-gray-800 pb-2 mb-6">
                第2部　長文読解問題
                <span className={`ml-3 text-sm font-normal px-2 py-0.5 rounded ${formatBadgeColor}`}>
                  {formatLabel}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {isFillInBlank
                  ? '次の英文の(1)〜(4)に入れるのに最も適切なものを1、2、3、4の中から一つ選びなさい。'
                  : '次の英文を読み、(1)〜(4)の質問に対して最も適切なものを1、2、3、4の中から一つ選びなさい。'}
              </p>

              {/* パッセージ */}
              <div className="bg-white border border-gray-200 rounded p-6 mb-4 leading-relaxed text-sm">
                {isFillInBlank
                  ? data.readingPassage.split('\n').map((para, i) => (
                      <p key={i} className={para.trim() ? 'mb-4' : ''}>
                        {renderPassageWithBlanks(para)}
                      </p>
                    ))
                  : data.readingPassage.split('\n').map((para, i) => (
                      <p key={i} className={para.trim() ? 'mb-4' : ''}>{para}</p>
                    ))}
              </div>

              {/* 読み上げ */}
              <SpeechPlayer text={data.readingPassage} label="長文を読み上げ" />

              {/* 日本語訳（トグル） */}
              {showJa && data.readingPassageJa && (
                <div className="no-print bg-purple-50 border border-purple-200 rounded p-6 mb-6 leading-relaxed text-sm text-gray-700">
                  <p className="font-bold text-purple-800 mb-3">【日本語訳】</p>
                  {data.readingPassageJa.split('\n').map((para, i) => (
                    <p key={i} className={para.trim() ? 'mb-4' : ''}>{para}</p>
                  ))}
                </div>
              )}

              {/* 設問 */}
              {data.readingQuestions.map((q) => (
                <div key={q.number} className="mb-8">
                  <p className="font-medium mb-3">
                    ({q.number}) {q.question}
                  </p>
                  <div className="grid grid-cols-1 gap-2 ml-4">
                    {(['A', 'B', 'C', 'D'] as const).map((key, i) => (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-gray-500 w-4">{i + 1}</span>
                        <span>{q.choices[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* 解答欄 */}
            <div className="mt-10 border-t-2 border-gray-800 pt-6">
              <h3 className="font-bold mb-4">解答欄</h3>
              <div className="grid grid-cols-9 gap-2 text-center text-sm">
                {[
                  ...data.vocabQuestions.map((_, i) => `語彙${i + 1}`),
                  ...data.readingQuestions.map((_, i) => `読解${i + 1}`),
                ].map((label, i) => (
                  <div key={i} className="border border-gray-300">
                    <div className="bg-gray-100 px-1 py-0.5 text-xs">{label}</div>
                    <div className="h-7"></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== 解答・解説用紙 ===== */}
      {data && !loading && (
        <div className="max-w-3xl mx-auto px-6 py-8 print-answers">
          <div className="border-t-4 border-gray-800 pt-8 mt-4">
            <div className="print-only mb-6 text-center border-b-2 border-gray-800 pb-4">
              <h1 className="text-2xl font-bold">英検1級 毎日トレーニング　解答・解説</h1>
              <p className="text-sm mt-1">{today}　{formatLabel}</p>
            </div>

            {/* 正解一覧 */}
            <div className="mb-8 p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-3">正解一覧</h3>
              <div className="grid grid-cols-9 gap-2 text-center text-sm">
                {[
                  ...data.vocabQuestions.map((q, i) => ({ label: `語彙${i + 1}`, answer: q.answer })),
                  ...data.readingQuestions.map((q, i) => ({ label: `読解${i + 1}`, answer: q.answer })),
                ].map((item, i) => (
                  <div key={i} className="border border-gray-300 bg-white">
                    <div className="bg-gray-200 px-1 py-0.5 text-xs">{item.label}</div>
                    <div className="py-1 font-bold text-blue-700">{item.answer}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 語彙問題解説 */}
            <section className="mb-10">
              <h2 className="text-lg font-bold border-b-2 border-gray-800 pb-2 mb-6">
                第1部　語彙・語法問題　解説
              </h2>
              {data.vocabQuestions.map((q) => (
                <div key={q.number} className="mb-6 border-l-4 border-blue-400 pl-4">
                  <p className="font-medium mb-2">
                    ({q.number}) {q.sentence.replace('____', `【${q.choices[q.answer as keyof typeof q.choices]}】`)}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-sm text-gray-600 mb-2">
                    {(['A', 'B', 'C', 'D'] as const).map((key, i) => (
                      <div key={key} className={`flex gap-2 ${q.answer === key ? 'font-bold text-blue-700' : ''}`}>
                        <span>{i + 1}</span>
                        <span>{q.choices[key]}{q.answer === key ? ' ✓' : ''}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">{q.explanation}</p>
                </div>
              ))}
            </section>

            {/* 長文読解解説 */}
            <section>
              <h2 className="text-lg font-bold border-b-2 border-gray-800 pb-2 mb-6">
                第2部　長文読解問題　解説　{formatLabel}
              </h2>

              {/* 本文＋日本語訳 */}
              <div className="mb-8">
                <h3 className="font-bold mb-3">【本文・日本語訳】</h3>
                <div className="text-sm">
                  {data.readingPassage.split('\n').filter((p) => p.trim()).map((para, i) => {
                    const jaParas = (data.readingPassageJa || '').split('\n').filter((p) => p.trim());
                    return (
                      <div key={i} className="mb-4">
                        <p className="leading-relaxed mb-1">
                          {isFillInBlank ? renderPassageWithBlanks(para) : para}
                        </p>
                        {jaParas[i] && (
                          <p className="text-gray-600 leading-relaxed bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                            {jaParas[i]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 設問解説 */}
              {data.readingQuestions.map((q) => (
                <div key={q.number} className="mb-6 border-l-4 border-green-400 pl-4">
                  <p className="font-medium mb-2">({q.number}) {q.question}</p>
                  <div className="grid grid-cols-1 gap-1 text-sm text-gray-600 mb-2">
                    {(['A', 'B', 'C', 'D'] as const).map((key, i) => (
                      <div key={key} className={`flex gap-2 ${q.answer === key ? 'font-bold text-green-700' : ''}`}>
                        <span>{i + 1}</span>
                        <span>{q.choices[key]}{q.answer === key ? ' ✓' : ''}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">{q.explanation}</p>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
