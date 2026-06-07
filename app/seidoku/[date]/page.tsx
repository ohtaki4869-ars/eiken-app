'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GeneratedQuestions } from '@/lib/claude';

export default function SeidokuPage() {
  const { date } = useParams<{ date: string }>();
  const [data, setData] = useState<GeneratedQuestions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = date === 'today'
      ? '/api/generate'
      : `/api/quiz/${date}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [date]);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00+09:00');
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  }

  const paragraphs = data?.readingPassage.split('\n').filter(p => p.trim()) ?? [];

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">読み込み中...</div>;
  }
  if (!data) {
    return <div className="flex items-center justify-center h-screen text-red-500">データが見つかりません</div>;
  }

  return (
    <>
      {/* 印刷時は非表示 */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { size: A4; margin: 15mm 18mm; }
        }
        @media screen {
          body { background: #f3f4f6; }
          .page { max-width: 210mm; margin: 24px auto; background: white; padding: 18mm; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
        }
        .passage-line { line-height: 2.8em; }
        .write-line { border-bottom: 1px solid #ccc; margin-bottom: 0; padding-bottom: 0; height: 28px; }
      `}</style>

      {/* 操作バー（画面のみ） */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between z-50">
        <div>
          <span className="font-bold text-gray-800">📄 精読ノート</span>
          <span className="text-sm text-gray-500 ml-3">{data.article.source} — {data.article.title.slice(0, 40)}...</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 text-sm"
          >
            🖨️ 印刷 / PDFで保存
          </button>
          <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
            閉じる
          </button>
        </div>
      </div>

      {/* 画面表示時の余白 */}
      <div className="no-print h-16" />

      {/* ===== PAGE 1: パッセージ ===== */}
      <div className="page">
        {/* ヘッダー */}
        <div style={{ borderBottom: '3px solid #1a3a5c', marginBottom: '12px', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a3a5c' }}>精読ノート</div>
              <div style={{ fontSize: '11px', color: '#2c6fad', marginTop: '2px' }}>EIKEN Grade 1 — Intensive Reading Practice</div>
            </div>
            <div style={{ fontSize: '10px', color: '#555', textAlign: 'right' }}>
              {formatDate(date === 'today' ? new Date(Date.now() + 9*3600000).toISOString().split('T')[0] : date)}
            </div>
          </div>
        </div>

        {/* 記入欄 */}
        <div style={{ fontSize: '10px', color: '#555', marginBottom: '8px', display: 'flex', gap: '32px' }}>
          <span>所要時間：＿＿＿分</span>
          <span>理解度：☆ ☆ ☆ ☆ ☆</span>
          <span>出典：{data.article.source}</span>
        </div>

        {/* パッセージ見出し */}
        <div style={{ background: '#e8f0f7', padding: '5px 10px', borderLeft: '4px solid #2c6fad', marginBottom: '12px', fontSize: '11px', fontWeight: 'bold', color: '#1a3a5c' }}>
          ■ Passage　（下線・メモを書き込もう）
        </div>

        {/* 段落 */}
        {paragraphs.map((para, i) => (
          <div key={i} style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{
              minWidth: '22px', height: '22px', background: '#2c6fad', color: 'white',
              borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 'bold', marginTop: '2px', flexShrink: 0
            }}>¶{i + 1}</div>
            <p style={{ fontSize: '11.5px', lineHeight: '2.6em', margin: 0, flex: 1, borderBottom: '0.5px solid #eee' }}>
              {para}
            </p>
          </div>
        ))}
      </div>

      {/* ===== PAGE 2: ワークシート ===== */}
      <div className="page" style={{ marginTop: '0' }}>

        {/* ヘッダー */}
        <div style={{ borderBottom: '3px solid #1a3a5c', marginBottom: '16px', paddingBottom: '8px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a3a5c' }}>精読ワークシート</div>
          <div style={{ fontSize: '10px', color: '#2c6fad', marginTop: '2px' }}>EIKEN Grade 1 — Intensive Reading Worksheet</div>
        </div>

        {/* Step 2: 語彙チェック */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ background: '#2c6fad', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            Step 2　語彙チェック
          </div>
          <div style={{ fontSize: '9px', color: '#555', marginBottom: '6px' }}>
            知らなかった単語に ✓ を入れ、意味と例文を確認しよう
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
            <thead>
              <tr style={{ background: '#e8f0f7' }}>
                <th style={{ width: '4%', padding: '4px', border: '1px solid #ccc', color: '#1a3a5c' }}>✓</th>
                <th style={{ width: '18%', padding: '4px', border: '1px solid #ccc', color: '#1a3a5c', textAlign: 'left' }}>単語</th>
                <th style={{ width: '28%', padding: '4px', border: '1px solid #ccc', color: '#1a3a5c', textAlign: 'left' }}>意味（解説）</th>
                <th style={{ padding: '4px', border: '1px solid #ccc', color: '#1a3a5c', textAlign: 'left' }}>例文</th>
              </tr>
            </thead>
            <tbody>
              {data.vocabQuestions.map((q, i) => {
                const word = q.choices[q.answer as keyof typeof q.choices];
                const example = q.sentence.replace('____', `[${word}]`);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '5px 4px', border: '1px solid #ddd', textAlign: 'center' }}>□</td>
                    <td style={{ padding: '5px 4px', border: '1px solid #ddd', fontWeight: 'bold', color: '#2c6fad' }}>{word}</td>
                    <td style={{ padding: '5px 4px', border: '1px solid #ddd' }}>{q.explanation.slice(0, 45)}</td>
                    <td style={{ padding: '5px 4px', border: '1px solid #ddd', color: '#444', fontStyle: 'italic' }}>{example.slice(0, 70)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Step 3: 段落要約 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ background: '#2c6fad', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            Step 3　段落ごとの1行要約
          </div>
          <div style={{ fontSize: '9px', color: '#555', marginBottom: '8px' }}>
            各段落のポイントを日本語で1〜2行にまとめよう
          </div>
          {paragraphs.map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '12px', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2c6fad', minWidth: '24px' }}>¶{i + 1}</span>
              <span style={{ fontSize: '10px', color: '#888' }}>→</span>
              <div style={{ flex: 1, borderBottom: '1px solid #aaa', height: '20px' }} />
            </div>
          ))}
        </div>

        {/* Step 4: 論理の流れ */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ background: '#2c6fad', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
            Step 4　論理の流れ
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {Array.from({ length: Math.min(4, paragraphs.length) }).map((_, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  border: '1.5px solid #2c6fad', borderRadius: '4px',
                  textAlign: 'center', fontSize: '9px', color: '#aac', width: '80px', height: '52px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                  paddingBottom: '4px', background: 'white',
                }}>
                  <span>¶{i + 1}</span>
                </div>
                {i < arr.length - 1 && (
                  <span style={{ color: '#2c6fad', fontSize: '18px', fontWeight: 'bold' }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* メモ欄 */}
        <div>
          <div style={{ background: '#2c6fad', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
            メモ・気づき
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ borderBottom: '1px solid #ccc', height: '26px', marginBottom: '2px' }} />
          ))}
        </div>

        {/* フッター */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #ccc', paddingTop: '6px', fontSize: '8px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
          <span>英検1級 毎日トレーニング　精読ノート</span>
          <span>{formatDate(date === 'today' ? new Date(Date.now() + 9*3600000).toISOString().split('T')[0] : date)}</span>
        </div>
      </div>
    </>
  );
}
