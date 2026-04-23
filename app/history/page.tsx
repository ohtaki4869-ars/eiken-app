'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HistoryItem {
  date: string;
  title: string;
  source: string;
  format: 'content' | 'fill-in-blank';
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      });
  }, []);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00+09:00');
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">英検1級 毎日トレーニング</h1>
          <p className="text-sm text-gray-500">過去の問題</p>
        </div>
        <Link href="/" className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
          今日の問題へ
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-lg font-bold mb-6">過去30日間の問題</h2>

        {loading && (
          <p className="text-gray-500 text-center py-10">読み込み中...</p>
        )}

        {!loading && history.length === 0 && (
          <p className="text-gray-500 text-center py-10">
            まだ問題が保存されていません。<br />
            今日の問題を開くと自動的に保存されます。
          </p>
        )}

        <div className="space-y-3">
          {history.map((item) => (
            <Link
              key={item.date}
              href={`/quiz/${item.date}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-800">{formatDate(item.date)}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    item.format === 'fill-in-blank'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {item.format === 'fill-in-blank' ? '穴埋め形式' : '内容一致形式'}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {item.source} — {item.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
