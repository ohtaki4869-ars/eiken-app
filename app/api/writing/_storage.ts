import { getJSTDateKey } from '@/app/api/generate/route';
import { EssayTopic, DailyExpressionPrompt, SummaryPassage } from '@/lib/writingTypes';

export { getJSTDateKey };

export type WritingType = 'essay' | 'daily' | 'summary';

interface WritingContentMap {
  essay: EssayTopic;
  daily: DailyExpressionPrompt;
  summary: SummaryPassage;
}

const DATES_LIMIT = 30;
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90日（要約は隔週頻度のため長めに保持）

async function getKV() {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    return kv;
  }
  return null;
}

export async function loadWriting<T extends WritingType>(
  type: T,
  dateKey: string
): Promise<WritingContentMap[T] | null> {
  try {
    const kv = await getKV();
    if (kv) {
      return await kv.get<WritingContentMap[T]>(`writing:${type}:${dateKey}`);
    }
    const fs = await import('fs');
    const path = await import('path');
    const cacheFile = path.join(process.cwd(), '.cache', `writing-${type}-${dateKey}.json`);
    if (!fs.existsSync(cacheFile)) return null;
    return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  } catch {
    return null;
  }
}

export async function saveWriting<T extends WritingType>(
  type: T,
  dateKey: string,
  data: WritingContentMap[T]
): Promise<void> {
  try {
    const kv = await getKV();
    if (kv) {
      await kv.set(`writing:${type}:${dateKey}`, data, { ex: TTL_SECONDS });
      const dates: string[] = (await kv.get<string[]>(`writing:${type}:dates`)) || [];
      if (!dates.includes(dateKey)) {
        const updated = [dateKey, ...dates].slice(0, DATES_LIMIT);
        await kv.set(`writing:${type}:dates`, updated, { ex: TTL_SECONDS });
      }
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(process.cwd(), '.cache');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `writing-${type}-${dateKey}.json`), JSON.stringify(data));
    }
  } catch (e) {
    console.error(`[writing:${type}] cache save failed:`, e);
  }
}

async function getRecentDates(type: WritingType, limit: number): Promise<string[]> {
  try {
    const kv = await getKV();
    if (kv) {
      const allDates = (await kv.get<string[]>(`writing:${type}:dates`)) || [];
      return [...allDates].sort().reverse().slice(0, limit);
    }
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.join(process.cwd(), '.cache');
    if (!fs.existsSync(dir)) return [];
    const prefix = `writing-${type}-`;
    return fs
      .readdirSync(dir)
      .filter((f: string) => f.startsWith(prefix) && /\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map((f: string) => f.slice(prefix.length, -'.json'.length))
      .sort()
      .reverse()
      .slice(0, limit);
  } catch (e) {
    console.warn(`[writing:${type}] getRecentDates failed:`, e);
    return [];
  }
}

// 週次エッセイ・隔週要約: 直近N件のテーマを集めて重複回避の除外リストにする
export async function getRecentThemes(type: 'essay' | 'summary', limit = 8): Promise<string[]> {
  const dates = await getRecentDates(type, limit);
  const themes: string[] = [];
  for (const date of dates) {
    const data = await loadWriting(type, date);
    if (data?.theme) themes.push(data.theme);
  }
  return themes;
}

// 毎日の表現トレーニング: 直近N日分に出題した表現IDを集めてローテーションの除外リストにする
export async function getRecentExpressionIds(limit = 14): Promise<string[]> {
  const dates = await getRecentDates('daily', limit);
  const ids: string[] = [];
  for (const date of dates) {
    const data = await loadWriting('daily', date);
    data?.targetExpressions?.forEach((t) => ids.push(t.id));
  }
  return ids;
}
