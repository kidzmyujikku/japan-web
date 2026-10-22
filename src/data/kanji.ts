import { allVocabulary, lessons, plainJapanese } from './curriculum';
import type { Lesson, Vocabulary } from '../types';

export type StudyWord = Vocabulary;
export const hasKanji = (word: string) => /\p{Script=Han}/u.test(word);

// Words used in explanations, in addition to the six review words per lesson.
// Readings belong to whole words and their context, not to isolated characters.
const extraWords: [string, string, string, string][] = [
  ['来ました', 'きました', 'kimashita', 'datang (lampau sopan); dalam perkenalan: berasal dari'],
  ['何', 'なん', 'nan', 'apa; bacaan sebelum です dan dalam beberapa gabungan'],
  ['お父さん', 'おとうさん', 'otousan', 'ayah; sapaan atau saat menyebut ayah orang lain'],
  ['お母さん', 'おかあさん', 'okaasan', 'ibu; sapaan atau saat menyebut ibu orang lain'],
  ['お兄さん', 'おにいさん', 'oniisan', 'kakak laki-laki; sapaan atau kakak orang lain'],
  ['お姉さん', 'おねえさん', 'oneesan', 'kakak perempuan; sapaan atau kakak orang lain'],
  ['歳', 'さい', 'sai', 'penanda umur dalam tahun'],
  ['曲がって', 'まがって', 'magatte', 'belok (bentuk te)'],
  ['時', 'じ', 'ji', 'penanda jam'],
  ['半', 'はん', 'han', 'setengah; setelah jam: lewat tiga puluh menit'],
  ['一時', 'いちじ', 'ichiji', 'pukul satu'],
  ['二時', 'にじ', 'niji', 'pukul dua'],
  ['四時', 'よじ', 'yoji', 'pukul empat'],
  ['七時', 'しちじ', 'shichiji', 'pukul tujuh'],
  ['九時', 'くじ', 'kuji', 'pukul sembilan'],
  ['七時半', 'しちじはん', 'shichiji han', 'pukul setengah delapan (07.30 / 19.30)'],
  ['一日', 'ついたち', 'tsuitachi', 'tanggal satu; untuk durasi satu hari dibaca いちにち'],
  ['二日', 'ふつか', 'futsuka', 'tanggal dua / dua hari'],
  ['三日', 'みっか', 'mikka', 'tanggal tiga / tiga hari'],
  ['食べません', 'たべません', 'tabemasen', 'tidak makan (sopan)'],
  ['食べませんでした', 'たべませんでした', 'tabemasen deshita', 'tidak makan (lampau sopan)'],
  ['お願いします', 'おねがいします', 'onegaishimasu', 'tolong; ungkapan permintaan sopan'],
  ['好き', 'すき', 'suki', 'suka'],
  ['大好き', 'だいすき', 'daisuki', 'sangat suka'],
  ['嫌い', 'きらい', 'kirai', 'tidak suka / benci; ungkapan yang cukup kuat'],
  ['三百', 'さんびゃく', 'sanbyaku', 'tiga ratus'],
  ['六百', 'ろっぴゃく', 'roppyaku', 'enam ratus'],
  ['八百', 'はっぴゃく', 'happyaku', 'delapan ratus'],
  ['待ちます', 'まちます', 'machimasu', 'menunggu (sopan)'],
  ['行って', 'いって', 'itte', 'pergi (bentuk te)'],
  ['少し', 'すこし', 'sukoshi', 'sedikit / sebentar'],
  ['食べませんか', 'たべませんか', 'tabemasen ka', 'mau makan?; ajakan dalam materi ini'],
  ['行きましょう', 'いきましょう', 'ikimashou', 'ayo pergi'],
  ['朝', 'あさ', 'asa', 'pagi'],
  ['おはようございます', 'おはようございます', 'ohayou gozaimasu', 'selamat pagi (sopan)'],
  ['おねがいします', 'おねがいします', 'onegaishimasu', 'tolong; ungkapan permintaan sopan'],
  ['はじめまして', 'はじめまして', 'hajimemashite', 'salam saat pertama kali berkenalan'],
  ['よろしくおねがいします', 'よろしくおねがいします', 'yoroshiku onegaishimasu', 'ungkapan penutup perkenalan; mohon hubungan yang baik'],
  ['インドネシア', 'いんどねしあ', 'Indoneshia', 'Indonesia'],
  ['あります', 'あります', 'arimasu', 'ada; untuk benda dan tumbuhan'],
  ['います', 'います', 'imasu', 'ada; untuk orang dan hewan'],
  ['ここ', 'ここ', 'koko', 'di sini'],
  ['そこ', 'そこ', 'soko', 'di situ, dekat lawan bicara'],
  ['あそこ', 'あそこ', 'asoko', 'di sana, jauh dari keduanya'],
  ['ください', 'ください', 'kudasai', 'tolong beri; setelah bentuk te: tolong lakukan'],
  ['この', 'この', 'kono', 'ini; harus diikuti kata benda'],
  ['その', 'その', 'sono', 'itu; harus diikuti kata benda'],
  ['あの', 'あの', 'ano', 'itu di sana; harus diikuti kata benda'],
  ['いい', 'いい', 'ii', 'baik / bagus'],
  ['きれい', 'きれい', 'kirei', 'cantik / bersih (kata sifat-na)'],
];

const wordKey = (word: string, reading: string) => `${word}:${reading}`;
export const glossary: StudyWord[] = Array.from(new Map([
  ...allVocabulary.map(({ word, reading, romaji, meaning }) => [wordKey(word, reading), { id: `kanji:${wordKey(word, reading)}`, word, reading, romaji, meaning }] as const),
  ...extraWords.map(([word, reading, romaji, meaning]) => [wordKey(word, reading), { id: `kanji:${wordKey(word, reading)}`, word, reading, romaji, meaning }] as const),
]).values());
export const kanjiWords = glossary.filter(word => hasKanji(word.word));
export const kanjiById = new Map(kanjiWords.map(word => [word.id, word]));
const orderedWords = [...glossary].sort((a, b) => b.word.length - a.word.length);

export type WordChunk = { text: string; entry?: StudyWord };
export function wordChunks(text: string): WordChunk[] {
  const plain = plainJapanese(text);
  const hints = new Map<number, string>();
  for (const match of text.matchAll(/([\p{Script=Han}々ヶ]+[ぁ-ゖァ-ヺー]*)\{([^}]+)\}/gu)) {
    hints.set(plainJapanese(text.slice(0, match.index)).length, match[2]);
  }
  const chunks: WordChunk[] = [];
  let index = 0;
  while (index < plain.length) {
    const candidates = orderedWords.filter(word => plain.startsWith(word.word, index));
    const longest = candidates[0]?.word;
    const hint = hints.get(index) ?? (longest === '何' && plain.slice(index + 1).startsWith('です') ? 'なん' : undefined);
    const entry = candidates.find(word => word.word === longest && (!hint || word.reading.startsWith(hint))) ?? candidates[0];
    if (entry) { chunks.push({ text: entry.word, entry }); index += entry.word.length; }
    else {
      const previous = chunks.at(-1);
      if (previous && !previous.entry) previous.text += plain[index];
      else chunks.push({ text: plain[index] });
      index++;
    }
  }
  return chunks;
}

export function wordsInText(text: string) {
  return Array.from(new Map(wordChunks(text).flatMap(chunk => chunk.entry ? [[chunk.entry.id, chunk.entry] as const] : [])).values());
}

export function lessonText(lesson: Lesson) {
  return [lesson.goal, ...lesson.concepts.flatMap(c => [c.title, c.text]), lesson.tip,
    ...lesson.vocabulary.map(w => w.word), ...lesson.examples.flatMap(e => [e.japanese, e.note])].join('\n');
}
const lessonWordCache = new Map(lessons.map(lesson => [lesson.id, wordsInText(lessonText(lesson))]));
export const wordsForLesson = (lesson: Lesson) => lessonWordCache.get(lesson.id) ?? wordsInText(lessonText(lesson));
export const lessonsForWord = (word: StudyWord) => lessons.filter(lesson => wordsForLesson(lesson).some(w => w.id === word.id));

export function recallContext(word: StudyWord) {
  if (word.word === '何') return word.reading === 'なん' ? '何ですか。' : '何が好きですか。';
  return undefined;
}

export function lessonPreparation(lesson: Lesson) {
  const known = new Set(lessons.slice(0, lesson.index).flatMap(l => wordsForLesson(l).map(w => w.id)));
  const words = wordsInText(lesson.concepts.map(c => c.text).join('\n')).filter(w => !known.has(w.id));
  return (words.length ? words : lesson.vocabulary).slice(0, 6);
}

export function conceptPreparation(lesson: Lesson, conceptIndex: number) {
  const known = new Set([
    ...lessons.slice(0, lesson.index).flatMap(l => wordsForLesson(l).map(w => w.id)),
    ...lessonPreparation(lesson).map(w => w.id),
    ...lesson.concepts.slice(0, conceptIndex).flatMap(c => wordsInText(c.text).map(w => w.id)),
  ]);
  return wordsInText(lesson.concepts[conceptIndex].text).filter(w => !known.has(w.id));
}

export function examplePreparation(lesson: Lesson) {
  const known = new Set([
    ...lessons.slice(0, lesson.index).flatMap(l => wordsForLesson(l).map(w => w.id)),
    ...lessonPreparation(lesson).map(w => w.id),
    ...lesson.concepts.flatMap(c => wordsInText(c.text).map(w => w.id)),
  ]);
  return wordsInText(lesson.examples.map(e => e.japanese).join('\n')).filter(w => !known.has(w.id));
}
