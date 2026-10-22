import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, LoaderCircle, RotateCcw, Square, WandSparkles, X } from 'lucide-react';
import { useAI } from '../ai-context';
import { lessons } from '../data/curriculum';
import { practiceWords, practiceQuestionWriting } from '../lib/practice-writing';
import { describeQuestion, isPracticeSession, isPracticeSet, solution } from '../lib/practice';
import type { PracticeSession, SeenQuestion } from '../lib/practice';
import type { AttemptAnswer, Lesson } from '../types';
import { QuizQuestion } from '../pages/Quiz';
import { RubyText } from './Shared';
import '../practice.css';

function readSession(key: string, lessonId: string) {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null'); return isPracticeSession(value) && value.lessonId === lessonId ? value : null; } catch { return null; }
}
function readSeen(key: string): SeenQuestion[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter(q => q && typeof q.prompt === 'string' && q.prompt.length <= 360 && typeof q.content === 'string' && q.content.length <= 800 && typeof q.signature === 'string' && q.signature.length <= 1500 && ['choice','type','order','match'].includes(q.type)).slice(-50) : [];
  } catch { return []; }
}

export default function PracticePanel({ lesson }: { lesson: Lesson }) {
  const { status, models, post, refresh, connecting, error: connectionError, preferredModel } = useAI();
  const key = `nn-practice-v1:${status?.activeId ?? 'guest'}:${lesson.id}`;
  const [session, setSession] = useState<PracticeSession | null>(() => readSession(key, lesson.id));
  const [count, setCount] = useState(() => session?.questions.length ?? 5);
  const [level, setLevel] = useState<'basic' | 'apply'>(() => session?.level ?? 'basic');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [limited, setLimited] = useState(false);
  const recent = useRef([...readSeen(`${key}:seen`), ...(session?.questions.map(describeQuestion) ?? [])].slice(-50));
  const controller = useRef<AbortController | null>(null);
  const heading = useRef<HTMLDivElement>(null);
  const model = models.find(m => m.slug === preferredModel)?.slug ?? models[0]?.slug;
  const ready = Boolean(status?.sharing && model && !connecting);
  const finished = session && session.answers.length === session.questions.length;
  const words = useMemo(() => practiceWords(lessons, lesson.index), [lesson.index]);
  const rawQuestion = session?.questions[session.answers.length];
  const question = useMemo(() => rawQuestion && practiceQuestionWriting(rawQuestion, words), [rawQuestion, words]);
  useEffect(() => () => { const current = controller.current; controller.current = null; current?.abort(); }, []);
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(key, JSON.stringify(session)); localStorage.setItem(`${key}:seen`, JSON.stringify(recent.current)); setStorageError(''); }
    catch { setStorageError('Sesi belum tersimpan di perangkat. Tetap di halaman ini untuk melanjutkan.'); }
  }, [session, key]);

  const generate = async (focus: string[] = []) => {
    if (!ready || busy) return;
    const current = new AbortController(); controller.current = current;
    setBusy(true); setError(''); setLimited(false);
    try {
      const seen = [...recent.current];
      while (JSON.stringify(seen).length > 14000) seen.shift();
      const response = await post('practice', { lessonId: lesson.id, count, level, model, seen, focus }, current.signal);
      const data = await response.json();
      if (controller.current !== current) return;
      if (!response.ok) { setLimited(data.code === 'usage_limit'); throw new Error(data.error || 'Set latihan belum dapat dibuat.'); }
      if (!isPracticeSet(data) || data.lessonId !== lesson.id || data.questions.length !== count) throw new Error('Set latihan belum dapat dibaca. Coba lagi.');
      recent.current = [...recent.current, ...data.questions.map(describeQuestion)].slice(-50);
      setSession({ ...data, answers: [] });
      requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start' }); });
    } catch (e) {
      if (controller.current !== current) return;
      setError(current.signal.aborted ? 'Pembuatan dihentikan. Kamu bisa mencoba lagi.' : e instanceof Error ? e.message : 'Latihan belum dapat dibuat. Periksa koneksi lalu coba lagi.');
    } finally {
      if (controller.current === current) { controller.current = null; setBusy(false); void refresh(); }
    }
  };
  const next = (answer: AttemptAnswer) => {
    setSession(previous => previous && previous.questions[previous.answers.length]?.id === answer.questionId ? { ...previous, answers: [...previous.answers, answer] } : previous);
    requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start' }); });
  };
  const weak = session ? [...new Set(session.answers.flatMap((a, i) => a.correct ? [] : [session.questions[i].focus]))] : [];
  return <div className="dynamic-practice">
    <section className="practice-setup" aria-labelledby="practice-setup-title">
      <div className="practice-setup-heading"><div><h2 id="practice-setup-title">Satu topik, banyak kesempatan.</h2><p>Kalimat dan kombinasi soal baru setiap set. Pilih ritmemu.</p></div><WandSparkles size={27}/></div>
      <div className="practice-controls"><label>Tingkat latihan<select value={level} disabled={busy} onChange={e => setLevel(e.target.value as 'basic' | 'apply')}><option value="basic">Dasar · kenali polanya</option><option value="apply">Penerapan · coba situasi baru</option></select></label><label>Jumlah soal<select value={count} disabled={busy} onChange={e => setCount(Number(e.target.value))}><option value={5}>5 soal · sesi singkat</option><option value={10}>10 soal · lebih banyak mencoba</option></select></label><div className="practice-build">{busy ? <button className="button button-outline" onClick={() => controller.current?.abort()}><Square size={15}/>Hentikan</button> : <button className="button button-dark" disabled={!ready} onClick={() => { void generate(); }}><WandSparkles size={17}/>{session ? 'Buat set baru' : 'Buat latihan'}</button>}</div></div>
      <div className="practice-connection"><span>{ready ? 'Using ChatGPT plan · AI membuat soal saat kamu meminta.' : connecting ? 'Selesaikan login terlebih dahulu.' : 'Hubungkan ChatGPT di Pengaturan untuk membuat soal baru.'}</span><Link className="text-link" to="/pengaturan">Pengaturan AI<ArrowRight size={14}/></Link></div>
      {session && !finished && <small>Set baru mengganti sesi ini setelah berhasil dibuat. {session.answers.length} dari {session.questions.length} jawaban {storageError ? 'tercatat sementara' : 'sudah tersimpan'}.</small>}
    </section>
    {busy && <div className="practice-loading" role="status"><LoaderCircle className="spin" size={23}/><div><strong>Sedang menyiapkan variasi baru…</strong><p>Membuat soal, kunci, petunjuk, dan pembahasan. Ini bisa memerlukan beberapa saat.</p></div></div>}
    {(error || (!ready && connectionError)) && <div className="tutor-error" role="alert"><X size={18}/><div><p>{error || connectionError}</p>{limited && <a className="text-link" href="https://chatgpt.com/settings/usage" target="_blank" rel="noreferrer">Manage usage<ArrowRight size={14}/></a>}</div></div>}
    {storageError && <p className="practice-storage" role="status">{storageError}</p>}
    <div ref={heading} tabIndex={-1} className="practice-session" aria-label="Sesi latihan">
      {session && !finished && question && !busy && <><div className="practice-session-label"><span>{session.level === 'basic' ? 'Dasar' : 'Penerapan'} · {question.focus}</span><span>{storageError ? 'Sesi sementara di halaman ini' : 'Sesi tersimpan di perangkat ini'}</span></div><div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={session.questions.length} aria-valuenow={session.answers.length} aria-label="Progres latihan"><div style={{ width: `${session.answers.length / session.questions.length * 100}%` }}/></div><QuizQuestion key={question.id} question={question} index={session.answers.length} total={session.questions.length} timer={0} hint={question.hint} showSolution={solution(question)} onNext={next}/></>}
      {session && finished && !busy && <section className="practice-results"><div className="practice-result-mark"><Check size={28}/></div><h2>Satu set sudah kamu coba.</h2><p><strong>{session.answers.filter(a => a.correct).length} dari {session.questions.length}</strong> jawaban benar. Kamu bisa mencoba variasi lain pada topik yang sama.</p><div className="practice-result-actions"><button className="button button-dark" disabled={!ready} onClick={() => { void generate(); }}><RotateCcw size={17}/>Buat set baru</button>{weak.length > 0 && <button className="button button-outline" disabled={!ready} onClick={() => { void generate(weak); }}>Latih bagian yang belum tepat<ArrowRight size={16}/></button>}</div><div className="result-details">{session.answers.map((a, i) => <article key={a.questionId}><span className={`answer-result-icon ${a.correct ? 'good' : 'bad'}`}>{a.correct ? <Check size={18}/> : <X size={18}/>}</span><div><h3><RubyText text={a.prompt} furigana={false}/></h3><p>Jawabanmu: <RubyText text={a.response} furigana={false}/></p><p><RubyText text={a.explanation} furigana={false}/></p><small>{session.questions[i].focus}</small></div></article>)}</div></section>}
      {!session && !busy && <div className="practice-empty"><span lang="ja">もう一度。</span><h2>Ulangi topiknya.<br/>Temui soal yang berbeda.</h2><p>Pilih topik di atas, lalu buat latihan. Pilihan ganda, ketik kana, pasangan, dan susun kalimat mengikuti materi yang kamu pelajari.</p></div>}
    </div>
    <p className="practice-footnote">Latihan AI memakai kunci dari set yang dibuat. Hasilnya untuk berlatih; kelulusan, poin, dan streak tetap melalui kuis materi serta flashcard.</p>
  </div>;
}
