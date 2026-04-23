import { NextResponse } from 'next/server';
import { loadQuestions } from '../../generate/route';

export async function GET(_req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const data = await loadQuestions(date);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}
