// 週次エッセイ・隔週要約で共通して使うテーマカテゴリ（出題履歴と照合し偏りを避ける）
export const THEME_CATEGORIES = [
  '教育',
  '環境・気候',
  '経済・ビジネス',
  '国際関係',
  'テクノロジー',
  '社会制度',
  '医療・健康',
  '文化・メディア',
] as const;

export type ThemeCategory = typeof THEME_CATEGORIES[number];

export interface EssayTopic {
  topic: string;        // "Agree or disagree: ~" / "Should ~?" 形式のTOPIC文
  theme: ThemeCategory;
  wordCountMin: number;  // 200
  wordCountMax: number;  // 240
  generatedAt: string;
}

export interface DailyExpressionTarget {
  id: string;
  label: string;
  category: string;
}

export interface DailyExpressionPrompt {
  targetExpressions: DailyExpressionTarget[]; // 1〜2個
  instruction: string;      // 日本語の作文指示文
  referenceVocab?: string[];
  generatedAt: string;
}

export interface SummaryPassage {
  passage: string;        // 3段落・300語程度の英文パッセージ
  theme: ThemeCategory;
  wordCountMin: number;    // 90
  wordCountMax: number;    // 110
  sourceWordCount: number;
  generatedAt: string;
}
