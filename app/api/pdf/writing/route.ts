import { NextResponse } from 'next/server';
import { createPdfDoc, COLORS, PAGE_W, PAGE_H, MARGIN_L, MARGIN_T, CONTENT_W, PdfContext } from '@/lib/pdfKit';
import { loadWriting, getJSTDateKey, WritingType } from '@/app/api/writing/_storage';
import type { EssayTopic, DailyExpressionPrompt, SummaryPassage } from '@/lib/writingTypes';

// Node.js ランタイムを明示（pdfkit は Edge Runtime 非対応）
export const runtime = 'nodejs';

// ===== 3機能共通のレイアウトヘルパー =====

function drawHeader(ctx: PdfContext, title: string, subtitle: string): number {
  const { jf, box } = ctx;
  box(0, 0, PAGE_W, 52, COLORS.NAVY);
  jf(18).fillColor('#ffffff').text(title, MARGIN_L, 10, { lineBreak: false });
  jf(10).fillColor('#aaccee').text(subtitle, MARGIN_L, 34, { lineBreak: false });
  return 60;
}

function drawInstructionBlock(ctx: PdfContext, y: number, label: string, text: string): number {
  const { doc, jf, box } = ctx;
  box(MARGIN_L, y, CONTENT_W, 18, COLORS.BLUE);
  jf(10).fillColor('#ffffff').text(label, MARGIN_L + 6, y + 4, { lineBreak: false });
  y += 24;
  jf(11).fillColor('#000000');
  const textOpts = { width: CONTENT_W, lineGap: 4 };
  const h = doc.heightOfString(text, textOpts);
  doc.text(text, MARGIN_L, y, textOpts);
  return y + h + 14;
}

function drawRuledLines(ctx: PdfContext, startY: number, lineCount: number, lineHeight = 28): number {
  const { doc, hline } = ctx;
  let y = startY;
  for (let i = 0; i < lineCount; i++) {
    if (y + lineHeight > PAGE_H - 40) {
      doc.addPage();
      y = MARGIN_T;
    }
    hline(y + lineHeight - 8, COLORS.GRAY, 0.5);
    y += lineHeight;
  }
  return y;
}

function drawFooter(ctx: PdfContext, label: string, dateKey: string) {
  ctx.jf(7).fillColor(COLORS.DGRAY).text(label, MARGIN_L, PAGE_H - 24, { lineBreak: false });
  ctx.jf(7).fillColor(COLORS.DGRAY).text(`生成日: ${dateKey}`, PAGE_W - 120, PAGE_H - 24, { lineBreak: false });
}

// ===== 機能別ビルダー =====

async function buildEssayPdf(data: EssayTopic, dateKey: string): Promise<Buffer> {
  const ctx = createPdfDoc();
  const { doc, jf } = ctx;
  doc.addPage();
  let y = drawHeader(ctx, '週次エッセイ', 'EIKEN Grade 1 — Opinion Essay Practice');
  jf(9).fillColor(COLORS.DGRAY).text(`テーマ: ${data.theme}`, MARGIN_L, y, { lineBreak: false });
  y += 18;
  y = drawInstructionBlock(ctx, y, `■ TOPIC（${data.wordCountMin}〜${data.wordCountMax}語で意見を述べなさい）`, data.topic);
  y += 6;
  drawRuledLines(ctx, y, 40);
  drawFooter(ctx, '英検1級 ライティング　週次エッセイ', dateKey);
  doc.end();
  return ctx.getBuffer();
}

async function buildDailyPdf(data: DailyExpressionPrompt, dateKey: string): Promise<Buffer> {
  const ctx = createPdfDoc();
  const { doc, jf, box } = ctx;
  doc.addPage();
  let y = drawHeader(ctx, '毎日の表現トレーニング', 'EIKEN Grade 1 — Daily Expression Drill');
  const targetLabel = data.targetExpressions.map((t) => t.label).join(' / ');
  jf(9).fillColor(COLORS.DGRAY).text(`対象表現: ${targetLabel}`, MARGIN_L, y, { width: CONTENT_W });
  y += 18;
  y = drawInstructionBlock(ctx, y, '■ 指示', data.instruction);
  if (data.referenceVocab && data.referenceVocab.length > 0) {
    box(MARGIN_L, y, CONTENT_W, 16, COLORS.LGRAY);
    jf(8.5).fillColor(COLORS.NAVY).text(`参考語彙: ${data.referenceVocab.join(', ')}`, MARGIN_L + 6, y + 3, {
      width: CONTENT_W - 12,
      lineBreak: false,
    });
    y += 22;
  }
  y += 6;
  drawRuledLines(ctx, y, 6);
  drawFooter(ctx, '英検1級 ライティング　毎日の表現トレーニング', dateKey);
  doc.end();
  return ctx.getBuffer();
}

async function buildSummaryPdf(data: SummaryPassage, dateKey: string): Promise<Buffer> {
  const ctx = createPdfDoc();
  const { doc, jf, box } = ctx;
  doc.addPage();
  let y = drawHeader(ctx, '隔週要約', 'EIKEN Grade 1 — Summary Practice');
  jf(9).fillColor(COLORS.DGRAY).text(`テーマ: ${data.theme}　　本文語数: 約${data.sourceWordCount}語`, MARGIN_L, y, { lineBreak: false });
  y += 18;

  box(MARGIN_L, y, CONTENT_W, 18, COLORS.LGRAY);
  jf(10).fillColor(COLORS.NAVY).text('■ Passage', MARGIN_L + 6, y + 4, { lineBreak: false });
  y += 24;

  const paragraphs = data.passage.split(/\n\s*\n/).filter((p) => p.trim());
  paragraphs.forEach((para, i) => {
    box(MARGIN_L, y, 16, 16, COLORS.BLUE);
    jf(7).fillColor('#ffffff').text(`¶${i + 1}`, MARGIN_L + 1, y + 3, { width: 14, align: 'center', lineBreak: false });
    const textX = MARGIN_L + 22;
    const textW = CONTENT_W - 22;
    jf(10).fillColor('#000000');
    const textOpts = { width: textW, lineGap: 4 };
    const h = doc.heightOfString(para, textOpts);
    doc.text(para, textX, y, textOpts);
    y += h + 14;
    if (y > PAGE_H - 80) {
      doc.addPage();
      y = MARGIN_T;
    }
  });

  y += 10;
  y = drawInstructionBlock(
    ctx,
    y,
    `■ 要約（${data.wordCountMin}〜${data.wordCountMax}語で書きなさい）`,
    '本文を読んで、できるだけ自分自身の言葉で要約しなさい。'
  );
  drawRuledLines(ctx, y, 12);
  drawFooter(ctx, '英検1級 ライティング　隔週要約', dateKey);
  doc.end();
  return ctx.getBuffer();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const date = searchParams.get('date') ?? getJSTDateKey();

  if (type !== 'essay' && type !== 'daily' && type !== 'summary') {
    return NextResponse.json({ error: 'Invalid or missing type (essay|daily|summary)' }, { status: 400 });
  }
  const writingType: WritingType = type;

  const data = await loadWriting(writingType, date);
  if (!data) {
    return NextResponse.json({ error: 'Writing content not found for this date' }, { status: 404 });
  }

  try {
    const pdfBuffer =
      writingType === 'essay'
        ? await buildEssayPdf(data as EssayTopic, date)
        : writingType === 'daily'
        ? await buildDailyPdf(data as DailyExpressionPrompt, date)
        : await buildSummaryPdf(data as SummaryPassage, date);

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="writing-${writingType}-${date}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (e) {
    console.error('PDF generation error:', e);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
