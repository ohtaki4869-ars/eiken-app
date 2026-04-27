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
   - Each blank should be a phrase or clause (NOT a single word) — like actual EIKEN Grade 1 format
   - The blank phrase should be 3-8 words long and fit naturally into the sentence

3. **Japanese translation** of the reading passage (日本語訳):
   - Natural, accurate Japanese translation of the full passage including the blank positions
   - Use __(1)__, __(2)__ etc. to mark blank positions in the Japanese translation

4. **4 Fill-in-the-blank Questions** (穴埋め問題):
   - One question per blank: "Which phrase best fits blank (N)?"
   - 4 choices each (A, B, C, D) — all are phrases of similar length, only one is correct
   - Choices should be plausible but clearly distinguishable — like actual EIKEN Grade 1
   - The correct answer and a brief Japanese explanation`
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
      ? `  "readingPassage": "Global temperatures have risen (1) over the past century, causing widespread concern among scientists. The primary driver is the emission of greenhouse gases, particularly carbon dioxide. Governments worldwide have attempted to (2) through various international agreements. However, progress has been slow, partly because many nations (3) when economic growth is at stake. Scientists warn that without immediate action, the consequences (4) for future generations.",
  "readingPassageJa": "世界の気温は過去1世紀にわたって__(1)__上昇しており、科学者の間で広く懸念されている。主な原因は温室効果ガスの排出、特に二酸化炭素である。世界各国の政府はさまざまな国際協定を通じて__(2)__しようとしてきた。しかし、多くの国が経済成長が危ぶまれると__(3)__ため、進展は遅い。科学者たちは、即座の行動なしには、将来世代への影響が__(4)__と警告している。",
  "readingQuestions": [
    {
      "number": 1,
      "question": "Which phrase best fits blank (1)?",
      "choices": {
        "A": "at an unprecedented rate",
        "B": "in a gradual and predictable manner",
        "C": "with negligible consequences",
        "D": "due to natural climate cycles"
      },
      "answer": "A",
      "explanation": "「前例のない速さで」が文脈に最も合う。急激な気候変動の深刻さを表す表現。"
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
