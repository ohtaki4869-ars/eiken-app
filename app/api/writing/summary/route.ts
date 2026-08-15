import { NextResponse } from 'next/server';
import { generateSummarySource } from '@/lib/writingGenerate';
import { getJSTDateKey, loadWriting, saveWriting, getRecentThemes } from '@/app/api/writing/_storage';

export const maxDuration = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const todayKey = getJSTDateKey();

  if (!forceRefresh) {
    const cached = await loadWriting('summary', todayKey);
    if (cached) return NextResponse.json(cached);
  }

  try {
    const recentThemes = await getRecentThemes('summary');
    const summary = await generateSummarySource(recentThemes);
    await saveWriting('summary', todayKey, summary);
    return NextResponse.json(summary);
  } catch (e) {
    console.error('[writing/summary] Fatal error:', String(e));
    const cached = await loadWriting('summary', todayKey);
    if (cached) return NextResponse.json(cached);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
