import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock3, ListChecks, Search, X } from 'lucide-react';
import { lessons } from '../data/curriculum';
import { kanjiById, kanjiWords, recallContext, wordsForLesson } from '../data/kanji';
import type { StudyWord } from '../data/kanji';
import { KanjiInfo } from '../components/KanjiHelp';
import KanjiMnemonics from '../components/KanjiMnemonics';
import TimerControl from '../components/TimerControl';
import { remainingSeconds } from '../lib/learning';
import { buildKanjiTest, matchesKanjiAnswer } from '../lib/kanji-test';
import type { KanjiTestFormat, KanjiTestMode, KanjiTestQuestion, KanjiTestResult } from '../lib/kanji-test';

export default function KanjiPage() {
  const [params, setParams] = useSearchParams();
  const lesson = lessons.find(l => l.id === params.get('materi'));
  const requested = kanjiById.get(params.get('kata') ?? '');
  const selected = params.get('detail') === '1' ? requested : undefined;
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState(() => new Set(requested ? [requested.id] : []));
  const [mode, setMode] = useState<KanjiTestMode>('reading');
  const [format, setFormat] = useState<KanjiTestFormat>('choice');
  const [session, setSession] = useState<KanjiTestQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState('');
  const [checked, setChecked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const submitted = useRef(false);
  const [results, setResults] = useState<KanjiTestResult[]>([]);
  const detail = useRef<HTMLElement>(null);
  const sessionSection = useRef<HTMLElement>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const answerInput = useRef<HTMLInputElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const lessonIds = lesson ? new Set(wordsForLesson(lesson).map(w => w.id)) : null;
  const visible = kanjiWords.filter(word => (!lessonIds || lessonIds.has(word.id))
    && [word.word, word.reading, word.romaji, word.meaning].some(value => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  const pickedWords = kanjiWords.filter(word => picked.has(word.id));
  const visiblePicked = visible.filter(word => picked.has(word.id)).length;
  const question = session?.[index];
  const answerCorrect = checked && Boolean(results.at(-1)?.correct);
  const correctCount = results.filter(result => result.correct).length;
  const missedIds = new Set(results.filter(result => !result.correct).map(result => result.question.word.id));
  const choose = (word?: StudyWord) => {
    const next = new URLSearchParams(params);
    if (word) { next.set('kata', word.id); next.set('detail', '1'); }
    else { next.delete('kata'); next.delete('detail'); }
    setParams(next, { preventScrollReset: true });
    if (word) requestAnimationFrame(() => detail.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };
  const toggle = (id: string) => setPicked(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const selectVisible = (checked: boolean) => setPicked(previous => {
    const next = new Set(previous);
    visible.forEach(word => { if (checked) next.add(word.id); else next.delete(word.id); });
    return next;
  });
  const start = (ids: Iterable<string> = picked) => {
    const questions = buildKanjiTest(ids, mode);
    if (!questions.length) return;
    setSession(questions); setIndex(0); setChoice(''); setChecked(false); setResults([]);
    submitted.current = false; setTimedOut(false); setSeconds(timer); setDeadline(timer ? Date.now() + timer * 1000 : 0);
    requestAnimationFrame(() => { sessionSection.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); (format === 'typed' ? answerInput.current : questionHeading.current)?.focus({ preventScroll: true }); });
  };
  const submit = useCallback((timeout = false) => {
    if (!question || submitted.current || (!choice.trim() && !timeout)) return;
    submitted.current = true;
    const expired = timer > 0 && (timeout || Date.now() >= deadline);
    setTimedOut(expired);
    setSeconds(timer ? remainingSeconds(deadline) : 0);
    const correct = format === 'typed' ? matchesKanjiAnswer(question, choice) : choice === question.answer;
    setResults(previous => [...previous, { question, response: choice.trim() || 'Tidak dijawab', correct: !expired && correct, timedOut: expired }]);
    setChecked(true);
  }, [question, choice, timer, deadline, format]);
  useEffect(() => {
    if (!question || !timer || checked) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      const left = remainingSeconds(deadline);
      setSeconds(left);
      if (!left) submit(true);
    };
    tick();
    const interval = window.setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, [question, timer, checked, deadline, submit]);
  useEffect(() => { if (checked) nextButton.current?.focus({ preventScroll: true }); }, [checked]);
  const nextQuestion = () => {
    if (!checked) return;
    setIndex(n => n + 1); setChoice(''); setChecked(false);
    submitted.current = false; setTimedOut(false); setSeconds(timer); setDeadline(timer ? Date.now() + timer * 1000 : 0);
    requestAnimationFrame(() => { sessionSection.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); (format === 'typed' ? answerInput.current : questionHeading.current)?.focus({ preventScroll: true }); });
  };

  return <div className="container page-shell kanji-page">
    <Link className="text-link" to={lesson ? `/materi/${lesson.id}` : '/materi'}><ArrowLeft size={17}/>{lesson ? `Kembali ke materi ${lesson.index + 1}` : 'Kembali ke materi'}</Link>
    <div className="page-heading"><div><p className="eyebrow">PILIH SENDIRI, UJI INGATANMU</p><h1>Tes hafalan kanji.</h1><p>Checklist kata berkanji yang ingin kamu tes, pilih jenis soal, lalu mulai. Kamu bisa mengulang kapan saja.</p></div></div>
    {session !== null ? <section ref={sessionSection} className="kanji-test-session" aria-label="Sesi tes kanji">
      {question ? <>
        <div className="review-topline kanji-test-topline"><span>Soal {index + 1} dari {session.length}</span><span className={`quiz-timer ${timer && seconds <= 5 && !checked ? 'urgent' : ''}`} aria-label={timer ? `${seconds} detik tersisa${checked ? ', timer dihentikan' : ''}` : 'Tanpa timer'}><Clock3 size={17}/>{timer ? `${seconds} detik${checked ? ' · berhenti' : ''}` : 'Tanpa timer'}</span><button className="text-link" onClick={() => setSession(null)}>Kembali ke pilihan</button></div>
        <div className="quiz-progress"><div style={{ width: `${index / session.length * 100}%` }}/></div>
        <div className="question-panel kanji-test-question">
          <p className="eyebrow">{question.kind === 'reading' ? 'BACAAN KANJI' : 'ARTI KATA'}</p>
          <h2 ref={questionHeading} tabIndex={-1}>{question.kind === 'reading' ? 'Bagaimana bacaan kata ini?' : 'Apa arti kata ini?'}</h2>
          <p className="question-japanese" lang="ja">{question.word.word}</p>
          {recallContext(question.word) && <p className="kanji-recall-context">Dalam pola: <span lang="ja">{recallContext(question.word)}</span></p>}
          {format === 'choice' ? <><div className="choice-options" role="group" aria-label="Pilihan jawaban">{question.options.map((option, i) => <button key={option} type="button" aria-pressed={choice === option} disabled={checked} className={choice === option ? 'selected' : ''} onClick={() => setChoice(option)}><span className="choice-label">{String.fromCharCode(65 + i)}</span><span className="choice-text kanji-option-text" lang={question.kind === 'reading' ? 'ja' : undefined}>{option}</span></button>)}</div>
            {!checked && <button className="button button-dark kanji-check-answer" disabled={!choice} onClick={() => submit()}>Periksa jawaban</button>}</> :
            <form className="kanji-typed-answer" onSubmit={e => { e.preventDefault(); submit(); }}>
              <label htmlFor="kanji-answer">{question.kind === 'reading' ? 'Jawaban bacaan' : 'Jawaban arti'}</label>
              <input ref={answerInput} id="kanji-answer" value={choice} onChange={e => setChoice(e.target.value)} disabled={checked} lang={question.kind === 'reading' ? 'ja' : 'id'} placeholder={question.kind === 'reading' ? 'Ketik kana atau romaji…' : 'Ketik arti dalam bahasa Indonesia…'} aria-describedby="kanji-answer-help" autoComplete="off" autoCapitalize="none" spellCheck={false} onKeyDown={e => { if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault(); }}/>
              <p id="kanji-answer-help">{question.kind === 'reading' ? 'Gunakan kana atau romaji. Perhatikan vokal panjang dan konsonan ganda.' : 'Cukup salah satu arti yang dipelajari; huruf besar dan kecil boleh.'} Tekan Enter atau tombol untuk memeriksa.</p>
              {!checked && <button type="submit" className="button button-dark kanji-check-answer" disabled={!choice.trim()}>Periksa jawaban</button>}
            </form>}
          {checked && <div className={`answer-feedback ${answerCorrect ? 'correct' : 'incorrect'}`} role="status"><strong>{timedOut ? 'Waktu habis.' : answerCorrect ? 'Tepat!' : 'Belum tepat.'}</strong>{timedOut && <p>Soal ini dihitung salah. Kamu bisa membaca pembahasan tanpa batas waktu.</p>}<p>Jawaban yang benar: <span lang={question.kind === 'reading' ? 'ja' : undefined}>{question.answer}</span>.</p><p><span lang="ja">{question.word.word} → {question.word.reading}</span> ({question.word.romaji}) — {question.word.meaning}.</p><button ref={nextButton} className="button button-dark" onClick={nextQuestion}>{index + 1 === session.length ? 'Lihat hasil' : 'Soal berikutnya'}<ArrowRight size={17}/></button></div>}
        </div>
        {checked && <KanjiMnemonics key={question.id} word={question.word.word}/>}
      </> : <div className="kanji-test-result" role="region" aria-label="Hasil tes kanji">
        <Check size={32}/><h2>Tes selesai.</h2><p className="kanji-test-score">{Math.round(correctCount / session.length * 100)}<span>/ 100</span></p><p>{correctCount} dari {session.length} soal benar.</p>
        <div className="kanji-result-actions"><button className="button button-dark" onClick={() => start(session.map(q => q.word.id))}>Tes ulang pilihan ini</button>{missedIds.size > 0 && <button className="button button-outline" onClick={() => start(missedIds)}>Tes ulang yang belum tepat ({missedIds.size} kata)</button>}<button className="text-link" onClick={() => setSession(null)}>Ubah checklist</button></div>
        <div className="result-details">{results.map((result, i) => <article key={result.question.id}><span className={`answer-result-icon ${result.correct ? 'good' : 'bad'}`}>{result.correct ? <Check size={18}/> : <X size={18}/>}</span><div><h3>{i + 1}. <span lang="ja">{result.question.word.word}</span> · {result.question.kind === 'reading' ? 'Bacaan' : 'Arti'}</h3><p>{result.timedOut && 'Waktu habis. '}Jawabanmu: {result.response}</p><p>Jawaban yang benar: {result.question.answer}</p></div></article>)}</div>
      </div>}
    </section> : <>
      <section className="kanji-summary" aria-label="Pilihan tes kanji"><div><ListChecks size={22}/><strong>{pickedWords.length} kata dipilih</strong><span>{mode === 'both' ? pickedWords.length * 2 : pickedWords.length} soal dalam tes ini</span></div><button className="button button-dark" disabled={!pickedWords.length} onClick={() => start()}>Mulai tes{pickedWords.length > 0 && ` (${pickedWords.length})`}</button></section>
      <fieldset className="kanji-test-mode"><legend>Apa yang ingin kamu tes?</legend>{([['reading', 'Bacaan'], ['meaning', 'Arti'], ['both', 'Bacaan & arti']] as const).map(([value, label]) => <label key={value}><input type="radio" name="kanji-test-mode" value={value} checked={mode === value} onChange={() => setMode(value)}/>{label}</label>)}</fieldset>
      <fieldset className="kanji-test-mode"><legend>Bagaimana kamu ingin menjawab?</legend>{([['choice', 'Pilihan ganda'], ['typed', 'Ketik jawaban']] as const).map(([value, label]) => <label key={value}><input type="radio" name="kanji-test-format" value={value} checked={format === value} onChange={() => setFormat(value)}/>{label}</label>)}</fieldset>
      <section className="kanji-timer-setup" aria-label="Pengaturan timer kanji"><h2>Waktu per soal</h2><TimerControl value={timer} onChange={setTimer}/></section>
      {pickedWords.length > 0 && <div className="kanji-picked-list" aria-label="Kata yang dipilih">{pickedWords.map(word => <button type="button" key={word.id} aria-label={`Batalkan pilihan ${word.word} (${word.reading})`} onClick={() => toggle(word.id)}><span lang="ja">{word.word}</span>{word.word === '何' && <small>{word.reading}</small>}<X size={14}/></button>)}<button type="button" className="text-link" onClick={() => setPicked(new Set())}>Kosongkan pilihan</button></div>}
      {selected && <section ref={detail} className="kanji-selected" aria-label={`Detail ${selected.word}`}><div className="kanji-detail-topline"><span>Kenali kata ini</span><button className="text-link" onClick={() => choose()}>Tutup detail</button></div><KanjiInfo entry={selected} lesson={lesson} selectedForTest={picked.has(selected.id)} onToggleTest={() => toggle(selected.id)}/></section>}
      <div className="kanji-tools"><label className="search-field"><Search size={18}/><input aria-label="Cari kanji, bacaan, atau arti" placeholder="Cari kanji, bacaan, atau arti…" value={search} onChange={e => setSearch(e.target.value)}/></label><label>Materi<select aria-label="Filter materi kanji" value={lesson?.id ?? ''} onChange={e => { const nextParams = new URLSearchParams(params); if (e.target.value) nextParams.set('materi', e.target.value); else nextParams.delete('materi'); setParams(nextParams); }}><option value="">Semua materi</option>{lessons.filter(l => wordsForLesson(l).some(w => kanjiById.has(w.id))).map(l => <option key={l.id} value={l.id}>{l.index + 1}. {l.title}</option>)}</select></label></div>
      <div className="kanji-selection-tools"><span className="small-note" role="status">{visible.length} kata{lesson ? ` dalam materi ${lesson.index + 1}` : ''} · {visiblePicked} dicentang dalam hasil ini</span><div><button className="text-link" disabled={!visible.length || visiblePicked === visible.length} onClick={() => selectVisible(true)}>Pilih semua hasil ({visible.length})</button><button className="text-link" disabled={!visiblePicked} onClick={() => selectVisible(false)}>Batalkan hasil ini</button></div></div>
      <div className="kanji-grid" role="group" aria-label="Checklist kanji untuk tes">{visible.map(word => <article key={word.id} className={`kanji-tile kanji-checklist-tile ${picked.has(word.id) ? 'picked' : ''}`}>
        <label className="kanji-pick-label"><input type="checkbox" aria-label={`Pilih ${word.word} (${word.reading}) untuk tes`} checked={picked.has(word.id)} onChange={() => toggle(word.id)}/><span className="kanji-tile-word" lang="ja">{word.word}</span></label>
        <span lang="ja">{word.reading}</span><strong>{word.meaning}</strong><button className="text-link" aria-label={`Lihat mnemonik ${word.word} (${word.reading})`} onClick={() => choose(word)}>Lihat mnemonik →</button>
      </article>)}</div>
      {!visible.length && <div className="empty-state"><h2>Belum ada kata yang cocok.</h2><p>Coba kata pencarian atau filter lain.</p></div>}
    </>}
  </div>;
}
