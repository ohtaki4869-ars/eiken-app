import { NextResponse } from 'next/server';
import { generateDailyExpression } from '@/lib/writingGenerate';
import { getJSTDateKey, loadWriting, saveWriting, getRecentExpressionIds } from '@/app/api/writing/_storage';

export const maxDuration = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const todayKey = getJSTDateKey();

  if (!forceRefresh) {
    const cached = await loadWriting('daily', todayKey);
    if (cached) return NextResponse.json(cached);
  }

  try {
    const recentExpressionIds = await getRecentExpressionIds();
    const prompt = await generateDailyExpression(recentExpressionIds);
    await saveWriting('daily', todayKey, prompt);
    return NextResponse.json(prompt);
  } catch (e) {
    console.error('[writing/daily] Fatal error:', String(e));
    const cached = await loadWriting('daily', todayKey);
    if (cached) return NextResponse.json(cached);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
