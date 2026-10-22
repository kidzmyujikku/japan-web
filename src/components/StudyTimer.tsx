import { useEffect, useRef, useState } from 'react';
import { Clock3, Pause, Play, RotateCcw, Settings2, X } from 'lucide-react';
import { finishStudyTimer, newStudyTimer, pauseStudyTimer, readStudyTimer, startStudyTimer, studyClock, studyTimeLeft, studyTimerKey } from '../lib/study-timer';
import './StudyTimer.css';

export default function StudyTimer() {
  const [timer, setTimer] = useState(() => {
    try { return readStudyTimer(localStorage.getItem(studyTimerKey)); }
    catch { return newStudyTimer(); }
  });
  const [now, setNow] = useState(Date.now);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => String(timer.durationSeconds / 60));
  const [storageError, setStorageError] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const minutesInput = useRef<HTMLInputElement>(null);
  const minutes = Number(draft);
  const valid = draft.trim() !== '' && Number.isInteger(minutes) && minutes >= 1 && minutes <= 720;
  const seconds = Math.ceil(studyTimeLeft(timer, now) / 1000);

  useEffect(() => {
    try { localStorage.setItem(studyTimerKey, JSON.stringify(timer)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [timer]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== studyTimerKey) return;
      setNow(Date.now()); setTimer(readStudyTimer(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (timer.phase !== 'running') return;
    const tick = () => {
      const current = Date.now(); setNow(current);
      setTimer(previous => finishStudyTimer(previous, current));
    };
    tick();
    const interval = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('pageshow', tick);
    window.addEventListener('focus', tick);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick); window.removeEventListener('pageshow', tick); window.removeEventListener('focus', tick); };
  }, [timer.phase]);
  useEffect(() => { setDraft(String(timer.durationSeconds / 60)); }, [timer.durationSeconds]);
  useEffect(() => {
    if (!open) return;
    minutesInput.current?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); settingsButton.current?.focus(); }
    };
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !panel.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('keydown', dismiss);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', outside); };
  }, [open]);

  const toggle = () => {
    const current = Date.now(); setNow(current);
    setTimer(previous => previous.phase === 'running' ? pauseStudyTimer(previous, current) : startStudyTimer(previous, current));
  };
  const reset = () => { setNow(Date.now()); setTimer(newStudyTimer(timer.durationSeconds / 60)); };
  const action = timer.phase === 'running' ? 'Jeda' : timer.phase === 'paused' ? 'Lanjutkan' : timer.phase === 'finished' ? 'Mulai lagi' : 'Mulai';
  const status = timer.phase === 'finished' ? 'Waktu belajar selesai.' : timer.phase === 'running' ? 'Sedang belajar' : timer.phase === 'paused' ? 'Dijeda' : 'Siap belajar';

  return <section ref={panel} className={`study-timer ${timer.phase === 'finished' ? 'finished' : ''}`} aria-label="Timer belajar">
    <div className="study-timer-bar container">
      <div className="study-timer-title"><Clock3 size={18}/><span>Waktu belajar<small role="status">{status}</small></span></div>
      <span className="study-timer-clock" role="timer" aria-live="off" aria-label={`${seconds} detik waktu belajar tersisa`}>{studyClock(studyTimeLeft(timer, now))}</span>
      <div className="study-timer-actions">
        <button className="study-timer-toggle" type="button" onClick={toggle} aria-label={`${action} timer belajar`}>{timer.phase === 'running' ? <Pause size={16}/> : <Play size={16}/>}<span>{action}</span></button>
        <button className="study-timer-icon" type="button" onClick={reset} disabled={timer.phase === 'idle'} aria-label="Reset timer belajar" title="Reset timer belajar"><RotateCcw size={17}/></button>
        <button ref={settingsButton} className="study-timer-icon" type="button" aria-label="Atur timer belajar" title="Atur timer belajar" aria-expanded={open} aria-controls="study-timer-settings" onClick={() => { setDraft(String(timer.durationSeconds / 60)); setOpen(value => !value); }}><Settings2 size={17}/></button>
      </div>
    </div>
    {open && <form id="study-timer-settings" className="study-timer-settings" aria-label="Pengaturan timer belajar" onSubmit={event => { event.preventDefault(); if (!valid) return; setTimer(newStudyTimer(minutes)); setNow(Date.now()); setOpen(false); settingsButton.current?.focus(); }}>
      <div className="study-timer-settings-heading"><h2>Atur waktu belajar</h2><button type="button" className="study-timer-icon" aria-label="Tutup pengaturan timer" onClick={() => { setOpen(false); settingsButton.current?.focus(); }}><X size={18}/></button></div>
      <div className="study-timer-presets" role="group" aria-label="Durasi belajar cepat">{[15, 25, 45, 60].map(value => <button type="button" key={value} aria-pressed={minutes === value} onClick={() => setDraft(String(value))}>{value} menit</button>)}</div>
      <label htmlFor="study-duration">Durasi belajar (menit)</label>
      <input ref={minutesInput} id="study-duration" type="number" min="1" max="720" step="1" value={draft} onChange={event => setDraft(event.target.value)} aria-invalid={!valid} aria-describedby="study-duration-help"/>
      <p id="study-duration-help">{valid ? '1–720 menit. Mengatur durasi akan mereset timer. Timer tetap berjalan saat kamu berpindah halaman atau tab.' : 'Masukkan bilangan bulat dari 1 sampai 720 menit.'}</p>
      {storageError && <p role="alert">Timer berjalan di halaman ini, tetapi belum bisa disimpan untuk dimuat ulang.</p>}
      <button type="submit" className="button button-dark" disabled={!valid}>Atur & reset timer</button>
    </form>}
  </section>;
}
