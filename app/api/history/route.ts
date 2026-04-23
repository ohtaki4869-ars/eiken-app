import { NextResponse } from 'next/server';
import { loadQuestions } from '../generate/route';

export async function GET() {
  try {
    let dates: string[] = [];

    if (process.env.KV_REST_API_URL) {
      const { kv } = await import('@vercel/kv');
      dates = (await kv.get<string[]>('question_dates')) || [];
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(process.cwd(), '.cache');
      if (fs.existsSync(dir)) {
        dates = fs
          .readdirSync(dir)
          .filter((f: string) => f.endsWith('.json'))
          .map((f: string) => f.replace('.json', ''))
          .sort()
          .reverse()
          .slice(0, 30);
      }
    }

    const history = await Promise.all(
      dates.map(async (date) => {
        const data = await loadQuestions(date);
        return {
          date,
          title: data?.article?.title || '',
          source: data?.article?.source || '',
          format: data?.readingFormat || 'content',
        };
      })
    );

    return NextResponse.json(history.filter((h) => h.title));
  } catch (e) {
    console.error(e);
    return NextResponse.json([]);
  }
}
