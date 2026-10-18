// 読解選択肢の偏りを測る機械チェック（v5.17）。
// どれも警告ログを出すだけで、再生成・修正には使わない（1週間ほどの集計を見てからリトライ対象にするか判断する）。
// 例外は getWordNgrams で、既存のハードエラー checkCorrectChoiceCopiesPassage（lib/claude.ts）も使う。
// claude.ts（サーバー専用SDKを含む）から読み込まれ、単体でも実行できるよう実行時importを持たない。
import type { ReadingFormat, ReadingQuestion } from './claude';

// ===== 正規化 =====

// 小文字化し、句読点を除いて語に分ける。
// v5.17: 語中のアポストロフィで語が割れないようにした（旧: "football's" → "football" "s"）。
// 曲がった引用符（’）も直線の ' と同じに扱い、語中のものは削除して1語にまとめる（"football's" → "footballs"）。
// ハイフン・ダッシュ・その他の記号は空白扱い（"long-standing" → "long" "standing"。本文側も同じ規則なので一致判定には影響しない）。
export function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/(\p{L})'(?=\p{L})/gu, '$1')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function getWordNgrams(text: string, n: number): Set<string> {
  const words = tokenizeWords(text);
  const grams = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) {
    grams.add(words.slice(i, i + n).join(' '));
  }
  return grams;
}

// aとbが共有する最長の連続語数（正規化後）
export function longestCommonRun(a: string, b: string): { length: number; phrase: string } {
  const wa = tokenizeWords(a);
  const wb = tokenizeWords(b);
  let best = { length: 0, phrase: '' };
  // 単純なDP（選択肢30語×本文600語程度なので十分速い）
  let prev = new Array<number>(wb.length + 1).fill(0);
  for (let i = 1; i <= wa.length; i++) {
    const cur = new Array<number>(wb.length + 1).fill(0);
    for (let j = 1; j <= wb.length; j++) {
      if (wa[i - 1] === wb[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best.length) best = { length: cur[j], phrase: wa.slice(i - cur[j], i).join(' ') };
      }
    }
    prev = cur;
  }
  return best;
}

// 本文を文に分ける。evidenceSentences の文番号（1始まり・段落をまたいで通し番号）と同じ規則。
export function splitSentences(passage: string): string[] {
  return passage
    .split(/\n+/)
    .flatMap(p => p.trim().split(/(?<=[.!?]["”’)]?)\s+(?=["“‘(]?[A-Z])/))
    .map(s => s.trim())
    .filter(Boolean);
}

// ===== 内容語の重なり（空所補充） =====

const STOPWORDS = new Set(`a an the of to in on for and or but nor so yet is are was were be been being am
it its this that these those with as by at from into onto over under about than then there here
which who whom whose what when where why how if while though although because since until unless
not no can could may might will would shall should must do does did done has have had having
he she they them their his her its our we us you your i me my mine one ones also more most less least
such very much many some any each other another both either neither only just even still rather
own same too out up down off again further once all every few`.split(/\s+/));

// 素朴な語尾処理（両辺に同じ処理をかけるので、厳密な原形でなくてよい）
function stem(w: string): string {
  if (w.length > 5 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  for (const suf of ['ingly', 'edly', 'ing', 'ed', 'ly', 'es', 's']) {
    if (w.length - suf.length >= 4 && w.endsWith(suf)) return w.slice(0, -suf.length);
  }
  return w;
}

export function contentWords(text: string): Set<string> {
  return new Set(tokenizeWords(text).filter(w => !STOPWORDS.has(w) && w.length > 2 && !/^\d+$/.test(w)).map(stem));
}

// ===== 極端な語・「is what caused」型（内容一致の誤答） =====

// 誤答1セット（4問×3誤答）での上限は2回。プロンプト（lib/claude.ts）もこの一覧を埋め込んで使う。
export const EXTREME_WORDS = [
  'every', 'all', 'always', 'never', 'solely', 'entirely', 'fully', 'exclusively', 'completely',
  'wholly', 'altogether', 'invariably', 'definitively', 'undoubtedly', 'certainly', 'single most', 'regardless of',
  // v5.17追加。exactly / single / consistently / thoroughly は正解・本文でも普通に使われるので入れない
  'alone', 'sole', 'whatsoever',
] as const;
export const EXTREME_WORDS_PER_SET_LIMIT = 2;

const EXTREME_WORDS_PATTERN = new RegExp(`\\b(?:${EXTREME_WORDS.map(w => w.replace(' ', '\\s+')).join('|')})\\b`, 'gi');

export function findExtremeWords(text: string): string[] {
  return (text.match(EXTREME_WORDS_PATTERN) ?? []).map(m => m.toLowerCase().replace(/\s+/g, ' '));
}

// 「X is what (first/originally) caused/led/prompted/made Y」型。間に副詞が3語まで入ってよい
export const IS_WHAT_CAUSED_PATTERN =
  /\b(?:is|are|was|were)\s+what\b(?:\s+[a-z]+){0,3}?\s+(?:caused?|causes|led|leads?|prompted|prompts?|made|makes?|drove|drives?|triggered|triggers?|compelled|forced|sparked)\b/i;
export const IS_WHAT_CAUSED_PER_SET_LIMIT = 1;

// ===== 控えめな表現（内容一致の正解と誤答の配分） =====

// 正解にだけ出ると、表現のトーンで正解が分かってしまう
const HEDGE_PATTERN = /\b(?:may|might|can|could|appears?|seems?|likely|tends?\s+to|suggests?)\b/gi;

export function countHedges(text: string): number {
  return (text.match(HEDGE_PATTERN) ?? []).length;
}

// 1セットの正解4つ・誤答12個それぞれに出てくる控えめな表現の合計。正解に1回以上・誤答に0回ならwarn
export function countHedgeDistribution(questions: ReadingQuestion[]): { correct: number; wrong: number; warn: boolean } {
  let correct = 0;
  let wrong = 0;
  for (const q of questions) {
    for (const k of CHOICE_KEYS) {
      const n = countHedges(q.choices[k] ?? '');
      if (k === q.answer) correct += n;
      else wrong += n;
    }
  }
  return { correct, wrong, warn: correct >= 1 && wrong === 0 };
}

// ===== チェック本体 =====

// 空所補充の誤答の型（lib/claude.ts の FillInBlankDistractorType と同じ値）。opposite・off_topicは1セット最大1つ
export const FIB_DISTRACTOR_TYPES = ['unsupported', 'contradicts_later', 'relation_error', 'opposite', 'off_topic'] as const;
export const FIB_LIMITED_DISTRACTOR_TYPES = ['opposite', 'off_topic'] as const;
export const FIB_LIMITED_DISTRACTOR_PER_SET_LIMIT = 1;

export const CORRECT_PASSAGE_RUN_LIMIT = 4;     // 5語以上の連続一致で警告（ハードエラー側と同じ基準）
export const BLANK_NEIGHBOR_OVERLAP_LIMIT = 0.5; // 仮のしきい値

export interface ReadingCheckRecord {
  question: number | 'set';
  check: string;
  value: string | number;
  warn: boolean;
}

const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const;

function wrongChoices(q: ReadingQuestion): string[] {
  return CHOICE_KEYS.filter(k => k !== q.answer).map(k => q.choices[k]).filter(Boolean);
}

function checkContent(passage: string, questions: ReadingQuestion[]): ReadingCheckRecord[] {
  const records: ReadingCheckRecord[] = [];
  let extremeTotal = 0;
  let isWhatTotal = 0;

  questions.forEach((q, i) => {
    const num = q.number ?? i + 1;
    const correct = q.choices[q.answer as (typeof CHOICE_KEYS)[number]] ?? '';
    const run = longestCommonRun(correct, passage);
    records.push({
      question: num,
      check: 'correct_passage_max_run',
      value: run.length > CORRECT_PASSAGE_RUN_LIMIT ? `${run.length} ("${run.phrase}")` : run.length,
      warn: run.length > CORRECT_PASSAGE_RUN_LIMIT,
    });

    const extremes = wrongChoices(q).flatMap(findExtremeWords);
    extremeTotal += extremes.length;
    records.push({ question: num, check: 'wrong_extreme_words', value: extremes.length ? `${extremes.length} [${extremes.join(', ')}]` : 0, warn: false });

    const isWhat = wrongChoices(q).filter(t => IS_WHAT_CAUSED_PATTERN.test(t)).length;
    isWhatTotal += isWhat;
    records.push({ question: num, check: 'wrong_is_what_caused', value: isWhat, warn: false });
  });

  records.push({ question: 'set', check: 'wrong_extreme_words_total', value: extremeTotal, warn: extremeTotal > EXTREME_WORDS_PER_SET_LIMIT });
  records.push({ question: 'set', check: 'wrong_is_what_caused_total', value: isWhatTotal, warn: isWhatTotal > IS_WHAT_CAUSED_PER_SET_LIMIT });
  const hedges = countHedgeDistribution(questions);
  records.push({ question: 'set', check: 'hedge_distribution', value: `correct=${hedges.correct} wrong=${hedges.wrong}`, warn: hedges.warn });
  return records;
}

function checkFillInBlank(passage: string, questions: ReadingQuestion[]): ReadingCheckRecord[] {
  const records: ReadingCheckRecord[] = [];
  const sentences = splitSentences(passage);

  questions.forEach((q, i) => {
    const num = q.number ?? i + 1;
    const marker = new RegExp(`\\(\\s*${num}\\s*\\)`);
    const idx = sentences.findIndex(s => marker.test(s));
    const correct = q.choices[q.answer as (typeof CHOICE_KEYS)[number]] ?? '';

    if (idx === -1) {
      records.push({ question: num, check: 'blank_neighbor_overlap', value: 'blank_not_found', warn: true });
    } else {
      // 空所を含む文（空所自体は除く）とその直前・直後の文
      const context = [sentences[idx - 1], sentences[idx].replace(marker, ' '), sentences[idx + 1]].filter(Boolean).join(' ');
      const answerWords = contentWords(correct);
      const contextWords = contentWords(context);
      const shared = [...answerWords].filter(w => contextWords.has(w));
      const ratio = answerWords.size === 0 ? 0 : shared.length / answerWords.size;
      records.push({
        question: num,
        check: 'blank_neighbor_overlap',
        value: `${ratio.toFixed(2)} [${shared.join(', ')}]`,
        warn: ratio >= BLANK_NEIGHBOR_OVERLAP_LIMIT,
      });
    }

    records.push({ question: num, check: 'blank_type', value: q.blankType ?? 'missing', warn: !q.blankType });
    const evidence = Array.isArray(q.evidenceSentences) ? q.evidenceSentences : null;
    records.push({
      question: num,
      check: 'evidence_sentences',
      // 空所を含む文の番号も併記する（根拠が空所の隣の文だけに偏っていないかを目で確認するため）
      value: evidence ? `[${evidence.join(', ')}] blank_sentence=${idx === -1 ? '?' : idx + 1}` : 'missing',
      warn: !evidence,
    });
  });

  // 誤答の型（distractorTypes）。誤答3つ全部に有効な型が付いているかと、型ごとのセット合計
  const typeTotals = new Map<string, number>();
  questions.forEach((q, i) => {
    const num = q.number ?? i + 1;
    const wrongKeys = CHOICE_KEYS.filter(k => k !== q.answer);
    const labels = wrongKeys.map(k => {
      const t = q.distractorTypes?.[k];
      return (FIB_DISTRACTOR_TYPES as readonly string[]).includes(t ?? '') ? t! : null;
    });
    labels.forEach(t => { if (t) typeTotals.set(t, (typeTotals.get(t) ?? 0) + 1); });
    records.push({
      question: num,
      check: 'distractor_types',
      value: wrongKeys.map((k, j) => `${k}:${labels[j] ?? 'missing'}`).join(' '),
      warn: labels.some(t => t === null),
    });
  });
  for (const t of FIB_LIMITED_DISTRACTOR_TYPES) {
    const n = typeTotals.get(t) ?? 0;
    records.push({ question: 'set', check: `distractor_${t}_total`, value: n, warn: n > FIB_LIMITED_DISTRACTOR_PER_SET_LIMIT });
  }

  const discourseCount = questions.filter(q => q.blankType === 'discourse').length;
  records.push({ question: 'set', check: 'discourse_blank_count', value: discourseCount, warn: discourseCount === 0 });
  const multiEvidenceCount = questions.filter(q => Array.isArray(q.evidenceSentences) && q.evidenceSentences.length >= 2).length;
  records.push({ question: 'set', check: 'multi_sentence_evidence_count', value: multiEvidenceCount, warn: multiEvidenceCount === 0 });
  return records;
}

export function runReadingChoiceChecks(passage: string, questions: ReadingQuestion[], format: ReadingFormat): ReadingCheckRecord[] {
  return format === 'content' ? checkContent(passage, questions) : checkFillInBlank(passage, questions);
}

// 1チェック1行。Vercelのログ検索で "[ReadingCheck]" と "warn=true" で絞り込める形式にする
export function formatReadingCheckRecord(dateKey: string, format: ReadingFormat, r: ReadingCheckRecord): string {
  return `[ReadingCheck] date=${dateKey} type=${format} q=${r.question} check=${r.check} value=${r.value} warn=${r.warn}`;
}
