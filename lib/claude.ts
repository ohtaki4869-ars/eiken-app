import Anthropic from '@anthropic-ai/sdk';
import { Article } from './rss';
import { WORD_BANK, WordEntry } from './wordbank';
import contentFewshotExample from '../samples/fable5-v5/content-culture.fewshot.json';
import fillInBlankFewshotExample from '../samples/fable5-v5/fillinblank-2.fewshot.json';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 拡張思考(thinking)ブロックを返すモデルでは content[0] が 'thinking' になるため、
// 最初の 'text' ブロックを探して取り出す（content[0]決め打ちにしない）。
function extractText(response: Anthropic.Messages.Message): string {
  const textBlock = response.content.find((b): b is Anthropic.Messages.TextBlock => b.type === 'text');
  return textBlock?.text ?? '';
}

// ===== モデル設定（環境変数で切り替え可能。デフォルトは haiku） =====
const GENERATION_MODEL = process.env.GENERATION_MODEL ?? 'claude-haiku-4-5';
const ANNOTATION_MODEL = process.env.ANNOTATION_MODEL ?? 'claude-haiku-4-5';

const VOCAB_THEMES = ['政治', '科学', '経済', '文化', '社会'];

// ===== few-shot見本（v5.1 §1）。cache_control対象の静的プロンプト内に埋め込む =====
// 見本データは samples/fable5-v5/*.fewshot.json （記号ズレをremapChoiceLettersで修正済み、
// generateOnce出力と同一スキーマ: vocabQuestions/readingPassage/readingPassageJa/readingQuestions）
const CONTENT_FEWSHOT_BLOCK = `
【few-shot見本（出力形式・技法配分の参考。話題・単語は模倣しないこと）】
以下は品質基準を満たす見本である。模倣すべき点:
- パッセージの論説構成の質（ただし構成パターン自体は記事内容に応じて変えること）
- 正解選択肢のパラフレーズ抽象度（語の置換だけでなく構文の組み替え・原理レベルへの抽象化）
- 誤答技法1〜4の配分と、本文に実在する要素を使った誤答の作り方
- 選択肢の語数バランス

模倣してはいけない点:
- この見本では一部の問題で正解選択肢が4択中最長になっているが、これは欠陥である。正解が単独最長にならないよう、誤答のうち1つ以上は正解と同等以上の長さにすること
- 語彙問題の単語・例文シナリオ（単語はWordBankから毎回指定されるものを使う。この見本のvigil/dispel等の単語・シチュエーションを再現しない）
- 記事の話題（この見本はFIFA/スポーツ統治の話題だが、実際の記事内容に基づいて書くこと）

見本(JSON。vocabQuestions/readingPassage/readingPassageJa/readingQuestionsの4フィールドのみが出力対象):
${JSON.stringify(contentFewshotExample, null, 2)}`;

const FILL_IN_BLANK_FEWSHOT_BLOCK = `
【few-shot見本（出力形式・空所設計の参考。話題・単語は模倣しないこと）】
以下は品質基準を満たす見本である。模倣すべき点:
- 3つの空所がそれぞれ異なる能力（目的把握/理由節からの逆算/対比構造の理解等）を測定する設計
- 選択肢の語数バランス（±2語以内）と、技法A「方向性の逆転」/技法B「部分的整合」の使い分け
- パッセージの論説構成の質（構成パターン自体は記事内容に応じて変えること）

模倣してはいけない点:
- 語彙問題の単語・例文シナリオ（単語はWordBankから毎回指定されるものを使う。この見本の単語・シチュエーションを再現しない）
- 記事の話題（この見本はNHS/医療政策の話題だが、実際の記事内容に基づいて書くこと）

見本(JSON。vocabQuestions/readingPassage/readingPassageJa/readingQuestionsの4フィールドのみが出力対象):
${JSON.stringify(fillInBlankFewshotExample, null, 2)}`;

// 語彙1問分の使用語を固定するグループ（v5.1.1: モデルに語の配分の自由を与えず、
// コード側で「正解語1＋同品詞の誤答候補3」の4語セットを確定させる）
export interface VocabWordGroup {
  theme: string;
  pos: WordEntry['pos'];
  correct: WordEntry;
  distractors: [WordEntry, WordEntry, WordEntry];
}

export interface SampledWordSet {
  groups: VocabWordGroup[]; // 必ず5組（5問分）、全20語が重複なし
}

/**
 * 指定された日付の seed を元に単語帳から決定論的にサンプリング（同じ日は同じ単語）。
 * 正解語1＋同品詞の誤答候補3＝4語のグループを5組、全20語重複なしで構成する。
 * 品詞メタデータ（WordEntry.pos）を使い、各グループ内の4語を必ず同品詞にする。
 * attempt: 同日内に複数回生成する場合（?refresh=true の連続呼び出し等）に
 *          同じ抽選結果にならないよう変化させるオフセット（通常は0）
 */
function sampleWordBank(seed?: number, attempt = 0): SampledWordSet {
  const s = (seed ?? new Date().getDate()) * 1000 + attempt;
  // simple seeded shuffle using the date+attempt as seed
  const shuffled = [...WORD_BANK];
  let state = s * 1234567 + 89;
  for (let i = shuffled.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 品詞別バケツ（シャッフル順を保持）と、各バケツの走査位置ポインタ
  const buckets = new Map<WordEntry['pos'], WordEntry[]>();
  shuffled.forEach(w => {
    const list = buckets.get(w.pos) ?? [];
    list.push(w);
    buckets.set(w.pos, list);
  });
  const bucketPointers = new Map<WordEntry['pos'], number>();
  buckets.forEach((_, pos) => bucketPointers.set(pos, 0));

  const usedWords = new Set<string>();
  const groups: VocabWordGroup[] = [];

  for (const candidate of shuffled) {
    if (groups.length >= 5) break;
    if (usedWords.has(candidate.word)) continue;

    const bucket = buckets.get(candidate.pos)!;
    let pointer = bucketPointers.get(candidate.pos)!;
    const distractors: WordEntry[] = [];
    while (distractors.length < 3 && pointer < bucket.length) {
      const w = bucket[pointer];
      pointer++;
      if (w.word === candidate.word || usedWords.has(w.word)) continue;
      distractors.push(w);
    }
    bucketPointers.set(candidate.pos, pointer);

    if (distractors.length < 3) continue; // この品詞の在庫不足。次の候補へ

    usedWords.add(candidate.word);
    distractors.forEach(d => usedWords.add(d.word));
    groups.push({
      theme: VOCAB_THEMES[groups.length] ?? VOCAB_THEMES[groups.length % VOCAB_THEMES.length],
      pos: candidate.pos,
      correct: candidate,
      distractors: distractors as [WordEntry, WordEntry, WordEntry],
    });
  }

  if (groups.length < 5) {
    throw new Error(`WordBank sampling failed: only formed ${groups.length}/5 pos-matched groups (seed=${s})`);
  }

  return { groups };
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
  // 単語テキストをキーにした辞書（インデックスずれによるデータ混入を防ぐ）
  vocabAnnotations: Record<string, ChoiceAnnotation>;
  reading: ChoiceAnnotationSet[];
  vocabulary?: ChoiceAnnotationSet[];  // 旧フォーマット互換用（参照のみ、書き込み禁止）
}

export interface ReadingChoiceExplanation {
  choiceKey: 'A' | 'B' | 'C' | 'D';
  choiceText: string;
  choiceTranslation: string;
  isCorrect: boolean;
  correctReason?: {
    paragraphRef: string;   // 例: "第2段落"
    originalText: string;   // 本文引用
    paraphraseExplanation: string;
  };
  incorrectReason?: {
    technique: '因果関係の逆転' | '範囲の拡大' | '誇張・断定化' | '主語のすり替え' | '本文に根拠なし';
    originalText: string;   // 本文引用（根拠なしの場合は空文字）
    explanation: string;    // 具体的な誤りの説明
  };
}

export interface ReadingQuestionExplanation {
  questionNumber: number;
  questionText: string;
  choices: ReadingChoiceExplanation[];  // 必ずA/B/C/D順の4要素
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

// buildStaticInstructions/buildDynamicContext は毎日不変な部分と変動する部分を分離し、
// プロンプトキャッシング（cache_control）で不変部分の入力コストを削減するために分割している。
// ===== 語彙生成（読解パッセージ・記事から完全独立。v5.1で呼び出しを分割） =====
function buildVocabStaticInstructions(): string {
  return `You are an expert English exam question creator specializing in EIKEN Grade 1 (英検1級) level vocabulary questions.

Create EIKEN Grade 1 style vocabulary questions (語彙問題 - Part 1 style) in JSON format — exactly one question per word-assignment group provided in a separate context block below.
The word assignment for each question (correct word + its 3 wrong choices) is FIXED — you do NOT choose which words to use. Your job is only to write the example sentence and explanation for each fixed word set.

【語彙問題 生成ルール v5.1.1】
■ 語彙問題はゼロから例文を作成する（記事や読解パッセージとは無関係）。
■ 各設問に指定された「正解語」「誤答3語」をそのまま使うこと。語を追加・変更・入れ替えてはならない（4択内の並び順=A/B/C/Dへの割り当ては自由）。
■ **指定語は与えられた形（原形・単数形）のまま一字も変えずに空所に入ること。** そのために、指定語がその形で文法的に成立する構文で例文を設計する：
  - 動詞なら: to不定詞の後（"decided to ____"）／助動詞の後（"must/should/could ____"）／"help (人) ____"や"had no choice but to ____"等の後
  - 名詞（単数形）なら: 単数で成立する枠を使う（"a/the ____"、"hold a ____"、"become a ____"等）
  - 活用形・複数形・三人称単数現在形などに変えてはならない（例: 正解語がappallなら"appalled"ではなく"appall"のまま入る構文にする）
■ 各問題は、指定された正解語が最も自然・典型的に使われる例文を作る
  - **正解語には「コロケーション例」が与えられている。例文はこのコロケーション例と同じ構文パターン・同じ種類の目的語/主語を踏襲すること。** コロケーション例と異なる種類の目的語を使わない（例: コロケーション例が人物・集団を目的語に取るなら、抽象的な出来事・行為・概念を目的語にしない。"appall the abuses"のような、コロケーション例から外れた非文的な組み合わせを作らない）
  - 例文の長さは20〜30語、英検1級の語彙問題と同等の文体（新聞・論説調）
  - テーマは指定された通りにする
  - 空所は1文につき1箇所（____ で表す）。空所の前後に正解を特定できる文脈手がかりを必ず置く
- 誤答3語は指定された品詞で統一済みなので、品詞の心配は不要（そのまま使うだけでよい）
- 誤答3語のうち最低2語には「パターンB: 意味が近いが焦点がズレる」という説明の切り口を与える（文脈に一見入りそうだが、ニュアンス・共起・方向性が合わない、という説明にする）
- 残りの誤答には「パターンC: 文脈と無関係」または「パターンA: 意味が逆」の説明を与える（実際の語同士の関係性に応じて自然な方を選ぶ）
- 正解率30〜60%を想定した説明の書き方にする（文脈から推測しにくい語という前提で解説する）
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

**SELF-CHECK（語彙・7項目、出力前に必ず確認）:**
- [ ] 指定された正解語・誤答3語をそのまま4択として使っている（語の追加・変更・入れ替えをしていない）
- [ ] 4択すべてが指定された形（原形・単数形）のまま一字も変えず使われている（活用・語尾変化していない）
- [ ] 正解語の例文が、与えられたコロケーション例と同じ構文パターン・目的語の種類になっている
- [ ] 正解語が問題文中に出現していない（活用形・派生語も含む）
- [ ] 問題文に ____ が1箇所だけある
- [ ] 誤答3択のうち最低2択がパターンB（意味が近いが焦点がズレる）である
- [ ] パターンC（文脈と無関係）の誤答は1語以内である

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
  ]
}`;
}

function buildVocabDynamicContext(groups: VocabWordGroup[]): string {
  const groupsText = groups
    .map((g, i) => {
      const distractorsText = g.distractors.map(d => `${d.word}（${d.meaning}／例：${d.phrase}）`).join(' / ');
      return `問${i + 1}（テーマ: ${g.theme}、品詞: ${g.pos}）
  正解語: ${g.correct.word}（意味: ${g.correct.meaning}）
  正解語のコロケーション例（この構文パターン・目的語の種類に忠実に例文を作ること）: "${g.correct.phrase}"
  誤答3語（この3語をそのまま使う。他の語に変えない）: ${distractorsText}`;
    })
    .join('\n\n');

  return `## 各設問の使用語（固定・変更禁止。この通りに1問ずつ割り当てて例文と解説を作成する）
${groupsText}`;
}

async function generateVocabOnly(
  groups: VocabWordGroup[],
  errors?: string[]
): Promise<VocabQuestion[]> {
  let dynamicContext = buildVocabDynamicContext(groups);
  if (errors && errors.length > 0) {
    dynamicContext += `\n\n## ⚠️ 前回の生成で以下のエラーが検出されました。必ず修正してください：\n${errors.map(e => `- ${e}`).join('\n')}`;
  }

  const stream = client.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: 12000,
    system: [
      { type: 'text', text: buildVocabStaticInstructions(), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: dynamicContext }],
  });
  const response = await stream.finalMessage();
  const text = extractText(response);
  console.log('[Vocab] stop_reason:', response.stop_reason, 'output_tokens:', response.usage?.output_tokens);
  try {
    const parsed = parseJson(text) as { vocabQuestions: VocabQuestion[] };
    return parsed.vocabQuestions;
  } catch (e) {
    console.error('[Vocab] JSON parse error:', e);
    console.error('[Vocab] Claude response:', text.slice(0, 500));
    throw new Error('Failed to parse JSON from Claude response (vocab)');
  }
}

// ===== 読解生成（記事に基づく。語彙とは完全に独立した呼び出し） =====
function buildReadingOnlyStaticInstructions(format: ReadingFormat): string {

  // ===== 穴埋め形式 (Part 2 style) =====
  const fillInBlankInstructions = `
2. **Reading Passage with 3 blanks** (長文穴埋め - EIKEN Grade 1 Part 2 style):
   - Write a 3-paragraph passage (300-400 words total) on the article topic
   - Difficulty: EIKEN Grade 1 level academic English
   - **No self-reference**: never refer to the passage's own author in the third person (e.g., "the author contends/argues/notes that..."). State claims directly as the passage's own prose, not as a description of what an external author is doing.
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

   **SELF-CHECK（穴埋め・5項目）:**
   - [ ] 各段落に空欄が1つずつある（計3つ）
   - [ ] 選択肢の語数が±2語以内
   - [ ] 正解以外の選択肢も文法的に前後と接続可能
   - [ ] 誤答に「明らかな外れ」がない（本文と無関係な内容は禁止）
   - [ ] パッセージが自分自身の筆者を三人称で参照していない（"the author contends"等の自己言及禁止）
${FILL_IN_BLANK_FEWSHOT_BLOCK}`;

  // ===== 内容一致形式 (Part 3 style) =====
  const contentInstructions = `
2. **Reading Passage** (長文 - EIKEN Grade 1 Part 3 style):
   - Write a 3-4 paragraph passage (350-450 words) on the article topic
   - Difficulty: EIKEN Grade 1 level academic English
   - Structured argument with clear topic sentences and evidence
   - **No self-reference**: never refer to the passage's own author in the third person (e.g., "the author contends/argues/notes that..."). State the argument directly as the passage's own prose, not as a description of what an external author is doing. (Referring to OTHER people/sources mentioned in the passage, such as "critics argue" or "researchers found," is fine — this rule only bans the passage narrating itself.)

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
   - Each question has 4 choices that are COMPLETE SENTENCES, **20-33 words each — 35 words is a HARD CEILING that must never be exceeded, and 15 words is a hard floor**. Count your words before finalizing each choice; if a choice runs long, cut a subordinate clause rather than let it exceed 35.
   - **No length bias**: the correct choice must NOT be the single longest of the 4 by itself. At least one wrong choice must be the same length as or longer than the correct choice — otherwise a test-taker could answer correctly just by picking the longest option without reading.

   **CRITICAL RULES FOR CORRECT ANSWERS:**
   - **No direct quotation**: NEVER copy-paste from the passage.
   - **True paraphrase = word substitution AND syntactic restructuring BOTH**:
     ❌ NG: "the conditions focus on territorial integrity" → "the conditions address territorial integrity"（語の置換のみ）
     ✅ OK: "the conditions focus on territorial integrity" → "preserving national borders forms the basis of the proposed framework"

   **CRITICAL RULES FOR WRONG CHOICES:**
   Assign exactly one technique per wrong choice, choosing 3 distinct techniques out of the 4 below
   (across all 4 questions in the passage, techniques 1-4 must each be used at least once):

   **技法1「因果関係の逆転」**
   Swap cause and effect from the passage.
   例: 本文「Aが起きたのでBになった」→ 誤答「BのためにAが生じた」

   **技法2「範囲の拡大・過度な一般化」**
   Broaden a limited claim into an absolute one.
   例: 本文「英国で導入」→ 誤答「すべての先進国で導入」
   例: 本文「一部の専門家が懸念」→ 誤答「すべての専門家が反対」

   **技法3「筆者の主張の誇張・断定化」**
   Turn a tentative claim into a certainty, in this priority order:
   (a) 既成事実化（優先）: turn could/may/suggests into has/did/demonstrated
     例: 本文「～する可能性がある（could / may）」→ 誤答「～することが証明された / 必ず～する」
   (b) 条件・留保の削除（優先）: drop qualifying phrases like "in part" / "some" / "において"
   (c) 絶対語の使用（最終手段）: every / all / never / always / certainly / invariably / definitively / entirely / undoubtedly 等
     例: 本文「～が重要だと示唆する」→ 誤答「～が唯一の解決策であると断言する」
   - **(c)の絶対語は目立ちやすく消去法の手がかりになるため、1問の4択の中で絶対語を含む選択肢は1つまでとする**。(a)(b)による「穏やかな断定」を主力にすること。

   **技法4「主語のすり替え」**
   Present an action/claim made by subject A in the passage as if made by a different subject B that also appears in the passage.
   例: 本文「批評家が指摘した」→ 誤答「著者が主張している」
   例: 本文「NICEが推奨した」→ 誤答「NHSが実施した」

   **「本文に根拠なし」型（本文に登場しない主体・事実の導入）**: use sparingly — at most 2 choices per passage (across all 4 questions). This does not count toward the 技法1〜4 rotation requirement above.

   **Keyword overlap requirement**: Each wrong choice must include at least 2 actual keywords from the passage (same subject, proper nouns, or technical terms). Never introduce concepts completely absent from the passage.

   **Explanation format for each reading question:**
   【解説文体ルール（必須）】
   ■ 断定形で書く。「〜とも読める」「ただし〜」等の留保表現は禁止。
   ■ 各選択肢をA/B/C/Dで明示し、記号順（A→B→C→D）に記述すること
   ■ 技法3「誇張・断定化」を使った誤答の場合は、本文の「可能性・当為」と誤答の「必然・義務」の具体的な差を示す
     例：「本文はvigilant oversightという自発的改善を述べており、government controlsという外部強制の必然性までは主張していない」
   ■ 技法4「主語のすり替え」を使った誤答の場合は、本文中の本来の主体と誤答が差し替えた主体を両方明示する
     例：「本文で指摘しているのはcriticsであり、authorではない」

   【正解】本文の該当箇所を必ず引用：「本文に'～'とあり、これをparaphraseすると正解の'～'に対応する」。推論問題の場合は「本文の'A'と'B'から推論できる」と複数箇所を示す。
   【各誤答】記号と技法を明示：
     【B: ...】技法1「因果関係の逆転」　→「本文では原因と結果が逆に記述されている」
     【C: ...】技法2「範囲の拡大」　　　→「本文では'～に限定'されているが、選択肢では過度に一般化している」
     【D: ...】技法3「誇張・断定化」　　→「本文では'could/may'と可能性で述べているが、選択肢では断定している」
     技法4「主語のすり替え」→「本文で～したのはAであり、選択肢のBではない」
     「本文に根拠なし」→「この内容は本文中に記述がない」（使用時のみ、1パッセージにつき2択まで）

   **SELF-CHECK（内容一致・10項目）:**
   - [ ] 問題数が4問である
   - [ ] 正解がparaphrase（語の言い換え＋構文変換の両方）されている
   - [ ] 4問全体で技法1・2・3・4がそれぞれ最低1回使われている
   - [ ] 「本文に根拠なし」型は1パッセージにつき2択以内に収まっている
   - [ ] 各誤答に本文キーワードが2語以上含まれている
   - [ ] 誤答に「明らかな外れ」がない
   - [ ] 正解選択肢が4択中で単独最長になっていない（誤答1つ以上が正解と同等以上の長さ）
   - [ ] 絶対語（every/all/never/always/certainly等）を含む選択肢が1問につき1つ以内である
   - [ ] 全選択肢が35語を超えていない（20-33語が目安、35語は絶対に超えない上限）
   - [ ] パッセージが自分自身の筆者を三人称で参照していない（"the author contends"等の自己言及禁止）
${CONTENT_FEWSHOT_BLOCK}`;

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

  return `You are an expert English exam question creator specializing in EIKEN Grade 1 (英検1級) level questions. You have deep knowledge of the actual EIKEN Grade 1 exam format.

Create an authentic EIKEN Grade 1 style reading passage and comprehension questions based on the news article that will be provided in a separate context block below.
${readingInstructions}

Return ONLY valid JSON in this exact format:
{
  ${readingJsonExample}
}`;
}

// 日次で変動する部分（記事本文）。cache_control は付けず、system の2ブロック目として渡す。
function buildReadingOnlyDynamicContext(article: Article): string {
  return `## Article
Title: ${article.title}
Source: ${article.source}
Content: ${article.content}`;
}

async function generateReadingOnly(
  article: Article,
  format: ReadingFormat,
  errors?: string[]
): Promise<{ readingPassage: string; readingPassageJa: string; readingQuestions: ReadingQuestion[] }> {
  let dynamicContext = buildReadingOnlyDynamicContext(article);
  if (errors && errors.length > 0) {
    dynamicContext += `\n\n## ⚠️ 前回の生成で以下のエラーが検出されました。必ず修正してください：\n${errors.map(e => `- ${e}`).join('\n')}`;
  }

  const stream = client.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: 32000,
    system: [
      { type: 'text', text: buildReadingOnlyStaticInstructions(format), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: dynamicContext }],
  });
  const response = await stream.finalMessage();
  const text = extractText(response);
  console.log('[Reading] stop_reason:', response.stop_reason, 'output_tokens:', response.usage?.output_tokens);
  try {
    return parseJson(text) as {
      readingPassage: string;
      readingPassageJa: string;
      readingQuestions: ReadingQuestion[];
    };
  } catch (e) {
    console.error('[Reading] JSON parse error:', e);
    console.error('[Reading] Claude response:', text.slice(0, 500));
    throw new Error('Failed to parse JSON from Claude response (reading)');
  }
}

// ===== 選択肢アノテーション生成（v5.1.3: 語彙と読解を独立した呼び出しに分離） =====
// 語彙アノテーション（不変ルール部分。cache_control で入力コストを削減する）
function buildVocabAnnotationStaticRules(): string {
  return `英検1級の語彙問題について、各選択肢のアノテーションを生成してください。

## ルール
【vocabAnnotations】
■ 形式: { "単語テキスト": { ... } } — 単語テキスト自体をキーにすること（A/B/C/Dや番号はキーにしない）
■ 全20単語（5問×4択）について必ず出力する
- translation: 文脈に即した日本語訳（8字以内）
- pos: 品詞を漢字1字で（動/名/形/副）
- collocation: よく使うコロケーション2例を "A / B" 形式で
- incorrectReason: **不正解語には必ず設定する**。パターンA「意味が逆」/パターンB「焦点がズレる」/パターンC「文脈と無関係」（25字以内）
- **正解語には incorrectReason を設定しない**（フィールド自体を省略する）

【confusingPairs】
■ 正解語と最も混同しやすい誤答語のペアを、各設問から必要に応じて挙げる
■ choiceA・choiceBは必ず今回渡された20単語（5問×4択）のいずれかから選ぶこと。それ以外の単語を挙げない

## 出力形式（JSONのみ、コメント禁止）
{
  "vocabAnnotations": {
    "deterrent": { "translation": "抑止力", "pos": "名", "collocation": "a deterrent effect / act as a deterrent" },
    "reprimand": { "translation": "叱責", "pos": "名", "collocation": "a formal reprimand / receive a reprimand", "incorrectReason": "パターンB: 事後対処で文脈に不一致" },
    "constraint": { "translation": "制約", "pos": "名", "collocation": "a legal constraint / under constraint", "incorrectReason": "パターンB: 心理的抑止力なし" },
    "inducement": { "translation": "誘因", "pos": "名", "collocation": "financial inducement / an inducement to act", "incorrectReason": "パターンA: 意味が逆（誘発）" }
  },
  "confusingPairs": [
    { "choiceA": "deterrent", "choiceB": "reprimand", "explanation": "deterrentは未然防止、reprimandは事後対処。" }
  ]
}`;
}

function buildVocabAnnotationDynamicContext(vocabQuestions: VocabQuestion[]): string {
  const vocabSummary = vocabQuestions.map((q, i) => {
    const choices = Object.entries(q.choices).map(([k, v]) => `${k}: ${v}`).join(' / ');
    return `語彙(${i + 1}) 正解:${q.answer} | ${choices}`;
  }).join('\n');

  return `## 語彙問題（全選択肢が1語の英単語）
${vocabSummary}`;
}

async function generateVocabAnnotations(
  vocabQuestions: VocabQuestion[],
  errors?: string[]
): Promise<{ vocabAnnotations: Record<string, ChoiceAnnotation>; confusingPairs: ConfusingPair[] }> {
  let dynamicContext = buildVocabAnnotationDynamicContext(vocabQuestions);
  if (errors && errors.length > 0) {
    dynamicContext += `\n\n## ⚠️ 前回の生成で以下のエラーが検出されました。必ず修正してください：\n${errors.map(e => `- ${e}`).join('\n')}`;
  }

  const stream = client.messages.stream({
    model: ANNOTATION_MODEL,
    max_tokens: 8000,
    system: [
      { type: 'text', text: buildVocabAnnotationStaticRules(), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: dynamicContext }],
  });
  const response = await stream.finalMessage();
  const text = extractText(response);
  console.log('[VocabAnnotations] Response length:', text.length);
  try {
    return parseJson(text) as { vocabAnnotations: Record<string, ChoiceAnnotation>; confusingPairs: ConfusingPair[] };
  } catch (e) {
    console.error('[VocabAnnotations] JSON parse error:', e);
    console.error('[VocabAnnotations] Claude response:', text.slice(0, 500));
    throw new Error('Failed to parse JSON from Claude response (vocab annotations)');
  }
}

// 語彙アノテーションのバリデーション: 正解語にincorrectReasonが無いこと、誤答語には
// incorrectReasonがあること、confusingPairsの語が今回の20語に含まれることを確認する
function validateVocabAnnotations(
  vocabQuestions: VocabQuestion[],
  vocabAnnotations: Record<string, ChoiceAnnotation>,
  confusingPairs: ConfusingPair[]
): ValidationResult {
  const errors: string[] = [];
  const allWords = new Set(
    vocabQuestions.flatMap(q => Object.values(q.choices)).map(w => w.toLowerCase().trim())
  );

  vocabQuestions.forEach((q, i) => {
    const num = i + 1;
    const correctWord = q.choices[q.answer as keyof typeof q.choices];
    const correctAnn = vocabAnnotations[correctWord];
    if (correctAnn?.incorrectReason) {
      errors.push(`語彙アノテーション(${num}): 正解語「${correctWord}」にincorrectReasonが設定されている（空であるべき）`);
    }
    (['A', 'B', 'C', 'D'] as const).forEach(k => {
      const word = q.choices[k];
      if (word === correctWord) return;
      const ann = vocabAnnotations[word];
      if (!ann?.incorrectReason) {
        errors.push(`語彙アノテーション(${num}): 誤答語「${word}」にincorrectReasonが設定されていない`);
      }
    });
  });

  confusingPairs.forEach((p, i) => {
    if (!allWords.has(p.choiceA.toLowerCase().trim())) {
      errors.push(`紛らわしいペア(${i + 1}): 「${p.choiceA}」が今回の選択肢20語に含まれない`);
    }
    if (!allWords.has(p.choiceB.toLowerCase().trim())) {
      errors.push(`紛らわしいペア(${i + 1}): 「${p.choiceB}」が今回の選択肢20語に含まれない`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// 読解アノテーション（不変ルール部分。cache_control で入力コストを削減する）
function buildReadingAnnotationStaticRules(isFillInBlank: boolean): string {
  const readingExplanationRules = isFillInBlank ? `
【readingChoiceExplanations ルール（穴埋め形式）】
穴埋め問題の各設問について、4択すべてに以下を生成する：
- choiceKey: "A"/"B"/"C"/"D"（必ず4つ、アルファベット順）
- choiceText: 問題の選択肢テキストと完全一致させること
- choiceTranslation: 自然な日本語訳（フレーズなので文脈上の意味を補って訳す）
- isCorrect: 正解のみtrue（1問につき必ず1つだけ）
- 正解の場合: correctReason = { paragraphRef:"第N段落", originalText:"空所前後の引用", paraphraseExplanation:"なぜこのフレーズが空所に合うかの説明" }
- 不正解の場合: incorrectReason = { technique:"方向性の逆転" または "部分的整合", originalText:"関連する本文箇所", explanation:"なぜ空所に合わないかの説明" }
  technique の選択：
  "方向性の逆転"：本文の論旨と逆方向の内容（本文が増加を示すのに減少を示す等）
  "部分的整合"：本文のキーワードを含むが論理的に前後と合わない` : `
【readingChoiceExplanations ルール（内容一致形式）】
読解問題の各設問について、4択すべてに以下を生成する：
- choiceKey: "A"/"B"/"C"/"D"（必ず4つ、アルファベット順）
- choiceText: 問題の選択肢テキストと完全一致させること
- choiceTranslation: 自然な日本語訳（直訳禁止。主語・接続詞を補い、長ければ2文に分ける）
- isCorrect: 正解のみtrue（1問につき必ず1つだけ）
- 正解の場合: correctReason = { paragraphRef:"第N段落", originalText:"本文引用", paraphraseExplanation:"対応説明" }
- 不正解の場合: incorrectReason = { technique:"技法名", originalText:"本文引用", explanation:"具体的な誤りの説明" }
  technique は以下から1つ選ぶ：
  "因果関係の逆転"：本文のA→BがB→Aに逆転している
  "範囲の拡大"：一部→すべて／限定→一般化
  "誇張・断定化"：could/may/suggests → has proven/will/inevitably に変質
  "主語のすり替え"：本文の主体Aの行為・主張を、本文に登場する別の主体Bのものとして提示している
  "本文に根拠なし"：本文に一切記述がない（originalTextは空文字）`;

  return `英検1級の読解問題について、各選択肢のアノテーションと詳細解説を生成してください。
形式：${isFillInBlank ? '穴埋め（fill-in-blank）' : '内容一致（content）'}

## ルール
${readingExplanationRules}

## 出力形式（JSONのみ、コメント禁止）
{
  "reading": [
    {
      "A": { "translation": "正解の自然な日本語訳", "pos": "", "collocation": "" },
      "B": { "translation": "誤答の訳", "pos": "", "collocation": "", "incorrectReason": "技法2: 英国限定を全先進国に拡大" },
      "C": { "translation": "誤答の訳", "pos": "", "collocation": "", "incorrectReason": "技法1: 因果関係が逆" },
      "D": { "translation": "誤答の訳", "pos": "", "collocation": "", "incorrectReason": "技法3: 可能性を断定化" }
    }
  ],
  "readingChoiceExplanations": [
    {
      "questionNumber": 1,
      "questionText": "設問文",
      "choices": [
        {
          "choiceKey": "A",
          "choiceText": "選択肢Aの英文（問題文と完全一致）",
          "choiceTranslation": "自然な日本語訳",
          "isCorrect": true,
          "correctReason": {
            "paragraphRef": "第2段落",
            "originalText": "本文の該当箇所の引用",
            "paraphraseExplanation": "本文の〜をparaphraseしており、〜という点が対応する"
          }
        },
        {
          "choiceKey": "B",
          "choiceText": "選択肢Bの英文",
          "choiceTranslation": "自然な日本語訳",
          "isCorrect": false,
          "incorrectReason": {
            "technique": "範囲の拡大",
            "originalText": "本文の該当箇所",
            "explanation": "本文では〜に限定して述べているが、この選択肢では〜全体に拡大している"
          }
        },
        {
          "choiceKey": "C",
          "choiceText": "選択肢Cの英文",
          "choiceTranslation": "自然な日本語訳",
          "isCorrect": false,
          "incorrectReason": {
            "technique": "因果関係の逆転",
            "originalText": "本文の該当箇所",
            "explanation": "本文ではA→Bという順序だが、この選択肢ではB→Aと逆になっている"
          }
        },
        {
          "choiceKey": "D",
          "choiceText": "選択肢Dの英文",
          "choiceTranslation": "自然な日本語訳",
          "isCorrect": false,
          "incorrectReason": {
            "technique": "誇張・断定化",
            "originalText": "本文の該当箇所",
            "explanation": "本文ではcould/mayと可能性で述べているが、この選択肢では断定している"
          }
        }
      ]
    }
  ]
}`;
}

function buildReadingAnnotationDynamicContext(questions: GeneratedQuestions): string {
  const readingDetail = questions.readingQuestions.map((q, i) => {
    const choices = (['A', 'B', 'C', 'D'] as const)
      .map(k => `  ${k}: ${q.choices[k]}`)
      .join('\n');
    return `読解(${i + 1}) 正解:${q.answer}\n設問:${q.question}\n${choices}`;
  }).join('\n\n');

  return `## 読解パッセージ（解説の根拠として使用）
${questions.readingPassage}

## 読解問題（全選択肢の完全テキスト）
${readingDetail}`;
}

async function generateReadingAnnotations(questions: GeneratedQuestions): Promise<{
  reading: ChoiceAnnotationSet[];
  readingChoiceExplanations?: ReadingQuestionExplanation[];
}> {
  const isFillInBlank = questions.readingFormat === 'fill-in-blank';
  const stream = client.messages.stream({
    model: ANNOTATION_MODEL,
    max_tokens: 20000,
    system: [
      { type: 'text', text: buildReadingAnnotationStaticRules(isFillInBlank), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: buildReadingAnnotationDynamicContext(questions) }],
  });
  const response = await stream.finalMessage();
  const text = extractText(response);
  console.log('[ReadingAnnotations] Response length:', text.length);
  try {
    return parseJson(text) as { reading: ChoiceAnnotationSet[]; readingChoiceExplanations?: ReadingQuestionExplanation[] };
  } catch (e) {
    console.error('[ReadingAnnotations] JSON parse error:', e);
    console.error('[ReadingAnnotations] Claude response:', text.slice(0, 500));
    throw new Error('Failed to parse JSON from Claude response (reading annotations)');
  }
}

export async function generateAnnotations(questions: GeneratedQuestions): Promise<{
  choiceAnnotations: ChoiceAnnotations;
  confusingPairs: ConfusingPair[];
  readingChoiceExplanations?: ReadingQuestionExplanation[];
} | null> {
  try {
    const [vocabResult, readingResult] = await Promise.all([
      (async () => {
        let result = await generateVocabAnnotations(questions.vocabQuestions);
        const validation = validateVocabAnnotations(questions.vocabQuestions, result.vocabAnnotations, result.confusingPairs);
        if (!validation.valid) {
          console.warn('[VocabAnnotations] validation issues, retrying once:', validation.errors);
          try {
            result = await generateVocabAnnotations(questions.vocabQuestions, validation.errors);
            const retryValidation = validateVocabAnnotations(questions.vocabQuestions, result.vocabAnnotations, result.confusingPairs);
            if (!retryValidation.valid) {
              console.warn('[VocabAnnotations] retry still invalid, using retry result anyway:', retryValidation.errors);
            }
          } catch (e) {
            console.warn('[VocabAnnotations] retry failed, keeping original result:', e);
          }
        }
        return result;
      })(),
      generateReadingAnnotations(questions),
    ]);

    // 安全網: モデルが reading（簡易アノテーション）を出力し忘れた場合、同じ呼び出しで
    // 取得済みの readingChoiceExplanations（詳細版）から復元する。データはほぼ重複しているため
    // 再生成せず、その場で組み立てる。
    let reading = readingResult.reading;
    if ((!reading || reading.length === 0) && readingResult.readingChoiceExplanations) {
      console.warn('[ReadingAnnotations] reading フィールドが欠落。readingChoiceExplanationsから復元する');
      reading = readingResult.readingChoiceExplanations.map(exp => {
        const set = {} as ChoiceAnnotationSet;
        exp.choices.forEach(c => {
          set[c.choiceKey] = {
            translation: c.choiceTranslation,
            incorrectReason: c.incorrectReason ? `技法: ${c.incorrectReason.technique}` : undefined,
          };
        });
        return set;
      });
    }

    console.log('[Annotations] vocab words:', Object.keys(vocabResult.vocabAnnotations).length, 'reading:', reading?.length, 'readingExplanations:', readingResult.readingChoiceExplanations?.length);

    return {
      choiceAnnotations: {
        vocabAnnotations: vocabResult.vocabAnnotations,
        reading: reading ?? [],
      },
      confusingPairs: vocabResult.confusingPairs,
      readingChoiceExplanations: readingResult.readingChoiceExplanations,
    };
  } catch (e) {
    console.error('[Annotations] FAILED:', String(e));
    return null;
  }
}

// ===== 選択肢シャッフル =====
const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const;
type ChoiceKey = typeof CHOICE_KEYS[number];

// シャッフル後の記号に合わせて、モデル生成済みの explanation 内の記号参照
// （例:「【B: reprimand】」「正解B」「Bは〜」）を書き換える。
// 「技法A/技法B」（穴埋め形式の誤答技法ラベル。選択肢記号とは無関係）は対象から除外する。
// FIFA/FEMA等の固有名詞末尾の大文字を誤って書き換えないよう、直前がラテン文字の場合も除外する。
function remapChoiceLetters(text: string, oldToNew: Record<ChoiceKey, ChoiceKey>): string {
  const pattern = /(【\s*)([ABCD])(\s*[:：】])|(正解\s*)([ABCD])(?![A-Za-z])|(?<!技法)(?<![A-Za-z])([ABCD])(?=は|が|と|を|の|に対応)/g;
  return text.replace(pattern, (match, p1, l1, p3, p4, l2, l3) => {
    if (l1) return `${p1}${oldToNew[l1 as ChoiceKey]}${p3}`;
    if (l2) return `${p4}${oldToNew[l2 as ChoiceKey]}`;
    if (l3) return oldToNew[l3 as ChoiceKey];
    return match;
  });
}

// 安全網: remapChoiceLetters適用後も、正規表現の見落とし等で記号がズレている場合があるので
// 【X: word/snippet】タグの内容が実際の choices[X] と一致しているかを検証し、
// 不一致があれば警告ログに記録する（処理は止めない・リトライにも乗せない）。
function verifyChoiceLabelConsistency(explanation: string, choices: { A: string; B: string; C: string; D: string }): void {
  const tagPattern = /【([ABCD]):\s*([^\n】]+?)】/g;
  let m;
  while ((m = tagPattern.exec(explanation)) !== null) {
    const letter = m[1] as ChoiceKey;
    const actual = choices[letter].trim().toLowerCase();
    // タグの内容は「…」で中略した要約のことがあるため、先頭の断片（最初の「...」より前）だけで照合する
    const leadFragment = m[2].split(/\.{3,}|…/)[0].trim().toLowerCase();
    const snippet = leadFragment.length >= 6 ? leadFragment : m[2].trim().toLowerCase();
    const consistent = snippet.length === 0 || actual.startsWith(snippet) || actual.includes(snippet) || snippet.includes(actual);
    if (!consistent) {
      console.warn(`[ChoiceLabel] 記号ズレの疑い: 【${letter}: ${m[2]}】 が実際の選択肢${letter}="${choices[letter].slice(0, 60)}"と一致しない`);
    }
  }
}

function shuffleChoices<T extends { choices: { A: string; B: string; C: string; D: string }; answer: string; explanation: string }>(q: T): T {
  // key/value ペアごとシャッフルすることで、旧→新の記号対応（oldToNew）を値の一致に頼らず追跡できるようにする
  const entries = CHOICE_KEYS.map(k => ({ key: k, value: q.choices[k] }));

  // Fisher-Yates shuffle
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  const newChoices = {} as { A: string; B: string; C: string; D: string };
  const oldToNew = {} as Record<ChoiceKey, ChoiceKey>;
  entries.forEach((entry, i) => {
    const newKey = CHOICE_KEYS[i];
    newChoices[newKey] = entry.value;
    oldToNew[entry.key] = newKey;
  });

  const newAnswer = oldToNew[q.answer as ChoiceKey];
  const explanation = remapChoiceLetters(q.explanation, oldToNew);
  verifyChoiceLabelConsistency(explanation, newChoices);
  return { ...q, choices: newChoices, answer: newAnswer, explanation };
}

// ===== コードバリデーション（機械チェック） =====
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// 語彙1問分のバリデーション（設問単位リトライから直接呼べるよう単問チェックとして切り出し）
function validateOneVocabQuestion(
  q: VocabQuestion,
  num: number,
  group?: VocabWordGroup,
  allowedWords?: Set<string> | null
): string[] {
  const errors: string[] = [];
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
  const sentenceWithoutBlank = sentence.replace(/____/g, '').toLowerCase();
  const answerLower = answer?.toLowerCase().trim() ?? '';
  // 語幹チェック（最初の5文字が一致する語が含まれていないか）
  const answerStem = answerLower.slice(0, 5);
  if (answerStem.length >= 4 && sentenceWithoutBlank.includes(answerStem)) {
    errors.push(`語彙(${num}): 正解語 "${answer}" またはその語幹が問題文中に露出している可能性がある`);
  }

  // チェック④: 選択肢が4つあるか
  const choiceValues = Object.values(q.choices);
  if (choiceValues.length !== 4) {
    errors.push(`語彙(${num}): 選択肢が${choiceValues.length}個（4つ必要）`);
  }

  // チェック⑤: 選択肢に重複がないか（同一設問内）
  const unique = new Set(choiceValues.map(c => c.toLowerCase().trim()));
  if (unique.size !== choiceValues.length) {
    errors.push(`語彙(${num}): 選択肢に重複がある [${choiceValues.join(', ')}]`);
  }

  // チェック⑥: 誤答語も問題文中に既出でないか
  choiceValues.forEach((choice) => {
    const c = choice.toLowerCase().trim();
    if (c !== answerLower && c.length > 0 && sentenceWithoutBlank.includes(c)) {
      errors.push(`語彙(${num}): 誤答語「${choice}」が問題文中に既出`);
    }
  });

  // チェック⑦: 選択肢が抽選済みプール（5組・全20語）の範囲内か（安全網）
  if (allowedWords) {
    choiceValues.forEach((choice) => {
      if (!allowedWords.has(choice.toLowerCase().trim())) {
        errors.push(`語彙(${num}): 選択肢「${choice}」が指定された単語プール外`);
      }
    });
  }

  // チェック⑧: 指定されたグループの4語（正解1＋誤答3）を、活用・語尾変化なくそのまま使っているか
  if (group) {
    const expected = new Set([group.correct.word, ...group.distractors.map(d => d.word)].map(w => w.toLowerCase().trim()));
    const actual = new Set(choiceValues.map(c => c.toLowerCase().trim()));
    const missing = [...expected].filter(w => !actual.has(w));
    const extra = [...actual].filter(w => !expected.has(w));
    if (missing.length > 0 || extra.length > 0) {
      errors.push(`語彙(${num}): 指定語セットと不一致（不足: [${missing.join(', ')}] 想定外: [${extra.join(', ')}]。指定語は活用・語尾変化させず原形・単数形のまま使うこと`);
    }
    if (answerLower !== group.correct.word.toLowerCase().trim()) {
      errors.push(`語彙(${num}): 正解が指定語「${group.correct.word}」と一致しない（実際: 「${answer}」）`);
    }
  }

  return errors;
}

function validateVocabQuestions(questions: VocabQuestion[], wordPool?: SampledWordSet): ValidationResult {
  const errors: string[] = [];
  // 安全網: 万一モデルが指示を無視した場合に備え、プール全体との照合・設問間重複検出は維持する
  const allowedWords = wordPool
    ? new Set(wordPool.groups.flatMap(g => [g.correct, ...g.distractors]).map(w => w.word.toLowerCase().trim()))
    : null;
  const usedAcrossQuestions: string[] = []; // 設問間の重複チェック用（4択×5問=20枠すべて）

  questions.forEach((q, i) => {
    const num = i + 1;
    const group = wordPool?.groups[i];
    errors.push(...validateOneVocabQuestion(q, num, group, allowedWords));
    Object.values(q.choices).forEach(c => usedAcrossQuestions.push(c.toLowerCase().trim()));
  });

  // チェック⑨: 20枠（4択×5問）すべてユニークか（設問間での使い回しも禁止。安全網）
  const dupes = usedAcrossQuestions.filter((w, i) => usedAcrossQuestions.indexOf(w) !== i);
  if (dupes.length > 0) {
    errors.push(`語彙: 設問間で選択肢が重複 [${[...new Set(dupes)].join(', ')}]`);
  }

  return { valid: errors.length === 0, errors };
}

// 35語超過の選択肢数だけを数える（v5.1.3: 1セットで3件以上ならリトライ昇格の判定に使う）
function countOverMaxWordChoices(questions: ReadingQuestion[]): number {
  const MAX_WORDS = 35;
  let count = 0;
  questions.forEach(q => {
    (['A', 'B', 'C', 'D'] as const).forEach(k => {
      if (q.choices[k].trim().split(/\s+/).length > MAX_WORDS) count++;
    });
  });
  return count;
}

// ===== 読解選択肢の語数チェック（内容一致形式のみ） =====
function validateChoiceLength(questions: ReadingQuestion[]): ValidationResult {
  const errors: string[] = [];
  const MAX_WORDS = 35;
  const MIN_WORDS = 15;

  questions.forEach((q, i) => {
    const num = i + 1;
    const counts = (['A', 'B', 'C', 'D'] as const).map(k => {
      const wordCount = q.choices[k].trim().split(/\s+/).length;
      if (wordCount > MAX_WORDS) {
        errors.push(`読解(${num})選択肢${k}: ${wordCount}語（上限${MAX_WORDS}語超過）`);
      }
      if (wordCount < MIN_WORDS) {
        errors.push(`読解(${num})選択肢${k}: ${wordCount}語（下限${MIN_WORDS}語未満）`);
      }
      return wordCount;
    });

    // 選択肢間の語数バランス: 最長と最短の差が12語以内
    if (Math.max(...counts) - Math.min(...counts) > 12) {
      errors.push(`読解(${num}): 選択肢間の語数差が12語超（正解が長さで推測可能になる）`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// ===== 「正解=最長」チェック（内容一致形式のみ、v5.1 §2。警告のみ・リトライには乗せない） =====
function checkCorrectIsLongest(questions: ReadingQuestion[]): ValidationResult {
  const errors: string[] = [];
  let correctIsLongestCount = 0;

  questions.forEach((q, i) => {
    const num = i + 1;
    const counts = (['A', 'B', 'C', 'D'] as const).map(k => q.choices[k].trim().split(/\s+/).length);
    const answerIndex = (['A', 'B', 'C', 'D'] as const).indexOf(q.answer as 'A' | 'B' | 'C' | 'D');
    if (answerIndex === -1) return;
    const correctWc = counts[answerIndex];
    const maxOther = Math.max(...counts.filter((_, j) => j !== answerIndex));
    if (correctWc > maxOther) {
      correctIsLongestCount++;
      errors.push(`読解(${num}): 正解選択肢(${correctWc}語)が単独最長（他の最長${maxOther}語）`);
    }
  });

  const majorityThreshold = Math.ceil(questions.length / 2);
  if (correctIsLongestCount >= majorityThreshold) {
    errors.push(`読解: 正解=最長がセット中${correctIsLongestCount}/${questions.length}問（過半数以上、癖になっている可能性）`);
  }

  return { valid: errors.length === 0, errors };
}

// ===== 極端語（絶対語）の使用チェック（内容一致形式のみ、v5.1 §3。警告のみ・リトライには乗せない） =====
const ABSOLUTE_WORDS = /\b(every|all|never|always|certainly|invariably|definitively|entirely|undoubtedly|impossible|inevitably)\b/i;

function checkAbsoluteWords(questions: ReadingQuestion[]): ValidationResult {
  const errors: string[] = [];
  questions.forEach((q, i) => {
    const num = i + 1;
    const hits = (['A', 'B', 'C', 'D'] as const).filter(k => ABSOLUTE_WORDS.test(q.choices[k])).length;
    if (hits >= 2) {
      errors.push(`読解(${num}): 絶対語を含む選択肢が${hits}つ（推奨1以下）`);
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
      model: GENERATION_MODEL,
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });
    reviewText = extractText(response);
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
      model: GENERATION_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: buildEvalPrompt(questions) }],
    });
    const text = extractText(response);
    const result = parseJson(text) as DifficultyScore;
    return result;
  } catch (e) {
    console.warn('Difficulty evaluation failed:', e);
    return null;
  }
}

// 設問単位の語彙リトライ（バリデーション違反があった設問のみを対象に、最大2回まで再生成する）。
// 5問全体を作り直す旧方式は廃止：語割り当てが設問ごとに固定済みのため、他の設問を巻き込む必要がない。
async function retryVocabQuestion(
  group: VocabWordGroup,
  questionNumber: number,
  allowedWords: Set<string>,
  initialErrors: string[]
): Promise<VocabQuestion> {
  let lastErrors = initialErrors;
  let lastCandidate: VocabQuestion | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const retryStart = Date.now();
    try {
      const regenerated = await generateVocabOnly([group], lastErrors);
      console.log(`[Timing] vocab question ${questionNumber} retry ${attempt}/2: ${Date.now() - retryStart}ms`);
      const candidate: VocabQuestion = { ...regenerated[0], number: questionNumber };
      const errors = validateOneVocabQuestion(candidate, questionNumber, group, allowedWords);
      lastCandidate = candidate;
      if (errors.length === 0) {
        return candidate;
      }
      console.warn(`[Vocab] question ${questionNumber} retry ${attempt}/2 still invalid:`, errors);
      lastErrors = errors;
    } catch (e) {
      console.warn(`[Vocab] question ${questionNumber} retry ${attempt}/2 failed:`, e);
    }
  }

  if (lastCandidate) {
    console.warn(`[Vocab] question ${questionNumber}: 2回のリトライ後も未解決。直近の再生成結果を採用:`, lastErrors);
    return lastCandidate;
  }
  throw new Error(`question ${questionNumber}: all retries failed with no parseable candidate`);
}

export async function generateQuestions(
  article: Article,
  format: ReadingFormat,
  attempt = 0
): Promise<GeneratedQuestions> {
  const jstDay = new Date(Date.now() + 9 * 60 * 60 * 1000).getDate();
  const wordSet = sampleWordBank(jstDay, attempt);
  const trimmedArticle = { ...article, content: article.content.slice(0, 2000) };

  // ===== Step 1: 語彙・読解を並列で独立生成（v5.1: 記事に依存しない語彙は別呼び出しにして
  // タイムアウトリスクを下げつつ、互いに独立なので並列実行でレイテンシも短縮する） =====
  const genStart = Date.now();
  const [vocabDraft, readingDraft] = await Promise.all([
    generateVocabOnly(wordSet.groups).then(r => { console.log(`[Timing] vocab initial: ${Date.now() - genStart}ms`); return r; }),
    generateReadingOnly(trimmedArticle, format).then(r => { console.log(`[Timing] reading: ${Date.now() - genStart}ms`); return r; }),
  ]);

  // ===== Step 2: 語彙を設問単位でバリデーション＋個別リトライ（違反した設問のみ、最大2回、並列実行） =====
  const allowedWords = new Set(wordSet.groups.flatMap(g => [g.correct, ...g.distractors]).map(w => w.word.toLowerCase().trim()));
  const vocabQuestions = await Promise.all(vocabDraft.map(async (q, i) => {
    const num = i + 1;
    const group = wordSet.groups[i];
    const errors = validateOneVocabQuestion(q, num, group, allowedWords);
    if (errors.length === 0) return q;

    console.warn(`[Vocab] question ${num} validation issues, retrying this question only:`, errors);
    try {
      return await retryVocabQuestion(group, num, allowedWords, errors);
    } catch (e) {
      console.warn(`[Vocab] question ${num}: retries exhausted with no valid candidate, keeping original draft:`, e);
      return q;
    }
  }));

  // 安全網: 個別リトライ後も設問間の重複・プール外語が残っていないか最終確認（警告のみ）
  const finalVocabValidation = validateVocabQuestions(vocabQuestions, wordSet);
  if (!finalVocabValidation.valid) {
    console.warn('[Vocab] post-retry validation issues (continuing anyway):', finalVocabValidation.errors);
  }

  // ===== Step 3: 読解選択肢の語数・長さ癖・極端語チェック（内容一致形式のみ） =====
  // 35語超過が1セット3件以上の場合のみ、読解を1回だけ再生成する（v5.1.3）。それ未満は警告のみ。
  let finalReading = readingDraft;
  if (format === 'content') {
    const overLengthCount = countOverMaxWordChoices(finalReading.readingQuestions);
    if (overLengthCount >= 3) {
      console.warn(`[Reading] 35語超過が${overLengthCount}件（3件以上のため読解を再生成）`);
      const retryStart = Date.now();
      try {
        const retried = await generateReadingOnly(trimmedArticle, format, [
          `前回の生成では選択肢が35語の上限を${overLengthCount}件超過した。全選択肢を20-33語に収め、35語を絶対に超えないこと。長くなる場合は従属節を削って短くする。`,
        ]);
        console.log(`[Timing] reading retry: ${Date.now() - retryStart}ms`);
        const retryOverLengthCount = countOverMaxWordChoices(retried.readingQuestions);
        if (retryOverLengthCount < overLengthCount) {
          finalReading = retried;
        } else {
          console.warn(`[Reading] retry did not improve (${retryOverLengthCount} vs ${overLengthCount} before), keeping original draft`);
        }
      } catch (e) {
        console.warn('[Reading] retry failed, keeping original draft:', e);
      }
    }

    const lengthValidation = validateChoiceLength(finalReading.readingQuestions);
    if (!lengthValidation.valid) {
      console.warn('[Reading] choice length issues (continuing anyway):', lengthValidation.errors);
    }
    const longestValidation = checkCorrectIsLongest(finalReading.readingQuestions);
    if (!longestValidation.valid) {
      console.warn('[Reading] correct-is-longest issues (continuing anyway):', longestValidation.errors);
    }
    const absoluteWordsValidation = checkAbsoluteWords(finalReading.readingQuestions);
    if (!absoluteWordsValidation.valid) {
      console.warn('[Reading] absolute-word issues (continuing anyway):', absoluteWordsValidation.errors);
    }
  }

  // ===== Step 4: 選択肢シャッフル =====
  return applyChoiceShuffle({
    article,
    readingFormat: format,
    vocabQuestions,
    readingPassage: finalReading.readingPassage,
    readingPassageJa: finalReading.readingPassageJa,
    readingQuestions: finalReading.readingQuestions,
    generatedAt: new Date().toISOString(),
  });
}

function applyChoiceShuffle(q: GeneratedQuestions): GeneratedQuestions {
  return {
    ...q,
    vocabQuestions: q.vocabQuestions.map(shuffleChoices),
    readingQuestions: q.readingQuestions.map(shuffleChoices),
  };
}
