import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit は自身の __dirname でフォントを探すため、バンドルしない
  serverExternalPackages: ['pdfkit'],
  // フォントファイルをサーバー関数に含める
  outputFileTracingIncludes: {
    '/api/pdf/seidoku': ['./public/fonts/NotoSansJP-Regular.otf'],
  },
};

export default nextConfig;
