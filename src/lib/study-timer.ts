export const studyTimerKey = 'nn-study-timer-v1';
export type StudyTimerState = { durationSeconds: number; remainingMs: number; deadline: number | null; phase: 'idle' | 'running' | 'paused' | 'finished' };

export function newStudyTimer(minutes = 25): StudyTimerState {
  const durationSeconds = minutes * 60;
  return { durationSeconds, remainingMs: durationSeconds * 1000, deadline: null, phase: 'idle' };
}

export function studyTimeLeft(timer: StudyTimerState, now = Date.now()) {
  return timer.phase === 'running' && timer.deadline !== null
    ? Math.max(0, Math.min(timer.remainingMs, timer.deadline - now)) : timer.remainingMs;
}

export function finishStudyTimer(timer: StudyTimerState, now = Date.now()): StudyTimerState {
  return timer.phase === 'running' && studyTimeLeft(timer, now) === 0
    ? { ...timer, remainingMs: 0, deadline: null, phase: 'finished' } : timer;
}

export function startStudyTimer(timer: StudyTimerState, now = Date.now()): StudyTimerState {
  if (timer.phase === 'running') return finishStudyTimer(timer, now);
  const remainingMs = timer.phase === 'finished' ? timer.durationSeconds * 1000 : timer.remainingMs;
  return { ...timer, remainingMs, deadline: now + remainingMs, phase: 'running' };
}

export function pauseStudyTimer(timer: StudyTimerState, now = Date.now()): StudyTimerState {
  const remainingMs = studyTimeLeft(timer, now);
  return timer.phase === 'running' ? { ...timer, remainingMs, deadline: null, phase: remainingMs ? 'paused' : 'finished' } : timer;
}

export function readStudyTimer(raw: string | null, now = Date.now()): StudyTimerState {
  try {
    const timer = JSON.parse(raw ?? 'null') as StudyTimerState | null;
    if (!timer || !Number.isInteger(timer.durationSeconds) || timer.durationSeconds < 60 || timer.durationSeconds > 43200
      || !Number.isFinite(timer.remainingMs) || timer.remainingMs < 0 || timer.remainingMs > timer.durationSeconds * 1000
      || !['idle', 'running', 'paused', 'finished'].includes(timer.phase)
      || (timer.phase === 'running' ? !Number.isFinite(timer.deadline) || timer.deadline! <= 0 : timer.deadline !== null)
      || (timer.phase === 'finished' ? timer.remainingMs !== 0 : timer.remainingMs === 0)
      || (timer.phase === 'idle' && timer.remainingMs !== timer.durationSeconds * 1000)) return newStudyTimer();
    return finishStudyTimer(timer, now);
  } catch { return newStudyTimer(); }
}

export function studyClock(milliseconds: number) {
  const seconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds / 60) % 60, rest = seconds % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return hours ? `${two(hours)}:${two(minutes)}:${two(rest)}` : `${two(minutes)}:${two(rest)}`;
}
