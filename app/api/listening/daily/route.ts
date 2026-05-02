import { NextResponse } from 'next/server';
import { fetchNewsArticle } from '@/lib/rss';
import { generateListening } from '@/lib/listeningGenerate';
import { GeneratedListening } from '@/lib/listeningTypes';
import { getJSTDateKey } from '@/app/api/generate/route';

async function getKV() {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    return kv;
  }
  return null;
}

async function loadListening(dateKey: string): Promise<GeneratedListening | null> {
  try {
    const kv = await getKV();
    if (kv) return await kv.get<GeneratedListening>(`listening:${dateKey}`);
    const fs = await import('fs');
    const path = await import('path');
    const f = path.join(process.cwd(), '.cache', `listening-${dateKey}.json`);
    if (!fs.existsSync(f)) return null;
    return JSON.parse(fs.readFileSync(f, 'utf-8'));
  } catch { return null; }
}

async function saveListening(dateKey: string, data: GeneratedListening) {
  try {
    const kv = await getKV();
    if (kv) {
      await kv.set(`listening:${dateKey}`, data, { ex: 60 * 60 * 24 * 30 });
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(process.cwd(), '.cache');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `listening-${dateKey}.json`), JSON.stringify(data));
    }
  } catch (e) { console.error('Listening cache save failed:', e); }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const todayKey = getJSTDateKey();

  if (!forceRefresh) {
    const cached = await loadListening(todayKey);
    if (cached) return NextResponse.json(cached);
  }

  const article = await fetchNewsArticle();
  const listening = await generateListening(article);
  await saveListening(todayKey, listening);
  return NextResponse.json(listening);
}
