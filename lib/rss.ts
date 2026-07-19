import Parser from 'rss-parser';
import { generateArticleWithAI } from './claude';

// v5.3: Step Aで1ジャンルにつき最大3件のフィードを順に試すため、1件が応答なしで
// 無期限にハングすると後続フィード・Step B/Cまで遅延する。タイムアウトを明示しておく。
const parser = new Parser({ timeout: 10000 });

// 曜日ごとのジャンルと対応フィード（月〜日）。各ジャンル3件体制（Step Aで順に試す）。
export const GENRE_FEEDS = [
  {
    genre: '国際・政治',
    feeds: [
      { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews' },
      { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    ],
  },
  {
    genre: 'サイエンス・テクノロジー',
    feeds: [
      { name: 'BBC Science', url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
      { name: 'Scientific American', url: 'http://rss.sciam.com/ScientificAmerican-Global' },
      { name: 'Scientific American', url: 'https://rss.sciam.com/ScientificAmerican-Global' },
    ],
  },
  {
    genre: 'ビジネス・経済',
    feeds: [
      { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml' },
      { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
      { name: 'Guardian Business', url: 'https://www.theguardian.com/business/rss' },
    ],
  },
  {
    genre: '環境・気候',
    feeds: [
      { name: 'BBC Environment', url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
      { name: 'Guardian Environment', url: 'https://www.theguardian.com/environment/rss' },
      // v5.3: 当初指示のGuardian Environmentは既存2件目と完全同一URLで重複だったため、
      // ユーザー判断によりYale Environment 360に差し替え（Reuters系は無料RSS廃止で
      // 実質死んでいる可能性が高いため除外）
      { name: 'Yale Environment 360', url: 'https://e360.yale.edu/feed.xml' },
    ],
  },
  {
    genre: '健康・医療',
    feeds: [
      { name: 'BBC Health', url: 'http://feeds.bbci.co.uk/news/health/rss.xml' },
      { name: 'Reuters Health', url: 'https://feeds.reuters.com/reuters/healthNews' },
      { name: 'NPR Health', url: 'https://feeds.npr.org/1128/rss.xml' },
    ],
  },
  {
    genre: '文化・社会',
    feeds: [
      { name: 'TIME', url: 'https://time.com/feed/' },
      { name: 'BBC Culture', url: 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
      { name: 'Guardian Culture', url: 'https://www.theguardian.com/culture/rss' },
    ],
  },
  {
    genre: '教育・テクノロジー',
    feeds: [
      { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml' },
      { name: 'TIME', url: 'https://time.com/feed/' },
      { name: 'Guardian Technology', url: 'https://www.theguardian.com/technology/rss' },
    ],
  },
];

export interface Article {
  title: string;
  content: string;
  source: string;
  link: string;
  genre: string;
}

export function getTodayGenre(): { genre: string; index: number } {
  // JSTの曜日（0=月, 1=火, ... 6=日）
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = jst.getDay(); // 0=日, 1=月, ...6=土
  const index = day === 0 ? 6 : day - 1; // 月曜スタートに変換
  return { genre: GENRE_FEEDS[index].genre, index };
}

// 記事からコンテンツを抽出（複数フィールドのフォールバック）
function extractContent(item: Record<string, unknown>): string {
  const candidates = [
    item.contentSnippet,
    item.content,
    item.description,
    item.summary,
    item['content:encoded'],
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 50) {
      // HTMLタグを除去
      return c.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}

// v5.3: 記事取得元がStep A(ジャンル固有)/B(AI生成)/C(BBC固定)のどれだったかを記録する。
// 週次レビュー(docs/weekly-review-checklist.md)でStep B/Cの発生頻度を追うためのログ。
type ArticleSourceStep = 'A' | 'B' | 'C';

function logArticleSource(step: ArticleSourceStep, genre: string, source: string): void {
  const stepLabel = { A: 'ジャンル固有フィード', B: 'AI生成', C: 'BBC固定フォールバック' }[step];
  console.log(`[ArticleSource] step=${step}(${stepLabel}) genre="${genre}" source="${source}"`);
}

// 指定されたフィードリストを順に試し、最初に成功したものを返す（全滅時はnull）。
// Step A・Step C（いずれも「複数フィードを順に試す」という同じ形）で共有する。
async function tryFeeds(
  feeds: { name: string; url: string }[],
  genre: string
): Promise<Article | null> {
  for (const feed of feeds) {
    try {
      const result = await parser.parseURL(feed.url);
      // コンテンツがあるアイテムを探す（閾値を50文字に下げる）
      const items = result.items.filter((item) => {
        const content = extractContent(item as Record<string, unknown>);
        return content.length > 50 && item.title;
      });
      if (items.length === 0) continue;

      const item = items[Math.floor(Math.random() * Math.min(5, items.length))];
      const content = extractContent(item as Record<string, unknown>);

      // コンテンツが短い場合はタイトルも補完
      const fullContent = content.length < 200
        ? `${item.title}. ${content}`
        : content;

      return {
        title: item.title || '',
        content: fullContent,
        source: feed.name,
        link: item.link || '',
        genre,
      };
    } catch {
      continue;
    }
  }
  return null;
}

// Step A単体: 指定ジャンルのジャンル固有フィード（3件）のみを試す。
// フォールバック（Step B/C）には進まない。テスト用に単体で呼べるようexport。
export async function tryGenreFeedsOnly(genreIndex: number): Promise<Article | null> {
  return tryFeeds(GENRE_FEEDS[genreIndex].feeds, GENRE_FEEDS[genreIndex].genre);
}

// テスト/デバッグ用: 指定フィードURL単体を取得し、抽出できる記事本文の状態を返す。
// 新規追加フィードの疎通確認（週次レビュー・scripts/check-feeds.ts）に使う。
export async function debugFetchFeed(url: string): Promise<{
  ok: boolean;
  itemCount: number;
  firstTitle?: string;
  firstContentLength: number;
  error?: string;
}> {
  try {
    const result = await parser.parseURL(url);
    const items = result.items.filter((item) => {
      const content = extractContent(item as Record<string, unknown>);
      return content.length > 50 && item.title;
    });
    const first = items[0] as Record<string, unknown> | undefined;
    return {
      ok: items.length > 0,
      itemCount: items.length,
      firstTitle: first ? String(first.title ?? '') : undefined,
      firstContentLength: first ? extractContent(first).length : 0,
    };
  } catch (e) {
    return {
      ok: false,
      itemCount: 0,
      firstContentLength: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

const BBC_FIXED_FALLBACK_FEEDS = [
  { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
];

// 記事取得の優先順位: ①ジャンル固有のリアルタイム記事(Step A) → ②AI生成(Step B)
// → ③BBC News/World固定フォールバック(Step C)。
export async function fetchNewsArticle(genreIndexOverride?: number): Promise<Article> {
  const { genre, index } = genreIndexOverride !== undefined
    ? { genre: GENRE_FEEDS[genreIndexOverride].genre, index: genreIndexOverride }
    : getTodayGenre();

  // Step A: ジャンル固有フィード（3件）
  const stepA = await tryFeeds(GENRE_FEEDS[index].feeds, genre);
  if (stepA) {
    logArticleSource('A', genre, stepA.source);
    return stepA;
  }

  // Step B: ジャンル固有フィードが全滅した場合のみ、AI生成にフォールバック
  try {
    const stepB = await generateArticleWithAI(genre, index);
    logArticleSource('B', genre, stepB.source);
    return stepB;
  } catch (e) {
    console.warn('[fetchNewsArticle] Step B (AI-generated) failed, falling back to Step C:', e);
  }

  // Step C: AI生成も失敗した場合のみ、BBC固定フォールバック
  const stepC = await tryFeeds(BBC_FIXED_FALLBACK_FEEDS, genre);
  if (stepC) {
    logArticleSource('C', genre, stepC.source);
    return stepC;
  }

  throw new Error('Failed to fetch news from all feeds (Step A/B/C all failed)');
}
