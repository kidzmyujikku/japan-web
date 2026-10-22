import { toHiragana } from 'wanakana';
import { lessons } from '../data/curriculum';
import { kanjiById } from '../data/kanji';
import type { LearningEvent, Progress, Question, Settings } from '../types';

export const defaultSettings: Settings = { mode: 'explore', furigana: true, romaji: false, timer: 0, autoKana: true };
export const emptyProgress = (): Progress => ({ lessons: {}, reviews: {}, days: {}, settings: { ...defaultSettings }, settingsAt: 0, recentEvents: [] });
export function jakartaDate(at = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(at);
  const get = (type: string) => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export const normalizeAnswer = (value: string) => value.normalize('NFKC').trim();
export function isCorrect(question: Question, answer: string | string[]) {
  if (question.type === 'choice') return answer === question.answer;
  if (question.type === 'type') return typeof answer === 'string' && question.answers.some(a => normalizeAnswer(a) === normalizeAnswer(answer));
  if (question.type === 'order') return Array.isArray(answer) && JSON.stringify(answer) === JSON.stringify(question.answer);
  return Array.isArray(answer) && answer.length === question.pairs.length && question.pairs.every((pair, i) => pair.right === answer[i]);
}
export const kanaForScript = (value: string, script: 'hiragana' | 'katakana') => script === 'hiragana' ? toHiragana(value) : value;

export function applyEvent(original: Progress, event: LearningEvent): Progress {
  if (original.recentEvents.includes(event.id)) return original;
  const state = structuredClone(original);
  state.recentEvents = [...state.recentEvents, event.id].slice(-256);
  if (event.type === 'settings') {
    if (event.at >= state.settingsAt) { state.settings = event.settings; state.settingsAt = event.at; }
    return state;
  }
  if (event.type === 'kanji-save') {
    // Retain compatibility with pending events from the former saved-card UI.
    if (!kanjiById.has(event.cardId)) return original;
    state.reviews[event.cardId] ??= { step: -1, due: event.date, lastAt: event.at };
    return state;
  }
  if (event.type === 'review') {
    const previous = state.reviews[event.cardId];
    if (previous && event.at >= previous.lastAt) {
      const step = event.remembered ? Math.min(previous.step + 1, 4) : 0;
      state.reviews[event.cardId] = { step, due: addDays(event.date, [1, 3, 7, 14, 30][step]), lastAt: event.at };
    }
    const day = state.days[event.date] ?? { quiz: false, reviews: 0 };
    state.days[event.date] = { ...day, reviews: day.reviews + 1 };
    return state;
  }
  const lessonId = event.type === 'study' ? event.lessonId : event.attempt.lessonId;
  const date = event.type === 'study' ? event.date : event.attempt.date;
  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson) return original;
  const current = state.lessons[lessonId] ?? { studied: false, best: 0 };
  state.lessons[lessonId] = event.type === 'study' ? { ...current, studied: true } : { ...current, best: Math.max(current.best, event.attempt.score) };
  lesson.vocabulary.forEach(word => {
    state.reviews[word.id] ??= { step: -1, due: date, lastAt: event.at };
  });
  if (event.type === 'quiz') {
    const day = state.days[date] ?? { quiz: false, reviews: 0 };
    state.days[date] = { ...day, quiz: true };
  }
  return state;
}
export const unlocked = (state: Progress, index: number) => state.settings.mode === 'explore' || lessons.slice(0, index).every(l => (state.lessons[l.id]?.best ?? 0) >= 80);
export const earnedPoints = (state: Progress) => Object.values(state.lessons).reduce((sum, l) => sum + (l.studied ? 10 : 0) + (l.best >= 80 ? 20 : 0), 0) + Object.values(state.days).filter(d => d.reviews >= 5).length * 5;
export function streak(state: Progress, today = jakartaDate()) {
  const active = (date: string) => Boolean(state.days[date]?.quiz || (state.days[date]?.reviews ?? 0) >= 5);
  let date = active(today) ? today : addDays(today, -1);
  let total = 0;
  while (active(date)) { total++; date = addDays(date, -1); }
  return total;
}
export function achievements(state: Progress) {
  const studied = Object.values(state.lessons).filter(l => l.studied).length;
  const passed = Object.values(state.lessons).filter(l => l.best >= 80).length;
  const dates = Object.keys(state.days).sort();
  let bestStreak = 0, run = 0, previous = '';
  for (const date of dates) {
    const day = state.days[date];
    if (!day.quiz && day.reviews < 5) continue;
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run); previous = date;
  }
  return [
    { title: 'Langkah pertama', description: 'Selesaikan satu pelajaran', earned: studied >= 1 },
    { title: 'Mulai percaya diri', description: 'Lulus lima kuis', earned: passed >= 5 },
    { title: 'Jaga ritmenya', description: 'Belajar tiga hari berturut-turut', earned: bestStreak >= 3 },
    { title: 'Fondasi yang kuat', description: 'Lulus semua 24 kuis', earned: passed >= 24 },
  ];
}
export const remainingSeconds = (deadline: number, now = Date.now()) => Math.max(0, Math.ceil((deadline - now) / 1000));
