import { NextResponse } from 'next/server';
import { generateEssayTopic } from '@/lib/writingGenerate';
import { getJSTDateKey, loadWriting, saveWriting, getRecentThemes } from '@/app/api/writing/_storage';

export const maxDuration = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const todayKey = getJSTDateKey();

  if (!forceRefresh) {
    const cached = await loadWriting('essay', todayKey);
    if (cached) return NextResponse.json(cached);
  }

  try {
    const recentThemes = await getRecentThemes('essay');
    const topic = await generateEssayTopic(recentThemes);
    await saveWriting('essay', todayKey, topic);
    return NextResponse.json(topic);
  } catch (e) {
    console.error('[writing/essay] Fatal error:', String(e));
    const cached = await loadWriting('essay', todayKey);
    if (cached) return NextResponse.json(cached);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
