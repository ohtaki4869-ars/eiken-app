'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { GeneratedListening, DialogueItem, MonologueItem, RealLifeItem, Speaker } from '@/lib/listeningTypes';

const KEY_TO_NUM: Record<string, string> = { A: '1', B: '2', C: '3', D: '4' };

const SPEAKER_INFO: Record<Speaker, { label: string; color: string }> = {
  male1:   { label: '男性A', color: 'text-blue-700' },
  male2:   { label: '男性B', color: 'text-blue-500' },
  female1: { label: '女性A', color: 'text-rose-600' },
  female2: { label: '女性B', color: 'text-rose-400' },
};

// TTS fetch helper
async function fetchAudio(text: string, voice: string): Promise<string> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  const data = await res.json();
  return `data:audio/mp3;base64,${data.audioContent}`;
}

// ----- Dialogue Player -----
function DialoguePlayer({ item, index }: { item: DialogueItem; index: number }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lineIndexRef = useRef(0);

  const playLine = useCallback((urls: string[], idx: number) => {
    if (idx >= urls.length) {
      setPlaying(false);
      return;
    }
    lineIndexRef.current = idx;
    const audio = new Audio(urls[idx]);
    audioRef.current = audio;
    audio.onended = () => playLine(urls, idx + 1);
    audio.play();
  }, []);

  async function handlePlay() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    let urls = audioUrls;
    if (urls.length === 0) {
      setLoading(true);
      try {
        urls = await Promise.all(
          item.lines.map(line => fetchAudio(line.text, line.speaker))
        );
        setAudioUrls(urls);
      } catch {
        alert('音声の生成に失敗しました');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setPlaying(true);
    playLine(urls, 0);
  }

  return (
    <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-indigo-800">No. {index + 1}</span>
        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? '生成中...' : playing ? '⏸ 停止' : '▶ 再生'}
          </button>
          <button
            onClick={() => setShowScript(!showScript)}
            className="px-3 py-1.5 text-xs bg-white border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-50 transition"
          >
            {showScript ? 'スクリプトを閉じる' : 'スクリプトを見る'}
          </button>
        </div>
      </div>

      {/* Script */}
      {showScript && (
        <div className="px-4 py-3 bg-white border-b border-gray-100 text-sm">
          {item.lines.map((line, i) => {
            const info = SPEAKER_INFO[line.speaker];
            return (
              <div key={i} className="flex gap-2 mb-2">
                <span className={`font-bold min-w-[56px] text-right shrink-0 ${info.color}`}>{info.label}:</span>
                <span className="text-gray-800">{line.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Question & Choices */}
      <div className="px-4 py-4">
        <p className="font-medium text-gray-800 mb-3">Q. {item.question}</p>
        <div className="space-y-2">
          {(['A', 'B', 'C', 'D'] as const).map((key, i) => {
            const isCorrect = key === item.answer;
            const isSelected = selected === key;
            let bg = 'bg-white border-gray-200 hover:bg-gray-50';
            if (showAnswer) {
              if (isCorrect) bg = 'bg-green-50 border-green-400';
              else if (isSelected) bg = 'bg-red-50 border-red-300';
            } else if (isSelected) {
              bg = 'bg-indigo-50 border-indigo-300';
            }
            return (
              <button
                key={key}
                onClick={() => !showAnswer && setSelected(key)}
                className={`w-full text-left flex gap-3 px-3 py-2.5 border rounded-lg text-sm transition ${bg}`}
              >
                <span className="font-bold text-gray-500 shrink-0">{i + 1}</span>
                <span className={showAnswer && isCorrect ? 'font-bold text-green-700' : 'text-gray-700'}>{item.choices[key]}</span>
              </button>
            );
          })}
        </div>

        {selected && !showAnswer && (
          <button
            onClick={() => setShowAnswer(true)}
            className="mt-3 px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition"
          >
            答えを確認
          </button>
        )}

        {showAnswer && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
            <span className="font-bold text-yellow-800">正解: {KEY_TO_NUM[item.answer]}　</span>
            {item.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

// ----- Monologue Player -----
function MonologuePlayer({ item }: { item: MonologueItem }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState('');

  async function handlePlay() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    let url = audioUrl;
    if (!url) {
      setLoading(true);
      try {
        const fullText = item.paragraphs.join(' ');
        url = await fetchAudio(fullText, 'female1');
        setAudioUrl(url);
      } catch {
        alert('音声の生成に失敗しました');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.play();
    setPlaying(true);
  }

  return (
    <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-teal-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="font-bold text-teal-800">Part 2スタイル　</span>
          <span className="text-sm text-teal-700 italic">{item.title}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-teal-600 text-white text-sm rounded-full hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {loading ? '生成中...' : playing ? '⏸ 停止' : '▶ 再生'}
          </button>
          <button
            onClick={() => setShowScript(!showScript)}
            className="px-3 py-1.5 text-xs bg-white border border-teal-200 text-teal-700 rounded-full hover:bg-teal-50 transition"
          >
            {showScript ? 'スクリプトを閉じる' : 'スクリプトを見る'}
          </button>
        </div>
      </div>

      {showScript && (
        <div className="px-4 py-3 bg-white border-b border-gray-100 text-sm text-gray-800 leading-relaxed">
          {item.paragraphs.map((p, i) => <p key={i} className="mb-3">{p}</p>)}
        </div>
      )}

      <div className="px-4 py-4 space-y-6">
        {item.questions.map((q) => {
          const sel = answers[q.number];
          const revealed = showAnswers;
          return (
            <div key={q.number}>
              <p className="font-medium text-gray-800 mb-3">Q{q.number}. {q.question}</p>
              <div className="space-y-2">
                {(['A', 'B', 'C', 'D'] as const).map((key, i) => {
                  const isCorrect = key === q.answer;
                  const isSelected = sel === key;
                  let bg = 'bg-white border-gray-200 hover:bg-gray-50';
                  if (revealed) {
                    if (isCorrect) bg = 'bg-green-50 border-green-400';
                    else if (isSelected) bg = 'bg-red-50 border-red-300';
                  } else if (isSelected) bg = 'bg-teal-50 border-teal-300';
                  return (
                    <button
                      key={key}
                      onClick={() => !revealed && setAnswers(a => ({ ...a, [q.number]: key }))}
                      className={`w-full text-left flex gap-3 px-3 py-2.5 border rounded-lg text-sm transition ${bg}`}
                    >
                      <span className="font-bold text-gray-500 shrink-0">{i + 1}</span>
                      <span className={revealed && isCorrect ? 'font-bold text-green-700' : 'text-gray-700'}>{q.choices[key]}</span>
                    </button>
                  );
                })}
              </div>
              {revealed && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
                  <span className="font-bold text-yellow-800">正解: {KEY_TO_NUM[q.answer]}　</span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(answers).length === item.questions.length && !showAnswers && (
          <button
            onClick={() => setShowAnswers(true)}
            className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition"
          >
            答えを確認
          </button>
        )}
      </div>
    </div>
  );
}

// ----- Real Life Player -----
function RealLifePlayer({ item }: { item: RealLifeItem }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState('');

  async function handlePlay() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    let url = audioUrl;
    if (!url) {
      setLoading(true);
      try {
        url = await fetchAudio(item.script, 'male2');
        setAudioUrl(url);
      } catch {
        alert('音声の生成に失敗しました');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.play();
    setPlaying(true);
  }

  return (
    <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-orange-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <span className="font-bold text-orange-800">Part 3スタイル　Real-life Situation</span>
        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white text-sm rounded-full hover:bg-orange-600 disabled:opacity-50 transition"
          >
            {loading ? '生成中...' : playing ? '⏸ 停止' : '▶ 再生'}
          </button>
          <button
            onClick={() => setShowScript(!showScript)}
            className="px-3 py-1.5 text-xs bg-white border border-orange-200 text-orange-700 rounded-full hover:bg-orange-50 transition"
          >
            {showScript ? 'スクリプトを閉じる' : 'スクリプトを見る'}
          </button>
        </div>
      </div>

      {/* Situation */}
      <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
        <p className="text-sm font-bold text-orange-800 mb-1">【状況】</p>
        <p className="text-sm text-gray-800">{item.situation}</p>
      </div>

      {showScript && (
        <div className="px-4 py-3 bg-white border-b border-gray-100 text-sm text-gray-800 leading-relaxed">
          {item.script}
        </div>
      )}

      <div className="px-4 py-4">
        <p className="font-medium text-gray-800 mb-3">Q. {item.question}</p>
        <div className="space-y-2">
          {(['A', 'B', 'C', 'D'] as const).map((key, i) => {
            const isCorrect = key === item.answer;
            const isSelected = selected === key;
            let bg = 'bg-white border-gray-200 hover:bg-gray-50';
            if (showAnswer) {
              if (isCorrect) bg = 'bg-green-50 border-green-400';
              else if (isSelected) bg = 'bg-red-50 border-red-300';
            } else if (isSelected) bg = 'bg-orange-50 border-orange-300';
            return (
              <button
                key={key}
                onClick={() => !showAnswer && setSelected(key)}
                className={`w-full text-left flex gap-3 px-3 py-2.5 border rounded-lg text-sm transition ${bg}`}
              >
                <span className="font-bold text-gray-500 shrink-0">{i + 1}</span>
                <span className={showAnswer && isCorrect ? 'font-bold text-green-700' : 'text-gray-700'}>{item.choices[key]}</span>
              </button>
            );
          })}
        </div>

        {selected && !showAnswer && (
          <button
            onClick={() => setShowAnswer(true)}
            className="mt-3 px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition"
          >
            答えを確認
          </button>
        )}

        {showAnswer && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
            <span className="font-bold text-yellow-800">正解: {KEY_TO_NUM[item.answer]}　</span>
            {item.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

// ----- Main Page -----
export default function DailyListeningPage() {
  const [data, setData] = useState<GeneratedListening | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  async function load(refresh = false) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/listening/daily${refresh ? '?refresh=true' : ''}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setError('問題の取得に失敗しました。しばらくしてから再度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">英検1級 毎日リスニング</h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            再生成
          </button>
          <Link href="/listening" className="px-4 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-700">
            過去問へ
          </Link>
          <Link href="/" className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
            ← 読解問題へ
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">リスニング問題を生成中...</p>
            <p className="text-gray-400 text-sm mt-2">最新ニュースから問題を作成しています</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">{error}</div>
        )}

        {data && !loading && (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-bold mb-1">📻 使い方</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>▶ボタンで音声を生成・再生します（初回は数秒かかります）</li>
                <li>選択肢を選んでから「答えを確認」を押してください</li>
                <li>スクリプトは答え合わせ後に確認しましょう</li>
              </ul>
            </div>

            {/* Part 1: Dialogues */}
            <section className="mb-10">
              <h2 className="text-lg font-bold border-b-2 border-indigo-800 pb-2 mb-6 text-indigo-900">
                Part 1　会話問題
                <span className="ml-3 text-sm font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">男女2人の会話 × 3</span>
              </h2>
              {data.dialogues.map((d, i) => (
                <DialoguePlayer key={d.id} item={d} index={i} />
              ))}
            </section>

            {/* Part 2: Monologue */}
            <section className="mb-10">
              <h2 className="text-lg font-bold border-b-2 border-teal-700 pb-2 mb-6 text-teal-900">
                Part 2　長文聴解
                <span className="ml-3 text-sm font-normal text-teal-600 bg-teal-50 px-2 py-0.5 rounded">学術モノローグ × 1</span>
              </h2>
              <MonologuePlayer item={data.monologue} />
            </section>

            {/* Part 3: Real-life */}
            <section className="mb-10">
              <h2 className="text-lg font-bold border-b-2 border-orange-600 pb-2 mb-6 text-orange-900">
                Part 3　Real-life Situation
                <span className="ml-3 text-sm font-normal text-orange-600 bg-orange-50 px-2 py-0.5 rounded">状況把握問題 × 1</span>
              </h2>
              <RealLifePlayer item={data.realLife} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
