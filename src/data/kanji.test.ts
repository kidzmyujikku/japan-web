import { describe, expect, it } from 'vitest';
import { lessons, plainJapanese } from './curriculum';
import { conceptPreparation, kanjiWords, lessonPreparation, lessonText, recallContext, wordChunks } from './kanji';

describe('kanji reading and curriculum coverage', () => {
  it.each(lessons)('$id has help for every kanji in its material and vocabulary', lesson => {
    const chunks = wordChunks(lessonText(lesson));
    const uncovered = chunks.filter(chunk => !chunk.entry && /\p{Script=Han}/u.test(chunk.text));
    expect(uncovered.map(c => c.text)).toEqual([]);
    expect(chunks.map(c => c.text).join('')).toBe(plainJapanese(lessonText(lesson)));
    expect(lessonPreparation(lesson).length).toBeLessThanOrEqual(6);
  });
  it('keeps contextual readings and conjugated words intact', () => {
    expect(wordChunks('何{なん}ですか。何{なに}が好{す}きですか。').flatMap(c => c.entry?.reading ?? [])).toEqual(['なん', 'なに', 'すき']);
    expect(wordChunks('食{た}べませんか。来{き}ました。').flatMap(c => c.entry?.word ?? [])).toEqual(['食べませんか', '来ました']);
    expect(wordChunks('七時{しちじ}半').map(c => c.entry?.reading)).toEqual(['しちじはん']);
    expect(wordChunks('何ですか。').find(c => c.entry)?.entry?.reading).toBe('なん');
    expect(kanjiWords.filter(w => w.word === '何').map(recallContext)).toEqual(['何が好きですか。', '何ですか。']);
  });
  it('introduces watashi and kimashita before the first self-introduction explanation', () => {
    const prep = lessonPreparation(lessons[4]);
    expect(prep.map(w => w.word)).toContain('私');
    expect(prep.map(w => w.word)).toContain('来ました');
  });
  it('introduces additional words before their concept if the opening is full', () => {
    const lesson = lessons[12];
    const introduced = [...lessonPreparation(lesson), ...lesson.concepts.flatMap((_, i) => conceptPreparation(lesson, i))];
    expect(introduced.map(w => w.word)).toContain('一日');
    expect(introduced.map(w => w.word)).toContain('九時');
  });
  it('deduplicates cards across lessons while retaining different readings', () => {
    expect(kanjiWords.filter(w => w.word === '日本語')).toHaveLength(1);
    expect(kanjiWords.filter(w => w.word === '何').map(w => w.reading).sort()).toEqual(['なに', 'なん']);
    expect(new Set(kanjiWords.map(w => w.id)).size).toBe(kanjiWords.length);
  });
});
