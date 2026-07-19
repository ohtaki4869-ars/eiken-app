// GENRE_FEEDS内の全フィード（新規追加分含む）を1件ずつ叩き、記事本文が
// 抽出できているか（content.lengthが十分か）を確認するデバッグスクリプト。
// 週次レビュー（docs/weekly-review-checklist.md）でのフィード疎通確認に使う。
//
// 実行: npx tsx scripts/check-feeds.ts

import { GENRE_FEEDS, debugFetchFeed } from '../lib/rss';

async function main() {
  for (const { genre, feeds } of GENRE_FEEDS) {
    console.log(`\n=== ${genre} ===`);
    for (const feed of feeds) {
      const result = await debugFetchFeed(feed.url);
      const status = result.ok ? 'OK' : 'NG';
      const detail = result.ok
        ? `items=${result.itemCount} firstContentLength=${result.firstContentLength} firstTitle="${result.firstTitle}"`
        : `error=${result.error}`;
      console.log(`  [${status}] ${feed.name} (${feed.url}) — ${detail}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
