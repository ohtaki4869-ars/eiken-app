import Anthropic from '@anthropic-ai/sdk';
// rss.tsがgenerateArticleWithAI（本ファイル）を呼ぶため、型のみのimportにして
// 実行時の循環依存を避ける（Articleはinterfaceでランタイム値を持たないため、
// type importにすればコンパイル時に消去されrss.ts→claude.tsの一方向のみが実行時に残る）
import type { Article } from './rss';
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

// コスト内訳の可視化用。cache_creation/cache_readはプロンプトキャッシング対象の
// system最初のブロック（生成ルール・few-shot見本）分で、通常のinput_tokensとは別課金レートのため分けてログする。
function logUsage(label: string, model: string, response: Anthropic.Messages.Message): void {
  const u = response.usage;
  console.log(
    `[${label}] model:`, model,
    'stop_reason:', response.stop_reason,
    'input_tokens:', u?.input_tokens,
    'output_tokens:', u?.output_tokens,
    'cache_creation_input_tokens:', u?.cache_creation_input_tokens,
    'cache_read_input_tokens:', u?.cache_read_input_tokens
  );
}

// ===== モデル設定（環境変数で切り替え可能） =====
// GENERATION_MODELは語彙生成（generateVocabOnly）専用。2026-09-15にHaiku 4.5へ統一。
const GENERATION_MODEL = process.env.GENERATION_MODEL ?? 'claude-haiku-4-5';
// v5.14: 読解生成（generateReadingOnly・repairReadingQuestions）専用。Haiku 4.5統一後、
// 読解本文の語数（380〜470語目標）が不安定になり（実例: 273語, 327語）リトライを使い切って
// 生成失敗する事例が発生したため、読解のみSonnet 5に戻す（語彙は生成量が小さく安定していたため据え置き）。
const READING_MODEL = process.env.READING_MODEL ?? 'claude-sonnet-5';
// v5.9: 解説（特に読解choiceTranslation）の訳文が直訳調になりやすかったため、
// デフォルトをHaiku 4.5からSonnet 5に変更（品質優先。コスト増はREADME/CHANGELOG参照）。
const ANNOTATION_MODEL = process.env.ANNOTATION_MODEL ?? 'claude-sonnet-5';
// v5.6: 読解リトライを許可する経過時間の上限（route.ts のソフトタイムアウトと合わせて調整）
const READING_RETRY_TIME_BUDGET_MS = 150_000;

// ===== 記事取得 Step B: RSS全滅時のAI生成フォールバック（lib/rss.tsから呼ばれる） =====
// GENERATION_MODEL（環境変数で切替可能）ではなく Claude Sonnet 5 に固定する。
// このフォールバックはジャンル固有フィード3件が全滅した稀なケースのみ発火するため、
// コストよりも品質（事実捏造の少なさ・文体の安定）を優先する。
const ARTICLE_FALLBACK_MODEL = 'claude-sonnet-5';

function buildArticleFallbackPrompt(genre: string): string {
  // 文体サンプル: 読解生成用few-shotのreadingPassage冒頭を流用（記事本文そのものではなく
  // 客観的・報道的な文体の参考として渡す）
  const styleSample = contentFewshotExample.readingPassage.slice(0, 600);

  return `You are an expert news writer creating original English-language news articles for EIKEN Grade 1 (英検1級) reading material sourcing.

## 背景
本日のジャンル「${genre}」のRSSフィードが全て取得に失敗した（フィード停止・ネットワークエラー等）。
実在のニュースの代わりに、その日のジャンルに沿った、実際の報道記事と見分けがつかない品質の
オリジナル英語ニュース記事を1本作成する。

## 文体サンプル（実際の報道記事ベースの読解パッセージ冒頭。この客観的・報道的な文体に合わせること）
"""
${styleSample}
"""

## 生成後SELF-CHECK（v5.2のV1〜V3方式を記事生成にも適用。出力前に必ず全て確認する）
V1. 記事内の主張・数値・固有名詞（統計値・組織名・人名・地名・研究機関名・年号等）を一つずつ書き出し、
    実在の事実と矛盾しないか、検証不可能な具体的数値・固有名詞を捏造していないか確認する。
    NG例:「オックスフォード大学の2024年調査によると回答者の37%が」のような、実在確認できない
    具体的な統計・機関名の創作。
V2. 記事が実在の特定人物・組織を、事実と異なる具体的行動・発言をしたかのように描写していないか確認する。
    実在の個人・組織を虚偽の文脈で名指ししてはならない。
V3. 曖昧な一般論（"researchers have found", "experts suggest", "recent data indicates"等）に留め、
    検証不可能な固有の統計・引用・機関名を作り出さない。具体性が必要な場合は、一般的に知られた
    組織・現象の範囲に留める。

## 出力要件
- 語数目安: 550〜650語
- ジャンル: ${genre}
- 客観的な報道文体（BBC/Reuters/Guardian等の実際のニュース記事と同等）
- タイトルも生成する（英語、報道記事らしい見出し）

Return ONLY valid JSON in this exact format. Output the JSON object itself only — no preamble/lead-in text, no trailing commentary, and no markdown code fences (do not wrap the output in \`\`\` or \`\`\`json):
{
  "title": "...",
  "content": "..."
}`;
}

// lib/rss.ts の fetchNewsArticle() Step B から呼ばれる。ジャンル固有フィード(Step A)が
// 全滅した場合のみ実行される代替記事生成。失敗時はエラーをthrowし、呼び出し元でStep C
// （BBC固定フォールバック）に処理を委ねる。
export async function generateArticleWithAI(genre: string, dayIndex: number): Promise<Article> {
  const response = await client.messages.create({
    model: ARTICLE_FALLBACK_MODEL,
    max_tokens: 4000,
    system: [{ type: 'text', text: buildArticleFallbackPrompt(genre) }],
    messages: [{ role: 'user', content: `ジャンル「${genre}」（曜日インデックス${dayIndex}）の代替記事を1本生成してください。` }],
  });
  const text = extractText(response);
  logUsage('ArticleFallback', ARTICLE_FALLBACK_MODEL, response);
  try {
    const parsed = parseJson(text) as { title: string; content: string };
    return {
      title: parsed.title,
      content: parsed.content,
      source: 'AI-generated',
      link: '',
      genre,
    };
  } catch (e) {
    console.error('[ArticleFallback] JSON parse error:', e);
    console.error('[ArticleFallback] Claude response (full, length=' + text.length + '):', text);
    throw new Error('Failed to parse JSON from Claude response (article fallback)');
  }
}

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

見本(JSON。vocabQuestions/readingPassage/readingPassageJa/readingQuestionsの4フィールドのみが出力対象。titleはこの見本に含まれないが、別途メインの指示に従って必ず出力すること):
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

見本(JSON。vocabQuestions/readingPassage/readingPassageJa/readingQuestionsの4フィールドのみが出力対象。titleはこの見本に含まれないが、別途メインの指示に従って必ず出力すること):
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

// v5.5: 誤答の精密さを機械チェックするための選択肢メタデータ（内容一致形式のみ生成対象）
export type ReadingDistractorType =
  | 'SCOPE_SHIFT'               // 範囲のずれ（some→allなど）
  | 'AGENT_SWAP'                // 主体の入れ替え
  | 'CAUSAL_REVERSAL'           // 因果関係のずれ・逆転
  | 'TIMELINE_SHIFT'            // 時系列のずれ
  | 'MODALITY_SHIFT'            // 確実性のずれ（may→willなど）
  | 'HALF_TRUE_COMPOSITE'       // 半分正しい合成
  | 'PURPOSE_RESULT_CONFUSION'; // 目的と結果の混同

export interface ReadingChoiceDraft {
  text: string;
  isCorrect: boolean;
  distractorType?: ReadingDistractorType;
  sourceSpan: string;   // 根拠にした本文箇所（正解・誤答とも必須）
  falseElement?: string; // 誤答の場合、誤っている最小部分
}

export interface ReadingQuestion {
  number: number;
  question: string;
  choices: { A: string; B: string; C: string; D: string };
  answer: string;
  explanation: string;
  // v5.5: A/B/C/D生成順のメタデータ。バリデーション専用で、シャッフル前に取り除かれ最終出力には残らない
  choiceDrafts?: ReadingChoiceDraft[];
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
  title: string; // v5.7: 英検本番スタイルの英語タイトル（LLM生成。RSS記事の元タイトルとは別物）
  readingPassage: string;
  readingPassageJa: string;
  readingQuestions: ReadingQuestion[];
  generatedAt: string;
  difficultyScore?: DifficultyScore;
  choiceAnnotations?: ChoiceAnnotations;
  confusingPairs?: ConfusingPair[];
  // v5.14: 当日分の生成が失敗し、直近の過去分を代わりに返した場合のみ付与される
  isFallback?: boolean;
  fallbackDate?: string;
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
  - 名詞（単数形）なら: 単数で成立する枠を使う（"a/the ____"、"hold a ____"、"become a ____"等）。**正解語のコロケーション例が"be exposed as a charlatan"のようにbe動詞・分詞・前置詞・冠詞を含む複数語のフレーズである場合、それらの語を省略せず全て例文中に実際に書くこと。名詞1語だけを空所に裸で残してはならない**（NG: "...was eventually ____"（"exposed as a"が抜落）／OK: "...was eventually exposed as a ____"）
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
  ■ **長さの上限（暴走出力防止のため厳守）**：【正解】は1〜2文、不正解4つはそれぞれ1文のみ（2文以上に展開しない）、【紛らわしいペア】も1文以内、【例文和訳】も1文以内。explanationフィールド全体で日本語550字以内に収めること。同じ内容を言い換えて繰り返さない。

  【正解】問題文の該当箇所を引用し、正解語固有のニュアンスで説明。
  【不正解各選択肢】番号と単語を明示しラベルを示す（ラベルは次の2種のみ。新しい呼称を作らない）：
    「意味近接・焦点ズレ」：意味が近いが文脈の焦点・ニュアンス・共起がズレる語
    「文脈と不整合」：意味が逆、または文脈と無関係で、そもそも文脈に合わない語
  【紛らわしいペア】正解と最も混同しやすい選択肢がある場合は「XvsY：違いの1文説明」を追記
  【例文和訳】**explanationの最後に必ず置く（v5.9・省略禁止）**。空所に正解語を入れた状態の例文全体を、自然な日本語1文に訳す。
    - 直訳調・逐語訳にしない。英文の語順や品詞をなぞらず、日本語の文章として読みやすい訳文にする
    - 空所部分（正解語）も訳に溶け込ませる。「____」「（　）」等の記号を訳文に残さない
    - 訳の中で選択肢番号を指す半角数字1〜4を単独で使わない（数を表す必要がある場合は「二つ」「三十」のように漢数字で書く）
    - この項目より後ろには何も書かない（【例文和訳】がexplanation文字列の末尾になる）

**生成後SELF-CHECK（出力前に必ず全て確認し、満たさない場合は問題文・選択肢を修正する）:**
V1. 正解語を空所に入れた完全文を書き出し、文法的に成立するか確認する。**特に、空所の直前1〜3語がコロケーション例の動詞・前置詞・冠詞部分と一致しているか（省略していないか）を確認する**（例: コロケーション例が"be exposed as a charlatan"なのに例文が"was eventually charlatan"のように"exposed as a"を省略していないか）。成立しない場合は問題文を修正する。
V2. 空所直前の冠詞(a/an)・前置詞が、4択のうち一部だけを文法的に排除してしまわないか確認する。排除する場合は冠詞を空所内に含めるか、選択肢（＝指定語なので実際には文構造）を調整して回避する。
V3. 誤答3語それぞれについて「なぜ誤りか」と「なぜ選びたくなるか」を1文ずつ言語化できるか確認する。後者が言えない誤答は「文脈と不整合」ラベルに倒す（無理に「意味近接・焦点ズレ」を付けない）。
- [ ] 指定された正解語・誤答3語をそのまま4択として使っている（語の追加・変更・入れ替えをしていない）
- [ ] 4択すべてが指定された形（原形・単数形）のまま一字も変えず使われている（活用・語尾変化していない）
- [ ] 正解語の例文が、与えられたコロケーション例と同じ構文パターン・目的語の種類になっている（コロケーション例に含まれるbe動詞・分詞・前置詞・冠詞を省略せず、名詞を裸で空所に残していない）
- [ ] 固定コロケーションの穴埋めだけで即答できる設計になっていない（文脈の論理で解ける）
- [ ] 正解語が問題文中に出現していない（活用形・派生語も含む）
- [ ] 問題文に ____ が1箇所だけある
- [ ] 誤答3択のうち最低2択が「意味近接・焦点ズレ」である
- [ ] 「文脈と不整合」の誤答は1語以内である
- [ ] explanationが550字以内で、各項目（正解・不正解4つ・紛らわしいペア・例文和訳）が指定の文数を超えていない
- [ ] explanationの末尾が【例文和訳】であり、正解語を入れた例文全体が自然な日本語1文に訳されている

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
      "explanation": "【正解】文中の'regulations were intended to be a ____ to those who might otherwise violate'より、法律違反を未然に防ぐ「抑止力」を意味するdeterrentが最適。単なる制限でなく違反意図そのものを抑える語が必要。【2: reprimand】意味近接・焦点ズレ─事後的な「叱責・懲戒」であり、違反を未然に抑止するdeterrentとは機能が異なる。deterrent vs reprimand：deterrentは「未然防止」、reprimandは「事後対処」。【3: constraint】意味近接・焦点ズレ─「制約」そのものを指し、違反への抑止という心理的作用を持たない。【4: inducement】文脈と不整合─違反を促す「誘因」であり、意味が逆。【例文和訳】その厳格な規制は、放置すれば環境法を犯しかねない者たちに対する抑止力となるよう意図されたものだった。"
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
  logUsage('Vocab', GENERATION_MODEL, response);
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

// v5.11: 読解の解説（explanation）は、内容一致形式で4択すべてに技法ラベル付きの理由説明を
// 書かせていたため500〜840字に膨らみ、プロンプト上の450字上限を大幅に超過していた
// （checkExplanationLengthをハードエラー化したv5.10でも、モデルが指示に従い切れず解消しなかった）。
// 「なぜ不正解か」の説明を丸ごと削除し、正解の根拠1文＋4択全ての日本語訳のみに絞ることで、
// 分量そのものを問題構造として小さくする（内容一致・空所補充の両形式で共有）。
const READING_EXPLANATION_FORMAT_BLOCK = `
   **Explanation format for each question（v5.11・簡素化）:**
   【解説文体ルール（必須）】
   ■ 断定形で書く（「〜とも読める」「ただし〜」等の留保表現は禁止）
   ■ 選択肢は数字(1〜4)で言及すること（A/B/C/Dは使わない。UI上の選択肢表示が1〜4の数字のため）
   ■ **不正解の選択肢について「なぜ誤りか」の理由説明は書かない**（v5.11で廃止。日本語訳のみでよい）
   ■ **長さの上限（厳守）**：explanationフィールド全体で日本語300字以内に収めること（目安150〜250字）。同じ内容を言い換えて繰り返さない。

   【正解】（1文のみ）本文の該当箇所を直接引用せず、その趣旨を要約する形で、なぜこの選択肢が正解かを示す。
     NG（直接引用）：「本文に'individuals who had access to more choices tend to report lower levels of satisfaction'とあり、これに対応する」
     OK（趣旨の要約）：「選択肢が多いほど満足度が下がるという本文の指摘に対応する」
   【選択肢の日本語訳】4択すべてに日本語訳を付ける（正解・不正解を問わず省略しない）。直訳調にせず自然な日本語にする（語彙問題の【例文和訳】と同じ品質基準：受動形の直訳禁止、無生物主語の直訳回避）。番号順（1→2→3→4）に「【N: 訳文】」の形式で1つずつ記述する（choicesオブジェクト自体のキーであるA/B/C/Dではなく、UI表示に合わせた1〜4の数字を使うこと）

   **出力前SELF-CHECK（訳の取り違え防止・必須）**: 【1】〜【4】それぞれについて、対応する選択肢（choicesのA=1、B=2、C=3、D=4）の英文を指差し確認し、その英文の内容を訳しているか再確認する。特に隣り合う番号（例: 1と2）の訳文を入れ替えて書いていないか、4つの訳文と4つの選択肢英文を上から順に照合してから出力すること。
`;

// ===== 読解生成（記事に基づく。語彙とは完全に独立した呼び出し） =====
function buildReadingOnlyStaticInstructions(format: ReadingFormat): string {

  // ===== 穴埋め形式 (Part 2 style) =====
  const fillInBlankInstructions = `
1. **Title** (英語タイトル - 本番EIKEN Grade 1の長文冒頭に付くタイトルを再現する):
   - Write a short English title placed above the passage, in the real EIKEN Grade 1 style: a noun phrase or short phrase, NOT a full sentence (e.g., "The Rise of Synthetic Realism").
   - Aim for 6 words or fewer.
   - The title must indicate the passage's topic/theme, but must NOT reveal the answer to any blank or otherwise give away a specific conclusion the passage builds toward.

2. **Reading Passage with 3 blanks** (長文穴埋め - EIKEN Grade 1 Part 2 style):
   - Write a 3-paragraph passage of 400-450 words total (this matches the real EIKEN Grade 1 Part 2 length). Aim for roughly 130-150 words per paragraph. 450 words is a HARD CEILING that must never be exceeded — count your words before finalizing and trim supporting detail rather than go over.
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
${READING_EXPLANATION_FORMAT_BLOCK}
   **SELF-CHECK（穴埋め・7項目）:**
   - [ ] 各段落に空欄が1つずつある（計3つ）
   - [ ] 選択肢の語数が±2語以内
   - [ ] 正解以外の選択肢も文法的に前後と接続可能
   - [ ] 誤答に「明らかな外れ」がない（本文と無関係な内容は禁止）
   - [ ] パッセージが自分自身の筆者を三人称で参照していない（"the author contends"等の自己言及禁止）
   - [ ] 本文全体が400〜450語に収まっている（450語を超えていない）
   - [ ] explanationが【正解】1文＋4択の日本語訳（【1〜4: 訳文】）のみで構成され、不正解の理由説明が書かれておらず、全体で300字以内（目安150〜250字）に収まっている
${FILL_IN_BLANK_FEWSHOT_BLOCK}`;

  // ===== 内容一致形式 (Part 3 style) =====
  const contentInstructions = `
1. **Title** (英語タイトル - 本番EIKEN Grade 1の長文冒頭に付くタイトルを再現する):
   - Write a short English title placed above the passage, in the real EIKEN Grade 1 style: a noun phrase or short phrase, NOT a full sentence (e.g., "The Rise of Synthetic Realism").
   - Aim for 6 words or fewer.
   - The title must indicate the passage's topic/theme, but must NOT reveal the answer to any comprehension question or otherwise give away a specific conclusion the passage builds toward.

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
   - 正解選択肢は本文と同じ語句の連続使用を避け、主語・述語の構造を変え、可能であれば具体例を上位概念へまとめて言い換えること。ただし抽象化しすぎて本文から論理的に導けない表現にはしないこと。

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

   **Additional precision rules for wrong choices（v5.5）:**
   - 誤答は本文と無関係な内容を新しく作ってはならない。
   - 各誤答は本文中の情報を少なくとも1つ正しく含み、誤りは原則として1か所だけに限定する。
   - 誤答を長くして不正解部分を隠すのではなく、主体・範囲・因果・時制・確実性・目的と結果などの精密な違いによって不正解にする。
   - always, never, every, entirely, completely, solely, regardless of など見ただけで除外しやすい絶対表現は、本文自体に同じ強さの主張がある場合を除き使用しない。
   - 3つの誤答は可能な限り異なるdistractorTypeにする（同一パターンの繰り返しを避ける）。

   **choiceDrafts（各設問に必須。choicesとは別に、choiceDraftsという配列をA/B/C/Dの順で4要素出力する）:**
   各選択肢について、根拠にした本文箇所をsourceSpanに入れる。誤答では誤っている最小部分をfalseElementに入れる。誤答には以下7種から最も近いdistractorTypeを1つ選んで付与する（正解にはdistractorTypeを付けない）：
   - "SCOPE_SHIFT": 範囲のずれ（some→allなど）
   - "AGENT_SWAP": 主体の入れ替え
   - "CAUSAL_REVERSAL": 因果関係のずれ・逆転
   - "TIMELINE_SHIFT": 時系列のずれ
   - "MODALITY_SHIFT": 確実性のずれ（may→willなど）
   - "HALF_TRUE_COMPOSITE": 半分正しい合成
   - "PURPOSE_RESULT_CONFUSION": 目的と結果の混同
   形式: { "text": "選択肢の英文", "isCorrect": true/false, "distractorType": "誤答のみ", "sourceSpan": "本文引用", "falseElement": "誤答のみ・誤りの最小部分" }

${READING_EXPLANATION_FORMAT_BLOCK}
   **SELF-CHECK（内容一致・14項目）:**
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
   - [ ] explanationが【正解】1文＋4択の日本語訳（【1〜4: 訳文】）のみで構成され、不正解の理由説明が書かれておらず、全体で300字以内（目安150〜250字）に収まっている
   - [ ] choiceDraftsをA/B/C/Dの順で4要素出力し、全選択肢にsourceSpan、誤答にはfalseElementとdistractorTypeを設定している
   - [ ] 同一設問内で誤答3つのdistractorTypeが（可能な限り）すべて異なっている
${CONTENT_FEWSHOT_BLOCK}`;

  const readingInstructions = format === 'fill-in-blank'
    ? fillInBlankInstructions
    : contentInstructions;

  // ===== JSON examples =====
  const fillInBlankJsonExample = `  "title": "The Dual Purpose of Bioluminescence",
  "readingPassage": "For decades, scientists have been studying the mysterious phenomenon of deep-sea bioluminescence, the ability of marine organisms to produce light. Researchers initially believed this trait evolved primarily as a defense mechanism, but new findings suggest it may ( 1 ) as well. Studies of various species have revealed unexpected complexity in how and when they produce light.\\n\\nThe scientific community has made significant advances in understanding bioluminescence, yet many questions remain. One major challenge has been ( 2 ), as the deep ocean environment makes direct observation extremely difficult. Recent technological innovations, however, have enabled researchers to collect data that was previously impossible to obtain.\\n\\nThese discoveries have implications beyond pure science. Bioluminescent compounds are increasingly being used in medical research and diagnostics. The natural light-producing mechanisms found in marine life have proven ( 3 ), inspiring engineers and biochemists to develop new tools for detecting diseases at an early stage.",
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
      "explanation": "【正解】発光が防御だけでなくコミュニケーションの役割も担うという文脈に一致する。【1: コミュニケーションの役割を果たす】【2: より大型の捕食者のみを引き寄せる】【3: 特定の一種にのみ見られる】【4: 明るい環境下では消える】"
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
      "explanation": "【正解】直後の「深海での直接観察が困難」という記述に対応する。【1: 十分な研究資金を獲得すること】【2: 実験室で海洋環境を再現すること】【3: 政府を説得して行動させること】【4: 研究結果を一般向けに翻訳すること】"
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
      "explanation": "【正解】新ツール開発のヒントになっているという文脈に対応する。【1: 実用には不安定すぎる】【2: 研究者にとって非常に価値がある】【3: 人工的に再現するのが難しい】【4: 医療応用の範囲が限られている】"
    }
  ]`;

  const contentJsonExample = `  "title": "The Paradox of Excessive Choice",
  "readingPassage": "The passage text here (3-4 paragraphs, 550-650 words)...",
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
      "choiceDrafts": [
        { "text": "Individuals who selected from a larger pool of options reported lower levels of satisfaction with their final decision than those who chose from a more restricted set of alternatives.", "isCorrect": true, "sourceSpan": "individuals who had access to more choices tend to report lower levels of satisfaction" },
        { "text": "Researchers found that people with access to more choices made objectively better decisions, even though they spent considerably more time deliberating before reaching a conclusion.", "isCorrect": false, "distractorType": "HALF_TRUE_COMPOSITE", "sourceSpan": "individuals who had access to more choices tend to report lower levels of satisfaction", "falseElement": "made objectively better decisions" },
        { "text": "The studies demonstrated that decision paralysis occurred only among individuals who lacked prior experience with the type of choice they were confronted with in the experiment.", "isCorrect": false, "distractorType": "CAUSAL_REVERSAL", "sourceSpan": "decision paralysis became more common as the number of options increased", "falseElement": "occurred only among individuals who lacked prior experience" },
        { "text": "Participants who were given extensive options ultimately learned to filter out irrelevant alternatives, leading to outcomes that were comparable to those made under limited-choice conditions.", "isCorrect": false, "distractorType": "MODALITY_SHIFT", "sourceSpan": "some participants may eventually adapt by filtering out irrelevant alternatives", "falseElement": "leading to outcomes that were comparable" }
      ],
      "answer": "A",
      "explanation": "【正解】選択肢が多いほど決定への満足度が下がるという本文の指摘に対応する。【1: 選択肢が多い群から選んだ人は、選択肢が少ない群より最終決定への満足度が低かった】【2: 選択肢が多い人ほど客観的に良い決定をしたが、熟考にかなり時間がかかった】【3: 決定麻痺は、その種の選択の経験がない人にのみ生じた】【4: 多くの選択肢を与えられた参加者は無関係な選択肢を除外する術を身につけ、選択肢が少ない場合と同程度の結果に至った】"
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
): Promise<{ title: string; readingPassage: string; readingPassageJa: string; readingQuestions: ReadingQuestion[] }> {
  let dynamicContext = buildReadingOnlyDynamicContext(article);
  if (errors && errors.length > 0) {
    dynamicContext += `\n\n## ⚠️ 前回の生成で以下のエラーが検出されました。必ず修正してください：\n${errors.map(e => `- ${e}`).join('\n')}`;
  }

  const stream = client.messages.stream({
    model: READING_MODEL,
    max_tokens: 32000,
    system: [
      { type: 'text', text: buildReadingOnlyStaticInstructions(format), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: dynamicContext }],
  });
  const response = await stream.finalMessage();
  const text = extractText(response);
  logUsage('Reading', READING_MODEL, response);
  if (response.stop_reason === 'max_tokens') {
    console.error(`[Reading] レスポンスがmax_tokens(${response.usage?.output_tokens})で打ち切られた（JSON未完成の可能性が高い）`);
  }
  try {
    return parseJson(text) as {
      title: string;
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
  logUsage('VocabAnnotations', ANNOTATION_MODEL, response);
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
- choiceTranslation: 自然な日本語訳（フレーズなので文脈上の意味を補って訳す）。**正解・不正解を問わず4択すべてに必ず出力する（v5.9・省略禁止。空文字・「同上」等での省略も不可）**
  **訳文の品質基準（v5.9・厳守）**：英語の語順・品詞をそのままなぞった直訳にせず、日本語として自然に読めるフレーズにする（例：NG「認識された危険性にもかかわらず」→ OK「危険が認識されているにもかかわらず」）
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
- choiceTranslation: 自然な日本語訳（直訳禁止。主語・接続詞を補い、長ければ2文に分ける）。**正解・不正解を問わず4択すべてに必ず出力する（v5.9・省略禁止。空文字・「同上」等での省略も不可）**
  **訳文の品質基準（v5.9・厳守）**：英語の語順・品詞をそのまま日本語に移した「英文和訳」ではなく、日本語として自然に読める文にする
  - 英語の過去分詞・受動表現をカタカナ的な直訳語にしない
    NG「大惨事的なシナリオ」「計測された開発」「認識された危険性にもかかわらず」
    OK「壊滅的な事態」「速度を抑えた開発」「危険が認識されているにもかかわらず」
  - 名詞を重ねた無生物主語の直訳を避け、日本語として主語を立て直す
    NG「開発速度により、規制当局は〜を確立することが可能になった」
    OK「開発が速すぎるため、規制当局は〜を確立できずにいる」（原文の意味は変えない）
  - 1文が60字を超えたら読点だけで繋がず2文に分ける
  - **出力前に4択すべてのchoiceTranslationを読み返し、「〜された〇〇」型の受動直訳（例「認識された危険性」）や、日本語として意味の通らない語の直訳が残っていないか確認し、残っていれば書き直す**
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

【reading（選択肢ごとの短い注釈）ルール】
■ A/B/C/Dの4キーすべてにtranslation（選択肢の日本語訳）を出力する。正解・不正解を問わず省略しない

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
  logUsage('ReadingAnnotations', ANNOTATION_MODEL, response);
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
// v5.9: 語彙解説の末尾に付く【例文和訳】は日本語の訳文であり、選択肢参照ではない。
// 訳文中にたまたま現れる半角数字（「3の」等）を numPattern が選択肢参照と誤認して
// 書き換えてしまわないよう、和訳セクションは remap の対象から外す。
const VOCAB_TRANSLATION_MARKER = '【例文和訳】';

function remapChoiceLetters(text: string, oldToNew: Record<ChoiceKey, ChoiceKey>): string {
  const markerIndex = text.indexOf(VOCAB_TRANSLATION_MARKER);
  if (markerIndex !== -1) {
    return remapChoiceLetters(text.slice(0, markerIndex), oldToNew) + text.slice(markerIndex);
  }

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
function verifyChoiceLabelConsistency(rawExplanation: string, choices: { A: string; B: string; C: string; D: string }): void {
  // v5.9: 和訳セクションは選択肢タグを含まないため照合対象外にする
  const markerIndex = rawExplanation.indexOf(VOCAB_TRANSLATION_MARKER);
  const explanation = markerIndex === -1 ? rawExplanation : rawExplanation.slice(0, markerIndex);
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

// v5.10: プロンプトで「番号順（1→2→3→4）に記述すること」を指示しているにもかかわらず、
// モデルが誤答を生成順（＝番号がバラバラ）のまま出力するケースがある。この乱れはシャッフルによる
// remapChoiceLetters（番号の付け替えのみ・文中の位置は動かさない）でも解消されないため、
// 【】区切りのセグメントを抽出し、【N: word】形式（誤答参照）のものだけを番号の昇順に並べ替える。
// 【正解】【紛らわしいペア】【例文和訳】等の非数字セグメントは元の位置のまま動かさない。
function reorderExplanationChoiceSegments(explanation: string): string {
  const segments = explanation.split(/(?=【)/).filter(s => s.length > 0);
  if (segments.length <= 1) return explanation;

  const numberedIndices: number[] = [];
  segments.forEach((seg, i) => {
    if (/^【([1-4]):/.test(seg)) numberedIndices.push(i);
  });
  if (numberedIndices.length <= 1) return explanation;

  const numbered = numberedIndices.map(i => segments[i]);
  numbered.sort((a, b) => {
    const na = Number(a.match(/^【([1-4]):/)![1]);
    const nb = Number(b.match(/^【([1-4]):/)![1]);
    return na - nb;
  });
  numberedIndices.forEach((idx, k) => { segments[idx] = numbered[k]; });
  return segments.join('');
}

// v5.11: 読解のexplanationは簡素化により【N: ...】タグの中身が英語の抜粋ではなく日本語訳になった
// （verifyChoiceLabelConsistencyは選択肢の英文とタグ内容の一致を見る仕組みなので、翻訳文が
// 入るようになった読解には意味を持たなくなり、常に不一致警告を出すだけのノイズになる）。
// 代わりに、4択の日本語訳タグ【1】〜【4】が過不足なく1つずつ揃っているか（訳の付け忘れがないか）
// だけを確認する（警告のみ・リトライには乗せない）。
function checkReadingExplanationChoiceCoverage(explanation: string): void {
  const nums = [...explanation.matchAll(/【([1-4]):/g)].map(m => m[1]);
  const unique = new Set(nums);
  if (nums.length !== 4 || unique.size !== 4) {
    console.warn(`[ReadingExplanation] 選択肢訳タグ【1】〜【4】が過不足なく揃っていない疑い（検出: [${nums.join(', ')}]）`);
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
  const explanation = reorderExplanationChoiceSegments(remapChoiceLetters(q.explanation, oldToNew));
  checkReadingExplanationChoiceCoverage(explanation);
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
  const explanation = reorderExplanationChoiceSegments(remapChoiceLetters(q.explanation, oldToNew));
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

// v5.10: 正解語（名詞）のコロケーション例が冠詞付き（例: "be exposed as a charlatan"）なのに、
// 例文側でbe動詞・分詞・前置詞・冠詞を省略して名詞を裸で空所に残す不具合（例: "was eventually ____"）を
// 機械的に検出する。品詞の完全な文法チェックは不可能だが、「コロケーション例が冠詞付きの名詞用法なら
// 空所直前も限定詞（a/an/the等）で終わっているはず」という一点に絞ることで、誤検知を抑えつつ
// V1（自己検証プロンプト）が見逃した空所直前の脱落を機械的に補足する。
const DETERMINERS = new Set([
  'a', 'an', 'the', 'his', 'her', 'its', 'their', 'our', 'your', 'my',
  'no', 'such', 'every', 'each', 'another', 'any', 'some',
]);

function checkVocabBlankGrammar(q: VocabQuestion, group: VocabWordGroup): string[] {
  if (group.correct.pos !== '名') return [];

  const word = group.correct.word.toLowerCase().trim();
  const phrase = group.correct.phrase.toLowerCase();
  // コロケーション例自体が「冠詞+正解語」の形を含む場合のみ、可算名詞の単数用法とみなして検査対象にする
  // （不可算名詞・固有名詞的用法のコロケーション例は対象外とし、誤検知を避ける）
  const phraseHasArticle = new RegExp(`\\b(a|an|the)\\s+${word}\\b`).test(phrase);
  if (!phraseHasArticle) return [];

  const idx = q.sentence.indexOf('____');
  if (idx === -1) return [];
  const before = q.sentence.slice(0, idx).trim();
  const words = before.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(Boolean);
  const lastWord = words[words.length - 1] ?? '';
  if (DETERMINERS.has(lastWord)) return [];

  return [`正解語「${group.correct.word}」のコロケーション例「${group.correct.phrase}」は冠詞付きの名詞用法だが、例文の空所直前（"...${before.slice(-40)}"）に冠詞・限定詞（a/an/the等）がない。コロケーション例の動詞・前置詞・冠詞部分を省略せずそのまま例文に書くこと`];
}

// v5.10: プロンプトで「解説文中で正解語を記述する際は問題文の表記と完全に一致させること（タイポ禁止）」
// を指示しているが、モデルが自由記述するプローズ部分でタイポが混入する事例を確認した
// （例: 正解語sporadicが解説文中で「spooradic」と二重母音化して出現）。厳密な文法チェックはできないため、
// 「正解語と綴りがほぼ同じ（編集距離1以内）だが完全一致ではない語」が解説文中に出現していないかだけを見る
// 軽量ヒューリスティック。誤検知を避けるため、先頭文字が異なる語・長さが2文字以上違う語は対象外にする。
function levenshteinAtMostOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return false; // 完全一致はタイポではない
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    edits++;
    if (edits > 1) return false;
    if (a.length === b.length) { i++; j++; } // 置換
    else if (a.length > b.length) { i++; } // 削除
    else { j++; } // 挿入
  }
  edits += (a.length - i) + (b.length - j);
  return edits <= 1;
}

function checkAnswerWordTypo(label: string, explanation: string, answerWord: string): string[] {
  const word = answerWord.toLowerCase();
  // v5.10: 一般的な英単語（例: report）が正解語（例: retort）とたまたま編集距離1になる誤検知を避けるため、
  // 検査対象は「英単語の直後に空白なしで日本語の助詞・かな（ひらがな/カタカナ/長音記号）が続く」箇所に限定する。
  // この解説文体（例:「deterrentが最適」「spooradicは」）は英単語そのものを日本語文中の用語として
  // 参照する場合にのみ現れ、"annual report"のような通常の英語プローズの一部としては現れないため、
  // 一般的な英単語との衝突リスクを大きく下げられる。
  const tokens = [...explanation.matchAll(/([A-Za-z]+)(?=[ぁ-んァ-ヶー])/g)].map(m => m[1]);
  const misspelled = tokens.find(t => {
    const tw = t.toLowerCase();
    return tw !== word && tw[0] === word[0] && levenshteinAtMostOne(tw, word);
  });
  return misspelled
    ? [`${label}: 正解語「${answerWord}」のタイポの疑い（解説文中に別綴り「${misspelled}」が出現）`]
    : [];
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

    // チェック⑨: 正解語（名詞）が、コロケーション例の冠詞・動詞・前置詞を省略して裸で空所に入っていないか
    checkVocabBlankGrammar(q, group).forEach(w => errors.push(`語彙(${num}): ${w}`));
  }

  // チェック⑩: explanationが550字上限に収まっているか（v5.10・ハードエラー化。従来は警告のみで
  // リトライに乗らず、実効性がなかった）
  errors.push(...checkExplanationLength(`語彙(${num})解説`, q.explanation, 550));

  // チェック⑪: 正解語のタイポが解説文中に混入していないか（v5.10）
  if (answer) {
    errors.push(...checkAnswerWordTypo(`語彙(${num})`, q.explanation, answer));
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

// ===== v5.5: 誤答の精密さチェック（内容一致形式のみ。設問単位リトライ対象） =====

// 除去法の手がかりになりやすい絶対表現（v5.5指示文の列挙に準拠。既存のABSOLUTE_WORDSより狭い集合）
const STRICT_ABSOLUTE_WORDS = /\b(always|never|every|entirely|completely|solely)\b|\bregardless of\b/i;

// 誤答3つのうち2つ以上に絶対表現が含まれていないか（正解は対象外）
function checkWrongChoiceAbsoluteWords(questions: ReadingQuestion[]): ValidationResult {
  const errors: string[] = [];
  questions.forEach((q, i) => {
    const num = i + 1;
    const wrongKeys = CHOICE_KEYS.filter(k => k !== q.answer);
    const hits = wrongKeys.filter(k => STRICT_ABSOLUTE_WORDS.test(q.choices[k])).length;
    if (hits >= 2) {
      errors.push(`読解(${num}): 誤答3つ中${hits}つに絶対表現（always/never/every/entirely/completely/solely/regardless of等）を含む（2つ以上は不可）`);
    }
  });
  return { valid: errors.length === 0, errors };
}

// 誤答のsourceSpanが欠落・空でないか（choiceDraftsを出力した設問のみ対象。未出力の設問はチェック対象外）
function checkChoiceDraftSourceSpans(questions: ReadingQuestion[]): ValidationResult {
  const errors: string[] = [];
  questions.forEach((q, i) => {
    const num = i + 1;
    if (!q.choiceDrafts || q.choiceDrafts.length !== 4) return;
    q.choiceDrafts.forEach((d, j) => {
      if (!d.isCorrect && (!d.sourceSpan || d.sourceSpan.trim() === '')) {
        errors.push(`読解(${num})選択肢${CHOICE_KEYS[j]}: 誤答のsourceSpanが欠落または空`);
      }
    });
  });
  return { valid: errors.length === 0, errors };
}

// 誤答3つのdistractorTypeがすべて同一になっていないか（choiceDraftsを出力した設問のみ対象）
function checkDistractorTypeDiversity(questions: ReadingQuestion[]): ValidationResult {
  const errors: string[] = [];
  questions.forEach((q, i) => {
    const num = i + 1;
    if (!q.choiceDrafts || q.choiceDrafts.length !== 4) return;
    const wrongTypes = q.choiceDrafts.filter(d => !d.isCorrect).map(d => d.distractorType).filter((t): t is ReadingDistractorType => !!t);
    if (wrongTypes.length === 3 && new Set(wrongTypes).size === 1) {
      errors.push(`読解(${num}): 誤答3つのdistractorTypeがすべて同一（${wrongTypes[0]}）`);
    }
  });
  return { valid: errors.length === 0, errors };
}

// 本文と正解選択肢が5語以上の連続語句を共有していないか（簡易文字列一致検査）
function getWordNgrams(text: string, n: number): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const grams = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) {
    grams.add(words.slice(i, i + n).join(' '));
  }
  return grams;
}

// choiceDraftsはバリデーション専用のため、最終出力から取り除く（シャッフル後は記号と対応しなくなる）
function stripChoiceDrafts(q: ReadingQuestion): ReadingQuestion {
  if (!q.choiceDrafts) return q;
  const clone = { ...q };
  delete clone.choiceDrafts;
  return clone;
}

function checkCorrectChoiceCopiesPassage(passage: string, questions: ReadingQuestion[]): ValidationResult {
  const errors: string[] = [];
  const passageGrams = getWordNgrams(passage, 5);
  questions.forEach((q, i) => {
    const num = i + 1;
    const answerText = q.choices[q.answer as ChoiceKey];
    if (!answerText) return;
    const choiceGrams = getWordNgrams(answerText, 5);
    const overlap = [...choiceGrams].find(g => passageGrams.has(g));
    if (overlap) {
      errors.push(`読解(${num}): 正解選択肢が本文と5語以上連続一致（"${overlap}"）`);
    }
  });
  return { valid: errors.length === 0, errors };
}

// ===== v5.7: タイトルの機械チェック（空文字でない・10語以内）。両形式共通・リトライ対象 =====
function checkTitleValid(title: string): ValidationResult {
  const trimmed = (title ?? '').trim();
  if (trimmed.length === 0) {
    return { valid: false, errors: ['タイトルが空文字'] };
  }
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount > 10) {
    return { valid: false, errors: [`タイトルが${wordCount}語（上限10語を超過）: "${trimmed}"`] };
  }
  return { valid: true, errors: [] };
}

// ===== v5.2 A-3: 本文語数チェック（内容一致=警告のみ・リトライには乗せない／空所補充=v5.8でリトライ対象化、collectHardErrors経由） =====
function checkPassageWordCount(passage: string, format: ReadingFormat): ValidationResult {
  const wordCount = passage.trim().split(/\s+/).filter(Boolean).length;
  // 空所補充は本番EIKEN Grade 1 Part 2（400〜450語）に合わせ、バッファを持たせた380〜470語を許容範囲とする（v5.8）
  const [min, max] = format === 'content' ? [550, 650] : [380, 470];
  if (wordCount < min || wordCount > max) {
    return { valid: false, errors: [`読解: 本文語数${wordCount}語（想定${min}〜${max}語の範囲外）`] };
  }
  return { valid: true, errors: [] };
}

// ===== 空所補充：段落ごとの空所配置チェック（ハードエラー・リトライ対象） =====
// プロンプト側は「各段落に空所を1つずつ」と指示しているが（buildReadingOnlyStaticInstructions内）、
// この制約を機械的に検証するコードがこれまで存在せず、モデルが指示から逸脱しても検出されずに
// 配信されてしまっていた（例: 2026/9/16分で段落2に(2)(3)の2個、段落3に0個という配置崩れが発生）。
// 段落分割は既存のUI側（app/reading/page.tsx等）と同じ規約（'\n'で分割し空行を除外）に合わせる。
function checkFillInBlankParagraphDistribution(passage: string): ValidationResult {
  const paragraphs = passage.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  const errors: string[] = [];

  if (paragraphs.length !== 3) {
    errors.push(`読解: 段落数が${paragraphs.length}個（想定3段落）`);
  }

  const countsPerParagraph = paragraphs.map(p => (p.match(/\(\s*[1-3]\s*\)/g) ?? []).length);
  const totalBlanks = countsPerParagraph.reduce((a, b) => a + b, 0);
  const breakdown = countsPerParagraph.map((c, i) => `段落${i + 1}: ${c}個`).join(', ');

  const unevenDistribution = countsPerParagraph.some(c => c !== 1);
  if (paragraphs.length === 3 && unevenDistribution) {
    errors.push(`読解: 空所の段落ごとの配置が${breakdown} — 各段落ちょうど1個である必要があります`);
  }

  if (totalBlanks !== 3) {
    errors.push(`読解: 空所(1)(2)(3)の合計出現数が${totalBlanks}個（想定3個、内訳: ${breakdown}）`);
  }

  return { valid: errors.length === 0, errors };
}

// ===== v5.2 A-3: 中国語簡体字混入チェック（警告のみ・リトライには乗せない） =====
// 日本語の解説文に混入しやすい、日本語では通常使わない簡体字（讠/钅/纟系の偏や頻出単漢字）を
// 検出するためのベストエフォートなブロックリスト。網羅的ではないが、実績のある「维」等を含め
// 週次レビューで見つかった文字を追記していく運用とする。
// v5.10: 日本の新字体は戦後の漢字簡略化で、中国大陸の簡体字と（別々の改革でありながら）
// 偶然同一の字形に収斂した文字が少なくない（学/国/会/当/万/写/医/来/双/号/与 等）。
// これらは「簡体字にしか存在しない字」ではなく通常の日本語文章に頻出するため、リストに含めると
// 誤検知が多発する（実例: 「医学」「与える」「写真」「国」「当」「来る」等での誤検知を確認）。
// v5.2導入時の網羅的リストからこれらを除外し、日本語の標準字体（新字体・旧字体とも）に
// 存在しない字形（簡体字専用の偏の置換等）のみを残した。
const SIMPLIFIED_ONLY_CHARS = new Set([
  '维', '经', '现', '实', '际', '应', '难', '义', '认', '识', '让', '还', '这', '时', '间',
  '问', '题', '该', '处', '华', '图', '书', '电', '车', '马', '门',
  '爱', '话', '语', '设', '访', '评', '诉', '词', '译', '试', '诗', '误', '说', '请',
  '读', '课', '谁', '调', '谈', '谎', '谢', '计', '议', '讨', '训', '证', '钟', '钢', '铁',
  '铅', '银', '错', '锁', '链', '纪', '约', '级', '给', '组', '红', '练', '细', '终', '绝',
  '统', '继', '续', '绍', '绿', '缓', '缺', '网', '见', '对', '发', '为', '从',
  '产', '严', '举', '丧', '业', '长', '飞', '击', '归', '欢', '权', '汉', '汇',
  '决', '兴', '农', '动', '劳', '势', '压', '厂', '历', '厉', '变', '叶',
]);

function checkCjkSimplifiedContamination(label: string, text: string): string[] {
  const found = [...new Set([...text].filter(ch => SIMPLIFIED_ONLY_CHARS.has(ch)))];
  return found.length > 0 ? [`${label}: 中国語簡体字の混入疑い「${found.join('')}」`] : [];
}

// explanation暴走（max_tokens到達によるJSON打ち切り）の再発監視用。プロンプト側の文字数上限
// 指示が実際に守られているかを検証する（v5.10: 語彙は`validateOneVocabQuestion`、読解は
// `collectHardErrors`からそれぞれハードエラーとして呼ばれ、リトライに乗る。Step 3.5では
// 全設問リトライ後の最終確認として同じ関数を再利用し、警告ログを出す）。
function checkExplanationLength(label: string, text: string, maxChars: number): string[] {
  return text.length > maxChars ? [`${label}: 解説が${text.length}字（上限${maxChars}字を超過）`] : [];
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

// v5.12: 読解のハードエラーのうち、設問番号（"読解(N): ..." "読解(N)解説: ..."）が特定できるもの。
// 単問修正（repairReadingQuestions）の対象抽出・効果測定の両方で使う共通ロジック
function collectReadingQuestionScopedErrors(passage: string, questions: ReadingQuestion[], format: ReadingFormat): string[] {
  return [
    ...(format === 'content' ? [
      ...checkWrongChoiceAbsoluteWords(questions).errors,
      ...checkChoiceDraftSourceSpans(questions).errors,
      ...checkDistractorTypeDiversity(questions).errors,
      ...checkCorrectChoiceCopiesPassage(passage, questions).errors,
    ] : []),
    ...questions.flatMap((rq, i) => checkExplanationLength(`読解(${i + 1})解説`, rq.explanation, 300)),
  ];
}

// エラーメッセージの先頭"読解(N)"から設問番号を読み取り、設問単位で直せるものと
// 本文・タイトル起因でグローバルな再生成が必要なものに分ける
function groupReadingErrorsByQuestionNumber(errors: string[]): { perQuestion: Map<number, string[]>; global: string[] } {
  const perQuestion = new Map<number, string[]>();
  const global: string[] = [];
  for (const err of errors) {
    const m = err.match(/^読解\((\d+)\)/);
    if (m) {
      const num = Number(m[1]);
      const list = perQuestion.get(num) ?? [];
      list.push(err);
      perQuestion.set(num, list);
    } else {
      global.push(err);
    }
  }
  return { perQuestion, global };
}

function buildReadingQuestionRepairPrompt(format: ReadingFormat, passage: string, question: ReadingQuestion, errors: string[]): string {
  const hasChoiceDrafts = format === 'content' && !!question.choiceDrafts;
  const questionForPrompt: Record<string, unknown> = {
    number: question.number,
    question: question.question,
    choices: question.choices,
    answer: question.answer,
    explanation: question.explanation,
  };
  if (hasChoiceDrafts) questionForPrompt.choiceDrafts = question.choiceDrafts;

  const outputFormat = hasChoiceDrafts
    ? `{
  "number": ${question.number},
  "question": "...",
  "choices": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "choiceDrafts": [
    { "text": "...", "isCorrect": true, "sourceSpan": "..." },
    { "text": "...", "isCorrect": false, "distractorType": "...", "sourceSpan": "...", "falseElement": "..." },
    { "text": "...", "isCorrect": false, "distractorType": "...", "sourceSpan": "...", "falseElement": "..." },
    { "text": "...", "isCorrect": false, "distractorType": "...", "sourceSpan": "...", "falseElement": "..." }
  ],
  "answer": "A" | "B" | "C" | "D",
  "explanation": "..."
}`
    : `{
  "number": ${question.number},
  "question": "...",
  "choices": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "answer": "A" | "B" | "C" | "D",
  "explanation": "..."
}`;

  return `英検1級（EIKEN Grade 1）レベルの読解問題のうち、設問1問だけを修正してください。他の設問には触れません。

## 本文
${passage}

## 修正対象の設問（JSON）
${JSON.stringify(questionForPrompt, null, 2)}

## 検出された問題点（すべて必ず修正すること）
${errors.map(e => `- ${e}`).join('\n')}

## 修正方針
- 指摘された問題点だけを修正し、それ以外（正解の位置・設問の意図・他の選択肢の趣旨）はできる限り維持する
- 「正解選択肢が本文と5語以上連続一致」の指摘がある場合、該当箇所を本文の語順・表現のまま使わず、意味を保ったまま言い換える（paraphrase）。語の入れ替えだけでなく構文も変える
- 解説の文字数超過の指摘がある場合、【正解】【1】【2】【3】【4】の各項目を簡潔にし、不正解の理由説明は書かず、合計300字以内（目安150〜250字）に収める
${hasChoiceDrafts ? '- choiceDraftsを含める場合、sourceSpan（本文中の根拠引用）とdistractorType（誤答種別）の整合性も保つ\n' : ''}
## 出力形式（JSONのみ。説明文・マークダウンのコードフェンス禁止）
${outputFormat}`;
}

async function generateReadingQuestionRepair(
  passage: string,
  format: ReadingFormat,
  question: ReadingQuestion,
  errors: string[]
): Promise<ReadingQuestion> {
  const response = await client.messages.create({
    model: READING_MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: buildReadingQuestionRepairPrompt(format, passage, question, errors) }],
  });
  const text = extractText(response);
  logUsage('ReadingQuestionRepair', READING_MODEL, response);
  try {
    return parseJson(text) as ReadingQuestion;
  } catch (e) {
    console.error('[ReadingQuestionRepair] JSON parse error:', e);
    console.error('[ReadingQuestionRepair] Claude response (full, length=' + text.length + '):', text);
    throw new Error('Failed to parse JSON from Claude response (reading question repair)');
  }
}

// v5.12: 設問単位のハードエラー（正解選択肢が本文と5語以上連続一致・解説の字数超過等）を、
// 該当設問だけを対象にした軽量なリクエストで修正する（本文・他の設問は再生成しない）。
// 従来は本文全体・全設問を含む32000トークンの読解生成を丸ごと再実行する1本のリトライしかなく、
// 初回生成自体が長引くケース（実測150〜260秒）ではREADING_RETRY_TIME_BUDGET_MSの予算切れで
// 1回もリトライされず生成失敗になっていた（設問1問分の軽微な問題でも全体が失敗する）。
// 出力を1問分に絞ることでレイテンシを数秒程度に抑え、予算切れによる未リトライを防ぐ。
// vocabのretryVocabQuestionと同じ考え方で最大2回まで再試行し、それでも直らなければ
// 直近の再生成結果を採用する（無修正の下書きより改善している可能性が高いため）。
async function repairReadingQuestions(
  passage: string,
  format: ReadingFormat,
  questions: ReadingQuestion[],
  errorsByNumber: Map<number, string[]>
): Promise<ReadingQuestion[]> {
  const updated = [...questions];
  await Promise.all([...errorsByNumber.entries()].map(async ([num, initialErrors]) => {
    const idx = num - 1;
    const original = questions[idx];
    if (!original) return;

    let lastErrors = initialErrors;
    let lastCandidate: ReadingQuestion | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const retryStart = Date.now();
      try {
        const repaired = await generateReadingQuestionRepair(passage, format, original, lastErrors);
        console.log(`[Timing] reading question ${num} repair attempt ${attempt}/2: ${Date.now() - retryStart}ms`);
        const candidate: ReadingQuestion = { ...repaired, number: original.number };
        const trial = questions.map((q, i) => (i === idx ? candidate : q));
        const remaining = collectReadingQuestionScopedErrors(passage, trial, format)
          .filter(e => e.startsWith(`読解(${num})`));
        lastCandidate = candidate;
        if (remaining.length === 0) {
          updated[idx] = candidate;
          return;
        }
        console.warn(`[Reading] question ${num} repair attempt ${attempt}/2 still has issues:`, remaining);
        lastErrors = remaining;
      } catch (e) {
        console.warn(`[Reading] question ${num} repair attempt ${attempt}/2 failed:`, e);
      }
    }
    if (lastCandidate) {
      console.warn(`[Reading] question ${num}: 2回のリトライ後も未解決。直近の再生成結果を採用:`, lastErrors);
      updated[idx] = lastCandidate;
    } else {
      console.warn(`[Reading] question ${num}: repair failed entirely（有効な候補なし）。元の下書きを維持`);
    }
  }));
  return updated;
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

  // ===== Step 3: 読解選択肢の語数・長さ癖・極端語・誤答精度チェック（内容一致形式のみ）＋タイトルの機械チェック（両形式） =====
  // 35語超過が1セット3件以上、誤答精度チェック（v5.5）、またはタイトルチェック（v5.7）でエラーがある場合、読解を再生成する。
  // それ未満・それ以外は警告のみ。
  // v5.12: エラーの大半は設問1問分に閉じた原因（正解選択肢の言い換え不足・解説の字数超過等）のため、
  // まず該当設問だけを直す軽量リトライ（repairReadingQuestions）を試す。本文全体（32000トークン）の
  // 再生成は、それでも残ったタイトル・本文語数などグローバルなエラーに対してのみ、時間予算内であれば行う。
  let finalReading = readingDraft;
  {
    const collectHardErrors = (q: typeof finalReading) => [
      ...checkTitleValid(q.title).errors,
      ...collectReadingQuestionScopedErrors(q.readingPassage, q.readingQuestions, format),
      // v5.8: 空所補充は本文語数（380〜470語）をハードエラー化し、リトライ対象に含める
      ...(format === 'fill-in-blank' ? checkPassageWordCount(q.readingPassage, format).errors : []),
      // 空所補充は「各段落に空所1つずつ」の配置崩れもハードエラー化し、リトライ対象に含める
      ...(format === 'fill-in-blank' ? checkFillInBlankParagraphDistribution(q.readingPassage).errors : []),
    ];

    const overLengthCount = format === 'content' ? countOverMaxWordChoices(finalReading.readingQuestions) : 0;
    let distractorErrors = collectHardErrors(finalReading);

    // v5.12: 設問番号が特定できるエラー（"読解(N): ..."）は、該当設問だけを対象にした軽量な
    // 修正リクエストで直す。本文全体の再生成より出力が小さく数秒で終わるため、初回生成が長引いた
    // ケース（後述のREADING_RETRY_TIME_BUDGET_MS判定）でも予算切れの影響を受けにくい。
    if (distractorErrors.length > 0) {
      const { perQuestion, global: globalErrorsBeforeRepair } = groupReadingErrorsByQuestionNumber(distractorErrors);
      if (perQuestion.size > 0) {
        const repairStart = Date.now();
        try {
          const repairedQuestions = await repairReadingQuestions(finalReading.readingPassage, format, finalReading.readingQuestions, perQuestion);
          finalReading = { ...finalReading, readingQuestions: repairedQuestions };
          console.log(`[Timing] reading per-question repair (${perQuestion.size}問): ${Date.now() - repairStart}ms`);
        } catch (e) {
          console.warn('[Reading] per-question repair failed, keeping original drafts for those questions:', e);
        }
        if (globalErrorsBeforeRepair.length > 0) {
          console.log('[Reading] per-question repairの対象外（本文・タイトル起因）のエラー:', globalErrorsBeforeRepair);
        }
      }
      // 単問修正の結果を反映してハードエラーを再計算する（修正できなかった分・グローバルなエラーのみが残る）
      distractorErrors = collectHardErrors(finalReading);
    }

    // v5.6: 読解の初回生成が長引くケース（実測262秒経験あり）で、本文全体を再生成する重いリトライを
    // 無条件に行うと route.ts側のmaxDuration(300秒)を超え、Vercelのプラットフォームタイムアウト
    // （非JSON応答）を招いてクライアントでJSON.parse失敗になる。残り時間が足りない場合、この
    // 重いリトライ（本文全体の再生成）は行わない。
    // ただしこれらのエラーは「壊れた問題」を意味する（例: 正解選択肢が本文と5語以上連続一致）ため、
    // 下書きのまま配信すると質の低い問題がそのままユーザーに届いてしまう。配信は諦めてエラーを
    // 投げ、route.ts側のcatchでキャッシュへのフォールバック（なければJSONエラー応答）に任せる。
    // v5.12: 設問単位のエラーは上の軽量修正で解決済みのことが多く、ここに到達するのは主に
    // タイトル・本文語数などグローバルなエラーが残った場合、または軽量修正を尽くしても
    // なお設問側のエラーが直らなかった場合。
    const elapsedSinceGenStart = Date.now() - genStart;
    if ((overLengthCount >= 3 || distractorErrors.length > 0) && elapsedSinceGenStart >= READING_RETRY_TIME_BUDGET_MS) {
      const reasons = [
        ...(overLengthCount >= 3 ? [`選択肢が35語の上限を${overLengthCount}件超過`] : []),
        ...distractorErrors,
      ];
      console.error(`[Reading] リトライ対象のエラーが残っているが、経過時間(${elapsedSinceGenStart}ms)が予算(${READING_RETRY_TIME_BUDGET_MS}ms)を超えているため本文全体の再生成は断念。壊れた問題を配信しないよう生成を失敗させる:`, reasons);
      throw new Error(`Reading generation has unresolved quality errors and exceeded the retry time budget: ${reasons.join(' / ')}`);
    } else if (overLengthCount >= 3 || distractorErrors.length > 0) {
      const retryReasons = [
        ...(overLengthCount >= 3
          ? [`前回の生成では選択肢が35語の上限を${overLengthCount}件超過した。全選択肢を20-33語に収め、35語を絶対に超えないこと。長くなる場合は従属節を削って短くする。`]
          : []),
        ...distractorErrors,
      ];
      console.warn('[Reading] リトライ対象のエラーを検出（読解本文全体を再生成）:', retryReasons);
      const retryStart = Date.now();
      try {
        const retried = await generateReadingOnly(trimmedArticle, format, retryReasons);
        console.log(`[Timing] reading retry: ${Date.now() - retryStart}ms`);
        const retryOverLengthCount = format === 'content' ? countOverMaxWordChoices(retried.readingQuestions) : 0;
        const retryDistractorErrors = collectHardErrors(retried);
        const beforeTotal = overLengthCount + distractorErrors.length;
        const afterTotal = retryOverLengthCount + retryDistractorErrors.length;
        if (afterTotal < beforeTotal) {
          finalReading = retried;
        } else {
          console.warn(`[Reading] retry did not improve (${afterTotal} vs ${beforeTotal} before), keeping current draft`);
        }
      } catch (e) {
        console.warn('[Reading] retry failed, keeping current draft:', e);
      }
    }

    // v5.12: 上の分岐（本文全体の再生成が「改善したが完全には解消しなかった」場合や、再生成自体が
    // 失敗した場合）を通っても、finalReadingにハードエラーが残ったまま警告ログのみでこのブロックを
    // 抜けてしまう抜け穴があった（v5.5から存在。afterTotal<beforeTotalなら改善量に関わらず即採用、
    // afterTotal>=beforeTotalでもthrowせず現状維持していたため）。ここで最終確認し、
    // 全てのリトライ手段を尽くしてもなおハードエラーが残っていれば必ず生成を失敗させる
    // （壊れた問題を「たまたま改善したから」という理由で配信しないため）。
    const finalOverLengthCount = format === 'content' ? countOverMaxWordChoices(finalReading.readingQuestions) : 0;
    const finalHardErrors = collectHardErrors(finalReading);
    if (finalOverLengthCount >= 3 || finalHardErrors.length > 0) {
      const finalReasons = [
        ...(finalOverLengthCount >= 3 ? [`選択肢が35語の上限を${finalOverLengthCount}件超過`] : []),
        ...finalHardErrors,
      ];
      console.error('[Reading] 設問単位の軽量修正・本文全体の再生成を尽くしてもなおハードエラーが残っているため、壊れた問題を配信しないよう生成を失敗させる:', finalReasons);
      throw new Error(`Reading generation has unresolved quality errors after all retry attempts: ${finalReasons.join(' / ')}`);
    }

    if (format === 'content') {
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

      // choiceDraftsはバリデーション専用。シャッフル後は記号と対応しなくなるため最終出力には含めない
      finalReading = {
        ...finalReading,
        readingQuestions: finalReading.readingQuestions.map(stripChoiceDrafts),
      };
    }
  }

  // ===== Step 3.5: 追加の警告ログ（内容一致は警告のみでリトライ対象外。空所補充は上のcollectHardErrorsで
  // 既にリトライ済みのため、ここではリトライ後もなお範囲外だった場合の最終確認ログとなる） =====
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
  const explanationLengthWarnings = [
    ...vocabQuestions.flatMap((q, i) => checkExplanationLength(`語彙(${i + 1})解説`, q.explanation, 550)),
    ...finalReading.readingQuestions.flatMap((q, i) => checkExplanationLength(`読解(${i + 1})解説`, q.explanation, 300)),
  ];
  if (explanationLengthWarnings.length > 0) {
    console.warn('[Reading/Vocab] explanation length issues (continuing anyway):', explanationLengthWarnings);
  }

  // ===== Step 4: 選択肢シャッフル =====
  return applyChoiceShuffle({
    article,
    readingFormat: format,
    vocabQuestions,
    title: finalReading.title,
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
