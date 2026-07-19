import { NextResponse } from 'next/server';
import { generateAnnotations, GeneratedQuestions, ChoiceAnnotations, ConfusingPair, ReadingQuestionExplanation } from '@/lib/claude';
import { loadQuestions } from '@/app/api/generate/route';

export const maxDuration = 300;

interface AnnotationData {
  choiceAnnotations: ChoiceAnnotations;
  confusingPairs: ConfusingPair[];
  readingChoiceExplanations?: ReadingQuestionExplanation[];
  // questions:{date} の generatedAt をそのまま保持する。/api/generate が同日中に再実行され
  // questions:{date} が別記事で上書きされた場合（forceRefresh、または同時アクセスによる
  // 競合生成）でも、ここが一致しなければ古いannotationsキャッシュを無効と判定できる。
  questionsGeneratedAt: string;
}

async function getKV() {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    return kv;
  }
  return null;
}

async function loadAnnotations(dateKey: string): Promise<AnnotationData | null> {
  try {
    const kv = await getKV();
    if (kv) return await kv.get<AnnotationData>(`annotations:${dateKey}`);
    const fs = await import('fs');
    const path = await import('path');
    const file = path.join(process.cwd(), '.cache', `annotations-${dateKey}.json`);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch { return null; }
}

async function saveAnnotations(dateKey: string, data: AnnotationData) {
  try {
    const kv = await getKV();
    if (kv) {
      await kv.set(`annotations:${dateKey}`, data, { ex: 60 * 60 * 24 * 30 });
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(process.cwd(), '.cache');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `annotations-${dateKey}.json`), JSON.stringify(data));
    }
  } catch (e) { console.error('Annotation save failed:', e); }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get('date');
  if (!dateKey) return NextResponse.json({ error: 'date required' }, { status: 400 });

  // 問題を先に取得する（キャッシュの新鮮さをgeneratedAtで判定するため）
  const questions = await loadQuestions(dateKey);
  if (!questions) return NextResponse.json({ error: 'questions not found' }, { status: 404 });

  // キャッシュ確認: questions.generatedAtと一致する場合のみ使う。
  // /api/generateが同日中に再実行され questions:{date} が別記事に置き換わっていた場合
  // （forceRefresh、または同時アクセスによる競合生成）、不一致を検知して再生成する。
  const cached = await loadAnnotations(dateKey);
  if (cached && cached.questionsGeneratedAt === questions.generatedAt) {
    return NextResponse.json(cached);
  }

  try {
    const result = await generateAnnotations(questions as GeneratedQuestions);
    if (!result) return NextResponse.json({ error: 'annotation generation failed' }, { status: 500 });
    const dataToSave: AnnotationData = { ...result, questionsGeneratedAt: (questions as GeneratedQuestions).generatedAt };
    await saveAnnotations(dateKey, dataToSave);
    return NextResponse.json(dataToSave);
  } catch (e) {
    console.error('[annotations] Error:', String(e));
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
