import type { AttemptAnswer, Question } from '../types';
import { practicePlain, practiceReading } from './practice-writing.ts';

export type PracticeQuestion = Question & { hint: string; focus: string };
export type PracticeSet = { id: string; lessonId: string; level: 'basic' | 'apply'; questions: PracticeQuestion[]; createdAt: number };
export type PracticeSession = PracticeSet & { answers: AttemptAnswer[] };
export type SeenQuestion = { type: string; prompt: string; content: string; signature: string };

const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const strings = (value: unknown, min: number, max: number, length: number): value is string[] => Array.isArray(value) && value.length >= min && value.length <= max && value.every(s => text(s, length));
const unique = (values: string[]) => new Set(values.map(v => practicePlain(v).normalize('NFKC').trim())).size === values.length;
const sorted = (values: string[]) => [...values].sort().join('\u0001');
const kana = (value: string) => /^[\p{Script=Hiragana}\p{Script=Katakana}ー\s・。、？！?!]+$/u.test(value);

export function isPracticeQuestion(value: unknown): value is PracticeQuestion {
  if (!value || typeof value !== 'object') return false;
  const q = value as PracticeQuestion;
  if (!text(q.id, 100) || !text(q.prompt, 360) || !text(q.explanation, 850) || !text(q.hint, 300) || !text(q.focus, 100)) return false;
  if (q.type === 'choice') return text(q.japanese, 240) && strings(q.options, 4, 4, 180) && unique(q.options) && q.options.includes(q.answer);
  if (q.type === 'type') return ['hiragana', 'katakana'].includes(q.script) && strings(q.answers, 1, 6, 180) && unique(q.answers) && q.answers.every(a => kana(a) && !(q.script === 'hiragana' ? /[ァ-ヺ]/u : /[ぁ-ゖ]/u).test(a));
  if (q.type === 'order') return strings(q.tokens, 2, 10, 90) && strings(q.answer, 2, 10, 90) && sorted(q.tokens) === sorted(q.answer);
  if (q.type === 'match') return Array.isArray(q.pairs) && q.pairs.length === 3 && q.pairs.every(p => p && text(p.left, 100) && text(p.right, 150)) && unique(q.pairs.map(p => p.left)) && unique(q.pairs.map(p => p.right));
  return false;
}

// Fingerprints ignore answer ordering and punctuation, so a shuffled copy is still a repeat.
export function describeQuestion(q: Question): SeenQuestion {
  const content = q.type === 'choice' ? practiceReading(q.japanese) : q.type === 'type' ? sorted(q.answers) : q.type === 'order' ? sorted(q.tokens.map(practiceReading)) : sorted(q.pairs.map(p => `${practiceReading(p.left)}:${p.right}`));
  const core = practiceReading(content).normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  return { type: q.type, prompt: q.prompt, content: content.slice(0, 800), signature: `${q.type}:${core}` };
}

export function solution(q: Question) {
  return q.type === 'choice' ? q.answer : q.type === 'type' ? q.answers.join(' / ') : q.type === 'order' ? q.answer.join('') : q.pairs.map(p => `${p.left} → ${p.right}`).join('; ');
}

export function isPracticeSet(value: unknown): value is PracticeSet {
  if (!value || typeof value !== 'object') return false;
  const s = value as PracticeSet;
  return text(s.id, 100) && text(s.lessonId, 80) && ['basic', 'apply'].includes(s.level) && Number.isFinite(s.createdAt) && Array.isArray(s.questions) && [5, 10].includes(s.questions.length) && s.questions.every(isPracticeQuestion) && unique(s.questions.map(q => q.id));
}

export function isPracticeSession(value: unknown): value is PracticeSession {
  if (!isPracticeSet(value)) return false;
  const s = value as PracticeSession;
  return Array.isArray(s.answers) && s.answers.length <= s.questions.length && s.answers.every((a, i) => a && a.questionId === s.questions[i].id && typeof a.correct === 'boolean' && text(a.prompt, 650) && typeof a.response === 'string' && a.response.length <= 2000 && text(a.explanation, 2000));
}
