import { describe, expect, it } from 'vitest';
import { kanjiWords } from '../data/kanji';
import { buildKanjiTest, matchesKanjiAnswer } from './kanji-test';

const watashi = kanjiWords.find(word => word.word === '私')!;
const student = kanjiWords.find(word => word.word === '学生')!;
describe('selected kanji tests', () => {
  it('grades typed readings in kana or romaji while preserving spelling and contextual readings', () => {
    const question = buildKanjiTest([student.id], 'reading')[0];
    for (const answer of ['がくせい', 'ガクセイ', ' GAKUSEI ', 'ｶﾞｸｾｲ']) expect(matchesKanjiAnswer(question, answer)).toBe(true);
    for (const answer of ['', '学生', 'gakuse', 'gakkusei', 'watashi']) expect(matchesKanjiAnswer(question, answer)).toBe(false);
    const nan = buildKanjiTest(kanjiWords.filter(w => w.word === '何' && w.reading === 'なん').map(w => w.id), 'reading')[0];
    expect(matchesKanjiAnswer(nan, 'nan')).toBe(true);
    expect(matchesKanjiAnswer(nan, 'nani')).toBe(false);
  });
  it('accepts listed meaning alternatives and ignores case, without accepting partial words or usage notes', () => {
    const dislike = kanjiWords.find(w => w.word === '嫌い')!;
    const question = buildKanjiTest([dislike.id], 'meaning')[0];
    for (const answer of ['tidak suka', ' BENCI. ', dislike.meaning]) expect(matchesKanjiAnswer(question, answer)).toBe(true);
    for (const answer of ['', 'suka', 'ungkapan yang cukup kuat', 'benc']) expect(matchesKanjiAnswer(question, answer)).toBe(false);
  });
  it('tests exactly the chosen words and ignores duplicates and invalid identifiers', () => {
    const questions = buildKanjiTest([watashi.id, student.id, watashi.id, 'invalid'], 'reading');
    expect(questions).toHaveLength(2);
    expect(new Set(questions.map(q => q.word.id))).toEqual(new Set([watashi.id, student.id]));
    expect(questions.every(q => q.kind === 'reading')).toBe(true);
    expect(buildKanjiTest([], 'both')).toEqual([]);
  });
  it('builds both test kinds with exactly one correct and three distinct distractors', () => {
    const questions = buildKanjiTest(kanjiWords.map(w => w.id), 'both');
    expect(questions).toHaveLength(kanjiWords.length * 2);
    expect(new Set(questions.map(q => q.id)).size).toBe(questions.length);
    questions.forEach(q => {
      expect(q.answer).toBe(q.kind === 'reading' ? q.word.reading : q.word.meaning);
      expect(q.options.filter(option => option === q.answer)).toHaveLength(1);
      expect(new Set(q.options).size).toBe(4);
    });
  });
  it('keeps the context-dependent readings of nani and nan separate', () => {
    const questions = buildKanjiTest(kanjiWords.filter(w => w.word === '何').map(w => w.id), 'reading');
    expect(new Set(questions.map(q => q.answer))).toEqual(new Set(['なに', 'なん']));
    for (const question of questions) expect(question.options).not.toContain(question.answer === 'なん' ? 'なに' : 'なん');
  });
});
