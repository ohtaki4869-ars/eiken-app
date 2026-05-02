export type Speaker = 'male1' | 'male2' | 'female1' | 'female2';

export interface DialogueLine {
  speaker: Speaker;
  text: string;
}

export interface ListeningChoice {
  A: string; B: string; C: string; D: string;
}

export interface DialogueItem {
  id: string;
  lines: DialogueLine[];
  question: string;
  choices: ListeningChoice;
  answer: string;
  explanation: string;
}

export interface MonologueQuestion {
  number: number;
  question: string;
  choices: ListeningChoice;
  answer: string;
  explanation: string;
}

export interface MonologueItem {
  title: string;
  paragraphs: string[];
  questions: MonologueQuestion[];
}

export interface RealLifeItem {
  situation: string;
  script: string;
  question: string;
  choices: ListeningChoice;
  answer: string;
  explanation: string;
}

export interface GeneratedListening {
  dialogues: DialogueItem[];   // Part 1 style × 3
  monologue: MonologueItem;    // Part 2 style × 1
  realLife: RealLifeItem;      // Part 3 style × 1
  generatedAt: string;
}
