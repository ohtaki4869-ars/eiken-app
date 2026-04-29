import Anthropic from '@anthropic-ai/sdk';
import { Article } from './rss';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ReadingFormat = 'content' | 'fill-in-blank';

export interface VocabQuestion {
  number: number;
  sentence: string;
  blank: string;
  choices: { A: string; B: string; C: string; D: string };
  answer: string;
  explanation: string;
}

export interface ReadingQuestion {
  number: number;
  question: string;
  choices: { A: string; B: string; C: string; D: string };
  answer: string;
  explanation: string;
}

export interface GeneratedQuestions {
  article: Article;
  readingFormat: ReadingFormat;
  vocabQuestions: VocabQuestion[];
  readingPassage: string;
  readingPassageJa: string;
  readingQuestions: ReadingQuestion[];
  generatedAt: string;
}

export function getTodayFormat(): ReadingFormat {
  const day = new Date().getDate();
  return day % 2 === 1 ? 'content' : 'fill-in-blank';
}

function buildPrompt(article: Article, format: ReadingFormat): string {
  const readingInstructions =
    format === 'fill-in-blank'
      ? `
2. **1 Reading Passage with blanks** (穴埋め長文):
   - A 300-400 word passage based on or inspired by the article topic
   - Written at EIKEN Grade 1 difficulty level
   - Insert exactly 4 blanks into the passage, marked as (1), (2), (3), (4)
   - Each blank must be a position where a COMPLETE SENTENCE can be inserted (not a word or phrase)
   - Place blanks between paragraphs or at the end of a paragraph — like actual EIKEN Grade 1 format
   - The blank sentence should logically connect or conclude the surrounding paragraphs

3. **Japanese translation** of the reading passage (日本語訳):
   - Natural, accurate Japanese translation of the full passage including the blank positions
   - Use __(1)__, __(2)__ etc. to mark blank positions in the Japanese translation

4. **4 Fill-in-the-blank Questions** (穴埋め問題):
   - One question per blank: "Which sentence best fits blank (N)?"
   - 4 choices each (A, B, C, D) — all are COMPLETE SENTENCES of similar style and length
   - Only one choice logically fits the context; the others are plausible but clearly wrong
   - Choices should be 10-20 words each — exactly like actual EIKEN Grade 1 level
   - The correct answer and a brief Japanese explanation of why it fits`
      : `
2. **1 Reading Passage** (長文):
   - A 300-400 word passage based on or inspired by the article topic
   - Written at EIKEN Grade 1 difficulty level

3. **Japanese translation** of the reading passage (日本語訳):
   - Natural, accurate Japanese translation of the passage
   - Paragraph by paragraph, matching the English structure

4. **4 Reading Comprehension Questions** (長文読解問題):
   - Questions about the content of the reading passage
   - 4 choices each (A, B, C, D)
   - The correct answer and a brief Japanese explanation`;

  const readingJsonExample =
    format === 'fill-in-blank'
      ? `  "readingPassage": "Global temperatures have risen dramatically over the past century, alarming scientists worldwide. The primary cause is the burning of fossil fuels, which releases vast amounts of carbon dioxide into the atmosphere. (1)\n\nDespite growing awareness, international efforts to curb emissions have met with limited success. The Paris Agreement set ambitious targets, yet many countries have struggled to meet their commitments. (2)\n\nSome economists argue that transitioning to renewable energy will ultimately boost economic growth. They point to the rapid decline in solar and wind energy costs as evidence of this trend. (3)\n\nHowever, the transition requires significant upfront investment, which remains a barrier for developing nations. Without financial support from wealthier countries, many regions may be left behind. (4)",
  "readingPassageJa": "世界の気温は過去1世紀にわたって劇的に上昇しており、世界中の科学者を不安にさせている。主な原因は化石燃料の燃焼であり、それによって大量の二酸化炭素が大気中に放出される。__(1)__\n\n意識が高まっているにもかかわらず、排出量削減のための国際的な取り組みは限られた成果しか上げられていない。パリ協定は野心的な目標を設定したが、多くの国がその約束を果たすのに苦労している。__(2)__\n\n一部の経済学者は、再生可能エネルギーへの移行が最終的に経済成長を促進すると主張する。彼らは太陽光・風力エネルギーコストの急激な低下をその証拠として挙げる。__(3)__\n\nしかし、この移行には多大な初期投資が必要であり、発展途上国にとっては依然として障壁となっている。裕福な国々からの財政支援なしには、多くの地域が取り残されるかもしれない。__(4)__",
  "readingQuestions": [
    {
      "number": 1,
      "question": "Which sentence best fits blank (1)?",
      "choices": {
        "A": "Without drastic action, average temperatures could rise by 3°C by the end of this century.",
        "B": "Scientists have long celebrated the economic benefits of industrial development.",
        "C": "Many governments have decided to increase their reliance on coal power plants.",
        "D": "The cooling of ocean temperatures has helped offset some of these changes."
      },
      "answer": "A",
      "explanation": "気候変動の深刻さを強調する文として、「抜本的な対策なしには今世紀末までに3℃上昇」が文脈に最も合う。"
    }
  ]`
      : `  "readingPassage": "The passage text here...",
  "readingPassageJa": "日本語訳をここに記載...",
  "readingQuestions": [
    {
      "number": 1,
      "question": "According to the passage, what is the main reason for...?",
      "choices": {
        "A": "choice A",
        "B": "choice B",
        "C": "choice C",
        "D": "choice D"
      },
      "answer": "B",
      "explanation": "第2段落に「...」とあり、Bが正解。"
    }
  ]`;

  return `You are an expert English exam question creator specializing in EIKEN Grade 1 (英検1級) level questions.

Based on the following news article, create exam questions in the style of EIKEN Grade 1.

Article Title: ${article.title}
Source: ${article.source}
Content: ${article.content}

Please create the following in JSON format:

1. **5 Vocabulary Questions** (語彙問題):
   - Each question is a sentence with a blank (____) where a difficult English word should go
   - 4 choices (A, B, C, D) with EIKEN Grade 1 level vocabulary
   - The correct answer and a brief Japanese explanation
${readingInstructions}

Return ONLY valid JSON in this exact format:
{
  "vocabQuestions": [
    {
      "number": 1,
      "sentence": "The government's ____ policy on immigration has sparked debate.",
      "blank": "stringent",
      "choices": {
        "A": "stringent",
        "B": "lenient",
        "C": "ambiguous",
        "D": "redundant"
      },
      "answer": "A",
      "explanation": "stringent（厳格な）が文脈に最も合う。lenient（寛大な）、ambiguous（曖昧な）、redundant（余分な）"
    }
  ],
  ${readingJsonExample}
}`;
}

export async function generateQuestions(
  article: Article,
  format: ReadingFormat
): Promise<GeneratedQuestions> {
  // 記事内容を2000文字に制限してトークン超過を防ぐ
  const trimmedArticle = {
    ...article,
    content: article.content.slice(0, 2000),
  };
  const prompt = buildPrompt(trimmedArticle, format);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // JSON部分を抽出（複数の方法を試みる）
  let parsed;
  try {
    // まずテキスト全体をJSONとして試みる
    parsed = JSON.parse(text);
  } catch {
    // 次に最初の { から最後の } までを抽出
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      console.error('Claude response:', text.slice(0, 500));
      throw new Error('Failed to parse JSON from Claude response');
    }
    try {
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Claude response:', text.slice(0, 500));
      throw new Error('Failed to parse JSON from Claude response');
    }
  }

  return {
    article,
    readingFormat: format,
    vocabQuestions: parsed.vocabQuestions,
    readingPassage: parsed.readingPassage,
    readingPassageJa: parsed.readingPassageJa,
    readingQuestions: parsed.readingQuestions,
    generatedAt: new Date().toISOString(),
  };
}
