import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock3, LockKeyhole, RotateCcw, Trophy, X } from 'lucide-react';
import { lessons } from '../data/curriculum';
import { isCorrect, jakartaDate, remainingSeconds, unlocked } from '../lib/learning';
import { useLearning } from '../store';
import type { Attempt, AttemptAnswer, Lesson, Question } from '../types';
import TimerControl from '../components/TimerControl';
import KanaInput from '../components/KanaInput';
import { practicePlain } from '../lib/practice-writing';
import { RubyText } from '../components/Shared';
import MatchingQuestion from '../components/MatchingQuestion';

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i],result[j]] = [result[j],result[i]]; }
  return result;
}
export default function QuizPage() {
  const { id } = useParams();
  const { progress, setSettings } = useLearning();
  const lesson = lessons.find(l => l.id === id);
  if (!lesson) return <div className="container empty-state"><h1>Kuis tidak ditemukan.</h1><Link to="/materi" className="button button-dark">Semua materi</Link></div>;
  if (!unlocked(progress, lesson.index)) return <div className="container empty-state"><LockKeyhole size={36}/><h1>Kuis ini belum terbuka.</h1><p>Selesaikan kuis sebelumnya dengan minimal 80%, atau beralih ke eksplorasi.</p><button className="button button-dark" onClick={() => setSettings({ ...progress.settings, mode: 'explore' })}>Beralih ke eksplorasi</button></div>;
  return <QuizSession key={lesson.id} lesson={lesson}/>;
}
function QuizSession({ lesson }: { lesson: Lesson }) {
  const { progress, send, setSettings } = useLearning();
  const [started, setStarted] = useState(false);
  const [timer, setTimer] = useState(progress.settings.timer);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [result, setResult] = useState<Attempt | null>(null);
  const attemptId = useRef(crypto.randomUUID());
  const question = lesson.questions[answers.length];
  const start = () => {
    setSettings({ ...progress.settings, timer });
    send({ id: crypto.randomUUID(), type: 'study', lessonId: lesson.id, date: jakartaDate(), at: Date.now() });
    setStarted(true);
  };
  const next = (answer: AttemptAnswer) => {
    const finished = [...answers, answer];
    setAnswers(finished);
    if (finished.length === lesson.questions.length) {
      const at = Date.now();
      const attempt: Attempt = { id: attemptId.current, lessonId: lesson.id, score: finished.filter(a => a.correct).length * 10, answers: finished, date: jakartaDate(at), at, timer };
      send({ id: attempt.id, type: 'quiz', attempt, at });
      setResult(attempt);
    }
  };
  if (result) {
    const passed = result.score >= 80;
    const following = lessons[lesson.index + 1];
    return <div className="container page-shell quiz-page result-page"><div className={`result-emblem ${passed ? 'pass' : ''}`}><Trophy size={40}/></div><p className="eyebrow">SATU LANGKAH LEBIH JAUH</p><h1>{passed ? 'Lihat, kamu bisa.' : 'Belum selesai belajar.'}</h1><p>{passed ? 'Kuis ini lulus. Pertahankan kata-katanya lewat pengulangan.' : 'Tidak apa-apa. Lihat pembahasannya, lalu coba lagi saat siap.'}</p><div className="result-score">{result.score}<span>/ 100</span></div><p>{result.answers.filter(a => a.correct).length} dari 10 soal benar · Kelulusan 80%</p><div className="result-actions"><button className="button button-dark" onClick={() => { setAnswers([]); setResult(null); setStarted(false); attemptId.current = crypto.randomUUID(); }}><RotateCcw size={17}/>Coba lagi</button><Link className="button button-outline" to={`/materi/${lesson.id}`}>Baca ulang materi</Link><Link className="button button-outline" to={`/latihan?materi=${lesson.id}`}>Coba soal baru<ArrowRight size={17}/></Link>{following && unlocked(progress, following.index) && <Link className="text-link" to={`/materi/${following.id}`}>Materi berikutnya<ArrowRight size={17}/></Link>}</div><div className="result-details">{result.answers.map((answer,i) => <article key={answer.questionId}><span className={`answer-result-icon ${answer.correct ? 'good' : 'bad'}`}>{answer.correct ? <Check size={18}/> : <X size={18}/>}</span><div><h3>{i+1}. {answer.prompt}</h3><p>Jawabanmu: <span lang="ja">{answer.response || 'Tidak dijawab'}</span></p><p>{answer.explanation}</p></div></article>)}</div></div>;
  }
  if (!started) return <div className="container page-shell quiz-page"><Link className="text-link" to={`/materi/${lesson.id}`}><ArrowLeft size={16}/>Kembali ke materi</Link><div className="quiz-intro"><div className="quiz-intro-symbol" lang="ja">試</div><p className="eyebrow">WAKTUNYA MENCOBA</p><h1>{lesson.title}</h1><p>Sepuluh soal. Empat cara berlatih.<br/>Pilihan ganda, pasangan, susun kalimat, dan ketik kana.</p><div className="quiz-rules"><span><Check size={17}/>Lulus mulai 80%</span><span><RotateCcw size={17}/>Bebas mencoba lagi</span></div></div><section className="quiz-setup"><h2>Mau tantangan waktu?</h2><TimerControl value={timer} onChange={setTimer}/><button className="button button-dark start-quiz" onClick={start}>Mulai kuis<ArrowRight size={18}/></button></section></div>;
  return <div className="container page-shell quiz-page"><div className="quiz-topline"><Link className="text-link" to={`/materi/${lesson.id}`}><ArrowLeft size={16}/>Keluar kuis</Link><span>{lesson.title}</span></div><div className="quiz-progress"><div style={{ width: `${answers.length / 10 * 100}%` }}/></div><QuizQuestion key={question.id} question={question} index={answers.length} timer={timer} onNext={next}/><p className="quiz-exit-note">Keluar sebelum selesai tidak menyimpan percobaan kuis ini. Materi dan progres sebelumnya tetap tersimpan.</p></div>;
}

export function QuizQuestion({ question, index, timer, onNext, total = 10, hint, showSolution }: { question: Question; index: number; timer: number; onNext: (answer: AttemptAnswer) => void; total?: number; hint?: string; showSolution?: string }) {
  const { progress, setSettings } = useLearning();
  const [typed, setTyped] = useState('');
  const updateTyped = useCallback((value: string) => setTyped(value), []);
  const [choice, setChoice] = useState('');
  const [ordered, setOrdered] = useState<number[]>([]);
  const [matches, setMatches] = useState<Record<number,string>>({});
  const [choices] = useState(() => question.type === 'choice' ? shuffle(question.options) : []);
  const [tokenIndices] = useState(() => question.type === 'order' ? shuffle(question.tokens.map((_,i) => i)) : []);
  const [rights] = useState(() => question.type === 'match' ? shuffle(question.pairs.map(p => p.right)) : []);
  const [deadline] = useState(() => Date.now() + timer * 1000);
  const [seconds, setSeconds] = useState(timer);
  const [feedback, setFeedback] = useState<AttemptAnswer | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const submitted = useRef(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const response: string | string[] = question.type === 'choice' ? choice : question.type === 'type' ? typed : question.type === 'order' ? ordered.map(i => question.tokens[i]) : question.pairs.map((_,i) => matches[i] ?? '');
  const responseRef = useRef(response); responseRef.current = response;
  const complete = question.type === 'choice' ? Boolean(choice) : question.type === 'type' ? Boolean(typed.trim()) : question.type === 'order' ? ordered.length === question.tokens.length : Object.keys(matches).length === question.pairs.length;
  const submit = useCallback((timeout = false) => {
    if (submitted.current) return;
    submitted.current = true;
    const expired = timeout || (timer > 0 && Date.now() >= deadline);
    const value = responseRef.current;
    const correct = !expired && isCorrect(question, value);
    setFeedback({ questionId: question.id, correct, response: expired ? 'Waktu habis' : Array.isArray(value) ? value.map(practicePlain).join(' / ') : practicePlain(value), prompt: question.prompt + (question.type === 'choice' ? ` ${question.japanese}` : ''), explanation: `${expired ? 'Waktu habis. ' : ''}${showSolution ? `Jawaban: ${showSolution}${/[。.!?？！]$/u.test(showSolution) ? '' : '.'} ` : ''}${question.explanation}` });
  }, [question, timer, deadline, showSolution]);
  useEffect(() => {
    if (!timer || feedback) return;
    const tick = () => { const left = remainingSeconds(deadline); setSeconds(left); if (!left) submit(true); };
    const interval = window.setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, [timer, deadline, feedback, submit]);
  useEffect(() => { if (feedback) nextButton.current?.focus(); }, [feedback]);
  const setMatch = (left: number, right: string) => {
    if (feedback) return;
    setMatches(previous => { const next = { ...previous }; Object.entries(next).forEach(([key,value]) => { if (value === right) delete next[Number(key)]; }); next[left] = right; return next; });
  };
  return <section className="question-panel"><div className="question-meta"><span>Soal {index+1} dari {total}</span><span className={`quiz-timer ${seconds <= 5 && timer ? 'urgent' : ''}`} aria-label={timer ? `${seconds} detik tersisa` : 'Tanpa timer'}><Clock3 size={17}/>{timer ? `${seconds} detik` : 'Tanpa timer'}</span></div><h1>{question.type === 'type' ? question.prompt.split(/(“[^”]+”)/).map((part,i) => part.startsWith('“') ? <span key={i} className="kana-prompt-word" lang="ja"><RubyText text={part} furigana={false}/></span> : <RubyText key={i} text={part} furigana={false}/>) : <RubyText text={question.prompt} furigana={false}/>}</h1>
    {question.type === 'choice' && <><div className="question-japanese" lang="ja"><RubyText text={question.japanese} furigana={false}/></div><div className="choice-options">{choices.map((option,i) => <button key={option} className={choice === option ? 'selected' : ''} disabled={Boolean(feedback)} aria-pressed={choice === option} onClick={() => setChoice(option)}><span className="choice-label">{String.fromCharCode(65+i)}</span><span className="choice-text"><RubyText text={option} furigana={false}/></span>{choice === option && <Check size={18}/>}</button>)}</div></>}
    {question.type === 'type' && <KanaInput value={typed} onChange={updateTyped} script={question.script} disabled={Boolean(feedback)} auto={progress.settings.autoKana} onAutoChange={autoKana => setSettings({ ...progress.settings, autoKana })}/>}
    {question.type === 'match' && <MatchingQuestion furigana={false} pairs={question.pairs} rights={rights} matches={matches} disabled={Boolean(feedback)} onMatch={setMatch}/>}
    {question.type === 'order' && <><p className="question-help">Ketuk atau seret kata ke kotak jawaban. Ketuk kembali untuk menghapusnya.</p><div className="sentence-answer" aria-label="Susunan jawaban" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const raw = e.dataTransfer.getData('text/plain'); const n = Number(raw); if (!feedback && /^\d+$/.test(raw) && n < question.tokens.length && !ordered.includes(n)) setOrdered([...ordered,n]); }}>{!ordered.length && <span>Susun kalimatmu di sini…</span>}{ordered.map((n,i) => <button lang="ja" disabled={Boolean(feedback)} key={`${n}-${i}`} onClick={() => setOrdered(ordered.filter((_,j) => i !== j))}><RubyText text={question.tokens[n]} furigana={false}/><X size={12}/></button>)}</div><div className="word-bank">{tokenIndices.map(n => <button key={n} lang="ja" disabled={Boolean(feedback) || ordered.includes(n)} draggable={!feedback && !ordered.includes(n)} onDragStart={e => e.dataTransfer.setData('text/plain',String(n))} onClick={() => setOrdered([...ordered,n])}><RubyText text={question.tokens[n]} furigana={false}/></button>)}</div></>}
    {hint && !feedback && <div className="practice-hint"><button className="text-link" aria-expanded={hintVisible} onClick={() => setHintVisible(!hintVisible)}>{hintVisible ? 'Tutup petunjuk' : 'Beri petunjuk'}</button>{hintVisible && <p role="status"><RubyText text={hint} furigana={false}/></p>}</div>}
    {feedback ? <div className={`answer-feedback ${feedback.correct ? 'correct' : 'incorrect'}`} role="status"><div>{feedback.correct ? <Check size={24}/> : <LightbulbIcon/>}<strong>{feedback.correct ? 'Tepat sekali.' : 'Satu hal baru untuk diingat.'}</strong></div><p><RubyText text={feedback.explanation} furigana={false}/></p><button ref={nextButton} className="button button-dark" onClick={() => onNext(feedback)}>{index === total - 1 ? 'Lihat hasil' : 'Soal berikutnya'}<ArrowRight size={18}/></button></div> : <button className="button button-dark check-answer" disabled={!complete} onClick={() => submit()}>Periksa jawaban<Check size={18}/></button>}
  </section>;
}
function LightbulbIcon() { return <span className="feedback-x"><X size={22}/></span>; }
