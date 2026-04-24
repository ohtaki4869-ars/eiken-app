import Parser from 'rss-parser';

const parser = new Parser();

// 曜日ごとのジャンルと対応フィード（月〜日）
const GENRE_FEEDS = [
  {
    genre: '国際・政治',
    feeds: [
      { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews' },
    ],
  },
  {
    genre: 'サイエンス・テクノロジー',
    feeds: [
      { name: 'BBC Science', url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
      { name: 'Scientific American', url: 'http://rss.sciam.com/ScientificAmerican-Global' },
    ],
  },
  {
    genre: 'ビジネス・経済',
    feeds: [
      { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml' },
      { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
    ],
  },
  {
    genre: '環境・気候',
    feeds: [
      { name: 'BBC Environment', url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
      { name: 'Guardian Environment', url: 'https://www.theguardian.com/environment/rss' },
    ],
  },
  {
    genre: '健康・医療',
    feeds: [
      { name: 'BBC Health', url: 'http://feeds.bbci.co.uk/news/health/rss.xml' },
      { name: 'Reuters Health', url: 'https://feeds.reuters.com/reuters/healthNews' },
    ],
  },
  {
    genre: '文化・社会',
    feeds: [
      { name: 'TIME', url: 'https://time.com/feed/' },
      { name: 'BBC Culture', url: 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
    ],
  },
  {
    genre: '教育・テクノロジー',
    feeds: [
      { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml' },
      { name: 'TIME', url: 'https://time.com/feed/' },
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

export async function fetchNewsArticle(): Promise<Article> {
  const { genre, index } = getTodayGenre();
  const feeds = GENRE_FEEDS[index].feeds;

  for (const feed of feeds) {
    try {
      const result = await parser.parseURL(feed.url);
      const items = result.items.filter(
        (item) => item.contentSnippet && item.contentSnippet.length > 200
      );
      if (items.length === 0) continue;

      const item = items[Math.floor(Math.random() * Math.min(5, items.length))];
      return {
        title: item.title || '',
        content: item.contentSnippet || item.content || '',
        source: feed.name,
        link: item.link || '',
        genre,
      };
    } catch {
      continue;
    }
  }

  // フォールバック：BBCトップ
  const fallback = await parser.parseURL('http://feeds.bbci.co.uk/news/rss.xml');
  const items = fallback.items.filter((item) => item.contentSnippet && item.contentSnippet.length > 200);
  const item = items[0];
  return {
    title: item?.title || '',
    content: item?.contentSnippet || '',
    source: 'BBC News',
    link: item?.link || '',
    genre,
  };
}
