'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { LISTENING_EXAMS, ListeningItem, ListeningPart } from '@/lib/listeningData';

const SPEAKER_LABELS: Record<string, { label: string; color: string }> = {
  '★':        { label: '男性A', color: 'text-blue-700' },
  '★★':       { label: '男性B', color: 'text-blue-500' },
  '☆':        { label: '女性A', color: 'text-rose-600' },
  '☆☆':       { label: '女性B', color: 'text-rose-400' },
  'Narrator':   { label: 'Narrator', color: 'text-gray-700' },
  'Interviewer':{ label: 'Interviewer', color: 'text-purple-700' },
  'Jason':      { label: 'Jason', color: 'text-green-700' },
};

function ScriptItem({ item, partNum }: { item: ListeningItem; partNum: number }) {
  const [showScript, setShowScript] = useState(false);

  return (
    <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={() => setShowScript(!showScript)}
      >
        <div className="font-medium text-gray-800">
          {partNum === 2 || partNum === 4
            ? <span>({item.id}) <em>{item.title}</em></span>
            : partNum === 3
            ? <span>({item.id}) <span className="text-sm font-normal text-gray-600">{item.situation}</span></span>
            : <span>No. {item.questions[0].number}</span>
          }
        </div>
        <span className="text-xs text-blue-600 underline">{showScript ? 'スクリプトを閉じる' : 'スクリプトを表示'}</span>
      </div>

      {showScript && (
        <div className="px-4 py-3 bg-white text-sm leading-relaxed">
          {partNum === 3 && item.situation && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-gray-700">
              <span className="font-bold text-yellow-800">【状況】</span> {item.situation}
            </div>
          )}
          {item.lines.map((line, i) => {
            const style = SPEAKER_LABELS[line.speaker] ?? { label: line.speaker, color: 'text-gray-700' };
            return (
              <div key={i} className="mb-2 flex gap-2">
                <span className={`font-bold min-w-[72px] text-right shrink-0 ${style.color}`}>{style.label}:</span>
                <span className="text-gray-800">{line.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        {item.questions.map((q) => (
          <p key={q.number} className="text-sm text-gray-700">
            <span className="font-bold text-gray-500">Q{q.number}.</span> {q.question}
          </p>
        ))}
      </div>
    </div>
  );
}

function PartPlayer({ part }: { part: ListeningPart }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  function changeRate(newRate: number) {
    setRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold border-b-2 border-gray-800 pb-2 mb-4">{part.label}</h2>
      <p className="text-sm text-gray-600 mb-4">{part.description}</p>

      {/* Audio Player */}
      <div className="bg-gray-900 text-white rounded-xl p-4 mb-6 flex flex-col gap-3">
        <audio
          ref={audioRef}
          src={part.audioFile}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          onEnded={() => setPlaying(false)}
        />
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center text-xl font-bold hover:bg-gray-200 transition"
          >
            {playing ? '⏸' : '▶'}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const t = Number(e.target.value);
                if (audioRef.current) audioRef.current.currentTime = t;
                setCurrentTime(t);
              }}
              className="w-full accent-white"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-gray-400 mr-1">速度:</span>
          {[0.75, 1.0, 1.25].map((r) => (
            <button
              key={r}
              onClick={() => changeRate(r)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${rate === r ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>

      {/* Script Items */}
      <div>
        {part.items.map((item) => (
          <ScriptItem key={item.id} item={item} partNum={part.part} />
        ))}
      </div>
    </div>
  );
}

export default function ListeningPage() {
  const exam = LISTENING_EXAMS[0]; // 2025年度第3回

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">英検1級 リスニング過去問</h1>
          <p className="text-sm text-gray-500">{exam.label}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/" className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
            ← 今日の問題へ
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-bold mb-1">📻 使い方</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>▶ ボタンで音声を再生してください</li>
            <li>各問題の「スクリプトを表示」で答え合わせができます</li>
            <li>速度を変えて繰り返し練習しましょう</li>
          </ul>
        </div>

        {exam.parts.map((part) => (
          <PartPlayer key={part.part} part={part} />
        ))}
      </div>
    </div>
  );
}
