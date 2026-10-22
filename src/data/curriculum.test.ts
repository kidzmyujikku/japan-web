import { describe, expect, it } from 'vitest';
import { allVocabulary, groups, lessons, plainJapanese } from './curriculum';
import { isCorrect } from '../lib/learning';

describe('complete curriculum', () => {
  it('contains six groups of four lessons and 240 uniquely identified questions', () => {
    expect(lessons).toHaveLength(24);
    groups.forEach((_,group) => expect(lessons.filter(l => l.group === group)).toHaveLength(4));
    const questions = lessons.flatMap(l => l.questions);
    expect(questions).toHaveLength(240);
    expect(new Set(questions.map(q => q.id)).size).toBe(240);
    expect(new Set(allVocabulary.map(w => w.id)).size).toBe(144);
  });
  it.each(lessons)('$id has actual content, four quiz types, and valid answer keys', lesson => {
    expect(lesson.concepts.length).toBeGreaterThanOrEqual(2);
    expect(lesson.vocabulary).toHaveLength(6);
    expect(lesson.examples).toHaveLength(2);
    expect(lesson.questions).toHaveLength(10);
    expect(new Set(lesson.questions.map(q => q.type)).size).toBe(4);
    lesson.concepts.forEach(c => expect(c.text.length).toBeGreaterThan(100));
    lesson.questions.forEach(q => {
      expect(q.explanation.length).toBeGreaterThan(10);
      if (q.type === 'choice') { expect(q.options).toContain(q.answer); expect(new Set(q.options).size).toBe(4); expect(isCorrect(q,q.answer)).toBe(true); }
      if (q.type === 'match') { expect(new Set(q.pairs.map(p => p.right)).size).toBe(q.pairs.length); expect(isCorrect(q,q.pairs.map(p => p.right))).toBe(true); }
      if (q.type === 'order') expect(isCorrect(q,q.answer)).toBe(true);
      if (q.type === 'type') q.answers.forEach(a => expect(isCorrect(q,a)).toBe(true));
    });
    lesson.examples.forEach(ex => expect(ex.tokens.join('')).toBe(plainJapanese(ex.japanese).replace(/[、。]/g,'')));
  });
});
