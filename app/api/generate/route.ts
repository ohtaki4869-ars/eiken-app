import { NextResponse } from 'next/server';
import { fetchNewsArticle } from '@/lib/rss';
import { generateQuestions, getTodayFormat, GeneratedQuestions } from '@/lib/claude';

export const maxDuration = 300;

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

// v5.2 A-1: 直近30日分の出題済み語（正解語・誤答語とも）を集めてsampleWordBankへの除外集合にする。
// history側の日付一覧収集ロジック（KV question_dates / .cache配下のファイル一覧）と同じ考え方。
async function getRecentlyUsedWords(): Promise<Set<string>> {
  const words = new Set<string>();
  try {
    let dates: string[] = [];
    const kv = await getKV();
    if (kv) {
      const allDates = (await kv.get<string[]>('question_dates')) || [];
      dates = [...allDates].sort().reverse().slice(0, 30);
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(process.cwd(), '.cache');
      if (fs.existsSync(dir)) {
        dates = fs
          .readdirSync(dir)
          .filter((f: string) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
          .map((f: string) => f.replace('.json', ''))
          .sort()
          .reverse()
          .slice(0, 30);
      }
    }

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const todayKey = getJSTDateKey();

  if (!forceRefresh) {
    const cached = await loadQuestions(todayKey);
    if (cached) return NextResponse.json(cached);
  }

  // force refresh 時は古いアノテーションキャッシュを削除して不整合を防ぐ
  if (forceRefresh) {
    try {
      const kv = await getKV();
      if (kv) await kv.del(`annotations:${todayKey}`);
    } catch { /* ignore */ }
  }

  try {
    const format = getTodayFormat();
    const article = await fetchNewsArticle();
    const attempt = forceRefresh ? await getAndIncrementRefreshAttempt(todayKey) : 0;
    const recentlyUsedWords = await getRecentlyUsedWords();
    const questions = await generateQuestions(article, format, attempt, recentlyUsedWords);
    await saveQuestions(todayKey, questions);
    return NextResponse.json(questions);
  } catch (e) {
    console.error('[generate] Fatal error:', String(e));
    // 生成失敗時はキャッシュがあればそれを返す
    const cached = await loadQuestions(todayKey);
    if (cached) return NextResponse.json(cached);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
