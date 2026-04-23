import { NextResponse } from 'next/server';
import { fetchNewsArticle } from '@/lib/rss';
import { generateQuestions, getTodayFormat, GeneratedQuestions } from '@/lib/claude';

function getTodayKey() {
  // JST (UTC+9) で今日の日付キーを生成
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split('T')[0];
}

async function loadCache(key: string): Promise<GeneratedQuestions | null> {
  try {
    // Vercel KV が設定されている場合はKVを使用
    if (process.env.KV_REST_API_URL) {
      const { kv } = await import('@vercel/kv');
      const data = await kv.get<GeneratedQuestions & { dateKey: string }>('questions');
      if (data && data.dateKey === key) return data;
      return null;
    }
    // ローカル開発時はファイルキャッシュを使用
    const fs = await import('fs');
    const path = await import('path');
    const cacheFile = path.join(process.cwd(), '.cache', 'questions.json');
    if (!fs.existsSync(cacheFile)) return null;
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    if (data.dateKey === key) return data;
    return null;
  } catch {
    return null;
  }
}

async function saveCache(key: string, data: GeneratedQuestions) {
  const payload = { ...data, dateKey: key };
  try {
    if (process.env.KV_REST_API_URL) {
      const { kv } = await import('@vercel/kv');
      // 翌日の8時JSTまでキャッシュ（約24時間）
      await kv.set('questions', payload, { ex: 60 * 60 * 25 });
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const cacheFile = path.join(process.cwd(), '.cache', 'questions.json');
      const dir = path.dirname(cacheFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(payload));
    }
  } catch (e) {
    console.error('Cache save failed:', e);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const todayKey = getTodayKey();

  if (!forceRefresh) {
    const cached = await loadCache(todayKey);
    if (cached) return NextResponse.json(cached);
  }

  const format = getTodayFormat();
  const article = await fetchNewsArticle();
  const questions = await generateQuestions(article, format);
  await saveCache(todayKey, questions);

  return NextResponse.json(questions);
}
