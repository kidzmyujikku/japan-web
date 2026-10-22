import type { Lesson, Question } from '../types';

export type PracticeWord = { word: string; reading: string };
const han = /\p{Script=Han}/u;
const ruby = /([\p{Script=Han}々ヶ]+[ぁ-ゖァ-ヺー]*)\{([^}]+)\}/gu;

// Only spellings introduced by the selected lesson or earlier lessons are eligible.
export function practiceWords(lessons: Lesson[], index: number): PracticeWord[] {
  const words = new Map<string, PracticeWord>();
  for (const lesson of lessons.filter(l => l.index <= index)) {
    for (const word of lesson.vocabulary) if (han.test(word.word)) words.set(`${word.word}:${word.reading}`, word);
    const texts = [lesson.goal, lesson.tip, ...lesson.concepts.flatMap(c => [c.title, c.text]), ...lesson.examples.flatMap(e => [e.japanese, e.note])];
    for (const text of texts) for (const match of text.matchAll(ruby)) words.set(`${match[1]}:${match[2]}`, { word: match[1], reading: match[2] });
  }
  return [...words.values()].sort((a, b) => b.word.length - a.word.length);
}

export const practiceReading = (text: string) => text.replace(ruby, '$2');
export const practicePlain = (text: string) => text.replace(ruby, '$1');

export function practiceWriting(text: string, words: PracticeWord[], convertWholeWord = false) {
  if (convertWholeWord && !han.test(text)) {
    const candidates = words.filter(w => w.reading === text);
    if (new Set(candidates.map(w => w.word)).size === 1) text = candidates[0].word;
  }
  const chunks = text.split(/([\p{Script=Han}々ヶ]+[ぁ-ゖァ-ヺー]*\{[^}]+\})/gu);
  return chunks.map(chunk => {
    if (/\{[^}]+\}$/u.test(chunk)) return chunk;
    let output = '';
    for (let i = 0; i < chunk.length;) {
      const matches = words.filter(w => chunk.startsWith(w.word, i));
      const longest = matches[0]?.word;
      const candidates = matches.filter(w => w.word === longest);
      const contextual = longest === '何' && chunk.slice(i + 1).startsWith('です') ? candidates.find(w => w.reading === 'なん') : undefined;
      const word = contextual ?? (new Set(candidates.map(w => w.reading)).size === 1 ? candidates[0] : undefined);
      if (word) { output += `${word.word}{${word.reading}}`; i += word.word.length; }
      else { output += chunk[i]; i++; }
    }
    return output;
  }).join('');
}

export function hasUnlearnedKanji(text: string, words: PracticeWord[]) {
  for (const match of text.matchAll(ruby)) {
    if (!words.some(word => word.word === match[1] && word.reading === match[2])) return true;
  }
  let remaining = practicePlain(text);
  for (const word of words) remaining = remaining.replaceAll(word.word, '');
  return han.test(remaining);
}

export function practiceQuestionWriting<T extends Question>(question: T, words: PracticeWord[]): T {
  const write = (text: string) => practiceWriting(text, words, true);
  const base = { ...question, prompt: practiceWriting(question.prompt, words), explanation: practiceWriting(question.explanation, words) };
  if (question.type === 'choice') return { ...base, japanese: write(question.japanese), options: question.options.map(write), answer: write(question.answer) } as T;
  if (question.type === 'order') return { ...base, tokens: question.tokens.map(write), answer: question.answer.map(write) } as T;
  if (question.type === 'match') return { ...base, pairs: question.pairs.map(p => ({ ...p, left: write(p.left) })) } as T;
  return base as T;
}
