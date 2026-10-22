export type Vocabulary = { id: string; word: string; reading: string; romaji: string; meaning: string };
export type Example = { japanese: string; romaji: string; meaning: string; tokens: string[]; note: string };
export type Question =
  | { id: string; type: 'choice'; prompt: string; japanese: string; options: string[]; answer: string; explanation: string }
  | { id: string; type: 'match'; prompt: string; pairs: { left: string; right: string }[]; explanation: string }
  | { id: string; type: 'order'; prompt: string; tokens: string[]; answer: string[]; explanation: string }
  | { id: string; type: 'type'; prompt: string; answers: string[]; script: 'hiragana' | 'katakana'; explanation: string };
export type Lesson = {
  id: string; index: number; group: number; title: string; subtitle: string; goal: string;
  concepts: { title: string; text: string }[]; tip: string; vocabulary: Vocabulary[];
  examples: Example[]; questions: Question[];
};
export type Settings = { mode: 'explore' | 'challenge'; furigana: boolean; romaji: boolean; timer: number; autoKana: boolean };
export type AttemptAnswer = { questionId: string; correct: boolean; response: string; explanation: string; prompt: string };
export type Attempt = { id: string; lessonId: string; score: number; answers: AttemptAnswer[]; date: string; at: number; timer: number };
export type ReviewState = { step: number; due: string; lastAt: number };
export type Progress = {
  lessons: Record<string, { studied: boolean; best: number }>;
  reviews: Record<string, ReviewState>;
  days: Record<string, { quiz: boolean; reviews: number }>;
  settings: Settings;
  settingsAt: number;
  recentEvents: string[];
};
export type LearningEvent =
  | { id: string; type: 'kanji-save'; cardId: string; date: string; at: number }
  | { id: string; type: 'study'; lessonId: string; date: string; at: number }
  | { id: string; type: 'quiz'; attempt: Attempt; at: number }
  | { id: string; type: 'review'; cardId: string; remembered: boolean; date: string; at: number }
  | { id: string; type: 'settings'; settings: Settings; at: number };
