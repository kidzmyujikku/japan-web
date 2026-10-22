import { kanjiById, kanjiWords } from '../data/kanji';
import type { StudyWord } from '../data/kanji';
import { toHiragana } from 'wanakana';

export type KanjiTestMode = 'reading' | 'meaning' | 'both';
export type KanjiTestFormat = 'choice' | 'typed';
export type KanjiTestQuestion = { id: string; word: StudyWord; kind: 'reading' | 'meaning'; options: string[]; answer: string };
export type KanjiTestResult = { question: KanjiTestQuestion; response: string; correct: boolean; timedOut?: boolean };

const normalizeText = (text: string) => text.normalize('NFKC').trim().toLocaleLowerCase('id').replace(/\s+/gu, ' ').replace(/[.!。]+$/u, '');
export function matchesKanjiAnswer(question: KanjiTestQuestion, response: string) {
  const value = normalizeText(response);
  if (!value) return false;
  if (question.kind === 'reading') {
    const compact = (text: string) => text.replace(/\s+/gu, '');
    return compact(value) === compact(normalizeText(question.word.romaji))
      || compact(toHiragana(value)) === compact(toHiragana(question.answer.normalize('NFKC')));
  }
  // Accept listed meanings, without treating usage notes as synonyms or using fuzzy matching.
  const meanings = question.answer.split(';')[0].replace(/\([^)]*\)/gu, '').split('/').map(normalizeText).filter(Boolean);
  return value === normalizeText(question.answer) || meanings.includes(value);
}

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildKanjiTest(ids: Iterable<string>, mode: KanjiTestMode): KanjiTestQuestion[] {
  const words = Array.from(new Set(ids)).flatMap(id => { const word = kanjiById.get(id); return word ? [word] : []; });
  const kinds = mode === 'both' ? ['reading', 'meaning'] as const : [mode];
  const questions = words.flatMap(word => kinds.map(kind => {
    const field = kind === 'reading' ? 'reading' : 'meaning';
    const answer = word[field];
    const distractors = Array.from(new Set(kanjiWords.filter(other => other.word !== word.word).map(other => other[field])))
      .filter(value => value !== answer);
    return { id: `${word.id}:${kind}`, word, kind, answer, options: shuffle([answer, ...shuffle(distractors).slice(0, 3)]) };
  }));
  return shuffle(questions);
}
