import { NextResponse } from 'next/server';
import { fetchNewsArticle } from '@/lib/rss';
import { generateQuestions, getTodayFormat, GeneratedQuestions } from '@/lib/claude';

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
      // 30日間保持
      await kv.set(`questions:${dateKey}`, data, { ex: 60 * 60 * 24 * 30 });
      // 日付リストを更新（最新30件）
      const dates: string[] = (await kv.get<string[]>('question_dates')) || [];
      if (!dates.includes(dateKey)) {
        const updated = [dateKey, ...dates].slice(0, 30);
        await kv.set('question_dates', updated, { ex: 60 * 60 * 24 * 30 });
      }
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(process.cwd(), '.cache');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${dateKey}.json`), JSON.stringify(data));
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

  const format = getTodayFormat();
  const article = await fetchNewsArticle();
  const questions = await generateQuestions(article, format);
  await saveQuestions(todayKey, questions);

  return NextResponse.json(questions);
}
