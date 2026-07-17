import Anthropic from '@anthropic-ai/sdk';
import { Article } from './rss';
import { WORD_BANK, WordEntry, CEFR_BELOW_C1_BLOCKLIST } from './wordbank';
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

// v5.2 A-1: 出題済み語の除外。保存済み過去問データが無い/読めない期間の初期シードとして、
// 2026-07-07〜2026-07-12の出題語をハードコードしておく（このシードは過去データに
// 統合された後も残しておいて問題ない。重複除外の集合演算なので害がない）。
const USED_WORDS_SEED: string[] = [
  // 正解語
  'tenacious', 'appall', 'conjecture', 'meticulous', 'paradigm', 'thermal', 'retrieve',
  'referendum', 'swindle', 'pinnacle', 'rampant', 'diminish', 'foliage', 'meddle', 'transparent',
  'quip', 'accentuate', 'propitious', 'rummage', 'solace', 'avid', 'vent', 'legitimate', 'overhaul',
  'complacent', 'collaborate', 'pariah', 'extremist', 'eminent',
  // 誤答語
  'acrid', 'lavish', 'ubiquitous', 'render', 'commiserate', 'inflict', 'tenet', 'fiasco',
  'irrigation', 'bizarre', 'sleek', 'elusive', 'propensity', 'upheaval', 'menace', 'fortuitous',
  'pesky', 'frivolous', 'override', 'jostle', 'engender', 'offshoot', 'connoisseur', 'vie', 'brag',
  'shroud', 'incision', 'eyewitness', 'prowess', 'frigid', 'inquisitive', 'state-of-the-art',
  'emulate', 'withhold', 'epitomize', 'accomplice', 'farce', 'repository', 'allude', 'detest',
  'hone', 'cessation', 'pseudonym', 'cogent', 'fastidious', 'microscopic', 'fixture',
  'constellation', 'encroach', 'petrify', 'huddle', 'disproportionate', 'insidious',
  'unscathed', 'resurrect', 'incubate', 'deter', 'feasibility', 'predator', 'hermit',
  'impassive', 'wanton', 'curb', 'clamor', 'squander', 'momentous', 'abject', 'placid', 'absolve',
  'juxtapose', 'assuage', 'reprehensible', 'resplendent', 'requisite', 'mar', 'prosecute',
  'mystique', 'impunity', 'slur', 'kickback', 'consternation', 'inscrutable', 'pompous', 'diffident',
];

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
 * excludedWords: v5.2 A-1。直近30日の出題済み語（呼び出し元がKV/ファイルキャッシュから収集）。
 *                正解語・誤答語のどちらの候補にもしない。CEFR_BELOW_C1_BLOCKLISTと合わせて
 *                候補プールから除外する。
 */
function sampleWordBank(seed?: number, attempt = 0, excludedWords?: Set<string>): SampledWordSet {
  const s = (seed ?? new Date().getDate()) * 1000 + attempt;
  // simple seeded shuffle using the date+attempt as seed
  const shuffled = [...WORD_BANK];
  let state = s * 1234567 + 89;
  for (let i = shuffled.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const isBlocked = (word: string): boolean => {
    const w = word.toLowerCase().trim();
    return CEFR_BELOW_C1_BLOCKLIST.has(w) || (excludedWords?.has(w) ?? false);
  };

  // 品詞別バケツ（シャッフル順を保持、除外語は事前に取り除く）と、各バケツの走査位置ポインタ
  const buckets = new Map<WordEntry['pos'], WordEntry[]>();
  shuffled.filter(w => !isBlocked(w.word)).forEach(w => {
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
    if (isBlocked(candidate.word) || usedWords.has(candidate.word)) continue;

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
    // v5.2 D-12: 内容一致は次の5種に固定。fill-in-blankは従来通り別の2種（方向性の逆転/部分的整合）を使う
    technique: '語句流用・内容ズレ' | '因果逆転' | '主語すり替え' | '極端化' | '本文に根拠なし' | '方向性の逆転' | '部分的整合';
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

【語彙問題 生成ルール v5.2】
■ 語彙問題はゼロから例文を作成する（記事や読解パッセージとは無関係）。
■ 各設問に指定された「正解語」「誤答3語」をそのまま使うこと。語を追加・変更・入れ替えてはならない（4択内の並び順=A/B/C/Dへの割り当ては自由）。
■ **指定語は与えられた形（原形・単数形）のまま一字も変えずに空所に入ること。** そのために、指定語がその形で文法的に成立する構文で例文を設計する：
  - 動詞なら: to不定詞の後（"decided to ____"）／助動詞の後（"must/should/could ____"）／"help (人) ____"や"had no choice but to ____"等の後
  - 名詞（単数形）なら: 単数で成立する枠を使う（"a/the ____"、"hold a ____"、"become a ____"等）
  - 活用形・複数形・三人称単数現在形などに変えてはならない（例: 正解語がappallなら"appalled"ではなく"appall"のまま入る構文にする）
■ 正解語・誤答語は英検1級パス単収載レベル相当（CEFR C1〜C2）であることが前提（指定語は既にコード側でこの水準に絞り込み済みなので、語の選定について心配する必要はない）。
■ 各問題は、指定された正解語が最も自然・典型的に使われる例文を作る
  - **正解語には「コロケーション例」が与えられている。例文はこのコロケーション例と同じ構文パターン・同じ種類の目的語/主語を踏襲すること。** コロケーション例と異なる種類の目的語を使わない（例: コロケーション例が人物・集団を目的語に取るなら、抽象的な出来事・行為・概念を目的語にしない。"appall the abuses"のような、コロケーション例から外れた非文的な組み合わせを作らない）
  - 例文の長さは20〜30語、英検1級の語彙問題と同等の文体（新聞・論説調）
  - テーマは指定された通りにする
  - 空所は1文につき1箇所（____ で表す）。空所の前後に正解を特定できる文脈手がかりを必ず置く
  - **固定コロケーションの穴埋めで即答できる設計を禁止する**（例: "paradigm ____" → shift、"thermal ____" → insulation、"witty ____" → quip、"seek ____ in" → solace のように、正解語がコロケーション相手の語から機械的に一意に決まる出題は不可）。正解は文脈の論理（因果・対比・程度・方向のいずれか）から導けるように設計し、コロケーション自体は正解語の使い方の自然さを担保するために使う（＝コロケーションだけで解けてはいけない）。
- 誤答3語は指定された品詞で統一済みなので、品詞の心配は不要（そのまま使うだけでよい）。3語のうち最低2語には「意味近接・焦点ズレ」という説明の切り口を与える（文脈に一見入りそうだが、ニュアンス・共起・方向性が合わない、という説明にする）。残り最大1語には「文脈と不整合」（意味が逆、または文脈と無関係）の説明を与える
- 正解率30〜60%を想定した説明の書き方にする（文脈から推測しにくい語という前提で解説する）
- Include the correct answer with a structured Japanese explanation following this format:

  【解説文体ルール（必須）】
  ■ 断定形で書く。「〜とも読める」「とも言える」「ただし〜」「あり得るが」「解釈もある」等の留保表現は禁止。
    NG：「waneが正解。ただしcontrastive読みもあり得るが〜」
    OK：「時間経過とともに関心が薄れるという文脈でwaneが最適。直後の節はwaneの進行を抑制する対比表現である」
  ■ 選択肢は数字(1〜4)で言及すること（A/B/C/Dのアルファベットは使わない。UI上の選択肢表示が1〜4の数字のため）
    各不正解をその番号と単語テキストで明示する。例：【2: curtail】文脈と不整合「〜」
    番号順（1→2→3→4）に記述すること
    **この数字ルールは解説文（explanationフィールド）内の言及方法にのみ適用される。JSON構造上の"choices"オブジェクトのキーは、この規則と無関係に必ず"A"/"B"/"C"/"D"の4文字を使うこと（"1"/"2"/"3"/"4"をキーにしてはならない）。**
  ■ 解説文中で正解語を記述する際は問題文の表記と完全に一致させること（タイポ禁止）
  ■ 正解語の固有ニュアンスを1文で示す（訳語の羅列ではなく文脈での機能を優先）
    例：「事前に手を打つことで問題を未然に防ぐというobviate固有のニュアンスが文脈と合致」
  ■ 正解と最も混同しやすい選択肢との違いを1文で必ず言及すること

  【正解】問題文の該当箇所を引用し、正解語固有のニュアンスで説明。
  【不正解各選択肢】番号と単語を明示しラベルを示す（ラベルは次の2種のみ。新しい呼称を作らない）：
    「意味近接・焦点ズレ」：意味が近いが文脈の焦点・ニュアンス・共起がズレる語
    「文脈と不整合」：意味が逆、または文脈と無関係で、そもそも文脈に合わない語
  【紛らわしいペア】正解と最も混同しやすい選択肢がある場合は「XvsY：違いの1文説明」を追記

**生成後SELF-CHECK（出力前に必ず全て確認し、満たさない場合は問題文・選択肢を修正する）:**
V1. 正解語を空所に入れた完全文を書き出し、文法的に成立するか確認する。成立しない場合は問題文を修正する。
V2. 空所直前の冠詞(a/an)・前置詞が、4択のうち一部だけを文法的に排除してしまわないか確認する。排除する場合は冠詞を空所内に含めるか、選択肢（＝指定語なので実際には文構造）を調整して回避する。
V3. 誤答3語それぞれについて「なぜ誤りか」と「なぜ選びたくなるか」を1文ずつ言語化できるか確認する。後者が言えない誤答は「文脈と不整合」ラベルに倒す（無理に「意味近接・焦点ズレ」を付けない）。
- [ ] 指定された正解語・誤答3語をそのまま4択として使っている（語の追加・変更・入れ替えをしていない）
- [ ] 4択すべてが指定された形（原形・単数形）のまま一字も変えず使われている（活用・語尾変化していない）
- [ ] 正解語の例文が、与えられたコロケーション例と同じ構文パターン・目的語の種類になっている
- [ ] 固定コロケーションの穴埋めだけで即答できる設計になっていない（文脈の論理で解ける）
- [ ] 正解語が問題文中に出現していない（活用形・派生語も含む）
- [ ] 問題文に ____ が1箇所だけある
- [ ] 誤答3択のうち最低2択が「意味近接・焦点ズレ」である
- [ ] 「文脈と不整合」の誤答は1語以内である

Return ONLY valid JSON in this exact format. Output the JSON object itself only — no preamble/lead-in text, no trailing commentary, and no markdown code fences (do not wrap the output in \`\`\` or \`\`\`json):
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
      "explanation": "【正解】文中の'regulations were intended to be a ____ to those who might otherwise violate'より、法律違反を未然に防ぐ「抑止力」を意味するdeterrentが最適。単なる制限でなく違反意図そのものを抑える語が必要。【2: reprimand】意味近接・焦点ズレ─事後的な「叱責・懲戒」であり、違反を未然に抑止するdeterrentとは機能が異なる。deterrent vs reprimand：deterrentは「未然防止」、reprimandは「事後対処」。【3: constraint】意味近接・焦点ズレ─「制約」そのものを指し、違反への抑止という心理的作用を持たない。【4: inducement】文脈と不整合─違反を促す「誘因」であり、意味が逆。"
    }
  ]
}`;
}

function buildVocabDynamicContext(groups: VocabWordGroup[], excludedWords?: Set<string>): string {
  const groupsText = groups
    .map((g, i) => {
      const distractorsText = g.distractors.map(d => `${d.word}（${d.meaning}／例：${d.phrase}）`).join(' / ');
      return `問${i + 1}（テーマ: ${g.theme}、品詞: ${g.pos}）
  正解語: ${g.correct.word}（意味: ${g.correct.meaning}）
  正解語のコロケーション例（この構文パターン・目的語の種類に忠実に例文を作ること）: "${g.correct.phrase}"
  誤答3語（この3語をそのまま使う。他の語に変えない）: ${distractorsText}`;
    })
    .join('\n\n');

  // v5.2 B-4: 出題済みリスト（コードから注入）。今回の使用語はこのリストから既に除外済みだが、
  // 例文中で参考語・関連語として言及する際にもこのリストの語を再登場させないための安全網として渡す。
  const usedListText = excludedWords && excludedWords.size > 0
    ? `\n\n【出題済みリスト（直近30日分。この設問の4語には含まれていないが、例文中の他の語としても使用しないこと）】\n${[...excludedWords].join(', ')}`
    : '';

  return `## 各設問の使用語（固定・変更禁止。この通りに1問ずつ割り当てて例文と解説を作成する）
${groupsText}${usedListText}`;
}

async function generateVocabOnly(
  groups: VocabWordGroup[],
  errors?: string[],
  excludedWords?: Set<string>
): Promise<VocabQuestion[]> {
  let dynamicContext = buildVocabDynamicContext(groups, excludedWords);
  if (errors && errors.length > 0) {
    dynamicContext += `\n\n## ⚠️ 前回の生成で以下のエラーが検出されました。必ず修正してください：\n${errors.map(e => `- ${e}`).join('\n')}`;
  }

  const stream = client.messages.stream({
    model: GENERATION_MODEL,
    // v5.2実測ではvocabQuestions 5問の通常出力は2,000〜2,400トークン程度だが、
    // 本番で12,000ちょうどまで到達しstop_reason:'max_tokens'で打ち切られJSONが
    // 未完成のまま返る事例が発生したため、暴走出力への余裕を持たせて16,000に引き上げ
    max_tokens: 16000,
    system: [
      { type: 'text', text: buildVocabStaticInstructions(), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: dynamicContext }],
  });
  const response = await stream.finalMessage();
  const text = extractText(response);
  console.log('[Vocab] stop_reason:', response.stop_reason, 'output_tokens:', response.usage?.output_tokens);
  if (response.stop_reason === 'max_tokens') {
    console.error(`[Vocab] レスポンスがmax_tokens(${response.usage?.output_tokens})で打ち切られた（JSON未完成の可能性が高い）`);
  }
  try {
    const parsed = parseJson(text) as { vocabQuestions: VocabQuestion[] };
    return parsed.vocabQuestions.map((q, i) => normalizeVocabChoiceKeys(q, `語彙(${i + 1})`));
  } catch (e) {
    console.error('[Vocab] JSON parse/validation error:', e);
    console.error('[Vocab] Claude response (full, length=' + text.length + '):', text);
    throw new Error('Failed to parse JSON from Claude response (vocab)');
  }
}

// v5.2の解説文体ルール（選択肢を数字1〜4で参照する）につられて、choicesオブジェクト自体のキーも
// "A"/"B"/"C"/"D" ではなく "1"/"2"/"3"/"4" で返してくることがある。値自体は正しい4択のままなので、
// 型定義（choices: {A,B,C,D}）を前提に書かれている下流処理（シャッフル・ラベル整合性検証等）が
// choices.D 等をundefinedとして扱いクラッシュする前に、ここでA/B/C/D表記へ正規化する。
function normalizeVocabChoiceKeys(q: VocabQuestion, label: string): VocabQuestion {
  const rawChoices = q.choices as unknown as Record<string, string>;
  if (CHOICE_KEYS.every(k => typeof rawChoices[k] === 'string')) {
    return q;
  }

  const NUM_KEYS = ['1', '2', '3', '4'] as const;
  if (NUM_KEYS.every(k => typeof rawChoices[k] === 'string')) {
    const newChoices = {} as { A: string; B: string; C: string; D: string };
    CHOICE_KEYS.forEach(letterKey => { newChoices[letterKey] = rawChoices[KEY_TO_NUM[letterKey]]; });
    const newAnswer = NUM_TO_KEY[q.answer] ?? q.answer;
    console.warn(`[Vocab] ${label}: choicesが数字キー(1-4)で返されたためA-D表記に正規化した`, Object.keys(rawChoices));
    return { ...q, choices: newChoices, answer: newAnswer };
  }

  throw new Error(`${label}: choicesのキーが不正（期待: A/B/C/D、実際: [${Object.keys(rawChoices).join(', ')}]）`);
}

// ===== 読解生成（記事に基づく。語彙とは完全に独立した呼び出し） =====
function buildReadingOnlyStaticInstructions(format: ReadingFormat): string {

  // ===== 穴埋め形式 (Part 2 style) =====
  const fillInBlankInstructions = `
2. **Reading Passage with 3 blanks** (長文穴埋め - EIKEN Grade 1 Part 2 style):
   - Write a 3-paragraph passage of approximately 500 words total (450-550 words is the acceptable range; 500 is the target)
   - Difficulty: EIKEN Grade 1 level academic English
   - **Structure**: reconstruct the news source into an authentic academic argumentative essay — claim → supporting evidence → counterargument/qualification → synthesis (主張→根拠→反論・限定→総合). Do not just summarize the news article chronologically.
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
   - Write a 3-4 paragraph passage of 550-650 words (this is an intentional intermediate target short of the real exam's ~800 words; hit this range even if it means trimming supporting detail)
   - Difficulty: EIKEN Grade 1 level academic English
   - **Structure**: reconstruct the news source into an authentic academic argumentative essay with clear topic sentences and evidence — claim → supporting evidence → counterargument/qualification → synthesis (主張→根拠→反論・限定→総合). Do not just summarize the news article chronologically.
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
   - **Distinct-paragraph requirement**: each of the 4 questions must draw its evidence from a DIFFERENT paragraph of the passage. Never let two questions rely on the same paragraph (or substantially the same point) as their evidence.
   - Each question has 4 choices that are COMPLETE SENTENCES, **20-33 words each — 35 words is a HARD CEILING that must never be exceeded, and 15 words is a hard floor**. Count your words before finalizing each choice; if a choice runs long, cut a subordinate clause rather than let it exceed 35.
   - **No length bias**: the correct choice must NOT be the single longest of the 4 by itself. At least one wrong choice must be the same length as or longer than the correct choice — otherwise a test-taker could answer correctly just by picking the longest option without reading.
   - **Uniform construction**: keep all 4 choices similar in length and grammatical structure (e.g., don't make only the correct choice a complex sentence with subordinate clauses while the others are simple) — only the content should differ, not the shape.

   **CRITICAL RULES FOR CORRECT ANSWERS:**
   - **No direct quotation**: NEVER copy-paste from the passage.
   - **True paraphrase = word substitution AND syntactic restructuring BOTH**:
     ❌ NG: "the conditions focus on territorial integrity" → "the conditions address territorial integrity"（語の置換のみ）
     ✅ OK: "the conditions focus on territorial integrity" → "preserving national borders forms the basis of the proposed framework"

   **CRITICAL RULES FOR WRONG CHOICES（v5.2）:**
   Choose exactly one type per wrong choice from the 5 fixed types below. **Never use the same type twice for the 3 wrong choices within a single question** (you may reuse a type across different questions in the passage). Do not invent new type names — these 5 are the fixed label set:

   **1.「語句流用・内容ズレ」**
   Reuse real words/phrases from the passage but shift the content so it no longer matches. This also covers: (i) taking the side of a contrast that the passage explicitly negated or set in opposition (対比節の言い換え) — e.g. 本文「AではなくB」→ 誤答「A」を正しい内容として提示, and (ii) pulling in content that actually belongs to a different paragraph than the one relevant to this question (別段落の内容の混入).
   例: 本文「Aが重要だが、Bは限定的にしか有効でない」→ 誤答「Bが最も有効な手段である」（対比の逆側を採用）

   **2.「因果逆転」**
   Swap cause and effect from the passage.
   例: 本文「Aが起きたのでBになった」→ 誤答「BのためにAが生じた」

   **3.「主語すり替え」**
   Present an action/claim made by subject A in the passage as if made by a different subject B that also appears in the passage.
   例: 本文「批評家が指摘した」→ 誤答「著者が主張している」
   例: 本文「NICEが推奨した」→ 誤答「NHSが実施した」

   **4.「極端化」**
   Turn a tentative claim into a certainty, in this priority order:
   (a) 既成事実化（優先）: turn could/may/suggests into has/did/demonstrated
   (b) 条件・留保の削除（優先）: drop qualifying phrases like "in part" / "some" / "において"
   (c) 絶対語の使用（最終手段）: every / all / never / always / certainly / invariably / definitively / entirely / undoubtedly 等
   - **絶対表現（all/every/never/always/certainly/invariably/definitively/entirely/undoubtedly等）を含む選択肢は、1問の4択の中で最大1つまでとする**。目立って消去法の手がかりになるため、(a)(b)による「穏やかな断定」を主力にすること。

   **5.「本文に根拠なし」**
   Introduce a subject/fact that never appears in the passage. **Use sparingly — at most 2 choices per passage (across all 4 questions)**, and **never construct this as a fully fabricated, lexically unconnected invention** (e.g. an invented ocean current, treaty, or study with no vocabulary overlap with the passage) — such choices are trivially eliminable by cross-checking and defeat the purpose of the question.

   **Keyword overlap requirement**: Each wrong choice must include at least 2 actual keywords from the passage (same subject, proper nouns, or technical terms). Never introduce concepts completely absent from the passage.

   **Explanation format for each reading question:**
   【解説文体ルール（必須）】
   ■ 断定形で書く。「〜とも読める」「ただし〜」等の留保表現は禁止。
   ■ 選択肢は数字(1〜4)で言及すること（A/B/C/Dのアルファベットは使わない。UI上の選択肢表示が1〜4の数字のため）。番号順（1→2→3→4）に記述すること
   ■「極端化」を使った誤答の場合は、本文の「可能性・当為」と誤答の「必然・義務」の具体的な差を示す
     例：「本文はvigilant oversightという自発的改善を述べており、government controlsという外部強制の必然性までは主張していない」
   ■「主語すり替え」を使った誤答の場合は、本文中の本来の主体と誤答が差し替えた主体を両方明示する
     例：「本文で指摘しているのはcriticsであり、authorではない」

   【正解】本文の該当箇所を必ず引用：「本文に'～'とあり、これをparaphraseすると正解の'～'に対応する」。推論問題の場合は「本文の'A'と'B'から推論できる」と複数箇所を示す。
   【各誤答】番号とラベルを明示（ラベルは上記5種のみ。新しい呼称を作らない）：
     【2: ...】因果逆転　→「本文では原因と結果が逆に記述されている」
     【3: ...】語句流用・内容ズレ　→「本文では'～'とあるが、選択肢では別の内容にズレている」
     【4: ...】極端化　→「本文では'could/may'と可能性で述べているが、選択肢では断定している」
     主語すり替え→「本文で～したのは(1)であり、選択肢の(2)ではない」
     本文に根拠なし→「この内容は本文中に記述がない」（使用時のみ、1パッセージにつき2択まで）

   **SELF-CHECK（内容一致・11項目）:**
   - [ ] 問題数が4問である
   - [ ] 正解がparaphrase（語の言い換え＋構文変換の両方）されている
   - [ ] 4問それぞれが互いに異なる段落を根拠としている（同じ段落・実質同じ論点を2問が根拠にしていない）
   - [ ] 同一設問内で誤答3つの型（語句流用・内容ズレ/因果逆転/主語すり替え/極端化/本文に根拠なし）が重複していない
   - [ ]「本文に根拠なし」型は1パッセージにつき2択以内に収まっており、本文と語彙的接点のない完全な捏造ではない
   - [ ] 各誤答に本文キーワードが2語以上含まれている
   - [ ] 誤答に「明らかな外れ」がない
   - [ ] 正解選択肢が4択中で単独最長になっていない（誤答1つ以上が正解と同等以上の長さ）。4択の長さ・文法構造も揃っている
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

  const contentJsonExample = `  "readingPassage": "The passage text here (3-4 paragraphs, 550-650 words)...",
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
      "explanation": "第2段落「individuals who had access to more choices tend to report lower levels of satisfaction」をparaphraseした(1)が正解。(2)語句流用・内容ズレ─選択肢数が多いほど決定の「質」が上がると本文の限定的な記述を拡大解釈している。(3)因果逆転─Decision paralysisの原因と結果を入れ替え、経験不足が原因であるかのように描いている。(4)極端化─筆者が示唆する「適応の可能性」を「同等の結果に達する」と過度に強めている。"
    }
  ]`;

  const readingJsonExample = format === 'fill-in-blank'
    ? fillInBlankJsonExample
    : contentJsonExample;

  return `You are an expert English exam question creator specializing in EIKEN Grade 1 (英検1級) level questions. You have deep knowledge of the actual EIKEN Grade 1 exam format.

Create an authentic EIKEN Grade 1 style reading passage and comprehension questions based on the news article that will be provided in a separate context block below.
${readingInstructions}

Return ONLY valid JSON in this exact format. Output the JSON object itself only — no preamble/lead-in text, no trailing commentary, and no markdown code fences (do not wrap the output in \`\`\` or \`\`\`json):
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
  if (response.stop_reason === 'max_tokens') {
    console.error(`[Reading] レスポンスがmax_tokens(${response.usage?.output_tokens})で打ち切られた（JSON未完成の可能性が高い）`);
  }
  try {
    return parseJson(text) as {
      readingPassage: string;
      readingPassageJa: string;
      readingQuestions: ReadingQuestion[];
    };
  } catch (e) {
    console.error('[Reading] JSON parse error:', e);
    console.error('[Reading] Claude response (full, length=' + text.length + '):', text);
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
- incorrectReason: **不正解語には必ず設定する**。ラベルは次の2種のみに固定し、新しい呼称を作らない：「意味近接・焦点ズレ」（意味が近いが文脈の焦点・ニュアンス・共起がズレる）/「文脈と不整合」（意味が逆、または文脈と無関係）。ラベル名で書き始め、コロン以降に具体理由を続ける（25字以内）
- **正解語には incorrectReason を設定しない**（フィールド自体を省略する）

【confusingPairs】
■ 正解語と最も混同しやすい誤答語のペアを、各設問から必要に応じて挙げる
■ choiceA・choiceBは必ず今回渡された20単語（5問×4択）のいずれかから選ぶこと。それ以外の単語を挙げない

## 出力形式（JSONのみ、コメント禁止）
{
  "vocabAnnotations": {
    "deterrent": { "translation": "抑止力", "pos": "名", "collocation": "a deterrent effect / act as a deterrent" },
    "reprimand": { "translation": "叱責", "pos": "名", "collocation": "a formal reprimand / receive a reprimand", "incorrectReason": "意味近接・焦点ズレ: 事後対処で文脈に不一致" },
    "constraint": { "translation": "制約", "pos": "名", "collocation": "a legal constraint / under constraint", "incorrectReason": "意味近接・焦点ズレ: 心理的抑止力なし" },
    "inducement": { "translation": "誘因", "pos": "名", "collocation": "financial inducement / an inducement to act", "incorrectReason": "文脈と不整合: 意味が逆（誘発）" }
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
- choiceKey: "A"/"B"/"C"/"D"（必ず4つ、アルファベット順。データ構造上のキーであり、explanation等のプローズ中で選択肢に言及する際は数字1〜4を使うこと）
- choiceText: 問題の選択肢テキストと完全一致させること
- choiceTranslation: 自然な日本語訳（フレーズなので文脈上の意味を補って訳す）
- isCorrect: 正解のみtrue（1問につき必ず1つだけ）
- 正解の場合: correctReason = { paragraphRef:"第N段落", originalText:"空所前後の引用", paraphraseExplanation:"なぜこのフレーズが空所に合うかの説明" }
- 不正解の場合: incorrectReason = { technique:"方向性の逆転" または "部分的整合", originalText:"関連する本文箇所", explanation:"なぜ空所に合わないかの説明" }
  technique の選択：
  "方向性の逆転"：本文の論旨と逆方向の内容（本文が増加を示すのに減少を示す等）
  "部分的整合"：本文のキーワードを含むが論理的に前後と合わない` : `
【readingChoiceExplanations ルール（内容一致形式・v5.2）】
読解問題の各設問について、4択すべてに以下を生成する：
- choiceKey: "A"/"B"/"C"/"D"（必ず4つ、アルファベット順。データ構造上のキーであり、explanation等のプローズ中で選択肢に言及する際は数字1〜4を使うこと）
- choiceText: 問題の選択肢テキストと完全一致させること
- choiceTranslation: 自然な日本語訳（直訳禁止。主語・接続詞を補い、長ければ2文に分ける）
- isCorrect: 正解のみtrue（1問につき必ず1つだけ）
- 正解の場合: correctReason = { paragraphRef:"第N段落", originalText:"本文引用", paraphraseExplanation:"対応説明" }
- 不正解の場合: incorrectReason = { technique:"ラベル名", originalText:"本文引用", explanation:"具体的な誤りの説明" }
  technique は次の5種から1つ選ぶ（固定。新しい呼称を作らない）：
  "語句流用・内容ズレ"：本文語句を流用しつつ内容がズレている（対比の逆側の採用、別段落内容の混入を含む）
  "因果逆転"：本文のA→BがB→Aに逆転している
  "主語すり替え"：本文の主体Aの行為・主張を、本文に登場する別の主体Bのものとして提示している
  "極端化"：could/may/suggests → has proven/will/inevitably に変質、または絶対語の使用
  "本文に根拠なし"：本文に一切記述がない（originalTextは空文字。本文と語彙的接点のない完全な捏造は使わない）`;

  return `英検1級の読解問題について、各選択肢のアノテーションと詳細解説を生成してください。
形式：${isFillInBlank ? '穴埋め（fill-in-blank）' : '内容一致（content）'}

## ルール
${readingExplanationRules}

## 出力形式（JSONのみ、コメント禁止）
{
  "reading": [
    {
      "A": { "translation": "正解の自然な日本語訳", "pos": "", "collocation": "" },
      "B": { "translation": "誤答の訳", "pos": "", "collocation": "", "incorrectReason": "${isFillInBlank ? '部分的整合: 英国限定を全先進国に拡大' : '語句流用・内容ズレ: 英国限定を全先進国に拡大'}" },
      "C": { "translation": "誤答の訳", "pos": "", "collocation": "", "incorrectReason": "${isFillInBlank ? '方向性の逆転: 因果関係が逆' : '因果逆転: 因果関係が逆'}" },
      "D": { "translation": "誤答の訳", "pos": "", "collocation": "", "incorrectReason": "${isFillInBlank ? '部分的整合: 可能性を断定化' : '極端化: 可能性を断定化'}" }
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
            "technique": "${isFillInBlank ? '部分的整合' : '語句流用・内容ズレ'}",
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
            "technique": "${isFillInBlank ? '方向性の逆転' : '因果逆転'}",
            "originalText": "本文の該当箇所",
            "explanation": "本文では(1)→(2)という順序だが、この選択肢では逆になっている"
          }
        },
        {
          "choiceKey": "D",
          "choiceText": "選択肢Dの英文",
          "choiceTranslation": "自然な日本語訳",
          "isCorrect": false,
          "incorrectReason": {
            "technique": "${isFillInBlank ? '部分的整合' : '極端化'}",
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

    // ===== v5.2 A-3/D-12: 誤答分類ラベルのホワイトリスト照合・CJK簡体字混入チェック（警告のみ） =====
    const vocabLabelWarnings = checkVocabLabelWhitelist(vocabResult.vocabAnnotations);
    if (vocabLabelWarnings.length > 0) {
      console.warn('[VocabAnnotations] label whitelist issues (continuing anyway):', vocabLabelWarnings);
    }
    if (questions.readingFormat === 'content') {
      const readingLabelWarnings = checkReadingContentLabelWhitelist(readingResult.readingChoiceExplanations);
      if (readingLabelWarnings.length > 0) {
        console.warn('[ReadingAnnotations] label whitelist issues (continuing anyway):', readingLabelWarnings);
      }
    }
    const annotationCjkWarnings = [
      ...Object.entries(vocabResult.vocabAnnotations).flatMap(([word, ann]) =>
        checkCjkSimplifiedContamination(`語彙アノテーション「${word}」`, [ann.translation, ann.incorrectReason].filter(Boolean).join(' '))
      ),
      ...(readingResult.readingChoiceExplanations ?? []).flatMap(exp =>
        exp.choices.flatMap(c => checkCjkSimplifiedContamination(
          `読解(${exp.questionNumber})選択肢${c.choiceKey}`,
          [c.choiceTranslation, c.correctReason?.paraphraseExplanation, c.incorrectReason?.explanation].filter(Boolean).join(' ')
        ))
      ),
    ];
    if (annotationCjkWarnings.length > 0) {
      console.warn('[Annotations] CJK simplified char issues (continuing anyway):', annotationCjkWarnings);
    }

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

// v5.2 D-13: UI（app/quiz）は選択肢を1〜4の数字で表示するため、解説文中の選択肢参照も
// A/B/C/Dではなく数字(1〜4)に統一する（choicesオブジェクト自体のキーはA/B/C/Dのまま変更しない。
// あくまで解説プローズ中の参照表記の話）。
const KEY_TO_NUM: Record<ChoiceKey, string> = { A: '1', B: '2', C: '3', D: '4' };
const NUM_TO_KEY: Record<string, ChoiceKey> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };

// シャッフル後の記号に合わせて、モデル生成済みの explanation 内の選択肢参照
// （例:「【2: reprimand】」「正解2」「2は〜」）を書き換える。数字は西暦・個数等の
// 一般的な数値と誤マッチしないよう、前後に他の数字が隣接しない1〜4の単独数字のみを対象にする。
// 旧仕様（A/B/C/D参照）がモデル出力に残っていた場合の安全網として、レター参照パターンも
// 引き続き処理する（「技法A/技法B」等の穴埋め形式ラベルは対象から除外。FIFA/FEMA等の
// 固有名詞末尾の大文字を誤って書き換えないよう、直前がラテン文字の場合も除外する）。
function remapChoiceLetters(text: string, oldToNew: Record<ChoiceKey, ChoiceKey>): string {
  const oldToNewNum: Record<string, string> = {};
  (Object.keys(oldToNew) as ChoiceKey[]).forEach(k => {
    oldToNewNum[KEY_TO_NUM[k]] = KEY_TO_NUM[oldToNew[k]];
  });

  const numPattern = /(【\s*)([1-4])(\s*[:：】])|(正解\s*)([1-4])(?!\d)|(?<!\d)([1-4])(?!\d)(?=は|が|と|を|の|に対応)/g;
  const letterPattern = /(【\s*)([ABCD])(\s*[:：])|(正解\s*)([ABCD])(?![A-Za-z])|(?<!技法)(?<![A-Za-z])([ABCD])(?=は|が|と|を|の|に対応)/g;

  const afterNum = text.replace(numPattern, (match, p1, n1, p3, p4, n2, n3) => {
    if (n1) return `${p1}${oldToNewNum[n1]}${p3}`;
    if (n2) return `${p4}${oldToNewNum[n2]}`;
    if (n3) return oldToNewNum[n3];
    return match;
  });

  return afterNum.replace(letterPattern, (match, p1, l1, p3, p4, l2, l3) => {
    if (l1) return `${p1}${oldToNew[l1 as ChoiceKey]}${p3}`;
    if (l2) return `${p4}${oldToNew[l2 as ChoiceKey]}`;
    if (l3) return oldToNew[l3 as ChoiceKey];
    return match;
  });
}

// 安全網: remapChoiceLetters適用後も、正規表現の見落とし等で記号がズレている場合があるので
// 【N: word/snippet】（数字参照。旧仕様の【X: ...】レター参照も念のため確認）タグの内容が
// 実際の choices[X] と一致しているかを検証し、不一致があれば警告ログに記録する
// （処理は止めない・リトライにも乗せない）。
function verifyChoiceLabelConsistency(explanation: string, choices: { A: string; B: string; C: string; D: string }): void {
  const checkTag = (key: ChoiceKey, rawTag: string, snippetRaw: string) => {
    const actual = choices[key].trim().toLowerCase();
    // タグの内容は「…」で中略した要約のことがあるため、先頭の断片（最初の「...」より前）だけで照合する
    const leadFragment = snippetRaw.split(/\.{3,}|…/)[0].trim().toLowerCase();
    const snippet = leadFragment.length >= 6 ? leadFragment : snippetRaw.trim().toLowerCase();
    const consistent = snippet.length === 0 || actual.startsWith(snippet) || actual.includes(snippet) || snippet.includes(actual);
    if (!consistent) {
      console.warn(`[ChoiceLabel] 記号ズレの疑い: 【${rawTag}: ${snippetRaw}】 が実際の選択肢${key}="${choices[key].slice(0, 60)}"と一致しない`);
    }
  };

  const numTagPattern = /【([1-4]):\s*([^\n】]+?)】/g;
  let m: RegExpExecArray | null;
  while ((m = numTagPattern.exec(explanation)) !== null) {
    checkTag(NUM_TO_KEY[m[1]], m[1], m[2]);
  }

  const letterTagPattern = /【([ABCD]):\s*([^\n】]+?)】/g;
  while ((m = letterTagPattern.exec(explanation)) !== null) {
    checkTag(m[1] as ChoiceKey, m[1], m[2]);
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

// v5.2 A-2: 正解位置の分散。語彙5問を通じて同一の正解記号(A/B/C/D)が3回以上にならないよう、
// 先に「正解を置く記号」を4種1巡ずつのランダム順で割り当ててから（5問目だけ2巡目の先頭が重複するが、
// 1巡＝各記号ちょうど1回のため、どの記号も最大2回までしか正解にならないことが構造的に保証される）、
// 各設問はその記号に正解が来るよう誤答3つだけをシャッフルする。
function assignBalancedTargetLetters(count: number): ChoiceKey[] {
  const targets: ChoiceKey[] = [];
  while (targets.length < count) {
    const cycle = [...CHOICE_KEYS];
    for (let i = cycle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cycle[i], cycle[j]] = [cycle[j], cycle[i]];
    }
    targets.push(...cycle);
  }
  return targets.slice(0, count);
}

function shuffleChoicesWithTarget<T extends { choices: { A: string; B: string; C: string; D: string }; answer: string; explanation: string }>(
  q: T,
  targetLetter: ChoiceKey
): T {
  const correctOldKey = q.answer as ChoiceKey;
  const wrongOldKeys = CHOICE_KEYS.filter(k => k !== correctOldKey);
  const remainingNewKeys = CHOICE_KEYS.filter(k => k !== targetLetter);

  // 誤答3つをランダムに残りの3記号へ割り当てる（Fisher-Yates）
  for (let i = remainingNewKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingNewKeys[i], remainingNewKeys[j]] = [remainingNewKeys[j], remainingNewKeys[i]];
  }

  const oldToNew = {} as Record<ChoiceKey, ChoiceKey>;
  oldToNew[correctOldKey] = targetLetter;
  wrongOldKeys.forEach((oldKey, i) => { oldToNew[oldKey] = remainingNewKeys[i]; });

  const newChoices = {} as { A: string; B: string; C: string; D: string };
  CHOICE_KEYS.forEach(oldKey => { newChoices[oldToNew[oldKey]] = q.choices[oldKey]; });

  const newAnswer = targetLetter;
  const explanation = remapChoiceLetters(q.explanation, oldToNew);
  verifyChoiceLabelConsistency(explanation, newChoices);
  return { ...q, choices: newChoices, answer: newAnswer, explanation };
}

function shuffleVocabQuestionsBalanced(vocabQuestions: VocabQuestion[]): VocabQuestion[] {
  const targets = assignBalancedTargetLetters(vocabQuestions.length);
  return vocabQuestions.map((q, i) => shuffleChoicesWithTarget(q, targets[i]));
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

// ===== v5.2 A-3: 本文語数チェック（警告のみ・リトライには乗せない） =====
function checkPassageWordCount(passage: string, format: ReadingFormat): ValidationResult {
  const wordCount = passage.trim().split(/\s+/).filter(Boolean).length;
  const [min, max] = format === 'content' ? [550, 650] : [450, 550];
  if (wordCount < min || wordCount > max) {
    return { valid: false, errors: [`読解: 本文語数${wordCount}語（想定${min}〜${max}語の範囲外）`] };
  }
  return { valid: true, errors: [] };
}

// ===== v5.2 A-3: 中国語簡体字混入チェック（警告のみ・リトライには乗せない） =====
// 日本語の解説文に混入しやすい、日本語では通常使わない簡体字（讠/钅/纟系の偏や頻出単漢字）を
// 検出するためのベストエフォートなブロックリスト。網羅的ではないが、実績のある「维」等を含め
// 週次レビューで見つかった文字を追記していく運用とする。
const SIMPLIFIED_ONLY_CHARS = new Set([
  '维', '经', '现', '实', '际', '应', '难', '义', '认', '识', '让', '还', '这', '时', '间',
  '问', '题', '该', '处', '与', '华', '会', '学', '国', '图', '书', '电', '车', '马', '门',
  '爱', '写', '话', '语', '设', '访', '评', '诉', '词', '译', '试', '诗', '误', '说', '请',
  '读', '课', '谁', '调', '谈', '谎', '谢', '计', '议', '讨', '训', '证', '钟', '钢', '铁',
  '铅', '银', '错', '锁', '链', '纪', '约', '级', '给', '组', '红', '练', '细', '终', '绝',
  '统', '继', '续', '绍', '绿', '缓', '缺', '网', '见', '对', '发', '来', '为', '从', '当',
  '万', '与', '产', '严', '举', '丧', '业', '长', '飞', '击', '归', '欢', '权', '汉', '汇',
  '决', '兴', '农', '动', '劳', '势', '医', '压', '厂', '历', '厉', '双', '变', '叶', '号',
]);

function checkCjkSimplifiedContamination(label: string, text: string): string[] {
  const found = [...new Set([...text].filter(ch => SIMPLIFIED_ONLY_CHARS.has(ch)))];
  return found.length > 0 ? [`${label}: 中国語簡体字の混入疑い「${found.join('')}」`] : [];
}

// ===== v5.2 A-3: 空所直前の冠詞(a/an)による選択肢の文法的排除チェック（警告のみ） =====
function startsWithVowelSound(word: string): boolean {
  return /^[aeiou]/i.test(word.trim());
}

function checkArticleAgreement(sentence: string, blankMarker: string | RegExp, choiceGroups: string[][]): string[] {
  const warnings: string[] = [];
  const markers = typeof blankMarker === 'string' ? [blankMarker] : (sentence.match(blankMarker) ?? []);
  markers.forEach((marker, i) => {
    const idx = sentence.indexOf(marker);
    if (idx === -1) return;
    const before = sentence.slice(0, idx).trim();
    const lastWordMatch = before.match(/([A-Za-z]+)\s*$/);
    if (!lastWordMatch) return;
    const article = lastWordMatch[1].toLowerCase();
    if (article !== 'a' && article !== 'an') return;

    const choices = choiceGroups[i] ?? [];
    choices.forEach(choice => {
      const firstWord = choice.trim().split(/\s+/)[0] ?? '';
      const isVowel = startsWithVowelSound(firstWord);
      if (article === 'an' && !isVowel) {
        warnings.push(`空所直前が"an"だが選択肢「${choice}」は子音始まりで文法的に排除可能`);
      } else if (article === 'a' && isVowel) {
        warnings.push(`空所直前が"a"だが選択肢「${choice}」は母音始まりで文法的に排除可能`);
      }
    });
  });
  return warnings;
}

function checkVocabArticleAgreement(questions: VocabQuestion[]): ValidationResult {
  const errors: string[] = [];
  questions.forEach((q, i) => {
    const warnings = checkArticleAgreement(q.sentence, '____', [Object.values(q.choices)]);
    warnings.forEach(w => errors.push(`語彙(${i + 1}): ${w}`));
  });
  return { valid: errors.length === 0, errors };
}

function checkFillInBlankArticleAgreement(passage: string, questions: ReadingQuestion[]): ValidationResult {
  const errors: string[] = [];
  const choiceGroups = questions.map(q => Object.values(q.choices));
  const warnings = checkArticleAgreement(passage, /\(\s*[1-3]\s*\)/g, choiceGroups);
  warnings.forEach(w => errors.push(`読解: ${w}`));
  return { valid: errors.length === 0, errors };
}

// ===== v5.2 D-12: 誤答分類ラベルのホワイトリスト照合（警告のみ） =====
const VOCAB_LABEL_WHITELIST = ['意味近接・焦点ズレ', '文脈と不整合'];
const READING_CONTENT_LABEL_WHITELIST = ['語句流用・内容ズレ', '因果逆転', '主語すり替え', '極端化', '本文に根拠なし'];

function checkVocabLabelWhitelist(vocabAnnotations: Record<string, ChoiceAnnotation>): string[] {
  const errors: string[] = [];
  Object.entries(vocabAnnotations).forEach(([word, ann]) => {
    if (!ann.incorrectReason) return;
    const matches = VOCAB_LABEL_WHITELIST.some(label => ann.incorrectReason!.startsWith(label));
    if (!matches) {
      errors.push(`語彙アノテーション「${word}」: incorrectReasonのラベルがホワイトリスト外（"${ann.incorrectReason}"）`);
    }
  });
  return errors;
}

function checkReadingContentLabelWhitelist(explanations: ReadingQuestionExplanation[] | undefined): string[] {
  if (!explanations) return [];
  const errors: string[] = [];
  explanations.forEach(exp => {
    exp.choices.forEach(c => {
      const technique = c.incorrectReason?.technique;
      if (!technique) return;
      if (!READING_CONTENT_LABEL_WHITELIST.includes(technique)) {
        errors.push(`読解(${exp.questionNumber})選択肢${c.choiceKey}: techniqueラベルがホワイトリスト外（"${technique}"）`);
      }
    });
  });
  return errors;
}

// ===== JSON parser helper =====
// Claudeのレスポンスに```json コードフェンスや前置き文が混入することがあるため、
// 先頭のコードフェンスを除去したうえで先頭`{`〜末尾`}`を抽出してからパースする。
// vocab/reading/annotations等、全てのJSON生成呼び出しで共通利用する。
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenceMatch ? fenceMatch[1] : text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found');
    return JSON.parse(candidate.slice(start, end + 1));
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
  initialErrors: string[],
  excludedWords?: Set<string>
): Promise<VocabQuestion> {
  let lastErrors = initialErrors;
  let lastCandidate: VocabQuestion | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const retryStart = Date.now();
    try {
      const regenerated = await generateVocabOnly([group], lastErrors, excludedWords);
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
  attempt = 0,
  recentlyUsedWords?: Set<string>
): Promise<GeneratedQuestions> {
  const jstDay = new Date(Date.now() + 9 * 60 * 60 * 1000).getDate();
  // v5.2 A-1: 呼び出し元(route.ts)が集めた直近30日分の出題済み語 + 初期シードを合わせて除外集合とする
  const excludedWords = new Set<string>([
    ...USED_WORDS_SEED.map(w => w.toLowerCase()),
    ...(recentlyUsedWords ? [...recentlyUsedWords].map(w => w.toLowerCase()) : []),
  ]);
  const wordSet = sampleWordBank(jstDay, attempt, excludedWords);
  const trimmedArticle = { ...article, content: article.content.slice(0, 2000) };

  // ===== Step 1: 語彙・読解を並列で独立生成（v5.1: 記事に依存しない語彙は別呼び出しにして
  // タイムアウトリスクを下げつつ、互いに独立なので並列実行でレイテンシも短縮する） =====
  const genStart = Date.now();
  const [vocabDraft, readingDraft] = await Promise.all([
    generateVocabOnly(wordSet.groups, undefined, excludedWords).then(r => { console.log(`[Timing] vocab initial: ${Date.now() - genStart}ms`); return r; }),
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
      return await retryVocabQuestion(group, num, allowedWords, errors, excludedWords);
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

  // ===== v5.2 Step 3.5: 追加の警告のみバリデーション（両形式・リトライには乗せない） =====
  const wordCountValidation = checkPassageWordCount(finalReading.readingPassage, format);
  if (!wordCountValidation.valid) {
    console.warn('[Reading] word count issues (continuing anyway):', wordCountValidation.errors);
  }
  if (format === 'fill-in-blank') {
    const fibArticleValidation = checkFillInBlankArticleAgreement(finalReading.readingPassage, finalReading.readingQuestions);
    if (!fibArticleValidation.valid) {
      console.warn('[Reading] article agreement issues (continuing anyway):', fibArticleValidation.errors);
    }
  }
  const vocabArticleValidation = checkVocabArticleAgreement(vocabQuestions);
  if (!vocabArticleValidation.valid) {
    console.warn('[Vocab] article agreement issues (continuing anyway):', vocabArticleValidation.errors);
  }
  const cjkWarnings = [
    ...vocabQuestions.flatMap((q, i) => checkCjkSimplifiedContamination(`語彙(${i + 1})解説`, q.explanation)),
    ...finalReading.readingQuestions.flatMap((q, i) => checkCjkSimplifiedContamination(`読解(${i + 1})解説`, q.explanation)),
  ];
  if (cjkWarnings.length > 0) {
    console.warn('[Reading/Vocab] CJK simplified char issues (continuing anyway):', cjkWarnings);
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
    vocabQuestions: shuffleVocabQuestionsBalanced(q.vocabQuestions),
    readingQuestions: q.readingQuestions.map(shuffleChoices),
  };
}
