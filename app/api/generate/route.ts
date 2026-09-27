import { NextResponse } from 'next/server';
import { fetchNewsArticle } from '@/lib/rss';
import { generateQuestions, getTodayFormat, GeneratedQuestions, GenerationTimings } from '@/lib/claude';

export const maxDuration = 300;

// v5.6: maxDuration到達によるVercelのプラットフォームタイムアウトは非JSON応答を返すため、
// クライアント側のres.json()がSyntaxErrorで失敗する（"問題の取得に失敗しました"の原因）。
// maxDurationより前にソフトタイムアウトさせ、必ずこのルート自身がJSONで応答できるようにする。
const SOFT_TIMEOUT_MS = 270_000;

class GenerationTimeoutError extends Error {}

// v5.16: 生成に失敗した日は、/api/generateへのアクセスのたびに再生成を試みてまた失敗し、
// そのたびにAPI課金が発生していた（2026-09-27は読解のタイムアウトで2回連続、各270秒）。
// 失敗後しばらくは再生成を試みず過去分フォールバックを即返すため、短いTTLの失敗マーカーを置く。
// FAILURE_MARKER_TTL_SEC はローカルでTTL経過後の挙動を確認するための上書き用（本番では未設定）。
const FAILURE_MARKER_TTL_SEC = Number(process.env.FAILURE_MARKER_TTL_SEC) > 0
  ? Math.floor(Number(process.env.FAILURE_MARKER_TTL_SEC))
  : 15 * 60;
// Vercelのランタイムログは保持期間が短く（1時間未満の実績あり）、翌日には失敗原因を追えないため、
// 失敗イベントをKVにも残す。日付ごとに最大20件、7日で自然に消える。
const FAILURE_LOG_TTL_SEC = 60 * 60 * 24 * 7;
const FAILURE_LOG_MAX_ENTRIES = 20;

interface FailureLogEntry {
  at: string;
  kind: 'timeout' | 'error';
  error: string;
  forceRefresh: boolean;
  // 失敗した時点でまだ終わっていなかったステップ（タイムアウト時にどちらが原因かを判別するため）
  stage: string;
  generationElapsedMs: number;
  vocabInitialMs: number | null;
  readingInitialMs: number | null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => reject(new GenerationTimeoutError(`Generation exceeded soft timeout of ${ms}ms`)), ms);
      timer.unref?.();
    }),
  ]);
}

export function getJSTDateKey(date?: Date): string {
  const now = date || new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split('T')[0];
}

async function getKV() {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    return kv;
  }
  return null;
}

// force refresh 連打で毎回同じ単語抽選にならないよう、日付ごとの再生成回数を数えて
// generateQuestions の attempt（WordBankシードのオフセット）に渡す
async function getAndIncrementRefreshAttempt(dateKey: string): Promise<number> {
  try {
    const kv = await getKV();
    if (kv) {
      const count = await kv.incr(`refresh_attempt:${dateKey}`);
      await kv.expire(`refresh_attempt:${dateKey}`, 60 * 60 * 24);
      return count;
    }
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.join(process.cwd(), '.cache');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const counterFile = path.join(dir, `refresh-attempt-${dateKey}.json`);
    const current = fs.existsSync(counterFile) ? JSON.parse(fs.readFileSync(counterFile, 'utf-8')).count : 0;
    const next = current + 1;
    fs.writeFileSync(counterFile, JSON.stringify({ count: next }));
    return next;
  } catch {
    return 0;
  }
}

// 生成済み日付一覧（新しい順、最大30件）を返す。KVでは question_dates キー、
// ローカルファイルキャッシュでは .cache配下のファイル名一覧から求める。
// getRecentlyUsedWords（出題済み語の除外集合作り）と generate失敗時の過去分フォールバックの両方で使う。
async function getRecentDateKeys(limit = 30): Promise<string[]> {
  const kv = await getKV();
  if (kv) {
    const allDates = (await kv.get<string[]>('question_dates')) || [];
    return [...allDates].sort().reverse().slice(0, limit);
  }
  const fs = await import('fs');
  const path = await import('path');
  const dir = path.join(process.cwd(), '.cache');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f: string) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f: string) => f.replace('.json', ''))
    .sort()
    .reverse()
    .slice(0, limit);
}

// v5.2 A-1: 直近30日分の出題済み語（正解語・誤答語とも）を集めてsampleWordBankへの除外集合にする。
async function getRecentlyUsedWords(): Promise<Set<string>> {
  const words = new Set<string>();
  try {
    const dates = await getRecentDateKeys(30);
    for (const date of dates) {
      const data = await loadQuestions(date);
      data?.vocabQuestions?.forEach(q => {
        Object.values(q.choices).forEach(word => words.add(word.toLowerCase().trim()));
      });
    }
  } catch (e) {
    console.warn('[getRecentlyUsedWords] failed, continuing with seed list only:', e);
  }
  return words;
}

// v5.14: 当日分の生成が失敗し、当日分のキャッシュも存在しない場合に、直近の生成済み過去分の
// うち最新のものを代わりに返す（エラー画面を出さず、学習を継続できるようにするため）。
async function findFallbackQuestions(
  excludeDateKey: string
): Promise<{ date: string; data: GeneratedQuestions } | null> {
  try {
    const dates = await getRecentDateKeys(30);
    for (const date of dates) {
      if (date === excludeDateKey) continue;
      const data = await loadQuestions(date);
      if (data) return { date, data };
    }
  } catch (e) {
    console.warn('[findFallbackQuestions] failed:', e);
  }
  return null;
}

export async function loadQuestions(dateKey: string): Promise<GeneratedQuestions | null> {
  try {
    const kv = await getKV();
    if (kv) {
      return await kv.get<GeneratedQuestions>(`questions:${dateKey}`);
    }
    const fs = await import('fs');
    const path = await import('path');
    const cacheFile = path.join(process.cwd(), '.cache', `${dateKey}.json`);
    if (!fs.existsSync(cacheFile)) return null;
    return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  } catch {
    return null;
  }
}

async function saveQuestions(dateKey: string, data: GeneratedQuestions) {
  try {
    const kv = await getKV();
    if (kv) {
      await kv.set(`questions:${dateKey}`, data, { ex: 60 * 60 * 24 * 30 });
      const dates: string[] = (await kv.get<string[]>('question_dates')) || [];
      if (!dates.includes(dateKey)) {
        const updated = [dateKey, ...dates].slice(0, 30);
        await kv.set('question_dates', updated, { ex: 60 * 60 * 24 * 30 });
      }
      // 翌日の復習用に単語カードを保存
      const nextDay = new Date(dateKey + 'T00:00:00+09:00');
      nextDay.setDate(nextDay.getDate() + 1);
      const nextKey = nextDay.toISOString().split('T')[0];
      await kv.set(`flashcards:${nextKey}`, data.vocabQuestions, { ex: 60 * 60 * 24 * 30 });
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(process.cwd(), '.cache');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${dateKey}.json`), JSON.stringify(data));
      // ローカル：翌日分フラッシュカード保存
      const nextDay = new Date(dateKey + 'T00:00:00+09:00');
      nextDay.setDate(nextDay.getDate() + 1);
      const nextKey = nextDay.toISOString().split('T')[0];
      fs.writeFileSync(path.join(dir, `flashcards-${nextKey}.json`), JSON.stringify(data.vocabQuestions));
    }
  } catch (e) {
    console.error('Cache save failed:', e);
  }
}

// v5.16: 失敗マーカーの有無。ローカルファイルキャッシュではKVのTTLが使えないため期限時刻を持たせる。
async function hasFailureMarker(dateKey: string): Promise<boolean> {
  try {
    const kv = await getKV();
    if (kv) return (await kv.get(`failed_attempt:${dateKey}`)) !== null;
    const fs = await import('fs');
    const path = await import('path');
    const markerFile = path.join(process.cwd(), '.cache', `failed-attempt-${dateKey}.json`);
    if (!fs.existsSync(markerFile)) return false;
    return JSON.parse(fs.readFileSync(markerFile, 'utf-8')).expiresAt > Date.now();
  } catch {
    // マーカーが読めない場合は抑制しない（従来通り生成を試みる）
    return false;
  }
}

async function setFailureMarker(dateKey: string) {
  try {
    const kv = await getKV();
    if (kv) {
      await kv.set(`failed_attempt:${dateKey}`, new Date().toISOString(), { ex: FAILURE_MARKER_TTL_SEC });
      return;
    }
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.join(process.cwd(), '.cache');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `failed-attempt-${dateKey}.json`),
      JSON.stringify({ expiresAt: Date.now() + FAILURE_MARKER_TTL_SEC * 1000 })
    );
  } catch (e) {
    console.warn('[setFailureMarker] failed:', e);
  }
}

async function appendFailureLog(dateKey: string, entry: FailureLogEntry) {
  try {
    const kv = await getKV();
    if (kv) {
      const entries = (await kv.get<FailureLogEntry[]>(`failure_log:${dateKey}`)) || [];
      const updated = [...entries, entry].slice(-FAILURE_LOG_MAX_ENTRIES);
      await kv.set(`failure_log:${dateKey}`, updated, { ex: FAILURE_LOG_TTL_SEC });
      return;
    }
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.join(process.cwd(), '.cache');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const logFile = path.join(dir, `failure-log-${dateKey}.json`);
    const entries: FailureLogEntry[] = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf-8')) : [];
    fs.writeFileSync(logFile, JSON.stringify([...entries, entry].slice(-FAILURE_LOG_MAX_ENTRIES)));
  } catch (e) {
    console.warn('[appendFailureLog] failed:', e);
  }
}

function fallbackResponse(fallback: { date: string; data: GeneratedQuestions }) {
  return NextResponse.json({
    ...fallback.data,
    isFallback: true,
    fallbackDate: fallback.date,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const todayKey = getJSTDateKey();

  if (!forceRefresh) {
    const cached = await loadQuestions(todayKey);
    if (cached) return NextResponse.json(cached);

    // v5.16: 直近で生成に失敗していれば、再生成（数分・API課金あり）を試みず過去分を即返す。
    // forceRefresh（cronの?refresh=true・画面の再生成ボタン）は明示的な再試行要求なのでマーカーを無視する。
    // 特にcronは1日1回の定期生成で、0時〜8時のアクセスで失敗マーカーが立っていても抑制されてはいけない。
    if (await hasFailureMarker(todayKey)) {
      const fallback = await findFallbackQuestions(todayKey);
      if (fallback) {
        console.warn(`[generate] recent failure marker for ${todayKey}; skipping generation, falling back to ${fallback.date}`);
        return fallbackResponse(fallback);
      }
      return NextResponse.json(
        { error: 'Generation failed recently and no past questions are available; retry is suppressed for now.' },
        { status: 503 }
      );
    }
  }

  // force refresh 時は古いアノテーションキャッシュを削除して不整合を防ぐ
  if (forceRefresh) {
    try {
      const kv = await getKV();
      if (kv) await kv.del(`annotations:${todayKey}`);
    } catch { /* ignore */ }
  }

  const timings: GenerationTimings = {};
  let generationStart: number | null = null;
  try {
    const format = getTodayFormat();
    const article = await fetchNewsArticle();
    const attempt = forceRefresh ? await getAndIncrementRefreshAttempt(todayKey) : 0;
    const recentlyUsedWords = await getRecentlyUsedWords();
    generationStart = Date.now();
    const questions = await withTimeout(
      generateQuestions(article, format, attempt, recentlyUsedWords, timings),
      SOFT_TIMEOUT_MS
    );
    await saveQuestions(todayKey, questions);
    return NextResponse.json(questions);
  } catch (e) {
    const isTimeout = e instanceof GenerationTimeoutError;
    const generationElapsedMs = generationStart === null ? 0 : Date.now() - generationStart;
    // v5.16: どのステップが終わっていなかったかを記録する。読解・語彙は並列実行のため、
    // 未完了側の所要時間は「失敗時点の経過時間を超えていた」としか分からない。
    const stage = generationStart === null
      ? '生成開始前（記事取得・準備）'
      : [
          timings.vocabInitialMs === undefined ? `語彙初回生成が未完了(>${generationElapsedMs}ms)` : null,
          timings.readingInitialMs === undefined ? `読解初回生成が未完了(>${generationElapsedMs}ms)` : null,
        ].filter(Boolean).join(' / ') || '初回生成後の検証・リトライ中';
    console.error('[generate] Fatal error:', String(e));
    console.error(
      `[generate] failure detail: kind=${isTimeout ? 'timeout' : 'error'} stage=${stage}` +
      ` generationElapsed=${generationElapsedMs}ms` +
      ` vocabInitial=${timings.vocabInitialMs !== undefined ? `${timings.vocabInitialMs}ms` : 'unfinished'}` +
      ` readingInitial=${timings.readingInitialMs !== undefined ? `${timings.readingInitialMs}ms` : 'unfinished'}`
    );
    await setFailureMarker(todayKey);
    await appendFailureLog(todayKey, {
      at: new Date().toISOString(),
      kind: isTimeout ? 'timeout' : 'error',
      error: String(e).slice(0, 500),
      forceRefresh,
      stage,
      generationElapsedMs,
      vocabInitialMs: timings.vocabInitialMs ?? null,
      readingInitialMs: timings.readingInitialMs ?? null,
    });

    // 生成失敗時は当日分のキャッシュがあればそれを返す
    // （forceRefreshでの再生成失敗時、上書き前の当日分が残っているケース）
    const cached = await loadQuestions(todayKey);
    if (cached) return NextResponse.json(cached);

    // 当日分が1件もない場合、直近の過去分にフォールバックしてエラー画面を回避する
    const fallback = await findFallbackQuestions(todayKey);
    if (fallback) {
      console.warn(`[generate] falling back to past questions from ${fallback.date}`);
      return fallbackResponse(fallback);
    }

    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
