import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ListChecks, Check, X } from 'lucide-react';
import { lessonsForWord, recallContext, wordsInText } from '../data/kanji';
import type { StudyWord } from '../data/kanji';
import type { Lesson } from '../types';
import { RubyText } from './Shared';
import KanjiMnemonics from './KanjiMnemonics';

export function KanjiInfo({ entry, lesson, selectedForTest = false, onToggleTest }: { entry: StudyWord; lesson?: Lesson; selectedForTest?: boolean; onToggleTest?: () => void }) {
  const sources = lessonsForWord(entry);
  const example = [lesson, ...sources].filter((l): l is Lesson => Boolean(l)).flatMap(l => l.examples)
    .find(e => wordsInText(e.japanese).some(w => w.id === entry.id));
  return <div className="kanji-info">
    <p className="eyebrow">KENALI KANJI LEWAT KATA</p>
    <h2 lang="ja">{entry.word}</h2>
    <p className="kanji-reading" lang="ja">{entry.reading} <span>{entry.romaji}</span></p>
    <p className="kanji-meaning">{entry.meaning}</p>
    {recallContext(entry) && <p className="kanji-reading-context">Dalam pola: <span lang="ja">{recallContext(entry)}</span></p>}
    <p className="small-note">Bacaan ini berlaku untuk kata ini. Kanji yang sama bisa memiliki bacaan lain dalam kata berbeda.</p>
    <KanjiMnemonics key={entry.id} word={entry.word}/>
    {example && <div className="kanji-context"><strong>Dalam kalimat</strong><p lang="ja"><RubyText text={example.japanese} furigana/></p><p>{example.meaning}</p></div>}
    {onToggleTest ? <button type="button" className={`button ${selectedForTest ? 'button-outline' : 'button-dark'}`} aria-pressed={selectedForTest} onClick={onToggleTest}>{selectedForTest ? <Check size={18}/> : <ListChecks size={18}/>} {selectedForTest ? 'Batalkan pilihan tes' : 'Pilih untuk tes'}</button> : <Link className="button button-dark" to={`/kanji?kata=${encodeURIComponent(entry.id)}${lesson ? `&materi=${lesson.id}` : ''}`}><ListChecks size={18}/>Pilih untuk tes</Link>}
    {sources.length > 0 && <p className="small-note kanji-sources">Ada di {sources.slice(0, 3).map((source, i) => <span key={source.id}>{i > 0 && ', '}<Link to={`/materi/${source.id}`}>materi {source.index + 1}</Link></span>)}{sources.length > 3 && ` dan ${sources.length - 3} materi lainnya`}.</p>}
  </div>;
}

export function KanjiDialog({ entry, lesson, onClose }: { entry: StudyWord; lesson: Lesson; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const originalOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = originalOverflow; };
  }, []);
  return createPortal(<dialog ref={ref} className="kanji-dialog" aria-label={`Bacaan dan arti ${entry.word}`} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <button type="button" autoFocus className="icon-button kanji-close" aria-label="Tutup bantuan kanji" onClick={onClose}><X size={20}/></button>
    <KanjiInfo entry={entry} lesson={lesson}/>
  </dialog>, document.body);
}
