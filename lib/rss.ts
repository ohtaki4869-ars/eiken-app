import Parser from 'rss-parser';

const parser = new Parser();

const RSS_FEEDS = [
  { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews' },
  { name: 'TIME', url: 'https://time.com/feed/' },
];

export interface Article {
  title: string;
  content: string;
  source: string;
  link: string;
}

export async function fetchNewsArticle(): Promise<Article> {
  for (const feed of RSS_FEEDS) {
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
      };
    } catch {
      continue;
    }
  }
  throw new Error('Failed to fetch news from all feeds');
}
