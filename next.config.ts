import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit は fs.readFileSync(__dirname + '/data/...') で標準フォントを読み込むため、
  // バンドル/トレース対象から外してネイティブ require のまま解決させる（__dirname を壊さないため）
  serverExternalPackages: ['pdfkit'],
};

export default nextConfig;
