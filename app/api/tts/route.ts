import { NextResponse } from 'next/server';

// 話者ごとの音声マッピング
const VOICE_MAP: Record<string, string> = {
  male1:   'en-US-Neural2-J',  // 落ち着いた男性
  male2:   'en-US-Neural2-D',  // 明るい男性
  female1: 'en-US-Neural2-F',  // 落ち着いた女性
  female2: 'en-US-Neural2-C',  // 明るい女性
};

export async function POST(request: Request) {
  const { text, voice } = await request.json();
  if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 });

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const voiceName = VOICE_MAP[voice] ?? 'en-US-Neural2-J';

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'en-US', name: voiceName },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ audioContent: data.audioContent });
}
