import Anthropic from '@anthropic-ai/sdk';
import { Article } from './rss';
import { WORD_BANK, WordEntry } from './wordbank';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 指定された日付の seed を元に単語帳から決定論的にサンプリング（同じ日は同じ単語）
 */
function sampleWords(count: number, seed?: number): WordEntry[] {
  const s = seed ?? new Date().getDate();
  // simple seeded shuffle using the date as seed
  const shuffled = [...WORD_BANK];
  let state = s * 1234567 + 89;
  for (let i = shuffled.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

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

function buildPrompt(article: Article, format: ReadingFormat, sampledWords: WordEntry[]): string {

  // ===== 穴埋め形式 (Part 2 style) =====
  const fillInBlankInstructions = `
2. **Reading Passage with 3 blanks** (長文穴埋め - EIKEN Grade 1 Part 2 style):
   - Write a 3-paragraph passage (300-400 words total) on the article topic
   - Difficulty: EIKEN Grade 1 level academic English
   - Place exactly 3 blanks marked as (1), (2), (3) — one blank per paragraph
   - Each blank replaces a SHORT PHRASE (3-8 words) that fits grammatically and logically
   - The blank should complete a sentence naturally, like these real EIKEN examples:
     * "These rogue waves were long assumed to ( )" → choices: "no longer exist" / "only occur during storms" / "be a thing of legend" / "be deadly to marine life"
     * "However, researchers have struggled ( )" → choices: "to find sailors willing to test them" / "with the difficulty of creating waves indoors" / "to understand these theories" / "with how unpredictable the ocean can be"

3. **Japanese translation** of the full passage:
   - Natural Japanese translation paragraph by paragraph
   - Mark blank positions as __(1)__, __(2)__, __(3)__

4. **3 Fill-in-blank Questions** (穴埋め設問):
   - One question per blank: "Which phrase best completes blank (N)?"
   - 4 choices each: SHORT PHRASES of 3-8 words, grammatically parallel, all plausible but only one fits
   - The correct answer and a brief Japanese explanation`;

  // ===== 内容一致形式 (Part 3 style) =====
  const contentInstructions = `
2. **Reading Passage** (長文 - EIKEN Grade 1 Part 3 style):
   - Write a 3-4 paragraph passage (350-450 words) on the article topic
   - Difficulty: EIKEN Grade 1 level academic English
   - Structured argument with clear topic sentences and evidence

3. **Japanese translation** of the full passage:
   - Natural, accurate Japanese translation paragraph by paragraph

4. **4 Reading Comprehension Questions** (内容一致設問 - EIKEN Grade 1 Part 3 style):
   - Use these question stems exactly as EIKEN does:
     * "According to the passage, ..."
     * "What is one thing that is stated about ...?"
     * "Which of the following statements best describes ...?"
     * "What does the author suggest about ...?"
   - Each question has 4 choices that are COMPLETE SENTENCES (20-40 words each)
   - Choices must be specific and detailed — like real EIKEN Grade 1 options, NOT vague one-liners
   - Three wrong choices should be plausible but contain subtle factual errors or misrepresentations
   - The correct answer and a brief Japanese explanation citing the relevant paragraph`;

  const readingInstructions = format === 'fill-in-blank'
    ? fillInBlankInstructions
    : contentInstructions;

  // ===== JSON examples =====
  const fillInBlankJsonExample = `  "readingPassage": "For decades, scientists have been studying the mysterious phenomenon of deep-sea bioluminescence, the ability of marine organisms to produce light. Researchers initially believed this trait evolved primarily as a defense mechanism, but new findings suggest it may ( 1 ) as well. Studies of various species have revealed unexpected complexity in how and when they produce light.\\n\\nThe scientific community has made significant advances in understanding bioluminescence, yet many questions remain. One major challenge has been ( 2 ), as the deep ocean environment makes direct observation extremely difficult. Recent technological innovations, however, have enabled researchers to collect data that was previously impossible to obtain.\\n\\nThese discoveries have implications beyond pure science. Bioluminescent compounds are increasingly being used in medical research and diagnostics. The natural light-producing mechanisms found in marine life have proven ( 3 ), inspiring engineers and biochemists to develop new tools for detecting diseases at an early stage.",
  "readingPassageJa": "数十年にわたり、科学者たちは深海生物の発光現象を研究してきた。研究者たちは当初、この特性は主に防御メカニズムとして進化したと考えていたが、新たな知見はそれが__(1)__でもあることを示唆している。さまざまな種の研究から、光を発する方法やタイミングにおける予想外の複雑さが明らかになった。\\n\\n科学界は生物発光の理解において大きな進歩を遂げたが、多くの疑問が残っている。主な課題の一つは__(2)__であり、深海環境が直接観察を非常に困難にしている。しかし最近の技術革新により、以前は不可能だったデータの収集が可能になった。\\n\\nこれらの発見は純粋な科学を超えた意義を持っている。発光化合物は医学研究や診断にますます活用されている。海洋生物に見られる自然の発光メカニズムは__(3)__ことが証明されており、エンジニアや生化学者が疾患を早期発見するための新しいツールを開発するヒントとなっている。",
  "readingQuestions": [
    {
      "number": 1,
      "question": "Which phrase best completes blank (1)?",
      "choices": {
        "A": "serve a communicative purpose",
        "B": "attract only larger predators",
        "C": "be unique to a single species",
        "D": "disappear under bright conditions"
      },
      "answer": "A",
      "explanation": "発光が防御だけでなくコミュニケーション目的でもあるという文脈に「コミュニケーション目的を果たす」が合う。"
    },
    {
      "number": 2,
      "question": "Which phrase best completes blank (2)?",
      "choices": {
        "A": "attracting sufficient research funding",
        "B": "replicating ocean conditions in labs",
        "C": "persuading governments to act",
        "D": "translating findings for the public"
      },
      "answer": "B",
      "explanation": "直後に「深海での直接観察が困難」とあるため、「実験室で海洋環境を再現すること」が文脈に合う。"
    },
    {
      "number": 3,
      "question": "Which phrase best completes blank (3)?",
      "choices": {
        "A": "too unstable for practical use",
        "B": "highly valuable to researchers",
        "C": "difficult to replicate artificially",
        "D": "limited in their medical applications"
      },
      "answer": "B",
      "explanation": "新ツール開発のヒントになっているという文脈から「研究者にとって非常に価値がある」が正解。"
    }
  ]`;

  const contentJsonExample = `  "readingPassage": "The passage text here (3-4 paragraphs, 350-450 words)...",
  "readingPassageJa": "日本語訳（段落ごと）...",
  "readingQuestions": [
    {
      "number": 1,
      "question": "According to the passage, what was the main conclusion of the researchers?",
      "choices": {
        "A": "Although initial results appeared promising, further investigation revealed that the proposed method had significant limitations that prevented it from being widely adopted.",
        "B": "The evidence gathered over several decades conclusively demonstrated that economic factors played a far more decisive role than previously assumed by experts in the field.",
        "C": "Despite widespread skepticism from the scientific community, the findings ultimately supported the original hypothesis put forward at the beginning of the study.",
        "D": "The data collected from multiple regions confirmed that environmental conditions varied too greatly for any single policy to be effective across all contexts."
      },
      "answer": "B",
      "explanation": "第2段落に「経済的要因が決定的な役割を果たした」と記述があり、Bが正解。他の選択肢は本文に記載がない。"
    }
  ]`;

  const readingJsonExample = format === 'fill-in-blank'
    ? fillInBlankJsonExample
    : contentJsonExample;

  const wordListText = sampledWords
    .map(w => `- ${w.word}：${w.meaning}（例：${w.phrase}）`)
    .join('\n');

  return `You are an expert English exam question creator specializing in EIKEN Grade 1 (英検1級) level questions. You have deep knowledge of the actual EIKEN Grade 1 exam format.

Based on the following news article, create authentic EIKEN Grade 1 style exam questions.

Article Title: ${article.title}
Source: ${article.source}
Content: ${article.content}

## Word Bank (英検1級単熟語EX より抜粋)
Use words from this list as the CORRECT ANSWERS for vocabulary questions. Choose 5 words from this list that can fit naturally into sentences related to the article topic. Use the remaining words in this list as WRONG CHOICES (distractors) where appropriate.

${wordListText}

Create the following in JSON format:

1. **5 Vocabulary Questions** (語彙問題 - EIKEN Grade 1 Part 1 style):
   - Each is a natural English sentence with ONE blank (____) for a difficult word
   - **IMPORTANT**: The correct answer MUST be one of the words from the Word Bank above
   - 4 choices (A, B, C, D): all single words, EIKEN Grade 1 level — use other words from the Word Bank as distractors
   - Only one word fits both grammar and meaning
   - Include the correct answer and a brief Japanese explanation of all 4 choices (include the Japanese meaning of each choice word)
${readingInstructions}

Return ONLY valid JSON in this exact format:
{
  "vocabQuestions": [
    {
      "number": 1,
      "sentence": "The strict regulations were intended to be a ____ to those who might otherwise violate environmental laws.",
      "blank": "deterrent",
      "choices": {
        "A": "deterrent",
        "B": "hallmark",
        "C": "specimen",
        "D": "gratuity"
      },
      "answer": "A",
      "explanation": "deterrent（抑止力）が文脈に最も合う。hallmark（特徴）、specimen（標本）、gratuity（チップ）は意味が合わない。"
    }
  ],
  ${readingJsonExample}
}`;
}

export async function generateQuestions(
  article: Article,
  format: ReadingFormat
): Promise<GeneratedQuestions> {
  const trimmedArticle = {
    ...article,
    content: article.content.slice(0, 2000),
  };
  // Sample 30 words from word bank (seeded by today's date for consistency)
  const jstDay = new Date(Date.now() + 9 * 60 * 60 * 1000).getDate();
  const sampledWords = sampleWords(30, jstDay);
  const prompt = buildPrompt(trimmedArticle, format, sampledWords);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
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
