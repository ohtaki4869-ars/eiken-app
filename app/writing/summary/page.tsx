'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SummaryPassage } from '@/lib/writingTypes';

function getJSTDateKey(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split('T')[0];
}

export default function SummaryPage() {
  const [data, setData] = useState<SummaryPassage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load(refresh = false) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/writing/summary${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(`パッセージの取得に失敗しました: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">隔週要約</h1>
          <p className="text-sm text-gray-500">英文要約問題（大問4形式）— 90〜110語で要約</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            再生成
          </button>
          <Link href="/writing" className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700">
            ← ライティングへ
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {loading && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">パッセージを生成中...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">{error}</div>
        )}

        {data && !loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold px-2 py-1 rounded bg-amber-100 text-amber-800">
                テーマ: {data.theme}
              </span>
              <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">
                要約: {data.wordCountMin}〜{data.wordCountMax}語
              </span>
              <span className="text-xs text-gray-400">本文 約{data.sourceWordCount}語</span>
            </div>

            <div className="text-sm leading-relaxed text-gray-800 mb-6 space-y-3">
              {data.passage.split(/\n\s*\n/).filter((p) => p.trim()).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <button
              onClick={() => window.open(`/api/pdf/writing?type=summary&date=${getJSTDateKey()}`, '_blank')}
              className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              📄 PDFを開く
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
