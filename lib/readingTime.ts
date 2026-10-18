// 読解問題の目標解答時間（英検1級本番の時間配分を想定）。
// 目標時間(分) = ceil(本文語数 / WPM + 設問数 × 1問あたりの処理時間)
// LLM生成には関与せず、表示時に本文と設問数から算出する。定数はここで調整する。
// claude.ts（サーバー専用SDKを含む）からも読み込まれるため、このファイルは実行時importを持たない。
import type { ReadingFormat } from './claude';

export const READING_WPM = 200;

export const MINUTES_PER_QUESTION: Record<ReadingFormat, number> = {
  content: 2.5,
  'fill-in-blank': 1.5,
};

// 空白区切りの語数。checkPassageWordCount（lib/claude.ts）のバリデーションと共通。
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function calcTargetMinutes(passage: string, format: ReadingFormat, questionCount: number): number {
  return Math.ceil(countWords(passage) / READING_WPM + questionCount * MINUTES_PER_QUESTION[format]);
}
