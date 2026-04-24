import { NextResponse } from 'next/server';
import { getJSTDateKey } from '../generate/route';
import { VocabQuestion } from '@/lib/claude';

export async function GET() {
  const todayKey = getJSTDateKey();

  try {
    if (process.env.KV_REST_API_URL) {
      const { kv } = await import('@vercel/kv');
      const cards = await kv.get<VocabQuestion[]>(`flashcards:${todayKey}`);
      return NextResponse.json(cards || []);
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const file = path.join(process.cwd(), '.cache', `flashcards-${todayKey}.json`);
      if (!fs.existsSync(file)) return NextResponse.json([]);
      return NextResponse.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
    }
  } catch {
    return NextResponse.json([]);
  }
}
