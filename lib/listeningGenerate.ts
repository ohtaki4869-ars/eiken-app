import Anthropic from '@anthropic-ai/sdk';
import { Article } from './rss';
import { GeneratedListening } from './listeningTypes';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildListeningPrompt(article: Article): string {
  return `You are an expert English exam question creator specializing in EIKEN Grade 1 (英検1級) listening test questions.

Based on this news article, create authentic EIKEN Grade 1 style listening questions:

Article Title: ${article.title}
Source: ${article.source}
Content: ${article.content.slice(0, 1500)}

Create the following three sections. Return ONLY valid JSON.

---

## SECTION 1: Three short dialogues (Part 1 style)
- Each dialogue: 2 speakers (male1/male2/female1/female2), 6–10 exchanges
- Everyday situations: workplace, travel, home, study — loosely related to the article topic
- Natural English with idioms and colloquialisms (like real EIKEN Grade 1 Part 1)
- One question per dialogue asking about implication, opinion, or what a speaker says
- 4 choices: complete sentences, 15–25 words each
- Question stems like real EIKEN: "What does the woman imply about...?", "What do we learn about the man?", "What opinion do they share?"

## SECTION 2: One academic monologue (Part 2 style)
- Topic directly related to the article
- 2 paragraphs, ~150–180 words total
- Formal, academic English — like a radio documentary
- 2 questions: "What is one thing the speaker says about X?", "What did researchers/experts find?"
- 4 choices: complete sentences, 20–35 words each

## SECTION 3: One real-life situation (Part 3 style)
- A practical scenario with multiple options (shopping, services, scheduling, etc.)
- Give a clear "situation" for the listener (e.g., "You want to buy a laptop under $1,000 with at least 16GB RAM.")
- Script: a store clerk, receptionist, or advisor explaining 3–4 options with specific details
- One question: "Which option should you choose?" or "What should you do?"
- 4 choices: specific short phrases (the names/descriptions of the options)

---

Return this exact JSON structure:
{
  "dialogues": [
    {
      "id": "no1",
      "lines": [
        { "speaker": "female1", "text": "Hi Mark, did you see the news about..." },
        { "speaker": "male1", "text": "Yes, I was surprised. I thought..." }
      ],
      "question": "What does the woman imply about the situation?",
      "choices": {
        "A": "The news report contained several factual errors that needed to be corrected.",
        "B": "The development was more significant than most people had anticipated.",
        "C": "Experts had been expecting this outcome for quite some time.",
        "D": "The government response to the situation was largely ineffective."
      },
      "answer": "B",
      "explanation": "女性の発言「I didn't expect it to happen so soon」から、予想より早い・大きな出来事だったことが読み取れる。"
    }
  ],
  "monologue": {
    "title": "The Impact of Microplastics on Marine Ecosystems",
    "paragraphs": [
      "First paragraph text here...",
      "Second paragraph text here..."
    ],
    "questions": [
      {
        "number": 1,
        "question": "What is one thing the speaker says about microplastics?",
        "choices": {
          "A": "They have been found in concentrations far higher than previously measured in deep ocean trenches.",
          "B": "Their presence in the food chain has raised serious concerns among marine biologists worldwide.",
          "C": "New filtration technology has succeeded in removing most of them from coastal waters.",
          "D": "Their effects on human health are considered minimal compared to other pollutants."
        },
        "answer": "B",
        "explanation": "第1段落で「marine biologists have expressed alarm at the rate of accumulation in the food chain」と述べられている。"
      },
      {
        "number": 2,
        "question": "What did researchers find about the long-term effects?",
        "choices": {
          "A": "Fish populations in heavily polluted areas have shown signs of gradual recovery over the past decade.",
          "B": "The breakdown of microplastics releases chemicals that interfere with the reproductive systems of marine life.",
          "C": "Governments have agreed to implement strict regulations to limit plastic production by 2030.",
          "D": "The economic cost of cleaning up ocean pollution exceeds the value of the fishing industry."
        },
        "answer": "B",
        "explanation": "第2段落で「chemical compounds released during decomposition disrupt hormonal systems in fish」と述べられている。"
      }
    ]
  },
  "realLife": {
    "situation": "You are looking for a gym membership. You want to go swimming at least twice a week, and your budget is $60 per month.",
    "script": "Welcome to FitLife Center. We have four membership plans. The Basic Plan is $35 a month and includes access to our weight room and cardio area, but not the pool. The Standard Plan is $55 a month and includes everything in Basic plus two pool sessions per week. The Premium Plan is $75 a month and gives you unlimited pool access and a monthly personal training session. Finally, our Family Plan is $120 a month and covers two adults with full facility access including the pool.",
    "question": "Which membership plan should you choose?",
    "choices": {
      "A": "The Basic Plan",
      "B": "The Standard Plan",
      "C": "The Premium Plan",
      "D": "The Family Plan"
    },
    "answer": "B",
    "explanation": "水泳週2回という条件を満たし、予算$60以内に収まるのはStandard Plan（$55）のみ。BasicはプールなしでNG、PremiumとFamilyは予算超過。"
  }
}`;
}

export async function generateListening(article: Article): Promise<GeneratedListening> {
  const prompt = buildListeningPrompt(article);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 5000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Failed to parse listening JSON');
    parsed = JSON.parse(text.slice(start, end + 1));
  }

  return {
    dialogues: parsed.dialogues,
    monologue: parsed.monologue,
    realLife: parsed.realLife,
    generatedAt: new Date().toISOString(),
  };
}
