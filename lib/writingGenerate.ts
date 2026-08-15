import Anthropic from '@anthropic-ai/sdk';
import { THEME_CATEGORIES, ThemeCategory, EssayTopic, DailyExpressionPrompt, SummaryPassage } from './writingTypes';
import { EXPRESSION_STOCK, ExpressionStockItem } from './writingExpressions';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// lib/claude.ts と同じ環境変数（未設定時は haiku にフォールバック）を再利用する。
const GENERATION_MODEL = process.env.GENERATION_MODEL ?? 'claude-haiku-4-5';

// 拡張思考ブロックを返すモデルでも最初の text ブロックを取り出す（lib/claude.ts と同じ理由）
function extractText(response: Anthropic.Messages.Message): string {
  const textBlock = response.content.find((b): b is Anthropic.Messages.TextBlock => b.type === 'text');
  return textBlock?.text ?? '';
}

function logUsage(label: string, response: Anthropic.Messages.Message): void {
  const u = response.usage;
  console.log(
    `[${label}] model:`, GENERATION_MODEL,
    'stop_reason:', response.stop_reason,
    'input_tokens:', u?.input_tokens,
    'output_tokens:', u?.output_tokens,
    'cache_creation_input_tokens:', u?.cache_creation_input_tokens,
    'cache_read_input_tokens:', u?.cache_read_input_tokens
  );
}

// lib/claude.ts の parseJson と同じロジック（非exportのため複製）。
// コードフェンス除去 → 先頭'{'〜末尾'}'抽出の順でフォールバックする。
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenceMatch ? fenceMatch[1] : text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found');
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

function isThemeCategory(v: unknown): v is ThemeCategory {
  return typeof v === 'string' && (THEME_CATEGORIES as readonly string[]).includes(v);
}

function pickFallbackTheme(excluded: string[]): ThemeCategory {
  return THEME_CATEGORIES.find((t) => !excluded.includes(t)) ?? THEME_CATEGORIES[0];
}

// ===== 週次エッセイ（大問5: 意見論述） =====

function buildEssayStaticInstructions(): string {
  return `You are an expert EIKEN Grade 1 (英検1級) writing test creator specializing in the opinion essay task (大問5).

Generate ONE essay TOPIC in authentic EIKEN Grade 1 style. Rules:
- Use either "Agree or disagree: <statement>" or "Should <subject> <do something>?" phrasing — vary the form.
- The topic must be debatable (reasonable arguments exist on both sides), socially/currently relevant, and answerable without highly specialized expert knowledge.
- Do NOT include supporting points, hints, or arguments — EIKEN test-takers must build their own reasoning.
- Pick exactly one theme category from this fixed list and report it: ${THEME_CATEGORIES.join(' / ')}.
- Return ONLY a JSON object, no prose, no code fences: {"topic": "...", "theme": "<one of the categories above>"}`;
}

function buildEssayDynamicContext(excludedThemes: string[]): string {
  if (excludedThemes.length === 0) {
    return 'No recent themes to avoid. Pick any theme from the list.';
  }
  return `Avoid these themes used in recent sessions (pick a different one if possible): ${excludedThemes.join(', ')}`;
}

export async function generateEssayTopic(recentThemes: string[]): Promise<EssayTopic> {
  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 1024,
    system: [
      { type: 'text', text: buildEssayStaticInstructions(), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: buildEssayDynamicContext(recentThemes) }],
  });
  logUsage('Essay', response);
  const text = extractText(response);

  let parsed: { topic?: string; theme?: string };
  try {
    parsed = parseJson(text) as { topic?: string; theme?: string };
  } catch (e) {
    console.error('[Essay] JSON parse error:', e, '\nresponse:', text);
    throw new Error('Failed to parse JSON from Claude response (essay)');
  }
  if (!parsed.topic) {
    throw new Error('Essay generation returned no topic');
  }

  const theme = isThemeCategory(parsed.theme) ? parsed.theme : pickFallbackTheme(recentThemes);
  if (!isThemeCategory(parsed.theme)) {
    console.warn('[Essay] theme not in whitelist, falling back:', parsed.theme, '->', theme);
  }

  return {
    topic: parsed.topic,
    theme,
    wordCountMin: 200,
    wordCountMax: 240,
    generatedAt: new Date().toISOString(),
  };
}

// ===== 毎日の表現トレーニング =====

function pickDailyExpressions(recentIds: string[]): ExpressionStockItem[] {
  const available = EXPRESSION_STOCK.filter((e) => !recentIds.includes(e.id));
  const pool = available.length > 0 ? available : EXPRESSION_STOCK;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const count = shuffled.length > 1 && Math.random() < 0.35 ? 2 : 1;
  return shuffled.slice(0, count);
}

function buildDailyStaticInstructions(): string {
  return `You are an EIKEN Grade 1 (英検1級) writing coach creating a short daily expression drill.
The drill helps students practice constructs/vocabulary they will need in opinion essays and summaries.

Given one or two target expressions, write:
- "instruction": a Japanese instruction sentence telling the student to write 1〜2 English sentences using the given target expression(s), about a short everyday-or-social topic you invent (vary the topic each time, keep it simple — no need to relate it to current events).
- "referenceVocab": 0〜3 optional English words/phrases (1級レベル) that could help, or omit if unnecessary.

Return ONLY a JSON object, no prose, no code fences:
{"instruction": "...", "referenceVocab": ["...", "..."]}`;
}

function buildDailyDynamicContext(targets: ExpressionStockItem[]): string {
  const list = targets.map((t) => `- ${t.label}${t.example ? `（例: ${t.example}）` : ''}`).join('\n');
  return `Target expression(s) to require in the instruction:\n${list}`;
}

export async function generateDailyExpression(recentExpressionIds: string[]): Promise<DailyExpressionPrompt> {
  const targets = pickDailyExpressions(recentExpressionIds);

  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 512,
    system: [
      { type: 'text', text: buildDailyStaticInstructions(), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: buildDailyDynamicContext(targets) }],
  });
  logUsage('DailyExpression', response);
  const text = extractText(response);

  let parsed: { instruction?: string; referenceVocab?: string[] };
  try {
    parsed = parseJson(text) as { instruction?: string; referenceVocab?: string[] };
  } catch (e) {
    console.error('[DailyExpression] JSON parse error:', e, '\nresponse:', text);
    throw new Error('Failed to parse JSON from Claude response (daily expression)');
  }
  if (!parsed.instruction) {
    throw new Error('Daily expression generation returned no instruction');
  }

  return {
    targetExpressions: targets.map((t) => ({ id: t.id, label: t.label, category: t.category })),
    instruction: parsed.instruction,
    referenceVocab: parsed.referenceVocab,
    generatedAt: new Date().toISOString(),
  };
}

// ===== 隔週要約（大問4） =====

function buildSummaryStaticInstructions(): string {
  return `You are an expert EIKEN Grade 1 (英検1級) writing test creator specializing in the summary task (大問4).

Generate ONE academic/newspaper-style English passage for a summary exercise. Rules:
- Exactly 3 paragraphs, each with one clear, distinct point (so the passage is easy to summarize point-by-point).
- Total length: 280〜320 words.
- Tone: academic or newspaper feature article, factual, no invented statistics or fake named studies.
- Pick exactly one theme category from this fixed list and report it: ${THEME_CATEGORIES.join(' / ')}.
- Return ONLY a JSON object, no prose, no code fences: {"passage": "paragraph1\\n\\nparagraph2\\n\\nparagraph3", "theme": "<one of the categories above>"}`;
}

function buildSummaryDynamicContext(excludedThemes: string[]): string {
  if (excludedThemes.length === 0) {
    return 'No recent themes to avoid. Pick any theme from the list.';
  }
  return `Avoid these themes used in recent sessions (pick a different one if possible): ${excludedThemes.join(', ')}`;
}

function checkSummarySourceWordCount(passage: string): void {
  const wordCount = passage.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 260 || wordCount > 340) {
    console.warn(`[Summary] source passage word count ${wordCount} (想定280〜320語の範囲外、警告のみ)`);
  }
}

function checkSummaryParagraphCount(passage: string): void {
  const paragraphs = passage.split(/\n\s*\n/).filter((p) => p.trim());
  if (paragraphs.length !== 3) {
    console.warn(`[Summary] paragraph count ${paragraphs.length} (想定3段落、警告のみ)`);
  }
}

export async function generateSummarySource(recentThemes: string[]): Promise<SummaryPassage> {
  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 2048,
    system: [
      { type: 'text', text: buildSummaryStaticInstructions(), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: buildSummaryDynamicContext(recentThemes) }],
  });
  logUsage('Summary', response);
  const text = extractText(response);

  let parsed: { passage?: string; theme?: string };
  try {
    parsed = parseJson(text) as { passage?: string; theme?: string };
  } catch (e) {
    console.error('[Summary] JSON parse error:', e, '\nresponse:', text);
    throw new Error('Failed to parse JSON from Claude response (summary)');
  }
  if (!parsed.passage) {
    throw new Error('Summary generation returned no passage');
  }

  checkSummarySourceWordCount(parsed.passage);
  checkSummaryParagraphCount(parsed.passage);

  const theme = isThemeCategory(parsed.theme) ? parsed.theme : pickFallbackTheme(recentThemes);
  if (!isThemeCategory(parsed.theme)) {
    console.warn('[Summary] theme not in whitelist, falling back:', parsed.theme, '->', theme);
  }

  return {
    passage: parsed.passage,
    theme,
    wordCountMin: 90,
    wordCountMax: 110,
    sourceWordCount: parsed.passage.trim().split(/\s+/).filter(Boolean).length,
    generatedAt: new Date().toISOString(),
  };
}
