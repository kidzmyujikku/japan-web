import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { Link, MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import StudyTimer from './StudyTimer';
import { newStudyTimer, startStudyTimer, studyTimerKey } from '../lib/study-timer';

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-11T12:00:00Z')); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

function app() {
  return render(<MemoryRouter><Routes><Route element={<><StudyTimer/><Outlet/></>}><Route index element={<Link to="/materi">Buka materi</Link>}/><Route path="/materi" element={<h1>Materi belajar</h1>}/></Route></Routes></MemoryRouter>);
}
function configure(view: ReturnType<typeof render>, minutes: string) {
  fireEvent.click(view.getByRole('button', { name: 'Atur timer belajar' }));
  fireEvent.change(view.getByLabelText('Durasi belajar (menit)'), { target: { value: minutes } });
  fireEvent.click(view.getByRole('button', { name: 'Atur & reset timer' }));
}

describe('global study countdown', () => {
  it('keeps counting across routes and reloads, and preserves the remainder when paused', () => {
    let view = app();
    configure(view, '1');
    fireEvent.click(view.getByRole('button', { name: 'Mulai timer belajar' }));
    act(() => vi.advanceTimersByTime(30000));
    fireEvent.click(view.getByRole('link', { name: 'Buka materi' }));
    expect(view.getByRole('heading', { name: 'Materi belajar' })).toBeDefined();
    expect(view.getByRole('timer').textContent).toBe('00:30');
    view.unmount();
    act(() => vi.advanceTimersByTime(10000));
    view = app();
    expect(view.getByRole('timer').textContent).toBe('00:20');
    fireEvent.click(view.getByRole('button', { name: 'Jeda timer belajar' }));
    act(() => vi.advanceTimersByTime(90000));
    expect(view.getByRole('timer').textContent).toBe('00:20');
    fireEvent.click(view.getByRole('button', { name: 'Lanjutkan timer belajar' }));
    act(() => vi.advanceTimersByTime(20000));
    expect(view.getByRole('timer').textContent).toBe('00:00');
    expect(view.getByRole('status').textContent).toBe('Waktu belajar selesai.');
    fireEvent.click(view.getByRole('button', { name: 'Mulai lagi timer belajar' }));
    expect(view.getByRole('timer').textContent).toBe('01:00');
    fireEvent.click(view.getByRole('button', { name: 'Reset timer belajar' }));
    act(() => vi.advanceTimersByTime(60000));
    expect(view.getByRole('timer').textContent).toBe('01:00');
    expect(view.getByRole('status').textContent).toBe('Siap belajar');
  });

  it('uses the deadline after a background-tab time jump and announces completion once', () => {
    const view = app(); configure(view, '1');
    fireEvent.click(view.getByRole('button', { name: 'Mulai timer belajar' }));
    vi.setSystemTime(Date.now() + 65000);
    fireEvent(document, new Event('visibilitychange'));
    expect(view.getByRole('timer').textContent).toBe('00:00');
    expect(view.getByRole('status').textContent).toBe('Waktu belajar selesai.');
    act(() => vi.advanceTimersByTime(30000));
    expect(view.getAllByText('Waktu belajar selesai.')).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(studyTimerKey)!).phase).toBe('finished');
  });

  it('validates custom durations, applies presets, and resets a running session explicitly', () => {
    const view = app();
    fireEvent.click(view.getByRole('button', { name: 'Mulai timer belajar' }));
    fireEvent.click(view.getByRole('button', { name: 'Atur timer belajar' }));
    const settings = view.getByRole('form', { name: 'Pengaturan timer belajar' });
    const input = within(settings).getByLabelText('Durasi belajar (menit)');
    for (const value of ['', '0', '721', '1.5']) {
      fireEvent.change(input, { target: { value } });
      expect((within(settings).getByRole('button', { name: 'Atur & reset timer' }) as HTMLButtonElement).disabled).toBe(true);
    }
    fireEvent.click(within(settings).getByRole('button', { name: '45 menit' }));
    fireEvent.click(within(settings).getByRole('button', { name: 'Atur & reset timer' }));
    expect(view.getByRole('timer').textContent).toBe('45:00');
    expect(view.getByRole('status').textContent).toBe('Siap belajar');
    expect(view.queryByRole('form')).toBeNull();
  });

  it('restores an expired session, ignores corrupt storage, and synchronizes another tab', () => {
    localStorage.setItem(studyTimerKey, '{broken');
    let view = app(); expect(view.getByRole('timer').textContent).toBe('25:00'); view.unmount();
    const expired = startStudyTimer(newStudyTimer(1), Date.now() - 120000);
    localStorage.setItem(studyTimerKey, JSON.stringify(expired));
    view = app(); expect(view.getByRole('status').textContent).toBe('Waktu belajar selesai.');
    const running = startStudyTimer(newStudyTimer(60));
    fireEvent(window, new StorageEvent('storage', { key: studyTimerKey, newValue: JSON.stringify(running) }));
    expect(view.getByRole('timer').textContent).toBe('01:00:00');
    expect(view.getByRole('button', { name: 'Jeda timer belajar' })).toBeDefined();
  });

  it('keeps the countdown usable when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const view = app();
    fireEvent.click(view.getByRole('button', { name: 'Mulai timer belajar' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(view.getByRole('timer').textContent).toBe('24:59');
    fireEvent.click(view.getByRole('button', { name: 'Atur timer belajar' }));
    expect(view.getByRole('alert').textContent).toContain('belum bisa disimpan');
  });
});
