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
   - The correct answer and a brief Japanese explanation

   **CRITICAL RULES FOR FILL-IN-BLANK CHOICES:**
   - **Grammar match**: ALL 4 choices must be grammatically compatible with both what comes before AND after the blank in the passage. Never create a choice that causes the surrounding sentence to break grammatically.
   - **Similar length**: Keep all 4 choices roughly the same length (within 2 words of each other) so no choice stands out visually as correct or wrong.
   - **No obviously wrong choices**: every choice must make logical sense given partial reading of the paragraph — differ in subtle meaning or scope, not in plausibility.`;

  // ===== 内容一致形式 (Part 3 style) =====
  const contentInstructions = `
2. **Reading Passage** (長文 - EIKEN Grade 1 Part 3 style):
   - Write a 3-4 paragraph passage (350-450 words) on the article topic
   - Difficulty: EIKEN Grade 1 level academic English
   - Structured argument with clear topic sentences and evidence

3. **Japanese translation** of the full passage:
   - Natural, accurate Japanese translation paragraph by paragraph

4. **4 Reading Comprehension Questions** (内容一致設問 - EIKEN Grade 1 Part 3 style):
   - **Question type distribution** (strictly follow this):
     * At least 2 of the 4 questions must be **inference questions** that require the reader to draw a conclusion not explicitly stated — use stems like "What does the author suggest/imply about...?", "What can be inferred from the passage about...?", "Which of the following best reflects the author's view of...?"
     * At least 2 of the 4 questions must ask about **the author's argument or claim** — use stems like "What does the author argue about...?", "What is the author's main point regarding...?", "What does the author suggest about...?"
     * Also include factual/detail questions with stems like "According to the passage...", "What is one thing that is stated about...?"
   - Each question has 4 choices that are COMPLETE SENTENCES (25-45 words each)

   **CRITICAL RULES FOR CORRECT ANSWERS:**
   - **No direct quotation**: The correct answer must NEVER be a copy-paste of a sentence from the passage. It must paraphrase the original using different vocabulary and sentence structure while preserving the meaning.

   **CRITICAL RULES FOR WRONG CHOICES — this is the most important part:**
   - **50% content overlap**: Every wrong choice must share at least 50% of its content with what the passage actually states. This means using the same subject, the same topic, the same key terms — only the relationship, scope, or degree is distorted. A student who read the passage carefully should need to re-read to confirm the choice is wrong.
   - **No obviously wrong choices**: NEVER write a choice that introduces a concept, person, or claim completely absent from the passage. Every distractor must feel like something the passage "almost" said.
   - **Use exactly these three distortion techniques** — assign each wrong choice one of the following:
     * **因果関係の逆転 (Causal reversal)**: Swap cause and effect. If the passage says "A led to B", the wrong choice says "B led to A", or "A was caused by B". The same facts appear, but the direction of causation is flipped.
     * **範囲の拡大 (Scope expansion)**: Broaden a limited claim into an absolute one. If the passage says "some studies suggest X", the wrong choice says "research has conclusively shown X" or "all cases demonstrate X". The core claim is preserved but overgeneralized.
     * **筆者の主張の誇張 (Exaggeration of author's claim)**: Take the author's actual argument and push it further than stated. If the author says "X may contribute to Y", the wrong choice says "X is the primary cause of Y" or "X alone determines Y". The direction is correct but the strength is inflated.
   - Distribute the three techniques across the three wrong choices (one technique per wrong choice).
   - A student who only half-understood the passage should find at least 2 choices plausible
   - The correct answer and a brief Japanese explanation citing the specific sentence/paragraph, and for each wrong choice note which distortion technique was used (因果逆転／範囲拡大／誇張)`;

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
      "question": "According to the passage, what did researchers discover about decision-making under conditions of abundant choice?",
      "choices": {
        "A": "Individuals who selected from a larger pool of options reported lower levels of satisfaction with their final decision than those who chose from a more restricted set of alternatives.",
        "B": "Researchers found that people with access to more choices made objectively better decisions, even though they spent considerably more time deliberating before reaching a conclusion.",
        "C": "The studies demonstrated that decision paralysis occurred only among individuals who lacked prior experience with the type of choice they were confronted with in the experiment.",
        "D": "Participants who were given extensive options ultimately learned to filter out irrelevant alternatives, leading to outcomes that were comparable to those made under limited-choice conditions."
      },
      "answer": "A",
      "explanation": "第2段落「individuals who had access to more choices tend to report lower levels of satisfaction」をparaphraseしたAが正解。B【範囲の拡大】選択肢数が多いほど決定の「質」が上がると本文の限定的な記述を拡大解釈している。C【因果関係の逆転】Decision paralysisの原因と結果を入れ替え、経験不足が原因であるかのように描いている。D【筆者の主張の誇張】筆者が示唆する「適応の可能性」を「同等の結果に達する」と過度に強めている。"
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

   **CRITICAL RULES FOR VOCABULARY QUESTIONS:**
   - **Difficulty**: Target a 30–60% correct-answer rate. The sentence context should not make the answer immediately obvious — a test-taker must know the precise meaning of the word.
   - **All 4 choices must be EIKEN Grade 1 level words** — never use common words (e.g., "show", "clear", "big") or obviously off-topic words (e.g., "irrigation" in a tech context)
   - **No obviously wrong choices**: every distractor must be a word that a student might plausibly consider given partial understanding of the sentence
   - **Match the part of speech**: all 4 choices must be the same grammatical category (all nouns, all verbs, all adjectives, or all adverbs). Never mix parts of speech across the 4 choices.

   **SELF-CHECK (mandatory before finalizing each vocabulary question):**
   After drafting each question, verify ALL of the following. If any check fails, revise the question before including it in the output.
   1. **Answer not leaked**: The correct answer word does NOT appear anywhere in the sentence (including in modified forms). If it does, rewrite the sentence.
   2. **Part of speech consistent**: All 4 choices (A, B, C, D) are the exact same part of speech. If not, replace the mismatched choice(s).
   3. **Grammatical fit**: Every one of the 4 choices can be inserted into the blank without causing a grammatical error. If a choice causes a grammar problem, replace it.
   4. **No obvious wrong answers**: Read each distractor and ask: "Could a student who partially understands the sentence seriously consider this?" If any choice is immediately dismissible, replace it with a more plausible distractor.
   5. **EIKEN Grade 1 level**: Confirm all 4 choices are genuinely Grade 1 level vocabulary. If any choice is below that level, replace it.
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
        "B": "reprimand",
        "C": "constraint",
        "D": "inducement"
      },
      "answer": "A",
      "explanation": "deterrent（抑止力）が文脈に最も合う。reprimand（叱責・懲戒）は処罰の一形態で惜しいが「法律違反への事前抑止」という意味がない。constraint（制約）は規制そのものを指し文脈がやや異なる。inducement（誘因）は違反を促す方向で意味が逆。"
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
