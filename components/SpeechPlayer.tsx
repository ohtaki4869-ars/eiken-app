'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  text: string;
  label?: string;
}

const SPEEDS = [
  { label: '遅い', value: 0.7 },
  { label: '普通', value: 1.0 },
  { label: '速い', value: 1.3 },
];

export default function SpeechPlayer({ text, label = '読み上げ' }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function getEnglishVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang === 'en-US' && v.localService) ||
      voices.find((v) => v.lang.startsWith('en-')) ||
      null
    );
  }

  function play() {
    if (!supported) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = speed;

    const voice = getEnglishVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }

  function stop() {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }

  function handleSpeedChange(value: number) {
    setSpeed(value);
    if (playing) {
      stop();
    }
  }

  if (!supported) return null;

  return (
    <div className="no-print flex items-center gap-2 my-3">
      <button
        onClick={playing ? stop : play}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition ${
          playing
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
        }`}
      >
        {playing ? (
          <>
            <span>■</span> 停止
          </>
        ) : (
          <>
            <span>▶</span> {label}
          </>
        )}
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
