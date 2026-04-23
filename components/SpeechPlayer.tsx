'use client';

import { useState, useRef } from 'react';

interface Props {
  text: string;
  label?: string;
}

const SPEEDS = [
  { label: '遅い', value: 0.75 },
  { label: '普通', value: 1.0 },
  { label: '速い', value: 1.3 },
];

export default function SpeechPlayer({ text, label = '読み上げ' }: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function play() {
    if (playing) return;
    setLoading(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('TTS failed');
      const { audioContent } = await res.json();

      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      audio.playbackRate = speed;
      audioRef.current = audio;

      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);

      await audio.play();
      setPlaying(true);
    } catch {
      // フォールバック: ブラウザTTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = speed;
      utterance.onend = () => setPlaying(false);
      window.speechSynthesis.speak(utterance);
      setPlaying(true);
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }

  function handleSpeedChange(value: number) {
    setSpeed(value);
    if (audioRef.current) {
      audioRef.current.playbackRate = value;
    }
  }

  return (
    <div className="no-print flex items-center gap-2 my-3">
      <button
        onClick={playing ? stop : play}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition ${
          playing
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : loading
            ? 'bg-gray-100 text-gray-400 cursor-wait'
            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
        }`}
      >
        {loading ? '読み込み中...' : playing ? '■ 停止' : `▶ ${label}`}
      </button>

      <div className="flex gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s.value}
            onClick={() => handleSpeedChange(s.value)}
            className={`px-2 py-1 text-xs rounded transition ${
              speed === s.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
