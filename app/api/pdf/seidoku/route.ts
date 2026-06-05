import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getJSTDateKey, loadQuestions } from '@/app/api/generate/route';
import { GeneratedQuestions, VocabQuestion } from '@/lib/claude';

// pdfkit は CommonJS モジュールなので動的 import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

const FONT_PATH = path.join(process.cwd(), 'public/fonts/NotoSansJP-Regular.otf');

/** PDF バッファを生成して返す */
async function buildPDF(data: GeneratedQuestions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fontPath = FONT_PATH;
    const hasFont = fs.existsSync(fontPath);
    if (hasFont) {
      doc.registerFont('JP', fontPath);
    }
    const jf = (size: number) => {
      if (hasFont) doc.font('JP').fontSize(size);
      else doc.font('Helvetica').fontSize(size);
      return doc;
    };

    const W = 595.28; // A4 width pt
    const H = 841.89; // A4 height pt
    const ML = 36, MR = 36, MT = 36;
    const CW = W - ML - MR; // content width

    // ─── カラー定義 ───
    const NAVY   = '#1a3a5c';
    const BLUE   = '#2c6fad';
    const LGRAY  = '#f0f4f8';
    const GRAY   = '#cccccc';
    const DGRAY  = '#555555';

    // ─── ヘルパー ───
    function hline(y: number, color = GRAY, width = 0.5) {
      doc.moveTo(ML, y).lineTo(W - MR, y).strokeColor(color).lineWidth(width).stroke();
    }
    function box(x: number, y: number, w: number, h: number, fill: string) {
      doc.rect(x, y, w, h).fillColor(fill).fill();
    }
    function writeLine(text: string, x: number, y: number, size: number,
                       color = '#000000', opts: Record<string, unknown> = {}) {
      jf(size).fillColor(color).text(text, x, y, { lineBreak: false, ...opts });
    }

    // ────────────────────────────────────────────
    //  PAGE 1 : パッセージ
    // ────────────────────────────────────────────
    doc.addPage();
    let y = MT;

    // ── タイトルバー ──
    box(0, 0, W, 52, NAVY);
    jf(18).fillColor('#ffffff').text('精読ノート', ML, 10, { lineBreak: false });
    jf(10).fillColor('#aaccee').text('EIKEN Grade 1 — Intensive Reading Practice', ML, 34, { lineBreak: false });
    y = 60;

    // ── 記入欄 ──
    jf(8).fillColor(DGRAY)
      .text(`日付：＿＿＿＿年＿＿月＿＿日　　所要時間：＿＿＿分　　理解度：☆☆☆☆☆`, ML, y, { lineBreak: false });
    y += 14;
    hline(y, GRAY, 0.5);
    y += 8;

    // ── 出典 ──
    const source = `出典: ${data.article.source} — ${data.article.title}`;
    jf(8).fillColor(BLUE).text(source, ML, y, { width: CW, lineBreak: false });
    y += 14;

    // ── パッセージ見出し ──
    box(ML, y, CW, 18, LGRAY);
    jf(10).fillColor(NAVY).text('■ Passage　（下線・メモを書き込もう）', ML + 6, y + 4, { lineBreak: false });
    y += 24;

    // ── 段落を出力（行間広め）───────
    const paragraphs = data.readingPassage.split('\n').filter(p => p.trim());
    const LINE_HEIGHT = 24; // 書き込み用に広め

    paragraphs.forEach((para, i) => {
      // 段落番号バッジ
      const badgeX = ML;
      box(badgeX, y, 16, 16, BLUE);
      jf(7).fillColor('#ffffff').text(`¶${i + 1}`, badgeX + 1, y + 3, { width: 14, align: 'center', lineBreak: false });

      // 段落テキスト（英語）
      const textX = ML + 22;
      const textW = CW - 22;
      jf(10).fillColor('#000000');
      const textHeight = doc.heightOfString(para, { width: textW });
      doc.text(para, textX, y, { width: textW, lineGap: LINE_HEIGHT - 14 });
      y += textHeight + LINE_HEIGHT; // 余白を追加

      if (y > H - 80) {
        doc.addPage();
        y = MT;
      }
    });

    y += 6;
    hline(y, GRAY);
    y += 10;

    // ── フッター ──
    jf(7).fillColor(DGRAY).text('英検1級 毎日トレーニング　精読ノート — Page 1', ML, H - 24, { lineBreak: false });
    jf(7).fillColor(DGRAY).text(`生成日: ${getJSTDateKey()}`, W - 120, H - 24, { lineBreak: false });

    // ────────────────────────────────────────────
    //  PAGE 2 : ワークシート
    // ────────────────────────────────────────────
    doc.addPage();
    y = MT;

    // ── タイトルバー ──
    box(0, 0, W, 52, NAVY);
    jf(18).fillColor('#ffffff').text('精読ワークシート', ML, 10, { lineBreak: false });
    jf(9).fillColor('#aaccee').text('The Paradox of Choice — Intensive Reading Worksheet', ML, 34, { lineBreak: false });
    y = 60;

    // ─────────────────────────────────
    //  Step 2: 語彙チェック
    // ─────────────────────────────────
    box(ML, y, CW, 18, BLUE);
    jf(10).fillColor('#ffffff').text('Step 2　語彙チェック', ML + 6, y + 4, { lineBreak: false });
    y += 22;
    jf(8).fillColor(DGRAY).text('今日の語彙問題の単語を確認しよう。知らなかった単語に ✓ を入れてください。', ML, y);
    y += 14;

    // ── テーブルヘッダー ──
    const C = [ML, ML + 16, ML + 16 + 100, ML + 16 + 100 + 110, ML + 16 + 100 + 110 + 180];
    const CWCOLS = [16, 100, 110, 180, CW - 16 - 100 - 110 - 180];

    box(ML, y, CW, 16, LGRAY);
    ['✓', '単語', '意味（日本語）', '例文', ''].forEach((h, i) => {
      jf(7.5).fillColor(NAVY).text(h, C[i] + 2, y + 3, { width: CWCOLS[i] - 4, lineBreak: false });
    });
    y += 16;
    hline(y, GRAY);

    // ── 各語彙 ──
    data.vocabQuestions.forEach((q: VocabQuestion) => {
      const word = q.choices[q.answer as keyof typeof q.choices];
      // explanationから日本語意味を抽出（最初の（）内）
      const meaningMatch = q.explanation.match(/^([^（(]+[）)][^。]*。?)/);
      const meaning = meaningMatch ? meaningMatch[0].slice(0, 30) : q.explanation.slice(0, 30);
      const example = q.sentence.replace('____', `[${word}]`).slice(0, 55);

      const rowH = 20;
      // 罫線
      hline(y + rowH, GRAY, 0.3);
      // チェックボックス
      doc.rect(C[0] + 2, y + 4, 10, 10).strokeColor(GRAY).lineWidth(0.5).stroke();
      // 単語
      jf(9).fillColor(BLUE).text(word, C[1] + 2, y + 5, { width: CWCOLS[1] - 4, lineBreak: false });
      // 意味
      jf(8).fillColor('#000000').text(meaning, C[2] + 2, y + 5, { width: CWCOLS[2] - 4, lineBreak: false });
      // 例文
      jf(7.5).fillColor(DGRAY).text(example, C[3] + 2, y + 5, { width: CWCOLS[3] - 4, lineBreak: false });

      y += rowH;
    });

    y += 10;

    // ─────────────────────────────────
    //  Step 3: 段落要約
    // ─────────────────────────────────
    box(ML, y, CW, 18, BLUE);
    jf(10).fillColor('#ffffff').text('Step 3　段落ごとの1行要約', ML + 6, y + 4, { lineBreak: false });
    y += 22;
    jf(8).fillColor(DGRAY).text('各段落のポイントを日本語で1〜2行にまとめよう', ML, y);
    y += 14;

    paragraphs.forEach((_, i) => {
      jf(8).fillColor(BLUE).text(`¶${i + 1}`, ML, y + 4, { width: 16, lineBreak: false });
      jf(8).fillColor(DGRAY).text('→', ML + 18, y + 4, { width: 12, lineBreak: false });
      hline(y + 20, GRAY, 0.5);
      y += 24;
    });

    y += 8;

    // ─────────────────────────────────
    //  Step 4: 論理の流れ
    // ─────────────────────────────────
    box(ML, y, CW, 18, BLUE);
    jf(10).fillColor('#ffffff').text('Step 4　論理の流れ', ML + 6, y + 4, { lineBreak: false });
    y += 22;

    const flowItems = ['通説 (¶1)', '反証 (¶2)', '具体例 (¶3)', '解決策 (¶4)'];
    const boxW = 96, boxH = 36, gap = 12;
    const totalW = flowItems.length * boxW + (flowItems.length - 1) * gap;
    let fx = ML + (CW - totalW) / 2;

    flowItems.forEach((label, i) => {
      box(fx, y, boxW, boxH, LGRAY);
      doc.rect(fx, y, boxW, boxH).strokeColor(BLUE).lineWidth(0.8).stroke();
      jf(8.5).fillColor(NAVY).text(label, fx, y + 12, { width: boxW, align: 'center', lineBreak: false });
      if (i < flowItems.length - 1) {
        jf(14).fillColor(BLUE).text('→', fx + boxW + 1, y + 10, { lineBreak: false });
      }
      fx += boxW + gap;
    });
    y += boxH + 12;

    // ─────────────────────────────────
    //  メモ欄
    // ─────────────────────────────────
    box(ML, y, CW, 18, BLUE);
    jf(10).fillColor('#ffffff').text('メモ・気づき', ML + 6, y + 4, { lineBreak: false });
    y += 22;

    const memoLines = Math.floor((H - y - 30) / 22);
    for (let i = 0; i < memoLines; i++) {
      hline(y + 18, GRAY, 0.3);
      y += 22;
    }

    // ── フッター ──
    jf(7).fillColor(DGRAY).text('英検1級 毎日トレーニング　精読ワークシート — Page 2', ML, H - 24, { lineBreak: false });
    jf(7).fillColor(DGRAY).text(`生成日: ${getJSTDateKey()}`, W - 120, H - 24, { lineBreak: false });

    doc.end();
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? getJSTDateKey();

  const data = await loadQuestions(date);
  if (!data) {
    return NextResponse.json({ error: 'Questions not found for this date' }, { status: 404 });
  }

  try {
    const pdfBuffer = await buildPDF(data);
    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="seidoku-${date}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (e) {
    console.error('PDF generation error:', e);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
