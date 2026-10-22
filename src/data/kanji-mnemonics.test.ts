import { describe, expect, it } from 'vitest';
import { kanjiWords } from './kanji';
import { kanjiMnemonics, mnemonicsForWord } from './kanji-mnemonics';

describe('visual mnemonic coverage', () => {
  it('provides a specific visual story for every character in the kanji collection', () => {
    const characters = new Set(kanjiWords.flatMap(w => w.word.match(/\p{Script=Han}/gu) ?? []));
    const missing = [...characters].filter(character => !kanjiMnemonics.has(character));
    expect(missing).toEqual([]);
    for (const character of characters) {
      const mnemonic = kanjiMnemonics.get(character)!;
      expect(mnemonic.parts.length).toBeGreaterThan(0);
      expect(mnemonic.parts.length).toBeLessThanOrEqual(2);
      expect(mnemonic.story.length).toBeGreaterThan(40);
      expect(mnemonic.keyword.length).toBeGreaterThan(0);
    }
  });
  it('keeps word character order, skips kana, and reuses a character across words', () => {
    expect(mnemonicsForWord('学生').map(m => m.kanji)).toEqual(['学', '生']);
    expect(mnemonicsForWord('食べました').map(m => m.kanji)).toEqual(['食']);
    expect(mnemonicsForWord('こんにちは')).toEqual([]);
    expect(mnemonicsForWord('日日')).toHaveLength(1);
    expect(mnemonicsForWord('学ぶ')[0]).toBe(mnemonicsForWord('学校')[0]);
  });
});
