import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, Lightbulb, LockKeyhole } from 'lucide-react';
import { toHiragana, toKatakana } from 'wanakana';
import { groups, kanaRows, lessons } from '../data/curriculum';
import { jakartaDate, unlocked } from '../lib/learning';
import { useLearning } from '../store';
import { Breadcrumb, RubyText } from '../components/Shared';
import { KanjiDialog } from '../components/KanjiHelp';
import { conceptPreparation, examplePreparation, hasKanji, lessonPreparation } from '../data/kanji';
import type { StudyWord } from '../data/kanji';


export default function LessonPage() {
  const { id } = useParams();
  return <LessonContent key={id} id={id}/>;
}
function LessonContent({ id }: { id?: string }) {
  const lesson = lessons.find(l => l.id === id);
  const { progress, send, setSettings } = useLearning();
  const navigate = useNavigate();
  const [practice, setPractice] = useState('');
  const [checked, setChecked] = useState(false);
  const [selectedWord, setSelectedWord] = useState<StudyWord | null>(null);
  if (!lesson) return <div className="container empty-state"><h1>Materi tidak ditemukan.</h1><Link className="button button-dark" to="/materi">Kembali ke materi</Link></div>;
  if (!unlocked(progress, lesson.index)) return <div className="container empty-state"><LockKeyhole size={36}/><h1>Satu langkah sebelumnya dulu.</h1><p>Lulus kuis sebelumnya dengan nilai minimal 80%, atau gunakan mode eksplorasi.</p><button className="button button-dark" onClick={() => setSettings({ ...progress.settings, mode: 'explore' })}>Beralih ke eksplorasi</button><Link className="text-link" to="/materi">Kembali ke materi</Link></div>;
  const studied = Boolean(progress.lessons[lesson.id]?.studied);
  const markStudied = () => send({ id: crypto.randomUUID(), type: 'study', lessonId: lesson.id, at: Date.now(), date: jakartaDate() });
  const quickQuestion = lesson.questions[0];
  return <div className="container page-shell lesson-page">
    <Breadcrumb label={lesson.title}/>
    <div className="lesson-heading"><span className={`lesson-heading-glyph color-${groups[lesson.group].color}`} lang="ja">{groups[lesson.group].kana}</span><p className="eyebrow">{groups[lesson.group].name}</p><h1>{lesson.title}</h1><p>{lesson.subtitle}</p></div>
    <div className="lesson-toolbar"><span>Pelajaran {lesson.index + 1} dari 24</span><div><button aria-pressed={progress.settings.furigana} onClick={() => setSettings({ ...progress.settings, furigana: !progress.settings.furigana })}>Furigana {progress.settings.furigana ? 'aktif' : 'mati'}</button><button aria-pressed={progress.settings.romaji} onClick={() => setSettings({ ...progress.settings, romaji: !progress.settings.romaji })}>Romaji {progress.settings.romaji ? 'aktif' : 'mati'}</button><Link className="lesson-tutor-link" to={`/latihan?materi=${lesson.id}`}>Latihan baru</Link></div></div>
    <div className="reading-column"><div className="learning-goal"><BookOpenCheck size={25}/><div><strong>Setelah ini, kamu bisa…</strong><p><RubyText text={lesson.goal} onWordClick={setSelectedWord}/></p></div></div>
      {lesson.index < 2 && <section className="lesson-section"><h2>Peta bunyimu</h2><p>Baca per baris, lalu coba temukan kana pada kosakata di bawah.</p><div className="kana-table" aria-label={`Tabel ${lesson.index === 0 ? 'hiragana' : 'katakana'}`}>{kanaRows.flatMap((row,r) => row.map((romaji,c) => <div key={`${r}-${c}`} className={!romaji ? 'blank' : ''}>{romaji && <><span lang="ja">{lesson.index === 0 ? toHiragana(romaji) : toKatakana(romaji)}</span><small>{romaji}</small></>}</div>))}</div></section>}
      <section className="lesson-section lesson-preparation"><p className="eyebrow">BEKAL SEBELUM MULAI</p><h2>Kenali kata-katanya dulu.</h2><p>Cukup kenali bacaan dan artinya; kamu akan memakainya di bawah.</p><PreparationWords words={lessonPreparation(lesson)} onSelect={setSelectedWord}/>{lesson.index >= 4 && <p className="small-note">Ketuk kata berkanji yang bergaris bawah untuk melihat arti, mnemonik, dan memilihnya untuk tes. <Link to={`/kanji?materi=${lesson.id}`}>Jelajahi kanji materi ini →</Link></p>}</section>
      {lesson.concepts.map((concept, index) => <section className="lesson-section" key={concept.title}><h2><RubyText text={concept.title} onWordClick={setSelectedWord}/></h2>{conceptPreparation(lesson, index).length > 0 && <div className="concept-preparation"><p className="small-note">Kata tambahan untuk bagian ini</p><PreparationWords words={conceptPreparation(lesson, index)} onSelect={setSelectedWord}/></div>}<p><RubyText text={concept.text} onWordClick={setSelectedWord}/></p></section>)}
      <aside className="learning-tip"><Lightbulb size={22}/><div><strong>Simpan pengingat ini</strong><p><RubyText text={lesson.tip} onWordClick={setSelectedWord}/></p></div></aside>
      <section className="lesson-section"><h2>Lihat kata-katanya bekerja.</h2>{examplePreparation(lesson).length > 0 && <div className="concept-preparation"><p className="small-note">Kenali kata baru dalam contoh ini</p><PreparationWords words={examplePreparation(lesson)} onSelect={setSelectedWord}/></div>}{lesson.examples.map(example => <article className="example-box" key={example.japanese}><p className="example-japanese" lang="ja"><RubyText text={example.japanese} onWordClick={setSelectedWord}/></p>{progress.settings.romaji && <p className="romaji">{example.romaji}</p>}<p>{example.meaning}</p><small><RubyText text={example.note} onWordClick={setSelectedWord}/></small></article>)}</section>
      <section className="lesson-section"><h2>Kata untuk dibawa pulang.</h2><p>Rangkum enam kata ini. Semuanya akan masuk ke pengulanganmu setelah materi selesai.</p><div className="vocabulary-list">{lesson.vocabulary.map(word => <div className="vocabulary-item" key={word.id}><div className="vocab-japanese" lang="ja"><RubyText text={hasKanji(word.word) ? `${word.word}{${word.reading}}` : word.word} onWordClick={setSelectedWord}/>{progress.settings.romaji && <small>{word.romaji}</small>}</div><span>{word.meaning}</span></div>)}</div></section>
      {quickQuestion.type === 'choice' && <section className="quick-practice lesson-section"><span className="eyebrow">COBA SEBENTAR</span><h2>Apa arti <span lang="ja">{quickQuestion.japanese}</span>?</h2><div className="quick-options">{[...quickQuestion.options].reverse().map(option => <button key={option} aria-pressed={practice === option} disabled={checked} onClick={() => setPractice(option)}>{option}</button>)}</div>{checked ? <p role="status" className={practice === quickQuestion.answer ? 'correct-text' : 'incorrect-text'}>{practice === quickQuestion.answer ? 'Tepat! ' : 'Belum tepat. '}{quickQuestion.explanation}</p> : <button className="button button-outline" disabled={!practice} onClick={() => setChecked(true)}>Periksa jawaban</button>}</section>}
      <section className="lesson-dynamic-cta"><div><p className="eyebrow">COBA DALAM BENTUK LAIN</p><h2>Materi yang sama.<br/>Soal yang berbeda.</h2><p>Buat variasi latihan baru untuk topik ini, lengkap dengan petunjuk dan pembahasan.</p></div><Link className="button button-dark" to={`/latihan?materi=${lesson.id}`}>Buat latihan baru<ArrowRight size={18}/></Link></section>
      <div className="finish-lesson"><div><Check size={24}/><h2>Satu langkah sudah kamu ambil.</h2><p>{studied ? 'Materi ini sudah tercatat. Kamu bisa mengulang kuis kapan saja.' : 'Tandai materi selesai untuk menyimpan progres dan membuka flashcard.'}</p></div><button className="button button-dark" onClick={() => { markStudied(); navigate(`/kuis/${lesson.id}`); }}>Selesai & coba kuis<ArrowRight size={18}/></button>{!studied && <button className="text-link" onClick={markStudied}>Tandai selesai, kuis nanti</button>}</div>
      <div className="lesson-navigation"><Link to="/materi"><ArrowLeft size={17}/>Semua materi</Link>{lesson.index < 23 && unlocked(progress, lesson.index + 1) && <Link to={`/materi/${lessons[lesson.index + 1].id}`}>Materi berikutnya<ArrowRight size={17}/></Link>}</div>
    </div>
    {selectedWord && <KanjiDialog key={selectedWord.id} entry={selectedWord} lesson={lesson} onClose={() => setSelectedWord(null)}/>}
  </div>;
}

function PreparationWords({ words, onSelect }: { words: StudyWord[]; onSelect: (word: StudyWord) => void }) {
  return <dl className="preparation-words">{words.map(word => <div key={word.id}><dt lang="ja"><RubyText text={hasKanji(word.word) ? `${word.word}{${word.reading}}` : word.word} furigana onWordClick={onSelect}/><small>{word.romaji}</small></dt><dd>{word.meaning}</dd></div>)}</dl>;
}
