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

export interface ChoiceAnnotation {
  translation: string;
  pos?: string;         // 品詞: 動/名/形/副 (語彙問題のみ)
  collocation?: string; // "word + A / word + B" (語彙問題のみ)
  incorrectReason?: string;
}

export interface ChoiceAnnotationSet {
  A: ChoiceAnnotation;
  B: ChoiceAnnotation;
  C: ChoiceAnnotation;
  D: ChoiceAnnotation;
}

export interface ConfusingPair {
  choiceA: string;
  choiceB: string;
  explanation: string;
}

export interface ChoiceAnnotations {
  vocabulary: ChoiceAnnotationSet[];
  reading: ChoiceAnnotationSet[];
}

export type DifficultyLevel = 'A' | 'B' | 'C' | 'D' | 'E';

export interface DifficultyScore {
  vocab_score: number;
  dummy_score: number;
  context_score: number;
  inference_score: number;
  question_score: number;
  overall_score: number;
  difficulty: DifficultyLevel;
  reason: string;
}

export interface GeneratedQuestions {
  article: Article;
  readingFormat: ReadingFormat;
  vocabQuestions: VocabQuestion[];
  readingPassage: string;
  readingPassageJa: string;
  readingQuestions: ReadingQuestion[];
  generatedAt: string;
  difficultyScore?: DifficultyScore;
  choiceAnnotations?: ChoiceAnnotations;
  confusingPairs?: ConfusingPair[];
}

export function getTodayFormat(): ReadingFormat {
  const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const day = jstDate.getUTCDate();
  return day % 2 === 1 ? 'content' : 'fill-in-blank';
}

function buildPrompt(article: Article, format: ReadingFormat, sampledWords: WordEntry[]): string {

  // ===== 穴埋め形式 (Part 2 style) =====
  const fillInBlankInstructions = `
2. **Reading Passage with 3 blanks** (長文穴埋め - EIKEN Grade 1 Part 2 style):
   - Write a 3-paragraph passage (300-400 words total) on the article topic
   - Difficulty: EIKEN Grade 1 level academic English
   - Place exactly 3 blanks marked as (1), (2), (3) — exactly one blank per paragraph
   - Each blank replaces a SHORT PHRASE (3-8 words) that fits grammatically and logically
   - **Blank placement**: position blanks in the middle or end of a sentence — NEVER at the start of a paragraph
   - **Context design**: the 5 words before and after each blank must provide meaningful context clues
   - The blank should complete a sentence naturally, like these real EIKEN examples:
     * "These rogue waves were long assumed to ( )" → choices: "no longer exist" / "only occur during storms" / "be a thing of legend" / "be deadly to marine life"
     * "However, researchers have struggled ( )" → choices: "to find sailors willing to test them" / "with the difficulty of creating waves indoors" / "to understand these theories" / "with how unpredictable the ocean can be"

3. **Japanese translation** of the full passage:
   - Natural Japanese translation paragraph by paragraph
   - Mark blank positions as __(1)__, __(2)__, __(3)__

4. **3 Fill-in-blank Questions** (穴埋め設問):
   - One question per blank: "Which phrase best completes blank (N)?"
   - 4 choices each: SHORT PHRASES of 3-8 words, all plausible but only one fits
   - The correct answer and a brief Japanese explanation

   **CRITICAL RULES FOR FILL-IN-BLANK CHOICES:**
   - **Grammar match**: ALL 4 choices must connect grammatically with both what comes before AND after the blank. Never create a choice that breaks the surrounding sentence.
   - **Similar length**: Keep all 4 choices within ±2 words of each other so no choice stands out visually.
   - **Two distortion techniques** — use one per wrong choice (技法A for one wrong choice, 技法B for another):
     * 技法A「方向性の逆転」: content that reverses the passage's flow (e.g., if passage implies growth, the wrong choice implies decline)
     * 技法B「部分的整合」: uses correct keywords but the logic doesn't fit the paragraph's argument
   - **No obviously wrong choices**: every choice must feel plausible to someone who read the paragraph once.

   **SELF-CHECK（穴埋め・4項目）:**
   - [ ] 各段落に空欄が1つずつある（計3つ）
   - [ ] 選択肢の語数が±2語以内
   - [ ] 正解以外の選択肢も文法的に前後と接続可能
   - [ ] 誤答に「明らかな外れ」がない（本文と無関係な内容は禁止）`;

  // ===== 内容一致形式 (Part 3 style) =====
  const contentInstructions = `
2. **Reading Passage** (長文 - EIKEN Grade 1 Part 3 style):
   - Write a 3-4 paragraph passage (350-450 words) on the article topic
   - Difficulty: EIKEN Grade 1 level academic English
   - Structured argument with clear topic sentences and evidence

3. **Japanese translation** of the full passage:
   - Natural, accurate Japanese translation paragraph by paragraph

4. **4 Reading Comprehension Questions** — EXACTLY 4 questions, no more, no less.
   **Question type distribution (strictly follow this):**
   - 推論問題 2問以上: require drawing a conclusion NOT explicitly stated
     stems: "What can be inferred from the passage about...?", "What does the author imply about...?", "Which of the following best reflects the author's view of...?"
   - 筆者の主張問題 2問以下: ask about the author's argument
     stems: "What does the author argue about...?", "What is the author's main point regarding...?"
   - 細部一致問題 1問まで: factual detail only
     stems: "According to the passage...", "What is one thing stated about...?"
   - Each question has 4 choices that are COMPLETE SENTENCES (25-45 words each)

   **CRITICAL RULES FOR CORRECT ANSWERS:**
   - **No direct quotation**: NEVER copy-paste from the passage.
   - **True paraphrase = word substitution AND syntactic restructuring BOTH**:
     ❌ NG: "the conditions focus on territorial integrity" → "the conditions address territorial integrity"（語の置換のみ）
     ✅ OK: "the conditions focus on territorial integrity" → "preserving national borders forms the basis of the proposed framework"

   **CRITICAL RULES FOR WRONG CHOICES:**
   Assign exactly one technique per wrong choice (技法1 / 技法2 / 技法3, one each):

   **技法1「因果関係の逆転」**
   Swap cause and effect from the passage.
   例: 本文「Aが起きたのでBになった」→ 誤答「BのためにAが生じた」

   **技法2「範囲の拡大・過度な一般化」**
   Broaden a limited claim into an absolute one.
   例: 本文「英国で導入」→ 誤答「すべての先進国で導入」
   例: 本文「一部の専門家が懸念」→ 誤答「すべての専門家が反対」

   **技法3「筆者の主張の誇張・断定化」**
   Turn a tentative claim into a certainty.
   例: 本文「～する可能性がある（could / may）」→ 誤答「～することが証明された / 必ず～する」
   例: 本文「～が重要だと示唆する」→ 誤答「～が唯一の解決策であると断言する」

   **Keyword overlap requirement**: Each wrong choice must include at least 2 actual keywords from the passage (same subject, proper nouns, or technical terms). Never introduce concepts completely absent from the passage.

   **Explanation format for each reading question:**
   【解説文体ルール（必須）】
   ■ 断定形で書く。「〜とも読める」「ただし〜」等の留保表現は禁止。
   ■ 各選択肢をA/B/C/Dで明示し、記号順（A→B→C→D）に記述すること
   ■ 技法3「誇張・断定化」を使った誤答の場合は、本文の「可能性・当為」と誤答の「必然・義務」の具体的な差を示す
     例：「本文はvigilant oversightという自発的改善を述べており、government controlsという外部強制の必然性までは主張していない」

   【正解】本文の該当箇所を必ず引用：「本文に'～'とあり、これをparaphraseすると正解の'～'に対応する」。推論問題の場合は「本文の'A'と'B'から推論できる」と複数箇所を示す。
   【各誤答】記号と技法を明示：
     【B: ...】技法1「因果関係の逆転」→「本文では原因と結果が逆に記述されている」
     【C: ...】技法2「範囲の拡大」  →「本文では'～に限定'されているが、選択肢では過度に一般化している」
     【D: ...】技法3「誇張・断定化」→「本文では'could/may'と可能性で述べているが、選択肢では断定している」
     技法4「本文に根拠なし」→「この内容は本文中に記述がない」（使用時のみ）

   **SELF-CHECK（内容一致・5項目）:**
   - [ ] 問題数が4問である
   - [ ] 正解がparaphrase（語の言い換え＋構文変換の両方）されている
   - [ ] 誤答3択に技法1・2・3が1つずつ割り当てられている
   - [ ] 各誤答に本文キーワードが2語以上含まれている
   - [ ] 誤答に「明らかな外れ」がない`;

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
   - Include the correct answer with a structured Japanese explanation following this format:

     【解説文体ルール（必須）】
     ■ 断定形で書く。「〜とも読める」「とも言える」「ただし〜」「あり得るが」「解釈もある」等の留保表現は禁止。
       NG：「waneが正解。ただしcontrastive読みもあり得るが〜」
       OK：「時間経過とともに関心が薄れるという文脈でwaneが最適。直後の節はwaneの進行を抑制する対比表現である」
     ■ 選択肢をA/B/C/Dで言及すること
       各不正解をその記号と単語テキストで明示する。例：【B: curtail】パターンB「〜」
       記号順（A→B→C→D）に記述すること
     ■ 解説文中で正解語を記述する際は問題文の表記と完全に一致させること（タイポ禁止）
     ■ 正解語の固有ニュアンスを1文で示す（訳語の羅列ではなく文脈での機能を優先）
       例：「事前に手を打つことで問題を未然に防ぐというobviate固有のニュアンスが文脈と合致」
     ■ 正解と最も混同しやすい選択肢との違いを1文で必ず言及すること

     【正解】問題文の該当箇所を引用し、正解語固有のニュアンスで説明。
     【不正解各選択肢】記号と単語を明示しパターンを示す：
       パターンA「意味が逆」：正解と反対方向の意味を持つ
       パターンB「意味が近いが文脈の焦点がズレる」：ニュアンスの違いを具体的に1文で
       パターンC「文脈と無関係」：なぜ文脈に合わないかを一言
     【紛らわしいペア】正解と最も混同しやすい選択肢がある場合は「XvsY：違いの1文説明」を追記

   **【選択肢設計ルール（必須）】**

   ■ **品詞統一**
   全4択の品詞を統一する（全て動詞の原形、全て名詞、全て形容詞 等）。
   品詞が1つでも異なる場合はその問題全体を作り直す。

   ■ **意味カテゴリー分散（NEW）**
   誤答3択は以下の条件を満たすこと：
   - 正解語と「同じ意味カテゴリーに属する語」は1択以内に抑える
   - 残り2択は異なる意味カテゴリーから選ぶ
   意味カテゴリーの例：
     感情系: skepticism / wariness / complacency / elation
     破壊・損傷系: rubble / debris / ruins / wreckage
     促進・強化系: galvanize / consolidate / bolster / fortify
     欠乏系: dearth / scarcity / paucity / shortage
   ❌ 悪い例（全て同カテゴリー）: 1 rubble  2 shambles  3 ruins  4 debris
   ✅ 良い例（カテゴリー分散）: 1 rubble（破壊系）  2 reprieve（猶予系）  3 complacency（感情系）  4 condemnation（批判系）

   ■ **難易度**
   - 全4択が英検1級水準
   - 正解率30〜60%を想定（文脈から推測しにくい語を優先）

   **SELF-CHECK（語彙・5項目、出力前に必ず確認）:**
   - [ ] 正解語が問題文中に出現していない（活用形・派生語も含む）
   - [ ] 問題文に ____ が1箇所だけある
   - [ ] 全4択の品詞が一致している
   - [ ] 誤答3択が異なる意味カテゴリーに分散している
   - [ ] 全4択が英検1級レベルである
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
      "explanation": "【正解】文中の'regulations were intended to be a ____ to those who might otherwise violate'より、法律違反を未然に防ぐ「抑止力」を意味するdeterrentが最適。単なる制限でなく違反意図そのものを抑える語が必要。【B: reprimand】パターンB「意味が近いが焦点がズレる」─事後的な「叱責・懲戒」であり、違反を未然に抑止するdeterrentとは機能が異なる。deterrent vs reprimand：deterrentは「未然防止」、reprimandは「事後対処」。【C: constraint】パターンB「意味が近いが焦点がズレる」─「制約」そのものを指し、違反への抑止という心理的作用を持たない。【D: inducement】パターンA「意味が逆」─違反を促す「誘因」であり、意味が逆。"
    }
  ],
  ${readingJsonExample}
}`;
}

// ===== 選択肢アノテーション生成 =====
function buildAnnotationPrompt(questions: GeneratedQuestions): string {
  const vocabSummary = questions.vocabQuestions.map((q, i) => {
    const choices = Object.entries(q.choices).map(([k, v]) => `${k}: ${v}`).join(' / ');
    return `語彙(${i + 1}) 正解:${q.answer} | ${choices}`;
  }).join('\n');

  const readingSummary = questions.readingQuestions.map((q, i) => {
    const choices = Object.entries(q.choices).map(([k, v]) => `${k}: ${v.slice(0, 80)}`).join('\n    ');
    return `読解(${i + 1}) 正解:${q.answer}\n    ${choices}`;
  }).join('\n');

  return `英検1級の問題について、各選択肢のアノテーションを生成してください。

## 語彙問題（全選択肢が1語の英単語）
${vocabSummary}

## 読解問題
${readingSummary}

## ルール
【語彙問題の各選択肢】
- translation: 文脈に即した日本語訳（8字以内）
- pos: 品詞を漢字1字で（動/名/形/副）
- collocation: よく使うコロケーション2例を "A / B" 形式で（例: "obfuscate the issue / obfuscate the truth"）
- incorrectReason: 不正解の選択肢のみ。パターンA/B/Cを明記（25字以内）
  パターンA「意味が逆」/パターンB「焦点がズレる」/パターンC「文脈と無関係」

【読解問題の各選択肢】
- translation: 自然な日本語訳（直訳禁止、主語・接続詞を補う）
- pos: ""（空文字）
- collocation: ""（空文字）
- incorrectReason: 不正解の選択肢のみ。技法1/2/3を明記（30字以内）

【正解選択肢のincorrectReason】省略（フィールドごと省く）

## 出力形式（JSONのみ）
{
  "choiceAnnotations": {
    "vocabulary": [
      {
        "A": { "translation": "抑止力", "pos": "名", "collocation": "a deterrent effect / act as a deterrent" },
        "B": { "translation": "叱責", "pos": "名", "collocation": "a formal reprimand / receive a reprimand", "incorrectReason": "パターンB: 事後対処で文脈に不一致" },
        "C": { "translation": "制約", "pos": "名", "collocation": "a legal constraint / under constraint", "incorrectReason": "パターンB: 心理的抑止力なし" },
        "D": { "translation": "誘因", "pos": "名", "collocation": "financial inducement / an inducement to act", "incorrectReason": "パターンA: 意味が逆（誘発）" }
      }
    ],
    "reading": [
      {
        "A": { "translation": "正解の自然な日本語訳", "pos": "", "collocation": "" },
        "B": { "translation": "誤答の訳", "pos": "", "collocation": "", "incorrectReason": "技法2: 英国限定を全先進国に拡大" },
        "C": { "translation": "誤答の訳", "pos": "", "collocation": "", "incorrectReason": "技法1: 因果関係が逆" },
        "D": { "translation": "誤答の訳", "pos": "", "collocation": "", "incorrectReason": "技法3: 可能性を断定化" }
      }
    ]
  },
  "confusingPairs": [
    { "choiceA": "deterrent", "choiceB": "reprimand", "explanation": "deterrentは未然防止、reprimandは事後対処。" }
  ]
}`;
}

async function generateAnnotations(questions: GeneratedQuestions): Promise<{ choiceAnnotations: ChoiceAnnotations; confusingPairs: ConfusingPair[] } | null> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: buildAnnotationPrompt(questions) }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('[Annotations] Response length:', text.length, '| First 200:', text.slice(0, 200));
    const result = parseJson(text) as { choiceAnnotations: ChoiceAnnotations; confusingPairs: ConfusingPair[] };
    console.log('[Annotations] Parse success. vocab:', result.choiceAnnotations?.vocabulary?.length, 'reading:', result.choiceAnnotations?.reading?.length);
    return result;
  } catch (e) {
    console.error('[Annotations] FAILED:', String(e));
    return null;
  }
}

// ===== 選択肢シャッフル =====
function shuffleChoices<T extends { choices: { A: string; B: string; C: string; D: string }; answer: string }>(q: T): T {
  const keys = ['A', 'B', 'C', 'D'] as const;
  const values = keys.map(k => q.choices[k]);
  const correctValue = q.choices[q.answer as keyof typeof q.choices];

  // Fisher-Yates shuffle
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  const newChoices = { A: values[0], B: values[1], C: values[2], D: values[3] };
  const newAnswer = keys[values.findIndex(v => v === correctValue)];
  return { ...q, choices: newChoices, answer: newAnswer };
}

// ===== コードバリデーション（機械チェック） =====
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateVocabQuestions(questions: VocabQuestion[]): ValidationResult {
  const errors: string[] = [];

  questions.forEach((q, i) => {
    const num = i + 1;
    const answer = q.choices[q.answer as keyof typeof q.choices];
    const sentence = q.sentence;

    // チェック①: 空所が存在するか
    if (!sentence.includes('____')) {
      errors.push(`語彙(${num}): 空所 ____ が存在しない`);
    }

    // チェック②: 空所が1つだけか
    const blankCount = (sentence.match(/____/g) || []).length;
    if (blankCount > 1) {
      errors.push(`語彙(${num}): 空所が${blankCount}個ある（1つのみ許可）`);
    }

    // チェック③: 正解語が文中に露出していないか（大文字小文字・語幹も考慮）
    const sentenceWithoutBlank = sentence.replace(/____/g, '');
    const answerLower = answer?.toLowerCase() ?? '';
    // 語幹チェック（最初の5文字が一致する語が含まれていないか）
    const answerStem = answerLower.slice(0, 5);
    if (answerStem.length >= 4 && sentenceWithoutBlank.toLowerCase().includes(answerStem)) {
      errors.push(`語彙(${num}): 正解語 "${answer}" またはその語幹が問題文中に露出している可能性がある`);
    }

    // チェック④: 選択肢が4つあるか
    const choiceValues = Object.values(q.choices);
    if (choiceValues.length !== 4) {
      errors.push(`語彙(${num}): 選択肢が${choiceValues.length}個（4つ必要）`);
    }

    // チェック⑤: 選択肢に重複がないか
    const unique = new Set(choiceValues.map(c => c.toLowerCase()));
    if (unique.size !== choiceValues.length) {
      errors.push(`語彙(${num}): 選択肢に重複がある`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// ===== JSON parser helper =====
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found');
    return JSON.parse(text.slice(start, end + 1));
  }
}

// ===== 校閲プロンプト =====
function buildReviewPrompt(draft: GeneratedQuestions): string {
  const draftJson = JSON.stringify({
    vocabQuestions: draft.vocabQuestions,
    readingPassage: draft.readingPassage,
    readingPassageJa: draft.readingPassageJa,
    readingQuestions: draft.readingQuestions,
  }, null, 2);

  return `You are a strict quality controller for EIKEN Grade 1 (英検1級) exam questions.
Review the following draft and fix every issue. Return corrected JSON only — no explanation outside the JSON.

## Draft
${draftJson}

---

## 【校閲対象：語彙（3項目）】
※ 空所の存在・正解語露出はコード検証済みのため確認不要。

1. **品詞統一**: 全4択が同じ品詞（名詞・動詞・形容詞・副詞）か確認する。
   → 不一致があれば、品詞を揃えて同レベルのEIKEN Grade 1語に差し替える。

2. **意味カテゴリー分散**: 誤答3択が異なる意味カテゴリーに分散しているか確認する。
   → 同カテゴリーが2択以上ある場合、1択を別カテゴリーの語に差し替える。
   例：破壊系が3択並んでいたら1択を感情系や批判系に変える。

3. **英検1級レベル**: 全4択が英検1級水準か確認する。
   → 不足する語があれば同品詞・同カテゴリーの1級語に差し替える。

## 【校閲対象：読解（4項目）】

4. **正解のparaphrase**: 正解選択肢が本文のコピペでないか確認する。
   → コピペの場合、語の言い換え＋構文変換の**両方**を施して修正する。
   ❌ NG: 語を1語置換しただけ（"focus on" → "address"）
   ✅ OK: 語も構文も変える（"preserving national borders forms the basis of..."）

5. **3技法の割り当て**: 誤答3択に因果逆転・範囲拡大・誇張が1つずつ使われているか。
   → 不足・重複がある場合、対象の選択肢を作り直す。

6. **本文キーワードの含有**: 各誤答に本文の実際のキーワードが2語以上含まれているか。
   → 含まれていない誤答は、本文の語句を活用した形に修正する。

7. **明らかな外れの排除**: 本文と全く無関係な誤答がないか確認する。
   → 無関係な誤答は本文の内容に基づいて作り直す。

## Output Rules
- 修正箇所がある場合：修正済みJSONを返す。
- 修正箇所がない場合：元のJSONをそのまま返す。
- JSON以外のテキストを出力しないこと。
- 入力と同じ構造のJSONを返すこと。`;
}

// ===== 解説バリデーション =====
function validateExplanationMapping(questions: GeneratedQuestions): ValidationResult {
  const errors: string[] = [];
  const hedgePatterns = ['とも読める', 'とも言える', 'ただし', 'あり得るが', '解釈もある'];

  questions.vocabQuestions.forEach((q, i) => {
    const text = q.explanation;
    const correctWord = q.choices[q.answer as keyof typeof q.choices];

    // 正解語のタイポチェック
    if (correctWord && !text.includes(correctWord)) {
      errors.push(`語彙(${i + 1}): 解説に正解語「${correctWord}」が見当たらない（タイポの可能性）`);
    }

    // 留保表現チェック
    hedgePatterns.forEach(p => {
      if (text.includes(p)) {
        errors.push(`語彙(${i + 1}): 留保表現「${p}」が含まれている（断定形で書くこと）`);
      }
    });
  });

  questions.readingQuestions.forEach((q, i) => {
    const text = q.explanation;
    hedgePatterns.forEach(p => {
      if (text.includes(p)) {
        errors.push(`読解(${i + 1}): 留保表現「${p}」が含まれている（断定形で書くこと）`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

// ===== 校閲ステップ =====
async function reviewQuestions(draft: GeneratedQuestions): Promise<GeneratedQuestions> {
  const prompt = buildReviewPrompt(draft);

  let reviewText = '';
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });
    reviewText = response.content[0].type === 'text' ? response.content[0].text : '';
    const reviewed = parseJson(reviewText) as {
      vocabQuestions?: typeof draft.vocabQuestions;
      readingPassage?: string;
      readingPassageJa?: string;
      readingQuestions?: typeof draft.readingQuestions;
    };
    return {
      ...draft,
      vocabQuestions: reviewed.vocabQuestions ?? draft.vocabQuestions,
      readingPassage: reviewed.readingPassage ?? draft.readingPassage,
      readingPassageJa: reviewed.readingPassageJa ?? draft.readingPassageJa,
      readingQuestions: reviewed.readingQuestions ?? draft.readingQuestions,
    };
  } catch (e) {
    // 校閲に失敗してもドラフトをそのまま返す（フォールバック）
    console.warn('Review step failed, returning draft:', e);
    if (reviewText) console.warn('Review response:', reviewText.slice(0, 300));
    return draft;
  }
}

// ===== 難易度評価プロンプト =====
function buildEvalPrompt(questions: GeneratedQuestions): string {
  return `あなたは英検1級の問題編集者です。

以下の問題セットを評価してください。

## 語彙問題（5問）
${JSON.stringify(questions.vocabQuestions, null, 2)}

## 長文
${questions.readingPassage}

## 読解問題
${JSON.stringify(questions.readingQuestions, null, 2)}

## 評価項目

1. **語彙レベル**（0〜100）
   - 100：全選択肢が英検1級最上位層、文脈も高度
   - 50：1級レベルだが正解が類推しやすい
   - 0：準1級以下の語彙が混在

2. **ダミー選択肢の質**（0〜100）
   - 100：全ての誤答が半数以上の受験者を惑わせるレベル
   - 50：一部の誤答が明らかに消去できる
   - 0：誤答がほぼ全て即座に消去できる

3. **文脈依存度**（0〜100）
   - 100：語の精密な意味知識と文脈把握が両方必要
   - 50：どちらか一方だけで正解できる
   - 0：単語を知らなくても文脈で選べる

4. **読解に必要な推論量**（0〜100）
   - 100：本文に直接書かれていないことを複数ステップで推論が必要
   - 50：本文を注意深く読めば解ける
   - 0：本文の該当箇所を見つけるだけで解ける

5. **設問の質**（0〜100）
   - 100：問い方が正確で、正解が唯一に定まる
   - 50：やや曖昧さがあるが許容範囲
   - 0：問いが不明確または正解が複数成立する

## 総合難易度
上記5項目の評価を踏まえて、総合難易度を以下から選んでください：
- A：易しい（英検準1級レベルで解ける）
- B：やや易しい（1級受験者の70%以上が正解できる）
- C：標準（1級受験者の40〜70%が正解できる）
- D：やや難しい（1級受験者の20〜40%が正解できる）
- E：難しい（1級合格者でも20%以下しか正解できない）

## 出力形式（JSONのみ、説明文なし）
{
  "vocab_score": 数値,
  "dummy_score": 数値,
  "context_score": 数値,
  "inference_score": 数値,
  "question_score": 数値,
  "overall_score": 数値,
  "difficulty": "A" | "B" | "C" | "D" | "E",
  "reason": "総合判定の根拠を2〜3文で"
}`;
}

// ===== 難易度評価ステップ =====
async function evaluateDifficulty(questions: GeneratedQuestions): Promise<DifficultyScore | null> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: buildEvalPrompt(questions) }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const result = parseJson(text) as DifficultyScore;
    return result;
  } catch (e) {
    console.warn('Difficulty evaluation failed:', e);
    return null;
  }
}

// ===== 生成ヘルパー（1回分） =====
async function generateOnce(
  article: Article,
  format: ReadingFormat,
  sampledWords: WordEntry[],
  feedbackHint?: string,
  validationErrors?: string[]
): Promise<GeneratedQuestions> {
  const trimmedArticle = { ...article, content: article.content.slice(0, 2000) };
  let prompt = buildPrompt(trimmedArticle, format, sampledWords);

  // バリデーションエラーのフィードバック
  if (validationErrors && validationErrors.length > 0) {
    prompt += `\n\n## ⚠️ 前回の生成で以下のエラーが検出されました。必ず修正してください：\n${validationErrors.map(e => `- ${e}`).join('\n')}`;
  }

  // 前回評価のフィードバックがある場合は末尾に追加
  if (feedbackHint) {
    prompt += `\n\n## ⚠️ Previous Attempt Feedback\nThe previous generated questions were rated as too easy (${feedbackHint}).\nPlease make harder questions this time by:\n- Using more advanced and less predictable vocabulary\n- Making distractors more plausible and harder to eliminate\n- Requiring more inferential reasoning to answer reading questions\n- Ensuring no choice can be dismissed without carefully reading the passage`;
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  let parsed;
  try {
    parsed = parseJson(text) as {
      vocabQuestions: VocabQuestion[];
      readingPassage: string;
      readingPassageJa: string;
      readingQuestions: ReadingQuestion[];
    };
  } catch (e) {
    console.error('JSON parse error:', e);
    console.error('Claude response:', text.slice(0, 500));
    throw new Error('Failed to parse JSON from Claude response');
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

export async function generateQuestions(
  article: Article,
  format: ReadingFormat
): Promise<GeneratedQuestions> {
  const jstDay = new Date(Date.now() + 9 * 60 * 60 * 1000).getDate();
  const sampledWords = sampleWords(30, jstDay);

  // ===== Step 1: 問題生成（失敗時1回リトライ） =====
  let draft = await generateOnce(article, format, sampledWords);
  const validation = validateVocabQuestions(draft.vocabQuestions);
  if (!validation.valid) {
    console.warn('Validation failed, retrying once:', validation.errors);
    draft = await generateOnce(article, format, sampledWords, undefined, validation.errors);
  }

  // ===== Step 2: 選択肢シャッフル＋アノテーション生成 =====
  const final = applyChoiceShuffle(draft);
  const annotations = await generateAnnotations(final);
  return { ...final, ...annotations };
}

function applyChoiceShuffle(q: GeneratedQuestions): GeneratedQuestions {
  return {
    ...q,
    vocabQuestions: q.vocabQuestions.map(shuffleChoices),
    readingQuestions: q.readingQuestions.map(shuffleChoices),
  };
}
