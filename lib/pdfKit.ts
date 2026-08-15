import path from 'path';
import fs from 'fs';

// pdfkit は CommonJS モジュールなので動的 require（Edge Runtime非対応、呼び出し側で runtime='nodejs' を明示すること）。
// pdfkit は標準14フォントのAFMメトリクスを fs.readFileSync(__dirname + '/data/...') で実行時に読み込むため、
// Turbopackにバンドル・トレースされると __dirname が仮想パスに書き換えられ ENOENT になる。
// next.config.ts の serverExternalPackages に 'pdfkit' を指定し、ネイティブ require のまま
// node_modules から解決させることで __dirname を正しく保つ（カスタムフォント読み込みには実fsが必要なため、
// fsを持たない pdfkit/standalone ビルドは使えない）。
// バンドラがこの require を { default: ... } でラップすることがあるため両対応にする。
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocumentModule = require('pdfkit');
const PDFDocument = PDFDocumentModule.default ?? PDFDocumentModule;

const FONT_PATH = path.join(process.cwd(), 'public/fonts/NotoSansJP-Regular.otf');

export const PAGE_W = 595.28; // A4 width pt
export const PAGE_H = 841.89; // A4 height pt
export const MARGIN_L = 36;
export const MARGIN_R = 36;
export const MARGIN_T = 36;
export const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

export const COLORS = {
  NAVY: '#1a3a5c',
  BLUE: '#2c6fad',
  LGRAY: '#f0f4f8',
  GRAY: '#cccccc',
  DGRAY: '#555555',
};

// pdfkit本体の型は複雑なためany扱いにする（既存 app/api/pdf/seidoku/route.ts も同様の方針）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PDFDoc = any;

export interface PdfContext {
  doc: PDFDoc;
  jf: (size: number) => PDFDoc;
  hline: (y: number, color?: string, width?: number) => void;
  box: (x: number, y: number, w: number, h: number, fill: string) => void;
  writeLine: (text: string, x: number, y: number, size: number, color?: string, opts?: Record<string, unknown>) => void;
  getBuffer: () => Promise<Buffer>;
}

// A4 pdfkitドキュメントを作成し、共通レイアウトヘルパーを返す。
// 呼び出し側は doc.addPage() 等で自由に描画し、最後に doc.end() を呼んでから getBuffer() を await する。
export function createPdfDoc(): PdfContext {
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });

  // 'data'/'end'/'error' は描画開始前（doc.end()より前）に登録しておく必要がある
  const bufferPromise: Promise<Buffer> = new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const hasFont = fs.existsSync(FONT_PATH);
  if (hasFont) {
    doc.registerFont('JP', FONT_PATH);
  }

  function jf(size: number): PDFDoc {
    if (hasFont) doc.font('JP').fontSize(size);
    else doc.font('Helvetica').fontSize(size);
    return doc;
  }

  function hline(y: number, color = COLORS.GRAY, width = 0.5) {
    doc.moveTo(MARGIN_L, y).lineTo(PAGE_W - MARGIN_R, y).strokeColor(color).lineWidth(width).stroke();
  }

  function box(x: number, y: number, w: number, h: number, fill: string) {
    doc.rect(x, y, w, h).fillColor(fill).fill();
  }

  function writeLine(
    text: string,
    x: number,
    y: number,
    size: number,
    color = '#000000',
    opts: Record<string, unknown> = {}
  ) {
    jf(size).fillColor(color).text(text, x, y, { lineBreak: false, ...opts });
  }

  return { doc, jf, hline, box, writeLine, getBuffer: () => bufferPromise };
}
