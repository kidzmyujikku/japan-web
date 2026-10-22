import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LearningProvider } from '../store';
import { kanjiWords } from '../data/kanji';
import { emptyProgress, jakartaDate } from '../lib/learning';
import KanjiPage from './Kanji';
import LessonPage from './Lesson';
import ReviewPage from './Review';

const privateWord = kanjiWords.find(w => w.word === '私')!;
for (const method of ['showModal', 'close'] as const) {
  if (!HTMLDialogElement.prototype[method]) Object.defineProperty(HTMLDialogElement.prototype, method, { configurable: true, writable: true, value() {} });
}
beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function(this: HTMLDialogElement) { this.setAttribute('open', ''); });
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function(this: HTMLDialogElement) { this.removeAttribute('open'); });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
function open(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><LearningProvider><Routes><Route path="/materi/:id" element={<LessonPage/>}/><Route path="/kanji" element={<KanjiPage/>}/><Route path="/ulangi" element={<ReviewPage/>}/></Routes></LearningProvider></MemoryRouter>);
}

describe('kanji checklist and tests', () => {
  it('tests both reading and meaning with keyboard answers and clears the input between questions', () => {
    const view = open(`/kanji?kata=${encodeURIComponent(privateWord.id)}`);
    fireEvent.click(view.getByRole('radio', { name: 'Ketik jawaban' }));
    fireEvent.click(view.getByRole('radio', { name: 'Bacaan & arti' }));
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (1)' }));
    const session = view.getByRole('region', { name: 'Sesi tes kanji' });
    for (let i = 0; i < 2; i++) {
      expect(within(session).queryByRole('group', { name: 'Pilihan jawaban' })).toBeNull();
      expect(within(session).queryByText('Mnemonik visual')).toBeNull();
      expect(session.querySelector('rt')).toBeNull();
      const input = within(session).getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
      expect((within(session).getByRole('button', { name: 'Periksa jawaban' }) as HTMLButtonElement).disabled).toBe(true);
      fireEvent.change(input, { target: { value: input.getAttribute('lang') === 'ja' ? 'watashi' : ' SAYA ' } });
      fireEvent.submit(input.closest('form')!);
      expect(within(session).getByText('Tepat!')).toBeDefined();
      expect(input.disabled).toBe(true);
      fireEvent.click(within(session).getByRole('button', { name: i === 1 ? 'Lihat hasil' : 'Soal berikutnya' }));
    }
    expect(view.getByText('2 dari 2 soal benar.')).toBeDefined();
    fireEvent.click(view.getByRole('button', { name: 'Tes ulang pilihan ini' }));
    expect(within(session).getByRole('textbox')).toBeDefined();
  });

  it('rejects incorrect typed answers and retries missed words in the same format', () => {
    const view = open(`/kanji?kata=${encodeURIComponent(privateWord.id)}`);
    fireEvent.click(view.getByRole('radio', { name: 'Ketik jawaban' }));
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (1)' }));
    const input = view.getByRole('textbox', { name: 'Jawaban bacaan' });
    fireEvent.change(input, { target: { value: 'sensei' } });
    fireEvent.submit(input.closest('form')!);
    expect(view.getByText('Belum tepat.')).toBeDefined();
    fireEvent.click(view.getByRole('button', { name: 'Lihat hasil' }));
    expect(view.getByText('Jawabanmu: sensei')).toBeDefined();
    fireEvent.click(view.getByRole('button', { name: 'Tes ulang yang belum tepat (1 kata)' }));
    expect((view.getByRole('textbox', { name: 'Jawaban bacaan' }) as HTMLInputElement).value).toBe('');
  });

  it('does not submit while confirming Japanese IME input and counts expired typed answers as wrong', () => {
    vi.useFakeTimers();
    const view = open(`/kanji?kata=${encodeURIComponent(privateWord.id)}`);
    fireEvent.click(view.getByRole('radio', { name: 'Ketik jawaban' }));
    fireEvent.click(view.getByRole('button', { name: '10 detik' }));
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (1)' }));
    const input = view.getByRole('textbox', { name: 'Jawaban bacaan' });
    fireEvent.change(input, { target: { value: 'わたし' } });
    expect(fireEvent.keyDown(input, { key: 'Enter', isComposing: true })).toBe(false);
    expect(view.queryByText('Tepat!')).toBeNull();
    act(() => vi.advanceTimersByTime(10000));
    expect(view.getByText('Waktu habis.')).toBeDefined();
    expect((input as HTMLInputElement).disabled).toBe(true);
    fireEvent.submit(input.closest('form')!);
    fireEvent.click(view.getByRole('button', { name: 'Lihat hasil' }));
    expect(view.getByText('0 dari 1 soal benar.')).toBeDefined();
  });
  it('opens mnemonic help and selects a word for testing directly from the lesson', () => {
    const view = open('/materi/lesson-05');
    const prep = view.getByRole('heading', { name: 'Kenali kata-katanya dulu.' });
    const grammar = view.getByRole('heading', { name: 'Topik dengan は' });
    expect(prep.compareDocumentPosition(grammar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(view.getAllByRole('button', { name: 'Lihat bacaan dan arti 私' })[0]);
    const dialog = view.getByRole('dialog');
    expect(within(dialog).getByText('saya', { selector: '.kanji-meaning' })).toBeDefined();
    expect(within(dialog).getByRole('img', { name: 'Gambar pengingat 私: tangkai padi dan menunjuk diri' })).toBeDefined();
    expect(within(dialog).queryByRole('button', { name: 'Simpan ke hafalan' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('link', { name: 'Pilih untuk tes' }));
    expect((view.getByRole('checkbox', { name: 'Pilih 私 (わたし) untuk tes' }) as HTMLInputElement).checked).toBe(true);
    expect(view.getByText('1 kata dipilih')).toBeDefined();
    expect(view.queryByRole('dialog')).toBeNull();
  });

  it('starts from a manual checklist regardless of old saved cards or due dates and never writes a review schedule', () => {
    const progress = emptyProgress();
    progress.reviews[privateWord.id] = { step: 4, due: '2099-01-01', lastAt: Date.now() };
    const originalCache = JSON.stringify({ progress, pending: [], attempts: [] });
    localStorage.setItem('nichinichi-v1:local', originalCache);
    const view = open('/kanji?materi=lesson-05');
    expect(view.getByText('0 kata dipilih')).toBeDefined();
    expect((view.getByRole('button', { name: 'Mulai tes' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByRole('checkbox', { name: 'Pilih 私 (わたし) untuk tes' }));
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (1)' }));
    const session = view.getByRole('region', { name: 'Sesi tes kanji' });
    expect(within(session).getByText('Soal 1 dari 1')).toBeDefined();
    expect(within(session).queryByText('Mnemonik visual')).toBeNull();
    expect((within(session).getByRole('button', { name: 'Periksa jawaban' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(session).getByRole('button', { name: /わたし/ }));
    fireEvent.click(within(session).getByRole('button', { name: 'Periksa jawaban' }));
    expect(within(session).getByText('Tepat!')).toBeDefined();
    expect(within(session).getByText('Mnemonik visual')).toBeDefined();
    fireEvent.click(within(session).getByRole('button', { name: 'Lihat hasil' }));
    expect(view.getByText('1 dari 1 soal benar.')).toBeDefined();
    expect(localStorage.getItem('nichinichi-v1:local')).toBe(originalCache);
    fireEvent.click(view.getByRole('button', { name: 'Ubah checklist' }));
    expect((view.getByRole('checkbox', { name: 'Pilih 私 (わたし) untuk tes' }) as HTMLInputElement).checked).toBe(true);
  });

  it('preserves choices across lesson filters and selects or clears only the visible search results', () => {
    const view = open('/kanji?materi=lesson-05');
    fireEvent.click(view.getByRole('checkbox', { name: 'Pilih 私 (わたし) untuk tes' }));
    fireEvent.change(view.getByLabelText('Filter materi kanji'), { target: { value: 'lesson-15' } });
    fireEvent.change(view.getByLabelText('Cari kanji, bacaan, atau arti'), { target: { value: '学校' } });
    fireEvent.click(view.getByRole('button', { name: 'Pilih semua hasil (1)' }));
    expect(view.getByText('2 kata dipilih')).toBeDefined();
    fireEvent.click(view.getByRole('button', { name: 'Batalkan hasil ini' }));
    expect(view.getByText('1 kata dipilih')).toBeDefined();
    fireEvent.change(view.getByLabelText('Cari kanji, bacaan, atau arti'), { target: { value: '' } });
    fireEvent.change(view.getByLabelText('Filter materi kanji'), { target: { value: 'lesson-05' } });
    expect((view.getByRole('checkbox', { name: 'Pilih 私 (わたし) untuk tes' }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(view.getByRole('button', { name: 'Kosongkan pilihan' }));
    expect(view.getByText('0 kata dipilih')).toBeDefined();
  });

  it('grades wrong answers objectively and can immediately retest the missed word', () => {
    const view = open(`/kanji?kata=${encodeURIComponent(privateWord.id)}`);
    fireEvent.click(view.getByRole('radio', { name: 'Arti' }));
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (1)' }));
    const session = view.getByRole('region', { name: 'Sesi tes kanji' });
    const options = within(within(session).getByRole('group', { name: 'Pilihan jawaban' })).getAllByRole('button');
    fireEvent.click(options.find(option => !option.textContent?.endsWith('saya'))!);
    fireEvent.click(within(session).getByRole('button', { name: 'Periksa jawaban' }));
    expect(within(session).getByText('Belum tepat.')).toBeDefined();
    fireEvent.click(within(session).getByRole('button', { name: 'Lihat hasil' }));
    expect(view.getByText('0 dari 1 soal benar.')).toBeDefined();
    fireEvent.click(view.getByRole('button', { name: 'Tes ulang yang belum tepat (1 kata)' }));
    expect(within(session).getByText('Soal 1 dari 1')).toBeDefined();
    expect(within(session).queryByText('Mnemonik visual')).toBeNull();
  });

  it('keeps contextual readings and shows both character mnemonics when inspecting a compound', () => {
    const view = open('/materi/lesson-10');
    fireEvent.click(view.getAllByRole('button', { name: 'Lihat bacaan dan arti 何' })[0]);
    const dialog = view.getByRole('dialog');
    expect(within(dialog).getByText('なん', { selector: '.kanji-reading' })).toBeDefined();
    fireEvent.click(within(dialog).getByRole('link', { name: 'Pilih untuk tes' }));
    expect((view.getByRole('checkbox', { name: 'Pilih 何 (なん) untuk tes' }) as HTMLInputElement).checked).toBe(true);
    cleanup();
    const student = kanjiWords.find(w => w.word === '学生')!;
    const compound = open(`/kanji?kata=${encodeURIComponent(student.id)}&detail=1`);
    const detail = compound.getByRole('region', { name: 'Detail 学生' });
    expect(within(detail).getByRole('article', { name: 'Mnemonik 学' })).toBeDefined();
    expect(within(detail).getByRole('article', { name: 'Mnemonik 生' })).toBeDefined();
    fireEvent.click(compound.getByRole('radio', { name: 'Bacaan & arti' }));
    expect(compound.getByText('2 soal dalam tes ini')).toBeDefined();
  });

  it('keeps legacy kanji cards out of vocabulary review', () => {
    const progress = emptyProgress();
    progress.reviews[privateWord.id] = { step: -1, due: jakartaDate(), lastAt: Date.now() };
    localStorage.setItem('nichinichi-v1:local', JSON.stringify({ progress, pending: [], attempts: [] }));
    const view = open('/ulangi');
    expect(view.getByText('Belum ada kartu yang menunggu.')).toBeDefined();
    expect(view.queryByRole('button', { name: /Sesi berikutnya/ })).toBeNull();
  });

  it('times out a selected but unsubmitted answer and leaves the explanation untimed', () => {
    vi.useFakeTimers();
    const view = open(`/kanji?kata=${encodeURIComponent(privateWord.id)}`);
    fireEvent.click(view.getByRole('button', { name: '10 detik' }));
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (1)' }));
    const session = view.getByRole('region', { name: 'Sesi tes kanji' });
    fireEvent.click(within(session).getByRole('button', { name: /わたし/ }));
    act(() => vi.advanceTimersByTime(10000));
    expect(within(session).getByText('Waktu habis.')).toBeDefined();
    expect(within(session).queryByText('Tepat!')).toBeNull();
    expect(within(session).getByLabelText('0 detik tersisa, timer dihentikan')).toBeDefined();
    act(() => vi.advanceTimersByTime(60000));
    expect(within(session).getByText('Soal 1 dari 1')).toBeDefined();
    fireEvent.click(within(session).getByRole('button', { name: 'Lihat hasil' }));
    expect(view.getByText('0 dari 1 soal benar.')).toBeDefined();
    expect(view.getByText('Waktu habis. Jawabanmu: わたし')).toBeDefined();
    fireEvent.click(view.getByRole('button', { name: 'Tes ulang pilihan ini' }));
    expect(within(session).getByLabelText('10 detik tersisa')).toBeDefined();
    expect(within(session).queryByText('Waktu habis.')).toBeNull();
  });

  it('resets a custom timer for every question and stops after submitting early', () => {
    vi.useFakeTimers();
    const view = open('/kanji?materi=lesson-05');
    fireEvent.click(view.getByRole('checkbox', { name: 'Pilih 私 (わたし) untuk tes' }));
    fireEvent.click(view.getByRole('checkbox', { name: 'Pilih 学生 (がくせい) untuk tes' }));
    fireEvent.change(view.getByLabelText('Waktu khusus per soal'), { target: { value: '5' } });
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (2)' }));
    const session = view.getByRole('region', { name: 'Sesi tes kanji' });
    act(() => vi.advanceTimersByTime(2000));
    expect(within(session).getByLabelText('3 detik tersisa')).toBeDefined();
    const answer = session.querySelector('.question-japanese')!.textContent === '私' ? 'わたし' : 'がくせい';
    fireEvent.click(within(session).getByRole('button', { name: new RegExp(answer) }));
    fireEvent.click(within(session).getByRole('button', { name: 'Periksa jawaban' }));
    act(() => vi.advanceTimersByTime(30000));
    expect(within(session).getByText('Tepat!')).toBeDefined();
    expect(within(session).getByLabelText('3 detik tersisa, timer dihentikan')).toBeDefined();
    fireEvent.click(within(session).getByRole('button', { name: 'Soal berikutnya' }));
    expect(within(session).getByLabelText('5 detik tersisa')).toBeDefined();
    act(() => vi.advanceTimersByTime(5000));
    expect(within(session).getByText('Waktu habis.')).toBeDefined();
    fireEvent.click(within(session).getByRole('button', { name: 'Lihat hasil' }));
    expect(view.getByText('1 dari 2 soal benar.')).toBeDefined();
  });

  it('uses the deadline when the clock jumps and cleans up the countdown on exit', () => {
    vi.useFakeTimers();
    const view = open(`/kanji?kata=${encodeURIComponent(privateWord.id)}`);
    fireEvent.click(view.getByRole('button', { name: '10 detik' }));
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (1)' }));
    const session = view.getByRole('region', { name: 'Sesi tes kanji' });
    fireEvent.click(within(session).getByRole('button', { name: /わたし/ }));
    vi.setSystemTime(Date.now() + 11000);
    fireEvent.click(within(session).getByRole('button', { name: 'Periksa jawaban' }));
    expect(within(session).getByText('Waktu habis.')).toBeDefined();
    fireEvent.click(within(session).getByRole('button', { name: 'Kembali ke pilihan' }));
    act(() => vi.advanceTimersByTime(30000));
    expect(view.queryByText('Waktu habis.')).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (1)' }));
    expect(within(view.getByRole('region', { name: 'Sesi tes kanji' })).getByLabelText('10 detik tersisa')).toBeDefined();
  });

  it('allows unlimited answer time with the timer disabled', () => {
    vi.useFakeTimers();
    const view = open(`/kanji?kata=${encodeURIComponent(privateWord.id)}`);
    fireEvent.click(view.getByRole('button', { name: 'Mulai tes (1)' }));
    const session = view.getByRole('region', { name: 'Sesi tes kanji' });
    act(() => vi.advanceTimersByTime(600000));
    expect(within(session).queryByText('Waktu habis.')).toBeNull();
    fireEvent.click(within(session).getByRole('button', { name: /わたし/ }));
    fireEvent.click(within(session).getByRole('button', { name: 'Periksa jawaban' }));
    expect(within(session).getByText('Tepat!')).toBeDefined();
  });
});
