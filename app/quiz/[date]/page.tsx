'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { GeneratedQuestions, ChoiceAnnotation, ChoiceAnnotationSet, ChoiceAnnotations, ConfusingPair, ReadingQuestionExplanation } from '@/lib/claude';
import SpeechPlayer from '@/components/SpeechPlayer';

function ChoiceDissect({ vocabAnnotations, choices, answer }: {
  vocabAnnotations: Record<string, ChoiceAnnotation>;
  choices: { A: string; B: string; C: string; D: string };
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  const keys = ['A', 'B', 'C', 'D'] as const;

  return (
    <div className="no-print mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-indigo-600 border border-indigo-300 rounded px-3 py-1 hover:bg-indigo-50"
      >
        {open ? '▲ 選択肢の意味を閉じる' : '▼ 選択肢の意味を確認する'}
      </button>
      {open && (
        <div className="mt-2 border border-indigo-200 rounded-lg overflow-hidden text-xs">
          {keys.map((key, i) => {
            const val = choices[key];
            const isCorrect = answer === key;
            const ann = vocabAnnotations[val];
            return (
              <div key={key} className={`px-4 py-3 border-b last:border-b-0 ${isCorrect ? 'bg-green-50' : 'bg-white'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-500">{i + 1}</span>
                  <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-gray-800'}`}>{val}</span>
                  {isCorrect && <span className="text-green-600 text-xs font-bold">✅ 正解</span>}
                </div>
                {ann && (
                  <>
                    <div className="text-gray-700">→ {ann.translation}</div>
                    {ann.collocation && (
                      <div className="text-gray-400 mt-0.5 italic text-xs">{ann.collocation}</div>
                    )}
                    {ann.incorrectReason && (
                      <div className="text-red-600 mt-1 italic">{ann.incorrectReason}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const KEY_TO_NUM: Record<string, string> = { A: '1', B: '2', C: '3', D: '4' };

const TECHNIQUE_COLOR: Record<string, string> = {
  '因果関係の逆転': 'text-orange-700',
  '範囲の拡大': 'text-purple-700',
  '誇張・断定化': 'text-red-700',
  '本文に根拠なし': 'text-gray-600',
  '方向性の逆転': 'text-orange-700',
  '部分的整合': 'text-blue-700',
};

function ReadingExplanationBlock({ q, qi, explanations }: {
  q: { number: number; question: string; choices: Record<string, string>; answer: string; explanation: string };
  qi: number;
  explanations?: ReadingQuestionExplanation[];
}) {
  const exp = explanations?.[qi];
  const keys = ['A', 'B', 'C', 'D'] as const;

  if (!exp) {
    return (
      <div className="mb-6 border-l-4 border-green-400 pl-4">
        <p className="font-medium mb-2">({q.number}) {q.question}</p>
        <div className="grid grid-cols-1 gap-1 text-sm text-gray-600 mb-2">
          {keys.map((key, i) => (
            <div key={key} className={`flex gap-2 ${q.answer === key ? 'font-bold text-green-700' : ''}`}>
              <span>{i + 1}</span>
              <span>{q.choices[key]}{q.answer === key ? ` （正解: ${KEY_TO_NUM[key]}）` : ''}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">{q.explanation}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-t text-sm font-bold">
        【読解({q.number})】{q.question}
      </div>
      <div className="border border-gray-300 rounded-b divide-y divide-gray-200">
        {exp.choices.map((c, i) => (
          <div key={c.choiceKey} className={`px-4 py-3 ${c.isCorrect ? 'bg-green-50' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500 text-xs font-mono">選択肢{i + 1}</span>
              {c.isCorrect
                ? <span className="text-xs font-bold text-green-700 border border-green-400 rounded px-1">✅ 正解</span>
                : <span className={`text-xs font-bold px-1 border rounded ${TECHNIQUE_COLOR[c.incorrectReason?.technique ?? ''] ?? 'text-gray-500'} border-current`}>❌ {c.incorrectReason?.technique}</span>
              }
            </div>
            <p className="text-sm text-gray-800 leading-relaxed mb-1">{c.choiceText}</p>
            <p className="text-xs text-gray-500 mb-2">訳：{c.choiceTranslation}</p>
            {c.isCorrect && c.correctReason && (
              <div className="text-xs text-green-800 bg-green-50 border border-green-200 rounded p-2">
                <span className="font-bold">{c.correctReason.paragraphRef}</span>
                {' '}「{c.correctReason.originalText}」<br />
                {c.correctReason.paraphraseExplanation}
              </div>
            )}
            {!c.isCorrect && c.incorrectReason && (
              <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-2">
                {c.incorrectReason.originalText && (
                  <span className="text-gray-500">本文「{c.incorrectReason.originalText}」<br /></span>
                )}
                {c.incorrectReason.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderPassageWithBlanks(passage: string) {
  const parts = passage.split(/(\(\d+\))/g);
  return parts.map((part, i) =>
    /^\(\d+\)$/.test(part) ? (
      <strong key={i} className="underline text-blue-800">{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface AnnotationData {
  choiceAnnotations: ChoiceAnnotations;
  confusingPairs: ConfusingPair[];
  readingChoiceExplanations?: ReadingQuestionExplanation[];
}

export default function QuizPage() {
  const { date } = useParams<{ date: string }>();
  const [data, setData] = useState<GeneratedQuestions | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJa, setShowJa] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz/${date}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        fetch(`/api/annotations?date=${date}`)
          .then((r) => r.ok ? r.json() : null)
          .then((a) => { if (a) setAnnotations(a); })
          .catch(() => {});
      });
  }, [date]);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00+09:00');
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  }

  const isFillInBlank = data?.readingFormat === 'fill-in-blank';
  const formatBadgeColor = isFillInBlank ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="no-print bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">英検1級 毎日トレーニング</h1>
          {date && <p className="text-sm text-gray-500">{formatDate(date)}</p>}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowJa(!showJa)} className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
            {showJa ? '日本語訳を隠す' : '日本語訳を表示'}
          </button>
          <button onClick={() => window.open(`/seidoku/${date}`, '_blank')} className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700">
            📄 精読ノート
          </button>
          <button onClick={() => setShowAnswers(!showAnswers)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
            {showAnswers ? '解答・解説を隠す' : '解答・解説を表示'}
          </button>
          <button onClick={() => { document.body.setAttribute('data-print', 'questions'); window.print(); document.body.removeAttribute('data-print'); }} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
            問題を印刷
          </button>
          <button onClick={() => { document.body.setAttribute('data-print', 'answers'); window.print(); document.body.removeAttribute('data-print'); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            解答・解説を印刷
          </button>
          <Link href="/history" className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
            ← 履歴に戻る
          </Link>
        </div>
      </div>

      {loading && <div className="text-center py-20 text-gray-500">読み込み中...</div>}

      {data && !loading && (
        <>
          <div className="max-w-3xl mx-auto px-6 py-8 print-questions">
            <div className="print-only mb-6 text-center border-b-2 border-gray-800 pb-4">
              <h1 className="text-2xl font-bold">英検1級 毎日トレーニング　問題用紙</h1>
              <p className="text-sm mt-1">{formatDate(date)}</p>
            </div>

            <div className="mb-6 flex items-center gap-3 flex-wrap no-print">
              <span className={`text-xs font-bold px-2 py-1 rounded ${formatBadgeColor}`}>
                {isFillInBlank ? '【穴埋め形式】' : '【内容一致形式】'}
              </span>
              {data.difficultyScore && (() => {
                const d = data.difficultyScore;
                const colors: Record<string, string> = {
                  A: 'bg-green-100 text-green-800',
                  B: 'bg-lime-100 text-lime-800',
                  C: 'bg-yellow-100 text-yellow-800',
                  D: 'bg-orange-100 text-orange-800',
                  E: 'bg-red-100 text-red-800',
                };
                const labels: Record<string, string> = {
                  A: '易しい', B: 'やや易しい', C: '標準', D: 'やや難しい', E: '難しい',
                };
                return (
                  <span
                    title={`語彙:${d.vocab_score} ダミー:${d.dummy_score} 文脈:${d.context_score} 推論:${d.inference_score} 設問:${d.question_score}\n${d.reason}`}
                    className={`text-xs font-bold px-2 py-1 rounded cursor-help ${colors[d.difficulty]}`}
                  >
                    難易度 {d.difficulty}：{labels[d.difficulty]}（{d.overall_score}点）
                  </span>
                );
              })()}
              <span className="text-sm text-gray-500">{data.article.source} — {data.article.title}</span>
            </div>

            <section className="mb-10">
              <h2 className="text-lg font-bold border-b-2 border-gray-800 pb-2 mb-6">第1部　語彙・語法問題</h2>
              <p className="text-sm text-gray-600 mb-6">次の(1)〜(5)の（　　）に入れるのに最も適切なものを1、2、3、4の中から一つ選びなさい。</p>
              {data.vocabQuestions.map((q, qi) => (
                <div key={q.number} className="mb-8">
                  <p className="font-medium mb-3">({q.number}) {q.sentence.replace('____', '（　　　　）')}</p>
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    {(['A', 'B', 'C', 'D'] as const).map((key, i) => (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-gray-500 w-4">{i + 1}</span>
                        <span>{q.choices[key]}</span>
                      </div>
                    ))}
                  </div>
                  {annotations?.choiceAnnotations?.vocabAnnotations && (
                    <ChoiceDissect
                      vocabAnnotations={annotations.choiceAnnotations.vocabAnnotations}
                      choices={q.choices}
                      answer={q.answer}
                    />
                  )}
                </div>
              ))}
            </section>

            <section>
              <h2 className="text-lg font-bold border-b-2 border-gray-800 pb-2 mb-6">
                第2部　長文読解問題
                <span className={`ml-3 text-sm font-normal px-2 py-0.5 rounded ${formatBadgeColor}`}>
                  {isFillInBlank ? '【穴埋め形式】' : '【内容一致形式】'}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {isFillInBlank ? '次の英文の(1)〜(3)に入れるのに最も適切なものを1、2、3、4の中から一つ選びなさい。' : '次の英文を読み、(1)〜(4)の質問に対して最も適切なものを1、2、3、4の中から一つ選びなさい。'}
              </p>
              {data.title && (
                <p className="text-center text-lg font-bold text-gray-900 mb-4">{data.title}</p>
              )}
              <div className="bg-white border border-gray-200 rounded p-6 mb-4 leading-relaxed text-sm">
                {data.readingPassage.split('\n').map((para, i) => (
                  <p key={i} className={para.trim() ? 'mb-4' : ''}>{isFillInBlank ? renderPassageWithBlanks(para) : para}</p>
                ))}
              </div>
              <SpeechPlayer text={data.readingPassage} label="長文を読み上げ" />
              {showJa && data.readingPassageJa && (
                <div className="no-print bg-purple-50 border border-purple-200 rounded p-6 mb-6 leading-relaxed text-sm text-gray-700">
                  <p className="font-bold text-purple-800 mb-3">【日本語訳】</p>
                  {data.readingPassageJa.split('\n').map((para, i) => (
                    <p key={i} className={para.trim() ? 'mb-4' : ''}>{para}</p>
                  ))}
                </div>
              )}
              {data.readingQuestions.map((q, qi) => (
                <div key={q.number} className="mb-8">
                  <p className="font-medium mb-3">({q.number}) {q.question}</p>
                  <div className="grid grid-cols-1 gap-2 ml-4">
                    {(['A', 'B', 'C', 'D'] as const).map((key, i) => (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-gray-500 w-4">{i + 1}</span>
                        <span>{q.choices[key]}</span>
                      </div>
                    ))}
                  </div>
                  {annotations?.choiceAnnotations?.reading?.[qi] && (() => {
                    const set = annotations.choiceAnnotations.reading[qi];
                    const map = Object.fromEntries(
                      (['A','B','C','D'] as const).map(k => [q.choices[k], set[k]])
                    );
                    return <ChoiceDissect vocabAnnotations={map} choices={q.choices} answer={q.answer} />;
                  })()}
                </div>
              ))}
            </section>

            <div className="mt-10 border-t-2 border-gray-800 pt-6">
              <h3 className="font-bold mb-4">解答欄</h3>
              <div className="grid grid-cols-9 gap-2 text-center text-sm">
                {[...data.vocabQuestions.map((_, i) => `語彙${i + 1}`), ...data.readingQuestions.map((_, i) => `読解${i + 1}`)].map((label, i) => (
                  <div key={i} className="border border-gray-300">
                    <div className="bg-gray-100 px-1 py-0.5 text-xs">{label}</div>
                    <div className="h-7"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`max-w-3xl mx-auto px-6 py-8 print-answers${showAnswers ? '' : ' answers-hidden'}`}>
            <div className="border-t-4 border-gray-800 pt-8 mt-4">
              <div className="print-only mb-6 text-center border-b-2 border-gray-800 pb-4">
                <h1 className="text-2xl font-bold">英検1級 毎日トレーニング　解答・解説</h1>
                <p className="text-sm mt-1">{formatDate(date)}</p>
              </div>
              <div className="mb-8 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-3">正解一覧</h3>
                <div className="grid grid-cols-9 gap-2 text-center text-sm">
                  {[...data.vocabQuestions.map((q, i) => ({ label: `語彙${i + 1}`, answer: q.answer })), ...data.readingQuestions.map((q, i) => ({ label: `読解${i + 1}`, answer: q.answer }))].map((item, i) => (
                    <div key={i} className="border border-gray-300 bg-white">
                      <div className="bg-gray-200 px-1 py-0.5 text-xs">{item.label}</div>
                      <div className="py-1 font-bold text-blue-700">{KEY_TO_NUM[item.answer] ?? item.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
              <section className="mb-10">
                <h2 className="text-lg font-bold border-b-2 border-gray-800 pb-2 mb-6">第1部　語彙・語法問題　解説</h2>
                {data.vocabQuestions.map((q) => (
                  <div key={q.number} className="mb-6 border-l-4 border-blue-400 pl-4">
                    <p className="font-medium mb-2">({q.number}) {q.sentence.replace('____', `【${q.choices[q.answer as keyof typeof q.choices]}】`)}</p>
                    <div className="grid grid-cols-2 gap-1 text-sm text-gray-600 mb-2">
                      {(['A', 'B', 'C', 'D'] as const).map((key, i) => (
                        <div key={key} className={`flex gap-2 ${q.answer === key ? 'font-bold text-blue-700' : ''}`}>
                          <span>{i + 1}</span><span>{q.choices[key]}{q.answer === key ? ` （正解: ${KEY_TO_NUM[key]}）` : ''}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">{q.explanation}</p>
                  </div>
                ))}
              </section>
              <section>
                <h2 className="text-lg font-bold border-b-2 border-gray-800 pb-2 mb-6">第2部　長文読解問題　解説</h2>
                <div className="mb-8">
                  <h3 className="font-bold mb-3">【本文・日本語訳】</h3>
                  {data.title && (
                    <p className="text-center text-lg font-bold text-gray-900 mb-4">{data.title}</p>
                  )}
                  <div className="text-sm">
                    {data.readingPassage.split('\n').filter((p) => p.trim()).map((para, i) => {
                      const jaParas = (data.readingPassageJa || '').split('\n').filter((p) => p.trim());
                      return (
                        <div key={i} className="mb-4">
                          <p className="leading-relaxed mb-1">{isFillInBlank ? renderPassageWithBlanks(para) : para}</p>
                          {jaParas[i] && <p className="text-gray-600 leading-relaxed bg-gray-50 p-2 rounded border-l-2 border-gray-300">{jaParas[i]}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {data.readingQuestions.map((q, qi) => (
                  <ReadingExplanationBlock
                    key={q.number}
                    q={q}
                    qi={qi}
                    explanations={annotations?.readingChoiceExplanations}
                  />
                ))}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
