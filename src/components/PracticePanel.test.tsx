import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AIContext } from '../ai-context';
import type { AIStore } from '../ai-context';
import { LearningContext } from '../context';
import type { Store } from '../context';
import { emptyProgress } from '../lib/learning';
import { lessons } from '../data/curriculum';
import PracticePanel from './PracticePanel';
import type { PracticeSet } from '../lib/practice';

afterEach(() => { cleanup(); localStorage.clear(); });
beforeAll(() => { HTMLElement.prototype.scrollIntoView = vi.fn(); });
function ai(overrides: Partial<AIStore> = {}): AIStore {
  return { status: { connected: true, sharing: true, activeId: 'fixture', pending: false, authError: null, csrf: 'fixture', profiles: [] }, models: [{ slug: 'fixture-model', name: 'Fixture' }], loading: false, connecting: false, error: '', notice: '', loginUrl: '', refresh: vi.fn().mockResolvedValue(undefined), connect: vi.fn(), select: vi.fn(), disconnect: vi.fn(), acknowledge: vi.fn(), post: vi.fn(), ...overrides };
}
const learning: Store = { progress: emptyProgress(), attempts: [], send: vi.fn(), setSettings: vi.fn(), retry: vi.fn(), sync: 'local', error: '', user: null, authLoading: false, ready: true, logout: vi.fn() };
function set(id = 'first'): PracticeSet {
  return { id, lessonId: 'lesson-05', level: 'basic', createdAt: 1000, questions: Array.from({ length: 5 }, (_, i) => ({ id: `${id}-${i}`, type: 'choice' as const, prompt: `Arti kalimat ${i + 1}?`, japanese: `${['わたし', 'あなた', 'せんせい', 'がくせい', 'りな'][i]}です。`, options: ['A', 'B', 'C', 'D'], answer: 'A', explanation: 'A adalah jawaban tepat.', hint: 'Perhatikan pola identitas.', focus: 'Identitas' })) };
}
function Panel({ value, lesson = lessons[4] }: { value: AIStore; lesson?: typeof lessons[number] }) {
  return <MemoryRouter><LearningContext.Provider value={learning}><AIContext.Provider value={value}><PracticePanel key={`${value.status?.activeId}:${lesson.id}`} lesson={lesson}/></AIContext.Provider></LearningContext.Provider></MemoryRouter>;
}
describe('dynamic topic practice', () => {
  it('shows learned kanji for saved kana order tiles without furigana and still grades correctly', () => {
    const saved = set();
    saved.questions[0] = { id: 'teacher', type: 'order', prompt: 'Susun: Saya guru.', tokens: ['わたし', 'は', 'せんせい', 'です'], answer: ['わたし', 'は', 'せんせい', 'です'], explanation: 'Pola perkenalan.', hint: 'Mulai dari saya.', focus: 'Identitas' };
    localStorage.setItem('nn-practice-v1:fixture:lesson-05', JSON.stringify({ ...saved, answers: [] }));
    const view = render(<Panel value={ai()}/>);
    for (const word of ['私', 'は', '先生', 'です']) fireEvent.click(view.getByRole('button', { name: word }));
    expect(view.container.querySelector('rt')).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'Periksa jawaban' }));
    expect(view.getByText('Tepat sekali.')).toBeDefined();
    expect(view.container.textContent).toContain('Jawaban: 私は先生です.');
    expect(view.container.textContent).not.toContain('わたし');
    expect(view.container.querySelector('rt')).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'Soal berikutnya' }));
    expect(JSON.parse(localStorage.getItem('nn-practice-v1:fixture:lesson-05')!).answers[0].correct).toBe(true);
  });
  it('requires a connection and routes setup to settings instead of displaying a chat composer', () => {
    const value = ai({ status: null, models: [] }); const view = render(<Panel value={value}/>);
    expect((view.getByRole('button', { name: 'Buat latihan' }) as HTMLButtonElement).disabled).toBe(true);
    expect(view.queryByRole('textbox')).toBeNull(); expect(view.getByRole('link', { name: 'Pengaturan AI' }).getAttribute('href')).toBe('/pengaturan');
  });
  it('generates, reveals a hint, completes five questions and requests genuinely new exercises with recent history', async () => {
    const post = vi.fn().mockResolvedValueOnce(Response.json(set())).mockResolvedValueOnce(Response.json(set('second')));
    const view = render(<Panel value={ai({ post })}/>);
    fireEvent.click(view.getByRole('button', { name: 'Buat latihan' }));
    await waitFor(() => expect(view.getByText('Soal 1 dari 5')).toBeDefined());
    expect(post.mock.calls[0][1]).toMatchObject({ lessonId: 'lesson-05', count: 5, level: 'basic', seen: [] });
    fireEvent.click(view.getByRole('button', { name: 'Beri petunjuk' })); expect(view.getByText('Perhatikan pola identitas.')).toBeDefined();
    for (let i = 0; i < 5; i++) {
      fireEvent.click(view.getByRole('button', { name: /^[ABCD] A$/ }));
      fireEvent.click(view.getByRole('button', { name: 'Periksa jawaban' }));
      expect(view.getByText(/Jawaban: A/)).toBeDefined();
      fireEvent.click(view.getByRole('button', { name: i === 4 ? 'Lihat hasil' : 'Soal berikutnya' }));
    }
    await waitFor(() => expect(view.getByText('5 dari 5')).toBeDefined());
    expect(learning.send).not.toHaveBeenCalled();
    fireEvent.click(view.getAllByRole('button', { name: 'Buat set baru' })[0]);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[1][1].seen).toHaveLength(5);
    await waitFor(() => expect(view.getByText('Soal 1 dari 5')).toBeDefined());
  });
  it('restores recorded answers after refresh and preserves the set if generation reaches quota', async () => {
    const first = set(); const q = first.questions[0];
    localStorage.setItem('nn-practice-v1:fixture:lesson-05', JSON.stringify({ ...first, answers: [{ questionId: q.id, correct: false, response: 'B', prompt: q.prompt, explanation: q.explanation }] }));
    const view = render(<Panel value={ai({ post: vi.fn().mockResolvedValue(Response.json({ error: 'Batas penggunaan tercapai.', code: 'usage_limit' }, { status: 429 })) })}/>);
    expect(view.getByText('Soal 2 dari 5')).toBeDefined();
    fireEvent.click(view.getByRole('button', { name: 'Buat set baru' }));
    await waitFor(() => expect(view.getByRole('alert').textContent).toContain('Batas penggunaan'));
    expect(view.getByText('Soal 2 dari 5')).toBeDefined(); expect(view.getByRole('link', { name: 'Manage usage' })).toBeDefined();
  });
  it('account changes abort generation and never render a late answer belonging to the old account', async () => {
    let resolve!: (response: Response) => void;
    const post = vi.fn().mockImplementation(() => new Promise<Response>(done => { resolve = done; }));
    const first = ai({ post }); const view = render(<Panel value={first}/>);
    fireEvent.click(view.getByRole('button', { name: 'Buat latihan' }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    view.rerender(<Panel value={ai({ post, status: { ...first.status!, activeId: 'second-account' } })}/>);
    resolve(Response.json(set()));
    await waitFor(() => expect(post.mock.calls[0][2].aborted).toBe(true));
    expect(view.queryByText('Soal 1 dari 5')).toBeNull();
    expect(localStorage.getItem('nn-practice-v1:second-account:lesson-05')).toBeNull();
  });
  it('sends application level, ten questions and the preferred model', async () => {
    const post = vi.fn().mockResolvedValue(Response.json({ error: 'Fixture unavailable' }, { status: 502 }));
    const view = render(<Panel value={ai({ post, preferredModel: 'other', models: [{ slug: 'fixture-model', name: 'Fixture' }, { slug: 'other', name: 'Other' }] })}/>);
    fireEvent.change(view.getByRole('combobox', { name: 'Tingkat latihan' }), { target: { value: 'apply' } });
    fireEvent.change(view.getByRole('combobox', { name: 'Jumlah soal' }), { target: { value: '10' } });
    fireEvent.click(view.getByRole('button', { name: 'Buat latihan' }));
    await waitFor(() => expect(post.mock.calls[0][1]).toMatchObject({ count: 10, level: 'apply', model: 'other' }));
  });
});
